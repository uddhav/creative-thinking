/**
 * SessionEncoder - Encodes and decodes session data to/from base64
 * Allows sessions to be portable and resilient to server memory loss
 */
export class SessionEncoder {
    static MAX_SESSION_SIZE = 1024 * 1024; // 1MB
    static EXPIRY_TIME = 30 * 24 * 60 * 60 * 1000; // 30 days
    // Only track count, not actual sessions to avoid memory leak
    static activeSessionCount = 0;
    // Metrics for monitoring
    static metrics = {
        encodeCalls: 0,
        decodeCalls: 0,
        largestSession: 0,
        cleanupRuns: 0,
        totalSessionsCreated: 0,
    };
    /**
     * Encode session data to base64
     */
    static encode(sessionData) {
        try {
            const json = JSON.stringify(sessionData);
            // Check size limit
            if (json.length > this.MAX_SESSION_SIZE) {
                throw new Error(`Session data too large: ${json.length} bytes (max: ${this.MAX_SESSION_SIZE})`);
            }
            const encoded = Buffer.from(json).toString('base64');
            // Update metrics (don't store the actual session to avoid memory leak)
            this.activeSessionCount++;
            this.metrics.encodeCalls++;
            this.metrics.totalSessionsCreated++;
            this.metrics.largestSession = Math.max(this.metrics.largestSession, json.length);
            return encoded;
        }
        catch (error) {
            console.error('[SessionEncoder] Failed to encode session:', error);
            throw error instanceof Error ? error : new Error('Failed to encode session data');
        }
    }
    /**
     * Decode and validate base64 session
     */
    static decode(encodedSession) {
        try {
            // Update metrics
            this.metrics.decodeCalls++;
            // Check if it's a base64 string
            if (!this.isBase64(encodedSession)) {
                return null;
            }
            const json = Buffer.from(encodedSession, 'base64').toString('utf-8');
            const data = JSON.parse(json);
            // Validate required fields
            if (!this.validateSessionData(data)) {
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('[SessionEncoder] Failed to decode session:', error);
            return null;
        }
    }
    /**
     * Get metrics for monitoring
     */
    static getMetrics() {
        return {
            ...this.metrics,
            activeSessions: this.activeSessionCount,
        };
    }
    /**
     * Check if a planId is an encoded session
     */
    static isEncodedSession(planId) {
        // Encoded sessions are base64 strings, regular planIds start with "plan_"
        if (planId.startsWith('plan_')) {
            return false;
        }
        return this.isBase64(planId);
    }
    /**
     * Validate session without memory lookup
     */
    static isValid(encodedSession) {
        const decoded = this.decode(encodedSession);
        if (!decoded) {
            return false;
        }
        // Check if session is not expired (30 days)
        const isNotExpired = decoded.timestamp > Date.now() - this.EXPIRY_TIME;
        // Check if step number is valid
        const isStepValid = decoded.currentStep > 0 && decoded.currentStep <= decoded.totalSteps;
        return isNotExpired && isStepValid;
    }
    /**
     * Extract planId from encoded session or return as-is if not encoded
     */
    static extractPlanId(planIdOrEncoded) {
        if (this.isEncodedSession(planIdOrEncoded)) {
            const decoded = this.decode(planIdOrEncoded);
            return decoded?.planId || planIdOrEncoded;
        }
        return planIdOrEncoded;
    }
    /**
     * Create encoded session from current execution state
     */
    static createEncodedSession(planId, problem, technique, currentStep, totalSteps, additionalData) {
        const sessionData = {
            planId,
            problem,
            technique,
            currentStep,
            totalSteps,
            timestamp: Date.now(),
            ...additionalData,
        };
        return this.encode(sessionData);
    }
    /**
     * Check if a string is valid base64
     */
    static isBase64(str) {
        if (!str || str.length === 0) {
            return false;
        }
        // Base64 regex pattern
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        // Check if string matches base64 pattern
        if (!base64Regex.test(str)) {
            return false;
        }
        // Additional check: base64 strings should be divisible by 4
        if (str.length % 4 !== 0) {
            return false;
        }
        return true;
    }
    /**
     * Validate decoded session data
     */
    static validateSessionData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        // Check required fields
        const requiredFields = [
            'planId',
            'problem',
            'technique',
            'currentStep',
            'totalSteps',
            'timestamp',
        ];
        for (const field of requiredFields) {
            if (!(field in data)) {
                return false;
            }
        }
        // Validate field types
        if (typeof data.planId !== 'string' ||
            typeof data.problem !== 'string' ||
            typeof data.technique !== 'string' ||
            typeof data.currentStep !== 'number' ||
            typeof data.totalSteps !== 'number' ||
            typeof data.timestamp !== 'number') {
            return false;
        }
        // Validate step numbers
        const validData = data;
        if (validData.currentStep < 1 || validData.currentStep > validData.totalSteps) {
            return false;
        }
        return true;
    }
    /**
     * Merge encoded session with existing plan data
     */
    static mergeWithPlan(encodedSession, planData) {
        const decoded = this.decode(encodedSession);
        if (!decoded) {
            return planData;
        }
        return {
            ...planData,
            planId: decoded.planId,
            problem: decoded.problem || planData.problem,
            techniques: decoded.techniques || planData.techniques,
            currentStep: decoded.currentStep,
            totalSteps: decoded.totalSteps,
            objectives: decoded.objectives || planData.objectives,
            constraints: decoded.constraints || planData.constraints,
        };
    }
    /**
     * Encode session state to base64
     */
    static encodeSession(sessionState) {
        try {
            const json = JSON.stringify(sessionState);
            return Buffer.from(json).toString('base64');
        }
        catch (error) {
            console.error('[SessionEncoder] Failed to encode session state:', error);
            throw new Error('Failed to encode session state');
        }
    }
    /**
     * Decode session state from base64
     */
    static decodeSession(encodedSession) {
        try {
            // Check if it's a base64 string
            if (!this.isBase64(encodedSession)) {
                return null;
            }
            const json = Buffer.from(encodedSession, 'base64').toString('utf-8');
            const data = JSON.parse(json);
            // Validate required fields
            if (!this.validateSessionState(data)) {
                return null;
            }
            return data;
        }
        catch (error) {
            console.error('[SessionEncoder] Failed to decode session state:', error);
            return null;
        }
    }
    /**
     * Check if a sessionId is an encoded session
     */
    static isEncodedSessionId(sessionId) {
        // Regular sessionIds start with "session_"
        if (sessionId.startsWith('session_')) {
            return false;
        }
        return this.isBase64(sessionId);
    }
    /**
     * Validate session state without memory lookup
     */
    static isValidSession(encodedSession) {
        const decoded = this.decodeSession(encodedSession);
        if (!decoded) {
            return false;
        }
        // Check if session is not expired (30 days)
        const isNotExpired = decoded.timestamp > Date.now() - this.EXPIRY_TIME;
        // Check if step number is valid
        const isStepValid = decoded.currentStep > 0 && decoded.currentStep <= decoded.totalSteps;
        return isNotExpired && isStepValid;
    }
    /**
     * Create encoded sessionId from current execution state
     */
    static createEncodedSessionId(originalSessionId, planId, problem, technique, currentStep, totalSteps, additionalData) {
        const sessionState = {
            sessionId: originalSessionId,
            planId,
            problem,
            technique,
            currentStep,
            totalSteps,
            timestamp: Date.now(),
            ...additionalData,
        };
        return this.encodeSession(sessionState);
    }
    /**
     * Extract original sessionId from encoded session or return as-is
     */
    static extractSessionId(sessionIdOrEncoded) {
        if (this.isEncodedSessionId(sessionIdOrEncoded)) {
            const decoded = this.decodeSession(sessionIdOrEncoded);
            return decoded?.sessionId || sessionIdOrEncoded;
        }
        return sessionIdOrEncoded;
    }
    /**
     * Validate decoded session state
     */
    static validateSessionState(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        // Check required fields
        const requiredFields = [
            'sessionId',
            'planId',
            'problem',
            'technique',
            'currentStep',
            'totalSteps',
            'timestamp',
        ];
        for (const field of requiredFields) {
            if (!(field in data)) {
                return false;
            }
        }
        // Validate field types
        const validData = data;
        if (typeof validData.sessionId !== 'string' ||
            typeof validData.planId !== 'string' ||
            typeof validData.problem !== 'string' ||
            typeof validData.technique !== 'string' ||
            typeof validData.currentStep !== 'number' ||
            typeof validData.totalSteps !== 'number' ||
            typeof validData.timestamp !== 'number') {
            return false;
        }
        // Validate step numbers
        if (validData.currentStep < 1 || validData.currentStep > validData.totalSteps) {
            return false;
        }
        return true;
    }
}
//# sourceMappingURL=SessionEncoder.js.map