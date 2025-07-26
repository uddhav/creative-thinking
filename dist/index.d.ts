#!/usr/bin/env node
export type LateralTechnique = 'six_hats' | 'po' | 'random_entry' | 'scamper' | 'concept_extraction' | 'yes_and' | 'design_thinking' | 'triz';
export type SixHatsColor = 'blue' | 'white' | 'red' | 'yellow' | 'black' | 'green';
export type ScamperAction = 'substitute' | 'combine' | 'adapt' | 'modify' | 'put_to_other_use' | 'eliminate' | 'reverse';
export type DesignThinkingStage = 'empathize' | 'define' | 'ideate' | 'prototype' | 'test';
export interface LateralThinkingData {
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
    sessionOperation?: 'save' | 'load' | 'list' | 'delete' | 'export';
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
    autoSave?: boolean;
}
export declare class LateralThinkingServer {
    private sessions;
    private plans;
    private currentSessionId;
    private disableThoughtLogging;
    private readonly SESSION_TTL;
    private readonly PLAN_TTL;
    private cleanupInterval;
    private persistenceAdapter;
    constructor();
    private initializePersistence;
    private startSessionCleanup;
    private cleanupOldSessions;
    destroy(): void;
    /**
     * Handle session management operations
     */
    private handleSessionOperation;
    /**
     * Save current session
     */
    private handleSaveOperation;
    /**
     * Load a saved session
     */
    private handleLoadOperation;
    /**
     * List saved sessions
     */
    private handleListOperation;
    /**
     * Delete a saved session
     */
    private handleDeleteOperation;
    /**
     * Export a session
     */
    private handleExportOperation;
    /**
     * Save session to persistence adapter
     */
    private saveSessionToPersistence;
    /**
     * Format session list for visual output
     */
    private formatSessionList;
    /**
     * Get emoji for technique
     */
    private getTechniqueEmoji;
    /**
     * Format progress bar
     */
    private formatProgress;
    /**
     * Format time ago
     */
    private formatTimeAgo;
    /**
     * Get enhanced Six Thinking Hats information including Black Swan awareness
     * @param color - The hat color to get information for
     * @returns Hat information with name, focus, emoji, and enhanced focus
     */
    private getSixHatsInfo;
    /**
     * Get SCAMPER action information with pre-mortem risk questions
     * @param action - The SCAMPER action to get information for
     * @returns Action information with description, emoji, and risk question
     */
    private getScamperInfo;
    /**
     * Get Design Thinking stage information with embedded risk management
     * @param stage - The Design Thinking stage to get information for
     * @returns Stage information with description, emoji, and critical lens
     */
    private getDesignThinkingInfo;
    private validateInput;
    /**
     * Get critical thinking steps for a technique where adversarial mode is emphasized
     * @param technique - The lateral thinking technique
     * @returns Array of step numbers that are critical/adversarial
     */
    private getCriticalSteps;
    /**
     * Determine whether current step is in creative or critical mode
     * @param data - The lateral thinking data with current step info
     * @returns Color and symbol for visual mode indication
     */
    private getModeIndicator;
    /**
     * Truncate a word if it exceeds maximum length to prevent layout breaking
     * @param word - The word to potentially truncate
     * @param maxLength - Maximum allowed length
     * @returns Truncated word with ellipsis if needed
     */
    private truncateWord;
    /**
     * Format the risk identification section for visual output
     * @param risks - Array of identified risks
     * @param maxLength - Maximum line length for formatting
     * @returns Formatted lines for the risk section
     */
    private formatRiskSection;
    /**
     * Format the mitigation strategies section for visual output
     * @param mitigations - Array of mitigation strategies
     * @param maxLength - Maximum line length for formatting
     * @param hasRisks - Whether risks section was displayed (affects border)
     * @returns Formatted lines for the mitigation section
     */
    private formatMitigationSection;
    private formatOutput;
    private initializeSession;
    private getTechniqueSteps;
    private extractInsights;
    processLateralThinking(input: unknown): Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
        isError?: boolean;
    }>;
    private getNextStepGuidance;
    discoverTechniques(input: unknown): Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
        isError?: boolean;
    }>;
    planThinkingSession(input: unknown): Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
        isError?: boolean;
    }>;
    executeThinkingStep(input: unknown): Promise<{
        content: Array<{
            type: string;
            text: string;
        }>;
        isError?: boolean;
    }>;
    private getScamperDescription;
    private getDesignThinkingOutputs;
}
//# sourceMappingURL=index.d.ts.map