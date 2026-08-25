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
    /**
     * Inline ceiling for session exports, which bypass the response optimizer
     * because their contract is "everything whole". Beyond this the export is
     * refused with the CLI file-export alternative rather than truncated.
     */
    private static readonly MAX_EXPORT_BYTES;
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
     * Add completion data to a response.
     *
     * Builds the block fresh every time. It used to be memoised under
     * `completion-${technique}-${history.length}` — a key that named nothing
     * about whose session it was, while the value carried that session's
     * insights, problem, metrics and summary. Two sessions agreeing on technique
     * and history length, which any two full six_hats runs do, were the same
     * entry as far as the map was concerned (#313).
     *
     * Nothing had leaked: `executeThinkingStep` constructs its
     * `ExecutionResponseBuilder`, and with it this class, once per tool call, so
     * the map was written on the way out and dropped with the object. That also
     * means the memoisation never returned a single hit — this method is called
     * once per session, at the end. It was a cache that could not help and could
     * only ever be wrong, so it is gone rather than re-keyed: the block is an
     * object literal over state already in memory, and removing it takes the
     * only cross-session mutable state in this class with it.
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