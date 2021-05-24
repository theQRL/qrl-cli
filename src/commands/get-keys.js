/* eslint new-cap: 0, max-depth: 0 */
const { Command, flags } = require('@oclif/command')
const { red, white, black } = require('kleur')
const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const clihelpers = require('../functions/cli-helpers')
const Qrlnode = require('../functions/grpc')

class keySearch extends Command {
  async run() {
    const {flags} = this.parse(keySearch)

    let address
    if(flags.address) {
      address = flags.address
      let isValidFile = false
      if (validateQrlAddress.hexString(address).result) {
        isValidFile = true // eslint-disable-line
      } else {
        this.log(`${red('⨉')} QRL Address is not valid: Enter correct address`)
        this.exit(1)
      }
    }
    else if (!flags.txhash) {
      this.log(`${red('⨉')} No address or txHash given: Need address`)
      this.exit(1)
    }
    let itemPerPage = 100
    if (flags.item_per_page) {
      itemPerPage = parseInt(flags.item_per_page, 10)
      if (Number.isNaN(itemPerPage)) {
        this.log(`${red('⨉')} Not a valid number: Need items per page number`)
        this.exit(1)
      }
    }
    let pageNumber = 1
    if (flags.page_number) {
      pageNumber = parseInt(flags.page_number, 10)
      if (Number.isNaN(pageNumber)) {
        this.log(`${red('⨉')} Not a valid number: Which page to view`)
        this.exit(1)
      }
    }  
    // network stuff
    let grpcEndpoint = clihelpers.mainnetNode.toString()
    let network = 'Mainnet'

    if (flags.grpc) {
      grpcEndpoint = flags.grpc
      network = `Custom GRPC endpoint: [${flags.grpc}]`
    }
    if (flags.testnet) {
      grpcEndpoint = clihelpers.testnetNode.toString()
      network = 'Testnet'
    }
    if (flags.mainnet) {
      grpcEndpoint = clihelpers.mainnetNode.toString()
      network = 'Mainnet'
    }

    this.log(`Fetching Lattice keys on ${white().bgBlue(network)}`)
    const spinner = ora({ text: 'Fetching Ephemeral keys...\n', }).start()

    const Qrlnetwork = await new Qrlnode(grpcEndpoint)
    await Qrlnetwork.connect()

    // verify we have connected and try again if not
    let i = 0
    const count = 5
    while (Qrlnetwork.connection === false && i < count) {
      spinner.succeed(`retry connection attempt: ${i}...`)
      // eslint-disable-next-line no-await-in-loop
      await Qrlnetwork.connect()
      // eslint-disable-next-line no-plusplus
      i++
    }
    let latticeKeys = {}
     latticeKeys.tx = []

    if (flags.txhash) {
      const TXHash = flags.txhash
      const response = await Qrlnetwork.api('GetObject', {
        query: Buffer.from(TXHash, 'hex')
      })
      if (response.found === false) {
        spinner.fail('Unable to find transaction')
        this.exit(1)
      } else {
        spinner.succeed('Transaction found')

        if (!response.transaction.tx.latticePK) {
          // not a lattice transaction. Fail
          spinner.fail('Not a lattice transaction')
          this.exit(1)
        }
        address = `Q${clihelpers.bytesToHex(response.transaction.addr_from)}`
        latticeKeys = [{
          address,
          network,
        }]
        latticeKeys.push({ 
          pk1: clihelpers.bytesToHex(response.transaction.tx.latticePK.pk1),
          pk2: clihelpers.bytesToHex(response.transaction.tx.latticePK.pk2),
          pk3: clihelpers.bytesToHex(response.transaction.tx.latticePK.pk3),
          txHash: clihelpers.bytesToHex(response.transaction.tx.transaction_hash),
        })
      }
    }

    if (flags.address) {

      const getTransactionsByAddressReq = {
        address: Buffer.from(address.substring(1), 'hex'),
        item_per_page: itemPerPage,
        page_number: pageNumber,
      }
      const response = await Qrlnetwork.api('GetLatticePKsByAddress', getTransactionsByAddressReq)
      if (response.lattice_pks_detail.length === 0) {
        spinner.succeed(`No keys found for address: ${address} on ${network}`)
        this.exit(0)
      }

      latticeKeys = [{
        address,
        network,
      }]
      /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
      for (let i = 0; i < response.lattice_pks_detail.length; i++) {

        latticeKeys.push({ 
          pk1: clihelpers.bytesToHex(response.lattice_pks_detail[i].pk1),
          pk2: clihelpers.bytesToHex(response.lattice_pks_detail[i].pk2),
          pk3: clihelpers.bytesToHex(response.lattice_pks_detail[i].pk3),
          txHash: clihelpers.bytesToHex(response.lattice_pks_detail[i].tx_hash),
        })

      }
      spinner.succeed(`Total Keys Found: ${JSON.stringify(response.lattice_pks_detail.length)}`)
    }

      // output keys to file if flag passed
      if (flags.pub_key_file) {
        const PubLatticeKeysJson = [JSON.stringify(latticeKeys)].join('')
        fs.writeFileSync(flags.pub_key_file, PubLatticeKeysJson)
        spinner.succeed(`Ephemeral public keys written to ${flags.pub_key_file}`)
      }
      if (flags.json && !flags.pub_key_file) {
        // console.log(JSON.stringify(latticeKeys))
      }
      else if (!flags.txhash) {
        this.log(` ${black().bgWhite('address:')}  ${address}`)
        this.log(` ${black().bgWhite('network:')}  ${network}`)
        // console.log(latticeKeys)
        for (let i = 0; i < latticeKeys.length; i++) {
          if (i > 0) {
            this.log(` ${black().bgWhite('key #' + i + ':')} `) // eslint-disable-line
            this.log(` ${black().bgWhite('pk1:')}  ${latticeKeys[i].pk1}`)
            this.log(` ${black().bgWhite('pk2:')}  ${latticeKeys[i].pk2}`)
            this.log(` ${black().bgWhite('pk3:')}  ${latticeKeys[i].pk3}`)
            this.log(` ${black().bgWhite('txHash:')}  ${latticeKeys[i].txHash}`)
          }
        }
      }
      else {
        this.log(` ${black().bgWhite('address:')}  ${address}`)
        this.log(` ${black().bgWhite('network:')}  ${network}`)
        this.log(` ${black().bgWhite('pk1:')}  ${latticeKeys[1].pk1}`)
        this.log(` ${black().bgWhite('pk2:')}  ${latticeKeys[1].pk2}`)
        this.log(` ${black().bgWhite('pk3:')}  ${latticeKeys[1].pk3}`)
        this.log(` ${black().bgWhite('txHash:')}  ${latticeKeys[1].txHash}`)
      }
  }


}

keySearch.description = `Get lattice keys associated to a QRL address or transaction hash that have been broadcast to the network

Command requires that either a transaction hash or QRL address to lookup is given and the network must match where the transactionwas made.

For general address lookups, use page number and items returned number to limit your search. 
qrl-cli get-keys -i 1 -p 1 -a {ADDRESS} - will print the first key if found at that address. 

Found public lattice keys can be writen to a json file with the (-f) flag, default will print lattice keys to stdout
`
keySearch.flags = {

  address: flags.string({
    char: 'a',
    default: false,
    description: 'QRL address for lattice key lookup',
  }),
  item_per_page: flags.string({
    char: 'i',
    default: false,
    description: '(default 1) How many (i)tems to return per page for address lookup',
  }),
  page_number: flags.string({
    char: 'p',
    default: false,
    description: '(default 1) Which (p)age to print for address lookup',
  }),
  
  pub_key_file: flags.string({
    char: 'f',
    required: false,
    description: 'Print found public lattice keys to json (f)ile'
  }),

  testnet: flags.boolean({
    char: 't',
    default: false,
    description: 'Queries testnet for the lattice keys',
  }),
  mainnet: flags.boolean({
    char: 'm',
    default: false,
    description: 'Queries mainnet for the lattice keys',
  }),
  grpc: flags.string({
    char: 'g',
    required: false,
    description: 'Custom grcp endpoint to connect a hosted QRL node (-g 127.0.0.1:19009)',
  }),

  txhash: flags.string({
    char: 'T',
    required: false,
    description: 'Transaction hash to lookup for lattice keys',
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
