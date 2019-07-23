/* eslint new-cap: 0 */
const {Command, flags} = require('@oclif/command')
const {red, green} = require('kleur')
const ora = require('ora')
// might be nice to add ora spinner whilst loading from API
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const axios = require('axios')
const BigNumber = require('bignumber.js')

const shorPerQuanta = 10 ** 9

const GetBalance = async function (address, api) {
  return axios.get(api, {params: {address: address}}).then((response => {
    return response.data
  })).catch(error => {
    return {error: 1, errorMessage: error.message}
  })
}

class Balance extends Command {
  async run() {
    const {args, flags} = this.parse(Balance)
    const address = args.address
    if (!validateQrlAddress.hexString(address).result) {
      this.log(`${red('⨉')} Unable to get a balance: invalid QRL address`)
      this.exit(1)
    }
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
...
TODO
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
}

module.exports = {Balance}
