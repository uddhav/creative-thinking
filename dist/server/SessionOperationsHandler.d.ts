/**
 * SessionOperationsHandler - Handles session-related operations
 * Extracted from LateralThinkingServer to improve maintainability
 */
import type { SessionManager } from '../core/SessionManager.js';
import type { ResponseBuilder } from '../core/ResponseBuilder.js';
import type { SessionOperationData, LateralThinkingResponse } from '../types/index.js';
export declare class SessionOperationsHandler {
    private sessionManager;
    private responseBuilder;
    constructor(sessionManager: SessionManager, responseBuilder: ResponseBuilder);
    /**
     * Handle session operations
     */
    handleSessionOperation(input: SessionOperationData): Promise<LateralThinkingResponse>;
    private handleSaveOperation;
    private handleLoadOperation;
    private handleListOperation;
    private handleDeleteOperation;
    private handleExportOperation;
}
//# sourceMappingURL=SessionOperationsHandler.d.ts.map