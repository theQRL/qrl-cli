const assert = require('assert')
const {spawn} = require('child_process')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// search command without any flags
describe('search #1', () => {
  const args = [
    'search',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without any arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// search command without correct search info
describe('search #2', () => {
  const args = [
    'search',
    'something_to_look_for_never_to_be_found',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with incorrect arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// search command address lookup mainnet without flag
describe('search #3', () => {
  const args = [
    'search',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 - search command address lookup mainnet', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// search command tx lookup mainnet
describe('search #4', () => {
  const args = [
    'search',
    '15',
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
  it('exit code should be 0 - search command block lookup mainnet with -m flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// search command tx lookup grpc to testnet
describe('search #5', () => {
  const args = [
    'search',
    'ce14f14564be176a62794088bab55a095ac82fdfa0f390fe6e8df6d2f200b2e9',
    '-t',  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 - search command transaction hash lookup with manual grpc to testnet', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// search command with txHash that does not exist
describe('search #6', () => {
  const args = [
    'search',
    'ce14f14564be176a62794088bab55a095ac82fdfa0f390fe6e8df6d2f200b2e9',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if txHash not found', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// search command with block that does not exist
describe('search #7', () => {
  const args = [
    'search',
    '9999999999',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if block not found', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// search command address lookup with json flag
describe('search #8', () => {
  const args = [
    'search',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
    '-j',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 - search command address lookup with json flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// search command tx lookup with json flag
describe('search #9', () => {
  const args = [
    'search',
    'ce14f14564be176a62794088bab55a095ac82fdfa0f390fe6e8df6d2f200b2e9',
    '-j',
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
  it('exit code should be 0 - search command tx lookup with json flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// search command address lookup with bad address
describe('search #10', () => {
  const args = [
    'search',
    '15',
    '-j',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 - search command address lookup with bad address', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// search command address lookup with bad address
describe('search #11', () => {
  const args = [
    'search',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7g',
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
  it('exit code should be non-0 - search command address lookup with bad address', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// search command address lookup with bad address (not start with q)
describe('search #12', () => {
  const args = [
    'search',
    'a000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
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
  it('exit code should be non-0 - search command address lookup with bad address (not start with q)', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// txHash ce14f14564be176a62794088bab55a095ac82fdfa0f390fe6e8df6d2f200b2e9