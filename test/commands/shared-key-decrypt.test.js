// /* ////////////////////////
// Shared Key Decrypt Tests
// OTS Keys - 
// */ ///////////////////////

const assert = require('assert')
const {spawn} = require('child_process')
const setup = require('../setup')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// //////////////////////
// failing tests
// /////////////////////

// No args
describe('shared-key-decrypt #1 - no args ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with no args', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// One arg
describe('shared-key-decrypt #2 - one arg ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.bobSharedKeyFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with no args', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// Empty keyfile
describe('shared-key-decrypt #3 - empty keyfile ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.emptyText,
      setup.aliceEncFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with empty key file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// Not a keyfile
describe('shared-key-decrypt #4 - not a key file ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.notAKeyFile,
      setup.bobEncFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad keyfile', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// empty decrypt data file
describe('shared-key-decrypt #5 - message to decrypt is empty ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.emptyText,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with empty message', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad index
describe('shared-key-decrypt #6 - bad Index given - f ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.bobEncFile,
      '-i',
      'f',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with no args', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad enc message json
describe('shared-key-decrypt #7 - setup.badEncJsonCipher ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.badEncJsonCipher,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with setup.badEncJsonCipher', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad setup.badEncJsonKey
describe('shared-key-decrypt #8 - bad setup.badEncJsonKey', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.badEncJsonKey,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with setup.badEncJsonKey', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad setup.badEncJsonPayload
describe('shared-key-decrypt #9 - setup.badEncJsonPayload ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.badEncJsonPayload,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with setup.badEncJsonPayload', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// cant write file out
describe('shared-key-decrypt #10 - bad directory out ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.bobEncFile,
      '-o', '/this/directory/is/not/a/thing'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad directory out', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// /////////////////////
// Pass
// /////////////////////

describe('shared-key-decrypt #11 - alice decrypt ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.bobEncFile,
      '-i', '1',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with good data', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('shared-key-decrypt #12 - bob decrypt ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.bobSharedKeyFile,
      setup.aliceEncFile,
      '-i', '1',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with good data', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('shared-key-decrypt #13 - alice For Bob ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.aliceSharedKeyFile,
      setup.bobEncFile,
      '-o', setup.bobTempDecryptedFile,
      '-i', '1',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with good data', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('shared-key-decrypt #14 - bobs for alice ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-decrypt',
      setup.bobSharedKeyFile,
      setup.aliceEncFile,
      '-o', setup.aliceTempDecryptedFile,
      '-i', '1',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with good data', () => {
    assert.strictEqual(exitCode, 0)
  })
})