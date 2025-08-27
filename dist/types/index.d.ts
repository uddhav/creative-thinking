/**
 * Core type definitions for the Creative Thinking MCP Server
 */
import type { PathMemory } from '../ergodicity/index.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import type { EarlyWarningState, EscapeProtocol } from '../ergodicity/earlyWarning/types.js';
import type { DomainAssessment, RiskDiscovery, RuinScenario, ValidationResult } from '../core/RuinRiskDiscovery.js';
export type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and' | 'design_thinking' | 'triz' | 'neural_state' | 'temporal_work' | 'collective_intel' | 'disney_method' | 'nine_windows' | 'quantum_superposition' | 'temporal_creativity' | 'paradoxical_problem' | 'meta_learning' | 'biomimetic_path' | 'first_principles' | 'cultural_integration' | 'neuro_computational' | 'criteria_based_analysis' | 'linguistic_forensics' | 'competing_hypotheses' | 'reverse_benchmarking' | 'context_reframing' | 'perception_optimization' | 'anecdotal_signal';
export declare const ALL_LATERAL_TECHNIQUES: readonly LateralTechnique[];
export type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green' | 'purple';
export type ScamperAction = 'substitute' | 'combine' | 'adapt' | 'modify' | 'put_to_other_use' | 'eliminate' | 'reverse' | 'parameterize';
export type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';
export type DisneyRole = 'dreamer' | 'realist' | 'critic';
export type PossibilityLevel = 'impossible' | 'breakthrough-required' | 'difficult' | 'feasible';
export type ImpossibilityType = 'logical' | 'physical' | 'technical' | 'regulatory' | 'resource' | 'social';
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
export interface NineWindowsCell {
    timeFrame: 'past' | 'present' | 'future';
    systemLevel: 'sub-system' | 'system' | 'super-system';
    content: string;
    pathDependencies?: string[];
    irreversible?: boolean;
}
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
export interface SessionData {
    technique: LateralTechnique;
    problem: string;
    history: Array<ThinkingOperationData & {
        timestamp: string;
    }>;
    branches: Record<string, ThinkingOperationData[]>;
    insights: string[];
    startTime?: number;
    endTime?: number;
    lastActivityTime: number;
    planId?: string;
    totalSteps?: number;
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
        lastSubstantiveEngagement?: string;
        discoveredRiskIndicators: string[];
        consecutiveLowConfidence: number;
        totalAssessments: number;
        problemDomain?: string;
    };
}
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
    successExample?: string;
    extractedConcepts?: string[];
    abstractedPatterns?: string[];
    applications?: string[];
    initialIdea?: string;
    additions?: string[];
    evaluations?: string[];
    synthesis?: string;
    designStage?: DesignThinkingStage;
    empathyInsights?: string[];
    problemStatement?: string;
    failureModesPredicted?: string[];
    ideaList?: string[];
    prototypeDescription?: string;
    stressTestResults?: string[];
    userFeedback?: string[];
    failureInsights?: string[];
    contradiction?: string;
    inventivePrinciples?: string[];
    viaNegativaRemovals?: string[];
    minimalSolution?: string;
    risks?: string[];
    failureModes?: string[];
    mitigations?: string[];
    antifragileProperties?: string[];
    blackSwans?: string[];
    isRevision?: boolean;
    revisesStep?: number;
    branchFromStep?: number;
    branchId?: string;
    dominantNetwork?: 'dmn' | 'ecn';
    suppressionDepth?: number;
    switchingRhythm?: string[];
    integrationInsights?: string[];
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
    culturalFrameworks?: string[];
    bridgeBuilding?: string[];
    respectfulSynthesis?: string[];
    parallelPaths?: string[];
    wisdomSources?: string[];
    emergentPatterns?: string[];
    synergyCombinations?: string[];
    collectiveInsights?: string[];
    disneyRole?: DisneyRole;
    dreamerVision?: string[];
    realistPlan?: string[];
    criticRisks?: string[];
    nineWindowsMatrix?: NineWindowsCell[];
    currentCell?: {
        timeFrame: 'past' | 'present' | 'future';
        systemLevel: 'sub-system' | 'system' | 'super-system';
    };
    interdependencies?: string[];
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
    patternRecognition?: string[];
    patterns?: string[];
    learningHistory?: string[];
    accumulatedLearning?: string[];
    strategyAdaptations?: string[];
    feedbackInsights?: string[];
    metaSynthesis?: string;
    realityAssessment?: RealityAssessment;
    culturalContexts?: string[];
    powerDynamics?: string[];
    naturalConnections?: string[];
    frictionZones?: string[];
    translationProtocols?: string[];
    trustMechanisms?: string[];
    attributionMap?: Record<string, string>;
    authenticityMeasures?: string[];
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
    components?: string[];
    breakdown?: string[];
    fundamentalTruths?: string[];
    foundations?: string[];
    assumptions?: string[];
    challenges?: string[];
    reconstruction?: string;
    rebuilding?: string;
    solution?: string;
    immuneResponse?: string[];
    antibodies?: string[];
    mutations?: string[];
    selectionPressure?: string;
    symbioticRelationships?: string[];
    ecosystemBalance?: string;
    swarmBehavior?: string[];
    resiliencePatterns?: string[];
    redundancy?: string[];
    naturalSynthesis?: string;
    integratedSolution?: string;
    biologicalStrategies?: string[];
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
    paradox?: string;
    contradictions?: string[];
    solutionA?: string;
    solutionB?: string;
    metaPath?: string;
    bridge?: string;
    validation?: string;
    pathContexts?: string[];
    resolutionVerified?: boolean;
}
export interface ThinkingOperationData {
    sessionId?: string;
    technique: LateralTechnique;
    problem: string;
    currentStep: number;
    totalSteps: number;
    output: string;
    nextStepNeeded: boolean;
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
    successExample?: string;
    extractedConcepts?: string[];
    abstractedPatterns?: string[];
    applications?: string[];
    initialIdea?: string;
    additions?: string[];
    evaluations?: string[];
    synthesis?: string;
    designStage?: DesignThinkingStage;
    empathyInsights?: string[];
    problemStatement?: string;
    failureModesPredicted?: string[];
    ideaList?: string[];
    prototypeDescription?: string;
    stressTestResults?: string[];
    userFeedback?: string[];
    failureInsights?: string[];
    contradiction?: string;
    inventivePrinciples?: string[];
    viaNegativaRemovals?: string[];
    minimalSolution?: string;
    risks?: string[];
    failureModes?: string[];
    mitigations?: string[];
    antifragileProperties?: string[];
    blackSwans?: string[];
    isRevision?: boolean;
    revisesStep?: number;
    branchFromStep?: number;
    branchId?: string;
    autoSave?: boolean;
    dominantNetwork?: 'dmn' | 'ecn';
    suppressionDepth?: number;
    switchingRhythm?: string[];
    integrationInsights?: string[];
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
    culturalFrameworks?: string[];
    bridgeBuilding?: string[];
    respectfulSynthesis?: string[];
    parallelPaths?: string[];
    wisdomSources?: string[];
    emergentPatterns?: string[];
    synergyCombinations?: string[];
    collectiveInsights?: string[];
    disneyRole?: DisneyRole;
    dreamerVision?: string[];
    realistPlan?: string[];
    criticRisks?: string[];
    nineWindowsMatrix?: NineWindowsCell[];
    currentCell?: {
        timeFrame: 'past' | 'present' | 'future';
        systemLevel: 'sub-system' | 'system' | 'super-system';
    };
    interdependencies?: string[];
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
    patternRecognition?: string[];
    patterns?: string[];
    learningHistory?: string[];
    accumulatedLearning?: string[];
    strategyAdaptations?: string[];
    feedbackInsights?: string[];
    metaSynthesis?: string;
    realityAssessment?: RealityAssessment;
    culturalContexts?: string[];
    powerDynamics?: string[];
    naturalConnections?: string[];
    frictionZones?: string[];
    translationProtocols?: string[];
    trustMechanisms?: string[];
    attributionMap?: Record<string, string>;
    authenticityMeasures?: string[];
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
    paradox?: string;
    contradictions?: string[];
    solutionA?: string;
    solutionB?: string;
    metaPath?: string;
    bridge?: string;
    validation?: string;
    pathContexts?: string[];
    resolutionVerified?: boolean;
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
export interface LateralThinkingResponse {
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}
export interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, {
            type?: string;
            description?: string;
            enum?: string[];
            items?: Record<string, unknown>;
            properties?: Record<string, unknown>;
            required?: string[];
            minimum?: number;
            maximum?: number;
            default?: unknown;
        }>;
        required?: string[];
        additionalProperties?: boolean;
    };
}
export interface ValidityAssessment {
    validityScore: number;
    confidenceBounds: {
        lower: number;
        upper: number;
    };
    criteria: string[];
    pathDependentFactors: string[];
    assessmentType: 'baseline' | 'cognitive' | 'motivational' | 'reality' | 'synthesis';
}
export interface LinguisticMarkers {
    pronounRatios: {
        iWe: number;
        activePassive: number;
        ownershipAvoidance: number;
    };
    complexityMetrics: {
        avgSentenceLength: number;
        lexicalDiversity: number;
        abstractionLevel: number;
    };
    emotionalProfile: {
        valence: 'positive' | 'negative' | 'neutral';
        intensity: number;
        trajectory: 'stable' | 'increasing' | 'decreasing' | 'volatile';
    };
    coherenceScore: number;
}
export interface HypothesisMatrix {
    hypotheses: string[];
    evidence: string[];
    ratings: Record<string, number>;
    diagnosticValue: Record<string, number>;
    probabilities: Record<string, number>;
    sensitivityFactors: string[];
}
//# sourceMappingURL=index.d.ts.map