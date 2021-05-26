/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {white, black} = require('kleur')
const ora = require('ora')
const fs = require('fs')
const aesjs = require('aes-js')
const clihelpers = require('../functions/cli-helpers')

// using the shared key list and secret lattice keys, AES encrypt the 
// data given and: 
// - save file 

// - save file in JSON 
// - output to stdout
// - output to JSON
// 
// Requires
//  - sharedkeylist from `generate-shared-keys` command output as arg
//  - data to encrypt (file or stdin)
//  - index for AES keys to use from keyfile 64 char length split keylist file

class SharedKeyEncrypt extends Command {
  async run() {
    const { args, flags } = this.parse(SharedKeyEncrypt)
    let sharedKeyBlob
    let index = 0
    let plaintextMessage
    let encryptedMessageFile
    let encJsonArray
    const spinner = ora({ text: 'Encrypting using shared lattice keys', }).start()
    // pull in the shared Key List. Is it a file we can open?
    if (fs.existsSync(args.sharedKeyList)) {
      // yes, is it empty?
      await clihelpers.isFileEmpty(args.sharedKeyList).then( (isEmpty) => {
        if (isEmpty) {
          spinner.fail(`${black().bgRed(`Shared Key List File is empty:`)} ${args.sharedKeyList}` )
          this.exit(1)
        }
      })
      // open the file
      sharedKeyBlob = clihelpers.openFilePlain(args.sharedKeyList)
      spinner.succeed(`${white().bgBlue(`Shared keylist file given: `)} ${args.sharedKeyList}`)
    }
    else {
      spinner.fail(`${black().bgRed(`invalid shared key list...`)}` )
      this.exit(1)      
    }
    // break the sharedKeyBlob into an array of 64 char for AES encryption
    const keyList = sharedKeyBlob.toString().split(/(.{64})/).filter(O => O)
    // if index flag set use it, otherwise default is the first key [0]
    if (flags.index) {
      if (!Number.isInteger(Number(flags.index))) {
        // is not a number
        spinner.fail(`${black().bgRed(`Index is not a number:`)} ${flags.index}` )
        this.exit(1)
      }
        index = Number(flags.index)
        spinner.succeed(`${white().bgBlue(`Encrypting using key index:`)} ${index}`)
    }
    else {
        spinner.succeed(`${white().bgBlue(`Encrypting using default key index:`)} ${index}`)
    }

    // Get the data to encrypt from the args.message, 
    // can be a file or data from stdin
    // is it a file we can open?
    if (fs.existsSync(args.message)) {
      // yes, is it empty?
      await clihelpers.isFileEmpty(args.message).then( (isEmpty) => {
        if (isEmpty) {
          spinner.fail(`${black().bgRed(`Message to encrypt is empty...`)}` )        
          this.exit(1)
        }
      })
        // open the file
        plaintextMessage = clihelpers.openFilePlain(args.message)
        spinner.succeed(`${white().bgBlue(`plaintext file: `)} ${args.message}`)
      }
      // not a file, set whatever has been passed as data to encrypt
      else {
        //
        plaintextMessage = (args.message).toString()
      }
    // get the key into form for AES
    const encKey = Uint8Array.from(Buffer.from(keyList[index].toString('hex'), 'hex'))
    // set AES encryption keys up using the encKey from above
    const aesCtr = new aesjs.ModeOfOperation.ctr(encKey)
    // convert the message to bytes
    const plaintextMessageBytes = aesjs.utils.utf8.toBytes(plaintextMessage)
    // AES encrypt the message data
    const encMessageBytes = aesCtr.encrypt(plaintextMessageBytes)

    if (!flags.json && !flags.fileOutput) {
      spinner.succeed(`Data encrypted!`)
    }
    const encMessage = Buffer.from(encMessageBytes).toString('hex')
    // write the file if flags.encFile is set

    // output to file
    if (flags.fileOutput) {
        // set the file location to what was given in flags
        encryptedMessageFile = flags.fileOutput
      // if json set output data in json with extra info (cipher and key index)
      if (flags.json) {
        encJsonArray = {keyIndex: index, cipher: 'aes', payload: encMessage}   
        fs.writeFileSync(encryptedMessageFile,JSON.stringify(encJsonArray))
        spinner.succeed(`Encrypted JSON file written to ${encryptedMessageFile}`)
      }

      else {
        fs.writeFileSync(encryptedMessageFile, encMessage)
        spinner.succeed(`Encrypted file written to ${encryptedMessageFile}`)
      }
    }
    else {
      // no file output given, how about the JSON flag?
      /* eslint-disable */
      if (flags.json) {
        encJsonArray = {keyIndex: index, cipher: 'aes', encMessage}   
        this.log(JSON.stringify(encJsonArray))
      }
      else {
        encJsonArray = encMessage
        this.log(encJsonArray)
      }
      /* eslint-enable */
    }  
  }
}

SharedKeyEncrypt.description = `Encrypt data using a Lattice generated shered keylist

Using a given shared keylist index, AES encrypt data given in file or stdin to command
Example: qrl-cli shared-key-encrypt {KEYLIST} {PLAINTEXT-DATA} -o {ENCRYPTED-OUTPUT-FILE}
`

SharedKeyEncrypt.args = [
  {
    name: 'sharedKeyList',
    description: 'shared key list file for encryption keys',
    required: true,
  },
  {
    name: 'message',
    description: 'message to encrypt',
    required: true,
  },
]

SharedKeyEncrypt.flags = {
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
  
  index: flags.string({
    char: 'i', 
    required: false, 
    description: '(default: 0) index key to use from keylist array',
  }),
  
  json: flags.boolean({
    char: 'j', 
    required: false, 
    description: 'output encrypted data as json',
  }),
  
  fileOutput: flags.string({
    char: 'o', 
    required: false, 
    description: 'output file to save encrypted data',
  }),
}

module.exports = {SharedKeyEncrypt}
