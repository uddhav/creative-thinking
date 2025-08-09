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
    private processSingleCall;
    /**
     * Get required parameters message for a tool
     */
    private getRequiredParametersMessage;
}
//# sourceMappingURL=RequestHandlers.d.ts.map