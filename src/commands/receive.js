/* eslint new-cap: 0 */
const {Command} = require('@oclif/command')
const {red} = require('kleur')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const qrcode = require('qrcode-terminal')

class Receive extends Command {
  async run() {
    const {args} = this.parse(Receive)
    const address = args.address
    if (!validateQrlAddress.hexString(address).result) {
      this.log(`${red('⨉')} Invalid QRL address`)
      this.exit(1)
    }
    this.log(qrcode.generate(address))
  }
}

Receive.description = `Displays a QR code of the QRL address to receive a transaction
...
TODO
`

Receive.args = [
  {
    name: 'address',
    description: 'address to display QR code for',
    required: true,
  },
]

module.exports = {Receive}
