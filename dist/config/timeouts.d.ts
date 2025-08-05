/**
 * Configurable timeout settings for parallel execution
 */
/**
 * Default timeout configuration
 */
export declare const DEFAULT_TIMEOUTS: {
    readonly sessionExecution: {
        readonly quick: number;
        readonly thorough: number;
        readonly comprehensive: number;
    };
    readonly dependencyWait: {
        readonly default: number;
        readonly extended: number;
        readonly maximum: number;
    };
    readonly progressUpdate: {
        readonly heartbeat: number;
        readonly staleThreshold: number;
    };
    readonly memoryCleanup: {
        readonly interval: number;
        readonly retentionPeriod: number;
    };
    readonly retry: {
        readonly maxAttempts: 3;
        readonly backoffBase: 1000;
        readonly backoffMultiplier: 2;
        readonly maxBackoff: number;
    };
    readonly lock: {
        readonly acquisition: number;
        readonly release: number;
    };
};
/**
 * Timeout configuration interface
 */
export interface TimeoutConfig {
    sessionExecution: {
        quick: number;
        thorough: number;
        comprehensive: number;
    };
    dependencyWait: {
        default: number;
        extended: number;
        maximum: number;
    };
    progressUpdate: {
        heartbeat: number;
        staleThreshold: number;
    };
    memoryCleanup: {
        interval: number;
        retentionPeriod: number;
    };
    retry: {
        maxAttempts: number;
        backoffBase: number;
        backoffMultiplier: number;
        maxBackoff: number;
    };
    lock: {
        acquisition: number;
        release: number;
    };
}
/**
 * Configuration manager for timeouts
 */
export declare class TimeoutConfigManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): TimeoutConfigManager;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<TimeoutConfig>;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<TimeoutConfig>): void;
    /**
     * Reset to defaults
     */
    reset(): void;
    /**
     * Get timeout for session based on estimated time
     */
    getSessionTimeout(estimatedTime: 'quick' | 'thorough' | 'comprehensive'): number;
    /**
     * Calculate retry backoff
     */
    calculateBackoff(attemptNumber: number): number;
    /**
     * Check if should retry
     */
    shouldRetry(attemptCount: number): boolean;
}
/**
 * Load configuration from environment variables
 */
export declare function loadTimeoutConfigFromEnv(): Partial<TimeoutConfig>;
//# sourceMappingURL=timeouts.d.ts.map