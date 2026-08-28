/**
 * ExecutionGraphGenerator - Generates DAG for client-side parallel execution
 */
import type { ExecutionGraph, TechniqueWorkflow } from '../../types/planning.js';
import type { ExecuteThinkingStepInput, LateralTechnique } from '../../types/index.js';
export declare class ExecutionGraphGenerator {
    /**
     * Generate execution graph from workflow
     */
    static generateExecutionGraph(planId: string, problem: string, workflows: TechniqueWorkflow[]): ExecutionGraph;
    /**
     * Generate nodes for a specific technique
     */
    private static generateTechniqueNodes;
    /**
     * Determine dependencies based on technique characteristics
     */
    private static getDependencies;
    /**
     * Get dependencies for hybrid techniques
     */
    private static getHybridDependencies;
    /**
     * Build complete parameters for execute_thinking_step.
     *
     * These parameters are the contract: a caller runs them verbatim, filling
     * only `output` and threading `sessionId`. `problem` is deliberately absent
     * — one copy per node meant 25 copies of the caller's problem in a
     * five-technique plan, half the total echo. `execute_thinking_step` resolves
     * it from `planId` instead, which is why `problem` is optional there.
     */
    private static buildParameters;
    /**
     * Get technique-specific parameters
     * Made public for testing bounds checking
     */
    static getTechniqueSpecificParams(technique: LateralTechnique, currentStep: number, step: {
        description?: string;
        stimulus?: string;
        contradiction?: string;
    }): Partial<ExecuteThinkingStepInput>;
    /**
     * Calculate metadata for the execution graph
     */
    private static calculateMetadata;
    /**
     * Calculate sequential time multiplier based on parallelization potential
     */
    private static calculateSequentialTimeMultiplier;
    /**
     * Find groups of nodes that can execute in parallel
     * Optimized from O(n²) to O(n) using Map for grouping
     */
    private static findParallelizableGroups;
    /**
     * Find the critical path through the graph
     */
    private static findCriticalPath;
    /**
     * Depth-first search to find longest path
     */
    private static dfs;
    /**
     * Generate instructions for the invoker
     */
    private static generateInstructions;
    /**
     * Identify sync points between techniques
     */
    private static identifySyncPoints;
    /**
     * Generate description of parallelization benefits
     */
    private static generateParallelizationBenefits;
    /**
     * Determine if a step can be skipped if it fails
     */
    private static canSkipIfFailed;
}
//# sourceMappingURL=ExecutionGraphGenerator.d.ts.map