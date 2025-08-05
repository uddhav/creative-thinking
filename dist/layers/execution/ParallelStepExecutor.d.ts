/**
 * ParallelStepExecutor - Handles execution of steps within parallel sessions
 * Manages shared context, dependencies, and coordination between parallel executions
 */
import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { SessionSynchronizer } from '../../core/session/SessionSynchronizer.js';
import type { SharedContext } from '../../types/parallel-session.js';
/**
 * Handles execution context for parallel sessions
 */
export interface ParallelExecutionContext {
    sessionId: string;
    groupId: string;
    sharedContext: SharedContext | undefined;
    canProceed: boolean;
    waitingFor: string[];
    dependencies: string[];
}
/**
 * Executes steps within parallel sessions with proper coordination
 */
export declare class ParallelStepExecutor {
    private sessionManager;
    private sessionSynchronizer;
    private errorHandler;
    constructor(sessionManager: SessionManager, sessionSynchronizer: SessionSynchronizer);
    /**
     * Check if a session can execute based on parallel group membership
     */
    checkParallelExecutionContext(sessionId: string, input: ExecuteThinkingStepInput): ParallelExecutionContext;
    /**
     * Execute a step with parallel coordination
     */
    executeWithCoordination(input: ExecuteThinkingStepInput, sessionId: string, baseExecutor: (input: ExecuteThinkingStepInput) => Promise<LateralThinkingResponse>): Promise<LateralThinkingResponse>;
    /**
     * Get uncompleted dependencies
     */
    private getUncompletedDependencies;
    /**
     * Build a response for a session that's waiting on dependencies
     */
    private buildWaitingResponse;
    /**
     * Update shared context before execution
     */
    private updateSharedContextPreExecution;
    /**
     * Update shared context after execution
     */
    private updateSharedContextPostExecution;
    /**
     * Extract themes from output text
     */
    private extractThemes;
    /**
     * Check if this session should wait for checkpoint
     */
    shouldWaitForCheckpoint(sessionId: string, _currentStep: number): boolean;
    /**
     * Wait for checkpoint completion
     */
    waitForCheckpoint(sessionId: string, groupId: string, checkpointId: string): void;
}
//# sourceMappingURL=ParallelStepExecutor.d.ts.map