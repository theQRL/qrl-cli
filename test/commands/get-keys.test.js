// ////////////////////////////////
// Get Lattice Keys test
// 
// ///////////////////////////////

const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')
const setup = require('../setup')


const processFlags = {
  detached: true,
  stdio: 'inherit',
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

let aliceWallet
let bobWallet
let aliceAddress
let bobAddress
let bobLattice
let bobTXID

describe('get-keys setup', () => {
  let exitCode
  before(done => {
    aliceWallet = openFile(setup.alicePTWalletLocation)
    bobWallet = openFile(setup.bobPTWalletLocation) // 
    aliceAddress= aliceWallet[0].address
    bobAddress= bobWallet[0].address
    bobLattice = openFile(setup.bobLatticeLocation) // 
    bobTXID = bobLattice[0].tx_hash
    done()
  })
  it('exit code should be 0 if setup......', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

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
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', 'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b83',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', 'a',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', '1',
      '-p', 'a',
    ]
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
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', '1',
      '-p', '1',
      '-g', 'invalid.theqrl.org:19009',
    ]
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

// get keys from address given testnet
describe('get-keys #6', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-t',
    ]
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
describe('get-keys #7', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', '1',
      '-p', '1',
      '-m',
    ]
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
describe('get-keys #8', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', '1',
      '-p', '1',
      '-t',
      '-j',
    ]
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
describe('get-keys #9', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', '2',
      '-p', '1',
      '-t',
      '-f', setup.aliceTempPubKeyFile,
    ]
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
describe('get-keys #10', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-t',
      '-j',
      '-p', '1',
    ]
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
describe('get-keys #11', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', bobAddress,
      '-t',
      '-j',
      '-i', '1',
    ]
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
describe('get-keys #12', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', 'Q000500215d6a512b193aa19f7812bb708251f94e48e176e00bfea0760fa48419feae6ce3ab1637',
      '-t',
    ]
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

// get keys from address given and print to console  No keys found
describe('get-keys #13', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-T', 'NotATransaction',
      '-t',
    ]
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
describe('get-keys #14', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-T', '021bb526ec6d35e880e2e706e2dd16a4c6da7223a8b632a57cd5cd44d5f4cf42',
      '-m',
    ]
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

// get keys from address given and print to console without page passed
describe('get-keys #15', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-T', bobTXID,
      '-t',
      '-i', '1',
    ]
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
describe('get-keys #16', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-T', bobTXID,
      '-t',
      '-i', '1',
      '-j',
    ]
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

// get keys from address given and print to file
describe('get-keys #17', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', aliceAddress,
      '-i', '2',
      '-p', '1',
      '-t',
      '-f', setup.aliceTempPubKeyFile,
    ]
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

// get keys from address given and print to file
describe('get-keys #18', () => {
  let exitCode
  before(done => {
    const args = [
      'get-keys',
      '-a', bobAddress,
      '-i', '2',
      '-p', '1',
      '-t',
      '-f', setup.bobTempPubKeyFile,
    ]
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
