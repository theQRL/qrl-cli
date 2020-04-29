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
var eccrypto = require('eccrypto')

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

class Encrypt extends Command {
  async run() {
    const {args, flags} = this.parse(Encrypt)

    // let address = args.address
    // let itemPerPage = args.item_per_page
    // let pageNumber = args.page_number
    // let message = args.message
    // let txhash = args.txhash
    const txhash = flags.txhash
    const string = flags.string

    // set the network to use. Default to testnet
    let grpcEndpoint = 'testnet-4.automated.theqrl.org:19009'
    let network = 'Testnet'
    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.devnet) {
      grpcEndpoint = flags.devnet
      network='devnet-1.automated.theqrl.org:19009'
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
    const spinner = ora({
      text: 'Fetching Ephemeral keys from API...\n',
    }).start()

    const proto = await loadGrpcBaseProto(grpcEndpoint)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }

      // spinner.succeed(txhash)
      // let address = args.address
      // eslint-disable-next-line no-negated-condition
      if (!txhash) {
        let itemPerPage = args.item_per_page
        let pageNumber = args.page_number
        let message = args.message
        let address = args.address
        // next load GRPC object and check hash of that too
        await loadGrpcProto(proto, grpcEndpoint)
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
            // get ECDSA pk
            let pk = response.lattice_pks_detail[0].pk3
            let pkB = Buffer.from(pk.toString(), 'hex')

            eccrypto.encrypt(pkB, Buffer.from(message)).then(function (encrypted) {
              // console.log( JSON.stringify(encrypted)  )
              const encJson = ['[', JSON.stringify(encrypted), ']'].join('')
              fs.writeFileSync('encrypted.txt', encJson)
              spinner.succeed('DONE')
            })
          }
        )
      } else {
        await loadGrpcProto(proto, grpcEndpoint)
        const getTransactionReq = {
          // eslint-disable-next-line camelcase
          tx_hash: Buffer.from(txhash, 'hex'),
        }

        await qrlClient.GetTransaction(
          getTransactionReq,
          async (error, response) => {
            if (error) {
              this.log(`${red('⨉')} Unable to get Lattice transaction list`)
            }
            // get ECDSA pk

            // console.log(response)
            // spinner.succeed(response.confirmations)
            let pk = response.tx.latticePK.pk3
            let pkB = Buffer.from(pk.toString(), 'hex')
            eccrypto.encrypt(pkB, Buffer.from(string)).then(function (encrypted) {
              // console.log( JSON.stringify(encrypted)  )
              const encJson = ['[', JSON.stringify(encrypted), ']'].join('')
              fs.writeFileSync('encrypted.txt', encJson)
              spinner.succeed('DONE')
            })
          }
        )
      }
    })
  }
}

Encrypt.description = `Encrypt message using recipient public keys

Curently hardcoded to output a file named 'encrypted.txt' which must be sent to the recipient
`

Encrypt.args = [
  {
    name: 'address',
    description: 'QRL wallet address to send message to',
    required: false,
  },
  {
    name: 'item_per_page',
    description: 'number of items to show per page',
    required: false,
  },
  {
    name: 'page_number',
    description: 'page number to retrieve',
    required: false,
  },
  {
    name: 'message',
    description: 'message to encrypt',
    required: false,
  },
]

Encrypt.flags = {
  txhash: flags.string({char: 'h', default: false, description: 'tx hash of lattice transaction'}),
  string: flags.string({char: 's', default: false, description: 'message to encrypt'}),
  devnet: flags.boolean({char: 'd', default: false, description: 'Queries the devnet network for the recipient public key to encrypt the message with'}),
  testnet: flags.boolean({char: 't', default: false, description: 'Queries the testnet network for the recipient public key to encrypt the message with'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'Queries the mainnet network for the recipient public key to encrypt the message with'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments). Queries the grpc edpoint given for the recipient public key to encrypt the message with'}),
}

module.exports = {Encrypt}
