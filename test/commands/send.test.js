const assert = require('assert')
const {spawn} = require('child_process')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

// no args given
describe('send #1a', () => {
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

// not enough args given
describe('send #1b', () => {
  const args = [
    'send',
    '10',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed without OTS arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no args given
describe('send #1c', () => {
  const args = [
    'send',
    '10',
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
  it('exit code should be non-0 if passed without recipient arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// no args given
describe('send #1d', () => {
  const args = [
    'send',
    '10',
    '-i',
    '1',
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
  it('exit code should be non-0 if passed without wallet/keys arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// bad args

// recipient address is bad
describe('send #2a', () => {
  const args = [
    'send',
    '10',
    '-i',
    '1',
    '-r',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227fg',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-f',
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
  it('exit code should be non-0 if passed with bad recipient address arguments/flags', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// multiple outputs
describe('send #2b', () => {
  const args = [
    'send',
    '10',
    '-i',
    '1',
    '-f',
    '1',
    '-R',
    'outputs.json',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if passed with more than one source of outputs -R and -r', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// multiple outputs
describe('send #2c', () => {
  const args = [
    'send',
    '10',
    '-f',
    '1',
    '-i',
    '1',
    '-R',
    'outputs.json',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with more than one source of outputs -R and -j', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// multiple outputs
describe('send #2d', () => {
  const args = [
    'send',
    '10',
    '-i',
    '1',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if passed with more than one source of outputs -j and -r', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// multiple outputs
describe('send #2e', () => {
  const args = [
    'send',
    '10',
    '-i',
    '1',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-R',
    'outputs.json',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if passed with more than one source of outputs -j and -R', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// shor passed with json
describe('send #2f', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-s',
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
  it('exit code should be non-0 if using a json source of output with the --shor flag', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})
// no hexseed passed
describe('send #2g', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
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
  it('exit code should be non-0 if no wallet or hexseed passed', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad hexseed passed
describe('send #2f', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb1396',
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
  it('exit code should be non-0 if using a json source of output with bad hexseed', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad json passed
describe('send #2g', () => {
  const args = [
    'send',
    '10',
    '-j',
    '"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"',
    // '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if using a json source of output with bad JSON data', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// incorrect json data passed
describe('send #2h', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"To":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if using a json source of output with incorrect formatted JSON data, TO not to', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// incorrect json data passed bad address
describe('send #2i', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if using a json source of output with incorrect formatted JSON data, invalid qrl address', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// incorrect json data passed shor
describe('send #2j', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","Shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shore":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if using a json source of output with incorrect formatted JSON data, shor v Shor', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})



// create a wallet file to use for next functions
describe('send - create-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '4',
    '-f',
    '/tmp/wallet.json',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -h flag and a valid tree height', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// create a wallet file to use for next functions
describe('send - create-encrypted-wallet', () => {
  const args = [
    'create-wallet',
    '-h',
    '4',
    '-p',
    'test123',
    '-f',
    '/tmp/enc-wallet.json',
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if passed with -h flag and a valid tree height', () => {
    assert.strictEqual(exitCode, 0)
  })
})


// incorrect json data passed in file
describe('send #2k', () => {
  const args = [
    'send',
    '10',
    '-R',
    '/tmp/wallet.json',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
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
  it('exit code should be non-0 if using a json source of output with incorrect formatted JSON data, shor v Shor', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})



describe('send #2l', () => {
  const args = [
    'send',
    '10',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb13967',
    '-i',
    '1',
    '-r',
    'Q010500bc576efa69fd6cbc854f2224f149f0b0a4d18fcb30c1feab64781245f4f27a61874227f4',
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
  it('exit code should be non-0 if passed with an invalid QRL address as recipient', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// bad password for encrypted wallet
describe('send #2m', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-w',
    '/tmp/enc-wallet.json',
    '-i',
    '1',
    '-p',
    'test321'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with a bad wallet password', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})

// bad password for encrypted wallet
describe('send #2n', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-w',
    '/tmp/ems.json',
    '-i',
    '1',
    '-p',
    'test321'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with a invalid wallet file', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// bad hexseed, too short
describe('send #2o', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    '020200cb68ca52ae4aff1d2ac10a2cc03f2325b95ab4610d2c6fd2af684aa1427766ac0b96b05942734d254fb9dba5fcb1396',
    '-i',
    '1',
    '-p',
    'test321'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with a invalid hexseed', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// bad mnemonic too short
describe('send #2p', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam',
    '-i',
    '1',
    '-p',
    'test321'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with a invalid mnemonic', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// bad OTS
describe('send #2q', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam appear',
    '-i',
    'a',
    '-p',
    'test321'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with a invalid OTS key', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


describe('send #2r', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam appear',
    '-i',
    '1',
    '-f',
    '.01'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be non-0 if using a json source of output with an invalid fee', () => {
    assert.notStrictEqual(exitCode, 0)
  })
})


// successful send

// send basic - -r recipient
describe('send #3a', () => {
  const args = [
    'send',
    '10',
    '-r',
    'Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408',
    '-h',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam appear',
    '-i',
    '1',
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
  it('exit code should be 0 if basic sendTX sent (will fail on network as there are no funds in wallet)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// send basic - shor
describe('send #3b', () => {
  const args = [
    'send',
    '10',
    '-r',
    'Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408',
    '-h',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam appear',
    '-i',
    '1',
    '-t',
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
  it('exit code should be 0 if basic sendTX sent (will fail on network as there are no funds in wallet)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// send basic - json recipient
describe('send #3c', () => {
  const args = [
    'send',
    '10',
    '-j',
    '{"tx":[{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"10"},{"to":"Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408","shor":"15"}]}',
    '-h',
    'aback filled atop regal town opaque gloss send cheek ten fisher cow once home remain module aye salt chord before bunch stiff heel won attend reduce heroic oak shrug midday king fit islam appear',
    '-i',
    '1',
    '-t',
    '-f',
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
  it('exit code should be 0 if json recipient with -f 1 sendTX sent (will fail on network as there are no funds in wallet)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

/*
// send using wallet file
describe('send #3d', () => {
  const args = [
    'send',
    '10',
    '-r',
    'Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408',
    '-w',
    '/tmp/wallet.json',
    '-i',
    '2',
    '-t',
    '-s'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if basic sendTX sent using wallet file (will fail on network as there are no funds in wallet)', () => {
    assert.strictEqual(exitCode, 0)
  })
})

// send using wallet file
describe('send #3e', () => {
  const args = [
    'send',
    '10',
    '-r',
    'Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408',
    '-w',
    '/tmp/enc-wallet.json',
    '-p',
    'test123',
    '-i',
    '3',
    '-t',
    '-s'
  ]
  let exitCode
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      exitCode = code
      done()
    })
  })
  it('exit code should be 0 if basic sendTX sent using wallet file (will fail on network as there are no funds in wallet)', () => {
    assert.strictEqual(exitCode, 0)
  })
})
*/