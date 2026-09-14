// ///////////////////////////////////////////////////////////////////////////
// network-helper test
//
// getNetworkSetup decides which node every spending command talks to, so its
// precedence order is a security property, not a convenience: the no-flag
// default is a *remote* endpoint spoken to over plaintext gRPC, and each layer
// below can silently redirect the CLI somewhere else.
//
// The config layer is read from disk at call time, so these tests redirect the
// config directory to a temp dir before requiring the module, and restore the
// environment afterwards. Nothing here touches the developer's real qrl-cli
// config, and nothing contacts a node.
// ///////////////////////////////////////////////////////////////////////////

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')

const CONFIG_ENV = ['XDG_CONFIG_HOME', 'HOME', 'APPDATA', 'LOCALAPPDATA']
const NETWORK_ENV = ['QRL_NETWORK', 'QRL_GRPC_ENDPOINT']

const MODULE_PATH = require.resolve('../../src/functions/network-helper')
const CONF_PATH = require.resolve('conf')
// `env-paths` reads os.homedir() once, when it is first required, and on macOS the config
// directory is derived from that alone -- XDG_CONFIG_HOME is a Linux-only variable. Unless it is
// dropped from the require cache too, redirecting HOME below leaves `conf` pointing at the
// developer's real configuration.
const ENV_PATHS_PATH = require.resolve('env-paths')

let saved
let tempHome
let config
let getNetworkSetup
let MAINNET_ENDPOINT
let TESTNET_ENDPOINT

describe('functions/network-helper', () => {
  before(() => {
    saved = {}
    CONFIG_ENV.concat(NETWORK_ENV).forEach(k => {
      saved[k] = process.env[k]
    })

    // env-paths resolves the config directory from these, and differs per platform, so set
    // all of them rather than assuming the CI runner's OS.
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'qrl-cli-network-helper-'))
    CONFIG_ENV.forEach(k => {
      process.env[k] = tempHome
    })

    // The module instantiates Conf at load time, so it has to be (re)loaded after the
    // environment is redirected.
    delete require.cache[MODULE_PATH]
    delete require.cache[CONF_PATH]
    delete require.cache[ENV_PATHS_PATH]
    // eslint-disable-next-line global-require
    const Conf = require('conf')
    config = new Conf({projectName: 'qrl-cli'})
    assert.ok(config.path.startsWith(tempHome), 'config must be isolated to the temp dir')

    // eslint-disable-next-line global-require
    const helper = require('../../src/functions/network-helper')
    getNetworkSetup = helper.getNetworkSetup
    MAINNET_ENDPOINT = helper.MAINNET_ENDPOINT
    TESTNET_ENDPOINT = helper.TESTNET_ENDPOINT
  })

  after(() => {
    Object.keys(saved).forEach(k => {
      if (saved[k] === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = saved[k]
      }
    })
    delete require.cache[MODULE_PATH]
    delete require.cache[CONF_PATH]
    delete require.cache[ENV_PATHS_PATH]
    fs.rmSync(tempHome, {recursive: true, force: true})
  })

  beforeEach(() => {
    config.clear()
    NETWORK_ENV.forEach(k => delete process.env[k])
  })

  describe('the default, with nothing configured', () => {
    it('is mainnet', () => {
      assert.deepStrictEqual(getNetworkSetup({}), {
        grpcEndpoint: MAINNET_ENDPOINT,
        network: 'Mainnet',
      })
    })

    it('is a remote host, not loopback', () => {
      // Worth asserting explicitly: it means the plaintext gRPC exchange leaves the machine
      // by default, which is the attacker position the transaction binding exists to defend
      // against. No flag is required to reach it.
      const [host] = MAINNET_ENDPOINT.split(':')
      assert.ok(!['127.0.0.1', 'localhost', '::1'].includes(host), 'default endpoint is remote')
      assert.strictEqual(MAINNET_ENDPOINT, 'mainnet-3.automated.theqrl.org:19009')
      assert.strictEqual(TESTNET_ENDPOINT, 'testnet-3.automated.theqrl.org:19009')
    })
  })

  describe('layer 1 — stored config', () => {
    it('honours default-network', () => {
      config.set('default-network', 'testnet')
      assert.deepStrictEqual(getNetworkSetup({}), {
        grpcEndpoint: TESTNET_ENDPOINT,
        network: 'Testnet',
      })
    })

    it('ignores an unrecognised default-network', () => {
      config.set('default-network', 'devnet')
      assert.strictEqual(getNetworkSetup({}).grpcEndpoint, MAINNET_ENDPOINT)
    })

    it('honours grpc-endpoint', () => {
      config.set('grpc-endpoint', '10.0.0.5:19009')
      assert.deepStrictEqual(getNetworkSetup({}), {
        grpcEndpoint: '10.0.0.5:19009',
        network: 'Custom GRPC endpoint: [10.0.0.5:19009]',
      })
    })

    it('lets a stored grpc-endpoint override a stored default-network', () => {
      config.set('default-network', 'testnet')
      config.set('grpc-endpoint', '10.0.0.5:19009')
      assert.strictEqual(getNetworkSetup({}).grpcEndpoint, '10.0.0.5:19009')
    })
  })

  describe('layer 2 — environment', () => {
    it('QRL_NETWORK selects testnet', () => {
      process.env.QRL_NETWORK = 'testnet'
      assert.strictEqual(getNetworkSetup({}).grpcEndpoint, TESTNET_ENDPOINT)
    })

    it('QRL_NETWORK=mainnet overrides a stored testnet default', () => {
      config.set('default-network', 'testnet')
      process.env.QRL_NETWORK = 'mainnet'
      assert.deepStrictEqual(getNetworkSetup({}), {
        grpcEndpoint: MAINNET_ENDPOINT,
        network: 'Mainnet',
      })
    })

    it('ignores an unrecognised QRL_NETWORK', () => {
      process.env.QRL_NETWORK = 'nonsense'
      assert.strictEqual(getNetworkSetup({}).grpcEndpoint, MAINNET_ENDPOINT)
    })

    it('QRL_GRPC_ENDPOINT overrides a stored grpc-endpoint', () => {
      config.set('grpc-endpoint', '10.0.0.5:19009')
      process.env.QRL_GRPC_ENDPOINT = '10.0.0.9:19009'
      assert.deepStrictEqual(getNetworkSetup({}), {
        grpcEndpoint: '10.0.0.9:19009',
        network: 'Custom GRPC endpoint: [10.0.0.9:19009]',
      })
    })
  })

  describe('layer 3 — command-line flags, which win', () => {
    it('--testnet overrides the environment', () => {
      process.env.QRL_NETWORK = 'mainnet'
      assert.strictEqual(getNetworkSetup({testnet: true}).grpcEndpoint, TESTNET_ENDPOINT)
    })

    it('--mainnet overrides a stored and an environment testnet', () => {
      config.set('default-network', 'testnet')
      process.env.QRL_NETWORK = 'testnet'
      assert.strictEqual(getNetworkSetup({mainnet: true}).grpcEndpoint, MAINNET_ENDPOINT)
    })

    it('--grpc beats every other layer', () => {
      config.set('default-network', 'testnet')
      config.set('grpc-endpoint', '10.0.0.5:19009')
      process.env.QRL_NETWORK = 'mainnet'
      process.env.QRL_GRPC_ENDPOINT = '10.0.0.9:19009'
      assert.deepStrictEqual(getNetworkSetup({grpc: '127.0.0.1:19009'}), {
        grpcEndpoint: '127.0.0.1:19009',
        network: 'Custom GRPC endpoint: [127.0.0.1:19009]',
      })
    })

    it('--mainnet wins when both network flags are passed', () => {
      // Not obviously desirable, but it is the current behaviour: mainnet is tested last and
      // therefore wins. Pinned so a reordering of those checks cannot silently move a user
      // from testnet to mainnet.
      assert.strictEqual(
        getNetworkSetup({testnet: true, mainnet: true}).grpcEndpoint,
        MAINNET_ENDPOINT
      )
    })

    it('--grpc still wins when a network flag is also passed', () => {
      assert.strictEqual(
        getNetworkSetup({mainnet: true, grpc: '127.0.0.1:19009'}).grpcEndpoint,
        '127.0.0.1:19009'
      )
    })
  })

  describe('the network label', () => {
    it('names the custom endpoint so the user can see where they are pointed', () => {
      assert.strictEqual(
        getNetworkSetup({grpc: 'evil.example:19009'}).network,
        'Custom GRPC endpoint: [evil.example:19009]'
      )
    })
  })
})
