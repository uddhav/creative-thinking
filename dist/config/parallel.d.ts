/**
 * Internal Execution Configuration
 * Configuration for internal execution behavior of the creative thinking server
 */
export interface ExecutionConfig {
    /**
     * Maximum concurrent internal operations
     * @default 5
     */
    maxConcurrentOperations: number;
    /**
     * Timeout for internal operations in milliseconds
     * @default 30000 (30 seconds)
     */
    operationTimeoutMs: number;
    /**
     * Strategy for synchronizing internal operations
     * - 'checkpoint': Sync at predefined checkpoints
     * - 'immediate': Sync after each step
     * - 'batch': Sync after all operations complete
     * @default 'checkpoint'
     */
    syncStrategy: 'checkpoint' | 'immediate' | 'batch';
    /**
     * Whether to enforce strict workflow validation
     * @default true
     */
    enforceWorkflowValidation: boolean;
    /**
     * Whether to automatically group techniques that can run together
     * @default true
     */
    autoGroupTechniques: boolean;
    /**
     * Maximum techniques per group
     * @default 5
     */
    maxTechniquesPerGroup: number;
}
/**
 * Default configuration for internal execution
 */
export declare const defaultExecutionConfig: ExecutionConfig;
/**
 * Load execution configuration from environment variables
 */
export declare function loadParallelConfig(): ExecutionConfig;
/**
 * Validate execution configuration
 */
export declare function validateParallelConfig(config: ExecutionConfig): string[];
/**
 * Get a human-readable summary of the configuration
 */
export declare function getExecutionConfigSummary(config: ExecutionConfig): string;
export type ParallelToolCallConfig = ExecutionConfig;
export declare const defaultParallelConfig: ExecutionConfig;
export declare const getParallelConfigSummary: typeof getExecutionConfigSummary;
//# sourceMappingURL=parallel.d.ts.map