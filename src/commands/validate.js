const {Command, flags} = require('@oclif/command')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const {red, green, black} = require('kleur')
const { readStdin } = require('../functions/stdin-helper')

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
    let {address} = args

    const isInteractive = process.stdout.isTTY && process.stdin.isTTY

    if (address === '-' || (!address && !process.stdin.isTTY)) {
      address = await readStdin()
    }

    if (!address) {
      if (!isInteractive) {
        this.log(` ${red('›')}   Error: Missing QRL address to validate.`)
        this.exit(1)
      }
      const prompts = require('prompts') // eslint-disable-line global-require
      const response = await prompts({
        type: 'text',
        name: 'address',
        message: 'Enter a QRL address to validate:',
        validate: value => value.length > 0 ? true : 'Address is required'
      })
      address = response.address
      if (!address) {
        this.log(`${red('⨉')} Operation cancelled.`)
        this.exit(1)
      }
    }

    const result = validateQrlAddress.hexString(address)

    if (flags.json) {
      console.log(JSON.stringify(result, null, 2)) // eslint-disable-line no-console
    } else if (flags.quiet !== true) {
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

When passed a QRL address in hexstring (preceded by 'Q'), will return details about the address's validity.
`

Validate.flags = {
  quiet: flags.boolean({
    char: 'q',
    default: false,
    description: 'Quiet mode: no address details, just return validity via exit code'
  }),
  json: flags.boolean({
    char: 'j',
    default: false,
    description: 'Output address validation details in JSON format'
  }),
}

Validate.args = [
  {
    name: 'address',
    description: 'QRL address to validate',
    required: false,
  },
]

module.exports = Validate
