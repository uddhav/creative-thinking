/**
 * RequestHandlers - MCP request handlers for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { LateralThinkingServer } from '../index.js';
export declare class RequestHandlers {
    private server;
    private lateralServer;
    private activeRequests;
    private requestLog;
    private batchCollector;
    private readonly BATCH_COLLECTION_WINDOW;
    private readonly MAX_PARALLEL_EXECUTIONS;
    private promptsHandler;
    constructor(server: Server, lateralServer: LateralThinkingServer);
    getActiveRequests(): number;
    /**
     * Set up all request handlers
     */
    setupHandlers(): void;
    /**
     * Handle tool listing requests
     */
    private setupListToolsHandler;
    /**
     * Handle prompts listing requests
     */
    private setupListPromptsHandler;
    /**
     * Handle get prompt requests
     */
    private setupGetPromptHandler;
    /**
     * Handle tool call requests
     */
    private setupCallToolHandler;
    /**
     * Validate required parameters for each tool
     */
    private validateRequiredParameters;
    /**
     * Handle a call that might be part of a batch
     */
    private handlePotentialBatchCall;
    /**
     * Process a batch of calls in parallel
     */
    private processBatch;
    /**
     * Process a single tool call
     */
    /**
     * Append every incoming tool call to `CT_CALL_LOG`, if it is set.
     *
     * Off unless the variable is present, so it costs a single undefined check in
     * normal operation. It exists because a record of what was called has to be
     * written by the thing being called: an agent asked to log its own calls
     * writes what it believes it sent, which is the same evidence as its prose
     * and fails in the same way. This is the only version of that record that can
     * contradict the caller.
     *
     * Failures are swallowed deliberately. A logging path that can take the
     * server down is worse than no logging, and stderr is the only place it could
     * complain to anyway.
     */
    private recordCallToLog;
    private processSingleCall;
    /**
     * Get required parameters message for a tool
     */
    private getRequiredParametersMessage;
    /**
     * Set up sampling-related handlers
     * Note: MCP Sampling uses custom methods that are not part of the standard schemas
     */
    private setupSamplingHandlers;
}
//# sourceMappingURL=RequestHandlers.d.ts.map