/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {white, black} = require('kleur')
const ora = require('ora')
const fs = require('fs')
const aesjs = require('aes-js')
const clihelpers = require('../functions/cli-helpers')

// using the shared key list, AES decrypt encrypted data
// 
// Requires:
//  - sharedkeylist from `generate-shared-keys` command output as arg
//  - data to decrypt (file, jsonFile, stdin, or JSONstdin)
//  - index for AES keys to use from keyfile 64 char length split keylist file (or grab from JSON)


const checkEncJson = (checkEncJsonData) => {
  const valid = {}
  valid.status = true
  // check that the json has keys as expected 
  if (!checkEncJsonData.includes('keyIndex')) {
    valid.status = false
    valid.error = `Output does not have a keyIndex key buffer`
    return valid
  }
  if (!checkEncJsonData.includes('cipher')) {
    valid.status = false
    valid.error = `Output does not have a cipher key buffer`
    return valid
  }
  if (!checkEncJsonData.includes('payload')) {
    valid.status = false
    valid.error = `Output does not have a payload key buffer`
    return valid
  }
  return valid
}


class SharedKeyDecrypt extends Command {
  async run() {
    const { args, flags } = this.parse(SharedKeyDecrypt)
    const spinner = ora({ text: 'Decrypt using shared lattice keys\n', }).start()
    let sharedKeyBlob
    let index = 0
    let encryptedMessage // initial file data
    let encryptedMessageJSON // initial file data in JSON
    let plaintextJsonArray 
    let decryptedMessageFile
    let encryptedMessageData // raw encrypted data
    let validMessageJson = {}
    validMessageJson.status = false
    // is it a file we can open?
    if (fs.existsSync(args.sharedKeyList)) {
      // yes, is it empty?
      await clihelpers.isFileEmpty(args.sharedKeyList).then( (isEmpty) => {
        if (isEmpty) {
          spinner.fail(`${black().bgRed(`Shared Key List File is empty...`)}` )
          this.exit(1)
        }
      })
      // open the file
      sharedKeyBlob = clihelpers.openFilePlain(args.sharedKeyList)
      // spinner.succeed(`${white().bgBlue(`Shared keylist file given:`)} ${args.sharedKeyList}`)
    }
    else {
      spinner.fail(`${black().bgRed(`invalid shared key list...`)}` )
      this.exit(1) 
    }
    // break the sharedkeylist into an array of 64 char for AES encryption and address by index
    const keyList = sharedKeyBlob.toString().split(/(.{64})/).filter(O => O)
    // if index flag set use it, otherwise defaule is the first key [0]
    if (flags.index) {
      // is not a number
      if (!Number.isInteger(Number(flags.index))) {
        spinner.fail(`${black().bgRed(`Index is not a number:`)} "${flags.index}" given as index` )
        this.exit(1)
      }
      index = Number(flags.index)
    }
    else {
        spinner.succeed(`${white().bgBlue(`Decrypting using default key index:`)} ${index}`)
    }






    // Get the data to decrypt from the args.message, can be a file or data from stdin
    // is it a file we can open?
    if (fs.existsSync(args.message)) {
      // yes, is it empty?
      await clihelpers.isFileEmpty(args.message).then( (isEmpty) => {
        if (isEmpty) {
          spinner.fail(`${black().bgRed(`Message to decrypt is empty...`)}` )
          this.exit(1)
        }
      })
      // open the file
      encryptedMessageData = clihelpers.openFilePlain(args.message)
      let jsonTrue = false
      try {
        // is it JSON?
        encryptedMessageJSON = JSON.parse(encryptedMessageData)
        jsonTrue = true
        validMessageJson = await checkEncJson(JSON.stringify(encryptedMessageJSON))
      }
      catch (e) {
        // file is not JSON - set results to be decrypted
        encryptedMessage = encryptedMessageData
        encryptedMessageData  = encryptedMessage
      }
      if (jsonTrue) {
        if (!validMessageJson.status) {
          // if JSON bad return with error
          spinner.fail(`${black().bgRed(`Invalid encrypted JSON: `)} ${validMessageJson.error}` )
          this.exit(1)
        }
        else {
          index = encryptedMessageJSON.keyIndex
          encryptedMessageData = encryptedMessageJSON.payload
        }
      }
    }
    // not a file, set whatever has been passed as data to encrypt
    else {
      // is it valid JSON?
        validMessageJson = await checkEncJson(args.message)
      if (validMessageJson.status) {
        encryptedMessageJSON = JSON.parse(args.message)
        index = encryptedMessageJSON.keyIndex
        encryptedMessageData = encryptedMessageJSON.payload
      }
      else {
        // not JSON pass whatever as encrypted data and decrypt
        encryptedMessageData = args.message
      }
    }
    // get the key into form for AES
    const encKey = Uint8Array.from(Buffer.from(keyList[index].toString('hex'), 'hex'))
    // set AES encryption keys up using the encKey from above
    const aesCtr = new aesjs.ModeOfOperation.ctr(encKey)
    // convert the message to bytes
    const encryptedMessageBytes = aesjs.utils.hex.toBytes(encryptedMessageData.toString())
    // AES encrypt the message data
    const decryptMessage = aesCtr.decrypt(encryptedMessageBytes)
    // write the file if flags.encFile is set
    const plaintextPayload = Buffer.from(decryptMessage).toString()
    spinner.succeed(`Data decrypted:`)

    if (flags.fileOutput) {
      // set the file location to what was given in flags
      decryptedMessageFile = flags.fileOutput
      if (flags.json) {
        // spinner.succeed(`plaintextPayload ${plaintextPayload}`)
        // output to json
        plaintextJsonArray = {keyIndex: index, cipher: 'plaintext', payload: JSON.parse(plaintextPayload)}
         // write JSON to file
        try{
          fs.writeFileSync(decryptedMessageFile,plaintextJsonArray)

        }
        catch (e){
          spinner.fail(`${black().bgRed(`Unable to write file: `)} ${e}` )
          this.exit(1)
        }
        

        spinner.succeed(`Decrypted JSON file written to ${decryptedMessageFile}`)
      }
      else {
        fs.writeFileSync(decryptedMessageFile, plaintextPayload)
        spinner.succeed(`Decrypted file written to ${decryptedMessageFile}`)
      }
    }
    else {
      // no file output given, how about json flag?
      // eslint-disable-next-line
      if (flags.json) {
        // output to json
        plaintextJsonArray = {keyIndex: index, cipher: 'plaintext', payload: JSON.parse(plaintextPayload)}
        
        this.log(JSON.stringify(plaintextJsonArray))
      }
      else {
        // eslint-disable-next-line
        // spinner.succeed(`Data was decrypted using index key ${index}`)
        this.log(`${JSON.stringify(plaintextPayload)}`)
      }
    }  
  }
}

SharedKeyDecrypt.description = `Decrypt data using a Lattice generated shered keylist

Using a given shared keylist index, AES decrypt data given in file, JSON or stdin to command

Example: qrl-cli shared-key-decrypt {KEYLIST} {ENCRYPTED-DATA} -o {DECRYPTED-FILE}
`

SharedKeyDecrypt.args = [
  {
    name: 'sharedKeyList',
    description: 'shared key list for secret decryption keys',
    required: true,
  },
  {
    name: 'message',
    description: 'Encrypted message to decrypt',
    required: true,
  },
]

SharedKeyDecrypt.flags = {
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
    description: 'output plaintext data as json',
  }),
  
  fileOutput: flags.string({
    char: 'o', 
    required: false, 
    description: 'output decrypted data to file',
  }),
}

module.exports = {SharedKeyDecrypt}
