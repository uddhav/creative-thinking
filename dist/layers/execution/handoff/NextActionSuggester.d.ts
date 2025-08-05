/**
 * Next Action Suggester
 * Suggests what the LLM might do with parallel results
 */
import type { ParallelResult } from '../../../types/handoff.js';
import type { LLMHandoffOptions, SuggestedAction } from '../../../types/handoff.js';
export declare class NextActionSuggester {
    suggestNextActions(results: ParallelResult[], options: LLMHandoffOptions): SuggestedAction[];
    private analyzeResultCharacteristics;
    private assessComplexity;
    private needsDeepAnalysis;
    private countTotalInsights;
    private countTotalIdeas;
    private countTotalRisks;
    private hasReusablePatterns;
    private detectKnowledgeGaps;
    private needsExternalValidation;
    private hasClearPatterns;
    private hasSignificantConflicts;
    private countSharedThemes;
    private createSequentialThinkingPrompt;
    private generateResearchQueries;
    private shouldDocumentResults;
    private generateFocusAreaActions;
    private prioritizeActions;
    private extractThemes;
    private extractAllThemes;
    private calculateThemeFrequency;
    private extractRecommendations;
    private extractKeyPhrase;
}
//# sourceMappingURL=NextActionSuggester.d.ts.map