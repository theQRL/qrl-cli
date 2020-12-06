qrl-cli
=======

QRL CLI functions

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@theqrl/cli.svg)](https://npmjs.org/package/@theqrl/cli)
[![CircleCI](https://circleci.com/gh/theQRL/qrl-cli.svg?style=svg)](https://circleci.com/gh/theQRL/qrl-cli)
[![codecov](https://codecov.io/gh/theQRL/qrl-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/theQRL/qrl-cli)
[![License](https://img.shields.io/npm/l/@theqrl/cli.svg)](https://github.com/theqrl/qrl-cli/blob/master/package.json)

![In action](render1563726016790.gif)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @theqrl/cli
$ qrl-cli COMMAND
running command...
$ qrl-cli (-v|--version|version)
@theqrl/cli/1.7.1 darwin-x64 node-v10.16.3
$ qrl-cli --help [COMMAND]
USAGE
  $ qrl-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qrl-cli balance ADDRESS`](#qrl-cli-balance-address)
* [`qrl-cli create-lattice`](#qrl-cli-create-lattice)
* [`qrl-cli create-wallet`](#qrl-cli-create-wallet)
* [`qrl-cli decrypt`](#qrl-cli-decrypt)
* [`qrl-cli encrypt [ADDRESS] [ITEM_PER_PAGE] [PAGE_NUMBER] [MESSAGE]`](#qrl-cli-encrypt-address-item_per_page-page_number-message)
* [`qrl-cli get-keys ADDRESS ITEM_PER_PAGE PAGE_NUMBER`](#qrl-cli-get-keys-address-item_per_page-page_number)
* [`qrl-cli help [COMMAND]`](#qrl-cli-help-command)
* [`qrl-cli ots ADDRESS`](#qrl-cli-ots-address)
* [`qrl-cli receive ADDRESS`](#qrl-cli-receive-address)
* [`qrl-cli receive-initial-message FILE`](#qrl-cli-receive-initial-message-file)
* [`qrl-cli receive-next-message INDEX`](#qrl-cli-receive-next-message-index)
* [`qrl-cli search SEARCH`](#qrl-cli-search-search)
* [`qrl-cli send QUANTITY`](#qrl-cli-send-quantity)
* [`qrl-cli send-initial-message FILE`](#qrl-cli-send-initial-message-file)
* [`qrl-cli send-next-message INDEX MESSAGE`](#qrl-cli-send-next-message-index-message)
* [`qrl-cli sign`](#qrl-cli-sign)
* [`qrl-cli status`](#qrl-cli-status)
* [`qrl-cli validate ADDRESS`](#qrl-cli-validate-address)
* [`qrl-cli verify ADDRESS ITEM_PER_PAGE PAGE_NUMBER`](#qrl-cli-verify-address-item_per_page-page_number)

## `qrl-cli balance ADDRESS`

Get a wallet balance from the network

```
USAGE
  $ qrl-cli balance ADDRESS

ARGUMENTS
  ADDRESS  address to return balance for

OPTIONS
  -d, --devnet             queries devnet for the balance
  -g, --grpc=grpc          advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet            queries mainnet for the balance
  -p, --password=password  wallet file password
  -q, --quanta             reports the balance in Quanta
  -s, --shor               reports the balance in Shor
  -t, --testnet            queries testnet for the balance

DESCRIPTION
  Queries the balance of the wallet.json file or address. 
  Use the (-p) flag to pass the password of encrypted wallet file.

  See the documentation at https://docs.theqrl.org/developers/qrl-cli
```

_See code: [src/commands/balance.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/balance.js)_

## `qrl-cli create-lattice`

Send lattice transaction 

```
USAGE
  $ qrl-cli create-lattice

OPTIONS
  -e, --ephemeralFile=ephemeralFile  (required) file to export ephemeral private keys
  -f, --file=file                    (required) wallet json file
  -g, --grpc=grpc                    advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -i, --otsindex=otsindex            (required) OTS key index
  -m, --mainnet                      sends Lattice transaction to mainnet
  -o, --output                       output file to save lattice private keys
  -p, --password=password            wallet file password
  -s, --ephemeralPwd=ephemeralPwd    ephemeral file password
  -t, --testnet                      sends Lattice transaction to testnet

DESCRIPTION
  To create a lattice transaction you will need to have a wallet file (see create-wallet command)
  The generated private keys will be save to the file defined with the -o command using the same password as the one for 
  the wallet

  Documentation at https://docs.theqrl.org/developers/qrl-cli
```

_See code: [src/commands/create-lattice.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/create-lattice.js)_

## `qrl-cli create-wallet`

Create a QRL address

```
USAGE
  $ qrl-cli create-wallet

OPTIONS
  -1, --sha2256            use SHA2-256 hashing mechanism
  -2, --shake128           use SHAKE-128 hashing mechanism
  -3, --shake256           use SHAKE-256 hashing mechanism
  -f, --file=file          create wallet to json file
  -h, --height=height      tree height (even numbers 4-18)
  -p, --password=password  password for encrypted wallet file

DESCRIPTION
  QRL addresses can be created with various tree height (-h) and hashing mechanisms (1-3)
  You can output to a file (-f) in JSON and encrypt with a user set password (-p).

  Documentation at https://docs.theqrl.org/developers/qrl-cli
```

_See code: [src/commands/create-wallet.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/create-wallet.js)_

## `qrl-cli decrypt`

Encrypt message using recipient public keys

```
USAGE
  $ qrl-cli decrypt

OPTIONS
  -g, --grpc=grpc  advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet    queries mainnet for the OTS state
  -t, --testnet    queries testnet for the OTS state
```

_See code: [src/commands/decrypt.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/decrypt.js)_

## `qrl-cli encrypt [ADDRESS] [ITEM_PER_PAGE] [PAGE_NUMBER] [MESSAGE]`

Encrypt message using recipient public keys

```
USAGE
  $ qrl-cli encrypt [ADDRESS] [ITEM_PER_PAGE] [PAGE_NUMBER] [MESSAGE]

ARGUMENTS
  ADDRESS        QRL wallet address to send message to
  ITEM_PER_PAGE  number of items to show per page
  PAGE_NUMBER    page number to retrieve
  MESSAGE        message to encrypt

OPTIONS
  -g, --grpc=grpc      advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -h, --txhash=txhash  tx hash of lattice transaction
  -m, --mainnet        queries mainnet for the OTS state
  -s, --string=string  message to encrypt
  -t, --testnet        queries testnet for the OTS state
```

_See code: [src/commands/encrypt.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/encrypt.js)_

## `qrl-cli get-keys ADDRESS ITEM_PER_PAGE PAGE_NUMBER`

Get Ephemeral keys associated to a QRL address

```
USAGE
  $ qrl-cli get-keys ADDRESS ITEM_PER_PAGE PAGE_NUMBER

ARGUMENTS
  ADDRESS        address to return OTS state for
  ITEM_PER_PAGE  number of items to show per page
  PAGE_NUMBER    page number to retrieve

OPTIONS
  -g, --grpc=grpc          advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet            queries mainnet for the OTS state
  -p, --password=password  wallet file password
  -t, --testnet            queries testnet for the OTS state
```

_See code: [src/commands/get-keys.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/get-keys.js)_

## `qrl-cli help [COMMAND]`

display help for qrl-cli

```
USAGE
  $ qrl-cli help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `qrl-cli ots ADDRESS`

Get a address's OTS state from the network

```
USAGE
  $ qrl-cli ots ADDRESS

ARGUMENTS
  ADDRESS  address to return OTS state for

OPTIONS
  -d, --devnet             queries devnet for the OTS state
  -g, --grpc=grpc          advanced: grpc endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet            queries mainnet for the OTS state
  -p, --password=password  wallet file password
  -t, --testnet            queries testnet for the OTS state

DESCRIPTION
  Reports the next unused available OTS key. Pass either an address starting with 
  QQ0004 or a wallet.json file to se the next OTS. You can set the network flag with either (-t) testnet or (-m) mainnet

  If the wallet file is encrypted use the -p flag to pass the wallet file encryption password.
```

_See code: [src/commands/ots.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/ots.js)_

## `qrl-cli receive ADDRESS`

Displays a QR code of the QRL address to receive a transaction

```
USAGE
  $ qrl-cli receive ADDRESS

ARGUMENTS
  ADDRESS  address to display QR code for

OPTIONS
  -p, --password=password  wallet file password

DESCRIPTION
  Prints the QRL address in both textual and QR format. Pass either an address or a wallet.json file
  If using an encrypted wallet file pass the encryption password with the (-p) flag.
```

_See code: [src/commands/receive.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/receive.js)_

## `qrl-cli receive-initial-message FILE`

Receive initial message for channel opening

```
USAGE
  $ qrl-cli receive-initial-message FILE

ARGUMENTS
  FILE  Local EMS file containing private keys

OPTIONS
  -g, --grpc=grpc          advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -h, --txhash=txhash      tx hash of lattice transaction
  -m, --mainnet            uses mainnet for this function
  -p, --password=password  EMS file password
  -s, --string=string      message to encrypt
  -t, --testnet            uses testnet for this function
```

_See code: [src/commands/receive-initial-message.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/receive-initial-message.js)_

## `qrl-cli receive-next-message INDEX`

Receive next message for channel opening

```
USAGE
  $ qrl-cli receive-next-message INDEX

ARGUMENTS
  INDEX  index of the message sent

OPTIONS
  -g, --grpc=grpc  advanced: grpc endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet    uses mainnet for this function
  -t, --testnet    uses testnet for this function
```

_See code: [src/commands/receive-next-message.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/receive-next-message.js)_

## `qrl-cli search SEARCH`

Searches for a transaction, block or address

```
USAGE
  $ qrl-cli search SEARCH

ARGUMENTS
  SEARCH  a search term: address/txhash/block to query API for

OPTIONS
  -d, --devnet     queries devnet for the address/txhash/block
  -g, --grpc=grpc  advanced: grpc endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet    queries mainnet for the address/txhash/block
  -t, --testnet    queries testnet for the address/txhash/block

DESCRIPTION
  Fetches data about queried transaction/block/address. Defaults to mainnet; network selection flags are (-m) mainnet, 
  (-t) testnet or (-d) devnet. 
  Advanced: you can use a custom defined node to query for status. Use the (-g) grpc endpoint.
```

_See code: [src/commands/search.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/search.js)_

## `qrl-cli send QUANTITY`

Send Quanta

```
USAGE
  $ qrl-cli send QUANTITY

ARGUMENTS
  QUANTITY  Number of Quanta (Shor if -s flag set) to send

OPTIONS
  -f, --fee=fee                Fee for transaction in Shor (defaults to 100 Shor)
  -g, --grpc=grpc              advanced: grpc endpoint (for devnet/custom QRL network deployments)
  -h, --hexseed=hexseed        hexseed/mnemonic of wallet from where funds should be sent
  -i, --otsindex=otsindex      (required) OTS key index
  -j, --jsonObject=jsonObject  Pass a JSON object of recipients/quantities for multi-output transactions
  -m, --mainnet                queries mainnet for the OTS state
  -p, --password=password      wallet file password
  -r, --file=file              JSON file of recipients
  -r, --recipient=recipient    QRL address of recipient
  -s, --shor                   Send in Shor
  -t, --testnet                queries testnet for the OTS state
  -w, --wallet=wallet          json file of wallet from where funds should be sent

DESCRIPTION
  ...
  TODO
```

_See code: [src/commands/send.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/send.js)_

## `qrl-cli send-initial-message FILE`

Send initial message for channel opening

```
USAGE
  $ qrl-cli send-initial-message FILE

ARGUMENTS
  FILE  Local EMS file containing private keys

OPTIONS
  -g, --grpc=grpc          advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -h, --txhash=txhash      tx hash of lattice transaction
  -m, --mainnet            queries mainnet for the OTS state
  -p, --password=password  EMS file password
  -s, --string=string      message to encrypt
  -t, --testnet            queries testnet for the OTS state
```

_See code: [src/commands/send-initial-message.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/send-initial-message.js)_

## `qrl-cli send-next-message INDEX MESSAGE`

Send initial message for channel opening

```
USAGE
  $ qrl-cli send-next-message INDEX MESSAGE

ARGUMENTS
  INDEX    index of the message sent
  MESSAGE  message to encrypt

OPTIONS
  -g, --grpc=grpc  advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet    queries mainnet for the OTS state
  -t, --testnet    queries testnet for the OTS state
```

_See code: [src/commands/send-next-message.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/send-next-message.js)_

## `qrl-cli sign`

Sign message using saved private keys

```
USAGE
  $ qrl-cli sign

OPTIONS
  -f, --file=file          (required) ephemeral file containing the private keys to use
  -g, --grpc=grpc          advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet            queries mainnet for the OTS state
  -p, --password=password  ephemeral file password
  -s, --message=message    (required) message to sign
  -t, --testnet            queries testnet for the OTS state
```

_See code: [src/commands/sign.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/sign.js)_

## `qrl-cli status`

Gets the network status

```
USAGE
  $ qrl-cli status

OPTIONS
  -d, --devnet     queries devnet for the OTS state
  -g, --grpc=grpc  advanced: grpc endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet    queries mainnet for the OTS state
  -t, --testnet    queries testnet for the OTS state

DESCRIPTION
  Reports network status from the node queried. You can select either (-m) mainnet or (-t) testnet
  Advanced: you can use a custom defined node to query for status. Use the (-g) grpc endpoint.
```

_See code: [src/commands/status.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/status.js)_

## `qrl-cli validate ADDRESS`

Validate a QRL address

```
USAGE
  $ qrl-cli validate ADDRESS

ARGUMENTS
  ADDRESS  address to validate

OPTIONS
  -q, --quiet  quiet mode: no address details, just return validity via exit code

DESCRIPTION
  ...
  when passed a QRL address in hexstring (preceded by 'Q'), will return details about the addresses validity.
```

_See code: [src/commands/validate.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/validate.js)_

## `qrl-cli verify ADDRESS ITEM_PER_PAGE PAGE_NUMBER`

Encrypt message using recipient public keys

```
USAGE
  $ qrl-cli verify ADDRESS ITEM_PER_PAGE PAGE_NUMBER

ARGUMENTS
  ADDRESS        QRL wallet address to send message to
  ITEM_PER_PAGE  number of items to show per page
  PAGE_NUMBER    page number to retrieve

OPTIONS
  -g, --grpc=grpc  advanced: grcp endpoint (for devnet/custom QRL network deployments)
  -m, --mainnet    queries mainnet for the OTS state
  -t, --testnet    queries testnet for the OTS state
```

_See code: [src/commands/verify.js](https://github.com/theqrl/qrl-cli/blob/v1.7.1/src/commands/verify.js)_
<!-- commandsstop -->
