/* global QRLLIB */
/* eslint new-cap: 0 */

const {Command, flags} = require('@oclif/command')
const {black} = require('kleur')
const {QRLLIBmodule} = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const Crypto = require('crypto')
const bech32 = require('bech32')
const ora = require('ora')
const fs = require('fs')
const aes256 = require('aes256')

class CreateWallet extends Command {
  async run() {
    const {flags} = this.parse(CreateWallet)
    const spinner = ora({spinner: 'line', text: 'Creating wallet...'}).start()

    const toUint8Vector = arr => {
      const vec = new QRLLIB.Uint8Vector()
      for (let i = 0; i < arr.length; i += 1) {
        vec.push_back(arr[i])
      }
      return vec
    }

    function b32Encode(input) {
      return bech32.encode('q', bech32.toWords(input))
    }
    const binaryToBytes = convertMe => {
      const thisBytes = new Uint8Array(convertMe.size())
      for (let i = 0; i < convertMe.size(); i += 1) {
        thisBytes[i] = convertMe.get(i)
      }
      return thisBytes
    }

    const concatenateTypedArrays = (resultConstructor, ...arrays) => {
      let totalLength = 0
      for (let arr of arrays) { // eslint-disable-line
        totalLength += arr.length
      }
      const result = new resultConstructor(totalLength)
      let offset = 0
      for (let arr of arrays) { // eslint-disable-line
        result.set(arr, offset)
        offset += arr.length
      }
      return result
    }

    const pkRawToB32Address = pkRaw => {
      const rawDescriptor = Uint8Array.from([pkRaw.get(0), pkRaw.get(1), pkRaw.get(2)])
      const ePkHash = binaryToBytes(QRLLIB.sha2_256(pkRaw)) // Uint8Vector -> Uint8Array conversion
      const descriptorAndHash = concatenateTypedArrays(Uint8Array, rawDescriptor, ePkHash)
      return b32Encode(descriptorAndHash)
    }

    const waitForQRLLIB = callBack => {
      setTimeout(() => {
        // Test the QRLLIB object has the str2bin function.
        // This is sufficient to tell us QRLLIB has loaded.
        if (typeof QRLLIB.str2bin === 'function') {
          callBack()
        } else {
          return waitForQRLLIB(callBack)
        }
        return false
      }, 50)
    }

    waitForQRLLIB(async e => { // eslint-disable-line
      // default to a tree height of 10 unless passed via CLI
      let xmssHeight = 10
      if (flags.height) {
        let valid = true
        let reason = ''
        const h = parseInt(flags.height, 10)
        if ((h & 1) === 1) {
          valid = false
          reason = 'Height must be an even number'
        }
        if (h < 8) {
          valid = false
          reason = 'Height must be an even number, 8 or higher'
        }
        if (h > 18) {
          valid = false
          reason = 'Height must be an even number, 18 or lower'
        }
        if (valid === false) {
          spinner.fail('Wallet could not be created')
          this.log(reason)
          this.exit(1)
        }
        xmssHeight = h
      }
      // default to SHAKE-128 unless otherwise specified
      let hashFunction = QRLLIB.eHashFunction.SHAKE_128
      let hashCount = 0
      if (flags.shake128) {
        hashCount += 1
        hashFunction = QRLLIB.eHashFunction.SHAKE_128
      }
      if (flags.shake256) {
        hashCount += 1
        hashFunction = QRLLIB.eHashFunction.SHAKE_256
      }
      if (flags.sha2256) {
        hashCount += 1
        hashFunction = QRLLIB.eHashFunction.SHA2_256
      }
      if (hashCount > 1) {
        spinner.fail('Wallet could not be created')
        this.log('More than one hashing mechanism selected')
        this.exit(1)
      }
      const randomSeed = toUint8Vector(Crypto.randomBytes(48))
      const XMSS_OBJECT = await new QRLLIB.Xmss.fromParameters(randomSeed, xmssHeight, hashFunction)
      spinner.succeed('Wallet created')
      if (!flags.file) {
        this.log(` ${black().bgWhite('address:')}   ${XMSS_OBJECT.getAddress()}`)
        this.log(` ${black().bgWhite('hexseed:')}   ${XMSS_OBJECT.getHexSeed()}`)
        this.log(` ${black().bgWhite('mnemonic:')}  ${XMSS_OBJECT.getMnemonic()}`)
      }
      if (flags.file) {
        // output to JSON
        const thisAddress = XMSS_OBJECT.getAddress()
        const thisAddressB32 = pkRawToB32Address(XMSS_OBJECT.getPKRaw())
        const thisPk = XMSS_OBJECT.getPK()
        const thisHashFunction = QRLLIB.getHashFunction(thisAddress).value
        const thisSignatureType = QRLLIB.getSignatureType(thisAddress).value
        const thisHeight = xmssHeight
        const thisHexSeed = XMSS_OBJECT.getHexSeed()
        const thisMnemonic = XMSS_OBJECT.getMnemonic()
        const walletDetail = {
          encrypted: false,
          address: thisAddress,
          addressB32: thisAddressB32,
          pk: thisPk,
          hexseed: thisHexSeed,
          mnemonic: thisMnemonic,
          height: thisHeight,
          hashFunction: thisHashFunction,
          signatureType: thisSignatureType,
          index: 0,
        }

        if (flags.password) {
          const passphrase = flags.password
          walletDetail.encrypted = true
          walletDetail.address = aes256.encrypt(passphrase, walletDetail.address)
          walletDetail.mnemonic = aes256.encrypt(passphrase, walletDetail.mnemonic)
          walletDetail.hexseed = aes256.encrypt(passphrase, walletDetail.hexseed)
          walletDetail.addressB32 = aes256.encrypt(passphrase, walletDetail.addressB32)
          walletDetail.pk = aes256.encrypt(passphrase, walletDetail.pk)
        }
        const walletJson = ['[', JSON.stringify(walletDetail), ']'].join('')
        fs.writeFileSync(flags.file, walletJson)
        spinner.succeed(`Wallet written to ${flags.file}`)
      }
    })
    // if (result.result === false) {
    //   this.exit(1)
    // } else {
    //   this.exit(0)
    // }
  }
}

CreateWallet.description = `Create a QRL address
...
TODO
`

CreateWallet.flags = {
  file: flags.string({char: 'f', required: false, description: 'create wallet to json file'}),
  password: flags.string({char: 'p', required: false, description: 'password for encrypted wallet file'}),
  height: flags.string({char: 'h', required: false, description: 'tree height (even numbers 8-18)'}),
  shake128: flags.boolean({char: '1', default: false, description: 'use SHAKE-128 hashing machanism'}),
  shake256: flags.boolean({char: '2', default: false, description: 'use SHAKE-256 hashing machanism'}),
  sha2256: flags.boolean({char: '3', default: false, description: 'use SHA2-256 hashing machanism'}),
}

// CreateWallet.args = [
//   {
//     name: 'filename',
//     description: 'Output filename',
//   },
// ]

module.exports = CreateWallet
