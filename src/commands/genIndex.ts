import { Command, flags as flagsLib } from '@oclif/command';
import { generateIndex } from '../generateIndex';
import { Logger, LogLevel } from '../logger';

export enum Quote {
  single = 'single',
  double = 'double',
}

export default class GenerateIndex extends Command {
  public static description = 'generate index.ts file for all exported modules';

  public static examples = [
    '$ tstf genIndex -o src/index.ts',
    '$ tstf genIndex -s src/**/*.ts -e src/**/*.test.ts -o src/exports.ts -q single -v debug -w',
  ];

  public static flags: flagsLib.Input<any> = {
    help: flagsLib.help({
      char: 'h',
    }),
    src: flagsLib.string({
      char: 's',
      description: 'path to source files',
      multiple: true,
    }),
    exclude: flagsLib.string({
      char: 'e',
      description: 'files to exclude',
      multiple: true,
    }),
    out: flagsLib.string({
      char: 'o',
      description: 'path to output file',
      required: true,
    }),
    write: flagsLib.boolean({
      char: 'w',
      description: 'whether to write to output file',
    }),
    quote: flagsLib.string({
      char: 'q',
      description: 'whether to use single or double quote',
      options: Object.values(Quote),
      default: Quote.double,
    }),
    verbose: flagsLib.string({
      char: 'v',
      description: 'logging verbosity',
      options: Object.keys(LogLevel).filter((x): boolean => !/\d/.test(x)),
      default: 'log',
    }),
  };

  public static strict = false;

  public static args = [];

  public async run(): Promise<void> {
    const {
      flags: { quote, exclude, src, out, write, verbose },
    } = this.parse(GenerateIndex);

    return generateIndex({
      logger: new Logger(this, (LogLevel[verbose as any] as any) as LogLevel),
      src,
      exclude,
      out,
      write,
      singleQuote: quote === Quote.single,
    });
  }
}
