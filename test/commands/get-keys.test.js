const assert = require('assert')
const {spawn} = require('child_process')

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

// get-keys command without any flags
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
    'notAnAddress',
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

// get keys from address given
describe('get-keys #6', () => {
  const args = [
    'get-keys',
    '-a',
    'Q020200cf30b98939844cecbaa20e47d16b83aa8de58581ec0fda34d83a42a5a665b49986c4b832',
    '-i',
    '1',
    '-p',
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
  it('exit code should be 0 if everything is correct', () => {
    assert.strictEqual(exitCode, 0)
  })
})