/**
 * TechniqueDependencyAnalyzer - Analyzes dependencies and synergies between creative thinking techniques
 * This module helps determine which techniques can run in parallel and which have dependencies
 */
import type { LateralTechnique } from '../../types/index.js';
/**
 * Constants for special dependency markers
 */
export declare const DEPENDENCY_MARKERS: {
    readonly ALL_TECHNIQUES: "*";
};
/**
 * Represents a dependency relationship between techniques
 */
export interface TechniqueDependency {
    dependent: LateralTechnique;
    dependsOn: LateralTechnique[];
    type: 'hard' | 'soft';
}
/**
 * Graph structure for dependency analysis
 */
export declare class DependencyGraph {
    private nodes;
    private edges;
    private reverseEdges;
    addNode(technique: LateralTechnique): void;
    addEdge(from: LateralTechnique, to: LateralTechnique): void;
    getDependencies(technique: LateralTechnique): LateralTechnique[];
    getDependents(technique: LateralTechnique): LateralTechnique[];
    hasCycle(): boolean;
    topologicalSort(): LateralTechnique[] | null;
    findIndependentGroups(): LateralTechnique[][];
}
/**
 * Analyzes dependencies and synergies between creative thinking techniques
 */
export declare class TechniqueDependencyAnalyzer {
    /**
     * Define known hard dependencies between techniques
     * Format: technique -> [techniques it depends on]
     */
    private static readonly HARD_DEPENDENCIES;
    /**
     * Define soft dependencies (beneficial but not required)
     */
    private static readonly SOFT_DEPENDENCIES;
    /**
     * Define techniques that work well together (synergies)
     */
    private static readonly SYNERGIES;
    /**
     * Techniques that should not run in parallel (mutual exclusion)
     */
    private static readonly MUTUAL_EXCLUSIONS;
    /**
     * Analyze dependencies between techniques
     */
    analyzeDependencies(techniques: LateralTechnique[]): DependencyGraph;
    /**
     * Find synergies between techniques
     */
    findSynergies(techniques: LateralTechnique[]): Array<[LateralTechnique, LateralTechnique]>;
    /**
     * Check if two techniques can run in parallel
     */
    canRunInParallel(tech1: LateralTechnique, tech2: LateralTechnique): boolean;
    /**
     * Get all dependencies for a technique (both hard and soft)
     */
    getAllDependencies(technique: LateralTechnique): {
        hard: LateralTechnique[];
        soft: LateralTechnique[];
    };
    /**
     * Assess if a group of techniques can run together
     */
    canGroupRunTogether(techniques: LateralTechnique[]): boolean;
    /**
     * Find the optimal grouping for parallel execution
     */
    findOptimalGrouping(techniques: LateralTechnique[], maxGroups?: number): LateralTechnique[][];
    /**
     * Add implicit dependencies based on problem characteristics
     */
    private addImplicitDependencies;
}
//# sourceMappingURL=TechniqueDependencyAnalyzer.d.ts.map