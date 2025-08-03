/**
 * Type guards for parallel execution types
 */
/**
 * Check if a value is a valid ExecutionMode
 */
export function isExecutionMode(value) {
    return typeof value === 'string' && ['sequential', 'parallel', 'auto'].includes(value);
}
/**
 * Check if a value is a valid ConvergenceMethod
 */
export function isConvergenceMethod(value) {
    return (typeof value === 'string' && ['execute_thinking_step', 'llm_handoff', 'none'].includes(value));
}
/**
 * Check if a technique supports parallel execution
 */
export function supportsParallelExecution(technique) {
    // Most techniques can run in parallel except convergence (which needs results from others)
    const nonParallelTechniques = ['convergence'];
    return !nonParallelTechniques.includes(technique);
}
/**
 * Check if techniques can be executed in parallel together
 */
export function canExecuteInParallel(techniques) {
    // All techniques must support parallel execution
    return techniques.every(supportsParallelExecution);
}
/**
 * Check if a value is the convergence technique
 */
export function isConvergenceTechnique(technique) {
    return technique === 'convergence';
}
/**
 * Validate max parallelism value
 */
export function isValidMaxParallelism(value) {
    return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10;
}
/**
 * Get default max parallelism based on technique count
 */
export function getDefaultMaxParallelism(techniqueCount) {
    // Default to 3, but not more than the number of techniques
    return Math.min(3, techniqueCount);
}
//# sourceMappingURL=guards.js.map