const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');

const badHashShort = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774f'
const badHashInvalid = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774fc0a_gg'
const sha256Hash = 'fc23dfce42391794f9d86fe0e2babfa815bd1846161784fd5f78fdd774fc0af5'
const longMessage = 'thisMessageIsTooLongToSendWithNotarisationAndWillBeBlockedAsItWontFitInsideTheMessageData'
const messageData = 'Some Additiona Text'
const walletJSONFile = path.join(__dirname, '/../lattice/alice/alice-wallet.json')
const notAWalletFile = path.join(__dirname, '/../lattice/alice/alice.json')
const hexString = '0004003a2ebbbbe4adfca4b236a0bf91604438e5b09a35d660c7b77343ca8f1e983e115c5166aab75d4dcab819148b5e065aea'
// const walletFIle = ''


const processFlags = {
  detached: true,
  stdio: 'inherit',
}


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
  const args = [
    'notarise',
    badHashShort,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'notarise',
    badHashInvalid,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'notarise',
    sha256Hash,
    '-h',
    '00003a2ebbbbe4adfca4b236a0bf91604438e5b09a35d660c7b77343ca8f1e983e115c5166aab75d4dcab819148b5e065aea',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if bad hexseed given', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


describe('notarise #5', () => {
  const args = [
    'notarise',
    sha256Hash,
    '-h',
    hexString,
  ]
  let exitCode
  before(done => {
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
  const args = [
    'notarise',
    sha256Hash,
    '-h',
    hexString,
    '-i',
    '1',
    '-M',
    longMessage,
    '-t'
  ]
  let exitCode
  before(done => {
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
  const args = [
    'notarise',
    sha256Hash,
    '-w',
    notAWalletFile,
    '-i',
    '1',
    '-t'
  ]
  let exitCode
  before(done => {
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
  const args = [
    'notarise',
    sha256Hash,
    '-w',
    walletJSONFile,
    '-i',
    'F',
    '-t'
  ]
  let exitCode
  before(done => {
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

describe('notarise #9', () => {
  const args = [
    'notarise',
    sha256Hash,
    '-h',
    hexString,
    '-i',
    '10',
    '-t'
  ]
  let exitCode
  before(done => {
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

describe('notarise #10', () => {
  const args = [
    'notarise',
    sha256Hash,
    '-h',
    hexString,
    '-i',
    '11',
    '-M',
    messageData,
    '-t'
  ]
  let exitCode
  before(done => {
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

describe('notarise #11', () => {
  const args = [
    'notarise',
    sha256Hash,
    '-w',
    walletJSONFile,
    '-i',
    '12',
    '-t'
  ]
  let exitCode
  before(done => {
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