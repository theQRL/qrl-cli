/* global KYBLIB */
/* global DILLIB */
/* global QRLLIB */
/* eslint-disable max-nested-callbacks */
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
var aesjs = require('aes-js')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
// eslint-disable-next-line no-unused-vars
const {QRLLIBmodule} = require('qrllib/build/offline-libjsqrl')
// eslint-disable-next-line no-unused-vars
const {DILLIBmodule} = require('qrllib/build/offline-libjsdilithium')
// eslint-disable-next-line no-unused-vars
const {KYBLIBmodule} = require('qrllib/build/offline-libjskyber')
let KYBLIBLoaded = false
let DILLIBLoaded = false
let QRLLIBLoaded = false

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

// open local EMS file containing the private keys
const openEmsSkFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
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

async function getEmsKeys(txhash) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async resolve => {
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
        let senderDilithiumPK = response.tx.latticePK.pk2
        resolve([senderDilithiumPK])
      }
    )
  })
}

class ReceiveInitialMessage extends Command {
  async run() {
    const {args, flags} = this.parse(ReceiveInitialMessage)
    const txhash = flags.txhash


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
    

    let isFile = false
    let latticeTxHash
    let receiverKyberSK
    let receiverECDSASK
    const path = args.file
    try {
      if (fs.existsSync(path)) {
        isFile = true
      }
    } catch (error) {
      this.log(`${red('⨉')} Unable to get private keys: invalid EMS file`)
      this.exit(1)
    }
    if (isFile === false) {
      this.log(`${red('⨉')} Unable to get private keys: invalid EMS file`)
      this.exit(1)
    } else {
      const walletJson = openEmsSkFile(path)
      try {
        if (walletJson.encrypted === false) {
          latticeTxHash = walletJson.txHash
          receiverKyberSK = walletJson.kyberSK
          receiverECDSASK = walletJson.ecdsaSK
        }
        if (walletJson.encrypted === true) {
          let password = ''
          if (flags.password) {
            password = flags.password
          } else {
            password = await cli.prompt('Enter password for wallet file', {type: 'hide'})
          }
          latticeTxHash = aes256.decrypt(password, walletJson.txhash)
          receiverKyberSK = aes256.decrypt(password, walletJson.kyberSK)
          receiverECDSASK = aes256.decrypt(password, walletJson.ecdsaSK)
        }
      } catch (error) {
        this.exit(1)
      }
    }

    this.log(white().bgBlue(network))
    const spinner = ora({
      text: 'Fetching Ephemeral keys from API...\n',
    }).start()

    const waitForKYBLIB = callBack => {
      setTimeout(() => {
        // Test the KYBLIB object has the getString function.
        // This is sufficient to tell us KYBLIB has loaded.
        if (typeof KYBLIB.getString === 'function' && KYBLIBLoaded === true) {
          callBack()
        } else {
          KYBLIBLoaded = true
          return waitForKYBLIB(callBack)
        }
        return false
      }, 50)
    }

    const waitForDILLIB = callBack => {
      setTimeout(() => {
        // Test the DILLIB object has the getString function.
        // This is sufficient to tell us DILLIB has loaded.
        if (typeof DILLIB.getString === 'function' && DILLIBLoaded === true) {
          callBack()
        } else {
          DILLIBLoaded = true
          return waitForDILLIB(callBack)
        }
        return false
      }, 50)
    }

    const waitForQRLLIB = callBack => {
      setTimeout(() => {
        // Test the QRLLIB object has the str2bin function.
        // This is sufficient to tell us QRLLIB has loaded.
        if (typeof QRLLIB.str2bin === 'function' && QRLLIBLoaded === true) {
          callBack()
        } else {
          QRLLIBLoaded = true
          return waitForQRLLIB(callBack)
        }
        return false
      }, 50)
    }

    waitForKYBLIB(async _ => {
      waitForDILLIB(async _ => {
        // get signedMessage and encryptedCypherText
        const encCypherTextJson = openEphemeralFile('encCypherText.txt')
        const signedMsgJson = openEphemeralFile('signedMessage.txt')

        let signedMsg
        let encCypherText
        try {
          encCypherText = encCypherTextJson
          signedMsg = signedMsgJson
        } catch (error) {
          this.exit(1)
        }

        const proto = await loadGrpcBaseProto(grpcEndpoint)
        checkProtoHash(proto).then(async protoHash => {
          if (!protoHash) {
            this.log(`${red('⨉')} Unable to validate .proto file from node`)
            this.exit(1)
          }
          await loadGrpcProto(proto, grpcEndpoint)

          // Obtain the sender's Kyber PKs from lattice transaction
          const emsKeys = await getEmsKeys(txhash)

          if (!emsKeys) {
            spinner.fail('The recipient has more than one lattice transaction\nRe-run the command with the -t option by specifying a tx hash')
          }
          // recipient's PKs
          let senderDilithiumPK = emsKeys[0]
          // 1 - Alice verify p signature
          let verifySignedMsg = DILLIB.Dilithium.sign_open('', signedMsg, senderDilithiumPK.toString('hex'))

          // if signature verified
          // 2 - Alice exracts the message: encrypted seed *p*
          let msgOutput = DILLIB.Dilithium.extract_message(verifySignedMsg)
          let msgFinal = msgOutput.substr(0, 64)

          // get receiver's Kyber PK and SK
          const getTransactionReq = {
            // eslint-disable-next-line camelcase
            tx_hash: Buffer.from(latticeTxHash, 'hex'),
          }

          await qrlClient.GetTransaction(
            getTransactionReq,
            async (error, response) => {
              let receiverKyberPK = response.tx.latticePK.pk1.toString('hex')
              const KYBOBJECT_RECEIVER = await new KYBLIB.Kyber.fromKeys(receiverKyberPK, receiverKyberSK)

              // 3 - Alice decrypts encCypherText to get cyphertext
              const encCypherTextBuffer =  {
                iv: Buffer.from(encCypherText.iv),
                ephemPublicKey: Buffer.from(encCypherText.ephemPublicKey),
                ciphertext: Buffer.from(encCypherText.ciphertext),
                mac: Buffer.from(encCypherText.mac),
              }

              eccrypto.decrypt(Buffer.from(receiverECDSASK.toString(), 'hex'), encCypherTextBuffer).then(function (decCypherText) {
                // 4 - Alice kem_decode with cyphertext to obtain shared key
                KYBOBJECT_RECEIVER.kem_decode(decCypherText.toString())
                const sharedKey = KYBOBJECT_RECEIVER.getMyKey()
                // 5 - Decrypt encrypted p to get the seed s
                let mykeyAlice = Uint8Array.from(Buffer.from(sharedKey.toString(), 'hex'))
                var aesCtr = new aesjs.ModeOfOperation.ctr(mykeyAlice)
                var encryptedBytes = aesjs.utils.hex.toBytes(msgFinal)
                var sDecrypted = aesCtr.decrypt(encryptedBytes)

                // 6 - Alice now have access to the seed s and the shared key key_alice

                // For debugging purpose
                // console.log('FROM ALICE')
                // console.log('Decrypted shared seed')
                // console.log(Buffer.from(sDecrypted))
                // console.log("Shared secret")
                // console.log(sharedKey)
                // console.log("---------------------")

                // 7 - Generate the next 1000 keys with Shake
                waitForQRLLIB(async _ => {
                  const sBin = QRLLIB.hstr2bin(Buffer.from(Buffer.from(sDecrypted).toString('hex')))
                  let keyList = QRLLIB.shake128(64000, sBin)
                  fs.writeFileSync('keyListReceiver.txt', QRLLIB.bin2hstr(keyList))
                  spinner.succeed('DONE')
                })
              })
            }
          )
        })
      })
    })
  }
}

ReceiveInitialMessage.description = `Recieve initial message for channel opening
Generates keylist from details provided
`

ReceiveInitialMessage.args = [
  {
    name: 'file',
    description: 'Local EMS file containing private keys',
    required: true,
  },
]

ReceiveInitialMessage.flags = {
  txhash: flags.string({char: 'h', default: false, description: 'tx hash of lattice transaction'}),
  string: flags.string({char: 's', default: false, description: 'message to encrypt'}),
  devnet: flags.boolean({char: 'd', default: false, description: 'Uses the devnet network'}),
  testnet: flags.boolean({char: 't', default: false, description: 'Uses the testnet network'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'Uses the mainnet network'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments).'}),
  password: flags.string({char: 'p', required: false, description: 'EMS file password'}),
}

module.exports = {ReceiveInitialMessage}
