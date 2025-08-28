/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with comprehensive NLP analysis using NLPService
 */
export declare class ProblemAnalyzer {
    private nlpService;
    private readonly COGNITIVE_PATTERN;
    constructor();
    /**
     * Categorize the problem based on NLP analysis and patterns
     */
    categorizeProblem(problem: string, context?: string): string;
    /**
     * Detect paradoxical patterns using enhanced NLP
     * Note: Now called ONLY when needed since categorizeProblem handles most cases
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
    /**
     * Fast-path check for explicit technique requests (avoids NLP overhead)
     */
    private checkExplicitTechniqueRequest;
    /**
     * Detect behavioral economics patterns using NLP analysis
     */
    private detectBehavioralPattern;
    /**
     * Detect fundamental/first principles patterns using NLP analysis
     */
    private detectFundamentalPattern;
    /**
     * Detect learning/adaptive patterns using NLP analysis
     */
    private detectLearningPattern;
    /**
     * Detect computational/algorithmic patterns using NLP analysis
     */
    private detectComputationalPattern;
    /**
     * Detect validation/verification patterns using NLP analysis
     */
    private detectValidationPattern;
}
//# sourceMappingURL=ProblemAnalyzer.d.ts.map