/**
 * ExecutionGraphGenerator - Generates DAG for client-side parallel execution
 */
import type { ExecutionGraph, TechniqueWorkflow } from '../../types/planning.js';
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
     * Build complete parameters for execute_thinking_step
     */
    private static buildParameters;
    /**
     * Get technique-specific parameters
     */
    private static getTechniqueSpecificParams;
    /**
     * Calculate metadata for the execution graph
     */
    private static calculateMetadata;
    /**
     * Find groups of nodes that can execute in parallel
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
     * Estimate duration for a technique step
     */
    private static estimateDuration;
    /**
     * Determine if a step can be skipped if it fails
     */
    private static canSkipIfFailed;
    /**
     * Check if two arrays are equal
     */
    private static arraysEqual;
}
//# sourceMappingURL=ExecutionGraphGenerator.d.ts.map