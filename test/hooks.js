// ////////////////////////// 
// hooks.js
// 
// Setup chain functions prior to running tests. 
// This file cleans up after it's self.
// 
// OTS Keys 0 - 10
// //////////////////////////

const fs = require('fs')
const {spawn} = require('child_process')
const setup = require('./setup')

const processFlags = {
  detached: true,
  stdio: 'inherit',
}

function walletCreate(input) {
  // let exitCode
  const args = [
    'create-wallet',
    '-3',
    '-h', '6',
    '-f', input.dir,
  ]
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      // exitCode = code
      done(code)
    })
  })
}

function encWalletCreate(input) {
  // let exitCode
  const args = [
    'create-wallet',
    '-3',
    '-h', '6',
    '-f', input.dir,
    '-p', input.encPass,
  ]
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      // exitCode = code
      done(code)
    })
  })
}

async function getKeys(input) {
  const args = [
    'get-keys',
      '-T', input.hash,
      '-t',
      '-f', input.outFile,
    ]
    const keys = await spawn('./bin/run', args, processFlags)
    return keys
  } 

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

function latticeCreate(input) {
  // let exitCode
  const args = [
    'generate-lattice-keys',
    '-i', input.index,
    '-w', input.wallet,
    '-c', input.outFile,
    '-t',
    '-b',
  ]
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      const latticeTX = openFile(input.outFile)
      const txID = latticeTX[0].tx_hash
      // console.log(`\n\nlatticeTX: ${JSON.stringify(latticeTX)}\ntxID: ${txID}\n\n`)
      getKeys({ hash: txID, outFile: input.pubKeyFile })
      done(code)
    })
    })
}

function encLatticeCreate(input) {
  // let exitCode
  const args = [
    'generate-lattice-keys',
    '-i', input.index,
    '-w', input.wallet,
    '-c', input.outFile,
    '-p', input.pass,
    '-e', input.encPass,
    '-t',
    '-b',
  ]
  before(done => {
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      // exitCode = code
      done(code)
    })
  })
}

function sharedKeys(input) {
  before(done => {
    const args = [
      'generate-shared-keys',
      input.pubkey, 
      input.seckey, 
      '-c', input.cipherText,
      '-k', input.sharedKeyFile,
      '-s', input.signedMessage,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      done(code)
    })
  })
}

function regenSharedKeys(input) {
  before(done => {
    const args = [
      'generate-shared-keys',
      input.pubkey, 
      input.seckey, 
      input.cipherText,
      input.signedMessage,
      '-k', input.sharedKeyFile,
      '-t',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', () => {
      done()
    })
  })
}


// encrypt data using shared keys
function encryptData(input) {
  before(done => {
    const args = [
     'shared-key-encrypt',
      input.sharedKeyFile,
      input.plaintextFile,
      '-i', '1',
      '-o', input.EncOutFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      done(code)
    })
  })
}

function encryptJSONData(input) {
  before(done => {
    const args = [
     'shared-key-encrypt',
      input.sharedKeyFile,
      input.plaintextFile,
      '-i', '1',
      '-j',
      '-o', input.EncJSONOutFile,
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', code => {
      done(code)
    })
  })
}

function decryptData(input) {
  before(done => {
    const args = [
      'shared-key-decrypt',
      input.sharedKeyFile,
      input.encFile,
      '-o', input.decryptedFile,
      '-i', '1',
    ]
    const process = spawn('./bin/run', args, processFlags)
    process.on('exit', () => {
      done()
    })
  })
}


function fileRemove(dir) {
  let exitCode
  try {
    fs.unlinkSync(dir)

  }
  catch(err) {
    exitCode = err
  }
    return exitCode
}

exports.mochaHooks = {
  // global setup for all tests
  beforeAll: function _Hooks() {


    // create a non-wallet file
    let content = 'Some content, not a wallet!'
    let createCode = ''
    fs.writeFile(setup.badWallet, content, err => {
      if (err) {
        createCode(err)
      }
    })

    // create a notAWalletFile
    content = 'Some content, not a wallet!'
    createCode = ''
    fs.writeFile(setup.notAWalletFile, content, err => {
      if (err) {
        createCode(err)
      }
    })

    // create a notAKeyFile
    content = 'Some content, not a key!'
    createCode = ''
    fs.writeFile(setup.notAKeyFile, content, err => {
      if (err) {
        createCode(err)
      }
    })

    // empty file
    fs.writeFile(setup.emptyWallet, '', err => {
      if (err) {
        createCode(err)
      }
    })

    const badSMcontent = '[]'
    // empty array file
    fs.writeFile(setup.badSignedMessage, badSMcontent, err => {
      if (err) {
        createCode(err)
      }
    })

    const shortSMcontent = '["This is not the key you want here"]'
    // empty array file
    fs.writeFile(setup.shortSignedMessage, shortSMcontent, err => {
      if (err) {
        createCode(err)
      }
    })

    // alice Message to bob
    const aliceMessage = 'Hey Bob, how\'s it going?\n\nAlice,'
    fs.writeFile(setup.aliceToBob, aliceMessage, err => {
      if (err) {
        createCode(err)
      }
    })
    const bobMessage = 'Hey Alice, how\'s it going?\n\nBob,'
    // empty array file
    fs.writeFile(setup.bobToAlice, bobMessage, err => {
      if (err) {
        createCode(err)
      }
    })


    // create a notAWalletFile
    content = ''
    createCode = ''
    fs.writeFile(setup.emptyText, content, err => {
      if (err) {
        createCode(err)
      }
    })



    // create alice wallets
    walletCreate({dir: setup.alicePTWalletLocation })
    encWalletCreate({ dir: setup.aliceENCWalletLocation, encPass: setup.aliceEncPass })
    
    // create bob wallets
    walletCreate({ dir: setup.bobPTWalletLocation })
    encWalletCreate({ dir: setup.bobENCWalletLocation, encPass: setup.bobEncPass })
    
    // Alice lattice keys
    latticeCreate({ wallet: setup.alicePTWalletLocation, outFile: setup.aliceLatticeLocation, index: '0', pubKeyFile: setup.alicePubKeyFile })
    encLatticeCreate({ wallet: setup.alicePTWalletLocation, outFile: setup.aliceENCLatticeLocation, index: '1', pass: setup.aliceEncPass, encPass: setup.aliceEncPass })
    encLatticeCreate({ wallet: setup.aliceENCWalletLocation, outFile: setup.aliceENCLatticeLocation, index: '2', pass: setup.aliceEncPass, encPass: setup.aliceEncPass })
    
    // Bob lattice keys
    latticeCreate({ wallet: setup.bobPTWalletLocation, outFile: setup.bobLatticeLocation, index: '0', pubKeyFile: setup.bobPubKeyFile })
    encLatticeCreate({ wallet: setup.bobPTWalletLocation, outFile: setup.bobENCLatticeLocation, index: '1', pass: setup.bobEncPass, encPass: setup.bobEncPass })
    encLatticeCreate({ wallet: setup.bobENCWalletLocation, outFile: setup.bobENCLatticeLocation, index: '2', pass: setup.bobEncPass, encPass: setup.bobEncPass })

    // Generate bob's shared key file from his secret lattice keys + Alice's public lattice keys
    sharedKeys({ pubkey: setup.alicePubKeyFile, seckey: setup.bobLatticeLocation, cipherText: setup.bobCipherTextOut, sharedKeyFile: setup.bobSharedKeyFile, signedMessage: setup.bobSignedMessageOut })
    // Re-Generate Alice's Shared Key file from bob's cyphertext, signedMessage and pub keys + alice's Secret Lattice Keys
    regenSharedKeys({ pubkey: setup.bobPubKeyFile, seckey: setup.aliceLatticeLocation, cipherText: setup.bobCipherTextOut, sharedKeyFile: setup.aliceRegenSharedKeyFile, signedMessage: setup.bobSignedMessageOut })
    
    // Generate Alice's shared key list from her secret lattice keys + bob's public lattice keys
    sharedKeys({ pubkey: setup.bobPubKeyFile, seckey: setup.aliceLatticeLocation, cipherText: setup.aliceCipherTextOut, sharedKeyFile: setup.aliceSharedKeyFile, signedMessage: setup.aliceSignedMessageOut })
    // Re-Generate Bob's Shared Key file from alices's cyphertext, signedMessage and pub keys + bob's Secret Lattice Keys
    regenSharedKeys({ pubkey: setup.alicePubKeyFile, seckey: setup.bobLatticeLocation, cipherText: setup.aliceCipherTextOut, sharedKeyFile: setup.bobRegenSharedKeyFile, signedMessage: setup.aliceSignedMessageOut })
    
    // alice Encrypts data for bob
    encryptData({ sharedKeyFile: setup.aliceSharedKeyFile, plaintextFile: setup.aliceToBob, EncOutFile: setup.bobEncFile })
    encryptJSONData({ sharedKeyFile: setup.aliceSharedKeyFile, plaintextFile: setup.aliceToBob, EncJSONOutFile: setup.bobEncJSONFile })

    // bob encrypts data for alice
    encryptData({ sharedKeyFile: setup.bobSharedKeyFile, plaintextFile: setup.bobToAlice, EncOutFile: setup.aliceEncFile })
    encryptJSONData({ sharedKeyFile: setup.bobSharedKeyFile, plaintextFile: setup.bobToAlice, EncJSONOutFile: setup.aliceEncJSONFile })

    // Bob Decrypts Data from Alice
    decryptData({ sharedKeyFile: setup.bobRegenSharedKeyFile, encFile: setup.bobEncFile, decryptedFile: setup.bobDecryptedFile })
    decryptData({ sharedKeyFile: setup.bobRegenSharedKeyFile, encFile: setup.bobEncJSONFile, decryptedFile: setup.bobDecryptedJSONFile })

    // Alice Decrypts Data from Bob

    decryptData({ sharedKeyFile: setup.aliceRegenSharedKeyFile, encFile: setup.aliceEncFile, decryptedFile: setup.aliceDecryptedFile })
    decryptData({ sharedKeyFile: setup.aliceRegenSharedKeyFile, encFile: setup.aliceEncJSONFile, decryptedFile: setup.aliceDecryptedJSONFile })


/*
*/
  },

  // one-time final cleanup
  afterAll: function _After() {

    fileRemove(setup.badWallet)
    fileRemove(setup.emptyWallet)
    fileRemove(setup.badSignedMessage)
    fileRemove(setup.shortSignedMessage)
    fileRemove(setup.emptyText)
    fileRemove(setup.notAWalletFile)

    fileRemove(setup.notAKeyFile)

    fileRemove(setup.bobLatticeLocation)
    fileRemove(setup.bobTempLatticeKey)

    fileRemove(setup.bobENCLatticeLocation)
    fileRemove(setup.bobTempENCLatticeKey)

    fileRemove(setup.bobPTWalletLocation)
    fileRemove(setup.bobTempPTWalletLocation)
    
    fileRemove(setup.bobENCWalletLocation)
    fileRemove(setup.bobTempENCWalletLocation)

    fileRemove(setup.bobPubKeyFile)
    fileRemove(setup.bobTempPubKeyFile)

    fileRemove(setup.bobCipherTextOut)
    fileRemove(setup.bobTempCipherTextOut)
    fileRemove(setup.bobSharedKeyFile)
    fileRemove(setup.bobTempSharedKeyFile)
    fileRemove(setup.bobSignedMessageOut)
    fileRemove(setup.bobTempSignedMessageOut)


    fileRemove(setup.aliceENCSharedKeyFile)
    fileRemove(setup.aliceTempENCSharedKeyFile)

    fileRemove(setup.aliceLatticeLocation)
    fileRemove(setup.aliceTempLatticeKey)

    fileRemove(setup.aliceENCLatticeLocation)
    fileRemove(setup.aliceTempENCLatticeKey)

    fileRemove(setup.aliceSignedMessageOut)
    fileRemove(setup.aliceTempSignedMessageOut)

    fileRemove(setup.aliceSharedKeyFile)
    fileRemove(setup.aliceTempSharedKeyFile)

    fileRemove(setup.aliceCipherTextOut)
    fileRemove(setup.aliceTempCipherTextOut)
   
    fileRemove(setup.alicePubKeyFile)
    fileRemove(setup.aliceTempPubKeyFile)
    
    fileRemove(setup.alicePTWalletLocation)
    fileRemove(setup.aliceTempPTWalletLocation)
    
    fileRemove(setup.aliceENCWalletLocation)
    fileRemove(setup.aliceTempENCWalletLocation)
    fileRemove(setup.bobTempEncSharedKeyFile)

    fileRemove(setup.aliceMessage)
    fileRemove(setup.bobMessage)
    
    fileRemove(setup.aliceTempDecryptedFile)
    fileRemove(setup.bobTempDecryptedFile)

    fileRemove(setup.aliceEncJSONFile)
    fileRemove(setup.bobEncJSONFile)

    fileRemove(setup.aliceRegenSharedKeyFile)
    fileRemove(setup.aliceTempRegenSharedKeyFile)
    fileRemove(setup.bobRegenSharedKeyFile)
    fileRemove(setup.bobTempRegenSharedKeyFile)


    fileRemove(setup.aliceDecryptedFile)
    fileRemove(setup.aliceDecryptedJSONFile)
    fileRemove(setup.aliceEncFile)
    fileRemove(setup.bobDecryptedFile)
    fileRemove(setup.bobDecryptedJSONFile)
    fileRemove(setup.bobEncFile)
    fileRemove(setup.aliceTempEncFile)
    fileRemove(setup.aliceTempEncJSONFile)
    fileRemove(setup.bobTempEncFile)
    fileRemove(setup.bobTempEncJSONFile)
    fileRemove(setup.bigFileOut)
    fileRemove(setup.aliceToBob)
    fileRemove(setup.bobToAlice)
  }
};
