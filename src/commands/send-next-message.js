/* eslint-disable */
/* eslint-disable max-nested-callbacks */
/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {white} = require('kleur')
const ora = require('ora')
const fs = require('fs')
var aesjs = require('aes-js')

class SendNextMessage extends Command {
  async run() {
    const {args} = this.parse(SendNextMessage)
    const index = args.index
    const message = args.message
    let network = 'Devnet'

    this.log(white().bgBlue(network))
    const spinner = ora({
      text: 'Fetching Ephemeral keys from API...\n',
    }).start()

    const keyListFile = fs.readFileSync('keyListSender.txt')
    var keyList = keyListFile.toString().split(/(.{64})/).filter(O => O)

    let encKey = Uint8Array.from(Buffer.from(keyList[index].toString('hex'), 'hex'))
    var aesCtr = new aesjs.ModeOfOperation.ctr(encKey)
    var textBytes = aesjs.utils.utf8.toBytes(message)
    var p = aesCtr.encrypt(textBytes)
    fs.writeFileSync('encryptedMessage' + index.toString() + '.txt', Buffer.from(p).toString('hex'))
    spinner.succeed('DONE')
  }
}

SendNextMessage.description = `Send initial message for channel opening
`

SendNextMessage.args = [
  {
    name: 'index',
    description: 'index of the message sent',
    required: true,
  },
  {
    name: 'message',
    description: 'message to encrypt',
    required: true,
  },
]

SendNextMessage.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {SendNextMessage}
