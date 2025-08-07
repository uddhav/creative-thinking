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
export declare class SessionEncoder {
    /**
     * Encode session data to base64
     */
    static encode(sessionData: EncodedSessionData): string;
    /**
     * Decode and validate base64 session
     */
    static decode(encodedSession: string): EncodedSessionData | null;
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
}
//# sourceMappingURL=SessionEncoder.d.ts.map