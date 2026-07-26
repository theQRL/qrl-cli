const assert = require('assert')
const {spawn} = require('child_process')
const fs = require('fs')

const testSetup = require('../test_setup')

const processFlags = {
  stdio: 'pipe', // Changed from 'inherit' to 'pipe' to better control output
}

// Track active processes for cleanup
const activeProcesses = []

// Cleanup function to kill all active processes
function cleanupProcesses() {
  activeProcesses.forEach((childProcess) => {
    if (!childProcess.killed) {
      childProcess.kill('SIGTERM')
    }
  })
  activeProcesses.length = 0
}

// Handle process interruption
process.on('SIGINT', () => {
  cleanupProcesses()
  process.exit(0)
})

process.on('SIGTERM', () => {
  cleanupProcesses()
  process.exit(0)
})

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
describe('list-transactions #1', () => {
  let exitCode
  before((done) => {
    const args = ['list-transactions']
    const childProcess = spawn('./bin/run', args, processFlags)
    activeProcesses.push(childProcess)
    
    childProcess.on('exit', (code) => {
      exitCode = code
      const index = activeProcesses.indexOf(childProcess)
      if (index > -1) activeProcesses.splice(index, 1)
      done()
    })
    
    childProcess.on('error', (err) => {
      const index = activeProcesses.indexOf(childProcess)
      if (index > -1) activeProcesses.splice(index, 1)
      done(err)
    })
  })
  it('exit code should be non-0 if passed without an argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address - too short
describe('list-transactions #2', () => {
  let exitCode
  before((done) => {
    const args = [
      'list-transactions',
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

// bad address - starts with 'a'
describe('list-transactions #3', () => {
  let exitCode
  before((done) => {
    const args = [
      'list-transactions',
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

// invalid address
describe('list-transactions #4', () => {
  let exitCode
  before((done) => {
    const args = [
      'list-transactions',
      'invalid-address',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', (code) => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with invalid address', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad address file
describe('list-transactions #5', () => {
  let exitCode
  before((done) => {
    const args = [
      'list-transactions',
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
describe('list-transactions #6', () => {
  let exitCode
  before((done) => {
    const args = [
      'list-transactions',
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

// not valid grpc address
describe('list-transactions #7', () => {
  let exitCode
  before(async function listTransactionsTest7() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = [
      'list-transactions',
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

// mainnet list-transactions
describe('list-transactions #8', () => {
  let exitCode
  before(async function listTransactionsTest8() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = [
      'list-transactions',
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

// success with quiet flag
describe('list-transactions #9', () => {
  let exitCode
  before(async function listTransactionsTest9() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = [
      'list-transactions', 
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

// success with limit flag
describe('list-transactions #10', () => {
  let exitCode
  before(async function listTransactionsTest10() {
    this.timeout(240000) // Increased timeout to account for API delays and multiple pages
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = [
      'list-transactions',
      'Q000400e9910eb0b8ff824a017b400b8ea743a32ee35e958575a898eeb1fe796d6f14eb3f51897b',
      '--limit',
      '10',
      '-t',
    ]
    const childProcess = spawn('./bin/run', args, processFlags)
    activeProcesses.push(childProcess)
    
    return new Promise((resolve, reject) => {
      childProcess.on('exit', (code) => {
        exitCode = code
        const index = activeProcesses.indexOf(childProcess)
        if (index > -1) activeProcesses.splice(index, 1)
        resolve()
      })
      childProcess.on('error', (err) => {
        const index = activeProcesses.indexOf(childProcess)
        if (index > -1) activeProcesses.splice(index, 1)
        reject(err)
      })
    })
  })
  it('exit code should be 0 if passed with a valid address and limit flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// success testnet
describe('list-transactions #11', () => {
  let exitCode
  before(async function listTransactionsTest11() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = ['list-transactions', 'Q000400e9910eb0b8ff824a017b400b8ea743a32ee35e958575a898eeb1fe796d6f14eb3f51897b', '-t']
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
describe('list-transactions #12', () => {
  let exitCode
  before(async function listTransactionsTest12() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = [
      'list-transactions', 
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
describe('list-transactions #13', () => {
  let exitCode
  before(async function listTransactionsTest13() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    
    // Create wallet file if it doesn't exist
    await createWalletIfNeeded(testSetup.walletFile, false, null)
    
    // Now run the list-transactions command
    const args = [
      'list-transactions', 
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
describe('list-transactions #14', () => {
  let exitCode
  before(async function listTransactionsTest14() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    
    // Create encrypted wallet file if it doesn't exist
    await createWalletIfNeeded(testSetup.encWalletFile, true, testSetup.encPass)
    
    // Now run the list-transactions command
    const args = [
      'list-transactions', 
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

// success with CSV output
describe('list-transactions #15', () => {
  let exitCode
  before(async function listTransactionsTest15() {
    this.timeout(60000)
    await delay(5000) // 5 second delay to prevent API rate limiting
    const args = [
      'list-transactions',
      'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
      '--csv',
      'test_transactions.csv',
    ]
    const process = spawn('./bin/run', args, processFlags)
    return new Promise((resolve) => {
      process.on('exit', (code) => {
        exitCode = code
        resolve()
      })
    })
  })
  it('exit code should be 0 if passed with a valid address and CSV output flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})