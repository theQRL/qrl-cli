/* eslint prefer-arrow-callback: [ "error", { "allowNamedFunctions": true } ] */
/* eslint new-cap: 0 */
/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
/*
This command will run 2 functions overall
  Case #1. Alice generates a new enc_shared_key_file and enc_secret + keylist for Bob's public lattice keys given through tx_id, Pub_Lattice_keys JSON or Pub_Lattice_Keys_file
  Case #2. Bob, Given Alice's cyphertext and enc_secret will DECRYPT the keys using his kyber SK and generate the same keylist Alice has using the private keys that match the tx_id Alice used

  case #1 
    requirements -
      - Alice's Local secret lattice_keys - either:
        - lattice_keyfile
        - kyberSK, dilithiumSK, ecdsaSK (hex)
      - Bob's lattice keys - either:
        - tx_id from users lattice_tx
        - local recipient_lattice_PUB
    generates -
      - kyber encrypted shared_key using recipients pub lattice key and local lattice secret key
      - encrypted cyphertext (shared_secret) encrypted with the new shared_key
      - key_list from generated from the new shared_secret, ran through shake128 (or any hashing function) (optional password protected)

  case #2 
    requirements -
      - Alice shares the shared_key encrypted with Bob's PUB_kyber_key and Alice's SEC_Kyber_Key from output of (case #1 output b) and the shared_secret encrypted with shared_key from other user (case #1 output a)
      - Bob's secret lattice keys associated to PUB_kyber_key and TXhash Alice used to decrypt either:
        - key file 
        - json keys passed through flag
    generates -
      - Alice's decrypted shared key is used to further decrypt the shared_secret which is used to generate the shared_keylist
      - generates the same shared key_list from shared_secret ran through shake128 (or the same hashing function that was used to generate the initial list) (optional password protected)
*/

// ///////////////////////// 
// CONST AND FUNCTIONS  
// ///////////////////////// 
const { Command, flags } = require('@oclif/command')
// const { red, white } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
// eslint-disable-next-line no-unused-vars
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl')
// eslint-disable-next-line no-unused-vars
const { DILLIBmodule } = require('qrllib/build/offline-libjsdilithium')
// eslint-disable-next-line no-unused-vars
const { KYBLIBmodule } = require('qrllib/build/offline-libjskyber')
const Crypto = require('crypto')
const eccrypto = require('eccrypto')
const aesjs = require('aes-js')
const Qrlnode = require('../functions/grpc')

let KYBLIBLoaded = false
let DILLIBLoaded = false
let QRLLIBLoaded = false
let cypherText = 'cypherText.txt'
let signedMessage = 'signedMessage.txt'
let sharedKeyListFile = 'sharedKeyList.txt'

const openEphemeralFile = function oEF(path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

const waitForQRLLIB = (callBack) => {
  setTimeout(() => {
    // Test the QRLLIB object has the str2bin function.
    // This is sufficient to tell us QRLLIB has loaded.
    if (typeof QRLLIB.str2bin === 'function' && QRLLIBLoaded === true) {
      callBack()
    } else {
      QRLLIBLoaded = true
      return waitForQRLLIB(callBack)
    }
    return false
  }, 50)
}
const waitForKYBLIB = callBack => {
  setTimeout(() => {
    // Test the KYBLIB object has the getString function.
    // This is sufficient to tell us KYBLIB has loaded.
    if (typeof KYBLIB.getString === 'function' && KYBLIBLoaded === true) {
      callBack()
    } else {
      KYBLIBLoaded = true
          return waitForKYBLIB(callBack)
    }
    return false
  }, 50)
}

const waitForDILLIB = callBack => {
  setTimeout(() => {
    // Test the DILLIB object has the getString function.
    // This is sufficient to tell us DILLIB has loaded.
    if (typeof DILLIB.getString === 'function' && DILLIBLoaded === true) {
      callBack()
    } else {
      DILLIBLoaded = true
      return waitForDILLIB(callBack)
    }
    return false
  }, 50)
}

// Convert bytes to hex
function bytesToHex(byteArray) {
  return [...byteArray]
    /* eslint-disable */
    .map((byte) => {
      return ('00' + (byte & 0xff).toString(16)).slice(-2)
    })
    /* eslint-enable */
    .join('')
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

const checkCipherTextJson = (checkCipher) => {
  const valid = {}
  valid.status = true
  if (checkCipher === undefined) {
    valid.status = false
    valid.error = 'array is undefined'
    return valid
  }
  const arrayLength = Object.keys(checkCipher).length
  if (arrayLength === 0) {
    valid.status = false
    valid.error = 'length of array is 0'
    return valid
  }
  // check that the json has keys as expected 
  if (!JSON.stringify(checkCipher).includes('iv')) {
    valid.status = false
    valid.error = `Output does not have a iv key buffer`
    return valid
  }
  if (!JSON.stringify(checkCipher).includes('ephemPublicKey')) {
    valid.status = false
    valid.error = `Output does not have a ephemPublicKey key buffer`
    return valid
  }
  if (!JSON.stringify(checkCipher).includes('ciphertext')) {
    valid.status = false
    valid.error = `Output does not have a ciphertext key buffer`
    return valid
  }
  if (!JSON.stringify(checkCipher).includes('mac')) {
    valid.status = false
    valid.error = `Output does not have a mac key buffer`
    return valid
  }
  return valid
}


const checkSignedMessageJson = (signedMessage) => {
  const valid = {}
  valid.status = true
  if (signedMessage === undefined) {
    valid.status = false
    valid.error = 'array is undefined'
    return valid
  }
  const arrayLength = Object.keys(signedMessage).length
  if (arrayLength === 0) {
    valid.status = false
    valid.error = 'length of array is 0'
    return valid
  }
  // check that the json has one key and its 5466 characters
  if (signedMessage.length !== 5466) {
    valid.status = false
    valid.error = `Invalid output length ${signedMessage.length}, expected message length is 5466. Is JSON correct?`
    return valid
  }
  return valid
}
const checkLatticeJSON = (check) => {
  const valid = {}
  valid.status = true

  if (check === undefined) {
    valid.status = false
    valid.error = 'array is undefined'
    return valid
  }
  const arrayLength = Object.keys(check).length
  if (arrayLength === 0) {
    valid.status = false
    valid.error = 'length of array is 0'
    return valid
  }
  // is it a secret key? Array length of 1 (0)
  if (arrayLength === 1) {
    check.forEach((element, index) => {
      // check that the json has keys for kyber, dilithium, and ECDSA SK's 
      if (!JSON.stringify(element).includes('kyberPK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a kyberPK key`
        return valid
      }
      if (!JSON.stringify(element).includes('kyberSK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a kyberSK key`
        return valid
      }
      if (!JSON.stringify(element).includes('dilithiumSK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a dilithiumSK key`
        return valid
      }
      if (!JSON.stringify(element).includes('dilithiumPK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a dilithiumPK key`
        return valid
      }
      if (!JSON.stringify(element).includes('ecdsaSK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a ecdsaSK key`
        return valid
      }
      if (!JSON.stringify(element).includes('ecdsaPK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a ecdsaPK key`
        return valid
      }
      return valid
    })
    return valid
  }
  // is it a PUB key element? Array has 2 elements minimum ([0], [1])
  if (arrayLength >= 1) {
    for (let i = 1; i < arrayLength; i++) { // eslint-disable-line
      // check that the json has keys for kyber, dilithium, and ECDSA SK's 
        if (!JSON.stringify(check[i]).includes('pk1')) {
          valid.status = false
          valid.error = `Output #${i} does not have a pk1 (kyberPK) key`
          return valid
        }
        if (!JSON.stringify(check[i]).includes('pk2')) {
          valid.status = false
          valid.error = `Output #${i} does not have a pk2 (dilithiumPK) key`
          return valid
        }
        if (!JSON.stringify(check[i]).includes('pk3')) {
          valid.status = false
          valid.error = `Output #${i} does not have a pk (ecdsaPK) key`
          return valid
        }     
        if (!JSON.stringify(check[i]).includes('txHash')) {
          valid.status = false
          valid.error = `Output #${i} does not have a txHash`
          return valid
        }
      return valid
    }
    return valid
  }
  return valid
}

// check if file is empty
function isFileEmpty(fileName, ignoreWhitespace=true) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if( err ) {
        reject(err);
        return;
      }
      resolve((!ignoreWhitespace && data.length === 0) || (ignoreWhitespace && !!String(data).match(/^\s*$/)))
    });
  })
}

class LatticeShared extends Command {
  async run() {
    const {args, flags} = this.parse(LatticeShared)
    if (flags.cypherText) {
      cypherText = flags.cypherText
    }
    if (flags.signedMessage) {
      signedMessage = flags.signedMessage
    }
    if (flags.sharedKeyListFile) {
      sharedKeyListFile = flags.sharedKeyListFile
    }

// /////////////////////////
// network stuff
// /////////////////////////
    let grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
    let network = 'Mainnet'

    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = 'testnet-1.automated.theqrl.org:19009'
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = 'mainnet-1.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    this.log(`Generate Lattice Shared_Keys...`)
    const spinner = ora({ text: 'Fetching Lattice keys...\n', }).start()

    // Collect the required pub/sec keys needed to generate keys
    let latticeSK = []
    let latticePK = []
    let validSecretJson = ''
    let validPublicJson = ''
    let validCypherTextJson = ''
    let validSignedMessageJson = ''
    let pubKeyAddress = ''


// /////////////////////////
// 0.a Secret Lattice keys
// /////////////////////////
    if (args.latticeSK) {
      // check if the secret keys are a file or json
      if (fs.existsSync(args.latticeSK)) {
        // file submitted, is file empty?
        isFileEmpty(args.latticeSK).then( (isEmpty) => {
          if (isEmpty) {
            spinner.fail('Ciphertext File is empty...')
            this.exit(1)
          }
        })
        try{
          latticeSK = openFile(args.latticeSK)
        }
        catch (e) {
          spinner.fail('Unable to open file...')
          this.exit(1)
        }

        try {  
          if (latticeSK[0].encrypted === true) {
            let password
            if (flags.decryptPassword) {
              password = flags.decryptPassword
            } 
            else {
              password = await cli.prompt('Enter password for lattice file', {type: 'hide'})
            }
            latticeSK[0].encrypted = false
            latticeSK[0].tx_hash = aes256.decrypt(password, latticeSK[0].tx_hash)
            latticeSK[0].network = aes256.decrypt(password, latticeSK[0].network)
            latticeSK[0].kyberPK = aes256.decrypt(password, latticeSK[0].kyberPK)
            latticeSK[0].kyberSK = aes256.decrypt(password, latticeSK[0].kyberSK)
            latticeSK[0].dilithiumPK = aes256.decrypt(password, latticeSK[0].dilithiumPK)
            latticeSK[0].dilithiumSK = aes256.decrypt(password, latticeSK[0].dilithiumSK)
            latticeSK[0].ecdsaPK = aes256.decrypt(password, latticeSK[0].ecdsaPK)
            latticeSK[0].ecdsaSK = aes256.decrypt(password, latticeSK[0].ecdsaSK)
            if (!latticeSK[0].network.match(/^(Testnet|Mainnet|GRPC)$/)) {
              spinner.fail('Data still encrypted... Bad passphrase?')
              this.exit(1)
            } 
          }
        }
        catch (error) {
          spinner.fail(`Failed to decrypt: ${error}`)
          this.exit(1)
        }
      }
      else {
        // not a file, check for json
        try {
          // is it valid json
          latticeSK = JSON.parse(args.latticeSK)
        }
        catch (e) {
          spinner.fail('Invalid JSON given...')
          this.exit(1)
        }
        if (latticeSK[0].encrypted === true) {
          // is encrypted, get password
          let decryptPassword
          if (flags.decryptPassword) {
            // from flags
            decryptPassword = flags.decryptPassword
          } 
          else {
            // no flag passed, ask user for password
            decryptPassword = await cli.prompt('Enter password for lattice file', {type: 'hide'})
          }
          latticeSK[0].encrypted = false
          latticeSK[0].tx_hash = aes256.decrypt(decryptPassword, latticeSK[0].tx_hash)
          latticeSK[0].network = aes256.decrypt(decryptPassword, latticeSK[0].network)
          latticeSK[0].kyberPK = aes256.decrypt(decryptPassword, latticeSK[0].kyberPK)
          latticeSK[0].kyberSK = aes256.decrypt(decryptPassword, latticeSK[0].kyberSK)
          latticeSK[0].dilithiumPK = aes256.decrypt(decryptPassword, latticeSK[0].dilithiumPK)
          latticeSK[0].dilithiumSK = aes256.decrypt(decryptPassword, latticeSK[0].dilithiumSK)
          latticeSK[0].ecdsaPK = aes256.decrypt(decryptPassword, latticeSK[0].ecdsaPK)
          latticeSK[0].ecdsaSK = aes256.decrypt(decryptPassword, latticeSK[0].ecdsaSK)
          if (!latticeSK[0].network.match(/^(Testnet|Mainnet|GRPC)$/)) {
            spinner.fail('Data still encrypted... Bad passphrase?')
            this.exit(1)
          } 
        }
      }
      // check lattice file for valid json does it contain the keys we need
      validSecretJson = checkLatticeJSON(latticeSK)
      if (!validSecretJson.status) {
        // not valid, fail
        spinner.fail(`Invalid JSON found in secret keys... ${validSecretJson.error}`)
        this.exit(1)
      }
    }

// /////////////////////////
// 0.b connect to QRL node 
// /////////////////////////
    const Qrlnetwork = await new Qrlnode(grpcEndpoint)
    await Qrlnetwork.connect()
    // verify we have connected and try again if not
    let i = 0
    const count = 5
    while (Qrlnetwork.connection === false && i < count) {
      // spinner.succeed(`retry connection attempt: ${i}...`)
      // eslint-disable-next-line no-await-in-loop
      await Qrlnetwork.connect()
      // eslint-disable-next-line no-plusplus
      i++
    }

// /////////////////////////
// 0.c Public Lattice keys
// /////////////////////////
    // Check for file, txhash or JSON
    if (args.latticePK) {
        // check if the public keys are a file or json
        if (fs.existsSync(args.latticePK)) {
          // file submitted
          latticePK = openFile(args.latticePK)
          // check lattice file for valid json
        }
        // is a hexseed
        else if (args.latticePK.length === 64) {
          // fetch the transaction from the network
          spinner.succeed(`Grabbing public keys from ${network}`)
          const response = await Qrlnetwork.api('GetObject', {
            query: Buffer.from(args.latticePK, 'hex')
          })
          if (response.found === false) {
            spinner.fail('Unable to find transaction...')
            this.exit(1)
          } 
          else {
            // check that the response contains lattice keys
            if (!response.transaction.tx.latticePK) {
              // not a lattice transaction. Fail
              spinner.fail('No lattice transaction found...')
              this.exit(1)
            }
            pubKeyAddress = `Q${bytesToHex(response.transaction.addr_from)}`
            latticePK = [{
              address: pubKeyAddress,
              network,
            }]
            latticePK.push({ 
              pk1: bytesToHex(response.transaction.tx.latticePK.pk1),
              pk2: bytesToHex(response.transaction.tx.latticePK.pk2),
              pk3: bytesToHex(response.transaction.tx.latticePK.pk3),
              txHash: bytesToHex(response.transaction.tx.transaction_hash),
            })
          }
        }
        else {
          // Is it JSON, if so is it valid?
          try {
            latticePK = JSON.parse(args.latticePK)
          } 
          catch (e) {
            spinner.fail('not valid json or json file given...')
            this.exit(1)
          }
        }
        // is the json valid?
          validPublicJson = checkLatticeJSON(latticePK)
        if (!validPublicJson.status) {
          spinner.fail(`Invalid JSON found in public keys... ${validPublicJson.error}`)
        this.exit(1)
      }
    }
    let pubKeyIndexNum = 1
    if (flags.pubKeyIndex) {
      pubKeyIndexNum = flags.pubKeyIndex.toNumber()
    }

// /////////////////////////////////////
// 1. Generate new key list and secrets
// Alice sending to Bob initiating the key share
// /////////////////////////////////////
    if ( !args.cypherText && !args.signedMessage) {
      // Alice is sending the keys to bob initiating the key share
      const aliceKyberPK = latticeSK[0].kyberPK
      const aliceKyberSK = latticeSK[0].kyberSK
      const aliceDilithiumPK = latticeSK[0].dilithiumPK.toString('hex')
      const aliceDilithiumSK = latticeSK[0].dilithiumSK
      const bobKyberPK = latticePK[pubKeyIndexNum].pk1
      const bobECDSAPK = latticePK[pubKeyIndexNum].pk3

      waitForKYBLIB(async () => {
        waitForDILLIB(async () => {
          spinner.succeed(`Generating new shared secrets for`)
          spinner.succeed(`Address: ${latticePK[0].address}`)
          spinner.succeed(`Lattice Tx Hash: ${latticePK[pubKeyIndexNum].txHash}`)
          // Create the Kyber object from senders KyberSK and senders matching KyberPK
          const KYBOBJECT_SENDER = await new KYBLIB.Kyber.fromKeys(aliceKyberPK, aliceKyberSK)
          // Create the Dilithium object from senders DilithiumSK and senders matching DilithiumPK
          const DILOBJECT_SENDER = await new DILLIB.Dilithium.fromKeys(aliceDilithiumPK, aliceDilithiumSK)
          // Take a "random" 32 bytes seed using the Crypto library "sharedSecret"
          const seed = Crypto.randomBytes(32)
          // call kem_encode with recipientKyberPK
          KYBOBJECT_SENDER.kem_encode(bobKyberPK.toString('hex'))
          // get cyphertext and shared key 
          const aliceCypherText = KYBOBJECT_SENDER.getCypherText()
          const sharedKey = KYBOBJECT_SENDER.getMyKey()
          spinner.succeed(`Secrets Generated, encrypting keys...`)
          // encrypt cyphertext with encrypted AES key
          eccrypto.encrypt(Buffer.from(bobECDSAPK, 'hex'), Buffer.from(aliceCypherText)).then( function eccCypher(encryptedCypherText) {
            const mykey = Uint8Array.from(Buffer.from(sharedKey.toString(), 'hex'))
            // Encrypt the seed *s* with shared key *key*
            const aesCtr = new aesjs.ModeOfOperation.ctr(mykey)
            // encrypt the seed with
            const encSeed = aesCtr.encrypt(seed)
            // sender signs the payload with DilithiumSK
            const signedMsg = DILOBJECT_SENDER.sign(Buffer.from(encSeed).toString('hex'))
            // save encrpytedCypherText and signedMsg to a local file
            const encCypherTextJson = ['[', JSON.stringify(encryptedCypherText), ']'].join('')
            
            fs.writeFileSync(cypherText, encCypherTextJson)

            spinner.succeed(`Cyphertext file written to: ${cypherText}`)
            
            const signedMsgJson = ['[', JSON.stringify(signedMsg), ']'].join('')
            
            fs.writeFileSync(signedMessage, signedMsgJson)
            
            spinner.succeed(`Signed Message File file written to: ${signedMessage}`)
            // 9 - Generate the next 1000 keys with Shake128 and shared secret seed
            waitForQRLLIB(async () => {
              const sBin = QRLLIB.hstr2bin(Buffer.from(Buffer.from(seed).toString('hex')))
              let keylist = QRLLIB.shake128(64000, sBin)
              if (flags.encryptPassword) {
                keylist = aes256.encrypt(flags.encryptPassword, keylist)
              }

            
              fs.writeFileSync(sharedKeyListFile, QRLLIB.bin2hstr(keylist))
              
              spinner.succeed(`Shared Key List file written to: ${sharedKeyListFile}`)
            
            })
          })
        })
      })
    }
// /////////////////////////////////////////
// 2. Generate key list from shared secrets
// Bob receiving from Alice, re-generating keys to match Alice
// /////////////////////////////////////////

    else {
      // Bob received the secrets Alice sent. Use bobs kyberSK to make keys
      const aliceDilithiumPK = latticePK[pubKeyIndexNum].pk2
      const bobKyberPK = latticeSK[0].kyberPK
      const bobKyberSK = latticeSK[0].kyberSK
      const bobECDSASK = latticeSK[0].ecdsaSK
      let encCypherTextJson = []
      let signedMsgJson = []
      let signedMsg
      let encCypherText

      if (!args.signedMessage || !args.cypherText) {
        spinner.fail('Both Shared Secret and Shared Keys are required...')
        this.exit(1)
      }

      // is cipherTextFile a file?
      if (fs.existsSync(args.cypherText)) {
        // is file empty?
// spinner.succeed('is the file empty? ')
        isFileEmpty(args.cypherText).then( (isEmpty) => {
          if (isEmpty) {
            spinner.fail('Ciphertext File is empty...')
            this.exit(1)
          }
        })
        encCypherTextJson = openEphemeralFile(args.cypherText)
        // check for valid json here
        validCypherTextJson = await checkCipherTextJson(encCypherTextJson)
        if (!validCypherTextJson.status) {
          spinner.fail(`Invalid JSON found in encCipherTextJson... ${validCypherTextJson.error}`)
          this.exit(1)
        }
      }
      else {
        // not a file, is it json?
        try {
          encCypherTextJson = JSON.parse(args.cypherText)
        }
        catch (e) {
          spinner.fail('No valid cyphertext JSON data passed...')
          this.exit(1)
        }
        validCypherTextJson = await checkCipherTextJson(encCypherTextJson)
        if (!validCypherTextJson.status) {
          spinner.fail(`Invalid JSON found in encCipherTextJson... ${validCypherTextJson.error}`)
          this.exit(1)
        }
      }


      // is signedMessage a file?
      if (fs.existsSync(args.signedMessage)) {
        // is file empty?
        isFileEmpty(args.signedMessage).then( (isEmpty) => {
          if (isEmpty) {
            spinner.fail('signedMessage File is empty...')
            this.exit(1)
          }
        })
        signedMsgJson = openEphemeralFile(args.signedMessage)
        // check for valid json here
        validSignedMessageJson = await checkSignedMessageJson(signedMsgJson)
        if (!validSignedMessageJson.status) {
          spinner.fail(`Invalid JSON found in Signed Message JSON... ${validSignedMessageJson.error}`)
          this.exit(1)
        }
      }
      else {
        try {
          signedMsgJson = JSON.parse(args.signedMessage)
        }
        catch (e) {
          spinner.fail('invalid signed message json...')
        }
        // check for valid json here
        validSignedMessageJson = await checkSignedMessageJson(signedMsgJson[0])
        if (!validSignedMessageJson.status) {
          spinner.fail(`Invalid JSON found in Signed Message JSON... ${validSignedMessageJson.error}`)
          this.exit(1)
        }
      }
    

      spinner.succeed('Shared secrets found, decrypting and generating shared keylist')
      // Generate keys from found list using secret key and pub key from sender
      waitForKYBLIB(async () => {
        waitForDILLIB(async () => {
          try {
            encCypherText = encCypherTextJson
            signedMsg = signedMsgJson
          } 
          catch (error) {
          	spinner.fail('cant open files...')
            this.exit(1)
          }
          // 1 - verify p signature using Alice's dilithium public key 
          const verifySignedMsg = DILLIB.Dilithium.sign_open('', signedMsg, aliceDilithiumPK.toString('hex'))
          // if signature verified
          // 2 - Bob extracts the message: encrypted seed *p* from the dilithium signed message
          const msgOutput = DILLIB.Dilithium.extract_message(verifySignedMsg)
          const msgFinal = msgOutput.substr(0, 64)
          const KYBOBJECT_RECEIVER = await new KYBLIB.Kyber.fromKeys(bobKyberPK, bobKyberSK)
          // 3 - Bob decrypts encCypherText to get cyphertext using kyber keys
          const encCypherTextBuffer =  {
            iv: Buffer.from(encCypherText.iv),
            ephemPublicKey: Buffer.from(encCypherText.ephemPublicKey),
            ciphertext: Buffer.from(encCypherText.ciphertext),
            mac: Buffer.from(encCypherText.mac),
          }
          eccrypto.decrypt(Buffer.from(bobECDSASK.toString(), 'hex'), encCypherTextBuffer).then(function eccDecrypt(decCypherText) {
            // 4 - Bob kem_decodes with cyphertext to obtain shared key
            KYBOBJECT_RECEIVER.kem_decode(decCypherText.toString())
            const sharedKey = KYBOBJECT_RECEIVER.getMyKey()
            // 5 - Decrypt encrypted p to get the seed s
            const mykeyAlice = Uint8Array.from(Buffer.from(sharedKey.toString(), 'hex'))
            const aesCtr = new aesjs.ModeOfOperation.ctr(mykeyAlice)
            const encryptedBytes = aesjs.utils.hex.toBytes(msgFinal)
            const sDecrypted = aesCtr.decrypt(encryptedBytes)
            // Bob now has access to the seed s and the shared key sent from Alice
            // 6 - Generate the next 1000 keys with Shake, creating the same keylist as Alice has
            waitForQRLLIB(async () => {
              const sBin = QRLLIB.hstr2bin(Buffer.from(Buffer.from(sDecrypted).toString('hex')))
              const keyList = QRLLIB.shake128(64000, sBin)
              fs.writeFileSync(sharedKeyListFile, QRLLIB.bin2hstr(keyList))
              spinner.succeed(`Keylist generated and written to: ${sharedKeyListFile}`)
            })
          })
        })
      })
      spinner.succeed('keys generated!')
    }
  }
}

LatticeShared.description = `Generate shared_key files from lattice keys (user_1 public) and (user_2 secret)

Generate new shared_keys and shared_keylist from transaction hash and private lattice keys    
  Generates:
    - kyber encrypted shared_key
    - shared_key encrypted secret
    - key_list from secret, through shake128 (optional password protected)

Re-generate shared_keys from encrypted secrets
  Generates:
    - Decrypted shared key
    - Decrypted cyphertext (shared_secret)
    - Shared keylist from secret key and shake128 (optional password protected)
`
LatticeShared.args = [

  {
    name: 'latticePK',
    description: 'Generating new key_list or Recreating received list',
    required: true,
  },
  {
    name: 'latticeSK',
    description: 'Generating new key_list or Recreating received list',
    required: true,
  },

  {
    name: 'cypherText',
    description: 'Cyphertext file for key-regeneration',
    required: false,
  },  

  {
    name: 'signedMessage',
    description: 'Signed Message file for key-regeneration',
    required: false,
  },
]

LatticeShared.flags = { 

  cypherText: flags.string({
    char: 'c',
    default: false,
    description: 'Kyber encrypted cyphertext Output file'
  }),

  signedMessage: flags.string({
    char: 's',
    default: false,
    description: 'Dilithium signed message Output file'
  }),

  sharedKeyListFile: flags.string({
    char: 'k',
    default: false,
    description: 'Shared secret Kyber key list Output file'
  }),

  pubKeyIndex: flags.string({
    char: 'i',
    default: false,
    description: '(default: 1) Public key index to use if multiple are found in file'
  }),

  decryptPassword: flags.string({
    char: 'd',
    default: false,
    description: 'Password to decrypt lattice secret keys'
  }),

  encryptPassword: flags.string({
    char: 'e',
    default: false,
    description: 'Password to encrypt shared Key List File'
  }),

  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet for the public lattice keys'
  }),

  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: '(default) queries mainnet for the public lattice keys'
  }),

  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Custom grcp endpoint to connect a hosted QRL node (-g 127.0.0.1:19009)',
  }),

}

module.exports = {LatticeShared}
