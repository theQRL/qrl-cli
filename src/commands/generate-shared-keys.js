/* eslint new-cap: 0, max-depth: 0, complexity: 0 */
/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
/*
---------------------------------------------------------------------------------------
  This command will run 2 functions overall
    Case #1. generate a new enc_shared_key_file and enc_secret + keylist for lattice keys given through tx_id, Pub_Lattice_keys or Pub_Lattice_Keys_file
    Case #2. Given an enc_shared_key_file and enc_secret DECRYPT and generate keylist with local lattice file or tx_id
---------------------------------------------------------------------------------------
*/

/*

  case #1 

    requirements:
      - Local secret lattice_keys - either:
        - lattice_keyfile
        - kyberSK, dilithiumSK, ecdsaSK (hex)
      - recipient lattice keys - either:
        - tx_id from users lattice_tx
        - local recipient_lattice_PUB

    generates:
      - kyber encrypted shared_key using recipeints pub lattice key and local lattice secret key
      - encrypted cyphertext (shared_secret) encrypted with the new shared_key
      - key_list from generated from the new shared_secret, ran through shake128 (or any hashing function) (optional password protected)

  case #2 

    requirements:
      - shared_key encrypted with our PUB_kyber_key and senders SEC_Kyber_Key sent from other user (case #1 output b)
      - shared_secret encrypted with shared_key from other user (case #1 output a)
      - Local secret lattice keys associated to PUB_kyber_key to decrypt
        - key file 
    - json keys passed through flag

    generates:
      - decrypted shared key
      - decrypted cyphertext (shared_secret)
      - generates the same shared key_list from shared_secret ran through shake128 (or the same hashing function that was used to generate the initial list) (optional password protected)


*/   
// /////////////////////////
// CONST AND FUNCTIONS 
// /////////////////////////
const { Command, flags } = require('@oclif/command')
// const { red, white } = require('kleur')
const ora = require('ora')
const fs = require('fs')
// const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
// eslint-disable-next-line no-unused-vars
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl')
// eslint-disable-next-line no-unused-vars
const { DILLIBmodule } = require('qrllib/build/offline-libjsdilithium')
// eslint-disable-next-line no-unused-vars
const { KYBLIBmodule } = require('qrllib/build/offline-libjskyber')
// const helpers = require('@theqrl/explorer-helpers')
const Crypto = require('crypto')
const eccrypto = require('eccrypto')
const aesjs = require('aes-js')
const Qrlnode = require('../functions/grpc')

let KYBLIBLoaded = false
let DILLIBLoaded = false
let QRLLIBLoaded = false

let cypherTextFile = 'cypherText.txt'
let signedMessageFile = 'signedMessage.txt'
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
    .map((byte) => {
      return ('00' + (byte & 0xff).toString(16)).slice(-2) // eslint-disable-line
    })
    .join('')
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
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
// console.log('check Lattice Array Length: ' + arrayLength)

  if (arrayLength === 0) {
    valid.status = false
    valid.error = 'length of array is 0'
    return valid
  }
  // is it a secret key? Array lenght of 1 (0)
  if (arrayLength === 1) {
    check.forEach((element, index) => {
      // check that the json has keys for kyber, dilithium, and ECDSA SK's 
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
      if (!JSON.stringify(element).includes('ecdsaSK')) {
        valid.status = false
        valid.error = `Output #${index} does not have a ecdsaSK key`
        return valid
      }
      return valid
    })
    return valid
  }

  // is it a PUB key element? Array has 2 elements minimum ([0], [1])
  if (arrayLength >= 1) {
    check.forEach((element, index) => {
      // is this the first element containing address and network?
      // console.log(JSON.stringify(element))
      if (JSON.stringify(element).includes('address')) {
        // valid status is still true, check next element
        // console.log('Address and Network Found, are there valid PUB keys as well?')
        return valid
      }
      // check that the json has keys for kyber, dilithium, and ECDSA SK's 
      if (!JSON.stringify(element).includes('pk1')) {
        valid.status = false
        valid.error = `Output #${index} does not have a kyberPK key`
        return valid
      }
      if (!JSON.stringify(element).includes('pk2')) {
        valid.status = false
        valid.error = `Output #${index} does not have a dilithiumPK key`
        return valid
      }
      if (!JSON.stringify(element).includes('pk3')) {
        valid.status = false
        valid.error = `Output #${index} does not have a ecdsaPK key`
        return valid
      }
      return valid
    })
    return valid
  }
  return valid
}

class LatticeShared extends Command {
  async run() {
    const {args, flags} = this.parse(LatticeShared)


if (flags.cypherTextFile) {
  cypherTextFile = flags.cypherTextFile
}
if (flags.signedMessageFile) {
  signedMessageFile = flags.signedMessageFile
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
    let pubKeyAddress = ''


// /////////////////////////
// 0.a Secret Lattice keys
// /////////////////////////
    if (args.latticeSK) {
      // check if the secret keys are a file or json
      if (fs.existsSync(args.latticeSK)) {
        // file submitted
        latticeSK = openFile(args.latticeSK)

        try {
          if (latticeSK.encrypted === false) {
            // check lattice file for valid json
            validSecretJson = checkLatticeJSON(latticeSK)
          }
          if (latticeSK.encrypted === true) {
            let password
            if (flags.password) {
              password = flags.password
            } 
            else {
              password = await cli.prompt('Enter password for lattice file', {type: 'hide'})
            }
            latticeSK.encrypted = false
            latticeSK.latticeTxHash = aes256.decrypt(password, latticeSK.txhash)
            latticeSK.latticeTxHash = aes256.decrypt(password, latticeSK.txhash)
            latticeSK.kyberPK = aes256.decrypt(password, latticeSK.kyberPK)
            latticeSK.kyberSK = aes256.decrypt(password, latticeSK.kyberSK)
            latticeSK.dilithiumPK = aes256.decrypt(password, latticeSK.dilithiumPK)
            latticeSK.dilithiumSK = aes256.decrypt(password, latticeSK.dilithiumSK)
            latticeSK.ecdsaPK = aes256.decrypt(password, latticeSK.ecdsaPK)
            latticeSK.ecdsaSK = aes256.decrypt(password, latticeSK.ecdsaSK)
          }
        } 
        catch (error) {
          spinner.fail('Failed to decrypt')
          this.exit(1)
        }
        // check lattice file for valid json
        validSecretJson = checkLatticeJSON(latticeSK)
      }
      // JSON sent should not be encrypted
      else {
        latticeSK = JSON.parse(args.latticeSK)
        validSecretJson = checkLatticeJSON(latticeSK)
      }
      if (!validSecretJson.status) {
        spinner.fail(`Invalid JSON found in secret keys... ${validSecretJson.error}`)
        this.exit(1)
      }
    }
    else {
      // no secret keys given, fail
      spinner.fail('No secret keys given...')
      this.exit(1)
    }

    // We have valid secret keys, now the PUB keys
    // spinner.succeed(`Secret Keys found, check for recipient public keys...`)

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
// 0.c Public Latice keys
// /////////////////////////
    // Check for file, txhash or JSON
    if (args.latticePK) {
      // not a hexseed
      if (args.latticePK.length !== 64) {
        // check if the public keys are a file or json
        if (fs.existsSync(args.latticePK)) {
          // file submitted
          latticePK = openFile(args.latticePK)
          // check lattice file for valid json
          validPublicJson = checkLatticeJSON(latticePK)
        }
        else {
          // JSON sent 
          latticePK = JSON.parse(args.latticePK)
          validPublicJson = checkLatticeJSON(latticePK)
        }
      }
      else {
        // fetch the transaction from the network
        const response = await Qrlnetwork.api('GetObject', {
          query: Buffer.from(args.latticePK, 'hex')
        })
        if (response.found === false) {
          spinner.fail('Unable to find transaction...')
          this.exit(1)
        } 
        else {
          // check that the responce contains lattice keys
          if (!response.transaction.tx.latticePK) {
            // not a lattice transaction. Fail
            spinner.fail('Not a lattice transaction found...')
            this.exit(1)
          }
          // spinner.succeed('Public Lattice transaction found')
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
          validPublicJson = true
        }
      }
      // is the json valid?
      if (!validPublicJson) {
        spinner.fail(`Invalid JSON found in public keys... ${validPublicJson.error}`)
        this.exit(1)
      }
    }

    let pubKeyIndexNum = 1
    if (flags.pubKeyIndex) {
      pubKeyIndexNum = flags.pubKeyIndex.toNumber()
    }
    const senderKyberPK = latticeSK[0].kyberPK
    const senderKyberSK = latticeSK[0].kyberSK
    const senderDilithiumPK = latticeSK[0].dilithiumPK.toString('hex')
    const senderDilithiumSK = latticeSK[0].dilithiumSK
    // const senderECDSAPK = latticeSK[0].ecdsaPK
    const senderECDSASK = latticeSK[0].ecdsaSK
    const recipientKyberPK = latticePK[pubKeyIndexNum].pk1
    const recipientDilithiumPK = latticePK[pubKeyIndexNum].pk2
    const recipientECDSAPK = latticePK[pubKeyIndexNum].pk3

    



// check data given - if not including shared_secret and shared_key must need to generate a new set...

// /////////////////////////////////////
// 1. Generate new key list and secrets
// /////////////////////////////////////
    if ( !args.cypherTextFile && !args.signedMessageFile) {
      waitForKYBLIB(async () => {
        waitForDILLIB(async () => {
    spinner.succeed(`Public Keys found on ${network}, Generating new shared secrets for...`)
    spinner.succeed(`Address: ${latticePK[0].address}`)
    spinner.succeed(`Lattice Tx Hash: ${latticePK[pubKeyIndexNum].txHash}`)
          // Create the Kyber object from senders KyberSK and senders matching KyberPK
          const KYBOBJECT_SENDER = await new KYBLIB.Kyber.fromKeys(senderKyberPK, senderKyberSK)
          // Create the Dilithium object from senders DilithiumSK and senders matching DilithiumPK
          const DILOBJECT_SENDER = await new DILLIB.Dilithium.fromKeys(senderDilithiumPK, senderDilithiumSK)
          // Take a "random" 32 bytes seed using the Crypto library "sharedSecret"
          const seed = Crypto.randomBytes(32)
          // call kem_encode with recipientKyberPK
          KYBOBJECT_SENDER.kem_encode(recipientKyberPK.toString('hex'))
          // get cyphertext and shared key 
          const senderCypherText = KYBOBJECT_SENDER.getCypherText()
          const sharedKey = KYBOBJECT_SENDER.getMyKey()
          spinner.succeed(`Secrets Generated, encrypting keys...`)
          // encrypt cyphertext with encrypted AES key
          eccrypto.encrypt(Buffer.from(recipientECDSAPK, 'hex'), Buffer.from(senderCypherText)).then( function eccCypher(encryptedCypherText) {
            const mykey = Uint8Array.from(Buffer.from(sharedKey.toString(), 'hex'))
            // Encrypt the seed *s* with shared key *key*
            const aesCtr = new aesjs.ModeOfOperation.ctr(mykey)
            // encrypt the seed with
            const encSeed = aesCtr.encrypt(seed)
            // sender signs the payload with DilithiumSK
            const signedMsg = DILOBJECT_SENDER.sign(Buffer.from(encSeed).toString('hex'))

            // save encrpytedCypherText and signedMsg to a local file
            const encCypherTextJson = ['[', JSON.stringify(encryptedCypherText), ']'].join('')
            fs.writeFileSync(cypherTextFile, encCypherTextJson)
            spinner.succeed(`Cyphertext file written to: ${cypherTextFile}`)

            const signedMsgJson = ['[', JSON.stringify(signedMsg), ']'].join('')
            fs.writeFileSync(signedMessageFile, signedMsgJson)
            spinner.succeed(`Signed Message File file written to: ${signedMessageFile}`)

            // 9 - Generate the next 1000 keys with Shake128 and shared secret seed
            waitForQRLLIB(async () => {
              const sBin = QRLLIB.hstr2bin(Buffer.from(Buffer.from(seed).toString('hex')))
              const keyList = QRLLIB.shake128(64000, sBin)
              fs.writeFileSync(sharedKeyListFile, QRLLIB.bin2hstr(keyList))
              spinner.succeed(`Shared Key List file written to: ${sharedKeyListFile}`)
              // spinner.succeed('DONE')
            })
          })
        })
      })
    }
// /////////////////////////////////////////
// 2. Generate key list from shared secrets
// /////////////////////////////////////////

    else {
      if (!args.signedMessageFile || !args.cypherTextFile) {
        spinner.fail('Both Shared Secret and Shared Keys are required...')
        this.exit(1)
      }
          spinner.succeed('Shared secrets found, decrypting and generating shared keylist')

        // Generate keys from found list using secret key and pub key from sender
        waitForKYBLIB(async () => {
          waitForDILLIB(async () => {

          const encCypherTextJson = openEphemeralFile(args.cypherTextFile)
          const signedMsgJson = openEphemeralFile(args.signedMessageFile)

          let signedMsg
          let encCypherText
          try {
            encCypherText = encCypherTextJson
            signedMsg = signedMsgJson
          } 
          catch (error) {
          	spinner.fail('cant open files...')
            this.exit(1)
          }
          // 1 - verify p signature
          const verifySignedMsg = DILLIB.Dilithium.sign_open('', signedMsg, recipientDilithiumPK.toString('hex'))
          // if signature verified
          // 2 - Alice exracts the message: encrypted seed *p*
          const msgOutput = DILLIB.Dilithium.extract_message(verifySignedMsg)

          const msgFinal = msgOutput.substr(0, 64)

          const KYBOBJECT_RECEIVER = await new KYBLIB.Kyber.fromKeys(senderKyberPK, senderKyberSK)

              // 3 - Alice decrypts encCypherText to get cyphertext
              const encCypherTextBuffer =  {
                iv: Buffer.from(encCypherText.iv),
                ephemPublicKey: Buffer.from(encCypherText.ephemPublicKey),
                ciphertext: Buffer.from(encCypherText.ciphertext),
                mac: Buffer.from(encCypherText.mac),
              }

              eccrypto.decrypt(Buffer.from(senderECDSASK.toString(), 'hex'), encCypherTextBuffer).then(function eccDecrypt(decCypherText) {
                // 4 - Alice kem_decode with cyphertext to obtain shared key
                KYBOBJECT_RECEIVER.kem_decode(decCypherText.toString())
                const sharedKey = KYBOBJECT_RECEIVER.getMyKey()
                // 5 - Decrypt encrypted p to get the seed s
                const mykeyAlice = Uint8Array.from(Buffer.from(sharedKey.toString(), 'hex'))
                const aesCtr = new aesjs.ModeOfOperation.ctr(mykeyAlice)
                const encryptedBytes = aesjs.utils.hex.toBytes(msgFinal)
                const sDecrypted = aesCtr.decrypt(encryptedBytes)

                // 6 - Alice now have access to the seed s and the shared key key_alice

                // For debugging purpose
                // console.log('FROM ALICE')
                // console.log('Decrypted shared seed')
                // console.log(Buffer.from(sDecrypted))
                // console.log("Shared secret")
                // console.log(sharedKey)
                // console.log("---------------------")

                // 7 - Generate the next 1000 keys with Shake
                waitForQRLLIB(async () => {
                  const sBin = QRLLIB.hstr2bin(Buffer.from(Buffer.from(sDecrypted).toString('hex')))
                  const keyList = QRLLIB.shake128(64000, sBin)
                  fs.writeFileSync(sharedKeyListFile, QRLLIB.bin2hstr(keyList))
                  spinner.succeed('DONE')
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
    name: 'cypherTextFile',
    description: 'cypherTextFile from other party',
    required: false,
  },  

  {
    name: 'signedMessageFile',
    description: 'sharedSecret from other party',
    required: false,
  },
]


LatticeShared.flags = { /*
   // network
      (m)ainnet, 
      (g)rpc,
      (t)estnet,

    tx(h)ash, 
      (i)ndex,
      (c)yphertext file
      (s)ignedMessageFile
shared(k)eyListFile
  */

  cypherTextFile: flags.string({
    char: 'c',
    default: false,
    description: 'Cyphertext Output file'
  }),
  signedMessageFile: flags.string({
    char: 's',
    default: false,
    description: 'Signed message Output file'
  }),

  sharedKeyListFile: flags.string({
    char: 'k',
    default: false,
    description: 'Secret shared keylist Output file'
  }),

  pubKeyIndex: flags.string({
    char: 'i',
    default: false,
    description: 'Public key index to use'
  }),

  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet for the OTS state'
  }),

  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'queries mainnet for the OTS state'
  }),

  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'
  }),

}

module.exports = {LatticeShared}
