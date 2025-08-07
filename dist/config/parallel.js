/**
 * Internal Execution Configuration
 * Configuration for internal execution behavior of the creative thinking server
 */
/**
 * Default configuration for internal execution
 */
export const defaultExecutionConfig = {
    maxConcurrentOperations: 5,
    operationTimeoutMs: 30000,
    syncStrategy: 'checkpoint',
    enforceWorkflowValidation: true,
    autoGroupTechniques: true,
    maxTechniquesPerGroup: 5,
};
/**
 * Load execution configuration from environment variables
 */
export function loadParallelConfig() {
    const config = { ...defaultExecutionConfig };
    // Load from environment variables
    if (process.env.CREATIVE_THINKING_MAX_CONCURRENT_OPS) {
        const maxOps = parseInt(process.env.CREATIVE_THINKING_MAX_CONCURRENT_OPS, 10);
        if (!isNaN(maxOps) && maxOps > 0) {
            config.maxConcurrentOperations = maxOps;
        }
    }
    if (process.env.CREATIVE_THINKING_OPERATION_TIMEOUT_MS) {
        const timeout = parseInt(process.env.CREATIVE_THINKING_OPERATION_TIMEOUT_MS, 10);
        if (!isNaN(timeout) && timeout > 0) {
            config.operationTimeoutMs = timeout;
        }
    }
    if (process.env.CREATIVE_THINKING_SYNC_STRATEGY) {
        const strategy = process.env.CREATIVE_THINKING_SYNC_STRATEGY;
        if (strategy === 'checkpoint' || strategy === 'immediate' || strategy === 'batch') {
            config.syncStrategy = strategy;
        }
    }
    if (process.env.CREATIVE_THINKING_WORKFLOW_VALIDATION !== undefined) {
        config.enforceWorkflowValidation =
            process.env.CREATIVE_THINKING_WORKFLOW_VALIDATION !== 'false';
    }
    if (process.env.CREATIVE_THINKING_AUTO_GROUP !== undefined) {
        config.autoGroupTechniques = process.env.CREATIVE_THINKING_AUTO_GROUP !== 'false';
    }
    if (process.env.CREATIVE_THINKING_MAX_TECHNIQUES_PER_GROUP) {
        const maxPerGroup = parseInt(process.env.CREATIVE_THINKING_MAX_TECHNIQUES_PER_GROUP, 10);
        if (!isNaN(maxPerGroup) && maxPerGroup > 0) {
            config.maxTechniquesPerGroup = maxPerGroup;
        }
    }
    return config;
}
/**
 * Validate execution configuration
 */
export function validateParallelConfig(config) {
    const errors = [];
    if (config.maxConcurrentOperations < 1 || config.maxConcurrentOperations > 20) {
        errors.push('maxConcurrentOperations must be between 1 and 20');
    }
    if (config.operationTimeoutMs < 1000 || config.operationTimeoutMs > 600000) {
        errors.push('operationTimeoutMs must be between 1000 (1s) and 600000 (10min)');
    }
    if (config.maxTechniquesPerGroup < 1 || config.maxTechniquesPerGroup > 20) {
        errors.push('maxTechniquesPerGroup must be between 1 and 20');
    }
    return errors;
}
/**
 * Get a human-readable summary of the configuration
 */
export function getExecutionConfigSummary(config) {
    return `Internal Execution Configuration:
  - Max Concurrent Operations: ${config.maxConcurrentOperations}
  - Timeout: ${config.operationTimeoutMs}ms
  - Sync Strategy: ${config.syncStrategy}
  - Workflow Validation: ${config.enforceWorkflowValidation}
  - Auto-group Techniques: ${config.autoGroupTechniques}
  - Max Techniques per Group: ${config.maxTechniquesPerGroup}`;
}
export const defaultParallelConfig = defaultExecutionConfig;
export const getParallelConfigSummary = getExecutionConfigSummary;
//# sourceMappingURL=parallel.js.map