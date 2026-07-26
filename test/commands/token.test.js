const assert = require('assert')
const { spawn } = require('child_process')

const processFlags = {
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit'],
}

describe('token:create basic tests', () => {
  it('exit code should be 1 if run without any arguments', (done) => {
    const process = spawn('./bin/run', ['token:create'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 1)
      done()
    })
  })

  it('exit code should be 1 if run with missing required options (name, symbol)', (done) => {
    const process = spawn('./bin/run', ['token:create', '--symbol', 'TST'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 1)
      done()
    })
  })
})

describe('token:transfer basic tests', () => {
  it('exit code should be 1 if run without any arguments', (done) => {
    const process = spawn('./bin/run', ['token:transfer'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 1)
      done()
    })
  })

  it('exit code should be 1 if run with invalid token hash', (done) => {
    const process = spawn('./bin/run', ['token:transfer', '--tokenHash', 'invalidhash'], processFlags)
    process.on('exit', (code) => {
      assert.strictEqual(code, 1)
      done()
    })
  })
})
