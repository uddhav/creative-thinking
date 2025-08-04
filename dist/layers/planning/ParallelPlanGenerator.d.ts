/**
 * ParallelPlanGenerator - Generates parallel execution plans for creative thinking techniques
 * Splits multi-technique sessions into independent plans that can run concurrently
 */
import type { PlanThinkingSessionInput, PlanThinkingSessionOutput, ExecutionMode, ConvergenceOptions } from '../../types/planning.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
/**
 * Generates parallel execution plans for creative thinking sessions
 */
export declare class ParallelPlanGenerator {
    private sessionManager;
    private techniqueRegistry;
    private dependencyAnalyzer;
    constructor(sessionManager: SessionManager, techniqueRegistry: TechniqueRegistry);
    /**
     * Generate parallel or sequential plans based on execution mode
     */
    generateParallelPlans(input: PlanThinkingSessionInput, executionMode: ExecutionMode, convergenceOptions?: ConvergenceOptions): PlanThinkingSessionOutput;
    /**
     * Generate a sequential plan (fallback for sequential mode)
     */
    private generateSequentialPlan;
    /**
     * Create execution groups based on dependencies and parallelism constraints
     */
    private createExecutionGroups;
    /**
     * Create a plan for a group of techniques
     */
    private createPlanForGroup;
    /**
     * Create a convergence plan for synthesizing parallel results
     */
    private createConvergencePlan;
    /**
     * Create coordination strategy for parallel execution
     */
    private createCoordinationStrategy;
    /**
     * Calculate total steps across all plans
     */
    private calculateTotalSteps;
    /**
     * Estimate time for parallel execution
     */
    private estimateParallelTime;
    /**
     * Parse time string to minutes
     */
    private parseTimeMinutes;
    /**
     * Optimize groups for balanced execution
     */
    private optimizeGroups;
    /**
     * Create sequential workflow for backward compatibility
     */
    private createSequentialWorkflow;
    /**
     * Create combined workflow from parallel plans (for backward compatibility)
     */
    private createCombinedWorkflow;
    /**
     * Generate steps for a specific technique
     */
    private generateStepsForTechnique;
    /**
     * Get critical lens for a specific step
     */
    private getCriticalLensForStep;
    /**
     * Get success criteria for a specific step
     */
    private getSuccessCriteriaForStep;
    /**
     * Estimate time for a technique
     */
    private estimateTime;
    /**
     * Calculate time for a group of techniques
     */
    private calculateGroupTime;
    /**
     * Estimate sequential time
     */
    private estimateSequentialTime;
    /**
     * Get required inputs for a technique
     */
    private getRequiredInputs;
    /**
     * Get expected outputs for a technique
     */
    private getExpectedOutputs;
    /**
     * Find dependencies for a group
     */
    private findGroupDependencies;
    /**
     * Assess complexity of a group
     */
    private assessGroupComplexity;
}
//# sourceMappingURL=ParallelPlanGenerator.d.ts.map