const assert = require('assert')
const { spawn } = require('child_process')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('ots #1', () => {
  const args = [
    'ots',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without an argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('ots #2', () => {
  const args = [
    'ots',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('ots #3', () => {
  const args = [
    'ots',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f4',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
describe('ots #4', () => {
  const args = [
    'ots',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-m',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with mainnet flag and a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})
describe('ots #5', () => {
  const args = [
    'ots',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
    '-t',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with testnet flag and a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('ots #6', () => {
  const args = [
    'ots',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
    '-g',
    'invalid.theqrl.org:19009',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with dead custom grpc link and a valid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})