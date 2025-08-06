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
}
/**
 * Default configuration for parallel tool calls
 */
export declare const defaultParallelConfig: ParallelToolCallConfig;
/**
 * Load parallel configuration from environment variables
 */
export declare function loadParallelConfig(): ParallelToolCallConfig;
/**
 * Validate parallel configuration
 */
export declare function validateParallelConfig(config: ParallelToolCallConfig): string[];
/**
 * Get a human-readable summary of the configuration
 */
export declare function getParallelConfigSummary(config: ParallelToolCallConfig): string;
//# sourceMappingURL=parallel.d.ts.map