/**
 * Logger utility for controlled debug output
 * Ensures MCP protocol compliance by using stderr
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (LogLevel = {}));
export class Logger {
    static instance;
    level;
    prefix;
    enableTimestamp;
    static childInstances = new Map();
    constructor(config) {
        // Determine log level from environment
        const envLevel = process.env.LOG_LEVEL?.toUpperCase();
        const envDebug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
        const isDevelopment = process.env.NODE_ENV === 'development';
        // Set default level based on environment
        let defaultLevel = LogLevel.NONE;
        if (envLevel && LogLevel[envLevel] !== undefined) {
            defaultLevel = LogLevel[envLevel];
        }
        else if (envDebug || isDevelopment) {
            defaultLevel = LogLevel.DEBUG;
        }
        this.level = config?.level ?? defaultLevel;
        this.prefix = config?.prefix ?? '[Creative-Thinking]';
        this.enableTimestamp = config?.enableTimestamp ?? true;
    }
    static getInstance(config) {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    static configure(config) {
        const instance = Logger.getInstance();
        if (config.level !== undefined)
            instance.level = config.level;
        if (config.prefix !== undefined)
            instance.prefix = config.prefix;
        if (config.enableTimestamp !== undefined)
            instance.enableTimestamp = config.enableTimestamp;
    }
    formatMessage(level, message, data, prefix) {
        const parts = [];
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
    log(level, levelName, message, data, prefix) {
        if (this.level <= level) {
            // Always use stderr to maintain MCP protocol compliance
            process.stderr.write(this.formatMessage(levelName, message, data, prefix) + '\n');
        }
    }
    debug(message, data) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, data);
    }
    info(message, data) {
        this.log(LogLevel.INFO, 'INFO', message, data);
    }
    warn(message, data) {
        this.log(LogLevel.WARN, 'WARN', message, data);
    }
    error(message, data) {
        this.log(LogLevel.ERROR, 'ERROR', message, data);
    }
    // Conditional logging based on environment
    debugConditional(condition, message, data) {
        if (condition) {
            this.debug(message, data);
        }
    }
    // Performance logging helper
    logPerformance(operation, duration, threshold = 1000) {
        if (duration > threshold) {
            this.warn(`Slow operation: ${operation}`, {
                duration: `${duration}ms`,
                threshold: `${threshold}ms`,
            });
        }
        else {
            this.debug(`Operation completed: ${operation}`, { duration: `${duration}ms` });
        }
    }
    // Create a child logger with a specific prefix
    createChild(childPrefix) {
        // Create a proxy object that behaves like a Logger but with a different prefix
        const childPrefix_ = `${this.prefix} ${childPrefix}`;
        // Use arrow functions to maintain this context
        return {
            debug: (message, data) => {
                this.log(LogLevel.DEBUG, 'DEBUG', message, data, childPrefix_);
            },
            info: (message, data) => {
                this.log(LogLevel.INFO, 'INFO', message, data, childPrefix_);
            },
            warn: (message, data) => {
                this.log(LogLevel.WARN, 'WARN', message, data, childPrefix_);
            },
            error: (message, data) => {
                this.log(LogLevel.ERROR, 'ERROR', message, data, childPrefix_);
            },
            debugConditional: (condition, message, data) => {
                if (condition) {
                    this.log(LogLevel.DEBUG, 'DEBUG', message, data, childPrefix_);
                }
            },
            logPerformance: (operation, duration, threshold = 1000) => {
                if (duration > threshold) {
                    this.log(LogLevel.WARN, 'WARN', `Slow operation: ${operation}`, {
                        duration: `${duration}ms`,
                        threshold: `${threshold}ms`,
                    }, childPrefix_);
                }
                else {
                    this.log(LogLevel.DEBUG, 'DEBUG', `Operation completed: ${operation}`, { duration: `${duration}ms` }, childPrefix_);
                }
            },
            createChild: (childPrefixNested) => {
                return this.createChild(`${childPrefix} ${childPrefixNested}`);
            },
        };
    }
}
// Export singleton instance for convenience
export const logger = Logger.getInstance();
//# sourceMappingURL=Logger.js.map