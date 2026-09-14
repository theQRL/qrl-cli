// ///////////////////////////////////////////////////////////////////////////
// config command tests
//
// `qrl-cli config` is entirely local: it reads and writes a `conf` store on
// disk. That store is the first layer of the endpoint-precedence chain used by
// every command that talks to a node, so a wrong value here silently redirects
// the whole CLI -- which is why each case below asserts on the message the user
// is shown, not only on the exit code.
//
// Every child process is spawned with the config directory redirected to a
// throwaway temp dir. Without that these tests would write to (and delete keys
// from) the real qrl-cli config of whoever runs the suite. `env-paths`, which
// `conf` uses, resolves that directory differently per platform, so all four
// candidate variables are set rather than assuming the runner's OS.
//
// Nothing here contacts a node.
// ///////////////////////////////////////////////////////////////////////////

const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const {spawn} = require('child_process')

let tempHome
let childEnv

// kleur still colours its output when stdout is a pipe, so strip the escapes
// before matching on the message text.
const ANSI = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g')

// Where `conf` puts the store once the child has been pointed at `home`. `env-paths` builds
// that path differently per platform, and only the Linux branch reads XDG_CONFIG_HOME -- macOS
// and Windows derive it from the home directory and APPDATA -- so the layout has to be mirrored
// here rather than assumed.
function configDir(home) {
  if (process.platform === 'darwin') {
    return path.join(home, 'Library', 'Preferences', 'qrl-cli-nodejs')
  }
  if (process.platform === 'win32') {
    return path.join(home, 'qrl-cli-nodejs', 'Config')
  }
  return path.join(home, 'qrl-cli-nodejs')
}

// Run the CLI against the throwaway config store and capture what it said.
function run(args) {
  return new Promise(resolve => {
    const child = spawn('./bin/run', args, {stdio: ['ignore', 'pipe', 'pipe'], env: childEnv})
    let out = ''
    child.stdout.on('data', d => {
      out += d.toString()
    })
    child.stderr.on('data', d => {
      out += d.toString()
    })
    child.on('close', code => resolve({code, out: out.replace(ANSI, '')}))
  })
}

describe('config command tests', () => {
  before(() => {
    tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'qrl-cli-config-test-'))
    childEnv = {
      ...process.env,
      HOME: tempHome,
      XDG_CONFIG_HOME: tempHome,
      APPDATA: tempHome,
      LOCALAPPDATA: tempHome,
    }
  })

  after(() => {
    fs.rmSync(tempHome, {recursive: true, force: true})
  })

  // ------------------------------------------------------------------
  // The original cases, kept intact, now with the message asserted too.
  // ------------------------------------------------------------------

  it('exit code should be 0 when listing config', async () => {
    // Runs first, against a store that has never been written: the empty branch.
    const {code, out} = await run(['config', 'list'])
    assert.strictEqual(code, 0)
    assert.ok(/No configuration values set/.test(out), out)
  })

  it('exit code should be 0 when setting a config key', async () => {
    const {code, out} = await run(['config', 'set', 'default-network', 'testnet'])
    assert.strictEqual(code, 0)
    assert.ok(/set to testnet/.test(out), out)
  })

  it('exit code should be 0 when getting a config key', async () => {
    const {code, out} = await run(['config', 'get', 'default-network'])
    assert.strictEqual(code, 0)
    assert.strictEqual(out.trim(), 'testnet')
  })

  it('exit code should be 0 when deleting a config key', async () => {
    const {code, out} = await run(['config', 'delete', 'default-network'])
    assert.strictEqual(code, 0)
    assert.ok(/deleted/.test(out), out)
  })

  it('exit code should be 1 when setting an invalid network key', async () => {
    const {code, out} = await run(['config', 'set', 'default-network', 'invalidnet'])
    assert.strictEqual(code, 1)
    assert.ok(/Invalid value for default-network/.test(out), out)
  })

  // ------------------------------------------------------------------
  // The store really is isolated. If this fails, every case above has
  // been mutating the developer's own configuration.
  // ------------------------------------------------------------------

  it('writes only to the redirected config directory', async () => {
    await run(['config', 'set', 'grpc-endpoint', '127.0.0.1:19009'])
    const stored = path.join(configDir(tempHome), 'config.json')
    assert.ok(fs.existsSync(stored), `expected a config file at ${stored}`)
    assert.match(fs.readFileSync(stored, 'utf8'), /127\.0\.0\.1:19009/)
    await run(['config', 'delete', 'grpc-endpoint'])
  })

  // ------------------------------------------------------------------
  // No action: the usage banner.
  // ------------------------------------------------------------------

  it('prints usage and exits 0 when given no action', async () => {
    const {code, out} = await run(['config'])
    assert.strictEqual(code, 0)
    assert.ok(/Usage: qrl-cli config \[get\|set\|list\|delete\]/.test(out), out)
    // The banner has to name the keys it accepts, or `list` is the only way to
    // discover them.
    assert.ok(/default-network/.test(out), out)
    assert.ok(/grpc-endpoint/.test(out), out)
  })

  // ------------------------------------------------------------------
  // list
  // ------------------------------------------------------------------

  it('lists every stored key once values exist', async () => {
    await run(['config', 'set', 'default-network', 'mainnet'])
    await run(['config', 'set', 'grpc-endpoint', '127.0.0.1:19009'])
    const {code, out} = await run(['config', 'list'])
    assert.strictEqual(code, 0)
    assert.ok(/default-network: mainnet/.test(out), out)
    assert.ok(/grpc-endpoint: 127\.0\.0\.1:19009/.test(out), out)
    await run(['config', 'delete', 'default-network'])
    await run(['config', 'delete', 'grpc-endpoint'])
  })

  // ------------------------------------------------------------------
  // get
  // ------------------------------------------------------------------

  it('refuses `get` with no key', async () => {
    const {code, out} = await run(['config', 'get'])
    assert.strictEqual(code, 1)
    assert.ok(/Missing key\. Usage: qrl-cli config get <key>/.test(out), out)
  })

  it('reports an unset key as unset rather than as empty', async () => {
    // Distinguishing "not set" from "set to nothing" matters: the caller uses
    // this to decide whether to fall back to the built-in default endpoint.
    const {code, out} = await run(['config', 'get', 'never-set-by-any-test'])
    assert.strictEqual(code, 0)
    assert.ok(/is not set/.test(out), out)
  })

  // ------------------------------------------------------------------
  // set
  // ------------------------------------------------------------------

  it('refuses `set` with no key and no value', async () => {
    const {code, out} = await run(['config', 'set'])
    assert.strictEqual(code, 1)
    assert.ok(/Missing key or value/.test(out), out)
  })

  it('refuses `set` with a key but no value', async () => {
    const {code, out} = await run(['config', 'set', 'grpc-endpoint'])
    assert.strictEqual(code, 1)
    assert.ok(/Missing key or value/.test(out), out)
  })

  it('accepts mainnet for default-network', async () => {
    const {code, out} = await run(['config', 'set', 'default-network', 'mainnet'])
    assert.strictEqual(code, 0)
    assert.ok(/set to mainnet/.test(out), out)
    await run(['config', 'delete', 'default-network'])
  })

  it('only validates the value of default-network, not of other keys', async () => {
    // Pinning current behaviour: an arbitrary key/value pair is stored without
    // checking. Worth knowing, because `grpc-endpoint` is one such key and it
    // decides which host the CLI speaks plaintext gRPC to.
    const {code, out} = await run(['config', 'set', 'grpc-endpoint', 'not-a-real-endpoint'])
    assert.strictEqual(code, 0)
    assert.ok(/set to not-a-real-endpoint/.test(out), out)
    const got = await run(['config', 'get', 'grpc-endpoint'])
    assert.strictEqual(got.out.trim(), 'not-a-real-endpoint')
    await run(['config', 'delete', 'grpc-endpoint'])
  })

  // ------------------------------------------------------------------
  // delete / remove
  // ------------------------------------------------------------------

  it('refuses `delete` with no key', async () => {
    const {code, out} = await run(['config', 'delete'])
    assert.strictEqual(code, 1)
    assert.ok(/Missing key\. Usage: qrl-cli config delete <key>/.test(out), out)
  })

  it('accepts `remove` as an alias for `delete`', async () => {
    await run(['config', 'set', 'default-network', 'testnet'])
    const {code, out} = await run(['config', 'remove', 'default-network'])
    assert.strictEqual(code, 0)
    assert.ok(/deleted/.test(out), out)
    const got = await run(['config', 'get', 'default-network'])
    assert.ok(/is not set/.test(got.out), got.out)
  })

  it('reports success deleting a key that was never set', async () => {
    const {code, out} = await run(['config', 'delete', 'never-set-by-any-test'])
    assert.strictEqual(code, 0)
    assert.ok(/deleted/.test(out), out)
  })

  // ------------------------------------------------------------------
  // Anything else
  // ------------------------------------------------------------------

  it('refuses an unknown action', async () => {
    const {code, out} = await run(['config', 'bogus'])
    assert.strictEqual(code, 1)
    assert.ok(/Unknown action: bogus/.test(out), out)
  })
})
