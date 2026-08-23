/**
 * Response Builder
 * Constructs formatted responses for MCP tools
 */
import type { LateralThinkingResponse, SessionData } from '../types/index.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../types/planning.js';
export interface ExecutionMetadata {
    /**
     * Audit of a stepReversibility claim: the handler-static prior, what the
     * caller claimed, what was applied after the one-rung clamp, and whether
     * clamping occurred. Present only on steps that sent a valid claim.
     */
    appliedReversibility?: {
        prior: 'high' | 'medium' | 'low' | 'very_low';
        claimed: 'high' | 'medium' | 'low';
        applied: 'high' | 'medium' | 'low' | 'very_low';
        clamped: boolean;
    };
    pathDependenciesCreated: string[];
    flexibilityImpact: number;
    noteworthyMoment?: string;
    futureRelevance?: string;
    errorContext?: {
        providedStep: number;
        validRange: string;
        technique: string;
        techniqueLocalStep: number;
        globalStep: number;
        message: string;
    };
}
export declare class ResponseBuilder {
    private metricsCache;
    private jsonOptimizer;
    constructor();
    /**
     * Build a success response with formatted content
     */
    buildSuccessResponse(content: unknown): LateralThinkingResponse;
    /**
     * Build an error response
     */
    buildErrorResponse(error: Error, layer: string): LateralThinkingResponse;
    /**
     * Build a discovery response
     */
    buildDiscoveryResponse(output: DiscoverTechniquesOutput): LateralThinkingResponse;
    /**
     * Build a planning response
     */
    buildPlanningResponse(output: PlanThinkingSessionOutput): LateralThinkingResponse;
    /**
     * Build a session operation response
     */
    buildSessionOperationResponse(operation: string, result: unknown): LateralThinkingResponse;
    /**
     * Add completion data to a response
     */
    addCompletionData(response: Record<string, unknown>, session: SessionData): Record<string, unknown>;
    /**
     * Format session list for display
     */
    formatSessionList(sessions: Array<{
        id: string;
        data: SessionData;
    }>): Record<string, unknown>;
    /**
     * Format export data based on format type
     */
    formatExportData(session: SessionData, format: 'json' | 'markdown' | 'csv'): string;
    /**
     * Format session as markdown
     */
    private formatAsMarkdown;
    /**
     * Format session as CSV
     */
    private formatAsCSV;
    /**
     * Build reasoning string from discovery output
     */
    private buildReasoningString;
    /**
     * Build suggested workflow from discovery output
     */
    private buildSuggestedWorkflow;
    /**
     * Build next step guidance from discovery output
     */
    private buildNextStepGuidance;
}
//# sourceMappingURL=ResponseBuilder.d.ts.map