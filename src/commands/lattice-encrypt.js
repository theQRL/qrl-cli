/* eslint new-cap: 0, max-depth: 0, complexity: 0 */
/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const { cli } = require('cli-ux')
const { QRLLIBmodule } = require('qrllib/build/offline-libjsqrl') // eslint-disable-line no-unused-vars
const { DILLIBmodule } = require('qrllib/build/offline-libjsdilithium') // eslint-disable-line no-unused-vars
const { KYBLIBmodule } = require('qrllib/build/offline-libjskyber') // eslint-disable-line no-unused-vars
const eccrypto = require('eccrypto')
const Qrlnode = require('../functions/grpc')

let QRLLIBLoaded = false
let DILLIBLoaded = false
let KYBLIBLoaded = false



class Encrypt extends Command {
  async run() {
    const {args, flags} = this.parse(Encrypt)



    const txhash = flags.txhash
    const string = flags.string


    // network
    let grpcEndpoint = 'mainnet-4.automated.theqrl.org:19009' // eslint-disable-line no-unused-vars
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
      grpcEndpoint = 'mainnet-4.automated.theqrl.org:19009'
      network = 'Mainnet'
    }
    this.log(white().bgBlue(network))


    const spinner = ora({ text: 'Fetching Ephemeral keys from API...\n'}).start()









  }
}


Encrypt.description = `Encrypt message using recipient public keys
`

Encrypt.args = [
  {
    name: 'address',
    description: 'QRL wallet address to send message to',
    required: false,
  },
  {
    name: 'item_per_page',
    description: 'number of items to show per page',
    required: false,
  },
  {
    name: 'page_number',
    description: 'page number to retrieve',
    required: false,
  },
  {
    name: 'message',
    description: 'message to encrypt',
    required: false,
  },
]

Encrypt.flags = {
  txhash: flags.string({char: 'h', default: false, description: 'tx hash of lattice transaction'}),
  string: flags.string({char: 's', default: false, description: 'message to encrypt'}),
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
}

module.exports = {Encrypt}
