/**
 * Eccrypto loader with explicit implementation reporting.
 *
 * eccrypto emits "secp256k1 unavailable, reverting to browser version" via
 * console.info when the native module is missing. Rather than silently
 * suppressing the only runtime signal that a fallback occurred, this loader
 * captures it, records which implementation is active, and reports it when
 * verbose output is requested (--verbose flag or QRL_CLI_VERBOSE env var).
 */

/* eslint-disable no-console */

const originalConsoleInfo = console.info;

let usingFallback = false;

// Capture (rather than print) the fallback notice while eccrypto loads
console.info = function info(message, ...args) {
  if (typeof message === 'string' && message.includes('secp256k1 unavailable, reverting to browser version')) {
    usingFallback = true;
    return;
  }
  originalConsoleInfo.call(console, message, ...args);
};

const eccrypto = require('eccrypto');

console.info = originalConsoleInfo;

const implementation = usingFallback ? 'browser (elliptic, pure JS)' : 'native (secp256k1 ecdh.node)';

const verbose = process.env.QRL_CLI_VERBOSE === '1'
  || process.argv.includes('--verbose')
  || process.argv.includes('-v');

if (verbose) {
  console.info(`eccrypto secp256k1 implementation: ${implementation}`);
}

// Expose which implementation was resolved so callers/tests can assert on it
eccrypto.implementation = implementation;
eccrypto.usingFallback = usingFallback;

module.exports = eccrypto;
