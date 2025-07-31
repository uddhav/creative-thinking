/**
 * Planning layer type definitions
 */
import type { LateralTechnique } from './index.js';
export interface TechniqueRecommendation {
    technique: LateralTechnique;
    reasoning: string;
    effectiveness: number;
    alternativeUses?: string[];
}
export interface DiscoverTechniquesInput {
    problem: string;
    context?: string;
    preferredOutcome?: 'innovative' | 'systematic' | 'risk-aware' | 'collaborative' | 'analytical';
    constraints?: string[];
    currentFlexibility?: number;
    sessionId?: string;
}
export interface DiscoverTechniquesOutput {
    problem: string;
    problemCategory: string;
    recommendations: TechniqueRecommendation[];
    integrationSuggestions?: {
        sequence?: string[];
        parallel?: string[];
        conditional?: Array<{
            condition: string;
            technique: LateralTechnique;
        }>;
        optionGeneration?: {
            recommended: boolean;
            reason: string;
            strategies: string[];
        };
    };
    workflow?: {
        phases: Array<{
            name: string;
            techniques: LateralTechnique[];
            focus: string;
        }>;
    };
    warnings?: string[];
    contextAnalysis?: {
        complexity: 'low' | 'medium' | 'high';
        timeConstraint: boolean;
        collaborationNeeded: boolean;
        flexibilityScore?: number;
    };
    complexityAssessment?: {
        level: 'low' | 'medium' | 'high';
        factors: string[];
        suggestion?: string;
    };
    problemAnalysis?: {
        observation: string;
        historicalRelevance: string;
        searchableFactors: string[];
    };
}
export interface ThinkingStep {
    stepNumber: number;
    description: string;
    expectedOutput: string;
    criticalLens?: string;
    risks?: string[];
    successCriteria?: string[];
}
export interface PlanThinkingSessionInput {
    problem: string;
    techniques: LateralTechnique[];
    objectives?: string[];
    constraints?: string[];
    timeframe?: 'quick' | 'thorough' | 'comprehensive';
    includeOptions?: boolean;
    sessionId?: string;
}
export interface PlanThinkingSessionOutput {
    planId: string;
    problem: string;
    techniques: LateralTechnique[];
    workflow: Array<{
        technique: LateralTechnique;
        steps: ThinkingStep[];
        estimatedTime: string;
        requiredInputs?: string[];
        expectedOutputs?: string[];
        integrationPoints?: Array<{
            withTechnique: LateralTechnique;
            atStep: number;
            purpose: string;
        }>;
    }>;
    totalSteps: number;
    estimatedTotalTime: string;
    objectives?: string[];
    constraints?: string[];
    integrationStrategy?: {
        approach: 'sequential' | 'parallel' | 'iterative';
        syncPoints?: number[];
        decisionGates?: Array<{
            afterStep: number;
            criteria: string;
            options: string[];
        }>;
    };
    successMetrics?: string[];
    riskMitigation?: Array<{
        risk: string;
        mitigation: string;
        triggerIndicators: string[];
    }>;
    flexibilityAssessment?: {
        score: number;
        optionGenerationRecommended: boolean;
        escapeRoutes: string[];
    };
    createdAt?: number;
    planningInsights?: {
        techniqueRationale: string;
        sequenceLogic: string;
        historicalNote: string;
    };
    complexityAssessment?: {
        level: 'low' | 'medium' | 'high';
        factors?: string[];
        suggestion?: string;
    };
}
//# sourceMappingURL=planning.d.ts.map