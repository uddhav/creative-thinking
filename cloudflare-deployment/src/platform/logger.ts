/**
 * Platform logger shim
 *
 * Drop-in replacement for the main `src/utils/Logger.ts` singleton used
 * throughout the ported codebase. In Workers there is no `process.stderr`,
 * so all output goes to `console.error` / `console.log`.
 *
 * Also provides the `logger` singleton expected by modules like
 * `personas/catalog.ts` and `personas/DebateOrchestrator.ts`.
 */

import { getEnv } from './env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class PlatformLogger {
  private level: number;
  private environment: string;

  constructor() {
    const levelName = (getEnv('LOG_LEVEL') as LogLevel | undefined) ?? 'info';
    this.level = LEVELS[levelName] ?? LEVELS.info;
    this.environment = getEnv('ENVIRONMENT') ?? 'production';
  }

  /**
   * Refresh level/environment from env bindings.
   * Called by `initPlatform()` after env is wired.
   */
  refresh(): void {
    const levelName = (getEnv('LOG_LEVEL') as LogLevel | undefined) ?? 'info';
    this.level = LEVELS[levelName] ?? LEVELS.info;
    this.environment = getEnv('ENVIRONMENT') ?? 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors by default.
    if (this.environment === 'production' && this.level < LEVELS.warn) {
      return LEVELS[level] >= LEVELS.warn;
    }
    return LEVELS[level] >= this.level;
  }

  private format(level: LogLevel, message: string): string {
    const ts = new Date().toISOString();
    return `${ts} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;
    if (args.length > 0) console.log(this.format('debug', message), ...args);
    else console.log(this.format('debug', message));
  }

  info(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;
    if (args.length > 0) console.log(this.format('info', message), ...args);
    else console.log(this.format('info', message));
  }

  warn(message: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;
    if (args.length > 0) console.warn(this.format('warn', message), ...args);
    else console.warn(this.format('warn', message));
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (!this.shouldLog('error')) return;
    const payload: unknown[] = [];
    if (error !== undefined) payload.push(error);
    if (args.length > 0) payload.push(...args);
    if (payload.length > 0) console.error(this.format('error', message), ...payload);
    else console.error(this.format('error', message));
  }

  /**
   * Create a child logger with a prefix.
   * Matches the API of main `src/utils/Logger.ts`.
   */
  child(prefix: string): PlatformLogger {
    const c = new PlatformLogger();
    const originalFormat = c['format'].bind(c);
    c['format'] = (level: LogLevel, message: string) =>
      originalFormat(level, `[${prefix}] ${message}`);
    return c;
  }
}

/**
 * Singleton instance matching the main `src/utils/Logger.ts` export.
 * Modules in the ported codebase do `import { logger } from '../utils/Logger.js'`.
 */
export const logger = new PlatformLogger();

/**
 * Re-export as `Logger` to satisfy default-class imports.
 */
export { PlatformLogger as Logger };

/**
 * Called by `initPlatform()` after env bindings are set.
 */
export function refreshPlatformLogger(): void {
  logger.refresh();
}
