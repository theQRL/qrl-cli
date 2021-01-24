/* eslint-disable */
/* eslint new-cap: 0, max-depth: 0 */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const helpers = require('@theqrl/explorer-helpers')
const Qrlnode = require('../functions/grpc')

// Convert bytes to hex
function bytesToHex(byteArray) {
  return [...byteArray]
    .map((byte) => {
      return ('00' + (byte & 0xff).toString(16)).slice(-2) 
    })
    .join('')
}

class keySearch extends Command {
  async run() {
    const {flags} = this.parse(keySearch)

    let address
    if(flags.address) {
      address = flags.address
      let isValidFile = false
      if (validateQrlAddress.hexString(address).result) {
        isValidFile = true
      } else {
        this.log(`${red('⨉')} QRL Address is not valid: Enter correct address`)
        this.exit(1)
      }
    }
    else {
      this.log(`${red('⨉')} No address given: Need address`)
      this.exit(1)
    }
    let itemPerPage = 100
    if (flags.item_per_page) {
      itemPerPage = parseInt(flags.item_per_page)
      if (isNaN(itemPerPage)) {
        this.log(`${red('⨉')} Not a valid number: Need items per page number`)
        this.exit(1)
      }
    }
    let pageNumber = 1
    if (flags.page_number) {
      pageNumber = parseInt(flags.page_number)
      if (isNaN(pageNumber)) {
        this.log(`${red('⨉')} Not a valid number: Which page to view`)
        this.exit(1)
      }
    }  
    // network stuff
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
    this.log(`Fetching Lattice keys posted on on ${white().bgBlue(network)} from: ${address} `)
    const spinner = ora({ text: 'Fetching Ephemeral keys...\n', }).start()

    const Qrlnetwork = await new Qrlnode(grpcEndpoint)
    await Qrlnetwork.connect()
    const getTransactionsByAddressReq = {
      address: Buffer.from(address.substring(1), 'hex'),
      item_per_page: itemPerPage,
      page_number: pageNumber,
    }
    const response = await Qrlnetwork.api('GetLatticePKsByAddress', getTransactionsByAddressReq)
    if (response.lattice_pks_detail.length === 0) {
      spinner.succeed('No keys found for address: ' + address + ' on ' + network)
      this.exit(0)
    }

    let latticeKeys = [{
      address,
      network,
    }]

    for (let i = 0; i < response.lattice_pks_detail.length; i++) {

      latticeKeys.push({ 
        pk1: bytesToHex(response.lattice_pks_detail[i].pk1),
        pk2: bytesToHex(response.lattice_pks_detail[i].pk2),
        pk3: bytesToHex(response.lattice_pks_detail[i].pk3),
        txHash: bytesToHex(response.lattice_pks_detail[i].tx_hash),
      })

    }
    spinner.succeed('Total Keys Found: ' + JSON.stringify(response.lattice_pks_detail.length))

    // output keys to file if flag passed
    if (flags.pub_key_file) {
      const PubLatticeKeysJson = [JSON.stringify(latticeKeys)].join('')
      fs.writeFileSync(flags.pub_key_file, PubLatticeKeysJson)
      spinner.succeed(`Ephemeral public keys written to ${flags.pub_key_file}`)
    }
    if (flags.json && !flags.pub_key_file) {
      console.log(JSON.stringify(latticeKeys))
    }
    else {
      this.log(` ${black().bgWhite('address:')}  ${address}`)
      this.log(` ${black().bgWhite('network:')}  ${network}`)

      for (let i = 0; i < response.lattice_pks_detail.length + 1; i++) {
        if (i > 0) {
          this.log(` ${black().bgWhite('key #' + i + ':')} `)
          this.log(` ${black().bgWhite('pk1:')}  ${latticeKeys[i].pk1}`)
          this.log(` ${black().bgWhite('pk2:')}  ${latticeKeys[i].pk2}`)
          this.log(` ${black().bgWhite('pk3:')}  ${latticeKeys[i].pk3}`)
          this.log(` ${black().bgWhite('txHash:')}  ${latticeKeys[i].txHash}`)
        }
      }
    }
  }
}

keySearch.description = `Get Ephemeral keys associated to a QRL address
`
keySearch.flags = {

  address: flags.string({
    char: 'a',
    default: false,
    description: 'address for key lookup',
  }),
  item_per_page: flags.string({
    char: 'i',
    default: false,
    description: 'How many results to return per page: defaults to 1',
  }),
  page_number: flags.string({
    char: 'p',
    default: false,
    description: 'which page to print: defaults to 1',
  }),
  
  pub_key_file: flags.string({
    char: 'f',
    required: false,
    description: 'create users public lattice keys to json (f)ile'
  }),

  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'queries testnet for the OTS state',
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'queries mainnet for the OTS state',
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description:
      'advanced: grcp endpoint (for devnet/custom QRL network deployments)',
  }),

  json: flags.boolean({
    char: 'j',
    required: false,
    description: 'Print the public keys in json format'
  }),

  // password: flags.string({
    // char: 'p',
    // required: false,
    // description: 'wallet file password',
  // }),


}

module.exports = {keySearch}
