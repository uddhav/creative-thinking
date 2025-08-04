/**
 * Tests for TechniqueDependencyAnalyzer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TechniqueDependencyAnalyzer,
  DependencyGraph,
} from '../../../layers/planning/TechniqueDependencyAnalyzer.js';
import type { LateralTechnique } from '../../../types/index.js';

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  describe('Basic Operations', () => {
    it('should add nodes correctly', () => {
      graph.addNode('six_hats');
      graph.addNode('po');

      expect(graph.getDependencies('six_hats')).toEqual([]);
      expect(graph.getDependencies('po')).toEqual([]);
    });

    it('should add edges correctly', () => {
      graph.addEdge('triz', 'design_thinking');

      expect(graph.getDependencies('triz')).toEqual(['design_thinking']);
      expect(graph.getDependents('design_thinking')).toEqual(['triz']);
    });

    it('should handle multiple dependencies', () => {
      graph.addEdge('convergence', 'six_hats');
      graph.addEdge('convergence', 'po');
      graph.addEdge('convergence', 'scamper');

      expect(graph.getDependencies('convergence')).toHaveLength(3);
      expect(graph.getDependencies('convergence')).toContain('six_hats');
      expect(graph.getDependencies('convergence')).toContain('po');
      expect(graph.getDependencies('convergence')).toContain('scamper');
    });
  });

  describe('Cycle Detection', () => {
    it('should detect simple cycles', () => {
      graph.addEdge('A' as LateralTechnique, 'B' as LateralTechnique);
      graph.addEdge('B' as LateralTechnique, 'A' as LateralTechnique);

      expect(graph.hasCycle()).toBe(true);
    });

    it('should detect complex cycles', () => {
      graph.addEdge('A' as LateralTechnique, 'B' as LateralTechnique);
      graph.addEdge('B' as LateralTechnique, 'C' as LateralTechnique);
      graph.addEdge('C' as LateralTechnique, 'A' as LateralTechnique);

      expect(graph.hasCycle()).toBe(true);
    });

    it('should not detect cycles in acyclic graphs', () => {
      graph.addEdge('triz', 'design_thinking');
      graph.addEdge('yes_and', 'concept_extraction');

      expect(graph.hasCycle()).toBe(false);
    });
  });

  describe('Topological Sort', () => {
    it('should sort simple dependencies', () => {
      graph.addEdge('triz', 'design_thinking');
      graph.addEdge('yes_and', 'concept_extraction');

      const sorted = graph.topologicalSort();
      expect(sorted).toBeTruthy();

      // triz depends on design_thinking, so design_thinking should come before triz
      const dtIndex = sorted?.indexOf('design_thinking') ?? -1;
      const trizIndex = sorted?.indexOf('triz') ?? -1;
      expect(dtIndex).toBeLessThan(trizIndex);

      // yes_and depends on concept_extraction, so concept_extraction should come before yes_and
      const ceIndex = sorted?.indexOf('concept_extraction') ?? -1;
      const yaIndex = sorted?.indexOf('yes_and') ?? -1;
      expect(ceIndex).toBeLessThan(yaIndex);
    });

    it('should return null for cyclic graphs', () => {
      graph.addEdge('A' as LateralTechnique, 'B' as LateralTechnique);
      graph.addEdge('B' as LateralTechnique, 'A' as LateralTechnique);

      expect(graph.topologicalSort()).toBeNull();
    });
  });

  describe('Independent Groups', () => {
    it('should find independent groups correctly', () => {
      // Group 1: triz depends on design_thinking
      graph.addEdge('triz', 'design_thinking');

      // Group 2: yes_and depends on concept_extraction
      graph.addEdge('yes_and', 'concept_extraction');

      // Independent: six_hats
      graph.addNode('six_hats');

      const groups = graph.findIndependentGroups();

      // Should have at least 2 groups
      expect(groups.length).toBeGreaterThanOrEqual(2);

      // Each dependency pair should not be in the same group
      const trizGroup = groups.find(g => g.includes('triz'));
      const dtGroup = groups.find(g => g.includes('design_thinking'));
      expect(trizGroup).not.toEqual(dtGroup);
    });
  });
});

describe('TechniqueDependencyAnalyzer', () => {
  let analyzer: TechniqueDependencyAnalyzer;

  beforeEach(() => {
    analyzer = new TechniqueDependencyAnalyzer();
  });

  describe('Dependency Analysis', () => {
    it('should analyze known dependencies correctly', () => {
      const techniques: LateralTechnique[] = ['triz', 'design_thinking', 'six_hats'];
      const graph = analyzer.analyzeDependencies(techniques);

      // TRIZ depends on design_thinking
      expect(graph.getDependencies('triz')).toContain('design_thinking');

      // six_hats has no dependencies
      expect(graph.getDependencies('six_hats')).toHaveLength(0);
    });

    it('should handle convergence special case', () => {
      const techniques: LateralTechnique[] = ['convergence', 'six_hats', 'po', 'scamper'];
      const graph = analyzer.analyzeDependencies(techniques);

      // Convergence depends on all other techniques
      const convergenceDeps = graph.getDependencies('convergence');
      expect(convergenceDeps).toHaveLength(3);
      expect(convergenceDeps).toContain('six_hats');
      expect(convergenceDeps).toContain('po');
      expect(convergenceDeps).toContain('scamper');
    });

    it('should not add dependencies for techniques not in the list', () => {
      const techniques: LateralTechnique[] = ['yes_and']; // Without concept_extraction
      const graph = analyzer.analyzeDependencies(techniques);

      // yes_and should have no dependencies since concept_extraction is not in the list
      expect(graph.getDependencies('yes_and')).toHaveLength(0);
    });
  });

  describe('Synergy Detection', () => {
    it('should find synergies between techniques', () => {
      const techniques: LateralTechnique[] = [
        'six_hats',
        'disney_method',
        'scamper',
        'random_entry',
      ];
      const synergies = analyzer.findSynergies(techniques);

      // Should find six_hats <-> disney_method synergy
      expect(synergies).toContainEqual(['six_hats', 'disney_method']);

      // Should find scamper <-> random_entry synergy
      expect(synergies).toContainEqual(['scamper', 'random_entry']);
    });

    it('should not find synergies for missing techniques', () => {
      const techniques: LateralTechnique[] = ['six_hats', 'triz'];
      const synergies = analyzer.findSynergies(techniques);

      // Should not find disney_method synergy since it's not in the list
      expect(synergies).not.toContainEqual(['six_hats', 'disney_method']);
    });
  });

  describe('Parallel Execution Validation', () => {
    it('should validate parallel execution correctly', () => {
      // Can run in parallel
      expect(analyzer.canRunInParallel('six_hats', 'po')).toBe(true);
      expect(analyzer.canRunInParallel('scamper', 'random_entry')).toBe(true);

      // Cannot run in parallel (dependencies)
      expect(analyzer.canRunInParallel('triz', 'design_thinking')).toBe(false);
      expect(analyzer.canRunInParallel('yes_and', 'concept_extraction')).toBe(false);

      // Cannot run in parallel (convergence)
      expect(analyzer.canRunInParallel('convergence', 'six_hats')).toBe(false);
      expect(analyzer.canRunInParallel('po', 'convergence')).toBe(false);
    });

    it('should check bidirectional dependencies', () => {
      // Both directions should be checked
      expect(analyzer.canRunInParallel('design_thinking', 'triz')).toBe(false);
      expect(analyzer.canRunInParallel('concept_extraction', 'yes_and')).toBe(false);
    });
  });

  describe('Group Validation', () => {
    it('should validate groups correctly', () => {
      // Valid group - no dependencies
      expect(analyzer.canGroupRunTogether(['six_hats', 'po', 'random_entry'])).toBe(true);

      // Invalid group - has dependencies
      expect(analyzer.canGroupRunTogether(['triz', 'design_thinking'])).toBe(false);

      // Invalid group - contains convergence
      expect(analyzer.canGroupRunTogether(['convergence', 'six_hats'])).toBe(false);
    });
  });

  describe('Optimal Grouping', () => {
    it('should find optimal grouping for independent techniques', () => {
      const techniques: LateralTechnique[] = ['six_hats', 'po', 'random_entry', 'scamper'];
      const groups = analyzer.findOptimalGrouping(techniques, 2);

      // Should have at most 2 groups
      expect(groups.length).toBeLessThanOrEqual(2);

      // All techniques should be assigned
      const allTechniques = groups.flat();
      expect(allTechniques).toHaveLength(techniques.length);
      expect(allTechniques.sort()).toEqual(techniques.sort());
    });

    it('should respect dependencies in grouping', () => {
      const techniques: LateralTechnique[] = [
        'triz',
        'design_thinking',
        'yes_and',
        'concept_extraction',
      ];
      const groups = analyzer.findOptimalGrouping(techniques, 3);

      // Dependencies should not be in the same group
      const trizGroup = groups.find(g => g.includes('triz'));
      const dtGroup = groups.find(g => g.includes('design_thinking'));
      expect(trizGroup).not.toBe(dtGroup);

      const yaGroup = groups.find(g => g.includes('yes_and'));
      const ceGroup = groups.find(g => g.includes('concept_extraction'));
      expect(yaGroup).not.toBe(ceGroup);
    });

    it('should handle convergence correctly in grouping', () => {
      const techniques: LateralTechnique[] = ['convergence', 'six_hats', 'po'];
      const groups = analyzer.findOptimalGrouping(techniques, 2);

      // Convergence should be in its own group
      const convergenceGroup = groups.find(g => g.includes('convergence'));
      expect(convergenceGroup).toHaveLength(1);
    });
  });

  describe('Get All Dependencies', () => {
    it('should return both hard and soft dependencies', () => {
      const trizDeps = analyzer.getAllDependencies('triz');
      expect(trizDeps.hard).toContain('design_thinking');

      const disneyDeps = analyzer.getAllDependencies('disney_method');
      expect(disneyDeps.soft).toContain('six_hats');
    });

    it('should handle techniques with no dependencies', () => {
      const sixHatsDeps = analyzer.getAllDependencies('six_hats');
      expect(sixHatsDeps.hard).toHaveLength(0);
      expect(sixHatsDeps.soft).toHaveLength(0);
    });

    it('should filter out special markers', () => {
      const convergenceDeps = analyzer.getAllDependencies('convergence');
      expect(convergenceDeps.hard).not.toContain('*');
    });
  });
});
