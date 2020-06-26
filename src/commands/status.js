/* eslint new-cap: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white, black} = require('kleur')
const ora = require('ora')
const moment = require('moment')

let {qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto} = require('../functions/grpc')

const shorPerQuanta = 10 ** 9

class Status extends Command {
  async run() {
    const {flags} = this.parse(Status)
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
    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Fetching status from node...'}).start()
    const proto = await loadGrpcBaseProto(grpcEndpoint)
    checkProtoHash(proto).then(async protoHash => {
      if (!protoHash) {
        this.log(`${red('⨉')} Unable to validate .proto file from node`)
        this.exit(1)
      }
      // next load GRPC object and check hash of that too
      qrlClient = await loadGrpcProto(proto, grpcEndpoint)
      const request = {}
      qrlClient.GetStats(request, (error, response) => {
        if (error) {
          this.log(`${red('⨉')} Unable to read status`)
        }
        spinner.succeed('Network status:')
        this.log(`    ${black().bgWhite('Network id')} ${response.node_info.network_id}`)
        this.log(`    ${black().bgWhite('Network uptime')} ${Math.floor(moment.duration(parseInt(response.uptime_network, 10), 'seconds').asDays())} days`)
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
        this.log(`    ${black().bgWhite('Node uptime')} ${Math.floor(moment.duration(parseInt(response.node_info.uptime, 10), 'seconds').asDays())} days`)
        this.log(`    ${black().bgWhite('Block height')} ${response.node_info.block_height}`)
      })
    })
  }
}

Status.description = `Gets the network status

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
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  devnet: flags.boolean({char: 'd', default: false, description: 'queries devnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {Status}
