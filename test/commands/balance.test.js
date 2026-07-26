const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')

const testSetup = require('../test_setup')

const processFlags = {
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit'],
}

// Helper function to add delay between tests to prevent API rate limiting
function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Helper function for wallet file creation
function createWalletIfNeeded(walletPath, isEncrypted = false, password = null) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(walletPath)) {
      resolve()
      return
    }
    
    const createWalletArgs = [
      'create-wallet',
      '-h', '6',
      '-f', walletPath
    ]
    
    if (isEncrypted && password) {
      createWalletArgs.push('-p', password)
    }
    
    const createProcess = spawn('./bin/run', createWalletArgs, processFlags)
    
    createProcess.on('exit', (createCode) => {
      if (createCode === 0) {
        resolve()
      } else {
        reject(new Error(`Failed to create wallet file: ${walletPath}`))
      }
    })
    
    createProcess.on('error', (err) => {
      reject(err)
    })
  })
}

// no args
describe('balance #1', () => {
  let exitCode
  before((done) => {
    const args = ['balance']
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without an argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address
describe('balance #2', () => {
  let exitCode
  before((done) => {
    const args = [
    'balance',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address- too short', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
// bad address
describe('balance #3', () => {
  let exitCode
  before((done) => {
    const args = [
    'balance',
    'a010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address- starts with a', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address file
describe('balance #4', () => {
  let exitCode
  before((done) => {
    const args = [
    'balance',
    testSetup.notAWalletFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address- not an address file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad encrypted address file password
describe('balance #5', () => {
  let exitCode
  before((done) => {
    const args = [
    'balance',
    testSetup.encWalletFile,
    '-p',
    'notThePass',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with bad address password- wrong password', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('balance #6', () => {
  let exitCode
  before((done) => {
    const args = [
      'balance',
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
      '-s',
      '-q',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with a valid address, and both -s and -q flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// not valid grpc address
describe('balance #7', () => {
  let exitCode
  before(async function balanceTest7() {
    this.timeout(15000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    const args = [
      'balance',
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
      '-g',
      'https://brooklyn.theqrl.org/nottheapi/',
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be non-0 if API is down or Node address invalid', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// pass

// mainnet balance
describe('balance #8', () => {
  let exitCode
  before(async function balanceTest8() {
    this.timeout(15000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    const args = [
      'balance',
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3'
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid address as argument', () => {
    assert.strictEqual(exitCode, 0)
  })
})


describe('balance #9', () => {
  let exitCode
  before(async function balanceTest9() {
    this.timeout(15000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    const args = [
      'balance',
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
      '-s'
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid address and a -s flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success -q
describe('balance #10', () => {
  let exitCode
  before(async function balanceTest10() {
    this.timeout(15000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    const args = [
      'balance', 
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
      '-q',
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid address and -q flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success testnet
describe('balance #11', () => {
  let exitCode
  before(async function balanceTest11() {
    this.timeout(30000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    const args = ['balance', 'Q000400e9910eb0b8ff824a017b400b8ea743a32ee35e958575a898eeb1fe796d6f14eb3f51897b', '-t']
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid testnet address and -t flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success mainnet
describe('balance #12', () => {
  let exitCode
  before(async function balanceTest12() {
    this.timeout(15000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    const args = [
      'balance', 
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
      '-m',
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid address and -m flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success wallet file
describe('balance #13', () => {
  let exitCode
  before(async function balanceTest13() {
    this.timeout(20000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    
    // Create wallet file if it doesn't exist
    await createWalletIfNeeded(testSetup.walletFile, false, null)
    
    // Now run the balance command
    const args = [
      'balance', 
      testSetup.walletFile,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid wallet file and testnet flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success enc-wallet file
describe('balance #14', () => {
  let exitCode
  before(async function balanceTest14() {
    this.timeout(20000)
    await delay(5000) // 2 second delay to prevent API rate limiting
    
    // Create encrypted wallet file if it doesn't exist
    await createWalletIfNeeded(testSetup.encWalletFile, true, testSetup.encPass)
    
    // Now run the balance command
    const args = [
      'balance', 
      testSetup.encWalletFile,
      '-p',
      testSetup.encPass,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid encrypted wallet file and password flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})