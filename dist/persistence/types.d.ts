/**
 * Core types and interfaces for session persistence
 */
export type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and' | 'design_thinking' | 'triz';
/**
 * Represents input data for a lateral thinking step
 */
export interface LateralThinkingInput {
    technique: LateralTechnique;
    problem: string;
    currentStep: number;
    totalSteps: number;
    output: string;
    nextStepNeeded: boolean;
    hatColor?: string;
    provocation?: string;
    principles?: string[];
    randomStimulus?: string;
    connections?: string[];
    scamperAction?: string;
    successExample?: string;
    extractedConcepts?: string[];
    abstractedPatterns?: string[];
    applications?: string[];
    initialIdea?: string;
    additions?: string[];
    evaluations?: string[];
    synthesis?: string;
    designStage?: string;
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
    sessionId?: string;
    isRevision?: boolean;
    revisesStep?: number;
    branchFromStep?: number;
    branchId?: string;
}
/**
 * Session state structure for persistence
 */
export interface SessionState {
    id: string;
    problem: string;
    technique: LateralTechnique;
    currentStep: number;
    totalSteps: number;
    history: Array<{
        step: number;
        timestamp: string;
        input: LateralThinkingInput;
        output: LateralThinkingInput;
    }>;
    branches: Record<string, LateralThinkingInput[]>;
    insights: string[];
    startTime?: number;
    endTime?: number;
    metrics?: {
        creativityScore?: number;
        risksCaught?: number;
        antifragileFeatures?: number;
    };
    tags?: string[];
    name?: string;
}
/**
 * Session metadata for listings (lightweight)
 */
export interface SessionMetadata {
    id: string;
    name?: string;
    problem: string;
    technique: LateralTechnique;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    status: 'active' | 'completed' | 'abandoned';
    stepsCompleted: number;
    totalSteps: number;
    tags: string[];
    insights: number;
    branches: number;
    metrics?: {
        creativityScore?: number;
        risksCaught?: number;
        antifragileFeatures?: number;
    };
}
/**
 * Options for listing sessions
 */
export interface ListOptions {
    limit?: number;
    offset?: number;
    sortBy?: 'created' | 'updated' | 'name' | 'technique';
    sortOrder?: 'asc' | 'desc';
    filter?: {
        technique?: LateralTechnique;
        status?: 'active' | 'completed' | 'abandoned';
        dateRange?: {
            start: Date;
            end: Date;
        };
        tags?: string[];
    };
}
/**
 * Search query options
 */
export interface SearchQuery {
    text?: string;
    problem?: string;
    outputs?: string;
    insights?: string;
    matchAll?: boolean;
}
/**
 * Export format options
 */
export type ExportFormat = 'json' | 'markdown' | 'csv';
/**
 * Storage format metadata
 */
export interface StorageFormat {
    version: string;
    format: 'json' | 'binary';
    compressed?: boolean;
    encrypted?: boolean;
}
/**
 * Configuration for persistence adapters
 */
export interface PersistenceConfig {
    adapter: 'filesystem' | 'sqlite' | 'postgres' | 'memory';
    options: {
        path?: string;
        connectionString?: string;
        maxSize?: number;
        autoSave?: boolean;
        saveInterval?: number;
        compression?: boolean;
        encryption?: {
            enabled: boolean;
            key?: string;
        };
    };
}
/**
 * Error codes for persistence operations
 */
export declare enum PersistenceErrorCode {
    NOT_FOUND = "NOT_FOUND",
    ALREADY_EXISTS = "ALREADY_EXISTS",
    INVALID_FORMAT = "INVALID_FORMAT",
    STORAGE_FULL = "STORAGE_FULL",
    PERMISSION_DENIED = "PERMISSION_DENIED",
    CORRUPTION = "CORRUPTION",
    IO_ERROR = "IO_ERROR",
    EXPORT_FAILED = "EXPORT_FAILED"
}
/**
 * Custom error class for persistence operations
 */
export declare class PersistenceError extends Error {
    code: PersistenceErrorCode;
    details?: unknown | undefined;
    constructor(message: string, code: PersistenceErrorCode, details?: unknown | undefined);
}
//# sourceMappingURL=types.d.ts.map