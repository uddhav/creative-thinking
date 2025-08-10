/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with comprehensive NLP analysis using NLPService
 */
export declare class ProblemAnalyzer {
    private nlpService;
    constructor();
    /**
     * Categorize the problem based on NLP analysis and patterns
     */
    categorizeProblem(problem: string, context?: string): string;
    /**
     * Detect paradoxical patterns using enhanced NLP
     */
    private detectParadoxicalPattern;
    /**
     * Check if the problem has time constraints using NLP
     */
    hasTimeConstraint(problem: string, constraints?: string[]): boolean;
    /**
     * Check if the problem needs collaboration using NLP
     */
    needsCollaboration(problem: string, context?: string): boolean;
}
//# sourceMappingURL=ProblemAnalyzer.d.ts.map