/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const fs = require('fs')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
const clihelpers = require('../functions/cli-helpers')

const Qrlnode = require('../functions/grpc')

class OTSKey extends Command {
  async run() {
    const {args, flags} = this.parse(OTSKey)
    let { address}  = args
    let exitCode = 1 // eslint-disable-line
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
        this.log(`${red('⨉')} Unable to get OTS: not a file`)
        this.exit(1)
      }
      if (isFile === false) {
        this.log(`${red('⨉')} Unable to get OTS: invalid QRL address/wallet file`)
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
        this.log(`${red('⨉')} Unable to get a OTS: invalid QRL address/wallet file`)
        this.exit(1)
      }
    }
    let grpcEndpoint = clihelpers.mainnetNode.toString()
    let network = 'Mainnet'

    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = clihelpers.testnetNode.toString()
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = clihelpers.mainnetNode.toString()
      network = 'Mainnet'
    }
    
    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Fetching OTS from API...'}).start()
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

    const request = { address: Buffer.from(address.substring(1), 'hex') }
    const response = await Qrlnetwork.api('GetOTS', request)
    if (response.unused_ots_index_found) {
      spinner.succeed(`Next unused OTS key: ${response.next_unused_ots_index}`)
      this.exit(0)
    } else {
        this.log(`${red('⨉')} Unable to fetch an OTS key`)
        this.exit(1)
    }
  }
}

OTSKey.description = `Get a address's OTS state from the network

Reports the next unused available OTS key. Pass either an address starting with 
QQ0004 or a wallet.json file to se the next OTS. You can set the network flag with either (-t) testnet or (-m) mainnet

If the wallet file is encrypted use the -p flag to pass the wallet file encryption password.
`

OTSKey.args = [
  {
    name: 'address',
    description: 'QRL address to return OTS state for',
    required: true,
  },
]

OTSKey.flags = {
  testnet: flags.boolean({
  char: 't',
  default: false,
  description: 'Queries testnet for the OTS state'
}),
  mainnet: flags.boolean({
  char: 'm',
  default: false,
  description: '(default) Queries mainnet for the OTS state'
}),
  grpc: flags.string({
  char: 'g',
  required: false,
    description: 'Custom grcp endpoint to connect a hosted QRL node (-g 127.0.0.1:19009)',
}),
  password: flags.string({
  char: 'p',
  required: false,
  description: 'wallet file password if encrypted'
}),
}

module.exports = {OTSKey}
