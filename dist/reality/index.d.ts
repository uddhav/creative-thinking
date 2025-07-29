/**
 * Reality Assessment Module
 *
 * Implements the Reality Gradient System that enhances creative thinking
 * by annotating ideas with their possibility levels and breakthrough requirements.
 *
 * Instead of blocking "impossible" ideas, this system shows what would need
 * to change for them to become possible, with historical precedents.
 */
import type { RealityAssessment } from '../index.js';
export declare class RealityAssessor {
    /**
     * Assess the reality gradient of an idea or solution
     */
    static assess(idea: string, context: string, domain?: string): RealityAssessment;
    /**
     * Analyze idea for impossibility markers
     */
    private static analyzeIdea;
    /**
     * Check for logical contradictions
     */
    private static hasLogicalContradiction;
    /**
     * Check for physical law violations
     */
    private static violatesPhysicalLaws;
    /**
     * Check for regulatory constraints
     */
    private static hasRegulatoryConstraints;
    /**
     * Check for technical limitations
     */
    private static hasTechnicalLimitations;
    /**
     * Check for resource constraints
     */
    private static hasResourceConstraints;
    /**
     * Find relevant historical precedents
     */
    private static findPrecedents;
    /**
     * Identify required breakthroughs
     */
    private static identifyBreakthroughs;
    /**
     * Generate possibility navigator output
     */
    static generateNavigatorOutput(idea: string, assessment: RealityAssessment): string;
}
//# sourceMappingURL=index.d.ts.map