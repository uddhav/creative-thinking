/**
 * Core type definitions for the Creative Thinking MCP Server
 */
import type { PathMemory } from '../ergodicity/index.js';
import type { ErgodicityManager } from '../ergodicity/index.js';
import type { EarlyWarningState, EscapeProtocol } from '../ergodicity/earlyWarning/types.js';
export type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and' | 'design_thinking' | 'triz' | 'neural_state' | 'temporal_work' | 'cross_cultural' | 'collective_intel';
export type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green' | 'purple';
export type ScamperAction = 'substitute' | 'combine' | 'adapt' | 'modify' | 'put_to_other_use' | 'eliminate' | 'reverse' | 'parameterize';
export type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';
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
    realityAssessment?: RealityAssessment;
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
    realityAssessment?: RealityAssessment;
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
        properties: Record<string, any>;
        required?: string[];
        additionalProperties?: boolean;
    };
}
//# sourceMappingURL=index.d.ts.map