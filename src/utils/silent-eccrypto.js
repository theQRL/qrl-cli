/**
 * Silent eccrypto loader
 * This module loads eccrypto while suppressing the "secp256k1 unavailable, reverting to browser version" message
 */

/* eslint-disable no-console */

// Store original console.info
const originalConsoleInfo = console.info;

// Temporarily override console.info to filter out the secp256k1 message
console.info = function info(message, ...args) {
  // Check if the message contains the secp256k1 warning
  if (typeof message === 'string' && message.includes('secp256k1 unavailable, reverting to browser version')) {
    // Silently ignore this specific message
    return;
  }
  // For all other messages, use the original console.info
  originalConsoleInfo.call(console, message, ...args);
};

// Load eccrypto (this will trigger the try/catch but we've silenced the warning)
const eccrypto = require('eccrypto');

// Restore original console.info
console.info = originalConsoleInfo;

// Export the loaded eccrypto module
module.exports = eccrypto;
