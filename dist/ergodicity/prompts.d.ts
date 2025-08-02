/**
 * Ergodicity awareness prompts for thinking techniques
 * Ensures users consider ensemble vs time averages and ruin risk
 */
import type { LateralTechnique } from '../types/index.js';
export interface ErgodicityPrompt {
    trigger: 'always' | 'high-risk' | 'irreversible';
    promptText: string;
    followUp?: string;
    ruinCheckRequired?: boolean;
}
export interface RuinRiskAssessment {
    domain: string;
    isIrreversible: boolean;
    survivabilityThreatened: boolean;
    ensembleVsTimeAverage: 'ensemble' | 'time' | 'both';
    recommendation: string;
    confidence: number;
    riskFeatures?: {
        hasUndoableActions: boolean;
        timePressure: 'none' | 'low' | 'medium' | 'high' | 'critical';
        expertiseGap: number;
        impactRadius: 'self' | 'limited' | 'broad' | 'systemic';
        uncertaintyLevel: 'low' | 'medium' | 'high';
    };
}
/**
 * Get ergodicity prompts for a specific technique and step
 */
export declare function getErgodicityPrompt(technique: LateralTechnique, step: number, problem: string): ErgodicityPrompt | null;
/**
 * Check if a decision requires ruin risk assessment
 */
export declare function requiresRuinCheck(technique: LateralTechnique, keywords: string[]): boolean;
/**
 * Generate ruin risk assessment prompt
 */
export declare function generateRuinAssessmentPrompt(problem: string, technique: LateralTechnique, proposedAction: string): string;
/**
 * Get technique-specific ergodicity guidance
 */
export declare function getErgodicityGuidance(technique: LateralTechnique): string;
/**
 * Assess ruin risk from user input
 */
export declare function assessRuinRisk(problem: string, technique: LateralTechnique, userResponse: string): RuinRiskAssessment;
/**
 * Generate survival constraints based on risk features
 */
export declare function generateSurvivalConstraints(assessment: RuinRiskAssessment): string[];
//# sourceMappingURL=prompts.d.ts.map