import { Command } from '@oclif/command';

export enum LogLevel {
  debug = 0,
  log = 1,
  warn = 2,
  error = 3,
}

export class Logger implements Pick<Command, 'log' | 'error' | 'warn'> {
  public error: Command['error'] = ((...args: any): any => {
    if (this.logLevel <= LogLevel.error) {
      (this.command.error as any)(...(args as any));
    }
  }) as any;

  constructor(public command: Command, public logLevel: LogLevel) {}

  public debug: Command['log'] = (...args): void => {
    if (this.logLevel <= LogLevel.debug) {
      this.command.log(...args);
    }
  };

  public log: Command['log'] = (...args): void => {
    if (this.logLevel <= LogLevel.log) {
      this.command.log(...args);
    }
  };

  public warn: Command['warn'] = (...args): void => {
    if (this.logLevel <= LogLevel.warn) {
      this.command.warn(...args);
    }
  };
}
