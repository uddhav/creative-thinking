/**
 * Planning layer type definitions
 */

import type { LateralTechnique } from './index.js';

/**
 * Execution mode for thinking sessions
 * - sequential: Execute techniques one after another (default)
 * - parallel: Execute techniques simultaneously
 * - auto: Let the system decide based on problem analysis
 */
export type ExecutionMode = 'sequential' | 'parallel' | 'auto';

/**
 * Method for converging results from parallel executions
 * - execute_thinking_step: Use the special 'convergence' technique
 * - llm_handoff: Return structured data for LLM synthesis
 * - none: Return raw parallel results without convergence
 */
export type ConvergenceMethod = 'execute_thinking_step' | 'llm_handoff' | 'none';

/**
 * Strategy for parallelizing execution
 * - technique: Each technique runs in parallel
 * - step: Steps within techniques run in parallel
 * - hybrid: Combination of both strategies
 */
export type ParallelizationStrategy = 'technique' | 'step' | 'hybrid';

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
  executionMode?: ExecutionMode; // Optional here - can be inferred from problem
  maxParallelism?: number; // Maximum number of parallel branches (default: 3)
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
 * Configuration for converging results from parallel executions
 * @example
 * ```typescript
 * const options: ConvergenceOptions = {
 *   method: 'execute_thinking_step',
 *   convergencePlan: {
 *     planId: 'plan_conv_123',
 *     technique: 'convergence',
 *     estimatedSteps: 3,
 *     requiresAllPlans: true
 *   }
 * };
 * ```
 */
export interface ConvergenceOptions {
  method: ConvergenceMethod;
  convergencePlan?: {
    planId: string;
    technique: 'convergence';
    estimatedSteps: number;
    requiresAllPlans: boolean;
    metadata?: {
      synthesisStrategy?: 'merge' | 'select' | 'hierarchical';
      conflictResolution?: 'vote' | 'weighted' | 'manual';
      minSessionsRequired?: number; // Minimum sessions needed for convergence
      minTechniquesRequired?: number; // Minimum unique techniques needed
    };
  };
  llmHandoff?: {
    promptTemplate?: string;
    includeFullHistory: boolean;
    summaryDepth: 'high' | 'medium' | 'low';
    structuredFormat: 'json' | 'markdown' | 'narrative';
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
  problem?: string; // Optional problem statement for this specific plan
  techniques: LateralTechnique[];
  workflow: TechniqueWorkflow[];
  estimatedTime: string;
  canExecuteIndependently: boolean;
  dependencies?: string[]; // Other planIds this depends on
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
  estimatedTime: string;
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
  convergenceOptions?: ConvergenceOptions;
}

export interface PlanThinkingSessionOutput {
  planId: string;
  problem: string;
  techniques: LateralTechnique[];
  workflow: Array<TechniqueWorkflow>;
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

  // Required field to force awareness of execution modes
  executionMode: ExecutionMode;

  // Additional fields populated when executionMode is 'parallel'
  parallelPlans?: ParallelPlan[];
  coordinationStrategy?: CoordinationStrategy;
  convergenceOptions?: ConvergenceOptions;
}
