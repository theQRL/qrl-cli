// ////////////////////////
//
// Define frequently used values for tests
//
// ////////////////////////
const path = require('path');

const encPass = 'testing'
const aliceEncPass = 'password123'
const bobEncPass = '321drowssap'
const emptyText = path.join(__dirname, '/test-wallet/empty.txt')

// ///////
// Wallets
// ///////

const badWallet = path.join(__dirname, '/test-wallet/badWallet.json') // bad wallet json
const notAWalletFile = path.join(__dirname, '/test-wallet/nope.json') // bad wallet nope
const walletFile = path.join(__dirname, '/test-wallet/wallet.json') // plain text wallet. OTS: 0, 1
const encWalletFile = path.join(__dirname, '/test-wallet/encWallet.json') // encrypted wallet. OTS: 0,

// Alice
const alicePTWalletLocation = path.join(__dirname, '/test-wallet/alice-wallet-PT.json') // plain text wallet. OTS: 0,1,
const aliceTempPTWalletLocation = path.join(__dirname, '/test-wallet/alice-temp-wallet-PT.json') // plain test wallet. OTS: 0,
const aliceENCWalletLocation = path.join(__dirname, '/test-wallet/alice-wallet-ENC.json') // encrypted wallet. OTS: 0,
const aliceTempENCWalletLocation = path.join(__dirname, '/test-wallet/alice-temp-wallet-ENC.json') // encrypted wallet. OTS: 0,

// Bob
const bobPTWalletLocation = path.join(__dirname, '/test-wallet/bob-wallet-PT.json') // plain text wallet OTS: 0,1,
const bobTempPTWalletLocation = path.join(__dirname, '/test-wallet/bob-temp-wallet-PT.json') // plain test wallet OTS: 0,1,2
const bobENCWalletLocation = path.join(__dirname, '/test-wallet/bob-wallet-ENC.json') // encrypted wallet OTS: 0,
const bobTempENCWalletLocation = path.join(__dirname, '/test-wallet/bob-temp-wallet-ENC.json') // encrypted wallet. OTS: 0,


// ////////////
// Lattice Keys
// ////////////

// Alice
const aliceLatticeLocation = path.join(__dirname, '/lattice/alice/alice-lattice.json')
const aliceTempLatticeKey = path.join(__dirname, '/lattice/aliceTempLatticeKey.json')
const aliceENCLatticeLocation = path.join(__dirname, '/lattice/alice/alice-lattice-enc.json')
const aliceTempENCLatticeKey = path.join(__dirname, '/lattice/aliceTempENCLatticeKey.json')
// pubKey
const alicePubKeyFile = path.join(__dirname, '/lattice/bob/alice-pub-lattice.json')
const aliceTempPubKeyFile = path.join(__dirname, '/lattice/bob/alice-Temp-pub-lattice.json')
// --------------------
// GENERATE SHARED KEYS
// --------------------
// signed message
const aliceSignedMessageOut = path.join(__dirname, '/lattice/alice/aliceSignedMessage.txt')
const aliceTempSignedMessageOut = path.join(__dirname, '/lattice/alice/aliceTempSignedMessage.txt')
// shared key
const aliceSharedKeyFile = path.join(__dirname, '/lattice/alice/alice-Shared-Key-List.txt')
const aliceTempSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceTempSharedKeyList.txt')
const aliceENCSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceENCSharedKeyList.txt')
const aliceTempENCSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceTempENCSharedKeyList.txt')
const aliceRegenSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceRegenSharedKey.txt')
const aliceTempRegenSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceTempRegenSharedKeyList.txt')
// ciphertext
const aliceCipherTextOut = path.join(__dirname, '/lattice/alice/aliceCyphertext.txt')
const aliceTempCipherTextOut = path.join(__dirname, '/lattice/alice/aliceTempCyphertext.txt')

// ////////////
// Lattice Keys
// ////////////

// Bob
const bobLatticeLocation = path.join(__dirname, '/lattice/bob/bob-lattice.json')
const bobTempLatticeKey = path.join(__dirname, '/lattice/bobtempLatticeKey.json')
const bobENCLatticeLocation = path.join(__dirname, '/lattice/bob/bob-lattice-enc.json')
const bobTempENCLatticeKey = path.join(__dirname, '/lattice/bobtempENCLatticeKey.json')
// pubKey
const bobPubKeyFile = path.join(__dirname, '/lattice/alice/bob-pub-lattice.json')
const bobTempPubKeyFile = path.join(__dirname, '/lattice/alice/bob-pub-lattice.json')
// --------------------
// GENERATE SHARED KEYS
// --------------------
const bobSignedMessageOut = path.join(__dirname, '/lattice/bob/bob-signed-message.txt')
const bobTempSignedMessageOut = path.join(__dirname, '/lattice/bob/bob-temp-signed-message.txt')
// shared keys
const bobSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-shared-key-list.txt')
const bobTempSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-temp-shared-Key-list.txt')
const bobTempEncSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-temp-shared-Key-list.txt')
const bobRegenSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-regen-shared-key-list.txt')
const bobTempRegenSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-temp-regen-shared-key-list.txt')
// ciphertext
const bobCipherTextOut = path.join(__dirname, '/lattice/bob/bob-cipher-text.txt')
const bobTempCipherTextOut = path.join(__dirname, '/lattice/bob/bob-temp-cipher-text.txt')

// /////////
// Send Test 
// /////////

const sendTXOfflineFile = path.join(__dirname, '/test-wallet/offlineTX.json')


// export the things
module.exports = {
  encPass,
  aliceEncPass,
  bobEncPass,
  emptyText,
  
  badWallet,
  notAWalletFile,
  walletFile,
  encWalletFile,

  alicePTWalletLocation,
  aliceTempPTWalletLocation,
  aliceENCWalletLocation,
  aliceTempENCWalletLocation,
  
  bobPTWalletLocation,
  bobTempPTWalletLocation,
  bobENCWalletLocation,
  bobTempENCWalletLocation,
  
  aliceLatticeLocation,
  aliceTempLatticeKey,
  aliceENCLatticeLocation,
  aliceTempENCLatticeKey,
  
  alicePubKeyFile,
  aliceTempPubKeyFile,

  aliceSignedMessageOut,
  aliceTempSignedMessageOut,
  aliceSharedKeyFile,
  aliceTempSharedKeyFile,
  aliceENCSharedKeyFile,
  aliceTempENCSharedKeyFile,
  aliceRegenSharedKeyFile,
  aliceTempRegenSharedKeyFile,
  aliceCipherTextOut,
  aliceTempCipherTextOut,

  bobLatticeLocation,
  bobTempLatticeKey,
  bobENCLatticeLocation,
  bobTempENCLatticeKey,
  
  bobPubKeyFile,
  bobTempPubKeyFile,

  bobSignedMessageOut,
  bobTempSignedMessageOut,
  bobSharedKeyFile,
  bobTempSharedKeyFile,
  bobRegenSharedKeyFile,
  bobTempRegenSharedKeyFile,
  bobTempEncSharedKeyFile,
  bobCipherTextOut,
  bobTempCipherTextOut,

  sendTXOfflineFile,

} 


