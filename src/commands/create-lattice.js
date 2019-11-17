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
const aes256 = require('aes256')
const {cli} = require('cli-ux')
const {QRLPROTO_SHA256} = require('../get-qrl-proto-shasum')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`
const {QRLLIBmodule} = require('/Users/abilican/Documents/projects/perso/theqrl/myforks/qrllib/tests/js/tmp/offline-libjsqrl') 
const {DILLIBmodule} = require('/Users/abilican/Documents/projects/perso/theqrl/myforks/qrllib/tests/js/tmp/offline-libjsdilithium') 
const {KYBLIBmodule} = require('/Users/abilican/Documents/projects/perso/theqrl/myforks/qrllib/tests/js/tmp/offline-libjskyber') 
let QRLLIBLoaded = false
let DILLIBLoaded = false
let KYBLIBLoaded = false
const Crypto = require('crypto')
var eccrypto = require("eccrypto");
const { BigNumber } = require('bignumber.js');

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
SHOR_PER_QUANTA = 1000000000

// Concatenates multiple typed arrays into one.
function concatenateTypedArrays (resultConstructor, ...arrays) {
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
function toBigendianUint64BytesUnsigned (input, bufferResponse = false) {
  if (!Number.isInteger(input)) {
    input = parseInt(input, 10) // eslint-disable-line
  }

  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let index = 0; index < byteArray.length; index += 1) {
    const byte = input & 0xff // eslint-disable-line no-bitwise
    byteArray[index] = byte
    input = (input - byte) / 256 // eslint-disable-line
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
function binaryToBytes (convertMe) {
  const thisBytes = new Uint8Array(convertMe.size())
  for (let i = 0; i < convertMe.size(); i += 1) {
    thisBytes[i] = convertMe.get(i)
  }
  return thisBytes
}

// Convert hex to bytes
function hexToBytes (hex){
  return Buffer.from(hex, 'hex')
}

// Convert bytes to hex
function bytesToHex(byteArray) { // eslint-disable-line
  return Array.from(byteArray, function (byte) {
    return ('00' + (byte & 0xFF).toString(16)).slice(-2) // eslint-disable-line no-bitwise
  }).join('')
}

let qrlClient = null

async function checkProtoHash(file) {
  return readFile(file).then(async contents => {
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents)
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(CryptoJS.enc.Hex)
    console.log("protoSha256 ", calculatedProtoHash)
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
    console.log("Loading gRPC proto...")
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
    console.log("objectSha256 ", calculatedObjectHash)
    if (value.objectSha256 === calculatedObjectHash) {
      verified = true
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
  console.log(verified)
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
    const {args, flags} = this.parse(EphemeralKeys)

    let grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
    let network = 'Devnet'

    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Fetching Ephemeral keys from API...\n'}).start()

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
        } 
        else {
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
        } 
        else {
          KYBLIBLoaded = true
          return waitForKYBLIB(callBack)
        }
        return false
      }, 50)
    }

    waitForQRLLIB(async _ => {

      //default to a tree height of 10 unless passed via CLI
      let xmssHeight = 10
      // default to SHA2-256 unless otherwise specified
      let hashFunction = QRLLIB.eHashFunction.SHA2_256
      let hashCount = 0
      const randomSeed = toUint8Vector(Crypto.randomBytes(48))

      // NEEDS MANUAL ADJUSTMENT OF THE HEXSEED
      const XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(" ")
      const xmssPK = Buffer.from(XMSS_OBJECT.getPK(), 'hex')

      const address = XMSS_OBJECT.getAddress();

      waitForKYBLIB(async _ => {
        const KYB_OBJECT = await new KYBLIB.Kyber.empty()
        const kyberPK = Buffer.from(KYB_OBJECT.getPK(), 'hex');
        spinner.succeed(`Kyber PK created`);
        waitForDILLIB(async _ => {
          const DIL_OBJECT = await new DILLIB.Dilithium.empty()
          const dilithiumPK = Buffer.from(DIL_OBJECT.getPK(), 'hex');
          spinner.succeed(`Dilithium PK created`)
          // A new random 32-byte private key.
          var privateKey = eccrypto.generatePrivate();
          var publicKey = eccrypto.getPublic(privateKey);
          const ecdsaPK = QRLLIB.hstr2bin(Buffer.from(publicKey, 'hex'))
          spinner.succeed(`ECDSA PK created`)
          spinner.succeed(`${publicKey.toString('hex')}`)

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
              master_addr: Buffer.from("" , 'hex'),
              pk1: kyberPK,
              pk2: dilithiumPK,
              pk3: ecdsaPK,
              pk4: ecdsaPK,
              fee: thisTxnFee,
              xmss_pk: xmssPK
            }

            await qrlClient.GetLatticeTxn(latticeTxnReq, async (error, response) => {
              
              if (error) {
                this.log(`${red('⨉')} Unable send Lattice transaction`)
              }
              
              // var latticePKres = JSON.stringify(response.extended_transaction_unsigned.latticePK)
              // var latticejson = JSON.parse(latticePKres)

              let concatenatedArrays = concatenateTypedArrays(
                Uint8Array,
                Buffer.from("" , 'hex'), // master_address
                toBigendianUint64BytesUnsigned(thisTxnFee), // fee
                kyberPK,
                dilithiumPK,
                ecdsaPK,
                ecdsaPK // pk4, but using the same as pk3
              )

              // Convert Uint8Array to VectorUChar
              const hashableBytes = toUint8Vector(concatenatedArrays)
              const shaSum = QRLLIB.sha2_256( hashableBytes )
              spinner.succeed(`SHASUM: ${ QRLLIB.bin2hstr(shaSum) }`)

              const signature = binaryToBytes( XMSS_OBJECT.sign(shaSum) );

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
                pk4: ecdsaPK
              }

              // spinner.succeed(`TXN HASH: ${txnHash}`)

              const transaction = {
                master_addr: Buffer.from("" , 'hex'),
                fee: thisTxnFee,
                public_key: xmssPK,
                signature: signature,
                nonce: nonce,
                transaction_hash: Buffer.from(txnHash, 'hex'),
                latticePK: latticePk
              }

              const pushTransactionReq = {
                transaction_signed: transaction
              }

              await qrlClient.PushTransaction(pushTransactionReq, async (error, response) => {

                if (error) {
                  this.log(`${red('⨉')} Unable send push transaction`)
                }
                var pushTransactionRes = JSON.stringify(response.tx_hash)
                var txhash = JSON.parse(pushTransactionRes)
                spinner.succeed(`RESPONSE: ${ txhash.data }`)
                spinner.succeed(`RESPONSE: ${ bytesToHex(txhash.data) }`)
                // spinner.succeed(`RESPONSE: ${JSON.stringify(response) }`)
              })
            })
          })
        })
      })
    })
    spinner.succeed('Wallet created')
  }
}

EphemeralKeys.description = `Send lattice transaction 
`

EphemeralKeys.args = [
  {
    name: 'address',
    description: 'address to save the Lattice transaction to',
    required: false,
  },
]

EphemeralKeys.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'sends Lattice transaction to testnet'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'sends Lattice transaction to mainnet'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {EphemeralKeys}
