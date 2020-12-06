const assert = require('assert')
const {spawn} = require('child_process')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('balance #1', () => {
  const args = [
    'balance',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-a',
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
  it('exit code should be non-0 if API is down', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('balance #2', () => {
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

describe('balance #3', () => {
  const args = ['balance', 'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3']
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

describe('balance #4', () => {
  const args = ['balance', 'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3', '-s']
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

describe('balance #5', () => {
  const args = ['balance', 'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3', '-q']
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

describe('balance #6', () => {
  const args = ['balance', 'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3', '-s', '-q']
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address, -s and -q flags', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('balance #7', () => {
  const args = ['balance', 'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f4']
  let exitCode
  before((done) => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
