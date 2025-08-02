/**
 * WorkflowGuard - Enforces the three-tool workflow pattern
 * Tracks tool usage and provides helpful guidance when workflow is violated
 */
interface WorkflowViolation {
    type: 'skipped_discovery' | 'skipped_planning' | 'invalid_technique' | 'fabricated_planid';
    message: string;
    guidance: string[];
    example?: string;
}
export declare class WorkflowGuard {
    private recentCalls;
    private readonly CALL_WINDOW_MS;
    private validTechniques;
    /**
     * Record a tool call
     */
    recordCall(toolName: string, args?: unknown): void;
    /**
     * Check if the workflow is being followed correctly
     */
    checkWorkflowViolation(toolName: string, args: unknown): WorkflowViolation | null;
    /**
     * Get helpful error response for workflow violations
     */
    getViolationResponse(violation: WorkflowViolation): {
        error: string;
        message: string;
        workflowRequired: string;
        guidance: string[];
        example?: string;
        validTechniques?: string[];
    };
    private checkExecutionViolations;
    private cleanupOldCalls;
}
export declare const workflowGuard: WorkflowGuard;
export {};
//# sourceMappingURL=WorkflowGuard.d.ts.map