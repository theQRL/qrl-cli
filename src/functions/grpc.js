/* eslint new-cap: 0 */

/* GRPC functions */

const grpc = require('@grpc/grpc-js')
const {createClient} = require('grpc-js-kit')
const tmp = require('tmp')
const CryptoJS = require('crypto-js')
const {QRLPROTO_SHA256} = require('@theqrl/qrl-proto-sha256')
const protoLoader = require('@grpc/proto-loader')
const PROTO_PATH = `${__dirname}/../../src/qrlbase.proto`
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const clientGetNodeInfo = client => {
  return new Promise((resolve, reject) => {
    client.getNodeInfo({}, (error, response) => {
      if (error) {
        reject(error)
      }
      // console.log('node version: ' + response.version)
      resolve(response)
    })
  })
}

let qrlClient = null

async function checkProtoHash(file) {
  return readFile(file).then(async contents => {
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents)
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(CryptoJS.enc.Hex)

    // FIX-ME!!! Changed fro development, will need to evert for production
    // console.log(calculatedProtoHash)

    // let verified = false
    let verified = true
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
  }
  const packageDefinition = await protoLoader.load(protofile, options)
  const grpcObject = await grpc.loadPackageDefinition(packageDefinition)
  const grpcObjectString = JSON.stringify(util.inspect(grpcObject.qrl, {showHidden: true, depth: 4}))
  const protoObjectWordArray = CryptoJS.lib.WordArray.create(grpcObjectString)
  const calculatedObjectHash = CryptoJS.SHA256(protoObjectWordArray).toString(CryptoJS.enc.Hex)

  // FIX-ME!!! Changed fro development, will need to evert for production
  // console.log(calculatedProtoHash)
  // let verified = false
  let verified = true

  QRLPROTO_SHA256.forEach(value => {
    if (value.memoryHash === calculatedObjectHash) {
      verified = true
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
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
    return qrlClient
  }
  console.log('Unable to verifty proto file - have hashes changed?') // eslint-disable-line no-console
  throw new Error('Unable to verify proto file')
}

module.exports = {
  clientGetNodeInfo,
  qrlClient,
  checkProtoHash,
  loadGrpcBaseProto,
  loadGrpcProto,
}
