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
    '$ tstf genIndex -o src/index.ts src/**/*.ts',
    '$ tstf genIndex -e src/**/*.test.ts -o src/index.ts -q single -v debug -w src/**/*.ts',
  ];

  public static flags = {
    help: flagsLib.help({
      char: 'h',
    }),
    exclude: flagsLib.string({
      char: 'e',
      description: 'files to exclude',
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
      options: Object.keys(LogLevel).filter((x) => !/\d/.test(x)),
      default: 'log',
    }),
  };

  // enable variable length files argument
  public static strict = false;

  public static args = [];

  public async run(): Promise<void> {
    const {
      flags: { quote, exclude, out, write, verbose },
      argv,
    } = this.parse(GenerateIndex);

    generateIndex({
      logger: new Logger(this, (LogLevel[verbose as any] as any) as LogLevel),
      filePaths: argv,
      exclude,
      singleQuote: quote === Quote.single,
      outputFile: out,
      write,
    });
  }
}
