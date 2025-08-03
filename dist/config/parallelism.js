/**
 * Configuration for parallel execution features
 */
/**
 * Default parallelism configuration
 */
export const defaultParallelismConfig = {
    keywords: {
        parallel: [
            'parallel creative thinking',
            'fan out',
            'explore multiple approaches',
            'concurrent exploration',
            'simultaneous techniques',
            'multiple perspectives at once',
            'divergent exploration',
            'broad exploration',
            'explore in parallel',
            'multiple angles simultaneously',
        ],
        convergence: [
            'converge',
            'synthesize',
            'bring together',
            'combine insights',
            'merge results',
            'unify findings',
            'integrate approaches',
        ],
        llmHandoff: [
            'hand off to llm',
            'let llm decide',
            'llm synthesis',
            'flexible convergence',
            'adaptive synthesis',
            'intelligent merge',
        ],
    },
    limits: {
        maxParallelism: 5,
        maxTechniquesPerPlan: 10,
        timeoutMs: 60000, // 1 minute per technique
    },
    validation: {
        strictDependencyChecking: true,
        allowOverride: true,
        warnOnHighResource: true,
    },
};
/**
 * Merge custom config with defaults
 */
export function mergeParallelismConfig(custom) {
    if (!custom)
        return defaultParallelismConfig;
    return {
        keywords: {
            ...defaultParallelismConfig.keywords,
            ...custom.keywords,
            custom: {
                ...defaultParallelismConfig.keywords.custom,
                ...custom.keywords?.custom,
            },
        },
        limits: {
            ...defaultParallelismConfig.limits,
            ...custom.limits,
        },
        validation: {
            ...defaultParallelismConfig.validation,
            ...custom.validation,
        },
    };
}
//# sourceMappingURL=parallelism.js.map