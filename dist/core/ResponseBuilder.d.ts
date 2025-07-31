/**
 * Response Builder
 * Constructs formatted responses for MCP tools
 */
import type { LateralThinkingResponse, SessionData, ThinkingOperationData } from '../types/index.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../types/planning.js';
export declare class ResponseBuilder {
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
     * Build an execution response
     */
    buildExecutionResponse(sessionId: string, input: ThinkingOperationData, insights: string[], nextStepGuidance?: string, historyLength?: number, executionMetadata?: Record<string, unknown>): LateralThinkingResponse;
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
     * Extract technique-specific fields from input
     */
    private extractTechniqueSpecificFields;
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
}
//# sourceMappingURL=ResponseBuilder.d.ts.map