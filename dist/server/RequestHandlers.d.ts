/**
 * RequestHandlers - MCP request handlers for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { LateralThinkingServer } from '../index.js';
export declare class RequestHandlers {
    private server;
    private lateralServer;
    private parallelHandler;
    private parallelConfig;
    constructor(server: Server, lateralServer: LateralThinkingServer);
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
     * Get required parameters message for a tool
     */
    private getRequiredParametersMessage;
}
//# sourceMappingURL=RequestHandlers.d.ts.map