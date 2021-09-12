// /* ////////////////////////
// OTS Tests
// 
// */ ///////////////////////

const assert = require('assert')
const { spawn } = require('child_process')
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
let aliceAddress

describe('ots setup', () => {
  let exitCode
  before(done => {
    aliceWallet = openFile(setup.alicePTWalletLocation)
    aliceAddress = aliceWallet[0].address
    done()
  })
  it('exit code should be 0 if setup......', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no args
describe('ots #1', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without an argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address given
describe('ots #2', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f4',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address file given
describe('ots #3', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      '/tmp',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid address file as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// bad password for address file given
describe('ots #4', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      setup.aliceENCWalletLocation,
      '-p',
      'NotThePassword'
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid password for address file as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// fail with bad grpc address
describe('ots #5', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      aliceAddress,
      '-g',
      'invalid.theqrl.org:19009',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with dead custom grpc link and a valid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// valid args should succeed
describe('ots #6', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      aliceAddress,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// valid mainnet flag
describe('ots #7', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
      '-m',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with mainnet flag and a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// valid testnet flag
describe('ots #8', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      aliceAddress,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with testnet flag and a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// valid testnet flag
describe('ots #9 - mainnet quiet', () => {
  let exitCode
  before(done => {
    const args = [
      'ots',
      'Q01040062908a55128609363f80102e3c07821eb06d579d0151e575428e9389f4532593a2291247',
      '-m',
      '-q',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with testnet flag and a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// bittrex address 2021 - Q01040062908a55128609363f80102e3c07821eb06d579d0151e575428e9389f4532593a2291247