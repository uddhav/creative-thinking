/**
 * Parallel Tool Call Configuration
 * Centralized configuration for Anthropic-style parallel tool calls
 */
/**
 * Default configuration for parallel tool calls
 */
export const defaultParallelConfig = {
    enabled: true,
    maxParallelCalls: 10,
    parallelTimeoutMs: 30000,
    syncStrategy: 'checkpoint',
    enforceWorkflowValidation: true,
    autoGroupParallelTechniques: true,
    maxTechniquesPerGroup: 5,
};
/**
 * Load parallel configuration from environment variables
 */
export function loadParallelConfig() {
    const config = { ...defaultParallelConfig };
    // Load from environment variables
    if (process.env.CREATIVE_THINKING_PARALLEL_TOOLS_ENABLED !== undefined) {
        config.enabled = process.env.CREATIVE_THINKING_PARALLEL_TOOLS_ENABLED !== 'false';
    }
    if (process.env.CREATIVE_THINKING_MAX_PARALLEL_CALLS) {
        const maxCalls = parseInt(process.env.CREATIVE_THINKING_MAX_PARALLEL_CALLS, 10);
        if (!isNaN(maxCalls) && maxCalls > 0) {
            config.maxParallelCalls = maxCalls;
        }
    }
    if (process.env.CREATIVE_THINKING_PARALLEL_TIMEOUT_MS) {
        const timeout = parseInt(process.env.CREATIVE_THINKING_PARALLEL_TIMEOUT_MS, 10);
        if (!isNaN(timeout) && timeout > 0) {
            config.parallelTimeoutMs = timeout;
        }
    }
    if (process.env.CREATIVE_THINKING_PARALLEL_SYNC_STRATEGY) {
        const strategy = process.env.CREATIVE_THINKING_PARALLEL_SYNC_STRATEGY;
        if (strategy === 'checkpoint' || strategy === 'immediate' || strategy === 'batch') {
            config.syncStrategy = strategy;
        }
    }
    if (process.env.CREATIVE_THINKING_PARALLEL_WORKFLOW_VALIDATION !== undefined) {
        config.enforceWorkflowValidation =
            process.env.CREATIVE_THINKING_PARALLEL_WORKFLOW_VALIDATION !== 'false';
    }
    if (process.env.CREATIVE_THINKING_PARALLEL_AUTO_GROUP !== undefined) {
        config.autoGroupParallelTechniques =
            process.env.CREATIVE_THINKING_PARALLEL_AUTO_GROUP !== 'false';
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
 * Validate parallel configuration
 */
export function validateParallelConfig(config) {
    const errors = [];
    if (config.maxParallelCalls < 1 || config.maxParallelCalls > 100) {
        errors.push('maxParallelCalls must be between 1 and 100');
    }
    if (config.parallelTimeoutMs < 1000 || config.parallelTimeoutMs > 600000) {
        errors.push('parallelTimeoutMs must be between 1000 (1s) and 600000 (10min)');
    }
    if (config.maxTechniquesPerGroup < 1 || config.maxTechniquesPerGroup > 20) {
        errors.push('maxTechniquesPerGroup must be between 1 and 20');
    }
    return errors;
}
/**
 * Get a human-readable summary of the configuration
 */
export function getParallelConfigSummary(config) {
    return `Parallel Tool Calls Configuration:
  - Enabled: ${config.enabled}
  - Max Parallel Calls: ${config.maxParallelCalls}
  - Timeout: ${config.parallelTimeoutMs}ms
  - Sync Strategy: ${config.syncStrategy}
  - Workflow Validation: ${config.enforceWorkflowValidation}
  - Auto-group Techniques: ${config.autoGroupParallelTechniques}
  - Max Techniques per Group: ${config.maxTechniquesPerGroup}`;
}
//# sourceMappingURL=parallel.js.map