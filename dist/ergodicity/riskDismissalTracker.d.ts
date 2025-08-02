/**
 * Risk Dismissal Tracker
 *
 * Monitors patterns of low-engagement risk assessments and triggers
 * behavioral escalations. Domain-agnostic - responds to engagement
 * quality, not content categories.
 */
import type { RuinRiskAssessment } from './prompts.js';
import type { SessionData } from '../types/index.js';
export interface RiskEngagementMetrics {
    dismissalCount: number;
    averageConfidence: number;
    escalationLevel: number;
    lastSubstantiveEngagement?: string;
    discoveredRiskIndicators: string[];
    consecutiveLowConfidence: number;
    totalAssessments: number;
}
export interface DismissalPattern {
    type: 'consecutive' | 'rapid' | 'contradictory';
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: string[];
}
export declare class RiskDismissalTracker {
    private readonly LOW_CONFIDENCE_THRESHOLD;
    private readonly RAPID_DISMISSAL_WINDOW;
    /**
     * Track a risk assessment and update engagement metrics
     */
    trackAssessment(assessment: RuinRiskAssessment, sessionData: SessionData, proposedAction: string): RiskEngagementMetrics;
    /**
     * Detect dismissal patterns from session history
     */
    detectPatterns(sessionData: SessionData): DismissalPattern[];
    /**
     * Calculate appropriate escalation level
     */
    private calculateEscalationLevel;
    /**
     * Extract risk indicators from assessment
     */
    private extractRiskIndicators;
    /**
     * Check for rapid dismissals
     */
    private checkRapidDismissals;
    /**
     * Find contradictions between assessments and actions
     */
    private findContradictions;
    /**
     * Detect high-stakes indicators from content
     */
    private detectHighStakesIndicators;
    /**
     * Get severity based on consecutive dismissals
     */
    private getConsecutiveSeverity;
    /**
     * Generate behavioral feedback based on patterns
     */
    generateBehavioralFeedback(patterns: DismissalPattern[], metrics: RiskEngagementMetrics): string;
    private generateCriticalFeedback;
    private generateHighFeedback;
    private generateMediumFeedback;
}
//# sourceMappingURL=riskDismissalTracker.d.ts.map