/**
 * Configuration types for parallel execution
 */
/**
 * Default configurations
 */
export const DEFAULT_PARTIAL_COMPLETION_CONFIG = {
    criticalSessionThreshold: 0.3,
    minimumCompletionRate: 0.5,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
};
export const DEFAULT_SYNCHRONIZER_CONFIG = {
    maxBatchSize: 10,
    batchIntervalMs: 500,
    errorStrategy: 'continue',
    maxInsights: 1000,
    maxThemes: 100,
};
export const DEFAULT_GROUP_MANAGER_CONFIG = {
    groupTTLMs: 86400000, // 24 hours
    maxConcurrentSessions: 10,
    sessionTimeoutMs: 300000, // 5 minutes
    completionTimeBuffer: 0.1,
    enableProgressLogging: false,
};
export const DEFAULT_SESSION_INDEX_CONFIG = {
    enableDependencyCaching: true,
    dependencyCacheTTLMs: 60000, // 1 minute
    maxDependencyDepth: 100,
    enablePerformanceMonitoring: false,
};
export const DEFAULT_PROGRESS_TRACKER_CONFIG = {
    progressUpdateIntervalMs: 1000,
    milestoneThresholds: [0.25, 0.5, 0.75, 1.0],
    enableDetailedMetrics: false,
    maxProgressHistory: 100,
};
/**
 * Helper function to merge configurations with defaults
 */
export function mergeConfig(partial, defaults) {
    if (!partial) {
        return defaults;
    }
    return { ...defaults, ...partial };
}
//# sourceMappingURL=parallel-config.js.map