/**
 * Logger utility for controlled debug output
 * Ensures MCP protocol compliance by using stderr
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
export interface LoggerConfig {
    level: LogLevel;
    prefix?: string;
    enableTimestamp?: boolean;
}
export declare class Logger {
    private static instance;
    private level;
    private prefix;
    private enableTimestamp;
    private static childInstances;
    private constructor();
    static getInstance(config?: Partial<LoggerConfig>): Logger;
    static configure(config: Partial<LoggerConfig>): void;
    private formatMessage;
    private log;
    debug(message: string, data?: unknown): void;
    info(message: string, data?: unknown): void;
    warn(message: string, data?: unknown): void;
    error(message: string, data?: unknown): void;
    debugConditional(condition: boolean, message: string, data?: unknown): void;
    logPerformance(operation: string, duration: number, threshold?: number): void;
    createChild(childPrefix: string): Logger;
}
export declare const logger: Logger;
//# sourceMappingURL=Logger.d.ts.map