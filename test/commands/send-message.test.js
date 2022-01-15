const assert = require('assert')
const {spawn} = require('child_process')
const testSetup = require('../test_setup')
const fs = require('fs')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}
const wallet = openFile(testSetup.walletFile)
const walletHexseed = wallet[0].hexseed

describe('send-message #1', () => {
  const args = [
    'send-message',
  ]
  let exitCode
  before(done => {
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
describe('send-message #2', () => {
  const args = [
    'send-message',
    '-M',
    'This Message Is Over 80 bytes and will throw an error in the console'
  ]
  let exitCode
  before(done => {
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

describe('send-message #3', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q000500b5ea246980f3ff4ee42f399e4a79598d6844e66373eb61ab59d1a1e6cfe8e963eb4bcd'
  ]
  let exitCode
  before(done => {
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
describe('send-message #4', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
  ]
  let exitCode
  before(done => {
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
describe('send-message #5', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-p',
    'send-message-test-NOT-password',
    '-w',
    testSetup.encWalletFile,
  ]
  let exitCode
  before(done => {
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
describe('send-message #6', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-w',
    testSetup.walletFile,
  ]
  let exitCode
  before(done => {
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
describe('send-message #7', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    '0005000d4b37e849aa5e3c2e27de0d51131d9a26b4b458e60f9be62951441fdd6867efc10d7b2f696982c788bc779512727',
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
describe('send-message #8', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam',
  ]
  let exitCode
  before(done => {
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
describe('send-message #9', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    walletHexseed,
  ]
  let exitCode
  before(done => {
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
describe('send-message #10', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    walletHexseed,
    '-i',
    'i',
  ]
  let exitCode
  before(done => {
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
describe('send-message #11', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    walletHexseed,
    '-i',
    '0',
    '-f',
    'none'
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

describe('send-message #12', () => {
  const args = [
    'send-message',
    '-M',
    'Hey There qrl-cli',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    walletHexseed,
    '-i',
    '0',
    '-f',
    '0',
    '-g',
    'https://brooklyn.theqrl.org/nottheapi/',
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

// successful message send wallet file
describe('send-message #13', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'qrl-cli test',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-w',
    testSetup.walletFile,
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
  it('exit code should be 0 if message sent', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// successful mesage send encrypted wallet file
describe('send-message #14', () => {
  const args = [
    'send-message',
    '-t',
    '-M',
    'qrl-cli test 1',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-w',
    testSetup.encWalletFile,
    '-p',
    testSetup.encPass,
    '-i',
    '2',
  ]
  let exitCode
  before(done => {
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
  const args = [
    'send-message',
    '-t',
    '-M',
    'qrl-cli test 2',
    '-r',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-s',
    walletHexseed,
    '-i',
    '1',
  ]
  let exitCode
  before(done => {
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
