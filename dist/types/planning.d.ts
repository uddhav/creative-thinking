/**
 * Planning layer type definitions
 */
import type { LateralTechnique } from './index.js';
import type { ExecuteThinkingStepInput } from './index.js';
/**
 * Node in the execution graph representing a single execute_thinking_step call
 */
export interface NodeDependency {
    nodeId: string;
    type: 'hard' | 'soft';
}
export interface ExecutionGraphNode {
    id: string;
    stepNumber: number;
    technique: LateralTechnique;
    parameters: ExecuteThinkingStepInput;
    dependencies: NodeDependency[];
    canSkipIfFailed?: boolean;
}
/**
 * Execution graph for client-controlled execution (sequential or parallel)
 */
export interface ExecutionGraph {
    nodes: ExecutionGraphNode[];
    metadata: {
        totalNodes: number;
        maxParallelism: number;
        criticalPath: string[];
        parallelizableGroups: string[][];
        sequentialTimeMultiplier: string;
    };
    instructions: {
        recommendedStrategy: 'sequential' | 'parallel' | 'hybrid';
        syncPoints: string[];
        sequentialTimeMultiplier: string;
        parallelizationBenefits: string;
        executionGuidance: string;
        errorHandling: string;
    };
}
/**
 * Client-side execution mode for thinking sessions
 * Represents how clients can execute the DAG provided by the server:
 * - sequential: Execute nodes in order for maximum coherence
 * - parallel: Execute independent nodes simultaneously for speed
 * - auto: Server recommendation based on problem analysis
 *
 * Note: The server processes steps independently regardless of client execution mode
 */
export type ExecutionMode = 'sequential' | 'parallel' | 'auto';
/**
 * Client-side strategy for parallelizing execution
 * - technique: Each technique runs in parallel
 * - step: Steps within techniques run in parallel
 * - hybrid: Combination of both strategies
 *
 * Used in DAG generation to suggest parallelization opportunities to clients
 */
export type ParallelizationStrategy = 'technique' | 'step' | 'hybrid';
export interface TechniqueRecommendation {
    technique: LateralTechnique;
    reasoning: string;
    effectiveness: number;
    alternativeUses?: string[];
    isWildcard?: boolean;
}
export interface DiscoverTechniquesInput {
    problem: string;
    context?: string;
    preferredOutcome?: 'innovative' | 'systematic' | 'risk-aware' | 'collaborative' | 'analytical';
    constraints?: string[];
    currentFlexibility?: number;
    sessionId?: string;
    executionMode?: ExecutionMode;
    maxParallelism?: number;
    persona?: string;
    personas?: string[];
    debateTopic?: string;
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
        riskAwareness?: {
            required: boolean;
            risks: Array<{
                category: string;
                severity: string;
                description: string;
            }>;
            mitigationStrategies: string[];
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
    personaContext?: {
        activePersonas: Array<{
            id: string;
            name: string;
            tagline: string;
        }>;
        isDebateMode: boolean;
    };
    problemAnalysis?: {
        observation: string;
        historicalRelevance: string;
        searchableFactors: string[];
    };
    riskAssessment?: {
        overallRiskLevel: string;
        requiresErgodicityCheck: boolean;
        requiresRuinCheck: boolean;
        identifiedRisks: Array<{
            id: string;
            category: string;
            severity: string;
            description: string;
            probability: number;
            impact: number;
            isAbsorbingBarrier: boolean;
        }>;
        blockedActions: string[];
        alternativeApproaches: string[];
    };
}
export interface ThinkingStep {
    stepNumber: number;
    description: string;
    expectedOutput: string;
    criticalLens?: string;
    risks?: string[];
    successCriteria?: string[];
    ergodicityCheck?: {
        required: boolean;
        prompt: string;
        minimumResponseLength?: number;
    };
}
/**
 * Strategy for coordinating parallel executions
 * Defines sync points, shared context, and error handling
 * @example
 * ```typescript
 * const strategy: CoordinationStrategy = {
 *   syncPoints: [{
 *     afterPlanIds: ['plan1', 'plan2'],
 *     action: 'checkpoint'
 *   }],
 *   errorHandling: 'partial_results'
 * };
 * ```
 */
export interface CoordinationStrategy {
    syncPoints?: Array<{
        afterPlanIds: string[];
        action: 'wait' | 'checkpoint' | 'merge_context';
    }>;
    sharedContext?: {
        enabled: boolean;
        updateStrategy: 'immediate' | 'batched' | 'checkpoint';
    };
    errorHandling: 'fail_fast' | 'partial_results' | 'retry';
}
/**
 * Individual plan within a parallel execution group
 * Each plan can execute independently or with dependencies
 */
export interface ParallelPlan {
    planId: string;
    problem?: string;
    techniques: LateralTechnique[];
    workflow: TechniqueWorkflow[];
    canExecuteIndependently: boolean;
    dependencies?: string[];
    metadata?: {
        techniqueCount: number;
        totalSteps: number;
        complexity: 'low' | 'medium' | 'high';
    };
}
/**
 * Workflow definition for a single technique
 * Contains steps, timing, and integration points
 */
export interface TechniqueWorkflow {
    technique: LateralTechnique;
    steps: ThinkingStep[];
    requiredInputs?: string[];
    expectedOutputs?: string[];
    integrationPoints?: Array<{
        withTechnique: LateralTechnique;
        atStep: number;
        purpose: string;
    }>;
}
export interface PlanThinkingSessionInput {
    problem: string;
    techniques: LateralTechnique[];
    objectives?: string[];
    constraints?: string[];
    timeframe?: 'quick' | 'thorough' | 'comprehensive';
    includeOptions?: boolean;
    sessionId?: string;
    executionMode?: ExecutionMode;
    maxParallelism?: number;
    parallelizationStrategy?: ParallelizationStrategy;
    persona?: string;
    personas?: string[];
    debateFormat?: 'structured' | 'adversarial' | 'collaborative';
}
export interface PlanThinkingSessionOutput {
    planId: string;
    problem: string;
    techniques: LateralTechnique[];
    workflow: Array<TechniqueWorkflow>;
    totalSteps: number;
    objectives?: string[];
    constraints?: string[];
    executionGraph?: ExecutionGraph;
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
    executionMode: ExecutionMode;
    parallelPlans?: ParallelPlan[];
    coordinationStrategy?: CoordinationStrategy;
    parallelGroupIds?: string[];
    personaContext?: {
        activePersonas: Array<{
            id: string;
            name: string;
            tagline: string;
        }>;
        isDebateMode: boolean;
    };
    debateOutline?: {
        personaPlans: Array<{
            personaId: string;
            planId: string;
            techniques: LateralTechnique[];
        }>;
        synthesisPlanId?: string;
    };
}
//# sourceMappingURL=planning.d.ts.map