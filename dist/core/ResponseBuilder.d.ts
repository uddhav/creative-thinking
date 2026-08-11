/**
 * Response Builder
 * Constructs formatted responses for MCP tools
 */
import type { LateralThinkingResponse, SessionData } from '../types/index.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../types/planning.js';
export interface ExecutionMetadata {
    /**
     * How complete THIS step's output was, 0-1.
     *
     * Distinct from `metrics.outputCompleteness`, which scores the whole session.
     * Both used to be called outputCompleteness and appeared in the same response
     * inches apart, reporting different numbers — an invitation to compare two
     * things that are not comparable.
     */
    stepCompleteness: number;
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