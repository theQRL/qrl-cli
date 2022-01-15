/* eslint new-cap: 0, max-depth: 0, complexity: 0 */
/* global QRLLIB */
const { Command, flags } = require('@oclif/command')
const { red, white } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const { BigNumber } = require('bignumber.js')
const helpers = require('@theqrl/explorer-helpers')

const Qrlnode = require('../functions/grpc')

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

const shorPerQuanta = 10 ** 9

const toUint8Vector = (arr) => {
  const vec = new QRLLIB.Uint8Vector()
  for (let i = 0; i < arr.length; i += 1) {
    vec.push_back(arr[i])
  }
  return vec
}

// string to binary
function string2Bin(str) {
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

const checkTxJSON = (check) => {
  const valid = {}
  valid.status = true

  if (check === undefined) {
    valid.status = false
    valid.error = 'array is undefined'
    return valid
  }
  if (check.length === 0) {
    valid.status = false
    valid.error = 'No transactions found: length of array is 0'
    return valid
  }
  check.forEach((element, index) => {
    if (!JSON.stringify(element).includes('to')) {
      valid.status = false
      valid.error = `Output #${index} does not have a 'to' key`
      return valid
    }

    if (!validateQrlAddress.hexString(element.to).result) {
      valid.status = false
      valid.error = `Output #${index} does not contain a valid QRL address`
      return valid
    }

    if (!JSON.stringify(element).includes('shor')) {
      valid.status = false
      valid.error = `Output #${index} does not have a 'shor' key`
      return valid
    }
    return valid
  })
  return valid

  // need some BigNumber checks here
  // ...
  // checks complete
}

class Send extends Command {
  async run() {
    const { args, flags } = this.parse(Send)
    // network
    let grpcEndpoint = 'testnet-1.automated.theqrl.org:19009' // eslint-disable-line no-unused-vars
    let network = 'Testnet'
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
    if (!flags.loadfromfile) {
      if (!args.quantity) {
        this.log(` ${red('›')}   Error: Missing 1 required arg:`)
        this.log(` ${red('›')}   ${Send.args[0].name}  ${Send.args[0].description}`)
        this.log(` ${red('›')}   See more help with --help`)
        this.exit(1)
      }
      if (!flags.otsindex) {
        this.log(` ${red('›')}   Error: Missing required flag:`)
        this.log(` ${red('›')}    -${Send.flags.otsindex.char}, --otsindex OTSINDEX  ${white(Send.flags.otsindex.description)}`)
        this.log(` ${red('›')}   See more help with --help`)
        this.exit(1)
      }
    } else { // eslint-disable-next-line no-lonely-if
      if (args.quantity || flags.fee || flags.file || flags.hexseed || flags.jsonObject ||
        flags.otsindex || flags.password || flags.recipient || flags.shor || flags.wallet || flags.message) {
          this.log(` ${red('›')}   Error: Only these flags are allowed with -F: -m, -t, -g`)
          this.exit(1)
      }
    }
    let text = flags.savetofile ? 'Transaction details:' : network
    this.log(white().bgBlue(text))

    let messageBytes 
    let messageLength
    if (flags.message) {
      // check size of message MAX 80 bytes
      messageBytes = string2Bin(flags.message)
      messageLength = messageBytes.length
      this.log(` ${red('›')} Message\t${flags.message}`)
      this.log(` ${red('›')} Message Length\t${messageLength}`)
      this.log(` ${red('›')} messageBytes \n${messageBytes}`)
    // this.log(`Message Submitted: ${flags.message}`)
      // this.log(`Message byte length: ${messageLength}`)
      // over 80 bytes
      if (messageLength > 80) {
        this.log(`${red('⨉')} Message cannot be longer than 80 bytes`)
        this.exit(1)
      }
    }

    // setup quantities and recipient(s)
    let output = {}
    output.tx = []
    let sendMethods = 0
    if (flags.jsonObject) {
      sendMethods += 1
    }
    if (flags.recipient) {
      sendMethods += 1
    }
    if (flags.file) {
      sendMethods += 1
    }
    if (flags.loadfromfile) {
      sendMethods += 1
    }
    if (sendMethods === 0) {
      this.log(`${red('⨉')} Unable to send: no recipients`)
      this.exit(1)
    }
    if (sendMethods > 1) {
      this.log(
        `${red(
          '⨉'
        )} Unable to send: use either recipient (-r) *or* object containing multiple recipients (-j) *or* JSON file (-f)`
      )
      this.exit(1)
    }
    if (flags.shor) {
      if (flags.file || flags.jsonObject) {
        this.log(`${red('⨉')} Unable to send: -s flag is redundant where JSON used as all values are in Shor`)
        this.exit(1)
      }
    }
    if (!flags.wallet && !flags.hexseed && !flags.loadfromfile) {
      this.log(`${red('⨉')} Unable to send: no wallet json file, transaction file or hexseed specified`)
      this.exit(1)
    }
    if (flags.jsonObject) {
      // is it json?
      try {
          JSON.parse(flags.jsonObject);
      } catch (e) {
        this.log(`${red('⨉')} Unable to send: json object passed with -j contains invalid output data (${flags.jsonObject})`)
        this.exit(1)
      }
      // valid json passed, is it also correct format and content?
      output = JSON.parse(flags.jsonObject)
      // now check the json is valid --> separate function
      const validate = checkTxJSON(output.tx)
      if (validate.status === false) {
        this.log(`${red('⨉')} Unable to send: json object passed with -j contains invalid output data (${validate.error})`)
        this.exit(1)
      }
    }
    if (flags.file) {
      const contents = fs.readFileSync(flags.file)
            // is it json?
      try {
          JSON.parse(contents);
      } catch (e) {
        this.log(`${red('⨉')} Unable to send: json object passed with -j contains invalid output data (${contents})`)
        this.exit(1)
      }
      output = JSON.parse(contents)
      const validate = checkTxJSON(output.tx)
      if (validate.status === false) {
        this.log(`${red('⨉')} Unable to send: json file contains invalid output data (${validate.error})`)
        this.exit(1)
      }
    }
    if (flags.recipient) {
      // passed as an -r flag
      if (!validateQrlAddress.hexString(flags.recipient).result) {
        this.log(`${red('⨉')} Unable to send: invalid recipient address`)
        this.exit(1)
      }
      // valid address passed with -r flag, so single output
      // get value in Shor
      if (flags.shor) {
        output.tx.push({
          to: flags.recipient,
          shor: args.quantity,
        })
      } else {
        const convertAmountToBigNumber = new BigNumber(args.quantity)
        output.tx.push({
          to: flags.recipient,
          shor: convertAmountToBigNumber.times(shorPerQuanta).toString(),
        })
      }
      // console.log(output)
    }
    let hexseed = ''
    let address = ''
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
      this.log(`Sending from: ${address}`)
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
    }
    if (flags.otsindex) {
      const passedOts = parseInt(flags.otsindex, 10)
      if (!passedOts && passedOts !== 0) {
        this.log(`${red('⨉')} OTS key is invalid`)
        this.exit(1)
      }
    }
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
    const thisAddressesTo = []
    const thisAmounts = []
    this.log('Transaction outputs:')
    output.tx.forEach((o) => {
      this.log(`address to: ${o.to}`)
      this.log(`amount in shor: ${o.shor}`)
      thisAddressesTo.push(helpers.hexAddressToRawAddress(o.to))
      thisAmounts.push(o.shor)
    })
    this.log(`Fee: ${fee} Shor`)

    this.log(`output: ${JSON.stringify(output)}`)
    
    text = flags.savetofile ? 'QRLLIB loading...' : 'Sending unsigned transaction to node...'
    const spinner = ora({ text }).start()
    waitForQRLLIB(async () => {
      let XMSS_OBJECT
      let xmssPK
      if (!flags.loadfromfile) {
        if (hexseed.match(' ') === null) {
          XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(hexseed)
        } else {
          XMSS_OBJECT = await new QRLLIB.Xmss.fromMnemonic(hexseed)
        }
        xmssPK = Buffer.from(XMSS_OBJECT.getPK(), 'hex')
      }
      let tx
      let Qrlnetwork
      if (!flags.savetofile) {
        Qrlnetwork = await new Qrlnode(grpcEndpoint)
        await Qrlnetwork.connect()

        const spinner1 = ora({ text: 'attempting conenction to node...' }).start()
        // verify we have connected and try again if not
        let i = 0
        const count = 5
        while (Qrlnetwork.connection === false && i < count) {
          spinner1.succeed(`retry connection attempt: ${i}...`)
          // eslint-disable-next-line no-await-in-loop
          await Qrlnetwork.connect()
          // eslint-disable-next-line no-plusplus
          i++
        }
        spinner1.succeed(`Connected!`)
        if (!flags.loadfromfile) {
          let request
          if (flags.message) {
            request = {
              addresses_to: thisAddressesTo,
              amounts: thisAmounts,
              fee,
              message_data: messageBytes,
              xmss_pk: xmssPK,
            }
          }
          else {
            request = {
              addresses_to: thisAddressesTo,
              amounts: thisAmounts,
              fee,
              xmss_pk: xmssPK,
            }
          }
          tx = await Qrlnetwork.api('TransferCoins', request)
          spinner.succeed('Node correctly returned transaction for signing')
        } else {
          let txFromFile
          try {
            txFromFile = JSON.parse(fs.readFileSync(flags.loadfromfile))
          } catch(err) {
            this.log(`${red('⨉')} Invalid transaction file`)
            this.exit(1)
          }
          if (txFromFile.tx.transfer.message_data) {
            tx = {
              extended_transaction_unsigned: {
                tx: {
                  fee: txFromFile.tx.fee,
                  public_key: Buffer.from(txFromFile.tx.public_key, 'hex'),
                  signature: Buffer.from(txFromFile.tx.signature, 'hex'),
                  transaction_hash: txFromFile.tx.transaction_hash,
                  transfer: {
                    addrs_to: txFromFile.tx.transfer.addrs_to,
                    amounts: txFromFile.tx.transfer.amounts,
                    message_data: Buffer.from(txFromFile.tx.transfer.message_data),
                  },
                  master_addr: Buffer.from(''),
                  nonce: "0",
                  transactionType: "transfer"
                }
              }
            }

          }
          else {
            tx = {
              extended_transaction_unsigned: {
                tx: {
                  fee: txFromFile.tx.fee,
                  public_key: Buffer.from(txFromFile.tx.public_key, 'hex'),
                  signature: Buffer.from(txFromFile.tx.signature, 'hex'),
                  transaction_hash: txFromFile.tx.transaction_hash,
                  transfer: {
                    addrs_to: txFromFile.tx.transfer.addrs_to,
                    amounts: txFromFile.tx.transfer.amounts,
                  },
                  master_addr: Buffer.from(''),
                  nonce: "0",
                  transactionType: "transfer"
                }
              }
            }

          }
          spinner.succeed(`Successfully loaded from the file: "${flags.loadfromfile}"`)
        }
      } else {
        // save to file
        if (flags.message) {
          tx = {
            extended_transaction_unsigned: {
              tx: {
                fee: String(fee),
                public_key: {},
                signature: {},
                transaction_hash: {},
                transfer: {
                  addrs_to: thisAddressesTo,
                  amounts: thisAmounts,
                  message_data: messageBytes,
                }
              }
            }
          }
        }
        else {
          tx = {
            extended_transaction_unsigned: {
              tx: {
                fee: String(fee),
                public_key: {},
                signature: {},
                transaction_hash: {},
                transfer: {
                  addrs_to: thisAddressesTo,
                  amounts: thisAmounts
                }
              }
            }
          }
        }


        spinner.succeed('XMSS_OBJECT is created')
      }

      let txnHash
      if (!flags.loadfromfile) {
        const spinner2 = ora({ text: 'Signing transaction...' }).start()
        let concatenatedArrays
        if (flags.message) {
          concatenatedArrays = concatenateTypedArrays(
            Uint8Array,
            toBigendianUint64BytesUnsigned(tx.extended_transaction_unsigned.tx.fee),
            messageBytes,
          )
        }
        else {
          concatenatedArrays = concatenateTypedArrays(
            Uint8Array,
            toBigendianUint64BytesUnsigned(tx.extended_transaction_unsigned.tx.fee),
          )
        }

        // Now append all recipient (outputs) to concatenatedArrays
        const addrsToRaw = tx.extended_transaction_unsigned.tx.transfer.addrs_to
        const amountsRaw = tx.extended_transaction_unsigned.tx.transfer.amounts
        const destAddr = []
        const destAmount = []
        for (let i = 0; i < addrsToRaw.length; i += 1) {
          // Add address
          concatenatedArrays = concatenateTypedArrays(Uint8Array, concatenatedArrays, addrsToRaw[i])

          // Add amount
          concatenatedArrays = concatenateTypedArrays(
            Uint8Array,
            concatenatedArrays,
            toBigendianUint64BytesUnsigned(amountsRaw[i])
          )

          // Add to array for Ledger Transactions
          destAddr.push(Buffer.from(addrsToRaw[i]))
          destAmount.push(toBigendianUint64BytesUnsigned(amountsRaw[i], true))
        }

        // Convert Uint8Array to VectorUChar
        const hashableBytes = toUint8Vector(concatenatedArrays)

        // Create sha256 sum of concatenated array
        const shaSum = QRLLIB.sha2_256(hashableBytes)

        XMSS_OBJECT.setIndex(parseInt(flags.otsindex, 10))
        const signature = binaryToBytes(XMSS_OBJECT.sign(shaSum))
        // Calculate transaction hash
        const txnHashConcat = concatenateTypedArrays(Uint8Array, binaryToBytes(shaSum), signature, xmssPK)

        const txnHashableBytes = toUint8Vector(txnHashConcat)

        txnHash = QRLLIB.bin2hstr(QRLLIB.sha2_256(txnHashableBytes))

        text = flags.savetofile ? `Transaction signed with OTS key ${flags.otsindex}` : `Transaction signed with OTS key ${flags.otsindex}. (nodes will reject this transaction if key reuse is detected)`
        spinner2.succeed(text)

        tx.extended_transaction_unsigned.tx.signature = Buffer.from(signature)
        tx.extended_transaction_unsigned.tx.public_key = Buffer.from(xmssPK) // eslint-disable-line camelcase
      } else {
        txnHash = tx.extended_transaction_unsigned.tx.transaction_hash
      }

      const addrsTo = tx.extended_transaction_unsigned.tx.transfer.addrs_to
      const addrsToFormatted = []

      addrsTo.forEach((item) => {
        let convItem = item
        if (flags.loadfromfile) {
            convItem = helpers.hexAddressToRawAddress(item)
        }
        let bufItem = Buffer.from(convItem)
        if (flags.savetofile) {
            bufItem = helpers.rawAddressToHexAddress(bufItem)
        }
        addrsToFormatted.push(bufItem)
      })
      tx.extended_transaction_unsigned.tx.transfer.addrs_to = addrsToFormatted // eslint-disable-line camelcase
      if (!flags.savetofile) {
        const spinner3 = ora({ text: 'Pushing transaction to a node...' }).start()
        const pushTransactionReq = {
          transaction_signed: tx.extended_transaction_unsigned.tx, // eslint-disable-line camelcase
        }
        const response = await Qrlnetwork.api('PushTransaction', pushTransactionReq)
        if (response.error_code && response.error_code !== 'SUBMITTED') {
          let errorMessage = 'unknown error'
          if (response.error_code) {
            errorMessage = `Unable send push transaction [error: ${response.error_description}`
          } else {
            errorMessage = `Node rejected signed message: has OTS key ${flags.otsindex} been reused?`
          }
          spinner3.fail(`${errorMessage}]`)
          this.exit(1)
        }
        const pushTransactionRes = JSON.stringify(response.tx_hash)
        const txhash = JSON.parse(pushTransactionRes)
        if (txnHash === bytesToHex(txhash.data)) {
          spinner3.succeed(`Transaction submitted to node: transaction ID: ${bytesToHex(txhash.data)}`)

          // check for network and send link to explorer to user in console
          if (network === 'Mainnet') {
            spinner3.succeed(`https://explorer.theqrl.org/tx/${bytesToHex(txhash.data)}`)
          }
          else if (network === 'Testnet') {
            spinner3.succeed(`https://testnet-explorer.theqrl.org/tx/${bytesToHex(txhash.data)}`)
          }

          // this.exit(0)
        } else {
          spinner3.fail(`Node transaction hash ${bytesToHex(txhash.data)} does not match`)
          this.exit(1)
        }
      } else {
        const spinner3 = ora({ text: 'Saving data to the file...' }).start()

        // prepare data to save (JSON format)
        tx.extended_transaction_unsigned.tx.transaction_hash = txnHash
        tx.extended_transaction_unsigned.tx.signature = tx.extended_transaction_unsigned.tx.signature.toString('hex')
        tx.extended_transaction_unsigned.tx.public_key = tx.extended_transaction_unsigned.tx.public_key.toString('hex')

        const dataToSave = {
          addr_from: address,
          ots_key: flags.otsindex,
          tx: tx.extended_transaction_unsigned.tx,
        }

        try {
          fs.writeFileSync(flags.savetofile, JSON.stringify(dataToSave))
          spinner3.succeed(`Transaction data has been saved to the file: "${flags.savetofile}"`)
        } catch(err) {
          spinner3.fail(`Unable to save data to TX file ${err}`)
          this.log(err)
          this.exit(1)
        }
      }
    })
  }
}

Send.description = `Send Quanta from a QRL address to QRL another address

This function allows the transfer of Quanta between QRL addresses. Requires a wallet file or private keys and an unused OTS
key index to sign the transaction.

Offline signing enabled with the (-T) "Save To File" flag. This can sent using the (-F) "Load From File" flag. 
Add message data to the transaction with the (-M) "Message" flag. This allows up to an 80 bytes message to be attached 
to the transfer.

Defaults to mainnet; network selection flags are (-m) mainnet, (-t) testnet, or a custom defined node (-g) grpc endpoint. 
Advanced: Append a (-M) Message to the transaction with max 80 bytes length

`

Send.args = [
  {
    name: 'quantity',
    description: 'Number of Quanta (Shor if -s flag set) to send',
    required: false,
  },
]

Send.flags = {
  recipient: flags.string({
    char: 'r',
    required: false,
    description: 'QRL address of recipient'
  }),
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'Use testnet to send the transaction'
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'Use mainnet to send the transaction'
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Advanced: grpc endpoint (for devnet/custom QRL network deployments)',
  }),
  password: flags.string({
    char: 'p',
    required: false,
    description: 'Wallet file password'
  }),
  shor: flags.boolean({
    char: 's',
    default: false,
    description: 'Send in Shor'
  }),
  jsonObject: flags.string({
    char: 'j',
    required: false,
    description: 'Pass a JSON object of recipients/quantities for multi-output transactions',
  }),
  fee: flags.string({
    char: 'f',
    required: false,
    description: 'Fee for transaction in Shor (defaults to 100 Shor)'
  }),

  file: flags.string({
    char: 'R',
    required: false,
    description: 'JSON file of recipients'
  }),
  otsindex: flags.string({
    char: 'i',
    required: false,
    description: 'OTS key index'
  }),
  wallet: flags.string({
    char: 'w',
    required: false,
    description: 'JSON file of wallet from where funds should be sent',
  }),
  savetofile: flags.string({
    char: 'T',
    required: false,
    description: 'Save transaction to the file (offline mode)',
  }),
  loadfromfile: flags.string({
    char: 'F',
    required: false,
    description: 'Load saved transaction from the file and send)',
  }),
  hexseed: flags.string({
    char: 'h',
    required: false,
    description: 'Hexseed/mnemonic of wallet from where funds should be sent',
  }),
  message: flags.string({
    char: 'M',
    default: false,
    description: 'Message data to send (80 bytes)'
  }),
}

module.exports = { Send }
