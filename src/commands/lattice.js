/* eslint new-cap: 0, max-depth: 0, complexity: 0 */
/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const { DILLIBmodule } = require('qrllib/build/offline-libjsdilithium') // eslint-disable-line no-unused-vars
const { KYBLIBmodule } = require('qrllib/build/offline-libjskyber') // eslint-disable-line no-unused-vars
const eccrypto = require('eccrypto')
const Qrlnode = require('../functions/grpc')

let QRLLIBLoaded = false
let DILLIBLoaded = false
let KYBLIBLoaded = false

const waitForQRLLIB = (callBack) => {
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

const waitForDILLIB = (callBack) => {
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

const waitForKYBLIB = (callBack) => {
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

const toUint8Vector = (arr) => {
  const vec = new QRLLIB.Uint8Vector()
  for (let i = 0; i < arr.length; i += 1) {
    vec.push_back(arr[i])
  }
  return vec
}

// Convert bytes to hex
function bytesToHex(byteArray) {
  return [...byteArray]
    .map((byte) => {
      return ('00' + (byte & 0xff).toString(16)).slice(-2) // eslint-disable-line
    })
    .join('')
}

// Concatenates multiple typed arrays into one.
function concatenateTypedArrays(resultConstructor, ...arrays) {
  /* eslint-disable */
  let totalLength = 0
  for (let arr of arrays) {
    totalLength += arr.length
  }
  const result = new resultConstructor(totalLength)
  let offset = 0
  for (let arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  /* eslint-enable */
  return result
}

// Take input and convert to unsigned uint64 bigendian bytes
function toBigendianUint64BytesUnsigned(i, bufferResponse = false) {
  let input = i
  if (!Number.isInteger(input)) {
    input = parseInt(input, 10)
  }

  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let index = 0; index < byteArray.length; index += 1) {
    const byte = input & 0xff // eslint-disable-line no-bitwise
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

const openWalletFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

class Lattice extends Command {
  async run() {
    const { flags } = this.parse(Lattice)
    // network
    let grpcEndpoint = 'mainnet-4.automated.theqrl.org:19009' // eslint-disable-line no-unused-vars
    let network = 'Mainnet'
    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = 'testnet-1.automated.theqrl.org:19009'
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = 'mainnet-4.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    this.log(white().bgBlue(network))

    // check that either wallet file or hexseed/mnemonic are passed
    if (!flags.wallet && !flags.hexseed) {
      this.log(`${red('⨉')} Unable to send to the network, no wallet json file or hexseed specified`)
      // this.log(`${red('⨉')} ${red().bgWhite('Printing Keys Only')} - You will have to sign and send these later if you want to use them on-chain`)
      this.exit(1)
    }

    // wallet functions
    let hexseed = ''
    let address = ''
    // open wallet file
    if (flags.wallet) {
      let isValidFile = false
      const walletJson = openWalletFile(flags.wallet)
      try {
        if (walletJson.encrypted === false) {
          isValidFile = true
          address = walletJson.address
          hexseed = walletJson.hexseed
        }
        if (walletJson.encrypted === true) {
          let password = ''
          if (flags.password) {
            password = flags.password
          } else {
            password = await cli.prompt('Enter password for wallet file', { type: 'hide' })
          }
          address = aes256.decrypt(password, walletJson.address)
          hexseed = aes256.decrypt(password, walletJson.hexseed)
          if (validateQrlAddress.hexString(address).result) {
            isValidFile = true
          } else {
            this.log(`${red('⨉')} Unable to open wallet file: invalid password`)
            this.exit(1)
          }
        }
      } catch (error) {
        isValidFile = false
      }
      if (!isValidFile) {
        this.log(`${red('⨉')} Unable to open wallet file: invalid wallet file`)
        this.exit(1)
      }
      if (!flags.otsindex ) {
        this.log(`${red('⨉')} no OTS index given`)
        this.exit(1)
      }
      this.log(`Creating Crystals Keys for: ${address}`)
    }

    // open from hexseed here
    if (flags.hexseed) {
      // reconstruct XMSS from hexseed
      hexseed = flags.hexseed
      // sanity checks on this parameter
      if (hexseed.match(' ') === null) {
        // hexseed: correct length?
        if (hexseed.length !== 102) {
          this.log(`${red('⨉')} Hexseed invalid: too short`)
          this.exit(1)
        }
      } else {
        // mnemonic: correct number of words?
        // eslint-disable-next-line no-lonely-if
        if (hexseed.split(' ').length !== 34) {
          this.log(`${red('⨉')} Mnemonic phrase invalid: too short`)
          this.exit(1)
        }
      }
      if (!flags.otsindex ) {
        this.log(`${red('⨉')} no OTS index given`)
        this.exit(1)
      }
    }
    // check ots for valid entry
    if (flags.otsindex) {
      const passedOts = parseInt(flags.otsindex, 10)
      if (!passedOts && passedOts !== 0) {
        this.log(`${red('⨉')} OTS key is invalid`)
        this.exit(1)
      }
    }

    // set the fee to default or flag
    let fee = 0 // default fee 100 Shor
    if (flags.fee) {
      const passedFee = parseInt(flags.fee, 10)
      if (passedFee) {
        fee = passedFee
      } else {
        this.log(`${red('⨉')} Fee is invalid`)
        this.exit(1)
      }
    }

    // create the keys
    const spinner = ora({text: 'Creating Crystals Keys...'}).start()
    waitForQRLLIB(async () => {
      // get the xmss pub key to send from
      let XMSS_OBJECT
      if (hexseed.match(' ') === null) {
        XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(hexseed)
      } else {
        XMSS_OBJECT = await new QRLLIB.Xmss.fromMnemonic(hexseed)
      }
      const xmssPK = Buffer.from(XMSS_OBJECT.getPK(), 'hex')
      spinner.succeed('XMSS Key')

      // A new random 32-byte ECC private key.
      const privateKey = eccrypto.generatePrivate()
      const publicKey = eccrypto.getPublic(privateKey)
      const ecdsaPK = Buffer.from(publicKey)
      spinner.succeed('ECDSA PK created')
      
      waitForKYBLIB(async () => {
        // new kyber keys
        const KYB_OBJECT = await new KYBLIB.Kyber.empty()
        const kyberPK = Buffer.from(KYB_OBJECT.getPK(), 'hex')
        const kyberSK = Buffer.from(KYB_OBJECT.getSK(), 'hex')
        spinner.succeed('Kyber Keys Created!')

        waitForDILLIB(async () => {
          // new dilithium keys
          const DIL_OBJECT = await new DILLIB.Dilithium.empty()
          const dilithiumPK = Buffer.from(DIL_OBJECT.getPK(), 'hex')
          const dilithiumSK = Buffer.from(DIL_OBJECT.getSK(), 'hex')
          spinner.succeed('Dilithium Keys Created!')

          // no file flag given so print keys
          if (!flags.crystalsFile) {
            if (flags.json) {
              const crystalsDetail = {
                kyberPK: kyberPK.toString('hex'),
                kyberSK: kyberSK.toString('hex'),
                dilithiumPK: dilithiumPK.toString('hex'),
                dilithiumSK: dilithiumSK.toString('hex'),
                ecdsaPK: publicKey.toString('hex'),
                ecdsaSK: privateKey.toString('hex'),
              }
              this.log(JSON.stringify(crystalsDetail))
            }
            else {
              this.log(` ${black().bgWhite('Kyber PK:')}  ${kyberPK.toString('hex')}`)
              this.log(` ${black().bgWhite('Dilithium PK:')}  ${dilithiumPK.toString('hex')}`)
              this.log(` ${black().bgWhite('ECDSA PK:')}   ${publicKey.toString('hex')}`)
            }
          }

          // output keys to file if flag passed
          if (flags.crystalsFile) {
            // output to JSON
            const crystalsDetail = {
              encrypted: false,
              kyberPK: kyberPK.toString('hex'),
              kyberSK: kyberSK.toString('hex'),
              dilithiumPK: dilithiumPK.toString('hex'),
              dilithiumSK: dilithiumSK.toString('hex'),
              ecdsaPK: publicKey.toString('hex'),
              ecdsaSK: privateKey.toString('hex'),
            }

            if (flags.crystalsPassword) {
              const passphrase = flags.crystalsPassword
              crystalsDetail.encrypted = true
              crystalsDetail.kyberPK = aes256.encrypt(passphrase, crystalsDetail.kyberPK)
              crystalsDetail.kyberSK = aes256.encrypt(passphrase, crystalsDetail.kyberSK)
              crystalsDetail.dilithiumPK = aes256.encrypt(passphrase, crystalsDetail.dilithiumPK)
              crystalsDetail.dilithiumSK = aes256.encrypt(passphrase, crystalsDetail.dilithiumSK)
              crystalsDetail.ecdsaPK = aes256.encrypt(passphrase, crystalsDetail.ecdsaPK)
              crystalsDetail.ecdsaSK = aes256.encrypt(passphrase, crystalsDetail.ecdsaSK)
            }
            // write the file here
            const crystalsJson = ['[', JSON.stringify(crystalsDetail), ']'].join('')
            fs.writeFileSync(flags.crystalsFile, crystalsJson)
            spinner.succeed(`Ephemeral private keys written to ${flags.crystalsFile}`)
          }
          if (flags.broadcast) {
            const Qrlnetwork = await new Qrlnode(grpcEndpoint)
            await Qrlnetwork.connect()

            // form the GetLatticeTxn body here
            const request = {
              master_addr: Buffer.from('', 'hex'),
              pk1: kyberPK,
              pk2: dilithiumPK,
              pk3: ecdsaPK,
              fee,
              xmss_pk: xmssPK,
            }

            // call the transaction to the network
            const tx = await Qrlnetwork.api('GetLatticeTxn', request)
            spinner.succeed('Node correctly returned transaction for signing')
            const spinner2 = ora({ text: 'Signing transaction...' }).start()
            const concatenatedArrays = concatenateTypedArrays(
              Uint8Array,
              Buffer.from('', 'hex'), // master_address
              toBigendianUint64BytesUnsigned(tx.extended_transaction_unsigned.tx.fee), // fee
              kyberPK, // kyber pub key
              dilithiumPK, // dilithium pub key
              ecdsaPK // ecdsa public key
            )

            // Convert Uint8Array to VectorUChar
            const hashableBytes = toUint8Vector(concatenatedArrays)

            // Create sha256 sum of concatenated array
            const shaSum = QRLLIB.sha2_256(hashableBytes)

            XMSS_OBJECT.setIndex(parseInt(flags.otsindex, 10))
            const signature = binaryToBytes(XMSS_OBJECT.sign(shaSum))
            // Calculate transaction hash
            const txnHashConcat = concatenateTypedArrays(Uint8Array, binaryToBytes(shaSum), signature, xmssPK)
            // tx hash bytes..
            const txnHashableBytes = toUint8Vector(txnHashConcat)
            // get the transaction hash
            const txnHash = QRLLIB.bin2hstr(QRLLIB.sha2_256(txnHashableBytes))
            spinner2.succeed(`Transaction signed with OTS key ${flags.otsindex}. (nodes will reject this transaction if key reuse is detected)`)
            const spinner3 = ora({ text: 'Pushing transaction to node...' }).start()
            // transaction sig and pub key into buffer
            tx.extended_transaction_unsigned.tx.signature = Buffer.from(signature)
            tx.extended_transaction_unsigned.tx.public_key = Buffer.from(xmssPK) // eslint-disable-line camelcase

            const pushTransactionReq = {
              transaction_signed: tx.extended_transaction_unsigned.tx, // eslint-disable-line camelcase
            }
            // push the transaction to the network
           const response = await Qrlnetwork.api('PushTransaction', pushTransactionReq)
            if (response.error_code && response.error_code !== 'SUBMITTED') {
              let errorMessage = 'unknown error'
              if (response.error_code) {
                errorMessage = `Unable send push transaction [error: ${response.error_description}`
              } else {
                errorMessage = `Node rejected signed message: has OTS key ${flags.otsindex} been reused?`
              }
              spinner3.fail(`${errorMessage}]`)
              //this.exit(1)
            }
            const pushTransactionRes = JSON.stringify(response.tx_hash)
            const txhash = JSON.parse(pushTransactionRes)
            if (txnHash === bytesToHex(txhash.data)) {
              spinner3.succeed(`Transaction submitted to node: transaction ID: ${bytesToHex(txhash.data)}`)
              this.exit(0)
            } else {
              spinner3.fail(`Node transaction hash ${bytesToHex(txhash.data)} does not match`)
              //this.exit(1)
            }
                          this.exit(0)
          }
        })
      })
    })
  }
}


Lattice.description = `Create Crystals Keys and broadcast to the network
Requires a valid QRL wallet file or hexseed/mnemonic and will by default print kyber and dilithium keys to the console
Pass the -c flag to save to a file location and the -b flag to broadcast the keys to the network.
Advanced: you can use a custom defined node to query for status. Use the (-g) grpc endpoint.

`

// EphemeralKeys.args = [
//   {
//     name: 'address',
//     description: 'address to save the Lattice transaction to',
//     required: false,
//   },
// ]

Lattice.flags = {

  wallet: flags.string({
    char: 'w',
    required: false,
    description: 'json file of (w)allet from where funds should be sent',
  }),

  walletPassword: flags.string({
    char: 'p',
    required: false,
    description: 'wallet file (p)assword'
  }),
  hexseed: flags.string({
    char: 's',
    required: false,
    description: 'hex(s)eed/mnemonic of wallet from where funds should be sent',
  }),

  json: flags.boolean({
    char: 'j',
    required: false,
    description: 'Print the keys in json format'
  }),

  crystalsFile: flags.string({
    char: 'c',
    required: false,
    description: '(c)reate crystals keys to json file'
  }),

  broadcast: flags.boolean({
    char: 'b',
    required: false,
    description: 'broadcast the crystals keys to the network'
  }),

  crystalsPassword: flags.string({
    char: 'e',
    required: false,
    description: 'Password for (e)ncrypetd crystals file'
  }),

  fee: flags.string({
    char: 'f',
    required: false,
    description: '(f)ee for transaction in Shor (defaults to 100 Shor)'
  }),

  otsindex: flags.string({ 
    char: 'i',
    required: false,
    description: 'OTS key (i)ndex' 
  }),

  testnet: flags.boolean({
    char: 't', 
    default: false, 
    description: 'sends Lattice transaction to (t)estnet'
  }),
  mainnet: flags.boolean({
    char: 'm', 
    default: false, 
    description: 'sends Lattice transaction to (m)ainnet'
  }),
 grpc: flags.string({
    char: 'g',
    required: false,
    description: 'advanced: (g)rpc endpoint (for devnet/custom QRL network deployments)',
  }),


}

module.exports = { Lattice }