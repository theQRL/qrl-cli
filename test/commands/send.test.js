const assert = require('assert')
const {spawn} = require('child_process')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

describe('send #1', () => {
  const args = [
    'send',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without any arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send #2a', () => {
  const args = [
    'send',
    '10',
    '-f',
    'outputs.json',
    '-h',
    'imaginary hexseed',
    '-r',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with more than one source of outputs', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send #2b', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    'imaginary hexseed',
    '-r',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f3',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with more than one source of outputs', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send #3', () => {
  const args = [
    'send',
    '10',
    '-h',
    'imaginary hexseed',
    '-r',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f4',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with an invalid QRL address as recipient', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send #4a', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    'imaginary hexseed',
    '-s',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with the --shor flag', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('send #4b', () => {
  const args = [
    'send',
    '10',
    '-f',
    'file.json',
    '-h',
    'imaginary hexseed',
    '-s',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with the --shor flag', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
