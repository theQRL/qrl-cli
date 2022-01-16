const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')

const testSetup = require('../test_setup')


const processFlags = {
  detached: true,
  stdio: 'inherit',
}
const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}


let aliceLattice
let aliceTxHash

//
describe('search setup', () => {
  let exitCode
  before(done => {
    aliceLattice = openFile(testSetup.aliceLatticeLocation) // 
    aliceTxHash = aliceLattice[0].tx_hash
    done()
  })
  it('exit code should be non-0 if passed without any arguments/flags, requires xmss address and ots index', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// search command without any flags
describe('search #1', () => {
  let exitCode
  before(done => {
    const args = [
      'search',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      'something_to_look_for_never_to_be_found',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      '15',
      '-m',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      aliceTxHash,
      '-g',
      'testnet-1.automated.theqrl.org:19009',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      'ce14f14564be176a62794088bab55a095ac82fdfa0f390fe6e8df6d2f200b2e9',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      '9999999999',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
      '-j',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      aliceTxHash,
      '-j',
      '-t',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      '15',
      '-j',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7g',
      '-t',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'search',
      'a000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd7f',
      '-t',
    ]
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
