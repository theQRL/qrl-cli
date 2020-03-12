/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const grpc = require('grpc')
const {createClient} = require('grpc-kit')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const {QRLPROTO_SHA256} = require('../get-qrl-proto-shasum')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

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
  return readFile(file)
  .then(async contents => {
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents)
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(
      CryptoJS.enc.Hex
    )
    // console.log(calculatedProtoHash)
    let verified = false
    QRLPROTO_SHA256.forEach(value => {
      if (value.protoSha256 === calculatedProtoHash) {
        verified = true
      }
    })
    return verified
  })
  .catch(error => {
    throw new Error(error)
  })
}

async function loadGrpcBaseProto(grpcEndpoint) {
  return protoLoader.load(PROTO_PATH, {}).then(async packageDefinition => {
    const packageObject = grpc.loadPackageDefinition(packageDefinition)
    const client = await new packageObject.qrl.Base(
      grpcEndpoint,
      grpc.credentials.createInsecure()
    )
    const res = await clientGetNodeInfo(client)
    const qrlProtoFilePath = tmp.fileSync({
      mode: '0644',
      prefix: 'qrl-',
      postfix: '.proto',
    }).name
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
  const grpcObjectString = JSON.stringify(
    util.inspect(grpcObject.qrl, {showHidden: true, depth: 4})
  )
  const protoObjectWordArray = CryptoJS.lib.WordArray.create(grpcObjectString)
  const calculatedObjectHash = CryptoJS.SHA256(protoObjectWordArray).toString(
    CryptoJS.enc.Hex
  )

  let verified = false
  QRLPROTO_SHA256.forEach(value => {
    // console.log(calculatedObjectHash)
    if (value.objectSha256 === calculatedObjectHash) {
      verified = true
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
  if (verified) {
    qrlClient = createClient(
      {
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
      },
      endpoint
    )
  } else {
    throw new Error('Unable to verify proto file')
  }
}

class EphemeralKeys extends Command {
  async run() {
    const {args} = this.parse(EphemeralKeys)

    let address = args.address
    let itemPerPage = args.item_per_page
    let pageNumber = args.page_number
    let grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
    let network = 'Devnet'

    this.log(white().bgBlue(network))
    const spinner = ora({
      text: 'Fetching Ephemeral keys from API...\n',
    }).start()

    const proto = await loadGrpcBaseProto(grpcEndpoint)
    spinner.succeed(proto)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }
      // next load GRPC object and check hash of that too
      await loadGrpcProto(proto, grpcEndpoint)
      // const getAddressStateReq = {
      //   address: Buffer.from(address.substring(1), 'hex'),
      //   // eslint-disable-next-line camelcase
      //   exclude_ots_bitfield: true,
      //   // eslint-disable-next-line camelcase
      //   exclude_transaction_hashes: true,
      // }

      // await qrlClient.GetAddressState(
      //   getAddressStateReq,
      //   async (error, response) => {
      //     if (error) {
      //       this.log(`${red('⨉')} Unable to get Lattice transaction list`)
      //     }
      //     // let pk3st = Buffer.from( response.lattice_pks_detail[0].pk3, 'hex' )
      //     spinner.succeed(`RESPONSE: ${ response.state.lattice_pk_count }`)
      //     spinner.succeed('DONE')
      //   }
      // )

      const getTransactionsByAddressReq = {
        address: Buffer.from(address.substring(1), 'hex'),
        // eslint-disable-next-line camelcase
        item_per_page: itemPerPage,
        // eslint-disable-next-line camelcase
        page_number: pageNumber,
      }
      await qrlClient.GetLatticePKsByAddress(
        getTransactionsByAddressReq,
        async (error, response) => {
          if (error) {
            this.log(`${red('⨉')} Unable to get Lattice transaction list`)
          }
          // let pk3st = Buffer.from( response.lattice_pks_detail[0].pk2, 'hex' )
          spinner.succeed(`RESPONSE: ${response.lattice_pks_detail}`)
          spinner.succeed('DONE')
        }
      )
    })
  }
}

EphemeralKeys.description = `Get Ephemeral keys associated to a QRL address
`

EphemeralKeys.args = [
  {
    name: 'address',
    description: 'address to return OTS state for',
    required: true,
  },
  {
    name: 'item_per_page',
    description: 'number of items to show per page',
    required: true,
  },
  {
    name: 'page_number',
    description: 'page number to retrieve',
    required: true,
  },
]

EphemeralKeys.flags = {
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet for the OTS state',
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'queries mainnet for the OTS state',
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description:
      'advanced: grcp endpoint (for devnet/custom QRL network deployments)',
  }),
  password: flags.string({
    char: 'p',
    required: false,
    description: 'wallet file password',
  }),
}

module.exports = {EphemeralKeys}
