/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, cyan, bgWhite} = require('kleur')
const ora = require('ora')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const fs = require('fs')
const {cli} = require('cli-ux')

let {qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto
} = require('../functions/grpc')

const openWalletFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

class EphemeralKeys extends Command {
  async run() {
    const {args, flags} = this.parse(EphemeralKeys)
    const spinner = ora({
      text: 'Fetching Ephemeral keys from API...\n',
    }).start()

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
        spinner.fail(`${red('⨉')} Error: Unable to get Ephemeral Public Keys: invalid QRL address/wallet file`)
        this.exit(1)
      }
      if (isFile === false) {
        spinner.fail(`${red('⨉')} Unable to get Ephemeral Public Keys: invalid QRL address/wallet file`)
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
        this.log(`${red('⨉')} Unable to get a Ephemeral Public Keys: invalid QRL address/wallet file`)
        this.exit(1)
      }
    }

    let itemPerPage = args.item_per_page
    let pageNumber = args.page_number

    let grpcEndpoint = 'testnet-1.automated.theqrl.org:19009'
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

    spinner.start(`Validating ${cyan('ProtoHash')} with node`)
    const proto = await loadGrpcBaseProto(grpcEndpoint)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }
      spinner.succeed(`${cyan('ProtoHash: ')}${bgWhite().black('Validated!')}`)

      // next load GRPC object and check hash of that too
      qrlClient = await loadGrpcProto(proto, grpcEndpoint)

      const getTransactionsByAddressReq = {
        address: Buffer.from(address.substring(1), 'hex'),
        // eslint-disable-next-line camelcase
        item_per_page: itemPerPage,
        // eslint-disable-next-line camelcase
        page_number: pageNumber,
      }

      await qrlClient.GetLatticePKsByAddress(
        getTransactionsByAddressReq,
        async (error, response) => {
          if (error) {
            this.log(`${red('⨉')} Unable to get Lattice transaction list`)
          }
          let pk1 = Buffer.from(response.lattice_pks_detail[0].pk1, 'hex').toString('hex')
          let pk2 = Buffer.from(response.lattice_pks_detail[0].pk2, 'hex').toString('hex')
          let pk3 = Buffer.from(response.lattice_pks_detail[0].pk3, 'hex').toString('hex')
          let txHash = Buffer.from(response.lattice_pks_detail[0].tx_hash, 'hex').toString('hex')

          let jsonResults = {
            pk1: pk1,
            pk2: pk2,
            pk3: pk3,
            txHash: txHash,
          }

          if (flags.json) {
            spinner.succeed(cyan('Lattice Keys Found!!'))
            this.log('\n' + JSON.stringify(jsonResults))
            if (flags.file) {
              fs.writeFileSync(flags.file, JSON.stringify(jsonResults))
              spinner.succeed(`Lattice pk's written to ${flags.file}`)
            }
          } else {
            spinner.succeed(cyan('Lattice Keys Found!!'))
            spinner.succeed(cyan('pk1: ') + bgWhite().black(pk1))
            spinner.succeed(cyan('pk2: ') + bgWhite().black(pk2))
            spinner.succeed(cyan('pk3: ') + bgWhite().black(pk3))
            spinner.succeed(cyan('Transaction ID: ') + bgWhite().black(txHash))
          }
          // spinner.succeed('RESPONSE:' + JSON.stringify(response.lattice_pks_detail))
        }
      )
    })
  }
}

EphemeralKeys.description = `Get Ephemeral keys associated to a QRL address
`

EphemeralKeys.args = [
  {
    name: 'address',
    description: 'address to return OTS state for',
    required: true,
  },
  {
    name: 'item_per_page',
    description: 'number of items to show per page',
    required: true,
  },
  {
    name: 'page_number',
    description: 'page number to retrieve',
    required: true,
  },
]

EphemeralKeys.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  devnet: flags.boolean({char: 'd', default: false, description: 'queries devnet for the OTS state'}),
  json: flags.boolean({char: 'j', default: false, description: 'print output in JSON format'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  file: flags.string({char: 'f', required: false, description: 'print keys to file, add the -j flag to print in json'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {EphemeralKeys}
