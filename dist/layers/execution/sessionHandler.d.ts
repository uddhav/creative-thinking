/**
 * Session handling for execution layer
 * Manages session initialization and state
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
export declare class SessionHandler {
    /**
     * Initialize or get existing session
     */
    static initializeSession(input: ExecuteThinkingStepInput, sessionManager: SessionManager): string;
    /**
     * Save step to session history
     */
    static saveStep(sessionId: string, input: ExecuteThinkingStepInput, output: any, sessionManager: SessionManager): void;
    /**
     * Get session insights
     */
    static getSessionInsights(sessionId: string, sessionManager: SessionManager): string[];
    /**
     * Check if session is complete
     */
    static isSessionComplete(input: ExecuteThinkingStepInput, sessionId: string, sessionManager: SessionManager): boolean;
    /**
     * Extract insights from completed session
     */
    private static extractFinalInsights;
}
//# sourceMappingURL=sessionHandler.d.ts.map