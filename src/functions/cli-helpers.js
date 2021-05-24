/* global QRLLIB */
/* global DILLIB */
/* global KYBLIB */
const fs = require('fs')
const bech32 = require('bech32')

// /////////////////////////
// Export functions
// /////////////////////////
const shorPerQuanta = 10 ** 9


// network settings
// set with grpcEndpoint = clihelpers.testnetNode.toString()
const mainnetNode = 'mainnet-1.automated.theqrl.org:19009'
// const mainnetNode = '10.10.10.21:19009'
const testnetNode = 'testnet-1.automated.theqrl.org:19009'
// const testnetNode = '10.10.10.21:19010'

// const testnetNode = 'devnet-1.automated.theqrl.org:19009' //devnet

// qrllib
let DILLIBLoaded = false

const waitForDILLIB = (callBack) => {
  setTimeout(() => {
    // Test the DILLIB object has the getString function.
    // This is sufficient to tell us DILLIB has loaded.
    if (typeof DILLIB.getString === 'function' && DILLIBLoaded === true) {
      callBack()
    } else {
      DILLIBLoaded = true
      return waitForDILLIB(callBack)
    }
    return false
  }, 50)
}

let KYBLIBLoaded = false

const waitForKYBLIB = (callBack) => {
  setTimeout(() => {
    // Test the KYBLIB object has the getString function.
    // This is sufficient to tell us KYBLIB has loaded.
    if (typeof KYBLIB.getString === 'function' && KYBLIBLoaded === true) {
      callBack()
    } else {
      KYBLIBLoaded = true
      return waitForKYBLIB(callBack)
    }
    return false
  }, 50)
}

let QRLLIBLoaded = false

const waitForQRLLIB = (callBack) => {
  setTimeout(() => {
    // Test the QRLLIB object has the str2bin function.
    // This is sufficient to tell us QRLLIB has loaded.
    if (typeof QRLLIB.str2bin === 'function' && QRLLIBLoaded === true) {
      callBack()
    } else {
      QRLLIBLoaded = true
      return waitForQRLLIB(callBack)
    }
    return false
  }, 50)
}

// string to minary
function string2Bin(str) {
  const result = [];
/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
  for (let i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i));
  }
  return result;
}

// toUint8Vector
const toUint8Vector = (arr) => {
  const vec = new QRLLIB.Uint8Vector()
  for (let i = 0; i < arr.length; i += 1) {
    vec.push_back(arr[i])
  }
  return vec
}


// Convert bytes to hex
function bytesToHex(byteArray) {
  return [...byteArray]
    /* eslint-disable */
    .map((byte) => {
      return ('00' + (byte & 0xff).toString(16)).slice(-2)
    })
    /* eslint-enable */
    .join('')
}

// Concatenates multiple typed arrays into one.
function concatenateTypedArrays(resultConstructor, ...arrays) {
  /* eslint-disable */
  let totalLength = 0
  for (let arr of arrays) {
    totalLength += arr.length
  }
  const result = new resultConstructor(totalLength)
  let offset = 0
  for (let arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }
  /* eslint-enable */
  return result
}

// Convert Binary object to Bytes
function binaryToBytes(convertMe) {
  const thisBytes = new Uint8Array(convertMe.size())
  for (let i = 0; i < convertMe.size(); i += 1) {
    thisBytes[i] = convertMe.get(i)
  }
  return thisBytes
}

// Take input and convert to unsigned uint64 bigendian bytes
function toBigendianUint64BytesUnsigned(i, bufferResponse = false) {
  let input = i
  if (!Number.isInteger(input)) {
    input = parseInt(input, 10)
  }

  const byteArray = [0, 0, 0, 0, 0, 0, 0, 0]

  for (let index = 0; index < byteArray.length; index += 1) {
    const byte = input & 0xff // eslint-disable-line no-bitwise
    byteArray[index] = byte
    input = (input - byte) / 256
  }

  byteArray.reverse()

  if (bufferResponse === true) {
    const result = Buffer.from(byteArray)
    return result
  }
  const result = new Uint8Array(byteArray)
  return result
}
// open wallet file
const openWalletFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)[0]
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

const openFilePlain = (path) => {
  const contents = fs.readFileSync(path)
  return contents
}

function byteCount(s) {
    return encodeURI(s).split(/%..|./).length - 1;
}

/* eslint-disable */
const addressForAPI = (address) => {
  return Buffer.from(address.substring(1), 'hex')
}
/* eslint-enable */

function b32Encode(input) {
  return bech32.encode('q', bech32.toWords(input))
}

const pkRawToB32Address = pkRaw => {
  const rawDescriptor = Uint8Array.from([pkRaw.get(0), pkRaw.get(1), pkRaw.get(2)])
  const ePkHash = binaryToBytes(QRLLIB.sha2_256(pkRaw)) // Uint8Vector -> Uint8Array conversion
  const descriptorAndHash = concatenateTypedArrays(Uint8Array, rawDescriptor, ePkHash)
  return b32Encode(descriptorAndHash)
}


// check if file is empty
function isFileEmpty(fileName, ignoreWhitespace=true) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if( err ) {
        reject(err);
        return;
      }
      resolve((!ignoreWhitespace && data.length === 0) || (ignoreWhitespace && !!String(data).match(/^\s*$/)))
    });
  })
}

function stringToBytes(str) {
  const result = [];
  /* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
  for (let i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i));
  }
  return result;
}


module.exports = {
  addressForAPI,
  b32Encode,
  byteCount,
  bytesToHex,
  binaryToBytes,
  concatenateTypedArrays,
  isFileEmpty,
  mainnetNode,
  openFile,
  openFilePlain,
  openWalletFile,
  pkRawToB32Address,
  shorPerQuanta,
  string2Bin,
  stringToBytes,
  testnetNode,
  toBigendianUint64BytesUnsigned,
  toUint8Vector,
  waitForDILLIB,
  waitForKYBLIB,
  waitForQRLLIB,
};