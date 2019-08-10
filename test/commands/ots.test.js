/* global before */
const assert = require('assert')
const spawn = require('child_process').spawn

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('ots #1', () => {
  let args = [
    'ots',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without an argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// describe('ots #2', () => {
//   let args = [
//     'ots',
//     'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
//   ]
//   let exitCode
//   before(done => {
//     let process = spawn('./bin/run', args, processFlags)
//     process.on('exit', code => {
//       exitCode = code
//       done()
//     })
//   })
//   it('exit code should be 0 if passed with a valid address as argument', () => {
//     assert.strictEqual(exitCode, 0)
//   })
// })

describe('ots #3', () => {
  let args = [
    'ots',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f4',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// describe('ots #4', () => {
//   let args = [
//     'ots',
//     'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
//     '-m',
//   ]
//   let exitCode
//   before(done => {
//     let process = spawn('./bin/run', args, processFlags)
//     process.on('exit', code => {
//       exitCode = code
//       done()
//     })
//   })
//   it('exit code should be 0 if passed with mainnet flag and a valid address as argument', () => {
//     assert.strictEqual(exitCode, 0)
//   })
// })

// describe('ots #5', () => {
//   let args = [
//     'ots',
//     'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
//     '-t',
//   ]
//   let exitCode
//   before(done => {
//     let process = spawn('./bin/run', args, processFlags)
//     process.on('exit', code => {
//       exitCode = code
//       done()
//     })
//   })
//   it('exit code should be 0 if passed with testnet flag and a valid address as argument', () => {
//     assert.strictEqual(exitCode, 0)
//   })
// })

describe('ots #6', () => {
  let args = [
    'ots',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
    '-g',
    'invalid.theqrl.org:19009',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with dead custom grpc link and a valid address as argument', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
