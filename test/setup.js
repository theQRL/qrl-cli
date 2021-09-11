const path = require('path');

const aliceEncPass = 'password123'
const bobEncPass = '321drowssap'

const notAWalletFile = path.join(__dirname, '/test-wallet/nope.json')
const badWallet = path.join(__dirname, '/test-wallet/badWallet.json')
const emptyWallet = path.join(__dirname, '/test-wallet/emptyWallet.json')

const notAKeyFile = path.join(__dirname, '/lattice/nopeKey.json')
const badSignedMessage = path.join(__dirname, '/lattice/badSignedMessage.json')
const shortSignedMessage = path.join(__dirname, '/lattice/shortSignedMessage.json')
const emptyText = path.join(__dirname, '/lattice/empty.txt')

const aliceToBob = path.join(__dirname, '/lattice/alice/toBob.txt')
const bobToAlice = path.join(__dirname, '/lattice/bob/toAlice.txt')


const bigFile = path.join(__dirname, '../render1563726016790.gif')

const bigFileOut = path.join(__dirname, '/lattice/alice/encBigFile.txt')

// ///////////////////
// lattice functions
// ///////////////////



// const bobTEMPCipherTextOut = path.join(__dirname, '')
// const bobTEMPSignedMessageOut = path.join(__dirname, '')


// ******
// alice 
// ******

// lattice keys
const aliceLatticeLocation = path.join(__dirname, '/lattice/alice/alice-lattice.json')
const aliceTempLatticeKey = path.join(__dirname, '/lattice/aliceTempLatticeKey.json')
// enc lattice keys
const aliceENCLatticeLocation = path.join(__dirname, '/lattice/alice/alice-lattice-enc.json')
const aliceTempENCLatticeKey = path.join(__dirname, '/lattice/aliceTempENCLatticeKey.json')
// signed message
const aliceSignedMessageOut = path.join(__dirname, '/lattice/alice/aliceSignedMessage.txt')
const aliceTempSignedMessageOut = path.join(__dirname, '/lattice/alice/aliceTempSignedMessage.txt')
// shared key
const aliceSharedKeyFile = path.join(__dirname, '/lattice/alice/alice-Shared-Key-List.txt')
const aliceTempSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceTempSharedKeyList.txt')

const aliceRegenSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceRegenSharedKey.txt')
const aliceTempRegenSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceTempRegenSharedKeyList.txt')

const aliceENCSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceENCSharedKeyList.txt')
const aliceTempENCSharedKeyFile = path.join(__dirname, '/lattice/alice/aliceTempENCSharedKeyList.txt')
// ciphertext
const aliceCipherTextOut = path.join(__dirname, '/lattice/alice/aliceCyphertext.txt')
const aliceTempCipherTextOut = path.join(__dirname, '/lattice/alice/aliceTempCyphertext.txt')
// pubKey
const alicePubKeyFile = path.join(__dirname, '/lattice/bob/alice-pub-lattice.json')
const aliceTempPubKeyFile = path.join(__dirname, '/lattice/bob/alice-Temp-pub-lattice.json')
// wallets 
const alicePTWalletLocation = path.join(__dirname, '/test-wallet/alice-wallet-PT.json')
const aliceTempPTWalletLocation = path.join(__dirname, '/test-wallet/alice-wallet-PT.json')
// enc wallets
const aliceENCWalletLocation = path.join(__dirname, '/test-wallet/alice-wallet-ENC.json')
const aliceTempENCWalletLocation = path.join(__dirname, '/test-wallet/alice-wallet-ENC.json')

const aliceDecryptedFile = path.join(__dirname, '/lattice/alice/aliceDecryptedMessage.txt')
const aliceDecryptedJSONFile = path.join(__dirname, '/lattice/alice/aliceDecryptedJSONMessage.txt')
const aliceTempDecryptedFile = path.join(__dirname, '/lattice/alice/aliceTempDecryptedMessage.txt')

const aliceEncFile = path.join(__dirname, '/lattice/bob/alicesEncMessage.enc')
const aliceEncJSONFile = path.join(__dirname, '/lattice/bob/alicesEncJSONMessage.enc')
const aliceTempEncFile = path.join(__dirname, '/lattice/bob/alicesTempEncMessage.enc')
const aliceTempEncJSONFile = path.join(__dirname, '/lattice/bob/alicesTempEncJSONMessage.enc')

// ******
// bob
// ******

// primary lattice keys used for shared keys and encryption
const bobLatticeLocation = path.join(__dirname, '/lattice/bob/bob-lattice.json')
const bobTempLatticeKey = path.join(__dirname, '/lattice/bobtempLatticeKey.json')

const bobENCLatticeLocation = path.join(__dirname, '/lattice/bob/bob-lattice-enc.json')
const bobTempENCLatticeKey = path.join(__dirname, '/lattice/bobtempENCLatticeKey.json')

const bobPubKeyFile = path.join(__dirname, '/lattice/alice/bob-pub-lattice.json')
const bobTempPubKeyFile = path.join(__dirname, '/lattice/alice/bob-pub-lattice.json')

const bobPTWalletLocation = path.join(__dirname, '/test-wallet/bob-wallet-PT.json')
const bobTempPTWalletLocation = path.join(__dirname, '/test-wallet/bob-wallet-PT.json')

const bobENCWalletLocation = path.join(__dirname, '/test-wallet/bob-wallet-ENC.json')
const bobTempENCWalletLocation = path.join(__dirname, '/test-wallet/bob-wallet-ENC.json')


const bobCipherTextOut = path.join(__dirname, '/lattice/bob/bob-cipher-text.txt')
const bobTempCipherTextOut = path.join(__dirname, '/lattice/bob/bob-temp-cipher-text.txt')

const bobSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-shared-key-list.txt')

const bobTempRegenSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-temp-regen-shared-key-list.txt')
const bobRegenSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-regen-shared-key-list.txt')

const bobTempSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-temp-shared-Key-list.txt')
const bobTempEncSharedKeyFile = path.join(__dirname, '/lattice/bob/bob-temp-shared-Key-list.txt')

const bobSignedMessageOut = path.join(__dirname, '/lattice/bob/bob-signed-message.txt')
const bobTempSignedMessageOut = path.join(__dirname, '/lattice/bob/bob-temp-signed-message.txt')

const badEncJsonCipher = path.join(__dirname, '/lattice/badEncJson_cipher.enc')
const badEncJsonKey = path.join(__dirname, '/lattice/badEncJson_key.enc')
const badEncJsonPayload = path.join(__dirname, '/lattice/badEncJson_payload.enc')

const bobDecryptedFile = path.join(__dirname, '/lattice/bob/bobDecryptedMessage.txt')
const bobDecryptedJSONFile = path.join(__dirname, '/lattice/bob/bobDecryptedJSONMessage.txt')
const bobTempDecryptedFile = path.join(__dirname, '/lattice/bob/bobTempDecryptedMessage.txt')

const bobEncFile = path.join(__dirname, '/lattice/alice/bobEncMessage.enc')
const bobEncJSONFile = path.join(__dirname, '/lattice/alice/bobEncJSONMessage.enc')

const bobTempEncFile = path.join(__dirname, '/lattice/alice/bobTempEncMessage.enc')
const bobTempEncJSONFile = path.join(__dirname, '/lattice/alice/bobTempEncJSONMessage.enc')

module.exports = {
  aliceEncPass,
  bobEncPass,

  notAWalletFile,
  badWallet,
  emptyWallet,
  badSignedMessage,
  shortSignedMessage,
  emptyText,
  notAKeyFile,
  badEncJsonCipher,
  badEncJsonKey,
  badEncJsonPayload,
  aliceToBob,
  bobToAlice,
  bigFile,
  bigFileOut,

  aliceTempPTWalletLocation,
  aliceTempENCWalletLocation,
  alicePTWalletLocation,
  aliceENCWalletLocation,
  aliceLatticeLocation,
  aliceENCLatticeLocation,
  aliceSignedMessageOut,
  aliceSharedKeyFile,
  aliceRegenSharedKeyFile,
  aliceTempRegenSharedKeyFile,
  aliceENCSharedKeyFile,
  aliceCipherTextOut,
  alicePubKeyFile,
  aliceTempPubKeyFile,

  aliceTempLatticeKey,
  aliceTempENCLatticeKey,
  aliceTempSignedMessageOut,
  aliceTempSharedKeyFile,
  aliceTempENCSharedKeyFile,
  aliceTempCipherTextOut,
  
  aliceDecryptedFile,
  aliceTempDecryptedFile,
  aliceDecryptedJSONFile,

  aliceEncFile,
  aliceEncJSONFile,
  aliceTempEncFile,
  aliceTempEncJSONFile,


  bobPTWalletLocation,
  bobENCWalletLocation,
  bobTempPTWalletLocation,
  bobTempENCWalletLocation,
  bobTempPubKeyFile,

  bobCipherTextOut,
  bobSharedKeyFile,
  bobSignedMessageOut,
  bobTempCipherTextOut,
  bobTempSharedKeyFile,
  bobRegenSharedKeyFile,
  bobTempRegenSharedKeyFile,
  bobTempSignedMessageOut,
  bobTempEncSharedKeyFile,

  bobLatticeLocation,
  bobTempLatticeKey,
  bobTempENCLatticeKey,
  bobENCLatticeLocation,
  bobPubKeyFile,
  
  bobDecryptedFile,
  bobDecryptedJSONFile,
  bobTempDecryptedFile,
  bobEncFile,
  bobEncJSONFile,
  bobTempEncFile,
  bobTempEncJSONFile,
} 


