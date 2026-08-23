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
  | 'collective_intel'
  | 'disney_method'
  | 'nine_windows'
  | 'quantum_superposition'
  | 'temporal_creativity'
  | 'paradoxical_problem'
  | 'meta_learning'
  | 'biomimetic_path'
  | 'first_principles'
  | 'cultural_integration'
  | 'neuro_computational'
  | 'criteria_based_analysis'
  | 'linguistic_forensics'
  | 'competing_hypotheses'
  | 'reverse_benchmarking'
  | 'context_reframing'
  | 'perception_optimization'
  | 'anecdotal_signal'
  | 'cognitive_bias_audit'
  | 'latticework'
  | 'keeper_test'
  | 'steelman_red_team';

// Single source of truth for all lateral techniques
// This ensures consistency across the codebase when iterating over all techniques
export const ALL_LATERAL_TECHNIQUES: readonly LateralTechnique[] = [
  'six_hats',
  'po',
  'random_entry',
  'scamper',
  'concept_extraction',
  'yes_and',
  'design_thinking',
  'triz',
  'neural_state',
  'temporal_work',
  'collective_intel',
  'disney_method',
  'nine_windows',
  'quantum_superposition',
  'temporal_creativity',
  'paradoxical_problem',
  'meta_learning',
  'biomimetic_path',
  'first_principles',
  'cultural_integration',
  'neuro_computational',
  'criteria_based_analysis',
  'linguistic_forensics',
  'competing_hypotheses',
  'reverse_benchmarking',
  'context_reframing',
  'perception_optimization',
  'anecdotal_signal',
  'cognitive_bias_audit',
  'latticework',
  'keeper_test',
  'steelman_red_team',
] as const;

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
  /**
   * The prior step's output text. No longer emitted: the caller wrote it,
   * history holds it, and the session export returns it whole. Optional so
   * sessions persisted before the field was dropped still load.
   */
  modification?: string;
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
  planId?: string;
  totalSteps?: number;
  metrics?: {
    /** 0-1 coverage of the outputs the technique asks for. See MetricsCollector. */
    outputCompleteness?: number;
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
    problemDomain?: string; // Track the domain for appropriate escalation
  };
}

// Execution input type
export interface ExecuteThinkingStepInput {
  /**
   * Server-computed: the step's position within its own technique, as opposed
   * to `currentStep`, which counts across the whole plan. Never sent by a
   * caller — `executeThinkingStep` derives it and records it on the history
   * entry so handlers can index their own step tables.
   */
  techniqueLocalStep?: number;
  planId: string;
  sessionId?: string;
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;
  autoSave?: boolean;
  persona?: string; // Which persona is speaking (for debate mode)

  // Technique-specific fields
  hatColor?: SixHatsColor;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  /** Draw the stimulus from the behavioural-economics catalogue. */
  roryMode?: boolean;
  connections?: string[];
  scamperAction?: ScamperAction;
  modificationHistory?: ScamperModificationHistory[];
  pathImpact?: ScamperPathImpact;
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

  // Bounded caller reversibility claim: moves the step's applied
  // reversibility at most one rung from the handler-static prior, and only
  // with a rationale. The audit of what was applied comes back as
  // executionMetadata.appliedReversibility.
  stepReversibility?: {
    level: 'high' | 'medium' | 'low';
    rationale: string;
  };
  // Server-computed audit of a stepReversibility claim (set by the execution
  // layer; anything the caller sends here is overwritten or ignored).
  appliedReversibility?: {
    prior: 'high' | 'medium' | 'low' | 'very_low';
    claimed: 'high' | 'medium' | 'low';
    applied: 'high' | 'medium' | 'low' | 'very_low';
    clamped: boolean;
  };

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

  // Quantum Superposition specific
  solutionStates?: string[];
  interferencePatterns?: {
    constructive?: string[];
    destructive?: string[];
    hybrid?: string[];
  };
  entanglements?: Array<{
    states: string[];
    dependency: string;
  }>;
  amplitudes?: Record<string, number>;
  measurementCriteria?: string[];
  chosenState?: string;
  preservedInsights?: string[];

  // Temporal Creativity specific
  pathHistory?: Array<{
    decision: string;
    impact: string;
    constraintsCreated?: string[];
    optionsClosed?: string[];
  }>;
  decisionPatterns?: string[];
  currentConstraints?: string[];
  activeOptions?: string[];
  timelineProjections?: {
    bestCase?: string[];
    probableCase?: string[];
    worstCase?: string[];
    blackSwanScenarios?: string[];
    antifragileDesign?: string[];
  };
  delayOptions?: string[];
  accelerationOptions?: string[];
  parallelTimelines?: string[];
  lessonIntegration?: string[];
  strategyEvolution?: string;
  synthesisStrategy?: string;
  preservedOptions?: string[];

  // Meta-Learning specific
  patternRecognition?: string[];
  patterns?: string[]; // Alternative to patternRecognition
  learningHistory?: string[];
  accumulatedLearning?: string[]; // Alternative to learningHistory
  strategyAdaptations?: string[];
  metaSynthesis?: string;

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
   * Completion tracking metadata
   * Tracks progress through planned workflow and identifies gaps
   */
  completionMetadata?: {
    overallProgress: number;
    totalPlannedSteps: number;
    completedSteps: number;
    techniqueStatuses: Array<{
      technique: LateralTechnique;
      completionPercentage: number;
      skippedSteps: number[];
    }>;
    skippedTechniques: LateralTechnique[];
    missedPerspectives: string[];
    completionWarnings: string[];
    minimumThresholdMet: boolean;
  };

  // First Principles specific (alternative fields)
  components?: string[]; // Step 1: fundamental components
  breakdown?: string[]; // Alternative to components
  fundamentalTruths?: string[]; // Step 2: identified truths
  foundations?: string[]; // Alternative to fundamentalTruths
  assumptions?: string[]; // Step 3: assumptions to challenge
  challenges?: string[]; // Alternative to assumptions
  reconstruction?: string; // Step 4: rebuilt solution
  rebuilding?: string; // Alternative to reconstruction
  solution?: string; // Step 5: final solution

  // Biomimetic Path specific (alternative fields)
  immuneResponse?: string[];
  antibodies?: string[]; // Alternative to immuneResponse
  mutations?: string[];
  selectionPressure?: string; // Alternative to mutations
  symbioticRelationships?: string[];
  ecosystemBalance?: string; // Alternative to symbioticRelationships
  swarmBehavior?: string[];
  resiliencePatterns?: string[];
  redundancy?: string[]; // Alternative to resiliencePatterns
  naturalSynthesis?: string;
  integratedSolution?: string; // Alternative to naturalSynthesis
  biologicalStrategies?: string[]; // Alternative to naturalSynthesis

  // NeuroComputational specific
  neuralMappings?: string[];
  patternGenerations?: string[];
  interferenceAnalysis?: {
    constructive: string[];
    destructive: string[];
  };
  computationalModels?: string[];
  optimizationCycles?: number;
  convergenceMetrics?: {
    coherence?: number;
    novelty?: number;
    utility?: number;
  };
  finalSynthesis?: string;

  // Paradoxical Problem specific
  paradox?: string;
  contradictions?: string[]; // Alternative to paradox (in addition to contradiction field above)
  solutionA?: string;
  solutionB?: string;
  // parallelPaths already defined above
  metaPath?: string;
  bridge?: string;
  validation?: string;
  pathContexts?: string[];
  resolutionVerified?: boolean;
}

// Operation data types
export interface ThinkingOperationData {
  /**
   * Server-computed: the step's position within its own technique, as opposed
   * to `currentStep`, which counts across the whole plan. Handlers index their
   * own step tables, so this is the number they need.
   */
  techniqueLocalStep?: number;
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
  /** Draw the stimulus from the behavioural-economics catalogue. */
  roryMode?: boolean;
  connections?: string[];
  scamperAction?: ScamperAction;
  modificationHistory?: ScamperModificationHistory[];
  pathImpact?: ScamperPathImpact;
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

  // Bounded caller reversibility claim: moves the step's applied
  // reversibility at most one rung from the handler-static prior, and only
  // with a rationale. The audit of what was applied comes back as
  // executionMetadata.appliedReversibility.
  stepReversibility?: {
    level: 'high' | 'medium' | 'low';
    rationale: string;
  };
  // Server-computed audit of a stepReversibility claim (set by the execution
  // layer; anything the caller sends here is overwritten or ignored).
  appliedReversibility?: {
    prior: 'high' | 'medium' | 'low' | 'very_low';
    claimed: 'high' | 'medium' | 'low';
    applied: 'high' | 'medium' | 'low' | 'very_low';
    clamped: boolean;
  };

  // Revision and branching
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;

  // Session management
  autoSave?: boolean;

  // Persona
  persona?: string;

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

  // Quantum Superposition specific
  solutionStates?: string[];
  interferencePatterns?: {
    constructive?: string[];
    destructive?: string[];
    hybrid?: string[];
  };
  entanglements?: Array<{
    states: string[];
    dependency: string;
  }>;
  amplitudes?: Record<string, number>;
  measurementCriteria?: string[];
  chosenState?: string;
  preservedInsights?: string[];

  // Temporal Creativity specific
  pathHistory?: Array<{
    decision: string;
    impact: string;
    constraintsCreated?: string[];
    optionsClosed?: string[];
  }>;
  decisionPatterns?: string[];
  currentConstraints?: string[];
  activeOptions?: string[];
  timelineProjections?: {
    bestCase?: string[];
    probableCase?: string[];
    worstCase?: string[];
    blackSwanScenarios?: string[];
    antifragileDesign?: string[];
  };
  delayOptions?: string[];
  accelerationOptions?: string[];
  parallelTimelines?: string[];
  lessonIntegration?: string[];
  strategyEvolution?: string;
  synthesisStrategy?: string;
  preservedOptions?: string[];

  // Meta-Learning specific
  patternRecognition?: string[];
  patterns?: string[]; // Alternative to patternRecognition
  learningHistory?: string[];
  accumulatedLearning?: string[]; // Alternative to learningHistory
  strategyAdaptations?: string[];
  metaSynthesis?: string;

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

  // Paradoxical Problem specific
  paradox?: string;
  contradictions?: string[]; // Note: contradiction (singular) already exists for TRIZ
  solutionA?: string;
  solutionB?: string;
  metaPath?: string;
  bridge?: string;
  validation?: string;
  pathContexts?: string[];
  resolutionVerified?: boolean;

  // Neuro-Computational specific
  neuralMappings?: string[];
  patternGenerations?: string[];
  interferenceAnalysis?: {
    constructive: string[];
    destructive: string[];
  };
  computationalModels?: string[];
  optimizationCycles?: number;
  convergenceMetrics?: {
    coherence?: number;
    novelty?: number;
    utility?: number;
  };
  finalSynthesis?: string;
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

// The planning layer's input and output types.
//
// `src/index.ts` already re-exports these, so callers of the package see them;
// `src/types/index.ts` did not, and a dozen test files import them from here
// regardless. They were right about where the types belong — this is the types
// barrel — and the imports have been silently broken the whole time because
// tests are not typechecked.
export * from './planning.js';

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
        exclusiveMinimum?: number;
        minLength?: number;
        maxLength?: number;
        maxItems?: number;
        default?: unknown;
        /**
         * The shape of values under keys the schema cannot name in advance —
         * probabilities keyed by hypothesis, ratings keyed by pairing. Without
         * it the only place left to say "these are numbers between 0 and 1" was
         * the prose description, where nothing can check it.
         */
        additionalProperties?: Record<string, unknown>;
        /** A field read in more than one shape, e.g. antiMimeticStrategy. */
        anyOf?: Array<Record<string, unknown>>;
      }
    >;
    required?: string[];
    additionalProperties?: boolean;
    /**
     * Alternative shapes for the whole call. `execute_thinking_step` takes
     * either a thinking step or a session operation, and a single `required`
     * list cannot say that — it demanded the seven thinking-step fields of
     * every call, including the session operations the server has always
     * accepted.
     */
    oneOf?: Array<{ required: string[] }>;
  };
}

// Analytical Verification Types (for Criteria-Based Analysis, Linguistic Forensics, Competing Hypotheses)

export interface ValidityAssessment {
  validityScore: number; // 0-100
  confidenceBounds: { lower: number; upper: number };
  criteria: string[];
  pathDependentFactors: string[];
  assessmentType: 'baseline' | 'cognitive' | 'motivational' | 'reality' | 'synthesis';
}

export interface LinguisticMarkers {
  pronounRatios: {
    iWe: number; // Individual vs collective
    activePassive: number;
    ownershipAvoidance: number;
  };
  complexityMetrics: {
    avgSentenceLength: number;
    lexicalDiversity: number; // unique words / total words
    abstractionLevel: number; // 0-1 scale
  };
  emotionalProfile: {
    valence: 'positive' | 'negative' | 'neutral';
    intensity: number; // 0-1 scale
    trajectory: 'stable' | 'increasing' | 'decreasing' | 'volatile';
  };
  coherenceScore: number; // 0-100
}

export interface HypothesisMatrix {
  hypotheses: string[];
  evidence: string[];
  ratings: Record<string, number>; // evidence_hypothesis -> -2 to +2
  diagnosticValue: Record<string, number>; // evidence -> 0-1
  probabilities: Record<string, number>; // hypothesis -> 0-1
  sensitivityFactors: string[];
}
