#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Post-install script for QRL CLI
 * 
 * This script copies the appropriate ecdh.node file from the assets folder
 * to the eccrypto module's expected location to enable native performance
 * and suppress the "secp256k1 unavailable, reverting to browser version" warning.
 */

const fs = require('fs');
const path = require('path');

// Detect platform and architecture
const { platform, arch } = process;

let assetDir;
if (platform === 'win32') {
  assetDir = 'win';
} else if (platform === 'darwin') {
  assetDir = 'macos';
} else if (platform === 'linux' && arch === 'x64') {
  assetDir = 'linux';
} else {
  console.log(`No pre-built ecdh.node available for ${platform}/${arch}, using browser fallback`);
  console.log('Note: The QRL CLI uses a silent wrapper to suppress eccrypto warning messages.');
  process.exit(0);
}

// Define paths
const assetsPath = path.join(__dirname, '..', 'assets', assetDir, 'ecdh.node');
const eccryptoPath = path.join(__dirname, '..', 'node_modules', 'eccrypto', 'build', 'Release');
const targetPath = path.join(eccryptoPath, 'ecdh.node');

// Check if source file exists
if (!fs.existsSync(assetsPath)) {
  console.log(`Warning: ecdh.node not found at ${assetsPath}`);
  console.log('eccrypto will use browser fallback');
  process.exit(0);
}

// Create target directory if it doesn't exist
try {
  fs.mkdirSync(eccryptoPath, { recursive: true });
} catch (err) {
  console.error('Failed to create eccrypto build directory:', err.message);
  process.exit(0);
}

// Copy the file
try {
  fs.copyFileSync(assetsPath, targetPath);
  console.log(`✓ Copied ${assetDir}/ecdh.node to eccrypto module for native performance`);
  console.log('  This should eliminate the "secp256k1 unavailable" warning message.');
} catch (err) {
  console.log(`Warning: Failed to copy ecdh.node: ${err.message}`);
  console.log('eccrypto will use browser fallback with warning message on first use.');
}
