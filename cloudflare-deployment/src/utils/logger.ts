/**
 * Logger utility that respects environment variables
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  environment: string;
  prefix?: string;
}

export class Logger {
  private static levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private level: number;
  private environment: string;
  private prefix: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    const level = config.level || (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.level = Logger.levels[level] ?? Logger.levels.info;
    this.environment = config.environment || process.env.ENVIRONMENT || 'production';
    this.prefix = config.prefix || '';
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors by default
    if (this.environment === 'production' && this.level < Logger.levels.warn) {
      return Logger.levels[level] >= Logger.levels.warn;
    }
    return Logger.levels[level] >= this.level;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}] ` : '';
    return `${timestamp} [${level.toUpperCase()}] ${prefixStr}${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(this.formatMessage('error', message), error.message, ...args);
        if (this.environment === 'development' && error.stack) {
          console.error(error.stack);
        }
      } else if (error) {
        console.error(this.formatMessage('error', message), error, ...args);
      } else {
        console.error(this.formatMessage('error', message), ...args);
      }
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      level: Object.keys(Logger.levels).find(
        key => Logger.levels[key as LogLevel] === this.level
      ) as LogLevel,
      environment: this.environment,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
    });
  }
}

/**
 * Create a logger instance for Cloudflare Workers environment
 */
export function createLogger(
  env: { ENVIRONMENT?: string; LOG_LEVEL?: string },
  prefix?: string
): Logger {
  return new Logger({
    level: (env.LOG_LEVEL as LogLevel) || 'info',
    environment: env.ENVIRONMENT || 'production',
    prefix,
  });
}
