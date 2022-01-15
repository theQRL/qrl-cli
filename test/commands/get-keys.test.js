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

let aliceWallet
let aliceAddress
let aliceTX
let aliceTxHash
let wallet
let walletAddress

//
describe('setup', () => {
  let exitCode
  before(done => {
    aliceWallet = openFile(testSetup.alicePTWalletLocation)
    aliceAddress = aliceWallet[0].address
    aliceTX = openFile(testSetup.alicePubKeyFile)
    aliceTxHash = aliceTX[1].txHash
    wallet = openFile(testSetup.walletFile)
    walletAddress = wallet[0].address
    done()
  })
  it('exit code should be non-0 if passed without any arguments/flags, requires xmss address and ots index', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// //////////////
// Failed Tests
// //////////////

// get-keys command without any flags
describe('get-keys #1', () => {
  const args = [
    'get-keys',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without any arguments/flags, requires QRL address', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// get-keys command with an incorrect QRL address
describe('get-keys #2', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b8',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with incorrect QRL address', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// get-keys command with itemsPerPage set to non-number 
describe('get-keys #3', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    'a',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with itemsPerPage set to non-number ', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// get-keys command with pageNumber set to non-number 
describe('get-keys #4', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    '1',
    '-p',
    'a',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with pageNumber set to non-number ', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
// wrong grpc endpoint
describe('get-keys #5', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    '1',
    '-p',
    '1',
    '-g',
    'invalid.theqrl.org:19009',
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

// get keys from address given and print to console  No keys found
describe('get-keys #6', () => {
  const args = [
    'get-keys',
    '-T',
    'NotATransaction',
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
  it('exit code should be non-0 if -T passed without correct txhash Unable to find transaction', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// get keys from address given and print to console  Not a lattice transaction
describe('get-keys #7', () => {
  const args = [
    'get-keys',
    '-T',
    '021bb526ec6d35e880e2e706e2dd16a4c6da7223a8b632a57cd5cd44d5f4cf42',
    '-m',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if -T passed with txhash that is not a lattice transaction', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// //////////////
//  Passing Tests
// //////////////

// get keys from address given testnet
describe('get-keys #2a', () => {
  const args = [
    'get-keys',
    '-a',
    aliceAddress,
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
  it('exit code should be 0 if everything is correct with keys printed to console for testnet', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given mainnet
describe('get-keys #2b', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    '1',
    '-p',
    '1',
    '-m',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if everything is correct with keys printed to console for mainnet', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given and print json
describe('get-keys #2c', () => {
  const args = [
    'get-keys',
    '-a',
    aliceAddress,
    '-i',
    '1',
    '-p',
    '1',
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
  it('exit code should be 0 if everything is correct with public keys printed to console in json', () => {
    assert.strictEqual(exitCode, 0)
  })
})
// get keys from address given and print to file
describe('get-keys #2d', () => {
  const args = [
    'get-keys',
    '-a',
    aliceAddress,
    '-i',
    '2',
    '-p',
    '1',
    '-t',
    '-f',
    testSetup.aliceTempPubKeyFile,
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if everything is correct with keys printed to file', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given and print to console without item passed
describe('get-keys #2e', () => {
  const args = [
    'get-keys',
    '-a',
    aliceAddress,
    '-t',
    '-j',
    '-p',
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
  it('exit code should be 0 if everything is correct with default number of keys printed to console', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given and print to console without page passed
describe('get-keys #2f', () => {
  const args = [
    'get-keys',
    '-a',
    aliceAddress,
    '-t',
    '-j',
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
  it('exit code should be 0 if everything is correct with default number of keys printed to console', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given and print to console  No keys found
describe('get-keys #2j', () => {
  const args = [
    'get-keys',
    '-a',
    walletAddress,
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
  it('exit code should be 0 if everything is correct with no keys found', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given and print to console without page passed
describe('get-keys #2h', () => {
  const args = [
    'get-keys',
    '-T',
    aliceTxHash,
    '-t',
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
  it('exit code should be 0 if everything is correct with default number of keys printed to console', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// get keys from address given and print to console without page passed
describe('get-keys #2i', () => {
  const args = [
    'get-keys',
    '-T',
    aliceTxHash,
    '-t',
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
  it('exit code should be 0 if everything is correct with default number of keys printed to console', () => {
    assert.strictEqual(exitCode, 0)
  })
})
