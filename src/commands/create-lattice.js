/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
/* eslint-disable max-nested-callbacks */
/* eslint new-cap: 0, max-depth: 0 */
/* eslint-disable node/no-unpublished-require */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const grpc = require('grpc')
const {createClient} = require('grpc-kit')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
const {QRLPROTO_SHA256} = require('../get-qrl-proto-shasum')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`
// eslint-disable-next-line no-unused-vars
const {QRLLIBmodule} = require('qrllib/build/offline-libjsqrl')
// eslint-disable-next-line no-unused-vars
const {DILLIBmodule} = require('qrllib/build/offline-libjsdilithium')
// eslint-disable-next-line no-unused-vars
const {KYBLIBmodule} = require('qrllib/build/offline-libjskyber')

let QRLLIBLoaded = false
let DILLIBLoaded = false
let KYBLIBLoaded = false
var eccrypto = require('eccrypto')
const {BigNumber} = require('bignumber.js')

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

const openWalletFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

// Define amount of SHOR contained per QUANTA (10^9)
const SHOR_PER_QUANTA = 1000000000

// Concatenates multiple typed arrays into one.
function concatenateTypedArrays(resultConstructor, ...arrays) {
  let totalLength = 0
  for (let arr of arrays) {
    totalLength += arr.length
    // console.log("TOTALLENGTH ", arr.length)
  }
  const result = new resultConstructor(totalLength)
  let offset = 0
  for (let arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  // console.log( "RESULT ", result)
  return result
}

// Take input and convert to unsigned uint64 bigendian bytes
function toBigendianUint64BytesUnsigned(input, bufferResponse = false) {
  if (!Number.isInteger(input)) {
    input = parseInt(input, 10)
  }

  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let index = 0; index < byteArray.length; index += 1) {
    const byte = input & 0xFF // eslint-disable-line no-bitwise
    byteArray[index] = byte
    input = (input - byte) / 256
  }

  byteArray.reverse()

  if (bufferResponse === true) {
    const result = Buffer.from(byteArray)
    return result
  }
  const result = new Uint8Array(byteArray)
  return result
}

// Convert Binary object to Bytes
function binaryToBytes(convertMe) {
  const thisBytes = new Uint8Array(convertMe.size())
  for (let i = 0; i < convertMe.size(); i += 1) {
    thisBytes[i] = convertMe.get(i)
  }
  return thisBytes
}

// Convert bytes to hex
function bytesToHex(byteArray) {
  return [...byteArray].map(function (byte) {
    return ('00' + (byte & 0xFF).toString(16)).slice(-2) // eslint-disable-line no-bitwise
  }).join('')
}

let qrlClient = null

async function checkProtoHash(file) {
  return readFile(file).then(async contents => {
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents)
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(CryptoJS.enc.Hex)
    // console.log('protoSha256 ', calculatedProtoHash)
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
    // console.log(qrlProtoFilePath)
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
    // console.log('objectSha256 ', calculatedObjectHash)
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

class EphemeralKeys extends Command {
  async run() {
    const {flags} = this.parse(EphemeralKeys)

    // Retrieving the hexseed from wallet file
    let isFile = false
    let isValidFile = false
    let hexseed
    let address
    const path = flags.file
    try {
      if (fs.existsSync(path)) {
        isFile = true
      }
    } catch (error) {
      this.log(`${red('⨉')} Unable to get hexseed: invalid QRL wallet file`)
      this.exit(1)
    }
    if (isFile === false) {
      this.log(`${red('⨉')} Unable to get hexseed: invalid QRL wallet file`)
      this.exit(1)
    } else {
      const walletJson = openWalletFile(path)
      try {
        if (walletJson.encrypted === false) {
          isValidFile = true
          hexseed = walletJson.hexseed
          address = walletJson.address
        }
        if (walletJson.encrypted === true) {
          let password = ''
          if (flags.password) {
            password = flags.password
          } else {
            password = await cli.prompt('Enter password for wallet file', {type: 'hide'})
          }
          hexseed = aes256.decrypt(password, walletJson.hexseed)
          address = aes256.decrypt(password, walletJson.address)
          if (validateQrlAddress.hexString(address).result) {
            isValidFile = true
          } else {
            this.log(`${red('⨉')} Unable to open wallet file: invalid password`)
            this.exit(1)
          }
        }
      } catch (error) {
        this.exit(1)
      }
    }
    if (isValidFile === false) {
      this.log(`${red('⨉')} Unable to get the hexseed: invalid QRL wallet file`)
      this.exit(1)
    }

    let grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
    let network = 'Devnet'

    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Generating Ephemeral keys...\n'}).start()

    const toUint8Vector = arr => {
      const vec = new QRLLIB.Uint8Vector()
      for (let i = 0; i < arr.length; i += 1) {
        vec.push_back(arr[i])
      }
      return vec
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

    waitForQRLLIB(async _ => {
      // let xmssHeight = 10
      // let hashFunction = QRLLIB.eHashFunction.SHA2_256
      // let hashCount = 0
      // const randomSeed = toUint8Vector(Crypto.randomBytes(48))

      const XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(hexseed)
      const xmssPK = Buffer.from(XMSS_OBJECT.getPK(), 'hex')

      // const address = XMSS_OBJECT.getAddress()

      waitForKYBLIB(async _ => {
        const KYB_OBJECT = await new KYBLIB.Kyber.empty()
        const kyberPK = Buffer.from(KYB_OBJECT.getPK(), 'hex')
        const kyberSK = Buffer.from(KYB_OBJECT.getSK(), 'hex')
        // const kyberSK = Buffer.from(KYB_OBJECT.getSK(), 'hex')
        spinner.succeed('Kyber PK created')
        waitForDILLIB(async _ => {
          const DIL_OBJECT = await new DILLIB.Dilithium.empty()
          const dilithiumPK = Buffer.from(DIL_OBJECT.getPK(), 'hex')
          const dilithiumSK = Buffer.from(DIL_OBJECT.getSK(), 'hex')
          // const dilithiumSK = Buffer.from(DIL_OBJECT.getSK(), 'hex')
          spinner.succeed('Dilithium PK created')
          // A new random 32-byte private key.
          var privateKey = eccrypto.generatePrivate()
          var publicKey = eccrypto.getPublic(privateKey)
          // const ecdsaPK = QRLLIB.hstr2bin(Buffer.from(publicKey.toString('hex')))
          const ecdsaPK = Buffer.from(publicKey)
          spinner.succeed('ECDSA PK created')
          spinner.succeed(publicKey.toString('hex'))

          const proto = await loadGrpcBaseProto(grpcEndpoint)
          checkProtoHash(proto).then(async protoHash => {
            if (!protoHash) {
              this.log(`${red('⨉')} Unable to validate .proto file from node`)
              this.exit(1)
            }
            // next load GRPC object and check hash of that too
            await loadGrpcProto(proto, grpcEndpoint)

            // nonce
            const nonce = new BigNumber(1).toNumber()

            // Calculate txn fee
            const convertFeeToBigNumber = new BigNumber(0)
            const thisTxnFee = convertFeeToBigNumber.times(SHOR_PER_QUANTA).toNumber()

            // Prepare LatticeTxnReq
            const latticeTxnReq = {
              // master_addr: Buffer.from(address.substring(1), 'hex'),
              // eslint-disable-next-line camelcase
              master_addr: Buffer.from('', 'hex'),
              pk1: kyberPK,
              pk2: dilithiumPK,
              pk3: ecdsaPK,
              // pk4: ecdsaPK,
              fee: thisTxnFee,
              // eslint-disable-next-line camelcase
              xmss_pk: xmssPK,
            }

            // eslint-disable-next-line no-unused-vars
            await qrlClient.GetLatticeTxn(latticeTxnReq, async (error, response) => {
              if (error) {
                this.log(`${red('⨉')} Unable send Lattice transaction`)
              }

              // var latticePKres = JSON.stringify(response.extended_transaction_unsigned.latticePK)
              // var latticejson = JSON.parse(latticePKres)

              let concatenatedArrays = concatenateTypedArrays(
                Uint8Array,
                Buffer.from('', 'hex'), // master_address
                toBigendianUint64BytesUnsigned(thisTxnFee), // fee
                kyberPK,
                dilithiumPK,
                // ecdsaPK,
                ecdsaPK // pk4 should be ECIES, but using the same as pk3
              )

              // Convert Uint8Array to VectorUChar
              const hashableBytes = toUint8Vector(concatenatedArrays)
              const shaSum = QRLLIB.sha2_256(hashableBytes)
              // spinner.succeed(`SHASUM: ${QRLLIB.bin2hstr(shaSum)}`)

              XMSS_OBJECT.setIndex(parseInt(flags.otsindex, 10))
              const signature = binaryToBytes(XMSS_OBJECT.sign(shaSum))

              const txnHashConcat = concatenateTypedArrays(
                Uint8Array,
                binaryToBytes(shaSum),
                signature,
                xmssPK
              )
              const txnHashableBytes = toUint8Vector(txnHashConcat)
              const txnHash = QRLLIB.bin2hstr(QRLLIB.sha2_256(txnHashableBytes))

              // Create LatticePK
              const latticePk = {
                pk1: kyberPK,
                pk2: dilithiumPK,
                pk3: ecdsaPK,
                // pk4: ecdsaPK,
              }

              // spinner.succeed(`TXN HASH: ${txnHash}`)

              const transaction = {
                // eslint-disable-next-line camelcase
                master_addr: Buffer.from('', 'hex'),
                fee: thisTxnFee,
                // eslint-disable-next-line camelcase
                public_key: xmssPK,
                signature: signature,
                nonce: nonce,
                // eslint-disable-next-line camelcase
                transaction_hash: Buffer.from(txnHash, 'hex'),
                latticePK: latticePk,
              }

              const pushTransactionReq = {
                // eslint-disable-next-line camelcase
                transaction_signed: transaction,
              }

              await qrlClient.PushTransaction(pushTransactionReq, async (error, response) => {
                if (error) {
                  this.log(`${red('⨉')} Unable send push transaction`)
                }
                // spinner.succeed(`RESPONSE: ${JSON.stringify(response)}`)
                var pushTransactionRes = JSON.stringify(response.tx_hash)
                var txhash = JSON.parse(pushTransactionRes)
                // spinner.succeed(`RESPONSE: ${txhash.data}`)
                spinner.succeed('Transaction created')
                spinner.succeed(`Transaction ID: ${bytesToHex(txhash.data)}`)

                // save private keys to encrypted file
                const ephemeralDetail = {
                  encrypted: false,
                  kyberSK: kyberSK.toString('hex'),
                  dilithiumSK: dilithiumSK.toString('hex'),
                  ecdsaSK: privateKey.toString('hex'),
                  eciesSK: privateKey.toString('hex'),
                  txHash: bytesToHex(txhash.data),
                }

                if (flags.ephemeralPwd) {
                  const passphrase = flags.ephemeralPwd
                  ephemeralDetail.encrypted = true
                  ephemeralDetail.kyberSK = aes256.encrypt(passphrase, ephemeralDetail.kyberPK)
                  ephemeralDetail.dilithiumSK = aes256.encrypt(passphrase, ephemeralDetail.dilithiumPK)
                  ephemeralDetail.ecdsaSK = aes256.encrypt(passphrase, ephemeralDetail.ecdsaSK)
                  ephemeralDetail.eciesSK = aes256.encrypt(passphrase, ephemeralDetail.eciesSK)
                  ephemeralDetail.txHash = aes256.encrypt(passphrase, ephemeralDetail.txHash)
                }

                const ephemeralJson = ['[', JSON.stringify(ephemeralDetail), ']'].join('')
                fs.writeFileSync(flags.ephemeralFile, ephemeralJson)
                spinner.succeed(`Ephemeral private keys written to ${flags.ephemeralFile}`)
              })
            })
          })
        })
      })
    })
  }
}

EphemeralKeys.description = `Send lattice transaction 

To create a lattice transaction you will need to have a wallet file (see create-wallet command)
The generated private keys will be save to the file defined with the -o command using the same password as the one for the wallet

Documentation at https://docs.theqrl.org/developers/qrl-cli
`

// EphemeralKeys.args = [
//   {
//     name: 'address',
//     description: 'address to save the Lattice transaction to',
//     required: false,
//   },
// ]

EphemeralKeys.flags = {
  file: flags.string({char: 'f', required: true, description: 'wallet json file'}),
  ephemeralFile: flags.string({char: 'e', required: true, description: 'file to export ephemeral private keys'}),
  ephemeralPwd: flags.string({char: 's', required: false, description: 'ephemeral file password'}),
  output: flags.boolean({char: 'o', default: false, description: 'output file to save lattice private keys'}),
  otsindex: flags.string({char: 'i', required: true, description: 'OTS key index'}),
  testnet: flags.boolean({char: 't', default: false, description: 'sends Lattice transaction to testnet'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'sends Lattice transaction to mainnet'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {EphemeralKeys}
