/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const grpc = require('@grpc/grpc-js')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
const {QRLPROTO_SHA256} = require('@theqrl/qrl-proto-sha256')
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

class Sign extends Command {
  async run() {
    const {flags} = this.parse(Sign)

    // Retrieving the hexseed from wallet file
    let isFile = false
    let isValidFile = false
    let ecdsaSK
    const path = flags.file
    try {
      if (fs.existsSync(path)) {
        isFile = true
      }
    } catch (error) {
      this.log(`${red('⨉')} Unable to get secret key: invalid ephemeral file`)
      this.exit(1)
    }
    if (isFile === false) {
      this.log(`${red('⨉')} Unable to get secret key: invalid ephemeral file`)
      this.exit(1)
    } else {
      const walletJson = openEphemeralFile(path)
      try {
        if (walletJson.encrypted === false) {
          isValidFile = true
          ecdsaSK = walletJson.ecdsaSK
        }
        if (walletJson.encrypted === true) {
          let password = ''
          if (flags.password) {
            password = flags.password
          } else {
            password = await cli.prompt('Enter password for ephemeral file', {type: 'hide'})
          }
          ecdsaSK = aes256.decrypt(password, walletJson.ecdsaSK)
          isValidFile = true
        }
      } catch (error) {
        this.exit(1)
      }
    }
    if (isValidFile === false) {
      this.log(`${red('⨉')} Unable to get secret key: invalid ephemeral file`)
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

      var msg = crypto.createHash('sha256').update(flags.message).digest()

      eccrypto.sign(Buffer.from(ecdsaSK.toString(), 'hex'), msg).then(function (sig) {
        // console.log("Signature in DER format:", sig);
        const sigJson = ['[', JSON.stringify(sig), ']'].join('')
        fs.writeFileSync('signature.txt', sigJson)
        spinner.succeed('DONE')
      })
    })
  }
}

Sign.description = `Sign message using saved private keys
`

Sign.flags = {
  file: flags.string({char: 'f', required: true, description: 'ephemeral file containing the private keys to use'}),
  password: flags.string({char: 'p', required: false, description: 'ephemeral file password'}),
  message: flags.string({char: 's', required: true, description: 'message to sign'}),
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {Sign}
