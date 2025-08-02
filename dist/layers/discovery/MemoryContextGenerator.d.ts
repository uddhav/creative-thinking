/**
 * MemoryContextGenerator - Handles memory context generation for problem analysis
 * Extracted from discoverTechniques to improve maintainability
 */
export declare class MemoryContextGenerator {
    /**
     * Generate observation about the problem for memory context
     */
    generateObservation(problem: string, context: string | undefined, category: string, constraints: string[] | undefined): string;
    /**
     * Generate historical relevance for similar problems
     */
    generateHistoricalRelevance(category: string, preferredOutcome: string | undefined): string;
    /**
     * Generate searchable factors for memory indexing
     */
    generateSearchableFactors(problem: string, context: string | undefined, category: string, constraints: string[] | undefined): string[];
}
//# sourceMappingURL=MemoryContextGenerator.d.ts.map