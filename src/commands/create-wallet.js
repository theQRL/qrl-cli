/* global QRLLIB */
/* eslint new-cap: 0 */

const {Command, flags} = require('@oclif/command')
const {black} = require('kleur')
const {QRLLIBmodule} = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const Crypto = require('crypto')
const ora = require('ora')
const fs = require('fs')
const aes256 = require('aes256')
const clihelpers = require('../functions/cli-helpers')

class CreateWallet extends Command {
  async run() {
    const {flags} = this.parse(CreateWallet)
    const spinner = ora({spinner: 'line', text: 'Creating wallet...'}).start()
    clihelpers.waitForQRLLIB(async () => {
      // default to a tree height of 10 unless passed via CLI
      let xmssHeight = 10
      if (flags.height) {
        let valid = true
        let reason = ''
        const h = parseInt(flags.height, 10)
        if ((h & 1) === 1) { // eslint-disable-line no-bitwise
          valid = false
          reason = 'Height must be an even number'
        }
        if (h < 4) {
          valid = false
          reason = 'Height must be an even number, 4 or higher'
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
      // default to SHA2-256 unless otherwise specified
      let hashFunction = QRLLIB.eHashFunction.SHA2_256
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
      const randomSeed = clihelpers.toUint8Vector(Crypto.randomBytes(48))
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
        const thisAddressB32 = clihelpers.pkRawToB32Address(XMSS_OBJECT.getPKRaw())
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

CreateWallet.description = `Create a new QRL wallet

QRL addresses can be created with various tree height (-h) and hashing mechanisms (1-3)
You can output to a file (-f) in JSON and encrypt with a user set password (-p).

Documentation at https://docs.theqrl.org/developers/qrl-cli
`

CreateWallet.flags = {
  file: flags.string({
    char: 'f',
    required: false,
    description: 'Create QRL wallet to a json file (wallet.json)'
  }),
  password: flags.string({
    char: 'p',
    required: false,
    description: 'Encrypt the wallet file with this password'
  }),
  height: flags.string({
    char: 'h',
    required: false,
    description: '(default: 10) XmSS merkle tree height or OTS height (even numbers 4-18)'
  }),
  sha2256: flags.boolean({
    char: '1',
    default: false,
    description: '(default) Use SHA2-256 hashing mechanism'
  }),
  shake128: flags.boolean({
    char: '2',
    default: false,
    description: 'Use SHAKE-128 hashing mechanism'
  }),
  shake256: flags.boolean({
    char: '3',
    default: false,
    description: 'Use SHAKE-256 hashing mechanism'
  }),
}

module.exports = CreateWallet
