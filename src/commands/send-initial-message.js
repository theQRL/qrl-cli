/* eslint-disable */
/* global KYBLIB */
/* global DILLIB */
/* global QRLLIB */
/* eslint-disable max-nested-callbacks */
/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const grpc = require('@grpc/grpc-js')
const {createClient} = require('grpc-js-kit')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const {QRLPROTO_SHA256} = require('@theqrl/qrl-proto-sha256')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`
const Crypto = require('crypto')
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
        let recipientKyberPK = response.tx.latticePK.pk1
        let recipientECDSAPK = response.tx.latticePK.pk3
        resolve([recipientECDSAPK, recipientKyberPK])
      }
    )
  })
}

class SendInitialMessage extends Command {
  async run() {
    const {args, flags} = this.parse(SendInitialMessage)
    const txhash = flags.txhash
    // const address = args.address
    let grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
    let network = 'Devnet'
    let isFile = false
    let latticeTxHash
    let senderKyberSK
    let senderDilithiumSK
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
          senderKyberSK = walletJson.kyberSK
          senderDilithiumSK = walletJson.dilithiumSK
        }
        if (walletJson.encrypted === true) {
          let password = ''
          if (flags.password) {
            password = flags.password
          } else {
            password = await cli.prompt('Enter password for wallet file', {type: 'hide'})
          }
          latticeTxHash = aes256.decrypt(password, walletJson.txhash)
          senderKyberSK = aes256.decrypt(password, walletJson.kyberSK)
          senderDilithiumSK = aes256.decrypt(password, walletJson.dilithiumSK)
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
        const proto = await loadGrpcBaseProto(grpcEndpoint)
        checkProtoHash(proto).then(async protoHash => {
          if (!protoHash) {
            this.log(`${red('⨉')} Unable to validate .proto file from node`)
            this.exit(1)
          }
          await loadGrpcProto(proto, grpcEndpoint)

          // 1 - Obtain the recipient ECDSA and Kyber PKs from lattice transaction
          const emsKeys = await getEmsKeys(txhash)

          if (!emsKeys) {
            spinner.fail('The recipient has more than one lattice transaction\nRe-run the command with the -t option by specifying a tx hash')
          }
          // recipient's PKs
          let recipientECDSAPK = emsKeys[0]
          let recipientKyberPK = emsKeys[1]

          let senderKyberPK
          let senderDilithiumPK
          // 2 - Get sender KyberPK from associated lattice transaction in the local private key files
          const getTransactionReq = {
            // eslint-disable-next-line camelcase
            tx_hash: Buffer.from(latticeTxHash, 'hex'),
          }
          await qrlClient.GetTransaction(
            getTransactionReq,
            async (error, response) => {
              if (error) {
                this.log(`${red('⨉')} Unable to get associated Lattice transaction`)
              }
              senderKyberPK = response.tx.latticePK.pk1.toString('hex')
              senderDilithiumPK = response.tx.latticePK.pk2.toString('hex')
              // Create the Kyber object from localy Kyber SK and lattice tx Kyber PK
              const KYBOBJECT_SENDER = await new KYBLIB.Kyber.fromKeys(senderKyberPK, senderKyberSK)
              // Create the Dilithium object from localy Dilithium SK and lattice tx Dilithium PK
              const DILOBJECT_SENDER = await new DILLIB.Dilithium.fromKeys(senderDilithiumPK, senderDilithiumSK)
              // 3 - Take a random 32 bytes seed
              const s = Crypto.randomBytes(32)

              // let testSeed = '7769062210ede9c383e49a9c96357f4a04f27cd979183beb881afb08bb226295'
              // console.log(Buffer.from(testSeed.toString(), 'hex'))
              // const s = Buffer.from(testSeed.toString(), 'hex')

              // 4 - call kem_encode with receiver's PK
              KYBOBJECT_SENDER.kem_encode(recipientKyberPK.toString('hex'))
              // 5 - encrypted text with encrypted AES key
              const senderCypherText = KYBOBJECT_SENDER.getCypherText()
              const sharedKey = KYBOBJECT_SENDER.getMyKey()

              eccrypto.encrypt(recipientECDSAPK, Buffer.from(senderCypherText)).then(function (encryptedCypherText) {
                // 6 - Encrypt the seed *s* with shared key *key*
                let mykey = Uint8Array.from(Buffer.from(sharedKey.toString(), 'hex'))
                var aesCtr = new aesjs.ModeOfOperation.ctr(mykey)
                var p = aesCtr.encrypt(s)

                // For debugging purpose
                // console.log("---------------------")
                // console.log("FROM BOB")
                // console.log("Decrypted shared seed")
                // console.log(s)
                // console.log("Shared secret")
                // console.log(sharedKey)
                // console.log("---------------------")

                // 7 - sender signs the payload with Dilithium
                let signedMsg = DILOBJECT_SENDER.sign(Buffer.from(p).toString('hex'))

                // 8 - generate the next 1000 keys from the shared secret seed using SHAKE
                // save encrpytedCypherText and signedMsg to a local file
                const encCypherTextJson = ['[', JSON.stringify(encryptedCypherText), ']'].join('')
                fs.writeFileSync('encCypherText.txt', encCypherTextJson)
                const signedMsgJson = ['[', JSON.stringify(signedMsg), ']'].join('')
                fs.writeFileSync('signedMessage.txt', signedMsgJson)

                // 9 - Generate the next 1000 keys with Shake
                waitForQRLLIB(async _ => {
                  const sBin = QRLLIB.hstr2bin(Buffer.from(Buffer.from(s).toString('hex')))
                  let keyList = QRLLIB.shake128(64000, sBin)
                  fs.writeFileSync('keyListSender.txt', QRLLIB.bin2hstr(keyList))
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

SendInitialMessage.description = `Send initial message for channel opening
`

SendInitialMessage.args = [
  // {
  //   name: 'address',
  //   description: 'QRL wallet address to send message to',
  //   required: true,
  // },
  {
    name: 'file',
    description: 'Local EMS file containing private keys',
    required: true,
  },
]

SendInitialMessage.flags = {
  txhash: flags.string({char: 'h', default: false, description: 'tx hash of lattice transaction'}),
  string: flags.string({char: 's', default: false, description: 'message to encrypt'}),
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'EMS file password'}),
}

module.exports = {SendInitialMessage}
