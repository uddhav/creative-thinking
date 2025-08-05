/**
 * Synthesis Prompt Generator
 * Generates prompts to guide LLM synthesis of parallel results
 */
import type { StructuredResults, SynthesisPrompt, PromptStrategy } from '../../../types/handoff.js';
export declare class SynthesisPromptGenerator {
    private truncatePrompt;
    generateSynthesisPrompts(structuredResults: StructuredResults, problem: string, strategy: PromptStrategy): SynthesisPrompt[];
    private createCoreSynthesisPrompt;
    private createComprehensivePrompts;
    private createFocusedPrompts;
    private createActionOrientedPrompts;
    private createRiskAwarePrompts;
    private createConflictResolutionPrompt;
    private createComplexityManagementPrompt;
    private createInnovationRefinementPrompt;
    private hasConflicts;
    private hasHighComplexity;
    private hasInnovativeIdeas;
    private getTechniqueCount;
    private getTotalIdeas;
    private getTechniqueNames;
    private suggestSynthesisApproach;
    private extractTopThemes;
    private extractAllRisks;
    private identifyConflicts;
    private assessComplexity;
}
//# sourceMappingURL=SynthesisPromptGenerator.d.ts.map