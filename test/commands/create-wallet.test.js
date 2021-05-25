const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');

const aliceWalletLocation = path.join(__dirname, '/../lattice/alice/alice-wallet.json')
const bobWalletLocation = path.join(__dirname, '/../lattice/bob/bob-wallet.json')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('create-wallet #1', () => {
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

describe('create-wallet #2', () => {
  const args = [
    'create-wallet',
    '-f',
    '/tmp/wallet.json',
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

describe('create-wallet #3', () => {
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

describe('create-wallet #4', () => {
  const args = [
    'create-wallet',
    '-f',
    '/tmp/wallet.json',
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

describe('create-wallet #5', () => {
  const args = [
    'create-wallet',
    '-f',
    '/tmp/wallet.json',
    '-p',
    'test123',
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

describe('create-wallet #6', () => {
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

describe('create-wallet #7', () => {
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

describe('create-wallet #8', () => {
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

describe('create-wallet #9', () => {
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

describe('create-wallet #10', () => {
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

describe('create-wallet #11', () => {
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

describe('create-wallet #12', () => {
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

describe('create-wallet #13', () => {
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

describe('create-wallet #14', () => {
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

describe('create-wallet #15 alice', () => {
  console.log(`aliceWalletLocation ${aliceWalletLocation}`)
  const args = [
    'create-wallet',
    '-3',
    '-f',
    aliceWalletLocation,
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
    assert.strictEqual(exitCode, 0)
  })
})


describe('create-wallet #16 bob', () => {
  console.log(`aliceWalletLocation ${aliceWalletLocation}`)
  const args = [
    'create-wallet',
    '-3',
    '-f',
    bobWalletLocation,
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
    assert.strictEqual(exitCode, 0)
  })
})
