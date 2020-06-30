import { Command, flags as flagsLib } from '@oclif/command';
import { resolve } from 'path';
import { Logger, LogLevel } from '../logger';
import { transformRelToAlias } from '../transformRelToAlias';

export enum Quote {
  single = 'single',
  double = 'double',
}

export default class RelativeToAliasPaths extends Command {
  public static description =
    'transform relative paths to alias paths according to tsconfig.compilerOptions.paths';

  public static examples = [
    '$ tstf relToAlias',
    '$ tstf relToAlias -p ./path/to/tsconfig.json -q single -w -v debug',
  ];

  public static flags: flagsLib.Input<any> = {
    help: flagsLib.help({
      char: 'h',
    }),
    project: flagsLib.string({
      char: 'p',
      description: 'path to tsconfig.json',
      default: 'tsconfig.json',
    }),
    quote: flagsLib.string({
      char: 'q',
      description: 'whether to use single or double quote',
      options: Object.values(Quote),
      default: Quote.double,
    }),
    write: flagsLib.boolean({
      char: 'w',
      description: 'whether to save changes to source files',
    }),
    verbose: flagsLib.string({
      char: 'v',
      description: 'logging verbosity',
      options: Object.keys(LogLevel).filter((x): boolean => !/\d/.test(x)),
      default: 'log',
    }),
  };

  public static args = [];

  public async run(): Promise<void> {
    const {
      flags: { project, quote, write, verbose },
    } = this.parse(RelativeToAliasPaths);

    transformRelToAlias({
      logger: new Logger(this, (LogLevel[verbose as any] as any) as LogLevel),
      configFileName: resolve(process.cwd(), project!),
      singleQuote: quote === Quote.single,
      write,
    });
  }
}
