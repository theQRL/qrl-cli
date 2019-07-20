const {Command, flags} = require('@oclif/command')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const {red, green, black} = require('kleur')

const check = flag => {
  if (flag) {
    return green('✓')
  }
  return red('⨉')
}

const overall = flag => {
  if (flag) {
    return black().bgGreen('   VALID   ')
  }
  return black().bgRed('   INVALID   ')
}

class Validate extends Command {
  async run() {
    const {args, flags} = this.parse(Validate)
    const address = args.address
    const result = validateQrlAddress.hexString(address)
    if (flags.quiet !== true) {
      this.log(black().bgWhite(` ${address} `))
      this.log(` ${check(result.len.result)} Length: ${address.length} characters`)
      this.log(` ${check(result.startQ.result)} Starts with Q`)
      this.log(` ${check(result.sig.result)} Signature scheme: ${result.sig.type}`)
      this.log(` ${check(result.hash.result)} Hash: ${result.hash.function}`)
      this.log(` ${check(result.sig.result)} Tree height: ${result.sig.height}`)
      this.log(` ${check(result.checksum.result)} Checksum`)
      this.log(`${overall(result.result)}`)
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
    required: true,
  },
]

module.exports = Validate
