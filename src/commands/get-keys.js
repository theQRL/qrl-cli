/* eslint new-cap: 0, max-depth: 0 */
const {Command, flags} = require('@oclif/command')
const {red, white} = require('kleur')
const ora = require('ora')
const grpc = require('grpc')
const {createClient} = require('grpc-kit')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const CryptoJS = require('crypto-js')
const aes256 = require('aes256')
const {cli} = require('cli-ux')
const {QRLPROTO_SHA256} = require('../get-qrl-proto-shasum')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`
const {QRLLIBmodule} = require('/Users/abilican/Documents/projects/perso/theqrl/myforks/qrllib/tests/js/tmp/offline-libjsqrl') 
const {DILLIBmodule} = require('/Users/abilican/Documents/projects/perso/theqrl/myforks/qrllib/tests/js/tmp/offline-libjsdilithium') 
let QRLLIBLoaded = false
let DILLIBLoaded = false
const Crypto = require('crypto')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const clientGetNodeInfo = client => {
  return new Promise((resolve, reject) => {
    client.getNodeInfo({}, (error, response) => {
      if (error) {
        reject(error)
      }
      resolve(response)
    })
  })
}

// const openWalletFile = function (path) {
//   const contents = fs.readFileSync(path)
//   return JSON.parse(contents)[0]
// }

let qrlClient = null

async function checkProtoHash(file) {
  return readFile(file).then(async contents => {
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents)
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(CryptoJS.enc.Hex)
    let verified = false
    QRLPROTO_SHA256.forEach(value => {
      if (value.protoSha256 === calculatedProtoHash) {
        verified = true
      }
    })
    return verified
  }).catch(error => {
    throw new Error(error)
  })
}

async function loadGrpcBaseProto(grpcEndpoint) {
  return protoLoader.load(PROTO_PATH, {}).then(async packageDefinition => {
    const packageObject = grpc.loadPackageDefinition(packageDefinition)
    const client = await new packageObject.qrl.Base(grpcEndpoint, grpc.credentials.createInsecure())
    const res = await clientGetNodeInfo(client)
    const qrlProtoFilePath = tmp.fileSync({mode: '0644', prefix: 'qrl-', postfix: '.proto'}).name
    await writeFile(qrlProtoFilePath, res.grpcProto).then(fsErr => {
      if (fsErr) {
        throw new Error('tmp filesystem error')
      }
    })
    // console.log(qrlProtoFilePath)
    return qrlProtoFilePath
  })
}

async function loadGrpcProto(protofile, endpoint) {
    console.log("Loading gRPC proto...")
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
  const packageDefinition = await protoLoader.load(protofile, options)
  const grpcObject = await grpc.loadPackageDefinition(packageDefinition)
  const grpcObjectString = JSON.stringify(util.inspect(grpcObject.qrl, {showHidden: true, depth: 4}))
  const protoObjectWordArray = CryptoJS.lib.WordArray.create(grpcObjectString)
  const calculatedObjectHash = CryptoJS.SHA256(protoObjectWordArray).toString(CryptoJS.enc.Hex)
  
  let verified = false
  QRLPROTO_SHA256.forEach(value => {
    // console.log(calculatedObjectHash)
    // console.log(value.objectSha256)
    if (value.objectSha256 === calculatedObjectHash) {
      verified = true
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
  console.log(verified)
  if (verified) {
    qrlClient = createClient({
      protoPath: protofile,
      packageName: 'qrl',
      serviceName: 'PublicAPI',
      options: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    }, endpoint)
  } else {
    throw new Error('Unable to verify proto file')
  }
}

class EphemeralKeys extends Command {
  async run() {
    const {args, flags} = this.parse(EphemeralKeys)

    let grpcEndpoint = 'devnet-1.automated.theqrl.org:19009'
    let network = 'Devnet'

    this.log(white().bgBlue(network))
    const spinner = ora({text: 'Fetching Ephemeral keys from API...'}).start()

    

    // const proto = await loadGrpcBaseProto(grpcEndpoint)
    // checkProtoHash(proto).then(async protoHash => {
    //   if (!protoHash) {
    //     this.log(`${red('⨉')} Unable to validate .proto file from node`)
    //     this.exit(1)
    //   }
    //   // next load GRPC object and check hash of that too
    //   await loadGrpcProto(proto, grpcEndpoint)
    //   const request = {}
    //   await qrlClient.GetNodeState(request, async (error, response) => {
    //     if (error) {
    //       this.log(`${red('⨉')} Unable to read next unused OTS key`)
    //     }
    //     spinner.succeed(`RESPONSE: ${JSON.stringify(response.info) }`)
    //   })
    // })


    const test = arr => {
        const vec = new DILLIB.getString()
        console.log(vec)
    }


    const waitForDILLIB = callBack => {
        setTimeout(() => {
        // Test the QRLLIB object has the str2bin function.
        // This is sufficient to tell us QRLLIB has loaded.
        if (typeof DILLIB.getString === 'function' && DILLIBLoaded === true) {
            callBack()
        } 
        else {
            DILLIBLoaded = true
            return waitForDILLIB(callBack)
        }
        return false
        }, 50)
    }

    waitForDILLIB(async _ => {
        // console.log(DILLIB.Dilithium.empty())
        // console.log(DILLIB.getString())
        const DIL_OBJECT = await new DILLIB.Dilithium.empty()
        console.log(" ")
        console.log("Dilithium PK")
        console.log(DIL_OBJECT.getPK())
        console.log("Dilithium SK")
        console.log(DIL_OBJECT.getSK())
        spinner.succeed(`Dilithium`)
    })



    // const toUint8Vector = arr => {
    //     console.log("toUint8Vector")
    //     const vec = new QRLLIB.Uint8Vector()
    //     console.log(vec)
    //     for (let i = 0; i < arr.length; i += 1) {
    //         console.log(arr[i])
    //       vec.push_back(arr[i])
    //     }
    //     return vec
    //   }


    //   const waitForQRLLIB = callBack => {
    //     setTimeout(() => {
    //       // Test the QRLLIB object has the str2bin function.
    //       // This is sufficient to tell us QRLLIB has loaded.
    //       if (typeof QRLLIB.str2bin === 'function' && QRLLIBLoaded === true) {
    //         callBack()
    //       } else {
    //         QRLLIBLoaded = true
    //         return waitForQRLLIB(callBack)
    //       }
    //       return false
    //     }, 50)
    //   }

    // waitForQRLLIB(async _ => {
    //     console.log("WaitForQRLLIB")
    //   // default to a tree height of 10 unless passed via CLI
    //   let xmssHeight = 10
    //   // default to SHA2-256 unless otherwise specified
    //   console.log(QRLLIB)
    //   let hashFunction = QRLLIB.eHashFunction.SHA2_256
    //   let hashCount = 0
    //   const randomSeed = toUint8Vector(Crypto.randomBytes(48))
    //   console.log(randomSeed)
    //   const XMSS_OBJECT = await new QRLLIB.Xmss.fromParameters(randomSeed, xmssHeight, hashFunction)
    // //   spinner.succeed('Wallet created')
    // })



  }
}

EphemeralKeys.description = `Get Ephemeral keys associated to an address
`

EphemeralKeys.args = [
  {
    name: 'address',
    description: 'address to return OTS state for',
    required: false,
  },
]

EphemeralKeys.flags = {
  testnet: flags.boolean({char: 't', default: false, description: 'queries testnet for the OTS state'}),
  mainnet: flags.boolean({char: 'm', default: false, description: 'queries mainnet for the OTS state'}),
  grpc: flags.string({char: 'g', required: false, description: 'advanced: grcp endpoint (for devnet/custom QRL network deployments)'}),
  password: flags.string({char: 'p', required: false, description: 'wallet file password'}),
}

module.exports = {EphemeralKeys}
