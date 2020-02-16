/* eslint new-cap: 0, max-depth: 0, complexity: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
// const ora = require('ora')
const fs = require('fs')
const validateQrlAddress = require('@theqrl/validate-qrl-address')
const aes256 = require('aes256')
const {cli} = require('cli-ux')

/* const {qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto} = require('../functions/grpc') */

const shorPerQuanta = 10 ** 9

const openWalletFile = function (path) {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

const checkTxJSON = function (check) {
  let valid = {}
  valid.status = true
  if (check.length === 0) {
    valid.status = false
    valid.error = 'No transactions found: length of array is 0'
    return valid
  }
  check.forEach((element, index) => {
    if (!element.to) {
      valid.status = false
      valid.error = `Output #${index} does not have a 'to' key`
    }
    if (!validateQrlAddress.hexString(element.to).result) {
      valid.status = false
      valid.error = `Output #${index} does not contain a valid QRL address`
    }
    if (!element.shor) {
      valid.status = false
      valid.error = `Output #${index} does not have a 'shor' key`
    }
  })
  // need some BigNumber checks here
  // ...
  // checks complete
  return valid
}

class Send extends Command {
  async run() {
    const {args, flags} = this.parse(Send)
    // network
    let grpcEndpoint = 'testnet-1.automated.theqrl.org:19009' // eslint-disable-line no-unused-vars
    let network = 'Testnet'
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
    // setup quantity/ies and recipient(s)
    let output = {}
    output.tx = []
    let sendMethods = 0
    if (flags.jsonObject) {
      sendMethods += 1
    }
    if (flags.recipient) {
      sendMethods += 1
    }
    if (flags.file) {
      sendMethods += 1
    }
    if (sendMethods === 0) {
      this.log(`${red('⨉')} Unable to send: no recipients`)
      this.exit(1)
    }
    if (sendMethods > 1) {
      this.log(`${red('⨉')} Unable to send: use either recipient (-r) *or* object containing multiple recipients (-j) *or* JSON file (-f)`)
      this.exit(1)
    }
    if (flags.shor) {
      if (flags.file || flags.jsonObject) {
        this.log(`${red('⨉')} Unable to send: -s flag is redundant where JSON used as all values are in Shor`)
        this.exit(1)
      }
    }
    if (!flags.wallet && !flags.hexseed) {
      this.log(`${red('⨉')} Unable to send: no wallet json file or hexseed specified`)
      this.exit(1)
    }
    if (flags.jsonObject) {
      output = JSON.parse(flags.jsonObject)
      // now check the json is valid --> separate function
      const validate = checkTxJSON(output.tx)
      if (validate.status === false) {
        this.log(`${red('⨉')} Unable to send: json object passed with -j contains invalid output data (${validate.error})`)
        this.exit(1)
      }
    }
    if (flags.file) {
      const contents = fs.readFileSync(flags.file)
      output = JSON.parse(contents)
      const validate = checkTxJSON(output.tx)
      if (validate.status === false) {
        this.log(`${red('⨉')} Unable to send: json file contains invalid output data (${validate.error})`)
        this.exit(1)
      }
    }
    if (flags.recipient) {
      // passed as an -r flag
      if (!validateQrlAddress.hexString(flags.recipient).result) {
        this.log(`${red('⨉')} Unable to send: invalid recipient address`)
        this.exit(1)
      }
      // valid address passed with -r flag, so single output
      // get value in Shor
      if (flags.shor) {
        output.tx.push({
          to: flags.recipient,
          shor: args.quantity,
        })
      } else {
        output.tx.push({
          to: flags.recipient,
          shor: args.quantity * shorPerQuanta, // going to need to do BigNumber here
        })
      }
    }
    if (flags.wallet) {
      let isValidFile = false
      let address = ''
      const walletJson = openWalletFile(flags.wallet)
      try {
        if (walletJson.encrypted === false) {
          isValidFile = true
          address = walletJson.address
        }
        if (walletJson.encrypted === true) {
          let password = ''
          if (flags.password) {
            password = flags.password
          } else {
            password = await cli.prompt('Enter password for wallet file', {type: 'hide'})
          }
          address = aes256.decrypt(password, walletJson.address)
          if (validateQrlAddress.hexString(address).result) {
            isValidFile = true
          } else {
            this.log(`${red('⨉')} Unable to open wallet file: invalid password`)
            this.exit(1)
          }
        }
      } catch (error) {
        isValidFile = false
      }
      if (!isValidFile) {
        this.log(`${red('⨉')} Unable to open wallet file: invalid wallet file`)
        this.exit(1)
      }
      this.log('Sending from: ' + address)
    }
    // open from hexseed here
    if (flags.hexseed) {
      // reconstruct XMSS from hexseed
    }
    this.log('Transaction outputs:')
    output.tx.forEach(o => {
      this.log('address to: ' + o.to)
      this.log('amount in shor: ' + o.shor)
    })
  }
}

Send.description = `Send Quanta
...
TODO
`

Send.args = [
  {
    name: 'quantity',
    description: 'Number of Quanta (Shor if -s flag set) to send',
    required: true,
  },
]

Send.flags = {
  recipient: flags.string({char: 'r', required: false, description: 'QRL address of recipient'}),
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
  shor: flags.boolean({char: 's', default: false, description: 'Send in Shor'}),
  jsonObject: flags.string({char: 'j', required: false, description: 'Pass a JSON object of recipients/quantities for multi-output transactions'}),
  file: flags.string({char: 'f', required: false, description: 'JSON file of recipients'}),
  wallet: flags.string({char: 'w', required: false, description: 'json file of wallet from where funds should be sent'}),
  hexseed: flags.string({char: 'h', required: false, description: 'hexseed/mnemonic of wallet from where funds should be sent'}),
}

module.exports = {Send}
