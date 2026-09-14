// ///////////////////////////////////////////////////////////////////////////
// grpc test
//
// src/functions/grpc.js is the client factory every network command goes
// through, and it is the only place the CLI decides whether a node is allowed
// to define the wire format it will then be asked to sign against: the node
// serves its own .proto, the CLI hashes it, and unless that digest is on the
// @theqrl/qrl-proto-sha256 allowlist no client is built. That refusal is a
// security control, so it is tested here directly rather than through a
// command.
//
// Everything in this file is offline. The one test that opens a socket points
// at a closed loopback port; the rest replace the generated Base client with a
// local stand-in, so no server is started and nothing leaves the machine.
// ///////////////////////////////////////////////////////////////////////////

const assert = require('assert')
const crypto = require('crypto')
const fs = require('fs')
const os = require('os')
const path = require('path')

const CryptoJS = require('crypto-js')
const grpcJs = require('@grpc/grpc-js')
const {QRLPROTO_SHA256} = require('@theqrl/qrl-proto-sha256')

const Qrlnode = require('../../src/functions/grpc')

// A closed port on loopback: a connection attempt fails immediately and never leaves the machine.
const DEAD_NODE = '127.0.0.1:1'

// What the stand-in node "serves" when a test wants the proto exchange to succeed. It only has
// to parse and expose qrl.PublicAPI — grpc.js builds its client from whatever the node sends.
const SERVED_PROTO = `syntax = "proto3";

package qrl;

service PublicAPI {
  rpc GetNodeState (GetNodeStateReq) returns (GetNodeStateResp);
}

message GetNodeStateReq {}

message GetNodeStateResp {
  string version = 1;
}
`

// checkProtoHash() digests the served proto with CryptoJS. A test that wants the digest to be
// accepted installs both this digest and a plain SHA-256 of the same bytes on the allowlist, so
// it keeps working if the digest is ever corrected (see the note on WordArray.create below).
const moduleDigest = text => CryptoJS.SHA256(CryptoJS.lib.WordArray.create(text)).toString(CryptoJS.enc.Hex)
const contentDigest = text => crypto.createHash('sha256').update(text).digest('hex')

// The constructor reads process.argv to find out whether the user pinned a network on the command
// line. Under mocha, argv carries the runner's own flags (`-t` is mocha's timeout), so every test
// states the argv it means instead of inheriting however mocha happened to be invoked.
// `env-paths` reads os.homedir() once, when it is first required, and on macOS the config
// directory is derived from that alone -- XDG_CONFIG_HOME is a Linux-only variable. Requiring it
// happens as soon as anything pulls in `conf`, which src/functions/grpc.js does, so by the time
// the hooks below redirect HOME the cached value is already the developer's real home. Dropping
// both modules from the require cache forces the next `new Conf()` -- including the one inside
// QrlNode -- to resolve against whatever HOME is set now.
function reloadConf() {
  delete require.cache[require.resolve('env-paths')]
  delete require.cache[require.resolve('conf')]
}

function makeNode(ipAddress, argv = ['node', 'qrl-cli', '--grpc', ipAddress]) {
  const savedArgv = process.argv
  process.argv = argv
  try {
    return new Qrlnode(ipAddress)
  } finally {
    process.argv = savedArgv
  }
}

// Replaces the generated qrl.Base client with a local object, so loadGrpcBaseProto() gets an
// answer without a socket.
function installFakeNode(getNodeInfo) {
  const realLoad = grpcJs.loadPackageDefinition
  const loadDescriptor = Object.getOwnPropertyDescriptor(grpcJs, 'loadPackageDefinition')
  Object.defineProperty(grpcJs, 'loadPackageDefinition', {
    configurable: true,
    enumerable: true,
    value: definition => {
      const packageObject = realLoad(definition)
      if (packageObject.qrl && packageObject.qrl.Base) {
        packageObject.qrl.Base = function FakeBaseClient() {
          return {getNodeInfo}
        }
      }
      return packageObject
    },
  })

  return () => {
    Object.defineProperty(grpcJs, 'loadPackageDefinition', loadDescriptor)
  }
}

// A node that answers the proto exchange with `protoText`.
const servingNode = protoText => (request, callback) => callback(null, {grpcProto: protoText})

// grpc.js writes the proto the node served into a temp file, but returns the path without
// awaiting that write, so the hash check occasionally reads the file before it is filled and
// refuses a proto that is in fact allowlisted. Every command in the CLI papers over this with a
// five-attempt reconnect loop; do the same here rather than let it show up as a flaky test.
async function connectWithRetry(node, attempts = 5) {
  let client = null
  for (let attempt = 0; attempt < attempts && client === null; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    client = await node.connect()
  }
  return client
}

describe('functions/grpc proto allowlist', () => {
  let restore = () => {}
  let allowlist

  beforeEach(() => {
    allowlist = QRLPROTO_SHA256.slice()
  })

  afterEach(() => {
    restore()
    restore = () => {}
    // Entries are only ever replaced with copies below, so the originals are still intact.
    QRLPROTO_SHA256.length = 0
    QRLPROTO_SHA256.push(...allowlist)
  })

  it('builds no client when the node serves a proto that is not on the allowlist', async () => {
    assert.ok(
      !QRLPROTO_SHA256.some(entry => entry.protoHash === moduleDigest(SERVED_PROTO)),
      'the proto used by this test must not already be allowlisted'
    )
    restore = installFakeNode(servingNode(SERVED_PROTO))

    const node = makeNode(DEAD_NODE)
    const client = await node.connect()

    assert.strictEqual(client, null, 'an unrecognised proto must not yield a client')
    assert.strictEqual(node.connection, false)
    assert.strictEqual(node.client, null)
  })

  it('builds a PublicAPI client when the served proto is on the allowlist', async () => {
    restore = installFakeNode(servingNode(SERVED_PROTO))
    QRLPROTO_SHA256.push({version: 'test', protoHash: moduleDigest(SERVED_PROTO)})
    QRLPROTO_SHA256.push({version: 'test', protoHash: contentDigest(SERVED_PROTO)})

    const node = makeNode(DEAD_NODE)
    const client = await connectWithRetry(node)

    assert.ok(client, 'an allowlisted proto must yield a client')
    assert.strictEqual(node.connection, true)
    assert.strictEqual(typeof client.GetNodeState, 'function')
    assert.strictEqual(client.GetNodeState.path, '/qrl.PublicAPI/GetNodeState')
    // The client is lazy — nothing has been dialled — but close it so no channel is left behind.
    client.close()
  })

  it('builds no client when the compiled proto object is not on the allowlist', async () => {
    restore = installFakeNode(servingNode(SERVED_PROTO))
    // Let the served file through, then take the compiled object's digest off the allowlist:
    // loadGrpcProto() must refuse rather than hand back a client.
    const withoutCliProto = QRLPROTO_SHA256.map(entry =>
      entry.cliProto ? {...entry, cliProto: 'f'.repeat(64)} : {...entry}
    )
    QRLPROTO_SHA256.length = 0
    QRLPROTO_SHA256.push(...withoutCliProto)
    QRLPROTO_SHA256.push({version: 'test', protoHash: moduleDigest(SERVED_PROTO)})
    QRLPROTO_SHA256.push({version: 'test', protoHash: contentDigest(SERVED_PROTO)})

    // Retried for the same reason connectWithRetry() exists: an attempt can fail early, at the
    // served-file check, and this test is about the later one on the compiled object.
    const node = makeNode(DEAD_NODE)
    for (let attempt = 0; attempt < 5; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      assert.strictEqual(await node.connect(), null)
      assert.strictEqual(node.connection, false)
    }
  })

  it('rejects when the node fails the proto exchange', async () => {
    restore = installFakeNode((request, callback) => callback(new Error('node refused getNodeInfo')))

    const node = makeNode(DEAD_NODE)
    await assert.rejects(node.connect(), /node refused getNodeInfo/)
    assert.strictEqual(node.connection, false)
  })

  it('rejects when nothing is listening on the endpoint', async () => {
    const node = makeNode(DEAD_NODE)
    await assert.rejects(node.connect(), /UNAVAILABLE|ECONNREFUSED/)
    assert.strictEqual(node.connection, false)
  })
})

describe('functions/grpc connection state', () => {
  it('refuses a second connect on a connected node', async () => {
    const node = makeNode(DEAD_NODE)
    node.connection = true
    await assert.rejects(node.connect(), /Already connected/)
  })

  it('drops the client on disconnect', () => {
    const node = makeNode(DEAD_NODE)
    node.connection = true
    node.client = {GetHeight: () => {}}

    node.disconnect()

    assert.strictEqual(node.connection, false)
    assert.strictEqual(node.client, null)
  })
})

describe('functions/grpc validApi', () => {
  it('accepts a method served by the qrl package', async () => {
    const node = makeNode(DEAD_NODE)
    node.client = {GetHeight: {path: '/qrl.PublicAPI/GetHeight'}}
    assert.strictEqual(await node.validApi('GetHeight'), true)
  })

  it('rejects a method served by some other package', async () => {
    const node = makeNode(DEAD_NODE)
    node.client = {GetHeight: {path: '/evil.PublicAPI/GetHeight'}}
    assert.strictEqual(await node.validApi('GetHeight'), false)
  })

  it('rejects any method when there is no client', async () => {
    const node = makeNode(DEAD_NODE)
    assert.strictEqual(await node.validApi('GetHeight'), false)
  })
})

describe('functions/grpc api', () => {
  it('resolves with what the node returned', async () => {
    const node = makeNode(DEAD_NODE)
    node.connection = true
    node.client = {
      GetHeight: (request, callback) => callback(null, {height: 42, echoed: request}),
    }

    assert.deepStrictEqual(await node.api('GetHeight', {query: 'x'}), {height: 42, echoed: {query: 'x'}})
    // No request given: the call still goes out, with an empty one.
    assert.deepStrictEqual(await node.api('GetHeight'), {height: 42, echoed: {}})
  })

  it('rejects when the node returns an error', async () => {
    const node = makeNode(DEAD_NODE)
    node.connection = true
    node.client = {
      PushTransaction: (request, callback) => callback(new Error('16 UNAUTHENTICATED')),
    }

    await assert.rejects(node.api('PushTransaction', {}), /UNAUTHENTICATED/)
  })

  it('rejects for a method the node does not serve', async () => {
    const node = makeNode(DEAD_NODE)
    node.connection = true
    node.client = {GetHeight: (request, callback) => callback(null, {})}

    await assert.rejects(node.api('NotAMethod', {}), /not a function/)
  })

  it('reconnects, and fails, when called before connect', async () => {
    // api() calls connect() but does not await it, so the reconnect path can only ever fail:
    // it indexes the pending promise as if it were the client. Pinned deliberately — if api()
    // is fixed to await, this should become an assertion on the resolved response.
    const node = makeNode(DEAD_NODE)
    let connectCalls = 0
    node.connect = () => {
      connectCalls += 1
      return Promise.resolve({GetHeight: (request, callback) => callback(null, {height: 1})})
    }

    await assert.rejects(node.api('GetHeight', {}), /not a function/)
    assert.strictEqual(connectCalls, 1, 'api() must have tried to reconnect')
  })
})

// The endpoint a QrlNode talks to is a security property: the default is a remote node reached
// over plaintext gRPC, and the config file and environment can each redirect it. These tests
// point the config directory at a temp dir so the developer's real qrl-cli config is untouched.
describe('functions/grpc endpoint precedence', () => {
  const CONFIG_ENV = ['XDG_CONFIG_HOME', 'HOME', 'APPDATA', 'LOCALAPPDATA']
  const NETWORK_ENV = ['QRL_NETWORK', 'QRL_GRPC_ENDPOINT']
  const MAINNET_ENDPOINT = 'mainnet-3.automated.theqrl.org:19009'
  const TESTNET_ENDPOINT = 'testnet-3.automated.theqrl.org:19009'
  const GIVEN = 'given.example.org:19009'
  // No network flag on the command line: this is what lets the config and environment be read.
  const NO_FLAGS = ['node', 'qrl-cli', 'status']

  let saved
  let tempHome
  let config

  before(() => {
    saved = {}
    CONFIG_ENV.concat(NETWORK_ENV).forEach(key => {
      saved[key] = process.env[key]
    })
    // env-paths picks a different variable per platform, so redirect all of them.
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'qrl-cli-grpc-'))
    CONFIG_ENV.forEach(key => {
      process.env[key] = tempHome
    })
    NETWORK_ENV.forEach(key => {
      delete process.env[key]
    })
    reloadConf()

    // eslint-disable-next-line global-require
    const Conf = require('conf')
    config = new Conf({projectName: 'qrl-cli'})
    assert.ok(config.path.startsWith(tempHome), 'config must be isolated to the temp dir')
  })

  beforeEach(() => {
    config.clear()
    NETWORK_ENV.forEach(key => {
      delete process.env[key]
    })
  })

  after(() => {
    config.clear()
    CONFIG_ENV.concat(NETWORK_ENV).forEach(key => {
      if (saved[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = saved[key]
      }
    })
    // Leave the real home resolving normally for whatever runs next.
    reloadConf()
    fs.rmSync(tempHome, {recursive: true, force: true})
  })

  it('keeps the given endpoint when nothing else is configured', () => {
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, GIVEN)
  })

  it('prefers QRL_GRPC_ENDPOINT over everything else', () => {
    process.env.QRL_GRPC_ENDPOINT = 'env.example.org:19009'
    process.env.QRL_NETWORK = 'testnet'
    config.set('grpc-endpoint', 'config.example.org:19009')
    config.set('default-network', 'mainnet')
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, 'env.example.org:19009')
  })

  it('falls back to the configured grpc-endpoint', () => {
    process.env.QRL_NETWORK = 'testnet'
    config.set('grpc-endpoint', 'config.example.org:19009')
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, 'config.example.org:19009')
  })

  it('uses testnet from QRL_NETWORK', () => {
    process.env.QRL_NETWORK = 'testnet'
    config.set('default-network', 'mainnet')
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, TESTNET_ENDPOINT)
  })

  it('uses testnet from the config file', () => {
    config.set('default-network', 'testnet')
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, TESTNET_ENDPOINT)
  })

  it('uses mainnet from QRL_NETWORK', () => {
    process.env.QRL_NETWORK = 'mainnet'
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, MAINNET_ENDPOINT)
  })

  it('uses mainnet from the config file', () => {
    config.set('default-network', 'mainnet')
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, MAINNET_ENDPOINT)
  })

  it('ignores an unknown configured network', () => {
    config.set('default-network', 'devnet')
    assert.strictEqual(makeNode(GIVEN, NO_FLAGS).ipAddress, GIVEN)
  })

  it('lets an explicit --grpc flag override the config', () => {
    config.set('grpc-endpoint', 'config.example.org:19009')
    assert.strictEqual(makeNode(GIVEN, ['node', 'qrl-cli', 'status', '--grpc', GIVEN]).ipAddress, GIVEN)
  })

  it('lets an explicit -t flag override the config', () => {
    config.set('grpc-endpoint', 'config.example.org:19009')
    assert.strictEqual(makeNode(GIVEN, ['node', 'qrl-cli', 'status', '-t']).ipAddress, GIVEN)
  })

  it('lets an explicit -m flag override the config', () => {
    config.set('grpc-endpoint', 'config.example.org:19009')
    assert.strictEqual(makeNode(GIVEN, ['node', 'qrl-cli', 'status', '-m']).ipAddress, GIVEN)
  })
})
