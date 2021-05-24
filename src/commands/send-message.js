/* global QRLLIB */
/* eslint new-cap: 0 */
const { Command, flags } = require('@oclif/command')
const { white, red } = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const helpers = require('@theqrl/explorer-helpers')
const clihelpers = require('../functions/cli-helpers')
const Qrlnode = require('../functions/grpc')

class SendMessage extends Command {
  async run() {
    const { flags } = this.parse(SendMessage)
    let grpcEndpoint = clihelpers.mainnetNode.toString()
    let network = 'Mainnet'

    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = clihelpers.testnetNode.toString()
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = clihelpers.mainnetNode.toString()
      network = 'Mainnet'
    }
    this.log(white().bgBlue(network))

    if (!flags.message) {
      this.log(`${red('⨉')} No message given`)
      this.exit(1)
    }

// QRL Message transaction encoding flag


    // check size of message MAX 80 bytes
    const messageBytes = clihelpers.string2Bin(flags.message)
    const messageLength = clihelpers.byteCount(messageBytes)
    
    this.log(`Message Submitted: ${flags.message}`)
    this.log(`Message byte length: ${messageLength}`)

    if (messageLength > 80) {
      this.log(`${red('⨉')} Message cannot be longer than 80 bytes`)
      this.exit(1)
    }
    const thisAddressesTo = []
    if (flags.recipient) {
      // passed as an -r flag
      if (!validateQrlAddress.hexString(flags.recipient).result) {
        this.log(`${red('⨉')} Unable to send: invalid recipient address`)
        this.exit(1)
      }
      // set recipient here
      thisAddressesTo.push(helpers.hexAddressToRawAddress(flags.recipient))
    }
    if (!flags.wallet && !flags.hexseed) {
      this.log(`${red('⨉')} Unable to send: no wallet json file or hexseed specified`)
      this.exit(1)
    }
    // wallet functions
    let hexseed = ''
    let address = ''
    // open wallet file
    if (flags.wallet) {
      let isValidFile = false
      const walletJson = clihelpers.openWalletFile(flags.wallet)
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
    }
    // open from hexseed OR MNEMONIC
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

    const spinner = ora({ text: 'Sending Message to network...' }).start()
    clihelpers.waitForQRLLIB(async () => {
      let XMSS_OBJECT
      if (hexseed.match(' ') === null) {
        XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(hexseed)
      } else {
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

      const spinner2 = ora({ text: 'Network Connect....' }).start()
      let thisAddress = []
      if (flags.recipient) {

        [ thisAddress ] = thisAddressesTo
      }

      const request = {
        master_addr: Buffer.from('', 'hex'),
        message: messageBytes,
        addr_to: thisAddress,
        fee,
        xmss_pk: xmssPK,
      }
      const message = await Qrlnetwork.api('GetMessageTxn', request)

      spinner2.succeed('Node correctly returned transaction for signing')
      const spinner3 = ora({ text: 'Signing transaction...' }).start()

      const concatenatedArrays = clihelpers.concatenateTypedArrays(
        Uint8Array,
        clihelpers.toBigendianUint64BytesUnsigned(message.extended_transaction_unsigned.tx.fee), // fee
        messageBytes,
        thisAddress,
      )

      // Convert Uint8Array to VectorUChar
      const hashableBytes = clihelpers.toUint8Vector(concatenatedArrays)

      // Create sha256 sum of concatenated array
      const shaSum = QRLLIB.sha2_256(hashableBytes)

      XMSS_OBJECT.setIndex(parseInt(flags.otsindex, 10))
      const signature = clihelpers.binaryToBytes(XMSS_OBJECT.sign(shaSum))

      // Calculate transaction hash
      const txnHashConcat = clihelpers.concatenateTypedArrays(Uint8Array, clihelpers.binaryToBytes(shaSum), signature, xmssPK)
      // tx hash bytes..
      const txnHashableBytes = clihelpers.toUint8Vector(txnHashConcat)
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
        spinner4.fail(`${errorMessage}]`)
        this.exit(1)
      }
      const pushTransactionRes = JSON.stringify(response.tx_hash)
      const txhash = JSON.parse(pushTransactionRes)
      if (txnHash === clihelpers.bytesToHex(txhash.data)) {
        spinner4.succeed(`Transaction submitted to node: transaction ID: ${clihelpers.bytesToHex(txhash.data)}`)
        
        // return link to explorer
        if (network === 'Mainnet') {
          spinner3.succeed(`https://explorer.theqrl.org/tx/${clihelpers.bytesToHex(txhash.data)}`)
        }
        else if (network === 'Testnet') {
          spinner3.succeed(`https://testnet-explorer.theqrl.org/tx/${clihelpers.bytesToHex(txhash.data)}`)
        }
        // this.exit(0)
      } 
      else {
        spinner4.fail(`Node transaction hash ${clihelpers.bytesToHex(txhash.data)} does not match`)
        this.exit(1)
      }
    })
  }
}

SendMessage.description = `Send up to 80 byte message on the network

Message can be sent to a recipient with the (-r) flag
You can select either (-m) mainnet or (-t) testnet

Advanced: you can use a custom defined node to query for status. Use the (-g) grpc endpoint.
`

// Status.args = [
//   {
//     name: 'message',
//     description: 'message to send',
//     required: true,
//   },
// ]

SendMessage.flags = {
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet to send the message'
  }),

  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'queries mainnet to send the message'
  }),

  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'advanced: grpc endpoint (for devnet/custom QRL network deployments)',
  }),

  message: flags.string({
    char: 'M',
    default: false,
    description: 'Message data to send'
  }),

  wallet: flags.string({
    char: 'w',
    required: false,
    description: 'JSON (w)allet file message will be sent from',
  }),

 password: flags.string({
    char: 'p',
    required: false,
    description: 'Encrypted QRL wallet file (p)assword'
  }),

  hexseed: flags.string({
    char: 's',
    required: false,
    description: 'Secret hex(s)eed/mnemonic of address message should be sent from',
  }),

  recipient: flags.string({
    char: 'r',
    required: false,
    description: '(optional) QRL address of recipient'
  }),

  fee: flags.string({
    char: 'f',
    required: false,
    description: 'QRL (f)ee for transaction in Shor (defaults to 100 Shor)'
  }),

  otsindex: flags.string({ 
    char: 'i',
    required: false,
    description: 'Unused OTS key (i)ndex for message transaction' 
  }),
}

module.exports = { SendMessage }
