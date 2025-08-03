/**
 * Configuration for parallel execution features
 */
/**
 * Parallelism configuration interface
 */
export interface ParallelismConfig {
    /**
     * Keyword configuration for detection
     */
    keywords: {
        parallel: string[];
        convergence: string[];
        llmHandoff: string[];
        custom?: Record<string, string[]>;
    };
    /**
     * Limits for parallel execution
     */
    limits: {
        maxParallelism: number;
        maxTechniquesPerPlan: number;
        timeoutMs: number;
    };
    /**
     * Validation settings
     */
    validation: {
        strictDependencyChecking: boolean;
        allowOverride: boolean;
        warnOnHighResource: boolean;
    };
}
/**
 * Default parallelism configuration
 */
export declare const defaultParallelismConfig: ParallelismConfig;
/**
 * Merge custom config with defaults
 */
export declare function mergeParallelismConfig(custom?: Partial<ParallelismConfig>): ParallelismConfig;
//# sourceMappingURL=parallelism.d.ts.map