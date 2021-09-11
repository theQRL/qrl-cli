// /* ////////////////////////
// Shared Key Encrypt Test
// OTS Keys - 
// */ ///////////////////////


const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');
const setup = require('../setup')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

const notAFile = path.join(__dirname, '/../lattice/notAKeyFile.txt')
const emptyFile = path.join(__dirname, '/../lattice/empty.txt')
const plaintextStdin = 'someTextHere with a space'

// //////////////////////
// fail
// /////////////////////

// No args
describe('shared-key-encrypt #1 - No args ', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
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
describe(`shared-key-encrypt #2 - arg1: 1 missing `, () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with one arg', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// Empty keyfile
describe(`shared-key-encrypt #3 - arg1: ${emptyFile}, arg2: ${plaintextStdin} `, () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.emptyText,
      plaintextStdin,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with empty keyfile', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// Not a keyfile
describe(`shared-key-encrypt #4 - arg1: ${notAFile}, arg2: ${plaintextStdin} `, () => {
  let exitCode
  before(done => {
    const args = [
     'shared-key-encrypt',
     notAFile,
     plaintextStdin,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with locked root keyfile', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// empty encrypt data file
describe(`shared-key-encrypt #5 - arg1: aliceSharedKeyFile, arg2: emptyFile `, () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.emptyText,
      setup.aliceSharedKeyFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with empty keyfile', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// Bad Index
describe('shared-key-encrypt #6 - Bad index (f)', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
      plaintextStdin,
      '-i', 'f',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad index value', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// //////////////////////
// succeed
// /////////////////////

// without index output to stdin with plaintextSTDIN
describe('shared-key-encrypt #7 - Basic encrypt, no index to stdin', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
      plaintextStdin,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with basic values, {keyfile, data to encrypt}', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// with index, output to stdin JSON, with plaintext file
describe('shared-key-encrypt #8 - encrypt, with index, to JSON stdin', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
      setup.aliceToBob,
      '-i', '1',
      '-j',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with values: {keyfile, data to encrypt, index, -j}', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// output to bobs encrypted file in json
describe('shared-key-encrypt #9 - encrypt, from file, with index, to JSON to file', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
      setup.aliceToBob,
      '-i', '1',
      '-j',
      '-o', setup.bobTempEncJSONFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with values: {keyfile, data to encrypt, index, -j}', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// output to bobs encrypted file
describe('shared-key-encrypt #10 - encrypt, from file, with index to file', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
      setup.aliceToBob,
      '-i', '1',
      '-o', setup.bobTempEncFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with values: {keyfile, data to encrypt, index, -j}', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// output to bobs encrypted file
describe('shared-key-encrypt #11 - Alice encrypt for bob, from file, with no index to file', () => {
  let exitCode
  before(done => {
    const args = [
      'shared-key-encrypt',
      setup.aliceSharedKeyFile,
      setup.aliceToBob,
      '-o', setup.bobTempEncFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with values: {keyfile, data to encrypt, index, -j} for bob', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// output to bobs encrypted file
describe('shared-key-encrypt #12 - encrypt, from large file, with no index to stdout', () => {
  let exitCode
  before(done => {
  const args = [
    'shared-key-encrypt',
    setup.aliceSharedKeyFile,
    setup.bigFile,
    '-o', setup.bigFileOut,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if success, large file (gif)', () => {
    assert.strictEqual(exitCode, 0)
  })
})
