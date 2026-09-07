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
     * Depth of every node in the dependency graph, and the parent that put it
     * there. One walk feeds both `parallelizableGroups` and `criticalPath`, so
     * the two cannot disagree about how long the schedule is. They used to be
     * computed against different graphs — the rounds honoured soft edges, the
     * critical path walked hard edges only — and disagreed for 618 of the 1,024
     * ordered technique pairs, always by exactly one, with the path never
     * reaching the session-ending node (#367).
     *
     * A node's depth is one past the deepest node it depends on, hard or soft.
     * Soft dependencies count: they are non-blocking for EXECUTION — a caller
     * need not wait — but they are still ordering constraints, and a round is an
     * ordering. Skipping them put the terminal node in the wrong round. It
     * carries `nextStepNeeded: false`, ends the session, and takes a soft
     * dependency on every technique's final node so it lands last. With soft
     * edges ignored its depth came only from its own predecessor, so a plan of
     * six_hats (7 steps) then po (4) scheduled the session-ending node in round 3
     * with three six_hats nodes in rounds 4-6 — telling a caller to end the
     * session and then send more steps to it.
     *
     * `deepestParent` is the first dependency, in array order, that holds the
     * maximum depth (strict `>`, so a later dependency of equal depth does not
     * replace it). `getDependencies` puts a node's own predecessor first and the
     * terminal node's soft edges are appended after it, so when the last
     * technique ties for longest the critical path stays inside that technique.
     *
     * Memoised and iterative rather than recursive: a plan can carry hundreds of
     * nodes and this runs on every planning call.
     */
    private static computeDepths;
    /**
     * Rounds of nodes that may run concurrently: nodes bucketed by depth, so two
     * nodes share a round exactly when neither can reach the other.
     *
     * This replaced grouping by identical hard-dependency signature, which was
     * sufficient but not necessary and under-reported badly. Step 2 of technique
     * A depends on A's step 1 and step 2 of B on B's step 1, so their signatures
     * differed and they never shared a round even though the techniques are
     * independent. A four-technique plan reported `maxParallelism: 4` and then
     * placed all twenty remaining nodes in groups of one — only the first round
     * was ever parallel, and the metadata contradicted itself (#308).
     *
     * The invariant #327 established still holds, and holds by construction
     * rather than by a post-hoc split: two steps of one technique are always
     * chained, so one is always deeper than the other and they cannot land in the
     * same round.
     */
    private static roundsFrom;
    /**
     * The critical path: one node per round along the deepest dependency chain,
     * read back from the same depth walk as the rounds. It starts at a root and
     * ends at the deepest node — the session-ending node, which every
     * technique's final node feeds by a soft edge — so it is always exactly as
     * long as `parallelizableGroups`. Ties for deepest go to the earliest node in
     * plan order; ties among a node's dependencies go to the first in array order
     * (see `computeDepths`).
     */
    private static deepestChain;
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