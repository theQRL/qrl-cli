/**
 * Wallet/key file encryption helper.
 *
 * encrypt() writes the current format (v2): scrypt key derivation with a
 * per-file random salt, AES-256-GCM authenticated encryption.
 *   v2:<base64 salt>:<base64 iv>:<base64 auth tag>:<base64 ciphertext>
 *
 * decrypt() transparently accepts both v2 and the legacy format produced by
 * the old `aes256` npm package (unsalted single-round SHA-256 key,
 * AES-256-CTR, base64(iv || ciphertext)) so files written by earlier
 * releases still open. Legacy blobs are plain base64 and can never contain
 * a ':', so the prefix is an unambiguous discriminator.
 */

const crypto = require('crypto')

const V2_PREFIX = 'v2'
const SCRYPT_PARAMS = {N: 2 ** 15, r: 8, p: 1, maxmem: 128 * 1024 * 1024}

const deriveKey = (password, salt) => crypto.scryptSync(String(password), salt, 32, SCRYPT_PARAMS)

function encrypt(password, plaintext) {
  if (typeof password !== 'string' || !password) {
    throw new TypeError('Provided "password" must be a non-empty string')
  }
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = deriveKey(password, salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [
    V2_PREFIX,
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
  ].join(':')
}

// Legacy `aes256` package format: key = sha256(password), AES-256-CTR,
// base64(iv(16) || ciphertext). Unauthenticated: a wrong password yields
// garbage rather than an error, so callers must validate the plaintext.
function decryptLegacy(password, encoded) {
  const raw = Buffer.from(encoded, 'base64')
  const iv = raw.subarray(0, 16)
  const ciphertext = raw.subarray(16)
  const key = crypto.createHash('sha256').update(String(password)).digest()
  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

function decrypt(password, encrypted) {
  const encoded = String(encrypted)
  if (!encoded.startsWith(`${V2_PREFIX}:`)) {
    return decryptLegacy(password, encoded)
  }
  const [, saltB64, ivB64, tagB64, ciphertextB64] = encoded.split(':')
  const key = deriveKey(password, Buffer.from(saltB64, 'base64'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  try {
    return Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]).toString('utf8')
  } catch (error) {
    throw new Error('Decryption failed: incorrect password or corrupted file')
  }
}

module.exports = {encrypt, decrypt}
