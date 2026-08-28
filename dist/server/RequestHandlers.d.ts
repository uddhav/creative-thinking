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
    /**
     * Calls accepted into the batch collector but not yet handed to
     * processSingleCall. They are in flight from the caller's point of view —
     * counting only processSingleCall's window let a SIGTERM arriving inside
     * the collection window see zero active requests, skip the drain loop, and
     * exit while a caller waited on a response the server had accepted.
     */
    private pendingBatchCalls;
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