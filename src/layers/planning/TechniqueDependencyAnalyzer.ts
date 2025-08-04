/**
 * TechniqueDependencyAnalyzer - Analyzes dependencies and synergies between creative thinking techniques
 * This module helps determine which techniques can run in parallel and which have dependencies
 */

import type { LateralTechnique } from '../../types/index.js';

/**
 * Special marker type for dependencies
 */
type DependencyMarker = '*';

/**
 * Represents a dependency relationship between techniques
 */
export interface TechniqueDependency {
  dependent: LateralTechnique;
  dependsOn: LateralTechnique[];
  type: 'hard' | 'soft'; // Hard = must wait, Soft = benefits from but not required
}

/**
 * Graph structure for dependency analysis
 */
export class DependencyGraph {
  private nodes = new Set<LateralTechnique>();
  private edges = new Map<LateralTechnique, Set<LateralTechnique>>();
  private reverseEdges = new Map<LateralTechnique, Set<LateralTechnique>>();

  addNode(technique: LateralTechnique): void {
    this.nodes.add(technique);
    if (!this.edges.has(technique)) {
      this.edges.set(technique, new Set());
    }
    if (!this.reverseEdges.has(technique)) {
      this.reverseEdges.set(technique, new Set());
    }
  }

  addEdge(from: LateralTechnique, to: LateralTechnique): void {
    this.addNode(from);
    this.addNode(to);
    this.edges.get(from)?.add(to);
    this.reverseEdges.get(to)?.add(from);
  }

  getDependencies(technique: LateralTechnique): LateralTechnique[] {
    return Array.from(this.edges.get(technique) || []);
  }

  getDependents(technique: LateralTechnique): LateralTechnique[] {
    return Array.from(this.reverseEdges.get(technique) || []);
  }

  hasCycle(): boolean {
    const visited = new Set<LateralTechnique>();
    const recursionStack = new Set<LateralTechnique>();

    const hasCycleDFS = (node: LateralTechnique): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const dependencies = this.edges.get(node) || new Set();
      for (const dep of dependencies) {
        if (!visited.has(dep)) {
          if (hasCycleDFS(dep)) return true;
        } else if (recursionStack.has(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    for (const node of this.nodes) {
      if (!visited.has(node)) {
        if (hasCycleDFS(node)) return true;
      }
    }

    return false;
  }

  topologicalSort(): LateralTechnique[] | null {
    if (this.hasCycle()) return null;

    const visited = new Set<LateralTechnique>();
    const result: LateralTechnique[] = [];

    const visit = (node: LateralTechnique): void => {
      if (visited.has(node)) return;
      visited.add(node);

      const dependencies = this.edges.get(node) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      result.push(node);
    };

    for (const node of this.nodes) {
      visit(node);
    }

    return result;
  }

  findIndependentGroups(): LateralTechnique[][] {
    const sorted = this.topologicalSort();
    if (!sorted) return [];

    const groups: LateralTechnique[][] = [];
    const assigned = new Set<LateralTechnique>();

    for (const technique of sorted) {
      if (assigned.has(technique)) continue;

      // Find all techniques that can run in parallel with this one
      const group: LateralTechnique[] = [technique];
      assigned.add(technique);

      for (const other of sorted) {
        if (assigned.has(other)) continue;

        // Check if 'other' depends on any technique in the current group
        const dependencies = this.getDependencies(other);
        const hasDependencyInGroup = dependencies.some(dep => group.includes(dep));

        // Check if any technique in the group depends on 'other'
        const dependsOnOther = group.some(tech => this.getDependencies(tech).includes(other));

        if (!hasDependencyInGroup && !dependsOnOther) {
          group.push(other);
          assigned.add(other);
        }
      }

      groups.push(group);
    }

    return groups;
  }
}

/**
 * Analyzes dependencies and synergies between creative thinking techniques
 */
export class TechniqueDependencyAnalyzer {
  /**
   * Define known hard dependencies between techniques
   * Format: technique -> [techniques it depends on]
   */
  private static readonly HARD_DEPENDENCIES: Partial<
    Record<LateralTechnique, (LateralTechnique | DependencyMarker)[]>
  > = {
    triz: ['design_thinking'], // TRIZ benefits from problem definition
    yes_and: ['concept_extraction'], // Builds on extracted concepts
    convergence: ['*'], // Special marker - depends on all techniques
  };

  /**
   * Define soft dependencies (beneficial but not required)
   */
  private static readonly SOFT_DEPENDENCIES: Partial<Record<LateralTechnique, LateralTechnique[]>> =
    {
      disney_method: ['six_hats'], // Similar perspective-based thinking
      nine_windows: ['triz'], // Complements TRIZ methodology
    };

  /**
   * Define techniques that work well together (synergies)
   */
  private static readonly SYNERGIES: Array<[LateralTechnique, LateralTechnique]> = [
    ['six_hats', 'disney_method'], // Both use role-based thinking
    ['scamper', 'random_entry'], // Both are modification-based
    ['po', 'concept_extraction'], // Both challenge assumptions
    ['neural_state', 'temporal_work'], // Both deal with cognitive patterns
    ['cross_cultural', 'collective_intel'], // Both leverage diverse perspectives
  ];

  /**
   * Techniques that should not run in parallel (mutual exclusion)
   */
  private static readonly MUTUAL_EXCLUSIONS: Array<[LateralTechnique, LateralTechnique]> = [
    ['convergence', 'six_hats'], // Convergence should run alone
    ['convergence', 'po'],
    ['convergence', 'random_entry'],
    ['convergence', 'scamper'],
    ['convergence', 'concept_extraction'],
    ['convergence', 'yes_and'],
    ['convergence', 'design_thinking'],
    ['convergence', 'triz'],
    ['convergence', 'neural_state'],
    ['convergence', 'temporal_work'],
    ['convergence', 'cross_cultural'],
    ['convergence', 'collective_intel'],
    ['convergence', 'disney_method'],
    ['convergence', 'nine_windows'],
  ];

  /**
   * Analyze dependencies between techniques
   */
  analyzeDependencies(techniques: LateralTechnique[]): DependencyGraph {
    const graph = new DependencyGraph();

    // Add all techniques as nodes
    techniques.forEach(tech => graph.addNode(tech));

    // Add hard dependencies
    for (const technique of techniques) {
      const dependencies = TechniqueDependencyAnalyzer.HARD_DEPENDENCIES[technique];
      if (dependencies) {
        for (const dep of dependencies) {
          if (dep === '*') {
            // Special case: depends on all other techniques
            techniques.filter(t => t !== technique).forEach(t => graph.addEdge(technique, t));
          } else if (techniques.includes(dep)) {
            graph.addEdge(technique, dep);
          }
        }
      }
    }

    // Add implicit dependencies based on problem characteristics
    this.addImplicitDependencies(graph, techniques);

    return graph;
  }

  /**
   * Find synergies between techniques
   */
  findSynergies(techniques: LateralTechnique[]): Array<[LateralTechnique, LateralTechnique]> {
    const synergies: Array<[LateralTechnique, LateralTechnique]> = [];

    for (const [tech1, tech2] of TechniqueDependencyAnalyzer.SYNERGIES) {
      if (techniques.includes(tech1) && techniques.includes(tech2)) {
        synergies.push([tech1, tech2]);
      }
    }

    return synergies;
  }

  /**
   * Check if two techniques can run in parallel
   */
  canRunInParallel(tech1: LateralTechnique, tech2: LateralTechnique): boolean {
    // Check mutual exclusions
    for (const [a, b] of TechniqueDependencyAnalyzer.MUTUAL_EXCLUSIONS) {
      if ((a === tech1 && b === tech2) || (a === tech2 && b === tech1)) {
        return false;
      }
    }

    // Check hard dependencies
    const deps1 = TechniqueDependencyAnalyzer.HARD_DEPENDENCIES[tech1] || [];
    const deps2 = TechniqueDependencyAnalyzer.HARD_DEPENDENCIES[tech2] || [];

    // If either depends on the other, they can't run in parallel
    if (deps1.includes(tech2) || deps2.includes(tech1)) {
      return false;
    }

    // Special case: convergence can't run in parallel with anything
    if (tech1 === 'convergence' || tech2 === 'convergence') {
      return false;
    }

    return true;
  }

  /**
   * Get all dependencies for a technique (both hard and soft)
   */
  getAllDependencies(technique: LateralTechnique): {
    hard: LateralTechnique[];
    soft: LateralTechnique[];
  } {
    const hard = TechniqueDependencyAnalyzer.HARD_DEPENDENCIES[technique] || [];
    const soft = TechniqueDependencyAnalyzer.SOFT_DEPENDENCIES[technique] || [];

    return {
      hard: hard.filter((d): d is LateralTechnique => d !== '*'), // Remove special marker
      soft,
    };
  }

  /**
   * Assess if a group of techniques can run together
   */
  canGroupRunTogether(techniques: LateralTechnique[]): boolean {
    // Check all pairs for conflicts
    for (let i = 0; i < techniques.length; i++) {
      for (let j = i + 1; j < techniques.length; j++) {
        if (!this.canRunInParallel(techniques[i], techniques[j])) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Find the optimal grouping for parallel execution
   */
  findOptimalGrouping(techniques: LateralTechnique[], maxGroups: number = 3): LateralTechnique[][] {
    const graph = this.analyzeDependencies(techniques);
    const independentGroups = graph.findIndependentGroups();

    // If we already have fewer groups than max, return as is
    if (independentGroups.length <= maxGroups) {
      return independentGroups;
    }

    // Otherwise, merge groups while respecting dependencies
    const merged: LateralTechnique[][] = [];
    const currentGroup: LateralTechnique[] = [];

    for (const group of independentGroups) {
      if (merged.length < maxGroups - 1) {
        merged.push(group);
      } else {
        // Add to the last group
        currentGroup.push(...group);
      }
    }

    if (currentGroup.length > 0) {
      merged.push(currentGroup);
    }

    return merged;
  }

  /**
   * Add implicit dependencies based on problem characteristics
   */
  private addImplicitDependencies(graph: DependencyGraph, techniques: LateralTechnique[]): void {
    // Example: If both design_thinking and triz are present,
    // ensure design_thinking runs first for better problem definition
    if (techniques.includes('design_thinking') && techniques.includes('triz')) {
      // Already handled in HARD_DEPENDENCIES
    }

    // Add more implicit rules as needed based on domain knowledge
  }
}
