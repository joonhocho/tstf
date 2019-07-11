tstf
====

CLI tools for useful TypeScript code transformations such as paths transforms

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/tstf.svg)](https://npmjs.org/package/tstf)
[![Downloads/week](https://img.shields.io/npm/dw/tstf.svg)](https://npmjs.org/package/tstf)
[![License](https://img.shields.io/npm/l/tstf.svg)](https://github.com/joonhocho/tstf/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g tstf
$ tstf COMMAND
running command...
$ tstf (-v|--version|version)
tstf/0.0.12 darwin-x64 node-v11.10.0
$ tstf --help [COMMAND]
USAGE
  $ tstf COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tstf genIndex`](#tstf-genindex)
* [`tstf help [COMMAND]`](#tstf-help-command)
* [`tstf relToAlias`](#tstf-reltoalias)

## `tstf genIndex`

generate index.ts file for all exported modules

```
USAGE
  $ tstf genIndex

OPTIONS
  -e, --exclude=exclude               files to exclude
  -h, --help                          show CLI help
  -o, --out=out                       (required) path to output file
  -q, --quote=single|double           [default: double] whether to use single or double quote
  -s, --src=src                       path to source files
  -v, --verbose=debug|log|warn|error  [default: log] logging verbosity
  -w, --write                         whether to write to output file

EXAMPLES
  $ tstf genIndex -o src/index.ts
  $ tstf genIndex -s src/**/*.ts -e src/**/*.test.ts -o src/exports.ts -q single -v debug -w
```

_See code: [dist/node/commands/genIndex.ts](https://github.com/joonhocho/tstf/blob/v0.0.12/dist/node/commands/genIndex.ts)_

## `tstf help [COMMAND]`

display help for tstf

```
USAGE
  $ tstf help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.0/src/commands/help.ts)_

## `tstf relToAlias`

transform relative paths to alias paths according to tsconfig.compilerOptions.paths

```
USAGE
  $ tstf relToAlias

OPTIONS
  -h, --help                          show CLI help
  -p, --project=project               [default: tsconfig.json] path to tsconfig.json
  -q, --quote=single|double           [default: double] whether to use single or double quote
  -v, --verbose=debug|log|warn|error  [default: log] logging verbosity
  -w, --write                         whether to save changes to source files

EXAMPLES
  $ tstf relToAlias
  $ tstf relToAlias -p ./path/to/tsconfig.json -q single -w -v debug
```

_See code: [dist/node/commands/relToAlias.ts](https://github.com/joonhocho/tstf/blob/v0.0.12/dist/node/commands/relToAlias.ts)_
<!-- commandsstop -->
