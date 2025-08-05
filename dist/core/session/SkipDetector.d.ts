/**
 * SkipDetector - Detects patterns in skipped steps and techniques
 * Provides insights into user behavior and potential workflow issues
 */
import type { SessionData, LateralTechnique } from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
/**
 * Skip pattern types
 */
export type SkipPattern = 'early_termination' | 'technique_avoidance' | 'critical_step_skip' | 'rush_through' | 'selective_engagement' | 'fatigue_pattern' | 'risk_avoidance';
/**
 * Skip detection result
 */
export interface SkipDetectionResult {
    patternsDetected: SkipPattern[];
    skipRate: number;
    averageCompletionPerTechnique: Record<LateralTechnique, number>;
    criticalSkips: Array<{
        technique: LateralTechnique;
        step: string;
        reason: string;
    }>;
    recommendations: string[];
    riskScore: number;
}
/**
 * Detects skip patterns in thinking sessions
 */
export declare class SkipDetector {
    private readonly RUSH_THRESHOLD_SECONDS;
    private readonly MIN_OUTPUT_LENGTH;
    private readonly CRITICAL_COMPLETION_THRESHOLD;
    /**
     * Analyze session for skip patterns
     */
    analyzeSession(session: SessionData, plan?: PlanThinkingSessionOutput): SkipDetectionResult;
    /**
     * Analyze multiple sessions for user patterns
     */
    analyzeUserPatterns(sessions: SessionData[]): {
        consistentPatterns: SkipPattern[];
        problematicTechniques: LateralTechnique[];
        overallSkipRate: number;
        improvementTrend: 'improving' | 'declining' | 'stable';
    };
    /**
     * Calculate session statistics
     */
    private calculateSessionStats;
    /**
     * Detect skip patterns
     */
    private detectPatterns;
    /**
     * Identify critical skipped steps
     */
    private identifyCriticalSkips;
    /**
     * Generate recommendations based on patterns
     */
    private generateRecommendations;
    /**
     * Calculate risk score based on patterns
     */
    private calculateRiskScore;
    /**
     * Calculate average completion per technique
     */
    private calculateAverageCompletion;
    /**
     * Calculate engagement variance across techniques
     */
    private calculateEngagementVariance;
}
//# sourceMappingURL=SkipDetector.d.ts.map