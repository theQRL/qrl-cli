// /* ////////////////////////
// Balance Test
// 
// */ ///////////////////////


const assert = require('assert')
const {spawn} = require('child_process')
const setup = require('../setup')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// no args
describe('balance #1', () => {
  const args = ['balance']
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without an argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address
describe('balance #2', () => {
  const args = [
  'balance',
  'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address- too short', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
// bad address
describe('balance #3', () => {
  const args = [
  'balance',
  'a010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address- starts with a', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address file
describe('balance #4', () => {
  const args = [
  'balance',
  '/tmp/notAnAddress',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address- not an address file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad encrypted address file password
describe('balance #5', () => {
  const args = [
  'balance',
  setup.aliceENCWalletLocation,
  '-p',
  'notThePass',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address password- wrong password', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('balance #6', () => {
  const args = [
    'balance',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-s',
    '-q',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with a valid address, and both -s and -q flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// not valid grpc address
describe('balance #7', () => {
  const args = [
    'balance',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-g',
    'https://brooklyn.theqrl.org/nottheapi/',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if API is down or Node address invalid', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('balance #8', () => {
  const args = [
    'balance',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3'
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('balance #9', () => {
  const args = [
    'balance',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-s'
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address and a -s flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success -q
describe('balance #10', () => {
  const args = [
    'balance', 
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-q',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address and -q flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success testnet
describe('balance #11', () => {
  const args = [
    'balance', 
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-t',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address and a -q flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success mainnet
describe('balance #12', () => {
  const args = [
    'balance', 
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-m',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address and a -q flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success wallet file
describe('balance #13', () => {
  const args = [
    'balance', 
    setup.bobPTWalletLocation,
    '-t',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address and a -q flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success enc-wallet file
describe('balance #14', () => {
  const args = [
    'balance', 
    setup.aliceENCWalletLocation,
    '-p', setup.aliceEncPass,
    '-t',
  ]
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address and password flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})