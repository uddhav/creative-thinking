/**
 * ConvergenceExecutor - Handles execution of the convergence technique
 * Responsible for gathering results from parallel sessions and synthesizing them
 */
import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
/**
 * Executes the convergence technique to synthesize results from parallel sessions
 */
export declare class ConvergenceExecutor {
    private sessionManager;
    private visualFormatter;
    private responseBuilder;
    private errorHandler;
    constructor(sessionManager: SessionManager, visualFormatter: VisualFormatter);
    /**
     * Execute convergence technique step
     */
    executeConvergence(input: ExecuteThinkingStepInput, sessionId: string): Promise<LateralThinkingResponse>;
    /**
     * Gather results from a parallel group
     */
    private gatherGroupResults;
    /**
     * Display convergence progress
     */
    private displayConvergenceProgress;
    /**
     * Perform a specific convergence step
     */
    private performConvergenceStep;
    /**
     * Step 1: Collect and categorize insights from all results
     */
    private collectAndCategorizeInsights;
    /**
     * Step 2: Identify patterns and resolve conflicts
     */
    private identifyPatternsAndResolveConflicts;
    /**
     * Step 3: Synthesize final insights
     */
    private synthesizeFinalInsights;
    /**
     * Dynamic synthesis for additional steps
     */
    private performDynamicSynthesis;
    /**
     * Validate and normalize results object
     */
    private validateAndNormalizeResults;
}
//# sourceMappingURL=ConvergenceExecutor.d.ts.map