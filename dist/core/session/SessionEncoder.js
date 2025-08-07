/**
 * SessionEncoder - Encodes and decodes session data to/from base64
 * Allows sessions to be portable and resilient to server memory loss
 */
export class SessionEncoder {
    /**
     * Encode session data to base64
     */
    static encode(sessionData) {
        try {
            const json = JSON.stringify(sessionData);
            return Buffer.from(json).toString('base64');
        }
        catch (error) {
            console.error('[SessionEncoder] Failed to encode session:', error);
            throw new Error('Failed to encode session data');
        }
    }
    /**
     * Decode and validate base64 session
     */
    static decode(encodedSession) {
        try {
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
        // Check if session is not expired (24 hours)
        const expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const isNotExpired = decoded.timestamp > Date.now() - expiryTime;
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
}
//# sourceMappingURL=SessionEncoder.js.map