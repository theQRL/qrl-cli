// //////////////////
// Notarise test
// OTS Keys 25-29
// /////////////////

const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')

const setup = require('../setup')

const badHashShort = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774f'
const badHashInvalid = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774fc0a_gg'
const sha256Hash = 'fc23dfce42351794f9d86fe0e2babfa815bd1846161784fd5f78fdd774fc0af5'
const longMessage = 'thisMessageIsTooLongToSendWithNotarisationAndWillBeBlockedAsItWontFitInsideTheMessageData'
const messageData = 'Some Text'
// const notAWalletFile = path.join(__dirname, '/../lattice/alice/alice.json')

let bobWallet
let hexString // = '0004003a2ebbbbe4adfca4b236a0bf91604438e5b09a35d660c7b77343ca8f1e983e115c5166aab75d4dcab819148b5e065aea'

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

describe('notarise setup', () => {
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
describe('notarise #1', () => {
  const args = [
    'notarise',
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

describe('notarise #2', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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

describe('notarise #3', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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

describe('notarise #4', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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


describe('notarise #5', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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

describe('notarise #6', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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

describe('notarise #7', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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


describe('notarise #8', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
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

// */

// //////////////////////////
// pass 
// //////////////////////////


describe('notarise #9 bobs plaintext wallet hexString', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
       sha256Hash,
      '-h', hexString,
      '-i', '25',
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarisation succeeded', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('notarise #10 Bobs plaintext wallet file with messageData', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
      sha256Hash,
      '-w', setup.bobPTWalletLocation,
      '-i', '26',
      '-M', messageData,
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarisation succeeded with message data added', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('notarise #11 Bobs Plain text wallet', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
      sha256Hash,
      '-w',
      setup.bobPTWalletLocation,
      '-i', '27',
      '-t'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarisation succeeded with message data added from walllet file', () => {
    assert.strictEqual(exitCode, 0)
  })
    })

describe('notarise #12 - Alices encrypted wallet', () => {
  let exitCode
  before(done => {
    const args = [
      'notarise',
      sha256Hash,
      '-w',
      setup.aliceENCWalletLocation,
      '-i', '28',
      '-t',
      '-p', setup.aliceEncPass,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if notarisation succeeded with message data added from encrypted wallet', () => {
    assert.strictEqual(exitCode, 0)
  })
    })

