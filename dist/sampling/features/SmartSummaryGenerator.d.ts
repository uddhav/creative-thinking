/**
 * SmartSummaryGenerator
 * Uses MCP Sampling to generate intelligent session summaries
 */
import type { SamplingManager } from '../SamplingManager.js';
import type { SessionSummary } from '../types.js';
/**
 * Session step data structure
 */
export interface SessionStep {
    technique?: string;
    currentStep?: number;
    output?: string;
    hatColor?: string;
    scamperAction?: string;
    designStage?: string;
    risks?: string[];
    mitigations?: string[];
}
export interface SessionData {
    sessionId: string;
    problem: string;
    techniques: string[];
    steps: SessionStep[];
    duration?: number;
    completionStatus?: 'completed' | 'in-progress' | 'abandoned';
}
export declare class SmartSummaryGenerator {
    private samplingManager;
    constructor(samplingManager: SamplingManager);
    /**
     * Generate smart summary for a session
     */
    generateSummary(session: SessionData): Promise<SessionSummary>;
    /**
     * Build system prompt for summary generation
     */
    private buildSystemPrompt;
    /**
     * Build user prompt for summary
     */
    private buildUserPrompt;
    /**
     * Format session history for AI consumption
     */
    private formatSessionHistory;
    /**
     * Parse AI response into structured summary
     */
    private parseSummary;
    /**
     * Parse sections from AI response
     */
    private parseSections;
    /**
     * Extract bullet points
     */
    private extractBulletPoints;
    /**
     * Extract ideas from text
     */
    private extractIdeas;
    /**
     * Extract risks from text
     */
    private extractRisks;
    /**
     * Extract action items
     */
    private extractActionItems;
    /**
     * Extract first sentences as fallback
     */
    private extractFirstSentences;
    /**
     * Fallback summary when AI is not available
     */
    private fallbackSummary;
    /**
     * Handle summary generation errors
     */
    private handleError;
    /**
     * Generate summaries for multiple sessions in batch
     */
    generateBatchSummaries(sessions: SessionData[]): Promise<SessionSummary[]>;
}
//# sourceMappingURL=SmartSummaryGenerator.d.ts.map