/**
 * SessionEncoder - Encodes and decodes session data to/from base64
 * Allows sessions to be portable and resilient to server memory loss
 */
import type { LateralTechnique } from '../../types/index.js';
export interface EncodedSessionData {
    planId: string;
    problem: string;
    technique: string;
    currentStep: number;
    totalSteps: number;
    timestamp: number;
    techniques?: LateralTechnique[];
    objectives?: string[];
    constraints?: string[];
}
export interface EncodedSessionState {
    sessionId: string;
    planId: string;
    technique: string;
    currentStep: number;
    totalSteps: number;
    timestamp: number;
    problem: string;
    historyLength?: number;
    lastOutput?: string;
}
export declare class SessionEncoder {
    private static readonly MAX_SESSION_SIZE;
    private static readonly EXPIRY_TIME;
    private static activeSessionCount;
    private static metrics;
    /**
     * Encode session data to base64
     */
    static encode(sessionData: EncodedSessionData): string;
    /**
     * Decode and validate base64 session
     */
    static decode(encodedSession: string): EncodedSessionData | null;
    /**
     * Get metrics for monitoring
     */
    static getMetrics(): {
        activeSessions: number;
        encodeCalls: number;
        decodeCalls: number;
        largestSession: number;
        cleanupRuns: number;
        totalSessionsCreated: number;
    };
    /**
     * Check if a planId is an encoded session
     */
    static isEncodedSession(planId: string): boolean;
    /**
     * Validate session without memory lookup
     */
    static isValid(encodedSession: string): boolean;
    /**
     * Extract planId from encoded session or return as-is if not encoded
     */
    static extractPlanId(planIdOrEncoded: string): string;
    /**
     * Create encoded session from current execution state
     */
    static createEncodedSession(planId: string, problem: string, technique: string, currentStep: number, totalSteps: number, additionalData?: {
        techniques?: LateralTechnique[];
        objectives?: string[];
        constraints?: string[];
    }): string;
    /**
     * Check if a string is valid base64
     */
    private static isBase64;
    /**
     * Validate decoded session data
     */
    private static validateSessionData;
    /**
     * Merge encoded session with existing plan data
     */
    static mergeWithPlan(encodedSession: string, planData: Record<string, unknown>): Record<string, unknown>;
    /**
     * Encode session state to base64
     */
    static encodeSession(sessionState: EncodedSessionState): string;
    /**
     * Decode session state from base64
     */
    static decodeSession(encodedSession: string): EncodedSessionState | null;
    /**
     * Check if a sessionId is an encoded session
     */
    static isEncodedSessionId(sessionId: string): boolean;
    /**
     * Validate session state without memory lookup
     */
    static isValidSession(encodedSession: string): boolean;
    /**
     * Create encoded sessionId from current execution state
     */
    static createEncodedSessionId(originalSessionId: string, planId: string, problem: string, technique: string, currentStep: number, totalSteps: number, additionalData?: {
        historyLength?: number;
        lastOutput?: string;
    }): string;
    /**
     * Extract original sessionId from encoded session or return as-is
     */
    static extractSessionId(sessionIdOrEncoded: string): string;
    /**
     * Validate decoded session state
     */
    private static validateSessionState;
}
//# sourceMappingURL=SessionEncoder.d.ts.map