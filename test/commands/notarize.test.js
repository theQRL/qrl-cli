// //////////////////
// notarize test
// /////////////////

const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')

const setup = require('../test_setup')

const badHashShort = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774f'
const badHashInvalid = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774fc0a_gg'
const sha256Hash = 'ead9e1846686f29c315b235099529e1d31340699ccbcd0c010e50032d14bb3d6'
const longMessage = 'thisMessageIsTooLongToSendWithNotarisationAndWillBeBlockedAsItWontFitInsideTheMessageData'
const messageData = 'Some Text'

let bobWallet
let hexString 


const processFlags = {
  detached: true,
  stdio: 'inherit',
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

describe('notarize setup', () => {
  let exitCode
  before(done => {
    bobWallet = openFile(setup.bobPTWalletLocation) // 
    hexString = bobWallet[0].hexseed
    done()
  })
  it('exit code should be 0 if setup', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
  // test cases

describe('notarize #1', () => {
  const args = [
    'notarize',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if no file or wallet keys given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('notarize #2', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      badHashShort,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad hash given - too short', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('notarize #3', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      badHashInvalid,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if invalid hash given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('notarize #4', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-h', '00003a2ebbbbe4adfca4b236a0bf91604438e5b09a35d660c7b77343ca8f1e983e115c5166aab75d4dcab819148b5e065aea',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad hexString given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


describe('notarize #5', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-h', hexString,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if no OTS given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('notarize #6', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-h', hexString,
      '-i', '25',
      '-M', longMessage,
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if too long message string added', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('notarize #7', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-w', setup.notAWalletFile,
      '-i', '25',
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad wallet file given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


describe('notarize #8', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-w', setup.bobPTWalletLocation,
      '-i', 'F',
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad OTS', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// //////////////////////////
// pass 
// //////////////////////////

describe('notarize #9 bobs plaintext wallet hexString', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
       sha256Hash,
      '-h', hexString,
      '-i', '2',
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarization succeeded', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('notarize #10 Bobs plaintext wallet file with messageData', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-w', setup.bobPTWalletLocation,
      '-i', '3',
      '-M', messageData,
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarization succeeded with message data added', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('notarize #11 Bobs Plain text wallet', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-w',
      setup.bobPTWalletLocation,
      '-i', '4',
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarization succeeded with message data added from wallet file', () => {
    assert.strictEqual(exitCode, 0)
  })
    })

describe('notarize #12 - Alice\'s encrypted wallet', () => {
  let exitCode
  before(done => {
    const args = [
      'notarize',
      sha256Hash,
      '-w',
      setup.aliceENCWalletLocation,
      '-i', '1',
      '-t',
      '-p', setup.aliceEncPass,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarization succeeded with message data added from encrypted wallet', () => {
    assert.strictEqual(exitCode, 0)
  })
    })