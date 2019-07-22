/* global QRLLIB */
/* eslint new-cap: 0 */

const {Command, flags} = require('@oclif/command')
const {red} = require('kleur')
// const Crypto = require('crypto')
// const bech32 = require('bech32')
// const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')

class Balance extends Command {
  async run() {
    const {args} = this.parse(Balance)
    const address = args.address
    if (!validateQrlAddress.hexString(address).result) {
      this.log(`${red('⨉')} Unable to get a balance: invalid QRL address`)
      this.exit(1)
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

module.exports = Balance
