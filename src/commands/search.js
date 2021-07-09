/* eslint new-cap: 0 */
const { Command, flags } = require('@oclif/command')
const { white, black, red } = require('kleur')
const ora = require('ora')
const helpers = require('@theqrl/explorer-helpers')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const clihelpers = require('../functions/cli-helpers')

const Qrlnode = require('../functions/grpc')

// const shorPerQuanta = 10 ** 9

const identifySearch = str => {
  const type = {
    parameter: str,
    type: 'Undetermined'
  }
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
    const {
      flags
    } = this.parse(Search)

    const {
      args
    } = this.parse(Search)

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
    if (!args.search) {
      this.log(`${red('⨉')} No search string`)
      this.exit(1)
    }
    const searchString = args.search
this.log(`searchstring: ${searchString}`)
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
      default: {
        this.log(`${red('⨉')} Incorrect search info given`)
        this.exit(1)
      }
    }

    const spinner = ora({
      text: 'Fetching status from node...'
    }).start()

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

    if (Qrlnetwork.connection === false) {
      // wait a sec and retry the connection
      spinner.fail('GRPC Connection failed, try again')
      this.exit(1)
    }

    if (identifySearch(searchString).method === 'tx') {
      const response = await Qrlnetwork.api('GetObject', {
        query: Buffer.from(searchString, 'hex')
      })
      if (response.found === false) {
        spinner.fail('Unable to find transaction')
        this.exit(1)
      } else {
        spinner.succeed('Transaction found')
          if (flags.json) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(helpers.tx(response)))
          }
          else {
          // eslint-disable-next-line no-console
          console.dir(helpers.tx(response), {
            depth: null,
          })
        }
      }
    }

    if (identifySearch(searchString).method === 'block') {
      const response = await Qrlnetwork.api('GetObject', {
        query: Buffer.from(parseInt(searchString, 10).toString())
      })
      if (response.found === false) {
        spinner.fail('Unable to find block')
        this.exit(1)
      } else {
        spinner.succeed('Block found')
        if (flags.json) {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(helpers.block(response)))
        }
        else {
          // eslint-disable-next-line no-console
          console.dir(helpers.block(response), {
            depth: null,
          })
        }
      }
    }

    if (identifySearch(searchString).method === 'address') {

      if (!validateQrlAddress.hexString(searchString).result) {
        spinner.fail('Invalid address given')
        this.exit(1)
      } 
      const response = await Qrlnetwork.api('GetOptimizedAddressState', {
        address: Buffer.from(searchString.substring(1), 'hex')
      })
      spinner.succeed('Address found')

      if (flags.json) {
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(helpers.a(response)))
      }
      else {
        // eslint-disable-next-line no-console
        console.dir(helpers.a(response), {
          depth: null,
        })
      }
    }
  }
}

Search.description = `Searches for a transaction, block or address

Fetches data about queried transaction/block/address. Defaults to mainnet; network selection flags are (-m) mainnet, (-t) testnet. 
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
    description: 'Queries testnet for the address/txhash/block',
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'q(default Queries mainnet for the address/txhash/block',
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Custom grcp endpoint to connect a hosted QRL node (-g 127.0.0.1:19009)',
  }),
  json: flags.boolean({
    char: 'j',
    required: false,
    description: 'Prints output to json',
  }),
}

module.exports = {
  Search
}
