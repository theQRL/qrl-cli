/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const fs = require('fs')
const aes256 = require('aes256')
const {cli} = require('cli-ux')

const {qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto} = require('../functions/grpc')

const openWalletFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

class OTSKey extends Command {
  async run() {
    const {args, flags} = this.parse(OTSKey)
    let address = args.address
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
        this.log(`${red('⨉')} Unable to get OTS: invalid QRL address/wallet file`)
        this.exit(1)
      }
      if (isFile === false) {
        this.log(`${red('⨉')} Unable to get OTS: invalid QRL address/wallet file`)
        this.exit(1)
      } else {
        const walletJson = openWalletFile(path)
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
        this.log(`${red('⨉')} Unable to get a balance: invalid QRL address/wallet file`)
        this.exit(1)
      }
    }
    let grpcEndpoint = 'testnet-4.automated.theqrl.org:19009'
    let network = 'Testnet'
    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = 'testnet-4.automated.theqrl.org:19009'
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = 'mainnet-4.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Fetching OTS from API...'}).start()
    const proto = await loadGrpcBaseProto(grpcEndpoint)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }
      // next load GRPC object and check hash of that too
      await loadGrpcProto(proto, grpcEndpoint)
      const request = {
        address: Buffer.from(address.substring(1), 'hex'),
      }
      await qrlClient.GetOTS(request, async (error, response) => {
        if (error) {
          this.log(`${red('⨉')} Unable to read next unused OTS key`)
        }
        spinner.succeed(`Next unused OTS key: ${response.next_unused_ots_index}`)
      })
    })
  }
}

OTSKey.description = `Get a address's OTS state from the network
...
TODO
`

OTSKey.args = [
  {
    name: 'address',
    description: 'address to return OTS state for',
    required: true,
  },
]

OTSKey.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {OTSKey}
