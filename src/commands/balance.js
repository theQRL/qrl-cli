const { Command, flags } = require('@oclif/command')
const { red, white, black, blue } = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const BigNumber = require('bignumber.js')
const fs = require('fs')
const aes256 = require('aes256')
const { cli } = require('cli-ux')

const Qrlnode = require('../functions/grpc')
const { getNetworkSetup } = require('../functions/network-helper')
const { readStdin } = require('../functions/stdin-helper')

const shorPerQuanta = 10 ** 9

const openWalletFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}
      /* eslint-disable */
const addressForAPI = (address) => {
  return Buffer.from(address.substring(1), 'hex')
}
      /* eslint-enable */

class Balance extends Command {
  async run() {
    const { args, flags } = this.parse(Balance)
    let { address } = args
    const isInteractive = process.stdout.isTTY && process.stdin.isTTY

    // Support reading from STDIN if address is "-" or omitted in a pipe
    if (address === '-' || (!address && !process.stdin.isTTY)) {
      address = await readStdin()
    }

    // Empathic prompt if address is still missing
    if (!address) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing QRL address or wallet file.`)
        this.exit(1)
      }
      const prompts = require('prompts') // eslint-disable-line global-require
      const response = await prompts({
        type: 'text',
        name: 'address',
        message: 'Enter a QRL address or path to wallet.json file:',
        validate: value => value.length > 0 ? true : 'Address/File is required'
      })
      address = response.address
      if (!address) {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
    }

    if (!validateQrlAddress.hexString(address).result) {
      // not a valid address - is it a file?
      let isFile = false
      let isValidFile = false
      const path = address
      try {
        if (fs.existsSync(path)) {
          isFile = true
        }
      } catch (error) {
        this.log(`${red('⨉')} Unable to get a balance: invalid QRL address/wallet file`)
        this.exit(1)
      }
      if (isFile === false) {
        this.log(`${red('⨉')} Unable to get a balance: invalid QRL address/wallet file`)
        this.exit(1)
      } else {
        const walletJson = openWalletFile(path)
        try {
          if (walletJson.encrypted === false) {
            isValidFile = true
            address = walletJson.address
          }
          if (walletJson.encrypted === true) {
            let password = ''
            if (flags.password) {
              password = flags.password
            } else {
              password = await cli.prompt('Enter password for wallet file', { type: 'hide' })
            }
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
        if (!flags.json) {
          this.log(`${black().bgWhite(address)}`)
        }
      }
      if (isValidFile === false) {
        this.log(`${red('⨉')} Unable to get a balance: invalid QRL address/wallet file`)
        this.exit(1)
      }
    }

    const { grpcEndpoint, network } = getNetworkSetup(flags)

    if (!flags.json) {
      this.log(white().bgBlue(network))
    }

    let spinner
    if (!flags.json) {
      spinner = ora({ text: 'Fetching balance from node...' }).start()
    }

    const Qrlnetwork = await new Qrlnode(grpcEndpoint)
    try {
      await Qrlnetwork.connect()
      // verify we have connected and try again if not
      let i = 0
      const count = 5
      while (Qrlnetwork.connection === false && i < count) {
        if (spinner) {
          spinner.succeed(`retry connection attempt: ${i}...`)
        }
        // eslint-disable-next-line no-await-in-loop
        await Qrlnetwork.connect()
        // eslint-disable-next-line no-plusplus
        i++
      }
    } catch (e) {
      if (spinner) {
        spinner.fail(`Failed to connect to node. Check network connection & parameters.\n${e}`)
      } else {
        this.log(`${red('⨉')} Failed to connect to node: ${e}`)
      }
      this.exit(1)
    }

    const request = {
      address: addressForAPI(address),
    }
    const response = await Qrlnetwork.api('GetOptimizedAddressState', request)
    const balance = new BigNumber(parseInt(response.state.balance, 10))

    if (flags.json) {
      const output = {
        address,
        balance_shor: balance.toString(),
        balance_quanta: balance.dividedBy(shorPerQuanta).toString(),
        tokens: response.state.tokens || {}
      }
      this.log(JSON.stringify(output, null, 2))
      this.exit(0)
    }

    if (flags.shor) {
      spinner.succeed(`Balance: ${balance} Shor`)
    }
    if (flags.quanta || !flags.shor) {
      // default to showing balance in Quanta if no flags
      spinner.succeed(`Balance: ${balance.dividedBy(shorPerQuanta).toString()} Quanta`)
    }
    if (flags.quanta && flags.shor) {
      this.log(`${red('⨉')} Please enter one, shor (-s) or quanta (-q)`)
      this.exit(1)
    }

    // Display token balances in human-readable format if present
    const tokens = response.state.tokens || {}
    if (Object.keys(tokens).length > 0) {
      this.log(white().bold('\nToken Balances:'))
      Object.entries(tokens).forEach(([tokenHash, tokenBal]) => {
        this.log(`  ${blue(tokenHash)}: ${tokenBal}`)
      })
    }
  }
}

Balance.description = `Get a wallet balance from the network for an address

Queries the balance of the wallet.json file or address. 
Use the (-p) flag to pass the password of encrypted wallet file.

Documentation at https://docs.theqrl.org/developers/qrl-cli
`

Balance.args = [
  {
    name: 'address',
    description: 'QRL address or wallet.json file to return a balance for',
    required: false,
  },
]

Balance.flags = {
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'Queries testnet network for the address balance'
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'Queries mainnet network for the address balance'
  }),
  shor: flags.boolean({
    char: 's',
    default: false,
    description: 'Reports the QRL address balance in Shor'
  }),
  quanta: flags.boolean({
    char: 'q',
    default: false,
    description: 'Reports the QRL address balance in Quanta'
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Custom grcp endpoint to connect a hosted QRL node (-g 127.0.0.1:19009)',
  }),
  password: flags.string({
    char: 'p',
    required: false,
    description: 'Encrypted QRL wallet.json password to decrypt',
  }),
  json: flags.boolean({
    char: 'j',
    default: false,
    description: 'Output balance information in JSON format'
  }),
}

module.exports = { Balance }
