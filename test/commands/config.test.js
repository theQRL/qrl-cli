const assert = require('assert')
const { spawn } = require('child_process')

const processFlags = {
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit'],
}

describe('config command tests', () => {
  it('exit code should be 0 when listing config', (done) => {
    const process = spawn('./bin/run', ['config', 'list'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 0)
      done()
    })
  })

  it('exit code should be 0 when setting a config key', (done) => {
    const process = spawn('./bin/run', ['config', 'set', 'default-network', 'testnet'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 0)
      done()
    })
  })

  it('exit code should be 0 when getting a config key', (done) => {
    const process = spawn('./bin/run', ['config', 'get', 'default-network'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 0)
      done()
    })
  })

  it('exit code should be 0 when deleting a config key', (done) => {
    const process = spawn('./bin/run', ['config', 'delete', 'default-network'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 0)
      done()
    })
  })

  it('exit code should be 1 when setting an invalid network key', (done) => {
    const process = spawn('./bin/run', ['config', 'set', 'default-network', 'invalidnet'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 1)
      done()
    })
  })
})
