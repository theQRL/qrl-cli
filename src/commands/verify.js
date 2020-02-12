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
const {QRLPROTO_SHA256} = require('../functions/get-qrl-proto-shasum')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`
var eccrypto = require('eccrypto')
var crypto = require('crypto')

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

const openEphemeralFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

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

class Verify extends Command {
  async run() {
    const {args} = this.parse(Verify)

    let address = args.address
    let itemPerPage = args.item_per_page
    let pageNumber = args.page_number

    let isFile = false
    let isValidFile = false
    let encryptedSig
    const path = 'signature.txt'
    try {
      if (fs.existsSync(path)) {
        isFile = true
      }
    } catch (error) {
      this.log(`${red('⨉')} Unable to get signature: invalid signature file`)
      this.exit(1)
    }
    if (isFile === false) {
      this.log(`${red('⨉')} Unable to get signature: invalid signature file`)
      this.exit(1)
    } else {
      const sigJson = openEphemeralFile(path)
      try {
        isValidFile = true
        encryptedSig = sigJson
      } catch (error) {
        this.exit(1)
      }
    }
    if (isValidFile === false) {
      this.log(`${red('⨉')} Unable to get signature: invalid signature file`)
      this.exit(1)
    }

    let grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
    let network = 'Devnet'

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
          // spinner.succeed(`RESPONSE: ${JSON.stringify(response.lattice_pks_detail[0].pk3)}`)

          // this.log(response.lattice_pks_detail[0].pk3)
          let pk = response.lattice_pks_detail[0].pk3
          let pkB = Buffer.from(pk.toString(), 'hex')

          var str = 'QRLforever'
          // Always hash you message to sign!
          var msg = crypto.createHash('sha256').update(str).digest()
          const sig = Buffer.from(encryptedSig)
          eccrypto.verify(pkB, msg, sig).then(function () {
            spinner.succeed('VERIFICATION OK')
          }).catch(function () {
            // console.log("Signature is BAD");
            spinner.succeed('ERROR VERIFICATION')
          })
        }
      )
    })
  }
}

Verify.description = `Encrypt message using recipient public keys
`

Verify.args = [
  {
    name: 'address',
    description: 'QRL wallet address to send message to',
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

Verify.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {Verify}
