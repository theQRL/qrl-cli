const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');
// const fs = require('fs')

// const aliceWallet = path.join(__dirname, 'lattice/alice/alice-wallet.json')
// const aliceLaticePub = path.join(__dirname, 'lattice/alice/alice-lattice-pub.json')
const aliceSharedKeyFile = path.join(__dirname, '/../lattice/alice/forBob/aliceSharedKeyList.txt')
const alicesEncFile = path.join(__dirname, '/../lattice/bob/alicesEncMessage.enc')

const notAFile = path.join(__dirname, '/../lattice/notAKeyFile.txt')
const bigFile = path.join(__dirname, '../../render1563726016790.gif')
const bigFileOut = path.join(__dirname, '/../lattice/alice/forBob/encBigFile.txt')

const emptyFile = path.join(__dirname, '/../lattice/empty.txt')
const plaintextStdin = 'someTextHere with a space'
const alicePlaintextFile = path.join(__dirname, '/../lattice/bob/toAlice.txt')
const bobPlaintextFile = path.join(__dirname, '/../lattice/alice/toBob.txt')

// const bobWallet = path.join(__dirname, 'lattice/bob/bob-wallet.json')
// const bobLaticePub = path.join(__dirname, 'lattice/bob/bob-lattice-pub.json')
// const bobSharedKeyFile = path.join(__dirname, '/../lattice/bob/fromAlice/bobSharedKeyList.txt')
const bobsEncFile = path.join(__dirname, '/../lattice/alice/forBob/bobsEncMessage.enc')
const bobsEncFile1 = path.join(__dirname, '/../lattice/alice/forBob/bobsEncMessage1.enc')
const bobsEncJSONFile = path.join(__dirname, '/../lattice/alice/forBob/bobsEncJSONMessage.enc')
const processFlags = {
  detached: true,
  stdio: 'inherit',
}

/*
describe('Get Alice Pub TX ID from lattice tx', () => {
  const alicePubAddress = JSON.parse(fs.readFileSync(aliceWallet))[0].address
  const args = [
    'get-keys', 
    '-a', alicePubAddress, 
    '-t',
    '-f', aliceLaticePub 
  ]
  let exitCode
  before(done => {
      const process = spawn('./bin/run', args, processFlags)
      process.on('exit', code => {
        exitCode = code
        done(exitCode)
      })
    })
    it('exit code should be non-0 if passed with no args', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('Get Bob Pub TX ID from lattice tx', () => {
  const bobPubAddress = JSON.parse(fs.readFileSync(bobWallet))[0].address
  const args = [
    'get-keys', 
    '-a', bobPubAddress, 
    '-t',
    '-f', bobLaticePub 
  ]
  let exitCode
  before(done => {
      const process = spawn('./bin/run', args, processFlags)
      process.on('exit', code => {
        exitCode = code
        done(exitCode)
      })
    })
    it('exit code should be non-0 if passed with no args', () => {
    assert.strictEqual(exitCode, 0)
  })
})
*/

// //////////////////////
// fail
// /////////////////////

// No args
describe('shared-key-encrypt #1 - No args ', () => {
  const args = [
    'shared-key-encrypt',
  ]
  let exitCode
  before(done => {
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
describe(`shared-key-encrypt #2 - arg1: ${aliceSharedKeyFile}, 1 missing `, () => {
  const args = [
    'shared-key-encrypt',
    `${aliceSharedKeyFile}`,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    `${emptyFile}`,
    `${plaintextStdin}`,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    `${notAFile}`,
    `${plaintextStdin}`,
  ]
  let exitCode
  before(done => {
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
describe(`shared-key-encrypt #5 - arg1: ${aliceSharedKeyFile}, arg2: ${emptyFile} `, () => {
  const args = [
    'shared-key-encrypt',
    `${aliceSharedKeyFile}`,
    `${emptyFile}`,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    `${aliceSharedKeyFile}`,
    plaintextStdin,
    '-i',
    'f',
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    plaintextStdin,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    bobPlaintextFile,
    '-i',
    '1',
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
  it('exit code should be 0 if passed with values: {keyfile, data to encrypt, index, -j}', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// output to bobs encrypted file in json
describe('shared-key-encrypt #9 - encrypt, from file, with index, to JSON to file', () => {
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    bobPlaintextFile,
    '-i',
    '1',
    '-j',
    '-o',
    bobsEncJSONFile,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    bobPlaintextFile,
    '-i',
    '1',
    '-o',
    bobsEncFile1,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    bobPlaintextFile,
    '-o',
    bobsEncFile,
  ]
  let exitCode
  before(done => {
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
describe('shared-key-encrypt #11 - Bob encrypt for Alice, from file, with no index to file', () => {
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    alicePlaintextFile,
    '-o',
    alicesEncFile,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with values: {keyfile, data to encrypt, index, -j} for alice', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// output to bobs encrypted file
describe('shared-key-encrypt #12 - encrypt, from large file, with no index to stdout', () => {
  const args = [
    'shared-key-encrypt',
    aliceSharedKeyFile,
    bigFile,
    '-o',
    bigFileOut,

  ]
  let exitCode
  before(done => {
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
