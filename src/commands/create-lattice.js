/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
/* eslint-disable max-nested-callbacks */
/* eslint new-cap: 0, max-depth: 0 */
/* eslint-disable node/no-unpublished-require */
const {Command, flags} = require('@oclif/command')
const {red, white, yellow} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const fs = require('fs')
const {cli} = require('cli-ux')
// eslint-disable-next-line no-unused-vars
const {QRLLIBmodule} = require('qrllib/build/offline-libjsqrl')
// eslint-disable-next-line no-unused-vars
const {DILLIBmodule} = require('qrllib/build/offline-libjsdilithium')
// eslint-disable-next-line no-unused-vars
const {KYBLIBmodule} = require('qrllib/build/offline-libjskyber')

let {qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto} = require('../functions/grpc')

let QRLLIBLoaded = false
let DILLIBLoaded = false
let KYBLIBLoaded = false
var eccrypto = require('eccrypto')
const {BigNumber} = require('bignumber.js')

const openWalletFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

const addressForAPI = address => {
  return Buffer.from(address.substring(1), 'hex')
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

class EphemeralKeys extends Command {
  async run() {
    const {flags} = this.parse(EphemeralKeys)
    const spinner = ora({text: 'Create Lattice Called...\n'}).start()
    let address = flags.address
    let hexseed

    // if not an address string, it may be a file...
    if (!validateQrlAddress.hexString(address).result) {
      let isFile = false
      let isValidFile = false

      const path = address
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
    }
    // this.log(hexseed)
    // this.log(address)
    // Select network based on flags set by user. If none given, default to mainnet
    let grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
    let network = 'Mainnet'
    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.devnet) {
      grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
      network = 'Devnet'
    }
    if (flags.testnet) {
      grpcEndpoint = 'testnet-1.automated.theqrl.org:19009'
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    spinner.succeed(white().bgBlue(network))

    spinner.start('Loading Cryptographic Libraries...')

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
    spinner.succeed('Cryptographic Libraries Loaded!')
    spinner.start('Generating Lattice Keys...')
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
          spinner.succeed('ECDSA: ' + publicKey.toString('hex'))
          spinner.start('Sending transaction to the QRL Network')
          const proto = await loadGrpcBaseProto(grpcEndpoint)
          checkProtoHash(proto).then(async protoHash => {
            if (!protoHash) {
              this.log(`${red('⨉')} Unable to validate .proto file from node`)
              this.exit(1)
            }
            // next load GRPC object and check hash of that too
            qrlClient = await loadGrpcProto(proto, grpcEndpoint)

            // Get OTS for address
            const request = {
              address: addressForAPI(address),
            }

            // make the OTS key request
            await qrlClient.GetOptimizedAddressState(request, async (error, response) => {
              if (error) {
                this.log(`${red('⨉')} Unable to read status`)
                this.exit(1)
              }
              /*
                ots Key Tracking system:
                  Using the OTS response from the node we can track the key usage. So if you
                  skip around the next key may not be what is selected. The node tracks the count of used OTS, not the position of the key.
                  Some important info:
                    - if the user designates an OTS key ahead of the current key
                      the system will no longer track correctly as another key has been used.
                    - When the key that was used in the future is reached the system will
                      attempt to re-use the key as it thinks that is the next logical key.

                  To avoid any issues with key reuse or sorting out mis-used keys do not pass the ots key.
                  Let the system track the OTS keys.

                  FIX-ME!!! Check for the address tree height, and if within the last 10 keys fail with warning

              */
              // set the default value to the next auto detected OTS key
              let otsindex = new BigNumber(parseInt(response.state.used_ots_key_count, 10))
              if (flags.otsindex) {
                const passedOtsIndex = parseInt(flags.otsindex, 10)
                if (passedOtsIndex) {
                  // otsindex = passedOtsIndex
                  // this.log(`\n\n${yellow('ℹ')} User key passed: ${red(passedOtsIndex)} passed by user`)
                  // this.log(`${yellow('ℹ')} Next unused key: ${red(otsindex)} detected on chain`)
                } else {
                  this.log(`${red('⨉')} OTS is invalid`)
                  this.exit(1)
                }
                // check that the user flag is not different to the recommended
                let overrideOTS = false
                // flags.otsindex is less than detected OTS index
                if (passedOtsIndex < otsindex) {
                  spinner.stop('')
                  this.log(`\n${red('#################################')}`)
                  this.log(`${red('# Potential Key Reuse Detected! #')}`)
                  this.log(`${red('#################################\n')}`)
                  this.log(`${yellow('ℹ')} Next OTS Detected Available:\t${red(otsindex)}`)
                  this.log(`${yellow('ℹ')} User OTS Index Defined:\t${red(passedOtsIndex)}`)
                  this.log(`${yellow('ℹ')} AN XMSS tree is considered compromised if any OTS key is exposed more than ONE time!`)
                  this.log(`${yellow('ℹ')} Make sure you are not reusing this key!!\n`)
                  overrideOTS = await cli.confirm('Override OTS key tracking, using custom key index? y/n')
                  // this.log('Using next detected OTS key...')
                }
                // flags.otsindex given is larger, ask if user wants to proceed...
                if (passedOtsIndex > otsindex) {
                  spinner.stop()
                  this.log(`\n\n${yellow('ℹ')} User key passed: ${red(passedOtsIndex)} passed by user`)
                  this.log(`${yellow('ℹ')} Next unused key: ${red(otsindex)} detected on chain`)
                  this.log(`${yellow('ℹ')} By overriding the default key, you will need to track the OTS key usage manually...\n`)
                  overrideOTS = await cli.confirm('Override OTS key tracking, using custom key index? y/n')
                }
                if (passedOtsIndex === otsindex) {
                  this.error('Same OTS key given as detected from chain' + otsindex + '\nUser Key:' + passedOtsIndex)
                }
                // if the user gave Y to prompt, then user their key index.
                if (overrideOTS) {
                  this.log(`${yellow('ℹ')} Using custom OTS key...`)
                  otsindex = passedOtsIndex
                } else {
                  this.log('Using automatic OTS tracking system...')
                }
              }

              // nonce
              const nonce = new BigNumber(1).toNumber()
              // calculate the fees to pay
              let thisTxnFee = 0
              if (flags.fee) {
                thisTxnFee = flags.fee * SHOR_PER_QUANTA
              } else {
                // default fee
                const convertFeeToBigNumber = new BigNumber(0)
                thisTxnFee = convertFeeToBigNumber.times(SHOR_PER_QUANTA).toNumber()
              }

              // Prepare LatticeTxnReq
              const latticeTxnReq = {
                // eslint-disable-next-line camelcase
                master_addr: Buffer.from('', 'hex'),
                pk1: kyberPK,
                pk2: dilithiumPK,
                pk3: ecdsaPK,
                fee: thisTxnFee,
                // eslint-disable-next-line camelcase
                xmss_pk: xmssPK,
              }
              // eslint-disable-next-line no-unused-vars
              await qrlClient.GetLatticeTxn(latticeTxnReq, async (error, response) => {
                if (error) {
                  this.log(`${red('⨉')} Unable send Lattice transaction`)
                }

                let concatenatedArrays = concatenateTypedArrays(
                  Uint8Array,
                  Buffer.from('', 'hex'), // master_address
                  toBigendianUint64BytesUnsigned(thisTxnFee), // fee
                  kyberPK,
                  dilithiumPK,
                  ecdsaPK
                )
                // Convert Uint8Array to VectorUChar
                const hashableBytes = toUint8Vector(concatenatedArrays)
                const shaSum = QRLLIB.sha2_256(hashableBytes)
                spinner.succeed(`SHASUM: ${QRLLIB.bin2hstr(shaSum)}`)

                this.log('otsindex used: ' + otsindex)

                XMSS_OBJECT.setIndex(parseInt(otsindex, 10))
                const signature = binaryToBytes(XMSS_OBJECT.sign(shaSum))

                const txnHashConcat = concatenateTypedArrays(
                  Uint8Array,
                  binaryToBytes(shaSum),
                  signature,
                  xmssPK
                )
                const txnHashableBytes = toUint8Vector(txnHashConcat)
                const txnHash = QRLLIB.bin2hstr(QRLLIB.sha2_256(txnHashableBytes))
                // spinner.succeed(`TXN HASH: ${txnHash}`)

                // Create LatticePK
                const latticePk = {
                  pk1: kyberPK,
                  pk2: dilithiumPK,
                  pk3: ecdsaPK,
                }

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
                  // if password given, encrypt the file
                  if (flags.ephemeralPwd) {
                    const passphrase = flags.ephemeralPwd
                    ephemeralDetail.encrypted = true
                    ephemeralDetail.kyberSK = aes256.encrypt(passphrase, ephemeralDetail.kyberPK)
                    ephemeralDetail.dilithiumSK = aes256.encrypt(passphrase, ephemeralDetail.dilithiumPK)
                    ephemeralDetail.ecdsaSK = aes256.encrypt(passphrase, ephemeralDetail.ecdsaSK)
                    ephemeralDetail.eciesSK = aes256.encrypt(passphrase, ephemeralDetail.eciesSK)
                    ephemeralDetail.txHash = aes256.encrypt(passphrase, ephemeralDetail.txHash)
                  }
                  // wrap each line into an array
                  const ephemeralJson = ['[', JSON.stringify(ephemeralDetail), ']'].join('')
                  fs.writeFileSync(flags.ephemeralFile, ephemeralJson)
                  spinner.succeed(`Ephemeral private keys written to ${flags.ephemeralFile}`)
                })
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
  address: flags.string({char: 'a', required: true, description: 'wallet address or file to generate the keys with'}),
  ephemeralFile: flags.string({char: 'e', required: true, description: 'file to export ephemeral private keys'}),
  ephemeralPwd: flags.string({char: 's', required: false, description: 'ephemeral file password'}),

  output: flags.boolean({char: 'o', default: false, description: 'output file to save lattice private keys'}),
  fee: flags.string({char: 'f', required: false, description: 'Fee to send transaction onto network, defaults to 0.00001'}),
  otsindex: flags.string({char: 'i', required: false, description: 'OTS key index'}),

  mainnet: flags.boolean({char: 'm', default: false, description: 'sends Lattice transaction to mainnet'}),
  testnet: flags.boolean({char: 't', default: false, description: 'sends Lattice transaction to testnet'}),
  devnet: flags.boolean({char: 'd', default: false, description: 'sends Lattice transaction to devnet'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {EphemeralKeys}
