/* eslint new-cap: 0 */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
const moment = require('moment')

const Qrlnode = require('../functions/grpc')
const { getNetworkSetup } = require('../functions/network-helper')

const shorPerQuanta = 10 ** 9

class Status extends Command {
  async run() {
    const { flags } = this.parse(Status)
    const { grpcEndpoint, network } = getNetworkSetup(flags)

    if (!flags.json) {
      this.log(white().bgBlue(network))
    }

    let spinner
    if (!flags.json) {
      spinner = ora({ text: 'Fetching status from node...' }).start()
    }

    const Qrlnetwork = await new Qrlnode(grpcEndpoint)
    try {
      await Qrlnetwork.connect()
      // verify we have connected and try again if not
      let i = 0
      const count = 5
      while (Qrlnetwork.connection === false && i < count) {
        if (spinner) {
          spinner.succeed(`retry connection attempt: ${i}...`)
        }
        // eslint-disable-next-line no-await-in-loop
        await Qrlnetwork.connect()
        // eslint-disable-next-line no-plusplus
        i++
      }
    } catch (e) {
      if (spinner) {
        spinner.fail(`Failed to connect to node. Check network connection & parameters.\n${e}`)
      } else {
        this.log(`${red('⨉')} Failed to connect to node: ${e}`)
      }
      this.exit(1)
    }

    const response = await Qrlnetwork.api('GetStats')
    if (spinner) {
      spinner.succeed('Network status:')
    }

    if (flags.json) {
      const output = {
        network: {
          id: response.node_info.network_id,
          uptime_days: Math.floor(moment.duration(parseInt(response.uptime_network, 10), 'seconds').asDays()),
          epoch: response.epoch,
          coins_emitted: response.coins_emitted / shorPerQuanta,
          coins_total_supply: response.coins_total_supply,
          last_block_reward: response.block_last_reward / shorPerQuanta,
        },
        node: {
          version: response.node_info.version,
          state: response.node_info.state,
          connections: response.node_info.num_connections,
          known_peers: response.node_info.num_known_peers,
          uptime_days: Math.floor(moment.duration(parseInt(response.node_info.uptime, 10), 'seconds').asDays()),
          block_height: response.node_info.block_height,
        }
      }
      console.log(JSON.stringify(output, null, 2)) // eslint-disable-line no-console
    } else {
      this.log(`    ${black().bgWhite('Network id')} ${response.node_info.network_id}`)
      this.log(
        `    ${black().bgWhite('Network uptime')} ${Math.floor(
          moment.duration(parseInt(response.uptime_network, 10), 'seconds').asDays()
        )} days`
      )
      this.log(`    ${black().bgWhite('Epoch')} ${response.epoch}`)
      this.log(`    ${black().bgWhite('Coins emitted')} ${response.coins_emitted / shorPerQuanta}`)
      this.log(`    ${black().bgWhite('Total coin supply')} ${response.coins_total_supply}`)
      this.log(`    ${black().bgWhite('Last block reward')} ${response.block_last_reward / shorPerQuanta}`)
      const spinnerNode = ora().start()
      spinnerNode.succeed('Node status:')
      this.log(`    ${black().bgWhite('Version')} ${response.node_info.version}`)
      this.log(`    ${black().bgWhite('State')} ${response.node_info.state}`)
      this.log(`    ${black().bgWhite('Connections')} ${response.node_info.num_connections}`)
      this.log(`    ${black().bgWhite('Known peers')} ${response.node_info.num_known_peers}`)
      this.log(
        `    ${black().bgWhite('Node uptime')} ${Math.floor(
          moment.duration(parseInt(response.node_info.uptime, 10), 'seconds').asDays()
        )} days`
      )
      this.log(`    ${black().bgWhite('Block height')} ${response.node_info.block_height}`)
    }
  }
}

Status.description = `Gets the network status from a node

Reports network status from the node queried. You can select either (-m) mainnet or (-t) testnet
Advanced: you can use a custom defined node to query for status. Use the (-g) grpc endpoint.
`

// Status.args = [
//   {
//     name: 'address',
//     description: 'address to return OTS state for',
//     required: true,
//   },
// ]

Status.flags = {
  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet for the OTS state' 
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'queries mainnet for the OTS state' 
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Custom grcp endpoint to connect a hosted QRL node (-g 127.0.0.1:19009)',
  }),
  json: flags.boolean({
    char: 'j',
    default: false,
    description: 'Print result output in JSON format'
  }),
}

module.exports = { Status }
