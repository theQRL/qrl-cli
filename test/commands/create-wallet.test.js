const assert = require('assert')
const {spawn} = require('child_process')
const setup = require('../setup')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('create-wallet #1', () => {
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
    ]
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
  let exitCode
  before(done => {
    const args = [
     'create-wallet',
     '-f', setup.aliceTempPTWalletLocation,
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-f',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-f', setup.bobTempPTWalletLocation,
      '-p',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-f', setup.aliceTempENCWalletLocation,
      '-p', setup.aliceEncPass,
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-h',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-h', '3',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-h', '22',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-h', '13',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-h', '4',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-1',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-2',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-3',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-3',
      '-2',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-3',
      '-f',
      setup.aliceTempPTWalletLocation,
    ]
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
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-3',
      '-f',
      setup.bobTempPTWalletLocation,
    ]
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
describe('create-wallet #17 bobEnc', () => {
  let exitCode
  before(done => {
    const args = [
      'create-wallet',
      '-3',
      '-f', setup.bobTempENCWalletLocation,
      '-p', setup.bobEncPass,
    ]
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

