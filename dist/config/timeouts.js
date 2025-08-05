/**
 * Configurable timeout settings for parallel execution
 */
/**
 * Default timeout configuration
 */
export const DEFAULT_TIMEOUTS = {
    // Session execution timeouts
    sessionExecution: {
        quick: 30 * 1000, // 30 seconds
        thorough: 5 * 60 * 1000, // 5 minutes
        comprehensive: 15 * 60 * 1000, // 15 minutes
    },
    // Dependency wait timeouts
    dependencyWait: {
        default: 2 * 60 * 1000, // 2 minutes
        extended: 5 * 60 * 1000, // 5 minutes
        maximum: 10 * 60 * 1000, // 10 minutes
    },
    // Progress update intervals
    progressUpdate: {
        heartbeat: 5 * 1000, // 5 seconds
        staleThreshold: 30 * 1000, // 30 seconds
    },
    // Memory cleanup intervals
    memoryCleanup: {
        interval: 5 * 60 * 1000, // 5 minutes
        retentionPeriod: 30 * 60 * 1000, // 30 minutes
    },
    // Retry configuration
    retry: {
        maxAttempts: 3,
        backoffBase: 1000, // 1 second
        backoffMultiplier: 2,
        maxBackoff: 30 * 1000, // 30 seconds
    },
    // Lock timeouts
    lock: {
        acquisition: 5 * 1000, // 5 seconds
        release: 1 * 1000, // 1 second
    },
};
/**
 * Configuration manager for timeouts
 */
export class TimeoutConfigManager {
    static instance;
    config;
    constructor() {
        this.config = { ...DEFAULT_TIMEOUTS };
    }
    static getInstance() {
        if (!TimeoutConfigManager.instance) {
            TimeoutConfigManager.instance = new TimeoutConfigManager();
        }
        return TimeoutConfigManager.instance;
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = {
            ...this.config,
            ...updates,
            sessionExecution: {
                ...this.config.sessionExecution,
                ...(updates.sessionExecution || {}),
            },
            dependencyWait: {
                ...this.config.dependencyWait,
                ...(updates.dependencyWait || {}),
            },
            progressUpdate: {
                ...this.config.progressUpdate,
                ...(updates.progressUpdate || {}),
            },
            memoryCleanup: {
                ...this.config.memoryCleanup,
                ...(updates.memoryCleanup || {}),
            },
            retry: {
                ...this.config.retry,
                ...(updates.retry || {}),
            },
            lock: {
                ...this.config.lock,
                ...(updates.lock || {}),
            },
        };
    }
    /**
     * Reset to defaults
     */
    reset() {
        this.config = { ...DEFAULT_TIMEOUTS };
    }
    /**
     * Get timeout for session based on estimated time
     */
    getSessionTimeout(estimatedTime) {
        return this.config.sessionExecution[estimatedTime];
    }
    /**
     * Calculate retry backoff
     */
    calculateBackoff(attemptNumber) {
        const { backoffBase, backoffMultiplier, maxBackoff } = this.config.retry;
        const backoff = backoffBase * Math.pow(backoffMultiplier, attemptNumber - 1);
        return Math.min(backoff, maxBackoff);
    }
    /**
     * Check if should retry
     */
    shouldRetry(attemptCount) {
        return attemptCount < this.config.retry.maxAttempts;
    }
}
/**
 * Load configuration from environment variables
 */
export function loadTimeoutConfigFromEnv() {
    const config = {};
    // Session execution timeouts
    if (process.env.CREATIVE_THINKING_SESSION_TIMEOUT_QUICK) {
        if (!config.sessionExecution) {
            config.sessionExecution = { ...DEFAULT_TIMEOUTS.sessionExecution };
        }
        config.sessionExecution.quick = parseInt(process.env.CREATIVE_THINKING_SESSION_TIMEOUT_QUICK, 10);
    }
    if (process.env.CREATIVE_THINKING_SESSION_TIMEOUT_THOROUGH) {
        if (!config.sessionExecution) {
            config.sessionExecution = { ...DEFAULT_TIMEOUTS.sessionExecution };
        }
        config.sessionExecution.thorough = parseInt(process.env.CREATIVE_THINKING_SESSION_TIMEOUT_THOROUGH, 10);
    }
    if (process.env.CREATIVE_THINKING_SESSION_TIMEOUT_COMPREHENSIVE) {
        if (!config.sessionExecution) {
            config.sessionExecution = { ...DEFAULT_TIMEOUTS.sessionExecution };
        }
        config.sessionExecution.comprehensive = parseInt(process.env.CREATIVE_THINKING_SESSION_TIMEOUT_COMPREHENSIVE, 10);
    }
    // Dependency wait timeouts
    if (process.env.CREATIVE_THINKING_DEPENDENCY_TIMEOUT) {
        if (!config.dependencyWait) {
            config.dependencyWait = { ...DEFAULT_TIMEOUTS.dependencyWait };
        }
        config.dependencyWait.default = parseInt(process.env.CREATIVE_THINKING_DEPENDENCY_TIMEOUT, 10);
    }
    // Memory cleanup
    if (process.env.CREATIVE_THINKING_CLEANUP_INTERVAL) {
        if (!config.memoryCleanup) {
            config.memoryCleanup = { ...DEFAULT_TIMEOUTS.memoryCleanup };
        }
        config.memoryCleanup.interval = parseInt(process.env.CREATIVE_THINKING_CLEANUP_INTERVAL, 10);
    }
    if (process.env.CREATIVE_THINKING_RETENTION_PERIOD) {
        if (!config.memoryCleanup) {
            config.memoryCleanup = { ...DEFAULT_TIMEOUTS.memoryCleanup };
        }
        config.memoryCleanup.retentionPeriod = parseInt(process.env.CREATIVE_THINKING_RETENTION_PERIOD, 10);
    }
    // Retry configuration
    if (process.env.CREATIVE_THINKING_MAX_RETRIES) {
        if (!config.retry) {
            config.retry = { ...DEFAULT_TIMEOUTS.retry };
        }
        config.retry.maxAttempts = parseInt(process.env.CREATIVE_THINKING_MAX_RETRIES, 10);
    }
    return config;
}
//# sourceMappingURL=timeouts.js.map