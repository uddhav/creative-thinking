/**
 * Parallel Tool Call Configuration
 * Centralized configuration for Anthropic-style parallel tool calls
 */

export interface ParallelToolCallConfig {
  /**
   * Whether parallel tool calls are enabled
   * @default true
   */
  enabled: boolean;

  /**
   * Maximum number of parallel tool calls allowed
   * @default 10
   */
  maxParallelCalls: number;

  /**
   * Timeout for parallel tool calls in milliseconds
   * @default 30000 (30 seconds)
   */
  parallelTimeoutMs: number;

  /**
   * Strategy for synchronizing parallel executions
   * - 'checkpoint': Sync at predefined checkpoints
   * - 'immediate': Sync after each step
   * - 'batch': Sync after all parallel calls complete
   * @default 'checkpoint'
   */
  syncStrategy: 'checkpoint' | 'immediate' | 'batch';

  /**
   * Whether to enforce strict workflow validation for parallel calls
   * @default true
   */
  enforceWorkflowValidation: boolean;

  /**
   * Whether to automatically group techniques that can run in parallel
   * @default true
   */
  autoGroupParallelTechniques: boolean;

  /**
   * Maximum techniques per parallel group
   * @default 5
   */
  maxTechniquesPerGroup: number;

  /**
   * Response format for parallel tool calls
   * - 'anthropic': Anthropic's tool_result format with tool_use_id (the only legitimate format)
   * - 'legacy': Original indexed format with toolIndex (deprecated, for backward compatibility only)
   * @default 'anthropic'
   */
  responseFormat: 'legacy' | 'anthropic';
}

/**
 * Default configuration for parallel tool calls
 */
export const defaultParallelConfig: ParallelToolCallConfig = {
  enabled: true,
  maxParallelCalls: 10,
  parallelTimeoutMs: 30000,
  syncStrategy: 'checkpoint',
  enforceWorkflowValidation: true,
  autoGroupParallelTechniques: true,
  maxTechniquesPerGroup: 5,
  responseFormat: 'anthropic',
};

/**
 * Load parallel configuration from environment variables
 */
export function loadParallelConfig(): ParallelToolCallConfig {
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

  if (process.env.CREATIVE_THINKING_RESPONSE_FORMAT) {
    const format = process.env.CREATIVE_THINKING_RESPONSE_FORMAT.toLowerCase();
    if (format === 'legacy' || format === 'anthropic') {
      config.responseFormat = format;
    }
  }

  return config;
}

/**
 * Validate parallel configuration
 */
export function validateParallelConfig(config: ParallelToolCallConfig): string[] {
  const errors: string[] = [];

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
export function getParallelConfigSummary(config: ParallelToolCallConfig): string {
  return `Parallel Tool Calls Configuration:
  - Enabled: ${config.enabled}
  - Max Parallel Calls: ${config.maxParallelCalls}
  - Timeout: ${config.parallelTimeoutMs}ms
  - Sync Strategy: ${config.syncStrategy}
  - Workflow Validation: ${config.enforceWorkflowValidation}
  - Auto-group Techniques: ${config.autoGroupParallelTechniques}
  - Max Techniques per Group: ${config.maxTechniquesPerGroup}`;
}
