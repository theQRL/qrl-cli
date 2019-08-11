/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, green, white} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const axios = require('axios')
const BigNumber = require('bignumber.js')
const fs = require('fs')
const aes256 = require('aes256')
const {cli} = require('cli-ux')

const shorPerQuanta = 10 ** 9

const GetBalance = async function (address, api) {
  return axios.get(api, {params: {address: address}}).then((response => {
    return response.data
  })).catch(error => {
    return {error: 1, errorMessage: error.message}
  })
}

const openWalletFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

class Balance extends Command {
  async run() {
    const {args, flags} = this.parse(Balance)
    let address = args.address
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
              password = await cli.prompt('Enter password for wallet file', {type: 'hide'})
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
      }
      if (isValidFile === false) {
        this.log(`${red('⨉')} Unable to get a balance: invalid QRL address/wallet file`)
        this.exit(1)
      }
    }
    this.log(white().bgBlack(address))
    const spinner = ora({text: 'Fetching balance from API...'}).start()
    let api = ''
    if (flags.api) {
      api = flags.api
    } else {
      api = 'https://brooklyn.theqrl.org/api/GetBalance'
    }
    const bal = await GetBalance(address, api)
    spinner.stop()
    if (bal.error === 1) {
      this.log(`${red('⨉')} ${bal.errorMessage}`)
      this.exit(1)
    }
    let balance = new BigNumber(bal.data.balance)
    if (flags.shor) {
      this.log(`${green('✓')} Balance: ${balance} Shor`)
    }
    if (flags.quanta || !flags.shor) {
      // default to showing balance in Quanta if no flags
      this.log(`${green('✓')} Balance: ${balance / shorPerQuanta} Quanta`)
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
  shor: flags.boolean({char: 's', default: false, description: 'reports the balance in Shor'}),
  quanta: flags.boolean({char: 'q', default: false, description: 'reports the balance in Quanta'}),
  api: flags.string({char: 'a', required: false, description: 'api endpoint (for custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {Balance}
