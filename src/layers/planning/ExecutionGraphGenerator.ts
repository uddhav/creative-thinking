/**
 * ExecutionGraphGenerator - Generates DAG for client-side parallel execution
 */

import type {
  ExecutionGraph,
  ExecutionGraphNode,
  TechniqueWorkflow,
} from '../../types/planning.js';
import type { ExecuteThinkingStepInput, LateralTechnique } from '../../types/index.js';

export class ExecutionGraphGenerator {
  /**
   * Generate execution graph from workflow
   */
  static generateExecutionGraph(
    planId: string,
    problem: string,
    workflows: TechniqueWorkflow[]
  ): ExecutionGraph {
    const nodes: ExecutionGraphNode[] = [];
    let nodeId = 0;
    let globalStepNumber = 0;

    // Process each technique workflow
    for (const workflow of workflows) {
      const techniqueNodes = this.generateTechniqueNodes(
        planId,
        problem,
        workflow,
        nodeId,
        globalStepNumber
      );

      nodes.push(...techniqueNodes);
      nodeId += techniqueNodes.length;
      globalStepNumber += techniqueNodes.length;
    }

    // Calculate metadata
    const metadata = this.calculateMetadata(nodes);

    // Generate instructions
    const instructions = this.generateInstructions(nodes, metadata);

    return {
      nodes,
      metadata,
      instructions,
    };
  }

  /**
   * Generate nodes for a specific technique
   */
  private static generateTechniqueNodes(
    planId: string,
    problem: string,
    workflow: TechniqueWorkflow,
    startNodeId: number,
    startStepNumber: number
  ): ExecutionGraphNode[] {
    const nodes: ExecutionGraphNode[] = [];
    const technique = workflow.technique;
    const totalSteps = workflow.steps.length;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const nodeId = `node-${startNodeId + i + 1}`;
      const stepNumber = startStepNumber + i + 1;

      // Determine dependencies based on technique type
      const dependencies = this.getDependencies(technique, i, startNodeId);

      // Build complete parameters for execute_thinking_step
      const parameters = this.buildParameters(planId, problem, technique, i + 1, totalSteps, step);

      nodes.push({
        id: nodeId,
        stepNumber,
        technique,
        parameters,
        dependencies,
        estimatedDuration: this.estimateDuration(technique),
        canSkipIfFailed: this.canSkipIfFailed(technique),
      });
    }

    return nodes;
  }

  /**
   * Determine dependencies based on technique characteristics
   */
  private static getDependencies(
    technique: LateralTechnique,
    stepIndex: number,
    startNodeId: number
  ): string[] {
    // Techniques with parallel steps (no dependencies between steps)
    const parallelTechniques: LateralTechnique[] = ['six_hats', 'scamper', 'nine_windows'];

    // Techniques with sequential steps (each depends on previous)
    const sequentialTechniques: LateralTechnique[] = [
      'design_thinking',
      'disney_method',
      'triz',
      'po',
    ];

    // Hybrid techniques with custom patterns
    const hybridTechniques: LateralTechnique[] = [
      'concept_extraction',
      'neural_state',
      'temporal_work',
      'cross_cultural',
      'collective_intel',
    ];

    if (parallelTechniques.includes(technique)) {
      // No dependencies - all steps can run in parallel
      return [];
    }

    if (sequentialTechniques.includes(technique)) {
      // Each step depends on the previous one
      if (stepIndex === 0) {
        return [];
      }
      return [`node-${startNodeId + stepIndex}`];
    }

    if (hybridTechniques.includes(technique)) {
      // Custom dependency patterns for hybrid techniques
      return this.getHybridDependencies(technique, stepIndex, startNodeId);
    }

    // Default to sequential
    if (stepIndex === 0) {
      return [];
    }
    return [`node-${startNodeId + stepIndex}`];
  }

  /**
   * Get dependencies for hybrid techniques
   */
  private static getHybridDependencies(
    technique: LateralTechnique,
    stepIndex: number,
    startNodeId: number
  ): string[] {
    switch (technique) {
      case 'concept_extraction':
        // Steps 2-3 can be parallel after step 1
        if (stepIndex === 0) return [];
        if (stepIndex === 1 || stepIndex === 2) return [`node-${startNodeId + 1}`];
        return [`node-${startNodeId + stepIndex}`];

      case 'neural_state':
        // Steps 2-3 can be parallel after step 1, step 4 depends on all
        if (stepIndex === 0) return [];
        if (stepIndex === 1 || stepIndex === 2) return [`node-${startNodeId + 1}`];
        if (stepIndex === 3) return [`node-${startNodeId + 2}`, `node-${startNodeId + 3}`];
        return [];

      default:
        // Default to sequential for other hybrid techniques
        if (stepIndex === 0) return [];
        return [`node-${startNodeId + stepIndex}`];
    }
  }

  /**
   * Build complete parameters for execute_thinking_step
   */
  private static buildParameters(
    planId: string,
    problem: string,
    technique: LateralTechnique,
    currentStep: number,
    totalSteps: number,
    step: { description?: string; stimulus?: string; contradiction?: string }
  ): ExecuteThinkingStepInput {
    const baseParams: ExecuteThinkingStepInput = {
      planId,
      technique,
      problem,
      currentStep,
      totalSteps,
      output: '',
      nextStepNeeded: currentStep < totalSteps,
    };

    // Add technique-specific parameters
    const techniqueParams = this.getTechniqueSpecificParams(technique, currentStep, step);

    return {
      ...baseParams,
      ...techniqueParams,
    };
  }

  /**
   * Get technique-specific parameters
   * Made public for testing bounds checking
   */
  static getTechniqueSpecificParams(
    technique: LateralTechnique,
    currentStep: number,
    step: { description?: string; stimulus?: string; contradiction?: string }
  ): Partial<ExecuteThinkingStepInput> {
    switch (technique) {
      case 'six_hats': {
        // Six Hats has 7 colors including purple (ergodicity extension)
        const hatColors = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'] as const;
        const colorIndex = Math.min(Math.max(0, currentStep - 1), hatColors.length - 1);
        return {
          hatColor: hatColors[colorIndex],
        };
      }

      case 'scamper': {
        const scamperActions = [
          'substitute',
          'combine',
          'adapt',
          'modify',
          'put_to_other_use',
          'eliminate',
          'reverse',
          'parameterize',
        ] as const;
        const actionIndex = Math.min(Math.max(0, currentStep - 1), scamperActions.length - 1);
        return {
          scamperAction: scamperActions[actionIndex],
        };
      }

      case 'design_thinking': {
        const designStages = ['empathize', 'define', 'ideate', 'prototype', 'test'] as const;
        const stageIndex = Math.min(Math.max(0, currentStep - 1), designStages.length - 1);
        return {
          designStage: designStages[stageIndex],
        };
      }

      case 'disney_method': {
        const disneyRoles = ['dreamer', 'realist', 'critic'] as const;
        const roleIndex = Math.min(Math.max(0, currentStep - 1), disneyRoles.length - 1);
        return {
          disneyRole: disneyRoles[roleIndex],
        };
      }

      case 'nine_windows': {
        const nineWindowsCells = [
          { systemLevel: 'sub-system' as const, timeFrame: 'past' as const },
          { systemLevel: 'sub-system' as const, timeFrame: 'present' as const },
          { systemLevel: 'sub-system' as const, timeFrame: 'future' as const },
          { systemLevel: 'system' as const, timeFrame: 'past' as const },
          { systemLevel: 'system' as const, timeFrame: 'present' as const },
          { systemLevel: 'system' as const, timeFrame: 'future' as const },
          { systemLevel: 'super-system' as const, timeFrame: 'past' as const },
          { systemLevel: 'super-system' as const, timeFrame: 'present' as const },
          { systemLevel: 'super-system' as const, timeFrame: 'future' as const },
        ];
        const cellIndex = Math.min(Math.max(0, currentStep - 1), nineWindowsCells.length - 1);
        const cell = nineWindowsCells[cellIndex];
        return {
          currentCell: cell,
        };
      }

      case 'po':
        return {
          provocation: (step as { description?: string }).description || '',
        };

      case 'random_entry':
        return {
          randomStimulus: (step as { stimulus?: string }).stimulus || '',
        };

      case 'triz':
        return {
          contradiction: (step as { contradiction?: string }).contradiction || '',
          inventivePrinciples: [],
        };

      default:
        return {};
    }
  }

  /**
   * Calculate metadata for the execution graph
   */
  private static calculateMetadata(nodes: ExecutionGraphNode[]) {
    // Find parallelizable groups
    const parallelizableGroups = this.findParallelizableGroups(nodes);

    // Calculate critical path
    const criticalPath = this.findCriticalPath(nodes);

    // Calculate max parallelism
    const maxParallelism = Math.max(...parallelizableGroups.map(group => group.length));

    return {
      totalNodes: nodes.length,
      maxParallelism,
      criticalPath,
      parallelizableGroups,
    };
  }

  /**
   * Find groups of nodes that can execute in parallel
   * Optimized from O(n²) to O(n) using Map for grouping
   */
  private static findParallelizableGroups(nodes: ExecutionGraphNode[]): string[][] {
    // Group nodes by their dependency signature
    const depGroups = new Map<string, string[]>();

    for (const node of nodes) {
      // Create a consistent key from dependencies
      const depKey = JSON.stringify(node.dependencies.sort());

      if (!depGroups.has(depKey)) {
        depGroups.set(depKey, []);
      }
      const group = depGroups.get(depKey);
      if (group) {
        group.push(node.id);
      }
    }

    // Return groups with at least one node
    return Array.from(depGroups.values()).filter(group => group.length > 0);
  }

  /**
   * Find the critical path through the graph
   */
  private static findCriticalPath(nodes: ExecutionGraphNode[]): string[] {
    if (nodes.length === 0) return [];

    // Build adjacency list
    const graph = new Map<string, string[]>();
    for (const node of nodes) {
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }
      for (const dep of node.dependencies) {
        if (!graph.has(dep)) {
          graph.set(dep, []);
        }
        graph.get(dep)?.push(node.id);
      }
    }

    // Find nodes with no dependencies (starting points)
    const startNodes = nodes.filter(n => n.dependencies.length === 0);
    if (startNodes.length === 0) return [];

    // Find longest path from each start node
    let longestPath: string[] = [];
    for (const start of startNodes) {
      const path = this.dfs(start.id, graph, new Set());
      if (path.length > longestPath.length) {
        longestPath = path;
      }
    }

    return longestPath;
  }

  /**
   * Depth-first search to find longest path
   */
  private static dfs(nodeId: string, graph: Map<string, string[]>, visited: Set<string>): string[] {
    if (visited.has(nodeId)) return [];

    visited.add(nodeId);
    const neighbors = graph.get(nodeId) || [];

    let longestSubpath: string[] = [];
    for (const neighbor of neighbors) {
      const subpath = this.dfs(neighbor, graph, new Set(visited));
      if (subpath.length > longestSubpath.length) {
        longestSubpath = subpath;
      }
    }

    return [nodeId, ...longestSubpath];
  }

  /**
   * Generate instructions for the invoker
   */
  private static generateInstructions(
    _nodes: ExecutionGraphNode[],
    metadata: { maxParallelism: number }
  ) {
    const hasParallelNodes = metadata.maxParallelism > 1;

    return {
      forInvoker: `This is a Directed Acyclic Graph (DAG) for execution. Each node represents a call to execute_thinking_step with the provided parameters. ${
        hasParallelNodes
          ? 'Nodes with no dependencies or the same dependencies can be executed in parallel by making concurrent execute_thinking_step calls. To execute in parallel: identify nodes with empty or satisfied dependencies, then call execute_thinking_step for each node simultaneously. Monitor completion and proceed to dependent nodes.'
          : 'Execute nodes sequentially in the order provided, as each depends on the previous.'
      } The planId and all required parameters are pre-populated in each node. Simply use the parameters object from each node when calling execute_thinking_step.`,
      executionStrategy: hasParallelNodes ? 'parallel-capable' : 'sequential',
      errorHandling: 'continue-on-non-critical-failure',
    };
  }

  /**
   * Estimate duration for a technique step
   */
  private static estimateDuration(technique: LateralTechnique): number {
    // Rough estimates in milliseconds
    const estimates: Partial<Record<LateralTechnique, number>> = {
      six_hats: 3000,
      scamper: 2500,
      design_thinking: 4000,
      nine_windows: 2000,
      po: 3500,
      random_entry: 2000,
      triz: 4500,
    };

    return estimates[technique] || 3000;
  }

  /**
   * Determine if a step can be skipped if it fails
   */
  private static canSkipIfFailed(technique: LateralTechnique): boolean {
    // For parallel techniques, individual steps can often be skipped
    const parallelTechniques: LateralTechnique[] = ['six_hats', 'scamper', 'nine_windows'];

    return parallelTechniques.includes(technique);
  }

  /**
   * Check if two arrays are equal
   */
  private static arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }
}
