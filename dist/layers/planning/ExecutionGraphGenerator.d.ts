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
     * Rounds of nodes that may run concurrently.
     *
     * Grouped by depth in the dependency graph: a node's round is one past the
     * deepest node it hard-depends on, so two nodes share a round exactly when
     * neither can reach the other. Soft dependencies are advisory and do not
     * block, so they do not affect depth.
     *
     * This replaced grouping by identical hard-dependency signature, which was
     * sufficient but not necessary and under-reported badly. Step 2 of technique
     * A depends on A's step 1 and step 2 of B on B's step 1, so their signatures
     * differed and they never shared a round even though the techniques are
     * independent. A four-technique plan reported `maxParallelism: 4` and then
     * placed all twenty remaining nodes in groups of one — only the first round
     * was ever parallel, and the metadata contradicted itself (#308).
     *
     * The invariant #327 established still holds, and now holds by construction
     * rather than by a post-hoc split: two steps of one technique are always
     * chained, so one is always deeper than the other and they cannot land in the
     * same round.
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