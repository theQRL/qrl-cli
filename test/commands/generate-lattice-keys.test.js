const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');

const aliceWalletLocation = path.join(__dirname, '/../lattice/alice/alice-wallet.json')
const aliceLatticeLocation = path.join(__dirname, '/../lattice/alice/alice-lattice.json')

const bobWalletLocation = path.join(__dirname, '/../lattice/bob/bob-wallet.json')
const bobLatticeLocation = path.join(__dirname, '/../lattice/bob/bob-lattice.json')

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

const fs = require('fs');

// incorrect data in wallet.json
describe('generate-lattice-keys #4', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '1',
    '-w',
    '/tmp/wallet.json',
    '-t',
  ]
  let exitCode
  before(done => {
    const content = 'Some content!'
    const createCode = ''
    fs.writeFile('/tmp/wallet.json', content, err => {
      if (err) {
        createCode(err)
      }
    })
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
    'testPassword',
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
    '1',
    '-s',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-c',
    '/tmp/ems.json',
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
  it('exit code should be 0 with keys printed to file', () => {
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
    '/tmp/ems1.json',
    '-e',
    'test',
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
  it('exit code should be 0 with encrypted keys printed to file', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// create a wallet file to use for next functions
describe('generate-lattice-keys #10a - create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '4',
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
  it('exit code should be 0 if passed with -h flag and a valid tree height', () => {
    assert.strictEqual(exitCode, 0)
  })
})



// broadcast keys to testnet network and save crystals file
describe('generate-lattice-keys #10', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '20',
    '-w',
    aliceWalletLocation,
    '-c',
    '/tmp/lattice.json',
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
describe('generate-lattice-keys #11', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '21',
    '-w',
    aliceWalletLocation,
    '-c',
    '/tmp/enc-lattice.json',
    '-t',
    '-b',
    '-e',
    'testpassword',
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
describe('generate-lattice-keys #12', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '22',
    '-w',
    aliceWalletLocation,
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
describe('generate-lattice-keys #13', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '23',
    '-w',
    aliceWalletLocation,
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

// broadcast keys without saving to file in json
describe('generate-lattice-keys #14', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '24',
    '-w',
    aliceWalletLocation,
    '-t',
    '-b',
    '-j',
    '-e',
    'testPassword',
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

// broadcast keys to testnet network and save crystals file
describe('generate-lattice-keys #10', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '25',
    '-w',
    aliceWalletLocation,
    '-c',
    aliceLatticeLocation,
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


// broadcast keys to testnet network and save crystals file
describe('generate-lattice-keys #10', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '26',
    '-w',
    bobWalletLocation,
    '-c',
    bobLatticeLocation,
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


/* not failing when ots is reused...

// broadcast keys without saving to file and re-using ots key
describe('generate-lattice-keys #10', () => {
  const args = [
    'generate-lattice-keys',
    '-i',
    '0',
    '-w',
    '/tmp/wallet.json',
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
  it('exitCode should be 1 with a fail on reuse of OTS key', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
*/