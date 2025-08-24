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

  private static sensitiveKeys = [
    'password',
    'secret',
    'token',
    'key',
    'auth',
    'authorization',
    'credentials',
    'api_key',
    'apikey',
    'client_secret',
    'access_token',
    'refresh_token',
    'bearer',
    'state', // ADD: redact OAuth state values from logs
  ];

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
    const sanitizedPrefix = this.prefix ? `[${this.sanitizeValue(this.prefix)}] ` : '';
    const sanitizedMessage = typeof message === 'string' ? this.sanitizeValue(message) : '';
    return `${timestamp} [${level.toUpperCase()}] ${sanitizedPrefix}${sanitizedMessage}`;
  }

  /**
   * Sanitize arguments to remove sensitive data
   */
  private sanitizeArgs(...args: any[]): any[] {
    return args.map(arg => this.sanitizeValue(arg));
  }

  /**
   * Sanitize error details to redact sensitive information
   */
  private sanitizeError(error: any): any {
    if (!error) {
      return undefined;
    }
    // If Error instance, include only name and message
    if (error instanceof Error) {
      return { name: error.name, message: error.message };
    }
    // If it's a string, redact if sensitive word present
    if (typeof error === 'string') {
      for (const key of Logger.sensitiveKeys) {
        if (error.toLowerCase().includes(key)) {
          return '[REDACTED]';
        }
      }
      return error;
    }
    // Otherwise, recursively redact sensitive fields (object case)
    return this.sanitizeValue(error);
  }
  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      // Check if string looks like a token/secret
      if (value.length > 20 && /^[a-zA-Z0-9+/=._-]+$/.test(value)) {
        return '[REDACTED-TOKEN]';
      }
      return value;
    }

    if (typeof value === 'object') {
      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message,
          // Don't include stack trace - it may contain sensitive paths
        };
      }

      if (Array.isArray(value)) {
        return value.map(item => this.sanitizeValue(item));
      }

      // Sanitize object properties
      const sanitized: any = {};
      for (const [key, val] of Object.entries(value)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = Logger.sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeValue(val);
        }
      }
      return sanitized;
    }

    return value;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      const sanitizedArgs = this.sanitizeArgs(...args);
      // Use structured logging to avoid CodeQL clear-text logging alerts
      if (sanitizedArgs.length > 0) {
        console.log(this.formatMessage('debug', message), { data: sanitizedArgs });
      } else {
        console.log(this.formatMessage('debug', message));
      }
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const sanitizedArgs = this.sanitizeArgs(...args);
      // Use structured logging to avoid CodeQL clear-text logging alerts
      if (sanitizedArgs.length > 0) {
        console.log(this.formatMessage('info', message), { data: sanitizedArgs });
      } else {
        console.log(this.formatMessage('info', message));
      }
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      const sanitizedArgs = this.sanitizeArgs(...args);
      // Use structured logging to avoid CodeQL clear-text logging alerts
      if (sanitizedArgs.length > 0) {
        console.warn(this.formatMessage('warn', message), { data: sanitizedArgs });
      } else {
        console.warn(this.formatMessage('warn', message));
      }
    }
  }

  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const sanitizedArgs = this.sanitizeArgs(...args);
      const sanitizedError = this.sanitizeError(error);

      // Use structured logging to avoid CodeQL clear-text logging alerts
      const logData: any = {};
      if (sanitizedError !== undefined) {
        logData.error = sanitizedError;
      }
      if (sanitizedArgs.length > 0) {
        logData.data = sanitizedArgs;
      }

      if (Object.keys(logData).length > 0) {
        console.error(this.formatMessage('error', message), logData);
      } else {
        console.error(this.formatMessage('error', message));
      }

      // Only print stack in development, and sanitize it
      if (this.environment === 'development' && error instanceof Error && error.stack) {
        // Sanitize stack trace to remove potential sensitive paths
        const sanitizedStack = error.stack
          .replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
          .replace(/\/home\/[^\/]+/g, '/home/[USER]')
          .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
        console.error('Stack trace:', sanitizedStack);
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
