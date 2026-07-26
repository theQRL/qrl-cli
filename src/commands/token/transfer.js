/* global QRLLIB */
const { Command, flags } = require('@oclif/command')
const { red, green, blue } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const helpers = require('@theqrl/explorer-helpers') // eslint-disable-line no-unused-vars

const Qrlnode = require('../../functions/grpc')
const { getNetworkSetup } = require('../../functions/network-helper')

let QRLLIBLoaded = false

const waitForQRLLIB = (callBack) => {
  setTimeout(() => {
    if (typeof QRLLIB.str2bin === 'function' && QRLLIBLoaded === true) {
      callBack()
    } else {
      QRLLIBLoaded = true
      return waitForQRLLIB(callBack)
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

function concatenateTypedArrays(resultConstructor, ...arrays) {
  let totalLength = 0
  arrays.forEach((arr) => {
    totalLength += arr.length
  })
  // eslint-disable-next-line new-cap
  const result = new resultConstructor(totalLength)
  let offset = 0
  arrays.forEach((arr) => {
    result.set(arr, offset)
    offset += arr.length
  })
  return result
}

function toBigendianUint64BytesUnsigned(i, bufferResponse = false) {
  let input = i
  if (!Number.isInteger(input)) {
    input = parseInt(input, 10)
  }

  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let index = 0; index < byteArray.length; index += 1) {
    // eslint-disable-next-line no-bitwise
    const byte = input & 0xff
    byteArray[index] = byte
    input = (input - byte) / 256
  }

  byteArray.reverse()

  if (bufferResponse === true) {
    return Buffer.from(byteArray)
  }
  return new Uint8Array(byteArray)
}

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

class TokenTransfer extends Command {
  async run() {
    const { flags } = this.parse(TokenTransfer)
    const { grpcEndpoint } = getNetworkSetup(flags)

    const prompts = require('prompts') // eslint-disable-line global-require
    const isInteractive = process.stdout.isTTY && process.stdin.isTTY

    // 1. Token Hash
    if (!flags.tokenHash) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing required flag: --tokenHash`)
        this.exit(1)
      }
      const response = await prompts({
        type: 'text',
        name: 'tokenHash',
        message: 'Enter Token Creation TxID (hash):',
        validate: value => value.trim().length === 64 ? true : 'Token TxID must be a 64-character hex string'
      })
      flags.tokenHash = response.tokenHash
      if (!flags.tokenHash) {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
    }

    // 2. Recipient
    if (!flags.recipient) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing required flag: --recipient`)
        this.exit(1)
      }
      const response = await prompts({
        type: 'text',
        name: 'recipient',
        message: 'Enter Recipient QRL Address:',
        validate: value => validateQrlAddress.hexString(value).result ? true : 'Invalid QRL address'
      })
      flags.recipient = response.recipient
      if (!flags.recipient) {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
    }

    // 3. Amount
    if (!flags.amount) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing required flag: --amount`)
        this.exit(1)
      }
      const response = await prompts({
        type: 'number',
        name: 'amount',
        message: 'Enter Amount of Tokens to Transfer:',
        validate: value => value > 0 ? true : 'Amount must be positive'
      })
      flags.amount = response.amount.toString()
      if (!flags.amount) {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
    }

    // 4. OTS index
    if (!flags.otsindex) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing required flag: --otsindex`)
        this.exit(1)
      }
      const response = await prompts({
        type: 'number',
        name: 'otsindex',
        message: 'Enter OTS key index (e.g. 0):',
        validate: value => value >= 0 ? true : 'OTS index must be 0 or greater'
      })
      flags.otsindex = response.otsindex.toString()
      if (!flags.otsindex) {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
    }

    // 5. Wallet / Keys
    if (!flags.wallet && !flags.hexseed) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing sender wallet file (-w) or hexseed (-h).`)
        this.exit(1)
      }
      const response = await prompts({
        type: 'select',
        name: 'walletType',
        message: 'How would you like to specify the sender wallet?',
        choices: [
          { title: 'Wallet file (wallet.json)', value: 'file' },
          { title: 'Hexseed / Mnemonic phrase', value: 'seed' }
        ]
      })
      if (response.walletType === 'file') {
        const fileResp = await prompts({
          type: 'text',
          name: 'walletFile',
          message: 'Enter path to wallet file:',
          initial: 'wallet.json',
          validate: value => fs.existsSync(value) ? true : 'File does not exist'
        })
        flags.wallet = fileResp.walletFile
      } else if (response.walletType === 'seed') {
        const seedResp = await prompts({
          type: 'text',
          name: 'hexseed',
          message: 'Enter wallet Hexseed or Mnemonic:',
          validate: value => value.trim().length > 0 ? true : 'Hexseed/Mnemonic is required'
        })
        flags.hexseed = seedResp.hexseed
      } else {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
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
    }

    if (flags.hexseed) {
      hexseed = flags.hexseed
      if (hexseed.match(' ') === null) {
        if (hexseed.length !== 102) {
          this.log(`${red('⨉')} Hexseed invalid: too short`)
          this.exit(1)
        }
      } else if (hexseed.split(' ').length !== 34) {
        this.log(`${red('⨉')} Mnemonic phrase invalid: too short`)
        this.exit(1)
      }
    }

    let fee = 100 // default 100 Shor
    if (flags.fee) {
      fee = parseInt(flags.fee, 10)
    }

    const spinner = ora({ text: 'Connecting to QRL node...' }).start()
    waitForQRLLIB(async () => {
      let XMSS_OBJECT
      try {
        if (hexseed.match(' ') === null) {
          // eslint-disable-next-line new-cap
          XMSS_OBJECT = await new QRLLIB.Xmss.fromHexSeed(hexseed)
        } else {
          // eslint-disable-next-line new-cap
          XMSS_OBJECT = await new QRLLIB.Xmss.fromMnemonic(hexseed)
        }
      } catch (err) {
        spinner.fail(`Failed to recreate XMSS wallet object: ${err.message}`)
        this.exit(1)
      }

      const xmssPK = Buffer.from(XMSS_OBJECT.getPK(), 'hex')

      const Qrlnetwork = await new Qrlnode(grpcEndpoint)
      try {
        await Qrlnetwork.connect()
        let i = 0
        const count = 5
        while (Qrlnetwork.connection === false && i < count) {
          spinner.text = `Retry connection attempt: ${i}...`
          // eslint-disable-next-line no-await-in-loop
          await Qrlnetwork.connect()
          i += 1
        }
      } catch (e) {
        spinner.fail(`Failed to connect to node.\n${e}`)
        this.exit(1)
      }

      spinner.succeed('Connected to node. Preparing Token Transfer transaction...')

      const rawRecipient = Buffer.from(flags.recipient.substring(1), 'hex')

      const request = {
        master_addr: Buffer.from('', 'hex'),
        addresses_to: [rawRecipient],
        token_txhash: Buffer.from(flags.tokenHash, 'hex'),
        amounts: [parseInt(flags.amount, 10)],
        fee,
        xmss_pk: xmssPK,
      }

      let transferTx
      try {
        transferTx = await Qrlnetwork.api('GetTransferTokenTxn', request)
      } catch (err) {
        spinner.fail(`Node rejected Token Transfer request: ${err.message}`)
        this.exit(1)
      }

      const spinnerSign = ora({ text: 'Signing transaction...' }).start()
      
      let concatenatedArrays = concatenateTypedArrays(
        Uint8Array,
        Buffer.from('', 'hex'), // master_addr
        toBigendianUint64BytesUnsigned(transferTx.extended_transaction_unsigned.tx.fee),
        Buffer.from(flags.tokenHash, 'hex'),
      )

      const addrsToRaw = transferTx.extended_transaction_unsigned.tx.transfer_token.addrs_to
      const amountsRaw = transferTx.extended_transaction_unsigned.tx.transfer_token.amounts

      for (let index = 0; index < addrsToRaw.length; index += 1) {
        concatenatedArrays = concatenateTypedArrays(Uint8Array, concatenatedArrays, addrsToRaw[index])
        concatenatedArrays = concatenateTypedArrays(
          Uint8Array,
          concatenatedArrays,
          toBigendianUint64BytesUnsigned(amountsRaw[index])
        )
      }

      const hashableBytes = toUint8Vector(concatenatedArrays)
      const shaSum = QRLLIB.sha2_256(hashableBytes) // eslint-disable-line no-undef

      XMSS_OBJECT.setIndex(parseInt(flags.otsindex, 10))
      const signature = binaryToBytes(XMSS_OBJECT.sign(shaSum))

      transferTx.extended_transaction_unsigned.tx.signature = Buffer.from(signature)
      transferTx.extended_transaction_unsigned.tx.public_key = Buffer.from(xmssPK)

      spinnerSign.succeed(`Transaction signed with OTS key ${flags.otsindex}`)

      const spinnerPush = ora({ text: 'Pushing signed transaction to network...' }).start()
      
      // format recipient address back for raw/hex representation mapping
      const addrsToFormatted = []
      transferTx.extended_transaction_unsigned.tx.transfer_token.addrs_to.forEach(item => {
        addrsToFormatted.push(Buffer.from(item))
      })
      transferTx.extended_transaction_unsigned.tx.transfer_token.addrs_to = addrsToFormatted

      const pushRequest = {
        transaction_signed: transferTx.extended_transaction_unsigned.tx,
      }

      try {
        const response = await Qrlnetwork.api('PushTransaction', pushRequest)
        if (response.error_code && response.error_code !== 'SUBMITTED') {
          spinnerPush.fail(`Node rejected transaction: ${response.error_description}`)
          this.exit(1)
        }
        
        const pushResHash = Buffer.from(response.tx_hash).toString('hex')
        spinnerPush.succeed(`Tokens transferred successfully!`)
        this.log(green('\nTransaction Information:'))
        this.log(`  Recipient Address:   ${blue(flags.recipient)}`)
        this.log(`  Token TxID (Hash):   ${blue(flags.tokenHash)}`)
        this.log(`  Amount Transferred:  ${blue(flags.amount)}`)
        this.log(`  Transaction TxID:    ${green(pushResHash)}`)
        
        if (flags.json) {
          const jsonOut = {
            recipient: flags.recipient,
            tokenHash: flags.tokenHash,
            amount: flags.amount,
            txhash: pushResHash,
            status: 'SUBMITTED'
          }
          console.log(JSON.stringify(jsonOut, null, 2)) // eslint-disable-line no-console
        }
      } catch (err) {
        spinnerPush.fail(`gRPC error during push: ${err.message}`)
        this.exit(1)
      }
    })
  }
}

TokenTransfer.description = `Transfer existing tokens on the QRL network (QRL v1.0 XMSS/gRPC)`

TokenTransfer.flags = {
  tokenHash: flags.string({
    char: 'x',
    required: false,
    description: 'Transaction ID of the token creation',
  }),
  recipient: flags.string({
    char: 'r',
    required: false,
    description: 'Recipient QRL address (starting with Q)',
  }),
  amount: flags.string({
    char: 'a',
    required: false,
    description: 'Amount of tokens to transfer',
  }),
  fee: flags.string({
    char: 'f',
    required: false,
    description: 'Fee for transaction in Shor (defaults to 100 Shor)',
  }),
  otsindex: flags.string({
    char: 'i',
    required: false,
    description: 'OTS key index to sign with',
  }),
  wallet: flags.string({
    char: 'w',
    required: false,
    description: 'JSON file of wallet to sign transaction from',
  }),
  hexseed: flags.string({
    char: 'h',
    required: false,
    description: 'Hexseed or mnemonic phrase of wallet to sign transaction from',
  }),
  password: flags.string({
    char: 'p',
    required: false,
    description: 'Password if the wallet.json is encrypted',
  }),
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'Queries testnet network'
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'Queries mainnet network'
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Custom grpc endpoint (-g 127.0.0.1:19009)',
  }),
  json: flags.boolean({
    char: 'j',
    default: false,
    description: 'Print result output in JSON format'
  }),
}

module.exports = TokenTransfer
