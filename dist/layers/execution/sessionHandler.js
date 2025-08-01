/**
 * Session handling for execution layer
 * Manages session initialization and state
 */
import { SessionError, ErrorCode } from '../../errors/index.js';
export class SessionHandler {
    /**
     * Initialize or get existing session
     */
    static initializeSession(input, sessionManager) {
        let sessionId = input.sessionId;
        if (!sessionId && input.planId) {
            // Try to get session from plan
            const plan = sessionManager.getPlan(input.planId);
            if (plan && 'sessionId' in plan && typeof plan.sessionId === 'string') {
                sessionId = plan.sessionId;
            }
        }
        if (!sessionId) {
            // Create new session
            sessionId = sessionManager.createSession({
                problem: input.problem,
                technique: input.technique,
                history: [],
                branches: {},
                insights: [],
                lastActivityTime: Date.now(),
            });
        }
        return sessionId;
    }
    /**
     * Save step to session history
     */
    static saveStep(sessionId, input, output, sessionManager) {
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session ${sessionId} not found`, sessionId);
        }
        // Add to history
        const operationDataWithTimestamp = {
            ...input,
            timestamp: new Date().toISOString(),
        };
        session.history.push(operationDataWithTimestamp);
        // Save session
        // Session is saved automatically in SessionManager
    }
    /**
     * Get session insights
     */
    static getSessionInsights(sessionId, sessionManager) {
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            throw new SessionError(ErrorCode.SESSION_NOT_FOUND, `Session ${sessionId} not found`, sessionId);
        }
        return session.insights || [];
    }
    /**
     * Check if session is complete
     */
    static isSessionComplete(input, sessionId, sessionManager) {
        if (!input.nextStepNeeded) {
            const session = sessionManager.getSession(sessionId);
            if (session) {
                // Extract final insights
                const insights = this.extractFinalInsights(session);
                session.insights = insights;
                // Session is saved automatically in SessionManager
                return true;
            }
        }
        return false;
    }
    /**
     * Extract insights from completed session
     */
    static extractFinalInsights(session) {
        const insights = [];
        // Extract key outputs from history
        for (const entry of session.history) {
            if (entry.output?.keyInsight) {
                insights.push(entry.output.keyInsight);
            }
        }
        // Add summary insight
        if (insights.length > 0) {
            insights.push(`Completed ${session.technique} thinking process with ${session.history.length} steps`);
        }
        return insights;
    }
}
//# sourceMappingURL=sessionHandler.js.map