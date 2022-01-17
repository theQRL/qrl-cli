/* global QRLLIB */
/* eslint new-cap: 0 */

/*
// Notarization requires a sha256 hash of the data intended to hash. This can be acquired prior using 
//   something like `sha256sum {FILE}` on a typical *nix system
*/

const { Command, flags } = require('@oclif/command')
const { white, black } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
// const CryptoJS = require("crypto-js");
const Qrlnode = require('../functions/grpc')

// open wallet file
const openWalletFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

function stringToBytes(str) {
  const result = [];
  /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
  for (let i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i));
  }
  return result;
}

// Convert bytes to hex
function bytesToHex(byteArray) {
  return [...byteArray]
    /* eslint-disable */
    .map((byte) => {
      return ('00' + (byte & 0xff).toString(16)).slice(-2)
    })
    /* eslint-enable */
    .join('')
}

let QRLLIBLoaded = false

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

// toUint8Vector
const toUint8Vector = (arr) => {
  const vec = new QRLLIB.Uint8Vector()
  for (let i = 0; i < arr.length; i += 1) {
    vec.push_back(arr[i])
  }
  return vec
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

class Notarise extends Command {
  async run() {
    const { args, flags } = this.parse(Notarise)
    // let dataHash
    let messageData
    let messageHex
    let notarization = 'AFAFA'
    let hexseed
    let address
    let notarialHash

    // network stuff, defaults to mainnet
    let grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
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
      grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    this.log(white().bgBlue(network))
    // the data to notarise here, can be a file submitted (path) or a string passed on cli
    const spinner = ora({ text: 'Notarising Data...\n', }).start()
    if (args.dataHash) {
      const sha256regex = /^\b[A-Fa-f0-9]{64}\b/.test(args.dataHash)
      // is the passed data the correct length? should be a sha256 sum hash
      if (args.dataHash.length !== 64 || !sha256regex ) {
        // either length is wrong or regex not matching
        spinner.fail(`${black().bgRed(`notarization data hash invalid...`)}` )
        this.exit(1)
      }
      notarialHash = args.dataHash
    }
    notarization += `2${notarialHash}`
    spinner.succeed(`notarization: ${notarization}`)
    // additional data to send with the notary - user defined
    
    if (flags.message) {
      messageData = flags.message.toString()
      if (messageData.length > 45) {
        spinner.fail(`${black().bgRed(`Message cannot be longer than 45 characters.`)} Message Length: ${messageData.length}` )
        this.exit(1)
      }
      spinner.succeed(`Message data received: ${messageData}`)
      // Convert string to hex to append to the hash
      const messageDataBytes = stringToBytes(messageData)
      // spinner.succeed(`messageDataBytes: ${messageDataBytes}`)
      messageHex = bytesToHex(messageDataBytes)
      // Construct final hex string for notarization appending message hex
      notarization += messageHex
    }
    spinner.succeed(`final notarization hex: ${notarization}`)
    // get wallet private details for transaction
    if (!flags.wallet && !flags.hexseed) {
      spinner.fail(`${black().bgRed(`No wallet.json file (-w) or hexseed (-h) specified...`)}` )
      this.exit(1)
    }

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
          } 
          else {
            password = await cli.prompt('Enter password for wallet file', { type: 'hide' })
          }
          address = aes256.decrypt(password, walletJson.address)
          hexseed = aes256.decrypt(password, walletJson.hexseed)
          if (validateQrlAddress.hexString(address).result) {
            isValidFile = true
          } 
          else {
            spinner.fail(`${black().bgRed(`Unable to open wallet file: Invalid password...`)}` )
            this.exit(1)
          }
        }
      }
      catch (error) {
        isValidFile = false
      }
      if (!isValidFile) {
        spinner.fail(`${black().bgRed(`Unable to open wallet file: Invalid wallet file...`)}` )
        this.exit(1)
      }
      if (!flags.otsindex ) {
        spinner.fail(`${black().bgRed(`No OTS index (-i) given...`)}` )
        spinner.fail(``)
        this.exit(1)
      }
    }
    // open from hexseed OR MNEMONIC
    if (flags.hexseed) {
      // reconstruct XMSS from hexseed
      hexseed = flags.hexseed
      // sanity checks on this parameter
      if (hexseed.match(' ') === null) {
        // hexseed: correct length?
        if (hexseed.length !== 102) {
          spinner.fail(`${black().bgRed(`Hexseed invalid: too short...`)}` )
          this.exit(1)
        }
      } else {
        // mnemonic: correct number of words?
        // eslint-disable-next-line no-lonely-if
        if (hexseed.split(' ').length !== 34) {
          spinner.fail(`${black().bgRed(`Mnemonic phrase invalid: too short...`)}` )
          this.exit(1)
        }
      }
      if (!flags.otsindex ) {
        spinner.fail(`${black().bgRed(`No OTS index (-i) given...`)}` )
        this.exit(1)
      }
    }
    // check ots for valid entry
    if (flags.otsindex) {
      const passedOts = parseInt(flags.otsindex, 10)
      if (!passedOts && passedOts !== 0) {
        spinner.fail(`${black().bgRed(`OTS key is invalid...`)}` )
        this.exit(1)
      }
    }
    // set the fee to default or flag
    let fee = 0 // default fee 0 Shor
    if (flags.fee) {
      const passedFee = parseInt(flags.fee, 10)
      if (passedFee) {
        fee = passedFee
      } else {
        spinner.fail(`${black().bgRed(`Fee is invalid...`)}` )
        this.exit(1)
      }
    }

    // sign and send transaction
    waitForQRLLIB(async () => {
      let XMSS_OBJECT
      if (hexseed.match(' ') === null) {
        XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(hexseed)
      } 
      else {
        XMSS_OBJECT = await new QRLLIB.Xmss.fromMnemonic(hexseed)
      }
      const xmssPK = Buffer.from(XMSS_OBJECT.getPK(), 'hex')
      spinner.succeed('xmssPK returned...')
      const Qrlnetwork = await new Qrlnode(grpcEndpoint)
      await Qrlnetwork.connect()
      
      // verify we have connected and try again if not
      let i = 0
      const count = 5
      while (Qrlnetwork.connection === false && i < count) {
        spinner.succeed(`retry connection attempt: ${i}...`)
        // eslint-disable-next-line no-await-in-loop
        await Qrlnetwork.connect()
        // eslint-disable-next-line no-plusplus
        i++
      }
      // get message hex into bytes for transaction
      const messageBytes = Buffer.from(notarization, 'hex')
      const request = {
        master_addr: Buffer.from('', 'hex'),
        message: messageBytes,
        fee,
        xmss_pk: xmssPK,
      }
      // send the message transaction with the notarise encoding to the node
      const message = await Qrlnetwork.api('GetMessageTxn', request)

      const spinner3 = ora({ text: 'Signing transaction...' }).start()

      const concatenatedArrays = concatenateTypedArrays(
        Uint8Array,
        toBigendianUint64BytesUnsigned(message.extended_transaction_unsigned.tx.fee), // fee
        messageBytes,
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
      spinner3.succeed(`Transaction signed with OTS key ${flags.otsindex}. (nodes will reject this transaction if key reuse is detected)`)
      const spinner4 = ora({ text: 'Pushing transaction to node...' }).start()
      // transaction sig and pub key into buffer
      message.extended_transaction_unsigned.tx.signature = Buffer.from(signature)
      message.extended_transaction_unsigned.tx.public_key = Buffer.from(xmssPK) // eslint-disable-line camelcase
      const pushTransactionReq = {
        transaction_signed: message.extended_transaction_unsigned.tx, // eslint-disable-line camelcase
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
        spinner.fail(`${black().bgRed(`Qrlnetwork.api error: ${response.error_code}`)} ${errorMessage}` )
        this.exit(1)
      }
      const pushTransactionRes = JSON.stringify(response.tx_hash)
      const txhash = JSON.parse(pushTransactionRes)
      if (txnHash === bytesToHex(txhash.data)) {
        spinner4.succeed(`Transaction submitted to node: transaction ID: ${bytesToHex(txhash.data)}`)
        
        // return link to explorer
        if (network === 'Mainnet') {
          spinner3.succeed(`https://explorer.theqrl.org/tx/${bytesToHex(txhash.data)}`)
        }
        else if (network === 'Testnet') {
          spinner3.succeed(`https://testnet-explorer.theqrl.org/tx/${bytesToHex(txhash.data)}`)
        }
        // this.exit(0)
      } 
      else {
        spinner.fail(`${black().bgRed(`Node transaction hash ${bytesToHex(txhash.data)} does not match`)}` )
        this.exit(1)
      }
    })
  }
}

Notarise.description = `Notarise a document or file on the blockchain

Notarise data onto the blockchain. Takes a sha256 hash of a file and submits it to the network using
the wallet address given.

Advanced: you can use a custom defined node to broadcast the notarization. Use the (-g) grpc endpoint.
`

Notarise.args = [
   {
     name: 'dataHash',
     description: 'File sha256 Hash',
     required: true,
   },
 ]

Notarise.flags = {

  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'uses testnet for the notarization'
  }),

  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'uses mainnet for the notarization'
  }),

  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'advanced: grpc endpoint (for devnet/custom QRL network deployments)',
  }),

  message: flags.string({
    char: 'M',
    default: false,
    description: 'Additional (M)essage data to send (max 45 char)'
  }),

  wallet: flags.string({
    char: 'w',
    required: false,
    description: 'JSON (w)allet file notarization will be sent from',
  }),

 password: flags.string({
    char: 'p',
    required: false,
    description: 'Encrypted QRL wallet file (p)assword'
  }),

  hexseed: flags.string({
    char: 'h',
    required: false,
    description: 'Secret (h)exseed/mnemonic of address notarization should be sent from',
  }),

  fee: flags.string({
    char: 'f',
    required: false,
    description: 'QRL (f)ee for transaction in Shor (defaults to 0 Shor)'
  }),

  otsindex: flags.string({ 
    char: 'i',
    required: false,
    description: 'Unused OTS key (i)ndex for message transaction' 
  }),
}

module.exports = { Notarise }