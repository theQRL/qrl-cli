// /* ////////////////////////
// Send Message Tests
// OTS Keys - 30-40
// */ ///////////////////////

const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')
const setup = require('../setup')

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

let aliceWallet
let bobWallet
let aliceAddress
let bobAddress
let bobHexseed
let bobMnemonic 

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// lattice command given without any flags
describe('send-message setup', () => {

  let exitCode
  before(done => {
    aliceWallet = openFile(setup.alicePTWalletLocation)
    bobWallet = openFile(setup.bobPTWalletLocation) // 
    aliceAddress = aliceWallet[0].address
    bobAddress = bobWallet[0].address
    bobHexseed = bobWallet[0].hexseed
    bobMnemonic = bobWallet[0].mnemonic
    done()
  })
  it('exit code should be non-0 if passed without any arguments/flags, requires xmss address and ots index', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send-message #1 - no args', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if no message or keys given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// message is longer than 80 bites
describe('send-message #2 - longer than 80 bites', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-M',
      'This Message Is Over 80 bytes and will throw an error in the console'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if message is over 80 bytes, blockchain limit', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// passed the -r flag and gave bad qrl address
describe('send-message #3 - bad qrl address', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M',
      'Hey There qrl-cli',
      '-r',
      'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b83v'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed the -r flag and gave bad qrl address', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no private keys given
describe('send-message #4 - no private keys', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M',
      'Hey There qrl-cli',
      '-r',
      bobAddress,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if no private keys given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// wrong password given for encrypted wallet file
describe('send-message #5 - wrong password given', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'Hey There qrl-cli',
      '-r', aliceAddress,
      '-w', setup.bobENCWalletLocation,
      '-p', 'send-message-test-NOT-password',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if wrong password given for encrypted wallet file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no OTS given for wallet file
describe('send-message #6 - no OTS given', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'Hey There qrl-cli',
      '-r', aliceAddress,
      '-w', setup.bobPTWalletLocation,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if no OTS given for wallet file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad hexseed given
describe('send-message #7 - bad hexseed', () => {
  const args = [
    'send-message',
    '-t',
    '-M', 'Hey There qrl-cli',
    '-r', aliceAddress,
    '-s', '0005000d4b37e849aa5e3c2e27de0d51131d9a26b4b458e60f9be62951441fdd6867efc10d7b2f696982c788bc779512727',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad hexseed given, toop short', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad mnemonic given
describe('send-message #8 - bad mnemonic', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'Hey There qrl-cli',
      '-r', aliceAddress,
      '-s', 'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad mnemonic given, too short', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no OTS given for hexseed file
describe('send-message #9 - no OTS given', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'Hey There qrl-cli',
      '-r', aliceAddress,
      '-s', bobHexseed,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if no OTS given for hexseed', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad OTS given for hexseed file
describe('send-message #10 - bad OTS', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'Hey There qrl-cli',
      '-r', aliceAddress,
      '-s', bobHexseed,
      '-i', 'i',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad OTS given for hexseed, passed i here', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad OTS given for hexseed file
describe('send-message #11 - bad OTS', () => {
  const args = [
    'send-message',
    '-t',
    '-M', 'Hey There qrl-cli',
    '-r', aliceAddress,
    '-s', bobHexseed,
    '-i', '30',
    '-f', 'none'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad fee given, passed none here', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send-message #12 - no network connection', () => {
  const args = [
    'send-message',
    '-M', 'Hey There qrl-cli',
    '-r', aliceAddress,
    '-w',  setup.bobPTWalletLocation,
    '-i', '30',
    '-f', '0',
    '-g', 'https://brooklyn.theqrl.org/nottheapi/',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if API is down', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// ////////
// pass
// ////////

// successful mesage send wallet file
describe('send-message #13', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'qrl-cli test',
      '-r', aliceAddress,
      '-w', setup.bobPTWalletLocation,
      '-i', '30',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if message sent', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// successful mesage send encrypted wallet file
describe('send-message #14', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'qrl-cli test 1',
      '-r', aliceAddress,
      '-w', setup.bobENCWalletLocation,
      '-i', '31',
      '-p', setup.bobEncPass
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if message sent', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// successful mesage send hex seed
describe('send-message #15', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'qrl-cli test 2',
      '-r', aliceAddress,
      '-s', bobHexseed,
      '-i', '32',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if message sent', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// successful mesage send hex seed
describe('send-message #16', () => {
  let exitCode
  before(done => {
    const args = [
      'send-message',
      '-t',
      '-M', 'qrl-cli test 3',
      '-r', aliceAddress,
      '-s', bobMnemonic,
      '-i', '33',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if message sent', () => {
    assert.strictEqual(exitCode, 0)
  })
})