const assert = require('assert')
const {spawn} = require('child_process')
const path = require('path');

// const aliceWalletLocation = path.join(__dirname, '/../lattice/alice/alice-wallet.json')
const alicePubKeyFile = path.join(__dirname, '/../lattice/bob/alice-pub-lattice.json')

// const bobWalletLocation = path.join(__dirname, '/../lattice/bob/bob-wallet.json')
const bobPubKeyFile = path.join(__dirname, '/../lattice/alice/bob-pub-lattice.json')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

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

// get keys from address given testnet
describe('get-keys #6', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
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
describe('get-keys #7', () => {
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
describe('get-keys #8', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
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
describe('get-keys #9', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    '2',
    '-p',
    '1',
    '-t',
    '-f',
    '/tmp/pub_key_file.json',
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
describe('get-keys #10', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
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
describe('get-keys #11', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
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
describe('get-keys #12', () => {
  const args = [
    'get-keys',
    '-a',
    'Q000500215d6a512b193aa19f7812bb708251f94e48e176e00bfea0760fa48419feae6ce3ab1637',
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

// get keys from address given and print to console  No keys found
describe('get-keys #13', () => {
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
describe('get-keys #14', () => {
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

// get keys from address given and print to console without page passed
describe('get-keys #15', () => {
  const args = [
    'get-keys',
    '-T',
    '9b9b4d4faeaac6de6a7166e5dbdcdd1d061132a7a0a7b881868fbd5055376907',
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
describe('get-keys #16', () => {
  const args = [
    'get-keys',
    '-T',
    '9b9b4d4faeaac6de6a7166e5dbdcdd1d061132a7a0a7b881868fbd5055376907',
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

// get keys from address given and print to file
describe('get-keys #17', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    '2',
    '-p',
    '1',
    '-t',
    '-f',
    alicePubKeyFile,
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

// get keys from address given and print to file
describe('get-keys #18', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020500fda253c2ccd7f906b0251f83ed73b4b71283f0fdbc82e4afd6973ed64d3081ac12280282',
    '-i',
    '2',
    '-p',
    '1',
    '-t',
    '-f',
    bobPubKeyFile,
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


