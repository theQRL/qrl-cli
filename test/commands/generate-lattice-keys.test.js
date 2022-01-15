const assert = require('assert')
const {spawn} = require('child_process')
const testSetup = require('../test_setup')


const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// lattice command without any flags
describe('generate-lattice-keys #1', () => {
  const args = [
    'generate-lattice-keys',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without any arguments/flags, requires xmss address and ots index', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// wrong grpc endpoint
describe('generate-lattice-keys #2', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-b',
    '-g',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -g and missing grpc endpoint', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// incorrect seed
describe('generate-lattice-keys #3', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb139',
    '-t',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -s and incorrect hexseed', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})



// incorrect data in wallet.json
describe('generate-lattice-keys #4', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-w',
    testSetup.badWallet,
    '-t',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -w and incorrect wallet.json file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// print keys to console if no file location given and not broadcast
describe('generate-lattice-keys #5', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-t',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys printed to console and not broadcast', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// print keys to console in json if no file location given and not broadcast in json
describe('generate-lattice-keys #6', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-t',
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
  it('exit code should be 0 with keys printed to console in and not broadcast', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// print keys to console in json encrypted if no file location given and not broadcast in json
describe('generate-lattice-keys #7', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-t',
    '-j',
    '-e',
    testSetup.encPass,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys printed to console encrypted locally', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// print keys to file location given
describe('generate-lattice-keys #8', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '10',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-c',
    testSetup.aliceTempLatticeKey,
    '-t',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys printed to file not broadcast', () => {
    assert.strictEqual(exitCode, 0)
  })
})
// print keys to file location given with encryption
describe('generate-lattice-keys #9', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '50',
    '-s',
    '0005000d4b37e849aa5e3c2e27de0d51131d9a26b4b458e60f9be62951441fdd6867efc10d7b2f696982c788bc77951272709d',
    '-c',
    testSetup.bobTempENCLatticeKey,
    '-e',
    testSetup.bobEncPass,
    '-t',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with encrypted keys printed to file not broadcast', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// broadcast keys to testnet network and save crystals file
describe('generate-lattice-keys #10 - Alice', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '0',
    '-w',
    testSetup.aliceTempPTWalletLocation,
    '-c',
    testSetup.aliceTempENCLatticeKey,
    '-t',
    '-b',
  ]

  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys broadcast to network and saved into temp file location', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// broadcast keys to testnet network and save crystals file encrypted
describe('generate-lattice-keys #11 - Alice ENC', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '0',
    '-w',
    testSetup.aliceTempENCWalletLocation,
    '-p',
    testSetup.aliceEncPass,
    '-c',
    testSetup.aliceTempENCLatticeKey,
    '-e',
    testSetup.aliceEncPass,
    '-t',
    '-b',
  ]

  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys broadcast to network and encrypted keys saved into /tmp/enc-lattice.json file location', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// broadcast keys without saving to file
describe('generate-lattice-keys #12 Bob', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-w',
    testSetup.bobTempPTWalletLocation,
    '-t',
    '-b',
  ]
  
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys broadcast to network printed to console', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// broadcast keys without saving to file in json
describe('generate-lattice-keys #13 Bob', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '2',
    '-w',
    testSetup.bobTempPTWalletLocation,
    '-t',
    '-b',
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
  it('exit code should be 0 with keys broadcast to network printed to console in json', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// broadcast keys without saving to file in json, print encrypted json
describe('generate-lattice-keys #14 bob', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '0',
    '-w',
    testSetup.bobTempENCWalletLocation,
    '-p',
    testSetup.bobEncPass,
    '-e',
    testSetup.bobEncPass,
    '-t',
    '-b',
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
  it('exit code should be 0 with keys broadcast to network printed to console in json encrypted', () => {
    assert.strictEqual(exitCode, 0)
  })
})
