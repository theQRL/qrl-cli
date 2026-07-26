const Conf = require('conf')

const config = new Conf({ projectName: 'qrl-cli' })

const MAINNET_ENDPOINT = 'mainnet-3.automated.theqrl.org:19009'
const TESTNET_ENDPOINT = 'testnet-3.automated.theqrl.org:19009'

function getNetworkSetup(flags) {
  let grpcEndpoint = MAINNET_ENDPOINT
  let network = 'Mainnet'

  // 1. Check configuration defaults
  const configNetwork = config.get('default-network')
  const configEndpoint = config.get('grpc-endpoint')

  if (configNetwork === 'testnet') {
    grpcEndpoint = TESTNET_ENDPOINT
    network = 'Testnet'
  }
  if (configEndpoint) {
    grpcEndpoint = configEndpoint
    network = `Custom GRPC endpoint: [${configEndpoint}]`
  }

  // 2. Check environment variables
  if (process.env.QRL_NETWORK === 'testnet') {
    grpcEndpoint = TESTNET_ENDPOINT
    network = 'Testnet'
  } else if (process.env.QRL_NETWORK === 'mainnet') {
    grpcEndpoint = MAINNET_ENDPOINT
    network = 'Mainnet'
  }

  if (process.env.QRL_GRPC_ENDPOINT) {
    grpcEndpoint = process.env.QRL_GRPC_ENDPOINT
    network = `Custom GRPC endpoint: [${process.env.QRL_GRPC_ENDPOINT}]`
  }

  // 3. Override with CLI flags
  if (flags.testnet) {
    grpcEndpoint = TESTNET_ENDPOINT
    network = 'Testnet'
  }
  if (flags.mainnet) {
    grpcEndpoint = MAINNET_ENDPOINT
    network = 'Mainnet'
  }
  if (flags.grpc) {
    grpcEndpoint = flags.grpc
    network = `Custom GRPC endpoint: [${flags.grpc}]`
  }

  return {
    grpcEndpoint,
    network,
  }
}

module.exports = {
  getNetworkSetup,
  MAINNET_ENDPOINT,
  TESTNET_ENDPOINT,
}
