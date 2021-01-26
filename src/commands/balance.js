/* eslint new-cap: 0, max-depth: 0 */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const BigNumber = require('bignumber.js')
const fs = require('fs')
const aes256 = require('aes256')
const { cli } = require('cli-ux')

const Qrlnode = require('../functions/grpc')

const shorPerQuanta = 10 ** 9

const openWalletFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

const addressForAPI = (address) => {
  return Buffer.from(address.substring(1), 'hex')
}

class Balance extends Command {
  async run() {
    const { args, flags } = this.parse(Balance)
    let {address} = args
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
        this.log(`${black().bgWhite(address)}`)
      }
      if (isValidFile === false) {
        this.log(`${red('⨉')} Unable to get a balance: invalid QRL address/wallet file`)
        this.exit(1)
      }
    }
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
    this.log(white().bgBlue(network))
    const spinner = ora({ text: 'Fetching balance from node...' }).start()
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

    const request = {
      address: addressForAPI(address),
    }
    const response = await Qrlnetwork.api('GetOptimizedAddressState', request)
    const balance = new BigNumber(parseInt(response.state.balance, 10))

    if (flags.shor) {
      spinner.succeed(`Balance: ${balance} Shor`)
    }
    if (flags.quanta || !flags.shor) {
      // default to showing balance in Quanta if no flags
      spinner.succeed(`Balance: ${balance / shorPerQuanta} Quanta`)
    }
    if (flags.quanta && flags.shor) {
      this.log(`${red('⨉')} Please enter one, shor (-s) or quanta (-q)`)
      this.exit(1)
    }
  }
}

Balance.description = `Get a wallet balance from the network

Queries the balance of the wallet.json file or address. 
Use the (-p) flag to pass the password of encrypted wallet file.

See the documentation at https://docs.theqrl.org/developers/qrl-cli
`

Balance.args = [
  {
    name: 'address',
    description: 'address to return balance for',
    required: true,
  },
]

Balance.flags = {
  testnet: flags.boolean({ char: 't', default: false, description: 'queries testnet for the balance' }),
  mainnet: flags.boolean({ char: 'm', default: false, description: 'queries mainnet for the balance' }),
  devnet: flags.boolean({ char: 'd', default: false, description: 'queries devnet for the balance' }),
  shor: flags.boolean({ char: 's', default: false, description: 'reports the balance in Shor' }),
  quanta: flags.boolean({ char: 'q', default: false, description: 'reports the balance in Quanta' }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)',
  }),
  password: flags.string({ char: 'p', required: false, description: 'wallet file password' }),
}

module.exports = { Balance }
