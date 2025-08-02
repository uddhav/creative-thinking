/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 */
export declare class ProblemAnalyzer {
    /**
     * Categorize the problem based on keywords and context
     */
    categorizeProblem(problem: string, context?: string): string;
    /**
     * Check if the problem has time constraints
     */
    hasTimeConstraint(problem: string, constraints?: string[]): boolean;
    /**
     * Check if the problem needs collaboration
     */
    needsCollaboration(problem: string, context?: string): boolean;
}
//# sourceMappingURL=ProblemAnalyzer.d.ts.map