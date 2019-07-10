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
tstf/0.0.1 darwin-x64 node-v11.10.0
$ tstf --help [COMMAND]
USAGE
  $ tstf COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tstf hello [FILE]`](#tstf-hello-file)
* [`tstf help [COMMAND]`](#tstf-help-command)

## `tstf hello [FILE]`

describe the command here

```
USAGE
  $ tstf hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ tstf hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/joonhocho/tstf/blob/v0.0.1/src/commands/hello.ts)_

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
<!-- commandsstop -->
