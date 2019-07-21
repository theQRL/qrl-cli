/* global before */
const assert = require('assert')
const spawn = require('child_process').spawn

describe('create-wallet', () => {
  let args = [
    'create-wallet',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed without an argument (default settings)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-f',
    '/tmp/wallet.json',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -f flag and a valid wallet file path', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-f',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -f flag without a valid wallet file path', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-f',
    '/tmp/wallet.json',
    '-p',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -p flag without a valid wallet file password', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-f',
    '/tmp/wallet.json',
    '-p',
    'joan clarke was here',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -p flag and a valid wallet file password', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-h',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-h',
    '3',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-h',
    '22',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-h',
    '13',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with -h flag without a valid tree height', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-h',
    '4',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -h flag and a valid tree height', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-1',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with valid hash selection flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-2',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with valid hash selection flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-3',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with valid hash selection flag', () => {
    assert.strictEqual(exitCode, 0)
  })
})

describe('create-wallet', () => {
  let args = [
    'create-wallet',
    '-3',
    '-2',
  ]
  let exitCode
  before(done => {
    let process = spawn('./bin/run', args)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with multiple hash selection flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
