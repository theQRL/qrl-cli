// /* ////////////////////////
// Generate Lattice Keys Tests
// OTS Keys - 11-24
// */ ///////////////////////

const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs');
const setup = require('../setup')

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

let aliceWallet
let bobWallet

const processFlags = {
  detached: true,
  stdio: 'inherit',
}


// lattice command given without any flags
describe('generate-lattice-keys setup', () => {
  let exitCode
  before(done => {
    aliceWallet = openFile(setup.alicePTWalletLocation)
    bobWallet = openFile(setup.bobPTWalletLocation) // 
    done()
  })
  it('exit code should be non-0 if passed without any arguments/flags, requires xmss address and ots index', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// //////////////
// Failing tests
// //////////////

// lattice command given without any flags
describe('generate-lattice-keys #1 - lattice command without any flags', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
    ]
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
describe('generate-lattice-keys #2 - wrong grpc endpoint', () => {
  let exitCode
  before(done => {
  const args = [
    'generate-lattice-keys',
    '-i', '12',
    '-s', aliceWallet[0].hexseed,
    '-b',
    '-g',
  ]
// console.log(`aliceWallet[0].hexseed: ${aliceWallet[0].hexseed}`)
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

// bad grpc endpoint
describe('generate-lattice-keys #2.a - bad grpc endpoint', () => {
  let exitCode
  before(done => {
  const args = [
    'generate-lattice-keys',
    '-i', '12',
    '-s', aliceWallet[0].hexseed,
    '-b',
    '-g', 'https://brooklyn.theqrl.org/nottheapi/'
  ]
// console.log(`aliceWallet[0].hexseed: ${aliceWallet[0].hexseed}`)
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

// incorrect seed length
describe('generate-lattice-keys #3 - incorrect seed length', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '12',
      '-s', '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb139',
      '-t',
    ]
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

// incorrect seed char
describe('generate-lattice-keys #3.a - incorrect seed char', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '12',
      '-s', '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb139HG',
      '-t',
    ]
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

// no seed 
describe('generate-lattice-keys #3.b - no seed given', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '12',
      '-s', '',
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -s and no hexseed', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// incorrect data in wallet.json
describe('generate-lattice-keys #4 - incorrect data in wallet.json', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '12',
      '-w', setup.badWallet,
      '-t',
    ]
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

// no wallet.json file
describe('generate-lattice-keys #4.a - no wallet.json file', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '12',
      '-w', setup.notAWalletFile,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -w and no wallet.json file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad encryption password for enc wallet
describe('generate-lattice-keys #4.b - bad encryption password', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '12',
      '-w', setup.aliceENCWalletLocation,
      '-p',
      setup.bobEncPass,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -w encrypted walelt and bad decryption password', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no ots with broadcast
describe('generate-lattice-keys #5 - broadcast with no OTS given', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-b',
      '-w', setup.alicePTWalletLocation,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -b and no OTS given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad mnemonic
describe('generate-lattice-keys #6 - bad mnemonic, too short', () => {
  let exitCode
  before(done => {
  const args = [
    'generate-lattice-keys',
    '-i', '12',
    '-s', 'action core power grief surge square attic mere thence scarce rigid broken parcel leper crew twelve bicker recall met smoky congo happy soup change awhile willow lick ignore inject solve costly this split', 
    '-b',
    '-t', 
  ]
// console.log(`aliceWallet[0].hexseed: ${aliceWallet[0].hexseed}`)
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -s and no mnemonic', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad mnemonic
describe('generate-lattice-keys #6.a - mnemonic, no ots', () => {
  let exitCode
  before(done => {
  const args = [
    'generate-lattice-keys',
    '-s', aliceWallet[0].mnemonic, 
    '-t', 
  ]
// console.log(`aliceWallet[0].hexseed: ${aliceWallet[0].hexseed}`)
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -s mnemonic no ots', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad ots
describe('generate-lattice-keys #7 - bad ots (a)', () => {
  let exitCode
  before(done => {
  const args = [
    'generate-lattice-keys',
    '-s', aliceWallet[0].mnemonic, 
    '-t',
    '-i', 'a', 
  ]
// console.log(`aliceWallet[0].hexseed: ${aliceWallet[0].hexseed}`)
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -s mnemonic and bad ots', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad fee
describe('generate-lattice-keys #8 - bad fee', () => {
  let exitCode
  before(done => {
  const args = [
    'generate-lattice-keys',
    '-s', aliceWallet[0].mnemonic, 
    '-t',
    '-i', '12',
    '-f',
    'a' 
  ]
// console.log(`aliceWallet[0].hexseed: ${aliceWallet[0].hexseed}`)
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad fee', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// /////////
// pass
// /////////

// print keys to console if no file location given and not broadcast
describe('generate-lattice-keys #9 - print keys', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '11',
      '-s', bobWallet[0].hexseed,
      '-t',
    ]
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
describe('generate-lattice-keys #10 - print keys json', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '13',
      '-s', bobWallet[0].hexseed,
      '-t',
      '-j',
    ]
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
describe('generate-lattice-keys #11 - print keys to console in json encrypted', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '14',
      '-s', bobWallet[0].hexseed,
      '-t',
      '-j',
      '-e', setup.bobEncPass,
    ]
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
describe('generate-lattice-keys #12 - print keys to file', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '15',
      '-s', bobWallet[0].hexseed,
      '-c', setup.bobTempLatticeKey,
      '-t',
    ]
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
describe('generate-lattice-keys #13 - print keys to file encrypted', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '16', // OTS index
      '-s', bobWallet[0].hexseed, // hexseed to use for creation
      '-c', setup.aliceTempENCLatticeKey,
      '-e', setup.aliceEncPass, // encryption pass
      '-t', // testnet
    ]
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

// broadcast keys to testnet network and save crystals file
describe('generate-lattice-keys #14', () => {

  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '17',
      '-w', setup.bobPTWalletLocation,
      '-c', setup.bobTempLatticeKey,
      '-t',
      '-b', // broadcast
    ]
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
describe('generate-lattice-keys #15', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '18',
      '-w', setup.bobENCWalletLocation,
      '-p', setup.bobEncPass, 
      '-c', setup.bobTempENCLatticeKey,
      '-t',
      '-b',
      '-e', setup.bobEncPass,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 with keys broadcast to network from encrypted wallet and encrypted keys saved into /tmp/enc-lattice.json file location', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// broadcast keys without saving to file
describe('generate-lattice-keys #16', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '19',
      '-w', setup.bobPTWalletLocation,
      '-t',
      '-b',
    ]
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
describe('generate-lattice-keys #17', () => {
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '20',
      '-w', setup.bobPTWalletLocation,
      '-t',
      '-b',
      '-j',
    ]
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

// broadcast encrypted keys without saving to file in json
describe('generate-lattice-keys #18', () => {
  
  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '21',
      '-w', setup.bobENCWalletLocation,
      '-p', setup.bobEncPass,
      '-t',
      '-b',
      '-j',
      '-e', setup.bobEncPass,
    ]
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
describe('generate-lattice-keys #19', () => {

  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '22',
      '-w', setup.alicePTWalletLocation,
      '-c', setup.aliceTempLatticeKey,
      '-t',
      '-b',
    ]
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
describe('generate-lattice-keys #20', () => {

  let exitCode
  before(done => {
    const args = [
      'generate-lattice-keys',
      '-i', '23',
      '-w', setup.bobPTWalletLocation,
      '-c', setup.bobTempLatticeKey,
      '-t',
      '-b',
    ]
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