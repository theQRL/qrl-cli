/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, cyan, bgWhite} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const fs = require('fs')
const aes256 = require('aes256')
const {cli} = require('cli-ux')

let {qrlClient,
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
    let exitCode = 1 // eslint-disable-line no-unused-vars
    const spinner = ora({text: 'Reading Address...'}).start()
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
        spinner.fail(`${red('⨉')} Error: Unable to get OTS: invalid QRL address/wallet file`)
        this.exit(1)
      }
      if (isFile === false) {
        spinner.fail(`${red('⨉')} Unable to get OTS: invalid QRL address/wallet file`)
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
    // Select network based on flags set by user. If none given, default to mainnet
    let grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
    let network = 'Mainnet'
    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.devnet) {
      grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
      network = 'Devnet'
    }
    if (flags.testnet) {
      grpcEndpoint = 'testnet-1.automated.theqrl.org:19009'
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
      network = 'Mainnet'
    }

    spinner.succeed(cyan('Using Network: ') + bgWhite().black(network))
    spinner.succeed(cyan('Endpoint: ') + bgWhite().black(grpcEndpoint))
    spinner.start('Fetching OTS from API...')
    const proto = await loadGrpcBaseProto(grpcEndpoint)
    await checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        spinner.fail(`${red('⨉')} Unable to validate .proto file from node`)
        exitCode = 1
      }
      // next load GRPC object and check hash of that too
      qrlClient = await loadGrpcProto(proto, grpcEndpoint)
      const request = {
        address: Buffer.from(address.substring(1), 'hex'),
      }
      await qrlClient.GetOTS(request, (error, response) => {
        if (error) {
          spinner.fail(`${red('⨉')} Unable to read next unused OTS key`)
          exitCode = 1
        }
        // this.log(JSON.stringify(response))
        if (response.unused_ots_index_found) {
          spinner.succeed(cyan('Unused OTS keys Found!!'))
        } else {
          spinner.fail(`${red('⨉')} No unused OTS keys found!`)
        }
        if (flags.json) {
          this.log(response)
        } else {
          spinner.succeed(`${cyan('Next unused OTS key index:')} ${bgWhite().red(response.next_unused_ots_index)}`)
        }
        exitCode = 0
      })
    })
  }
}

OTSKey.description = `Get a address's OTS state from the network

Reports the next unused availabel OTS key. Pass either an address starting with 
QQ0004 or a wallet.json file to see the next OTS. You can set the network flag with either (-t) testnet or (-m) mainnet

If the wallet file is encrypted use the -p flag to pass the wallet file encryption password.
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
  devnet: flags.boolean({char: 'd', default: false, description: 'queries devnet for the OTS state'}),
  json: flags.boolean({char: 'j', default: false, description: 'queries devnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {OTSKey}
