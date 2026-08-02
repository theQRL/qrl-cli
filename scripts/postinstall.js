#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Post-install script for QRL CLI
 *
 * 1. Copies the appropriate ecdh.node file from the assets folder to the
 *    eccrypto module's expected location to enable native performance.
 *    The binary is verified against a pinned SHA-256 checksum before being
 *    copied; a mismatch aborts the copy and eccrypto falls back to its
 *    JS implementation.
 *
 * 2. Hardens the vendored qrllib Emscripten bundles:
 *    - forces Module.ENVIRONMENT = 'NODE' so the random-device selection is
 *      explicit rather than environment-sniffed
 *    - replaces the Math.random() fallback arm of the /dev/urandom device
 *      with a throw, so a mis-detected environment fails closed instead of
 *      silently degrading key generation
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Pinned SHA-256 checksums of the committed prebuilt eccrypto native modules.
// Recompute with `shasum -a 256 assets/<platform>/ecdh.node` when the
// binaries are intentionally updated.
const ECDH_CHECKSUMS = {
  linux: 'c466623dd528170c6b69f879e027d7b957d90bb0c0519432c2f2ea3fb561a50f',
  macos: 'db262f2bf361ff766d728a40e3f03ded238d5a5e2649aa7965a5ceb06887c4a7',
  win: 'bbfc5a61512dbf9ac28c5adfee2389ec72e535dd75814019dd8d93145170374e',
};

function installEcdhNode() {
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
    return;
  }

  const assetsPath = path.join(__dirname, '..', 'assets', assetDir, 'ecdh.node');
  const eccryptoPath = path.join(__dirname, '..', 'node_modules', 'eccrypto', 'build', 'Release');
  const targetPath = path.join(eccryptoPath, 'ecdh.node');

  if (!fs.existsSync(assetsPath)) {
    console.log(`Warning: ecdh.node not found at ${assetsPath}`);
    console.log('eccrypto will use browser fallback');
    return;
  }

  // Verify the prebuilt native module against the pinned checksum before
  // copying it anywhere it will be loaded as native code.
  const actual = crypto.createHash('sha256').update(fs.readFileSync(assetsPath)).digest('hex');
  const expected = ECDH_CHECKSUMS[assetDir];
  if (actual !== expected) {
    console.error(`ERROR: checksum mismatch for ${assetDir}/ecdh.node`);
    console.error(`  expected: ${expected}`);
    console.error(`  actual:   ${actual}`);
    console.error('Refusing to install the native module; eccrypto will use its JS fallback.');
    return;
  }

  try {
    fs.mkdirSync(eccryptoPath, { recursive: true });
  } catch (err) {
    console.error('Failed to create eccrypto build directory:', err.message);
    return;
  }

  try {
    fs.copyFileSync(assetsPath, targetPath);
    console.log(`✓ Copied ${assetDir}/ecdh.node (checksum verified) to eccrypto module for native performance`);
  } catch (err) {
    console.log(`Warning: Failed to copy ecdh.node: ${err.message}`);
    console.log('eccrypto will use browser fallback with warning message on first use.');
  }
}

// The Emscripten glue in the qrllib bundles selects the /dev/urandom device
// implementation by sniffing the environment, with a silent Math.random()
// fallback if neither WebCrypto nor Node is detected. Both properties are
// unacceptable for code that feeds key generation, so patch the installed
// bundles: pin the environment and make the fallback arm throw.
const QRLLIB_BUNDLES = [
  'offline-libjsqrl.js',
  'offline-libjsdilithium.js',
  'offline-libjskyber.js',
];

const ENV_SNIFF = 'var Module=typeof Module!=="undefined"?Module:{};';
const ENV_PINNED = 'var Module=typeof Module!=="undefined"?Module:{};Module["ENVIRONMENT"]="NODE";';

const MATH_RANDOM_ARM = 'else{random_device=(function(){return Math.random()*256|0})}';
const FAIL_CLOSED_ARM = 'else{random_device=(function(){throw new Error("qrl-cli: no secure random source available in this environment")})}';

function patchQrllibBundles() {
  const buildDir = path.join(__dirname, '..', 'node_modules', 'qrllib', 'build');
  QRLLIB_BUNDLES.forEach((bundle) => {
    const bundlePath = path.join(buildDir, bundle);
    if (!fs.existsSync(bundlePath)) {
      console.log(`Warning: qrllib bundle not found at ${bundlePath}; skipping RNG hardening patch`);
      return;
    }
    let source = fs.readFileSync(bundlePath, 'utf8');
    let changed = false;

    if (source.includes(MATH_RANDOM_ARM)) {
      source = source.split(MATH_RANDOM_ARM).join(FAIL_CLOSED_ARM);
      changed = true;
    }
    if (!source.includes('Module["ENVIRONMENT"]="NODE";') && source.startsWith(ENV_SNIFF)) {
      source = ENV_PINNED + source.slice(ENV_SNIFF.length);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(bundlePath, source);
      console.log(`✓ Hardened ${bundle}: ENVIRONMENT pinned to NODE, Math.random RNG arm removed`);
    } else if (source.includes('Math.random()*256|0')) {
      console.error(`ERROR: ${bundle} contains a Math.random RNG arm in an unexpected form; manual review required`);
      process.exitCode = 1;
    }
  });
}

installEcdhNode();
patchQrllibBundles();
