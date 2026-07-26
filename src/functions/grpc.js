/* eslint new-cap: 0 */

/* GRPC functions */

const grpc = require('@grpc/grpc-js')
const tmp = require('tmp')
const CryptoJS = require('crypto-js')
const { QRLPROTO_SHA256 } = require('@theqrl/qrl-proto-sha256')
const protoLoader = require('@grpc/proto-loader')
const { QRLPROTOPATH } = require('@theqrl/qrlbase.proto')
const fs = require('fs')
const util = require('util')
const path = require('path')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const PROTO_PATH = QRLPROTOPATH

const GOOGLE_PATH = `${path.dirname(QRLPROTOPATH)}/`

function clientGetNodeInfo(client) {
    return new Promise((resolve, reject) => {
      client.getNodeInfo({}, (error, response) => {
        if (error) {
          reject(error)
        }
        resolve(response)
      })
    })
}

function checkProtoHash(file) {
  return readFile(file).then((contents) => {
    // console.log(contents)
    const protoFileWordArray = CryptoJS.lib.WordArray.create(
      contents.toString()
    )
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(
      CryptoJS.enc.Hex
    )
    let verified = false
    QRLPROTO_SHA256.forEach((value) => {
      if (value.protoHash) {
        if (value.protoHash === calculatedProtoHash) {
          verified = true
        }
      }
    })
    return verified
  })
}

function loadGrpcBaseProto(grpcEndpoint) {
    const options = {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [GOOGLE_PATH, '/snapshot/qrl-cli/node_modules/@theqrl/qrlbase.proto/'],
    }
  return protoLoader.load(PROTO_PATH, options).then(async (packageDefinition) => {
      const packageObject = await grpc.loadPackageDefinition(packageDefinition)
      const client = await new packageObject.qrl.Base(
        grpcEndpoint,
        grpc.credentials.createInsecure()
      )
      const res = await clientGetNodeInfo(client)
      const qrlProtoFilePath = tmp.fileSync({
        mode: '0644',
        prefix: 'qrl-',
        postfix: '.proto',
      }).name
      writeFile(qrlProtoFilePath, res.grpcProto).then((fsErr) => {
        if (fsErr) {
          return null
        }
        return true
      })
      return qrlProtoFilePath
  })
}

async function loadGrpcProto(protofile, endpoint) {
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [GOOGLE_PATH],
  }
  const packageDefinition = await protoLoader.load(protofile, options)
  const grpcObject = grpc.loadPackageDefinition(packageDefinition)
  const protoObjectWordArray = CryptoJS.lib.WordArray.create(readFile(protofile))
  const calculatedObjectHash = CryptoJS.SHA256(protoObjectWordArray).toString(
    CryptoJS.enc.Hex
  )
  let verified = false
  QRLPROTO_SHA256.forEach((value) => {
    if (value.cliProto) {
      if (value.cliProto === calculatedObjectHash) {
        verified = true
      }
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
  if (verified) {
    return new grpcObject.qrl.PublicAPI(
      endpoint,
      grpc.credentials.createInsecure()
    )
  }
  return null
}

async function makeClient(grpcEndpoint) {
  const proto = await loadGrpcBaseProto(grpcEndpoint)
  if (proto) {
    const validHash = await checkProtoHash(proto)
    if (validHash) {
      const client = await loadGrpcProto(proto, grpcEndpoint)
      return client
    }
  }
  return null
}

class QrlNode {
  constructor(ipAddress) {
    this.version = '0.6.0'
    this.connection = false
    this.client = null

    // Stateful Configuration & Precedence logic
    const Conf = require('conf') // eslint-disable-line global-require
    const config = new Conf({ projectName: 'qrl-cli' })
    const MAINNET_ENDPOINT = 'mainnet-3.automated.theqrl.org:19009'
    const TESTNET_ENDPOINT = 'testnet-3.automated.theqrl.org:19009'

    // Check if the user explicitly provided network flags in the process arguments
    const {argv} = process
    const hasTestnet = argv.includes('-t') || argv.includes('--testnet')
    const hasMainnet = argv.includes('-m') || argv.includes('--mainnet')
    const hasGrpc = argv.includes('-g') || argv.includes('--grpc')

    let resolvedAddress = ipAddress

    // If the user did not pass explicit overrides, check config store & environment variables
    if (!hasTestnet && !hasMainnet && !hasGrpc) {
      const configEndpoint = config.get('grpc-endpoint')
      const configNetwork = config.get('default-network')

      if (process.env.QRL_GRPC_ENDPOINT) {
        resolvedAddress = process.env.QRL_GRPC_ENDPOINT
      } else if (configEndpoint) {
        resolvedAddress = configEndpoint
      } else if (process.env.QRL_NETWORK === 'testnet') {
        resolvedAddress = TESTNET_ENDPOINT
      } else if (configNetwork === 'testnet') {
        resolvedAddress = TESTNET_ENDPOINT
      } else if (process.env.QRL_NETWORK === 'mainnet') {
        resolvedAddress = MAINNET_ENDPOINT
      } else if (configNetwork === 'mainnet') {
        resolvedAddress = MAINNET_ENDPOINT
      }
    }

    this.ipAddress = resolvedAddress
    this.port = 19009
  }

  async connect() {
    if (this.connection === false) {
      const client = await makeClient(this.ipAddress)
      if (client === null) {
        this.connection = false
      } else {
        this.connection = true
      }
      this.client = client
      return client
    }
    throw new Error('Already connected')
  }

  disconnect() {
    this.client = null
    this.connection = false
  }

  async validApi(apiCall) {
    try {
      const client = await this.client
      if (client[apiCall].path.substr(0, 5) === '/qrl.') {
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  api(apiCall, request = {}) {
      return new Promise((resolve, reject) => {
        let { client } = this
        if (this.connection === false) {
          client = this.connect()
        }
        client[apiCall](request, (error, response) => {
          if (error) {
            // console.log('\nError with transaction: ' + JSON.stringify(error))
            reject(error)
          }
          resolve(response)
        })
      })
  }
}

module.exports = QrlNode