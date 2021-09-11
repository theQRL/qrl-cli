// /* ////////////////////////
// Status Test
// OTS Keys - 
// */ ///////////////////////
const assert = require('assert')
const {spawn} = require('child_process')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('status #1', () => {
  const args = [
    'status',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed without any arguments (default mainnet)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('status #2', () => {
  const args = [
    'status',
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
  it('exit code should be 0 if passed with -m mainnet flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('status #3', () => {
  const args = ['status', '-t']
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -t testnet flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('status #5', () => {
  const args = ['status', '-g', 'mainnet-1.automated.theqrl.org:19009']
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -g and valid custom grpc endpoint', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('status #6', () => {
  const args = ['status', '-g']
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -g and missing grpc endpoint', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('status #7', () => {
  const args = ['status', '-g', 'invalid.theqrl.org']
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -g and a bad grpc endpoint', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// need to inject false proto shasums to test lines 40, 41 and 49
