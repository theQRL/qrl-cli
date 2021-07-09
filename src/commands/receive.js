/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const qrcode = require('qrcode-terminal')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
const fs = require('fs')
const clihelpers = require('../functions/cli-helpers')

class Receive extends Command {
  async run() {
    const {args, flags} = this.parse(Receive)
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
        this.log(`${red('⨉')} Invalid QRL address/wallet file`)
        this.exit(1)
      }
      if (isFile === false) {
        this.log(`${red('⨉')} Invalid QRL address/wallet file`)
        this.exit(1)
      } else {
        const walletJson = clihelpers.openWalletFile(path)
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
        this.log(`${red('⨉')} Invalid QRL address/wallet file`)
        this.exit(1)
      }
    }
    this.log(white().bgBlack(address))
    this.log(qrcode.generate(address))
  }
}

Receive.description = `Displays a QR code of the QRL address to receive a transaction

Prints the QRL address in both textual and QR format. Pass either an address or a wallet.json file
If using an encrypted wallet file pass the encryption password with the (-p) flag.
`

Receive.args = [
  {
    name: 'address',
    description: 'QRL address to display QR code for',
    required: true,
  },
]

Receive.flags = {
  password: flags.string({
    char: 'p',
    required: false,
    description: 'Encrypted QRL wallet file password'
  }),
}

module.exports = {Receive}
