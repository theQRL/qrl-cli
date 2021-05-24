/* eslint new-cap: 0 */
const { Command, flags } = require('@oclif/command')
const { white, black } = require('kleur')
const ora = require('ora')
const moment = require('moment')
const clihelpers = require('../functions/cli-helpers')

const Qrlnode = require('../functions/grpc')

class Status extends Command {
  async run() {
    const { flags } = this.parse(Status)
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
    const spinner = ora({ text: 'Fetching status from node...' }).start()
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

    const response = await Qrlnetwork.api('GetStats')
    spinner.succeed('Network status:')
    this.log(`    ${black().bgWhite('Network id')} ${response.node_info.network_id}`)
    this.log(
      `    ${black().bgWhite('Network uptime')} ${Math.floor(
        moment.duration(parseInt(response.uptime_network, 10), 'seconds').asDays()
      )} days`
    )
    this.log(`    ${black().bgWhite('Epoch')} ${response.epoch}`)
    this.log(`    ${black().bgWhite('Coins emitted')} ${response.coins_emitted / clihelpers.shorPerQuanta}`)
    this.log(`    ${black().bgWhite('Total coin supply')} ${response.coins_total_supply}`)
    this.log(`    ${black().bgWhite('Last block reward')} ${response.block_last_reward / clihelpers.shorPerQuanta}`)
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
}

module.exports = { Status }
