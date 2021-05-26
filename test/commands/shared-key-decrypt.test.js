const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');

const notAFile = path.join(__dirname, '/../lattice/notAKeyFile.txt')
const emptyFile = path.join(__dirname, '/../lattice/empty.txt')

const badEncJsonCipher = path.join(__dirname, '/../lattice/badEncJson_cipher.enc') // file is missing cipher
const badEncJsonKey = path.join(__dirname, '/../lattice/badEncJson_key.enc') // file is missing key index
const badEncJsonPayload = path.join(__dirname, '/../lattice/badEncJson_payload.enc') // file is missing payload


// const encTextStdin = '022226f6f9295bd0a05a5beb6a173a36ec56598847e0b08252'
// const encJSONStdin = '{"keyIndex":1,"cipher":"aes","payload":"022226f6f9295bd0a05a5beb6a173a36ec56598847e0b08252"}'

// alices stuff
const alicesSharedKeyFile = (path.join(__dirname, '/../lattice/alice/forBob/aliceSharedKeyList.txt')).toString()
const aliceEncFile = path.join(__dirname, '/../lattice/bob/alicesEncMessage.enc') // bob's message to alice encrypted
const aliceDecryptedFile = path.join(__dirname, '/../lattice/alice/fromBobMessage.txt') // alice's message from bob plaintext output

// const alicePlaintextFile = path.join(__dirname, '/../lattice/toBob.txt') // use to verify they match

// bob's stuff
const bobsSharedKeyFile = path.join(__dirname, '/../lattice/bob/fromAlice/bobSharedKeyList.txt')
const bobsEncFile = path.join(__dirname, '/../lattice/alice/forBob/bobsEncMessage.enc')
const bobsEncJSONFile = path.join(__dirname, '/../lattice/alice/forBob/bobsEncJSONMessage.enc')
const bobDecryptedFile = path.join(__dirname, '/../lattice/bob/fromAlice/fromAliceMessage.txt')

// const bobPlaintextFile = path.join(__dirname, '/../lattice/toAlice.txt') // use to verify decrypted data matches
const bobsEncFile1 = path.join(__dirname, '/../lattice/alice/forBob/bobsEncMessage1.enc') // file encrypted using the key index 1


const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// //////////////////////
// fail
// /////////////////////

// No args
describe('shared-key-decrypt #1 - no args ', () => {
  const args = [
    'shared-key-decrypt',
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
describe('shared-key-decrypt #2 - one arg ', () => {
  const args = [
    'shared-key-decrypt',
    bobsSharedKeyFile,
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

// Empty keyfile
describe('shared-key-decrypt #3 - empty keyfile ', () => {
  const args = [
    'shared-key-decrypt',
    emptyFile,
    aliceEncFile,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-decrypt',
    notAFile,
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
  it('exit code should be non-0 if passed with bad keyfile', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// empty decrypt data file
describe('shared-key-decrypt #5 - message to decrypt is empty ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    emptyFile,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    bobsEncFile1,
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
  it('exit code should be non-0 if passed with no args', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad enc message json
describe('shared-key-decrypt #7 - badEncJsonCipher ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    badEncJsonCipher,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with badEncJsonCipher', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad badEncJsonKey
describe('shared-key-decrypt #8 - bad badEncJsonKey', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    badEncJsonKey,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with badEncJsonKey', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad badEncJsonPayload
describe('shared-key-decrypt #9 - badEncJsonPayload ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    badEncJsonPayload,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with badEncJsonPayload', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// cant write file out
describe('shared-key-decrypt #10 - bad directory out ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    bobsEncFile,
    '-o',
    '/this/directory/is/not/a/thing'
  ]
  let exitCode
  before(done => {
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

describe('PASS - shared-key-decrypt #11 - basic ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    bobsEncFile,
    // '-i',
    // '1',
    // '-o',
    // bobdecryptedFile,
  ]
  let exitCode
  before(done => {
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

describe('PASS - shared-key-decrypt #12 - basic ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    bobsEncJSONFile,
    '-i',
    '1',
    // '-o',
    // bobdecryptedFile,
  ]
  let exitCode
  before(done => {
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

describe('PASS - shared-key-decrypt #13 - alice For Bob ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    bobsEncFile,
    '-o',
    bobDecryptedFile,
  ]
  let exitCode
  before(done => {
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

describe('PASS - shared-key-decrypt #14 - bobs for alice ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    aliceEncFile,
    '-o',
    aliceDecryptedFile,
  ]
  let exitCode
  before(done => {
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



/*
// decrypt stdin data encTextStdin

describe('PASS - shared-key-decrypt #15 - encTextStdin ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    encTextStdin,
    '-i',
    '0',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with encTextStdin data', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// decrypt stdin data encTextStdin

describe('PASS - shared-key-decrypt #16 - encTextStdin ', () => {
  const args = [
    'shared-key-decrypt',
    alicesSharedKeyFile,
    encJSONStdin,
    '-i',
    '0',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with encTextStdin data', () => {
    assert.strictEqual(exitCode, 0)
  })
})




*/