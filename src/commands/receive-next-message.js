/* eslint-disable */
/* eslint-disable max-nested-callbacks */
/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {white} = require('kleur')
const ora = require('ora')
const fs = require('fs')
var aesjs = require('aes-js')

class ReceiveNextMessage extends Command {
  async run() {
    const {args} = this.parse(ReceiveNextMessage)
    const index = args.index
    // const address = args.address
    let network = 'Devnet'

    this.log(white().bgBlue(network))
    const spinner = ora({
      text: 'Fetching Ephemeral keys from API...\n',
    }).start()

    const keyListFile = fs.readFileSync('keyListReceiver.txt')
    const encryptedMessage = fs.readFileSync('encryptedMessage' + index.toString() + '.txt')
    var keyList = keyListFile.toString().split(/(.{64})/).filter(O => O)

    let encKey = Uint8Array.from(Buffer.from(keyList[index].toString('hex'), 'hex'))
    var aesCtr = new aesjs.ModeOfOperation.ctr(encKey)
    var encryptedBytes = aesjs.utils.hex.toBytes(encryptedMessage.toString())
    var sDecrypted = aesCtr.decrypt(encryptedBytes)

    fs.writeFileSync('decryptedMessage' + index.toString() + '.txt', Buffer.from(sDecrypted).toString())
    spinner.succeed('DONE')
  }
}

ReceiveNextMessage.description = `Receive next message for channel opening
`

ReceiveNextMessage.args = [
  {
    name: 'index',
    description: 'index of the message sent',
    required: true,
  },
]

ReceiveNextMessage.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'uses testnet for this function'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'uses mainnet for this function'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grpc endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {ReceiveNextMessage}
