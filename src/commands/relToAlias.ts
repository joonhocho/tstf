import { Command, flags as flagsLib } from '@oclif/command';
import { resolve } from 'path';
import { Logger, LogLevel } from '../logger';
import { transformRelToAlias } from '../transformRelToAlias';

export enum Quote {
  single = 's',
  double = 'd',
}

export default class RelativeToAliasPaths extends Command {
  public static description =
    'transform relative paths to alias paths according to tsconfig.compilerOptions.paths';

  public static examples = [
    '$ tstf relToAlias -p tsconfig.json',
    '$ tstf relToAlias -p tsconfig.json -q s -w -v',
  ];

  public static flags = {
    help: flagsLib.help({
      char: 'h',
    }),
    project: flagsLib.string({
      char: 'p',
      description: 'path to tsconfig.json',
      default: 'tsconfig.json',
      required: true,
    }),
    quote: flagsLib.string({
      char: 'q',
      description: 'whether to use single or double quote. default is d(ouble)',
      options: Object.values(Quote),
      default: Quote.double,
    }),
    write: flagsLib.boolean({
      char: 'w',
      description: 'whether to write to source files',
    }),
    verbose: flagsLib.string({
      char: 'v',
      description: 'verbose = debug | log (default) | warn | error',
      options: Object.keys(LogLevel),
    }),
  };

  public static args = [];

  public async run(): Promise<void> {
    const {
      flags: { project, quote, write, verbose },
    } = this.parse(RelativeToAliasPaths);

    transformRelToAlias({
      logger: new Logger(this, (LogLevel[verbose as any] as any) as LogLevel),
      configFileName: resolve(process.cwd(), project),
      singleQuote: quote === Quote.single,
      write,
    });
  }
}
