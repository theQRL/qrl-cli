qrl-cli
=======

QRL CLI functions

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@theqrl/cli.svg)](https://npmjs.org/package/@theqrl/cli)
[![CircleCI](https://circleci.com/gh/theQRL/qrl-cli.svg?style=svg)](https://circleci.com/gh/theQRL/qrl-cli)
[![codecov](https://codecov.io/gh/theQRL/qrl-cli/branch/master/graph/badge.svg)](https://codecov.io/gh/theQRL/qrl-cli)
[![License](https://img.shields.io/npm/l/@theqrl/cli.svg)](https://github.com/theqrl/qrl-cli/blob/master/package.json)

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
@theqrl/cli/0.0.2 darwin-x64 node-v8.11.3
$ qrl-cli --help [COMMAND]
USAGE
  $ qrl-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`qrl-cli create-wallet`](#qrl-cli-create-wallet)
* [`qrl-cli help [COMMAND]`](#qrl-cli-help-command)
* [`qrl-cli validate ADDRESS`](#qrl-cli-validate-address)

## `qrl-cli create-wallet`

Create a QRL address

```
USAGE
  $ qrl-cli create-wallet

OPTIONS
  -1, --sha2256            use SHA2-256 hashing machanism
  -2, --shake128           use SHAKE-128 hashing machanism
  -3, --shake256           use SHAKE-256 hashing machanism
  -f, --file=file          create wallet to json file
  -h, --height=height      tree height (even numbers 4-18)
  -p, --password=password  password for encrypted wallet file

DESCRIPTION
  ...
  TODO
```

_See code: [src/commands/create-wallet.js](https://github.com/theqrl/qrl-cli/blob/v0.0.2/src/commands/create-wallet.js)_

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

_See code: [src/commands/validate.js](https://github.com/theqrl/qrl-cli/blob/v0.0.2/src/commands/validate.js)_
<!-- commandsstop -->
