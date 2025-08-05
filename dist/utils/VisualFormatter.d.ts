/**
 * Visual Formatter
 * Handles visual output formatting for the console
 */
import chalk from 'chalk';
import type { LateralTechnique, ThinkingOperationData, SessionData } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
export declare class VisualFormatter {
    private readonly maxLineLength;
    private readonly disableThoughtLogging;
    private readonly showTechniqueIndicators;
    private completionTracker;
    constructor(disableThoughtLogging?: boolean);
    /**
     * Format the main output display
     */
    formatOutput(technique: LateralTechnique, problem: string, currentStep: number, totalSteps: number, stepInfo: {
        name: string;
        focus: string;
        emoji: string;
    } | null, modeIndicator: {
        color: typeof chalk;
        symbol: string;
    }, input: ThinkingOperationData, session?: SessionData, plan?: PlanThinkingSessionOutput): string;
    /**
     * Format progress bar
     */
    private formatProgressBar;
    /**
     * Add wrapped line to output
     */
    private addWrappedLine;
    /**
     * Truncate word if too long
     */
    private truncateWord;
    /**
     * Wrap text to fit within specified width
     */
    private wrapText;
    /**
     * Format risk section
     */
    private formatRiskSection;
    /**
     * Format mitigation section
     */
    private formatMitigationSection;
    /**
     * Get technique emoji
     */
    private getTechniqueEmoji;
    /**
     * Get technique name
     */
    private getTechniqueName;
    /**
     * Get technique-specific state indicator
     */
    private getTechniqueStateIndicator;
    /**
     * Get risk level indicator
     */
    private getRiskLevelIndicator;
    /**
     * Get flexibility score indicator
     */
    private getFlexibilityIndicator;
    /**
     * Format session summary
     */
    formatSessionSummary(technique: LateralTechnique, problem: string, insights: string[], metrics?: {
        creativityScore?: number;
        risksCaught?: number;
        antifragileFeatures?: number;
    }): string;
    /**
     * Get mode indicator for current thinking mode
     */
    getModeIndicator(technique: LateralTechnique, currentStep: number): {
        color: typeof chalk;
        symbol: string;
    };
    /**
     * Get critical thinking steps for a technique
     */
    private getCriticalSteps;
    /**
     * Format flexibility warning for display
     */
    formatFlexibilityWarning(flexibility: number, alternatives?: string[]): string;
    /**
     * Format escape recommendations for display
     */
    formatEscapeRecommendations(routes: Array<{
        name: string;
        description: string;
    }>): string;
    /**
     * Format ergodicity prompt for display
     */
    formatErgodicityPrompt(prompt: {
        promptText: string;
        followUp?: string;
    }): string;
    /**
     * Format convergence progress display
     */
    formatConvergenceProgress(currentStep: number, totalSteps: number, sessionCount: number, techniques: string[]): string;
    /**
     * Format progress bar for session completion
     */
    private formatSessionProgressBar;
    /**
     * Format inline progress indicator (compact)
     */
    formatInlineProgress(progress: number): string;
}
//# sourceMappingURL=VisualFormatter.d.ts.map