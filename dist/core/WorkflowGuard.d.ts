/**
 * WorkflowGuard - Enforces the three-tool workflow pattern
 * Tracks tool usage and provides helpful guidance when workflow is violated
 */
import type { SessionManager } from './SessionManager.js';
interface WorkflowViolation {
    type: 'skipped_discovery' | 'skipped_planning' | 'invalid_technique' | 'fabricated_planid' | 'parallel_without_plan' | 'parallel_inconsistent';
    message: string;
    guidance: string[];
    example?: string;
}
export declare class WorkflowGuard {
    private recentCalls;
    private readonly CALL_WINDOW_MS;
    private parallelCallGroups;
    private sessionManager;
    private validTechniques;
    /**
     * Set the SessionManager instance for plan validation
     */
    setSessionManager(sessionManager: SessionManager): void;
    /**
     * Record a tool call
     */
    recordCall(toolName: string, args?: unknown): void;
    /**
     * Check if the workflow is being followed correctly
     */
    checkWorkflowViolation(toolName: string, args: unknown): WorkflowViolation | null;
    /**
     * Check violations for parallel execution calls
     */
    checkParallelExecutionViolations(calls: Array<{
        name: string;
        arguments: unknown;
    }>): WorkflowViolation | null;
    /**
     * Get helpful error response for workflow violations
     * Now returns specialized error objects instead of generic responses
     */
    getViolationError(violation: WorkflowViolation): Error;
    private checkExecutionViolations;
    private cleanupOldCalls;
    /**
     * Extract recommended techniques from discovery call
     */
    private getRecommendedTechniques;
}
export declare const workflowGuard: WorkflowGuard;
export {};
//# sourceMappingURL=WorkflowGuard.d.ts.map