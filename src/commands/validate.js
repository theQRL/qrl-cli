const {Command, flags} = require('@oclif/command')
const validateQrlAddress = require('@theqrl/validate-qrl-address')

class Validate extends Command {
  async run() {
    const {args, flags} = this.parse(Validate)
    const address = args.address
    const result = validateQrlAddress.hexString(address)
    if (flags.quiet !== true) {
      this.log(result)
    }
    if (result.result === false) {
      this.exit(1)
    } else {
      this.exit(0)
    }
  }
}

Validate.description = `Validate a QRL address
...
when passed a QRL address in hexstring (preceded by 'Q'), will return details about the addresses validity.
`

Validate.flags = {
  quiet: flags.boolean({char: 'q', default: false, description: 'quiet mode: no address details, just return validity via exit code'}),
}

Validate.args = [
  {
    name: 'address',
    description: 'address to validate',
  },
]

module.exports = Validate
