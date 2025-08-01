/**
 * Meta-Learning System for Risk Discovery
 *
 * This system learns from discovery sessions to improve future risk identification
 * without hard-coding domain-specific knowledge.
 */
import type { RiskDiscovery } from '../core/RuinRiskDiscovery.js';
/**
 * Pattern discovered through multiple sessions
 */
export interface DiscoveredPattern {
    id: string;
    domain: string;
    pattern: string;
    frequency: number;
    examples: string[];
    effectiveness: number;
    lastSeen: Date;
}
/**
 * Learning from a discovery session
 */
export interface SessionLearning {
    sessionId: string;
    domain: string;
    timestamp: Date;
    discoveredRisks: string[];
    effectivePrompts: string[];
    missedRisks?: string[];
    falsePositives?: string[];
}
/**
 * Meta-learning system that improves discovery over time
 */
export declare class MetaLearningSystem {
    private patterns;
    private sessionHistory;
    private promptEffectiveness;
    /**
     * Record learning from a discovery session
     */
    recordSession(sessionId: string, domain: string, discovery: RiskDiscovery, actualOutcome?: {
        risksRealized?: string[];
        risksMissed?: string[];
    }): void;
    /**
     * Get improved prompts based on learned patterns
     */
    getEnhancedPrompts(basePrompt: string, domain: string, context: {
        problem: string;
        proposedAction?: string;
    }): string[];
    /**
     * Suggest additional discovery questions based on patterns
     */
    suggestDiscoveryQuestions(domain: string, currentDiscovery: Partial<RiskDiscovery>): string[];
    /**
     * Get confidence in discovery completeness
     */
    assessDiscoveryCompleteness(domain: string, discovery: RiskDiscovery): {
        completeness: number;
        missingAreas: string[];
        confidence: number;
    };
    /**
     * Learn from cross-domain patterns
     */
    private getCrossDomainInsights;
    /**
     * Update patterns based on new discovery
     */
    private updatePatterns;
    /**
     * Get patterns for a specific domain
     */
    private getPatternsForDomain;
    /**
     * Get most effective prompts for a domain
     */
    private getTopPrompts;
    /**
     * Export learned patterns for analysis
     */
    exportPatterns(): {
        patterns: DiscoveredPattern[];
        domainSummary: Record<string, {
            patternCount: number;
            avgEffectiveness: number;
            sessionCount: number;
        }>;
    };
    /**
     * Prune old or ineffective patterns
     */
    prunePatterns(options?: {
        maxAge?: number;
        minEffectiveness?: number;
        minFrequency?: number;
    }): number;
}
//# sourceMappingURL=metaLearning.d.ts.map