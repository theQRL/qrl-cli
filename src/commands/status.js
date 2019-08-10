/* eslint new-cap: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white, black} = require('kleur')
const ora = require('ora')
const grpc = require('grpc')
const {createClient} = require('grpc-kit')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const moment = require('moment')
const {QRLPROTO_SHA256} = require('../get-qrl-proto-shasum')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const shorPerQuanta = 10 ** 9

const clientGetNodeInfo = client => {
  return new Promise((resolve, reject) => {
    client.getNodeInfo({}, (error, response) => {
      if (error) {
        reject(error)
      }
      resolve(response)
    })
  })
}

let qrlClient = null

async function checkProtoHash(file) {
  return readFile(file).then(async contents => {
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents)
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(CryptoJS.enc.Hex)
    let verified = false
    QRLPROTO_SHA256.forEach(value => {
      if (value.protoSha256 === calculatedProtoHash) {
        verified = true
      }
    })
    return verified
  }).catch(error => {
    throw new Error(error)
  })
}

async function loadGrpcBaseProto(grpcEndpoint) {
  return protoLoader.load(PROTO_PATH, {}).then(async packageDefinition => {
    const packageObject = grpc.loadPackageDefinition(packageDefinition)
    const client = await new packageObject.qrl.Base(grpcEndpoint, grpc.credentials.createInsecure())
    const res = await clientGetNodeInfo(client)
    const qrlProtoFilePath = tmp.fileSync({mode: '0644', prefix: 'qrl-', postfix: '.proto'}).name
    await writeFile(qrlProtoFilePath, res.grpcProto).then(fsErr => {
      if (fsErr) {
        throw new Error('tmp filesystem error')
      }
    })
    return qrlProtoFilePath
  })
}

async function loadGrpcProto(protofile, endpoint) {
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
  const packageDefinition = await protoLoader.load(protofile, options)
  const grpcObject = await grpc.loadPackageDefinition(packageDefinition)
  const grpcObjectString = JSON.stringify(util.inspect(grpcObject.qrl, {showHidden: true, depth: 4}))
  const protoObjectWordArray = CryptoJS.lib.WordArray.create(grpcObjectString)
  const calculatedObjectHash = CryptoJS.SHA256(protoObjectWordArray).toString(CryptoJS.enc.Hex)
  let verified = false
  QRLPROTO_SHA256.forEach(value => {
    if (value.objectSha256 === calculatedObjectHash) {
      verified = true
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
  if (verified) {
    qrlClient = createClient({
      protoPath: protofile,
      packageName: 'qrl',
      serviceName: 'PublicAPI',
      options: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    }, endpoint)
  } else {
    throw new Error('Unable to verify proto file')
  }
}

class Status extends Command {
  async run() {
    const {flags} = this.parse(Status)
    let grpcEndpoint = 'testnet-4.automated.theqrl.org:19009'
    let network = 'Testnet'
    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = 'testnet-4.automated.theqrl.org:19009'
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = 'mainnet-4.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Fetching status from node...'}).start()
    const proto = await loadGrpcBaseProto(grpcEndpoint)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }
      // next load GRPC object and check hash of that too
      await loadGrpcProto(proto, grpcEndpoint)
      const request = {}
      await qrlClient.GetStats(request, async (error, response) => {
        if (error) {
          this.log(`${red('⨉')} Unable to read status`)
        }
        spinner.succeed('Network status:')
        this.log(`    ${black().bgWhite('Network id')} ${response.node_info.network_id}`)
        this.log(`    ${black().bgWhite('Network uptime')} ${Math.floor(moment.duration(parseInt(response.uptime_network, 10), 'seconds').asDays())} days`)
        this.log(`    ${black().bgWhite('Epoch')} ${response.epoch}`)
        this.log(`    ${black().bgWhite('Coins emitted')} ${response.coins_emitted / shorPerQuanta}`)
        this.log(`    ${black().bgWhite('Total coin supply')} ${response.coins_total_supply}`)
        this.log(`    ${black().bgWhite('Last block reward')} ${response.block_last_reward / shorPerQuanta}`)
        const spinnerNode = ora().start()
        spinnerNode.succeed('Node status:')
        this.log(`    ${black().bgWhite('Version')} ${response.node_info.version}`)
        this.log(`    ${black().bgWhite('State')} ${response.node_info.state}`)
        this.log(`    ${black().bgWhite('Connections')} ${response.node_info.num_connections}`)
        this.log(`    ${black().bgWhite('Known peers')} ${response.node_info.num_known_peers}`)
        this.log(`    ${black().bgWhite('Node uptime')} ${Math.floor(moment.duration(parseInt(response.node_info.uptime, 10), 'seconds').asDays())} days`)
        this.log(`    ${black().bgWhite('Block height')} ${response.node_info.block_height}`)
      })
    })
  }
}

Status.description = `Gets the network status
...
TODO
`

// Status.args = [
//   {
//     name: 'address',
//     description: 'address to return OTS state for',
//     required: true,
//   },
// ]

Status.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {Status}
