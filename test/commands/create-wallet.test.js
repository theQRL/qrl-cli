const assert = require('assert')
const {spawn} = require('child_process')

const testSetup = require('../test_setup')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// //////////////
// Failed Tests
// //////////////

// fail with no file location given
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-f',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -f flag without a valid wallet file path', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// fail missing password to encrypt wallet
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-f',
    testSetup.bobTempENCWalletLocation,
    '-p',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -p flag without a valid wallet file password', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// fail missing height
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// fail create with height 3 
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '3',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// fail height too large
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '22',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// failed on treeheight
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '13',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// fail multiple hash functions
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-3',
    '-2',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with multiple hash selection flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// //////////////
//  Passing Tests
// //////////////

// pass create default wallet to stdout
describe('create-wallet', () => {
  const args = [
    'create-wallet',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed without an argument (default settings)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// pass create default wallet to file
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-f',
    testSetup.bobTempPTWalletLocation,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -f flag and a valid wallet file path', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// pass create encrypted wallet
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-f',
    testSetup.bobTempENCWalletLocation,
    '-p',
    testSetup.bobEncPass,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -p flag and a valid wallet file password', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// pass valid treeheight
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '4',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -h flag and a valid tree height', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// pass hash selection 1
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-1',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with valid hash selection flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// pass hash 2
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-2',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with valid hash selection flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// pass hash selection 3
describe('create-wallet', () => {
  const args = [
    'create-wallet',
    '-3',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with valid hash selection flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})


