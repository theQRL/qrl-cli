/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const grpc = require('grpc')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
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

class Decrypt extends Command {
  async run() {
    // const {args} = this.parse(Decrypt)

    // Retrieving ecdsaSK from wallet file
    let isFile = false
    let isValidFile = false
    let ecdsaSK
    let encryptedMsg
    const path = 'ephemeral.json'
    const encPath = 'encrypted.txt'
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
      const encJson = openEphemeralFile(encPath)
      try {
        if (walletJson.encrypted === false) {
          isValidFile = true
          ecdsaSK = walletJson.ecdsaSK
          encryptedMsg = encJson
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

      const msg =  {
        iv: Buffer.from(encryptedMsg.iv),
        ephemPublicKey: Buffer.from(encryptedMsg.ephemPublicKey),
        ciphertext: Buffer.from(encryptedMsg.ciphertext),
        mac: Buffer.from(encryptedMsg.mac),
      }

      eccrypto.decrypt(Buffer.from(ecdsaSK.toString(), 'hex'), msg).then(function (plaintext) {
        spinner.succeed(plaintext.toString())
      })
    })
  }
}

Decrypt.description = `Decrypt message using senders public keys. 

Curently this is hardcoded to decrypt a file named 'encrypted.txt' which must be in the same directory`

Decrypt.flags = {
  devnet: flags.boolean({char: 'd', default: false, description: 'Queries the devnet network for the senders public key to decrypt the message with'}),
  testnet: flags.boolean({char: 't', default: false, description: 'Queries the testnet network for the senders public key to decrypt the message with'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'Queries the mainnet network for the senders public key to decrypt the message with'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments). Queries the grpc edpoint given for the senders public key to decrypt the message with'}),
}

module.exports = {Decrypt}
