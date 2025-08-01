/**
 * Visual Formatter
 * Handles visual output formatting for the console
 */
import chalk from 'chalk';
import type { LateralTechnique, ThinkingOperationData } from '../types/index.js';
export declare class VisualFormatter {
    private readonly maxLineLength;
    private readonly disableThoughtLogging;
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
    }, input: ThinkingOperationData): string;
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
}
//# sourceMappingURL=VisualFormatter.d.ts.map