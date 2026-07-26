// ////////////////////////// 
// hooks.js
// 
// Setup chain functions prior to running tests. 
// This file cleans up after it's self.
//
// //////////////////////////

const fs = require('fs')
const {spawn} = require('child_process')
const testSetup = require('./test_setup')

const processFlags = {
  detached: true,
  stdio: ['ignore', 'inherit', 'inherit'],
}

// Helper to run a command and return a Promise
function runCliCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    // Capture stdout and stderr
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command '${command} ${args.join(' ')}' failed with exit code ${code}. Stderr: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start command '${command} ${args.join(' ')}': ${err.message}`));
    });
  });
}

const openFile = (path) => {
  const contents = fs.readFileSync(path)
  return JSON.parse(contents)
}

function walletCreate(input) {
  // let exitCode
  const args = [
    'create-wallet',
    '-3',
    '-h', '6',
    '-f', input.dir,
  ]
  before(done => {
    const childProcess = spawn('./bin/run', args, processFlags)
    childProcess.on('exit', code => {
      // exitCode = code
      if (code !== 0) {
        done(new Error(`create-wallet process exited with code ${code}`));
      } else {
        done();
      }
    })
  })
}

function encWalletCreate(input) {
  // let exitCode
  const args = [
    'create-wallet',
    '-2',
    '-h', '6',
    '-f', input.dir,
    '-p', input.encPass,
  ]
  before(done => {
    const childProcess = spawn('./bin/run', args, processFlags)
    childProcess.on('exit', code => {
      // exitCode = code
      if (code !== 0) {
        done(new Error(`create-wallet process exited with code ${code}`));
      } else {
        done();
      }
    })
  })
}

function sendOfflineFileGen(input) {
  const args = [
    'send',
    '1',
    '-r',
    'Q000200ecffb27f3d7b11ccd048eb559277d64bb52bfda998341e66a9f11b2d07f6b2ee4f62c408',
    '-w',
    input.walletFile,
    '-i',
    '1',
    '-t',
    '-T',
    input.dir,
  ]
  before(done => {
    // Skip offline transaction generation in offline mode
    if (process.env.QRL_TEST_OFFLINE === 'true') {
      done();
      return;
    }
    
    const childProcess = spawn('./bin/run', args, processFlags)
    childProcess.on('exit', code => {
      // exitCode = code
      if (code !== 0) {
        done(new Error(`send process exited with code ${code}`));
      } else {
        done();
      }
    })
  })
}

async function getKeys(input) {
  const args = [
    'get-keys',
    '-T', input.hash,
    '-t',
    '-f', input.outFile,
  ];
  await runCliCommand('./bin/run', args, processFlags);
}

function latticeCreate(input) {
  // let exitCode
  const args = [
    'generate-lattice-keys',
    '-i', input.index,
    '-w', input.wallet,
    '-c', input.outFile,
    '-t',
  ]
  // Only add broadcast flag if not in offline mode
  if (process.env.QRL_TEST_OFFLINE !== 'true') {
    args.push('-b');
  }
  before(done => {
    // Add a small delay to prevent overwhelming the network
    setTimeout(() => {
    const childProcess = spawn('./bin/run', args, { ...processFlags, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    childProcess.on('exit', async (code) => {
        if (code !== 0) {
          done(new Error(`generate-lattice-keys process exited with code ${code}. Stderr: ${stderr}`));
          return;
        }
        try {
          const latticeTX = openFile(input.outFile);
          // Only try to get keys if we have a real transaction hash (not in offline mode)
          if (latticeTX[0].tx_hash && latticeTX[0].tx_hash !== 'false') {
            const txID = latticeTX[0].tx_hash;
            await getKeys({ hash: txID, outFile: input.pubKeyFile });
          } else if (input.pubKeyFile) {
            // In offline mode, create a mock pub key file
            const mockPubKeys = {
              kyberPK: latticeTX[0].kyberPK,
              dilithiumPK: latticeTX[0].dilithiumPK,
              ecdsaPK: latticeTX[0].ecdsaPK
            };
            const fs = require('fs'); // eslint-disable-line global-require
            fs.writeFileSync(input.pubKeyFile, JSON.stringify([mockPubKeys]));
          }
          done();
        } catch (err) {
          done(err);
        }
      });
      childProcess.on('error', (err) => {
        done(err);
      });
    }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
  });
}

function encLatticeCreate(input) {
  // let exitCode
  const args = [
    'generate-lattice-keys',
    '-i', input.index,
    '-w', input.wallet,
    '-c', input.outFile,
    '-p', input.encPass,
    '-e', input.encPass,
    '-t',
    //    generate-lattice-keys -i 5, -w alice-wallet-ENC.json -c alice-lattice.json -p password123 -e password123 -t -b
  ]
  // Only add broadcast flag if not in offline mode
  if (process.env.QRL_TEST_OFFLINE !== 'true') {
    args.push('-b');
  }
  before(done => {
    // Add a small delay to prevent overwhelming the network
    setTimeout(() => {
      const childProcess = spawn('./bin/run', args, { ...processFlags, stdio: ['ignore', 'ignore', 'pipe'] })
      let stderr = '';
      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      childProcess.on('exit', code => {
        // exitCode = code
        if (code !== 0) {
          done(new Error(`Process exited with code ${code}. Stderr: ${stderr}`));
        } else {
          done();
        }
      })
    }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
  })
}

function sharedKeys(input) {
  before(done => {
    // Skip shared key generation in offline mode
    if (process.env.QRL_TEST_OFFLINE === 'true') {
      done();
      return;
    }
    
    const args = [
      'generate-shared-keys',
      input.pubkey, 
      input.seckey, 
      '-c', input.cipherText,
      '-k', input.sharedKeyFile,
      '-s', input.signedMessage,
      '-t',
    ]
    const childProcess = spawn('./bin/run', args, processFlags)
    childProcess.on('exit', code => {
      if (code !== 0) {
        done(new Error(`generate-shared-keys process exited with code ${code}`));
      } else {
        done();
      }
    })
  })
}

function regenSharedKeys(input) {
  before(done => {
    // Skip shared key regeneration in offline mode
    if (process.env.QRL_TEST_OFFLINE === 'true') {
      done();
      return;
    }
    
    const args = [
      'generate-shared-keys',
      input.pubkey, 
      input.seckey, 
      input.cipherText,
      input.signedMessage,
      '-k', input.sharedKeyFile,
      '-t',
    ]
    const childProcess = spawn('./bin/run', args, processFlags)
    childProcess.on('exit', code => {
      if (code !== 0) {
        done(new Error(`generate-shared-keys process exited with code ${code}`));
      } else {
        done();
      }
    })
  })
}

function fileRemove(dir) {
  let exitCode
  try {
    fs.unlinkSync(dir)
  }
  catch(err) {
    exitCode = err
  }
    return exitCode
}

// 
// global testSetup for all tests Runs before tests are performed
// 
exports.mochaHooks = {
  beforeAll: function _Hooks() {
    this.timeout(240000)

    // create a badWalletFile
    let content = '{"bad_content": "Not a wallet!"}'
    const createCode = ''
    fs.writeFile(testSetup.badWallet, content, err => {
      if (err) {
        createCode(err)
      }
    })

    // create notAWallet text file
    content = 'Some content, not a wallet!'
    fs.writeFile(testSetup.notAWalletFile, content, err => {
      if (err) {
        createCode(err)
      }
    })

    // create a emptyText File
    content = ''
    fs.writeFile(testSetup.emptyText, content, err => {
      if (err) {
        createCode(err)
      }
    })

    // create test wallets
    walletCreate({dir: testSetup.walletFile })
    encWalletCreate({ dir: testSetup.encWalletFile, encPass: testSetup.encPass })
    // Alice Wallets
    walletCreate({dir: testSetup.alicePTWalletLocation})
    // lattice keys
    latticeCreate({ wallet: testSetup.alicePTWalletLocation, outFile: testSetup.aliceLatticeLocation, index: '0', pubKeyFile: testSetup.alicePubKeyFile })
    encLatticeCreate({ wallet: testSetup.alicePTWalletLocation, outFile: testSetup.aliceENCLatticeLocation, index: '1', pass: testSetup.aliceEncPass, encPass: testSetup.aliceEncPass })
    
    encWalletCreate({dir: testSetup.aliceENCWalletLocation, encPass: testSetup.aliceEncPass})
    encLatticeCreate({ wallet: testSetup.aliceENCWalletLocation, outFile: testSetup.aliceTempENCLatticeKey, index: '0', pass: testSetup.aliceEncPass, encPass: testSetup.aliceEncPass })



    // Bob Wallets
    walletCreate({dir: testSetup.bobPTWalletLocation})    
    latticeCreate({ wallet: testSetup.bobPTWalletLocation, outFile: testSetup.bobLatticeLocation, index: '0', pubKeyFile: testSetup.bobPubKeyFile })
    encLatticeCreate({ wallet: testSetup.bobPTWalletLocation, outFile: testSetup.bobENCLatticeLocation, index: '1', pass: testSetup.bobEncPass, encPass: testSetup.bobEncPass })
    
    encWalletCreate({dir: testSetup.bobENCWalletLocation, encPass: testSetup.bobEncPass})    
    encLatticeCreate({ wallet: testSetup.bobENCWalletLocation, outFile: testSetup.bobTempENCLatticeKey, index: '0', pass: testSetup.bobEncPass, encPass: testSetup.bobEncPass })
    

    walletCreate({dir: testSetup.aliceTempPTWalletLocation})
    encWalletCreate({dir: testSetup.aliceTempENCWalletLocation, encPass: testSetup.aliceEncPass})

    walletCreate({dir: testSetup.bobTempPTWalletLocation})    
    encWalletCreate({dir: testSetup.bobTempENCWalletLocation, encPass: testSetup.bobEncPass})    


    // Generate Alice's shared key list from her secret lattice keys + bob's public lattice keys
    sharedKeys({ pubkey: testSetup.bobPubKeyFile, seckey: testSetup.aliceLatticeLocation, cipherText: testSetup.aliceCipherTextOut, sharedKeyFile: testSetup.aliceSharedKeyFile, signedMessage: testSetup.aliceSignedMessageOut })
    // Generate bob's shared key file from his secret lattice keys + Alice's public lattice keys
    sharedKeys({ pubkey: testSetup.alicePubKeyFile, seckey: testSetup.bobLatticeLocation, cipherText: testSetup.bobCipherTextOut, sharedKeyFile: testSetup.bobSharedKeyFile, signedMessage: testSetup.bobSignedMessageOut })
    
    // Re-Generate Alice's Shared Key file from bob's cyphertext, signedMessage and pub keys + Alice's Secret Lattice Keys
    regenSharedKeys({ pubkey: testSetup.bobPubKeyFile, seckey: testSetup.aliceLatticeLocation, cipherText: testSetup.bobCipherTextOut, sharedKeyFile: testSetup.aliceRegenSharedKeyFile, signedMessage: testSetup.bobSignedMessageOut })
    // Re-Generate Bob's Shared Key file from Alice's cyphertext, signedMessage and pub keys + bob's Secret Lattice Keys
    regenSharedKeys({ pubkey: testSetup.alicePubKeyFile, seckey: testSetup.bobLatticeLocation, cipherText: testSetup.aliceCipherTextOut, sharedKeyFile: testSetup.bobRegenSharedKeyFile, signedMessage: testSetup.aliceSignedMessageOut })

    sendOfflineFileGen({ dir: testSetup.sendTXOfflineFile , walletFile: testSetup.walletFile })
  },

  //
  // One-time final cleanup run after all testing is complete
  //
  afterAll: function _After() {
    fileRemove(testSetup.emptyText)

    fileRemove(testSetup.badWallet)
    fileRemove(testSetup.notAWalletFile)
    fileRemove(testSetup.walletFile)
    fileRemove(testSetup.encWalletFile)
    
    fileRemove(testSetup.alicePTWalletLocation)
    fileRemove(testSetup.aliceTempPTWalletLocation)
    fileRemove(testSetup.aliceENCWalletLocation)
    fileRemove(testSetup.aliceTempENCWalletLocation)
    
    fileRemove(testSetup.bobPTWalletLocation)
    fileRemove(testSetup.bobTempPTWalletLocation)
    fileRemove(testSetup.bobENCWalletLocation)
    fileRemove(testSetup.bobTempENCWalletLocation)
    
    fileRemove(testSetup.aliceLatticeLocation)
    fileRemove(testSetup.aliceTempLatticeKey)
    fileRemove(testSetup.aliceENCLatticeLocation)
    fileRemove(testSetup.aliceTempENCLatticeKey)
    
    fileRemove(testSetup.alicePubKeyFile)
    fileRemove(testSetup.aliceTempPubKeyFile)
    fileRemove(testSetup.aliceSignedMessageOut)
    fileRemove(testSetup.aliceTempSignedMessageOut)
    fileRemove(testSetup.aliceSharedKeyFile)
    fileRemove(testSetup.aliceTempSharedKeyFile)
    fileRemove(testSetup.aliceENCSharedKeyFile)
    fileRemove(testSetup.aliceTempENCSharedKeyFile)
    fileRemove(testSetup.aliceRegenSharedKeyFile)
    fileRemove(testSetup.aliceTempRegenSharedKeyFile)
    fileRemove(testSetup.aliceCipherTextOut)
    fileRemove(testSetup.aliceTempCipherTextOut)

    fileRemove(testSetup.bobLatticeLocation)
    fileRemove(testSetup.bobTempLatticeKey)
    fileRemove(testSetup.bobENCLatticeLocation)
    fileRemove(testSetup.bobTempENCLatticeKey)

    fileRemove(testSetup.bobPubKeyFile)
    fileRemove(testSetup.bobTempPubKeyFile)

    fileRemove(testSetup.bobSignedMessageOut)
    fileRemove(testSetup.bobTempSignedMessageOut)
    fileRemove(testSetup.bobSharedKeyFile)
    fileRemove(testSetup.bobTempSharedKeyFile)
    fileRemove(testSetup.bobRegenSharedKeyFile)
    fileRemove(testSetup.bobTempRegenSharedKeyFile)
    fileRemove(testSetup.bobTempEncSharedKeyFile)
    fileRemove(testSetup.bobCipherTextOut)
    fileRemove(testSetup.bobTempCipherTextOut)
    fileRemove(testSetup.sendTXOfflineFile)
  }
};