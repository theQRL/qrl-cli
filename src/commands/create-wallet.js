/* global QRLLIB */
/* eslint new-cap: 0 */

const {Command, flags} = require('@oclif/command')
const {red, green, black} = require('kleur')
const {QRLLIBmodule} = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const Crypto = require('crypto')

// const check = flag => {
//   if (flag) {
//     return green('✓')
//   }
//   return red('⨉')
// }

class CreateWallet extends Command {
  async run() {
    const toUint8Vector = arr => {
      const vec = new QRLLIB.Uint8Vector()
      for (let i = 0; i < arr.length; i += 1) {
        vec.push_back(arr[i])
      }
      return vec
    }
    const xmssHeight = 6
    const hashFunction = QRLLIB.eHashFunction.SHAKE_128
    const {args, flags} = this.parse(CreateWallet)
    const randomSeed = toUint8Vector(Crypto.randomBytes(48))
    const XMSS_OBJECT = await new QRLLIB.Xmss.fromParameters(randomSeed, xmssHeight, hashFunction)
    const address = XMSS_OBJECT.getAddress()
    if (flags.quiet !== true) {
      this.log(black().bgWhite(` ${address} `))
    }
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
  quiet: flags.boolean({char: 'q', default: false, description: 'quiet mode: no address details, just return validity via exit code'}),
}

// Validate.args = [
//   {
//     name: 'address',
//     description: 'address to validate',
//   },
// ]

module.exports = CreateWallet
