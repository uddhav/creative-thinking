/**
 * Core type definitions for the Creative Thinking MCP Server
 */

import type { PathMemory } from '../ergodicity/index.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import type { EarlyWarningState, EscapeProtocol } from '../ergodicity/earlyWarning/types.js';
import type {
  DomainAssessment,
  RiskDiscovery,
  RuinScenario,
  ValidationResult,
} from '../core/RuinRiskDiscovery.js';
import type { ConvergenceOptions } from './planning.js';

// Technique types
export type LateralTechnique =
  | 'six_hats'
  | 'po'
  | 'random_entry'
  | 'scamper'
  | 'concept_extraction'
  | 'yes_and'
  | 'design_thinking'
  | 'triz'
  | 'neural_state'
  | 'temporal_work'
  | 'cross_cultural'
  | 'collective_intel'
  | 'disney_method'
  | 'nine_windows'
  | 'convergence'; // Special technique for synthesizing parallel results

export type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green' | 'purple';
export type ScamperAction =
  | 'substitute'
  | 'combine'
  | 'adapt'
  | 'modify'
  | 'put_to_other_use'
  | 'eliminate'
  | 'reverse'
  | 'parameterize';
export type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';
export type DisneyRole = 'dreamer' | 'realist' | 'critic';

// Reality Assessment types
export type PossibilityLevel = 'impossible' | 'breakthrough-required' | 'difficult' | 'feasible';
export type ImpossibilityType =
  | 'logical'
  | 'physical'
  | 'technical'
  | 'regulatory'
  | 'resource'
  | 'social';

export interface RealityAssessment {
  possibilityLevel: PossibilityLevel;
  impossibilityType?: ImpossibilityType;
  breakthroughsRequired?: string[];
  historicalPrecedents?: string[];
  confidenceLevel: number;
  mechanismExplanation?: string;
}

export interface SequentialThinkingSuggestion {
  complexityNote: string;
  suggestedApproach: {
    [key: string]: string;
  };
}

// Nine Windows types
export interface NineWindowsCell {
  timeFrame: 'past' | 'present' | 'future';
  systemLevel: 'sub-system' | 'system' | 'super-system';
  content: string;
  pathDependencies?: string[];
  irreversible?: boolean;
}

// SCAMPER Path Impact types
export interface ScamperPathImpact {
  reversible: boolean;
  dependenciesCreated: string[];
  optionsClosed: string[];
  optionsOpened: string[];
  flexibilityRetention: number;
  commitmentLevel: 'low' | 'medium' | 'high' | 'irreversible';
  recoveryPath?: string;
}

export interface ScamperModificationHistory {
  action: ScamperAction;
  modification: string;
  timestamp: string;
  impact: ScamperPathImpact;
  cumulativeFlexibility: number;
}

// Session data types
export interface SessionData {
  technique: LateralTechnique;
  problem: string;
  history: Array<ThinkingOperationData & { timestamp: string }>;
  branches: Record<string, ThinkingOperationData[]>;
  insights: string[];
  startTime?: number;
  endTime?: number;
  lastActivityTime: number;
  metrics?: {
    creativityScore?: number;
    risksCaught?: number;
    antifragileFeatures?: number;
  };
  tags?: string[];
  name?: string;
  pathMemory?: PathMemory;
  ergodicityManager?: ErgodicityManager;
  earlyWarningState?: EarlyWarningState;
  escapeRecommendation?: EscapeProtocol;
  riskDiscoveryData?: {
    domainAssessment?: DomainAssessment;
    risks?: RiskDiscovery;
    ruinScenarios?: RuinScenario[];
    constraints?: string[];
    validations?: ValidationResult[];
  };
  riskEngagementMetrics?: {
    dismissalCount: number;
    averageConfidence: number;
    escalationLevel: number;
    lastSubstantiveEngagement?: string; // timestamp
    discoveredRiskIndicators: string[]; // from LLM's own analysis
    consecutiveLowConfidence: number;
    totalAssessments: number;
  };

  /**
   * Link to the parallel execution group this session belongs to
   */
  parallelGroupId?: string;

  /**
   * Whether this is a convergence session that synthesizes parallel results
   */
  isConvergenceSession?: boolean;

  /**
   * Session IDs that must complete before this session can proceed
   */
  dependsOn?: string[];

  /**
   * Metadata for parallel execution
   */
  parallelMetadata?: {
    planId: string;
    techniques: LateralTechnique[];
    canExecuteIndependently: boolean;
  };
}

/**
 * Group of sessions executing in parallel
 * Manages coordination, status tracking, and convergence
 * @example
 * ```typescript
 * const group: ParallelSessionGroup = {
 *   groupId: 'group_123',
 *   sessionIds: ['session_1', 'session_2', 'session_3'],
 *   parentProblem: 'How to improve user retention?',
 *   executionMode: 'parallel',
 *   status: 'active',
 *   startTime: Date.now(),
 *   completedSessions: ['session_1']
 * };
 * ```
 */
export interface ParallelSessionGroup {
  groupId: string;
  sessionIds: string[];
  parentProblem: string;
  executionMode: 'sequential' | 'parallel' | 'auto';
  status: 'active' | 'converging' | 'completed' | 'failed';
  convergenceOptions?: ConvergenceOptions;
  startTime: number;
  completedSessions: string[]; // Changed from Set<string> for better JSON serialization
}

// Execution input type
export interface ExecuteThinkingStepInput {
  planId: string;
  sessionId?: string;
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;
  autoSave?: boolean;

  // Technique-specific fields
  hatColor?: SixHatsColor;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  connections?: string[];
  scamperAction?: ScamperAction;
  modificationHistory?: ScamperModificationHistory[];
  pathImpact?: ScamperPathImpact;
  flexibilityScore?: number;
  alternativeSuggestions?: string[];

  // Concept Extraction specific
  successExample?: string;
  extractedConcepts?: string[];
  abstractedPatterns?: string[];
  applications?: string[];

  // Yes, And... specific
  initialIdea?: string;
  additions?: string[];
  evaluations?: string[];
  synthesis?: string;

  // Design Thinking specific
  designStage?: DesignThinkingStage;
  empathyInsights?: string[];
  problemStatement?: string;
  failureModesPredicted?: string[];
  ideaList?: string[];
  prototypeDescription?: string;
  stressTestResults?: string[];
  userFeedback?: string[];
  failureInsights?: string[];

  // TRIZ specific
  contradiction?: string;
  inventivePrinciples?: string[];
  viaNegativaRemovals?: string[];
  minimalSolution?: string;

  // Unified Framework: Risk/Adversarial fields
  risks?: string[];
  failureModes?: string[];
  mitigations?: string[];
  antifragileProperties?: string[];
  blackSwans?: string[];

  // Revision and branching
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;

  // Neural State specific
  dominantNetwork?: 'dmn' | 'ecn';
  suppressionDepth?: number;
  switchingRhythm?: string[];
  integrationInsights?: string[];

  // Temporal Work specific
  temporalLandscape?: {
    fixedDeadlines?: string[];
    flexibleWindows?: string[];
    pressurePoints?: string[];
    deadZones?: string[];
    kairosOpportunities?: string[];
  };
  circadianAlignment?: string[];
  pressureTransformation?: string[];
  asyncSyncBalance?: string[];
  temporalEscapeRoutes?: string[];

  // Cross-Cultural specific
  culturalFrameworks?: string[];
  bridgeBuilding?: string[];
  respectfulSynthesis?: string[];
  parallelPaths?: string[];

  // Collective Intelligence specific
  wisdomSources?: string[];
  emergentPatterns?: string[];
  synergyCombinations?: string[];
  collectiveInsights?: string[];

  // Disney Method specific
  disneyRole?: DisneyRole;
  dreamerVision?: string[];
  realistPlan?: string[];
  criticRisks?: string[];

  // Nine Windows specific
  nineWindowsMatrix?: NineWindowsCell[];
  currentCell?: {
    timeFrame: 'past' | 'present' | 'future';
    systemLevel: 'sub-system' | 'system' | 'super-system';
  };
  interdependencies?: string[];

  // Reality assessment
  realityAssessment?: RealityAssessment;

  // Ergodicity awareness fields
  ergodicityCheck?: {
    prompt: string;
    followUp?: string;
    guidance: string;
    ruinCheckRequired?: boolean;
  };
  ruinAssessment?: {
    required: boolean;
    prompt: string;
    survivalConstraints: string[];
  };

  /**
   * Results from parallel technique executions (convergence technique only)
   * Contains the outputs from all parallel plans that need to be synthesized
   */
  parallelResults?: Array<{
    planId: string;
    technique: LateralTechnique;
    results: unknown; // Technique-specific results
    insights: string[];
    metrics?: Record<string, number>;
  }>;
  /**
   * Strategy for synthesizing parallel results (convergence technique only)
   * - merge: Combine all results into a unified output
   * - select: Choose the best result based on criteria
   * - hierarchical: Organize results in a hierarchical structure
   */
  convergenceStrategy?: 'merge' | 'select' | 'hierarchical';
}

// Operation data types
export interface ThinkingOperationData {
  sessionId?: string;
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;

  // Technique-specific fields
  hatColor?: SixHatsColor;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  connections?: string[];
  scamperAction?: ScamperAction;
  modificationHistory?: ScamperModificationHistory[];
  pathImpact?: ScamperPathImpact;
  flexibilityScore?: number;
  alternativeSuggestions?: string[];

  // Concept Extraction specific
  successExample?: string;
  extractedConcepts?: string[];
  abstractedPatterns?: string[];
  applications?: string[];

  // Yes, And... specific
  initialIdea?: string;
  additions?: string[];
  evaluations?: string[];
  synthesis?: string;

  // Design Thinking specific
  designStage?: DesignThinkingStage;
  empathyInsights?: string[];
  problemStatement?: string;
  failureModesPredicted?: string[];
  ideaList?: string[];
  prototypeDescription?: string;
  stressTestResults?: string[];
  userFeedback?: string[];
  failureInsights?: string[];

  // TRIZ specific
  contradiction?: string;
  inventivePrinciples?: string[];
  viaNegativaRemovals?: string[];
  minimalSolution?: string;

  // Unified Framework: Risk/Adversarial fields
  risks?: string[];
  failureModes?: string[];
  mitigations?: string[];
  antifragileProperties?: string[];
  blackSwans?: string[];

  // Revision and branching
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;

  // Session management
  autoSave?: boolean;

  // Neural State specific
  dominantNetwork?: 'dmn' | 'ecn';
  suppressionDepth?: number;
  switchingRhythm?: string[];
  integrationInsights?: string[];

  // Temporal Work specific
  temporalLandscape?: {
    fixedDeadlines?: string[];
    flexibleWindows?: string[];
    pressurePoints?: string[];
    deadZones?: string[];
    kairosOpportunities?: string[];
  };
  circadianAlignment?: string[];
  pressureTransformation?: string[];
  asyncSyncBalance?: string[];
  temporalEscapeRoutes?: string[];

  // Cross-Cultural specific
  culturalFrameworks?: string[];
  bridgeBuilding?: string[];
  respectfulSynthesis?: string[];
  parallelPaths?: string[];

  // Collective Intelligence specific
  wisdomSources?: string[];
  emergentPatterns?: string[];
  synergyCombinations?: string[];
  collectiveInsights?: string[];

  // Disney Method specific
  disneyRole?: DisneyRole;
  dreamerVision?: string[];
  realistPlan?: string[];
  criticRisks?: string[];

  // Nine Windows specific
  nineWindowsMatrix?: NineWindowsCell[];
  currentCell?: {
    timeFrame: 'past' | 'present' | 'future';
    systemLevel: 'sub-system' | 'system' | 'super-system';
  };
  interdependencies?: string[];

  // Reality assessment
  realityAssessment?: RealityAssessment;

  // Ergodicity awareness fields
  ergodicityCheck?: {
    prompt: string;
    followUp?: string;
    guidance: string;
    ruinCheckRequired?: boolean;
  };
  ruinAssessment?: {
    required: boolean;
    prompt: string;
    survivalConstraints: string[];
  };
}

export interface SessionOperationData {
  sessionOperation: 'save' | 'load' | 'list' | 'delete' | 'export';

  saveOptions?: {
    sessionName?: string;
    tags?: string[];
    asTemplate?: boolean;
  };

  loadOptions?: {
    sessionId: string;
    continueFrom?: number;
  };

  listOptions?: {
    limit?: number;
    technique?: LateralTechnique;
    status?: 'active' | 'completed' | 'all';
    tags?: string[];
    searchTerm?: string;
  };

  deleteOptions?: {
    sessionId: string;
    confirm?: boolean;
  };

  exportOptions?: {
    sessionId: string;
    format: 'json' | 'markdown' | 'csv';
    outputPath?: string;
  };
}

export type LateralThinkingData = ThinkingOperationData | SessionOperationData;

// Response types
export interface LateralThinkingResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

// Tool types for MCP
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<
      string,
      {
        type?: string;
        description?: string;
        enum?: string[];
        items?: Record<string, unknown>;
        properties?: Record<string, unknown>;
        required?: string[];
        minimum?: number;
        maximum?: number;
        default?: unknown;
      }
    >;
    required?: string[];
    additionalProperties?: boolean;
  };
}

// Export handoff types
export * from './handoff.js';
