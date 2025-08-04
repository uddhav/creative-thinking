/**
 * Logger utility for controlled debug output
 * Ensures MCP protocol compliance by using stderr
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel;
  private prefix: string;
  private enableTimestamp: boolean;
  private static childInstances: Map<string, Logger> = new Map();

  private constructor(config?: Partial<LoggerConfig>) {
    // Determine log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    const envDebug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Set default level based on environment
    let defaultLevel = LogLevel.NONE;
    if (envLevel && LogLevel[envLevel as keyof typeof LogLevel] !== undefined) {
      defaultLevel = LogLevel[envLevel as keyof typeof LogLevel];
    } else if (envDebug || isDevelopment) {
      defaultLevel = LogLevel.DEBUG;
    }

    this.level = config?.level ?? defaultLevel;
    this.prefix = config?.prefix ?? '[Creative-Thinking]';
    this.enableTimestamp = config?.enableTimestamp ?? true;
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  static configure(config: Partial<LoggerConfig>): void {
    const instance = Logger.getInstance();
    if (config.level !== undefined) instance.level = config.level;
    if (config.prefix !== undefined) instance.prefix = config.prefix;
    if (config.enableTimestamp !== undefined) instance.enableTimestamp = config.enableTimestamp;
  }

  private formatMessage(level: string, message: string, data?: unknown, prefix?: string): string {
    const parts: string[] = [];

    if (this.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(prefix || this.prefix);
    parts.push(`[${level}]`);
    parts.push(message);

    if (data !== undefined) {
      parts.push(JSON.stringify(data, null, 2));
    }

    return parts.join(' ');
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    data?: unknown,
    prefix?: string
  ): void {
    if (this.level <= level) {
      // Always use stderr to maintain MCP protocol compliance
      process.stderr.write(this.formatMessage(levelName, message, data, prefix) + '\n');
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data);
  }

  // Conditional logging based on environment
  debugConditional(condition: boolean, message: string, data?: unknown): void {
    if (condition) {
      this.debug(message, data);
    }
  }

  // Performance logging helper
  logPerformance(operation: string, duration: number, threshold = 1000): void {
    if (duration > threshold) {
      this.warn(`Slow operation: ${operation}`, {
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
      });
    } else {
      this.debug(`Operation completed: ${operation}`, { duration: `${duration}ms` });
    }
  }

  // Create a child logger with a specific prefix
  createChild(childPrefix: string): Logger {
    // Create a proxy object that behaves like a Logger but with a different prefix
    const childPrefix_ = `${this.prefix} ${childPrefix}`;
    // Use arrow functions to maintain this context

    return {
      debug: (message: string, data?: unknown): void => {
        this.log(LogLevel.DEBUG, 'DEBUG', message, data, childPrefix_);
      },
      info: (message: string, data?: unknown): void => {
        this.log(LogLevel.INFO, 'INFO', message, data, childPrefix_);
      },
      warn: (message: string, data?: unknown): void => {
        this.log(LogLevel.WARN, 'WARN', message, data, childPrefix_);
      },
      error: (message: string, data?: unknown): void => {
        this.log(LogLevel.ERROR, 'ERROR', message, data, childPrefix_);
      },
      debugConditional: (condition: boolean, message: string, data?: unknown): void => {
        if (condition) {
          this.log(LogLevel.DEBUG, 'DEBUG', message, data, childPrefix_);
        }
      },
      logPerformance: (operation: string, duration: number, threshold = 1000): void => {
        if (duration > threshold) {
          this.log(
            LogLevel.WARN,
            'WARN',
            `Slow operation: ${operation}`,
            {
              duration: `${duration}ms`,
              threshold: `${threshold}ms`,
            },
            childPrefix_
          );
        } else {
          this.log(
            LogLevel.DEBUG,
            'DEBUG',
            `Operation completed: ${operation}`,
            { duration: `${duration}ms` },
            childPrefix_
          );
        }
      },
      createChild: (childPrefixNested: string): Logger => {
        return this.createChild(`${childPrefix} ${childPrefixNested}`);
      },
    } as Logger;
  }
}

// Export singleton instance for convenience
export const logger = Logger.getInstance();
