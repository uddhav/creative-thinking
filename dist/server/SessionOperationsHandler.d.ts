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
    /**
     * `list` and `delete` degrade gracefully when there is no persistence
     * adapter, and that is deliberate — three tests in `validation.test.ts` hold
     * them to it. What they did not do is say so. `listPersistedSessions`
     * returns `[]` with no adapter, so "0 sessions" was indistinguishable from a
     * configured server holding none; `deletePersistedSession` returns void, so
     * `delete` reported "Session deleted successfully" for a session it had no
     * way to touch. Degrading is fine. Degrading silently is the fault.
     */
    private persistenceAvailable;
    private handleListOperation;
    private handleDeleteOperation;
    private handleExportOperation;
}
//# sourceMappingURL=SessionOperationsHandler.d.ts.map