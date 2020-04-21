/* eslint new-cap: 0 */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
// const moment = require('moment')

let {
  qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto,
} = require('../functions/grpc')

// const shorPerQuanta = 10 ** 9

const identifySearch = str => {
  const type = { parameter: str, type: 'Undetermined' }
  // if 3 chars or more, assume search token data
  if (str.length > 2) {
    type.type = 'Token'
    type.route = `/tokens/${str}`
    type.method = 'tokenByText'
  }
  if (str.length === 79 && str.charAt(0).toLowerCase() === 'q') {
    type.type = 'Address'
    type.route = `/a/Q${str.slice(1, 79)}`
    type.method = 'address'
  }
  if (str.length === 78 && str.charAt(0).toLowerCase() !== 'q') {
    type.type = 'Address'
    type.route = `/a/Q${str}`
    type.method = 'address'
  }
  if (str.length === 64 && parseInt(str, 10) !== str) {
    type.type = 'Txhash'
    type.route = `/tx/${str}`
    type.method = 'tx'
  }
  if (parseInt(str, 10).toString() === str) {
    type.type = 'Block'
    type.route = `/block/${str}`
    type.method = 'block'
  }
  return type
}

class Search extends Command {
  async run() {
    const { flags } = this.parse(Search)
    const { args } = this.parse(Search)
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
    if (!args.search) {
      this.log('No search string')
      this.exit(1)
    }
    const searchString = args.search
    this.log(white().bgBlue(network))
    switch (identifySearch(searchString).method) {
    case 'tx':
      this.log(`${black().bgWhite('Txhash')} ${searchString}`)
      break
    case 'address':
      this.log(`${black().bgWhite('Address')} ${searchString}`)
      break
    case 'block':
      this.log(`${black().bgWhite('Block')} ${searchString}`)
      break
    }

    const spinner = ora({ text: 'Fetching status from node...' }).start()
    const proto = await loadGrpcBaseProto(grpcEndpoint)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }
      // next load GRPC object and check hash of that too
      qrlClient = await loadGrpcProto(proto, grpcEndpoint)
      if (identifySearch(searchString).method === 'tx') {
        await qrlClient.GetObject(
          { query: Buffer.from(searchString, 'hex') },
          async (error, response) => {
            if (error) {
              this.log(`${red('⨉')} Unable to read txhash data`)
            }
            if (response.found === false) {
              spinner.fail('Unable to find transaction')
              this.exit(1)
            } else {
              spinner.succeed('Transaction found')
              this.log(response)
            }
          }
        )
      }
      if (identifySearch(searchString).method === 'block') {
        await qrlClient.GetObject(
          { query: Buffer.from(parseInt(searchString, 10).toString()) },
          async (error, response) => {
            if (error) {
              this.log(`${red('⨉')} Unable to read block data`)
            }
            if (response.found === false) {
              spinner.fail('Unable to find block')
              this.exit(1)
            } else {
              spinner.succeed('Block found')
              this.log(response)
            }
          }
        )
      }
      if (identifySearch(searchString).method === 'address') {
        await qrlClient.GetOptimizedAddressState(
          { address: Buffer.from(searchString.substring(1), 'hex') },
          async (error, response) => {
            if (error) {
              this.log(`${red('⨉')} Unable to read address data`)
            }
            if (response.found === false) {
              spinner.fail('Unable to find address')
              this.exit(1)
            } else {
              spinner.succeed('Address found')
              this.log(response)
            }
          }
        )
      }
    })
  }
}

Search.description = `Gets the network status

Fetches data about queried transaction/block/address. Defaults to mainnet; network selection flags are (-m) mainnet, (-t) testnet or (-d) devnet. 
Advanced: you can use a custom defined node to query for status. Use the (-g) grpc endpoint.
`

Search.args = [
  {
    name: 'search',
    description: 'a search term: address/txhash/block to query API for',
    required: true,
  },
]

Search.flags = {
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet for the OTS state',
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'queries mainnet for the OTS state',
  }),
  devnet: flags.boolean({
    char: 'd',
    default: false,
    description: 'queries devnet for the OTS state',
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description:
      'advanced: grcp endpoint (for devnet/custom QRL network deployments)',
  }),
}

module.exports = { Search }
