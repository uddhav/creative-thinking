/**
 * Result Structuring Strategies
 * Different ways to structure parallel results for LLM consumption
 */
import type { ParallelResult } from '../../../types/handoff.js';
import type { HierarchicalStructure, FlatStructure, ComparativeStructure, NarrativeStructure } from '../../../types/handoff.js';
export declare class ResultStructures {
    createHierarchicalStructure(results: ParallelResult[]): HierarchicalStructure;
    createFlatStructure(results: ParallelResult[]): FlatStructure;
    createComparativeStructure(results: ParallelResult[]): ComparativeStructure;
    createNarrativeStructure(results: ParallelResult[], problem: string): NarrativeStructure;
    private countTotalInsights;
    private countTotalIdeas;
    private calculateTotalTime;
    private summarizeTechnique;
    private extractKeyInsights;
    private structureIdeas;
    private structureRisks;
    private createSubSections;
    private findCommonThemes;
    private findDivergentPerspectives;
    private findComplementaryInsights;
    private extractAllIdeas;
    private categorizeIdea;
    private extractTags;
    private assessImportance;
    private assessSeverity;
    private suggestMitigation;
    private identifyComparisonDimensions;
    private extractDimensionValue;
    private extractDimensionEvidence;
    private createComparisonMatrix;
    private generateComparativeRecommendations;
    private weaveNarrative;
    private narrateProblemContext;
    private narrateTechniqueJourneys;
    private narrateEmergingPatterns;
    private narrateSynthesisOpportunities;
    private createCallToAction;
    private extractThemes;
    private extractViewOnTopic;
    private hasSignificantDivergence;
    private findSynergies;
    private areComplementary;
    private assessInnovation;
    private assessComplexity;
    private assessUserImpact;
    private assessResourceNeeds;
    private insightRelatedToDimension;
    private findBestForDimension;
    private scoreTechniqueForDimension;
    private describeTechniqueJourney;
}
//# sourceMappingURL=ResultStructures.d.ts.map