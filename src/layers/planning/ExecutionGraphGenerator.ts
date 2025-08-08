/**
 * ExecutionGraphGenerator - Generates DAG for client-side parallel execution
 */

import type {
  ExecutionGraph,
  ExecutionGraphNode,
  NodeDependency,
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
  ): NodeDependency[] {
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
      // Each step depends on the previous one (hard dependency)
      if (stepIndex === 0) {
        return [];
      }
      return [{ nodeId: `node-${startNodeId + stepIndex}`, type: 'hard' }];
    }

    if (hybridTechniques.includes(technique)) {
      // Custom dependency patterns for hybrid techniques
      return this.getHybridDependencies(technique, stepIndex, startNodeId);
    }

    // Default to sequential (hard dependency)
    if (stepIndex === 0) {
      return [];
    }
    return [{ nodeId: `node-${startNodeId + stepIndex}`, type: 'hard' }];
  }

  /**
   * Get dependencies for hybrid techniques
   */
  private static getHybridDependencies(
    technique: LateralTechnique,
    stepIndex: number,
    startNodeId: number
  ): NodeDependency[] {
    switch (technique) {
      case 'concept_extraction':
        // Steps 2-3 can be parallel after step 1
        if (stepIndex === 0) return [];
        if (stepIndex === 1 || stepIndex === 2)
          return [{ nodeId: `node-${startNodeId + 1}`, type: 'hard' }];
        // Step 4 has soft dependency on 2-3 for better synthesis
        return [
          { nodeId: `node-${startNodeId + 2}`, type: 'soft' },
          { nodeId: `node-${startNodeId + 3}`, type: 'hard' },
        ];

      case 'neural_state':
        // Steps 2-3 can be parallel after step 1, step 4 depends on all
        if (stepIndex === 0) return [];
        if (stepIndex === 1 || stepIndex === 2)
          return [{ nodeId: `node-${startNodeId + 1}`, type: 'hard' }];
        if (stepIndex === 3)
          return [
            { nodeId: `node-${startNodeId + 2}`, type: 'hard' },
            { nodeId: `node-${startNodeId + 3}`, type: 'hard' },
          ];
        return [];

      case 'temporal_work':
        // First 3 steps can inform each other (soft deps), last 2 depend on them
        if (stepIndex === 0) return [];
        if (stepIndex === 1) return [{ nodeId: `node-${startNodeId + 1}`, type: 'soft' }];
        if (stepIndex === 2)
          return [
            { nodeId: `node-${startNodeId + 1}`, type: 'soft' },
            { nodeId: `node-${startNodeId + 2}`, type: 'soft' },
          ];
        // Steps 4-5 need the temporal context from earlier steps
        return [{ nodeId: `node-${startNodeId + 3}`, type: 'hard' }];

      default:
        // Default to sequential for other hybrid techniques
        if (stepIndex === 0) return [];
        return [{ nodeId: `node-${startNodeId + stepIndex}`, type: 'hard' }];
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
    const maxParallelism = Math.max(...parallelizableGroups.map(group => group.length), 1);

    // Calculate sequential time multiplier
    const sequentialTimeMultiplier = this.calculateSequentialTimeMultiplier(nodes, maxParallelism);

    return {
      totalNodes: nodes.length,
      maxParallelism,
      criticalPath,
      parallelizableGroups,
      sequentialTimeMultiplier,
    };
  }

  /**
   * Calculate sequential time multiplier based on parallelization potential
   */
  private static calculateSequentialTimeMultiplier(
    nodes: ExecutionGraphNode[],
    maxParallelism: number
  ): string {
    // If no parallelism is possible, sequential and parallel take the same time
    if (maxParallelism <= 1) {
      return '1x';
    }

    // Estimate based on the degree of parallelism
    // Higher parallelism = greater time difference
    if (maxParallelism >= 6) {
      return '10x'; // Highly parallel - sequential is much slower
    } else if (maxParallelism >= 4) {
      return '5x'; // Moderate parallelism
    } else if (maxParallelism >= 2) {
      return '3x'; // Some parallelism
    }
    return '2x'; // Minimal parallelism
  }

  /**
   * Find groups of nodes that can execute in parallel
   * Optimized from O(n²) to O(n) using Map for grouping
   */
  private static findParallelizableGroups(nodes: ExecutionGraphNode[]): string[][] {
    // Group nodes by their hard dependency signature (soft deps don't block parallel execution)
    const depGroups = new Map<string, string[]>();

    for (const node of nodes) {
      // Create a consistent key from hard dependencies only
      const hardDeps = node.dependencies
        .filter(dep => dep.type === 'hard')
        .map(dep => dep.nodeId)
        .sort();
      const depKey = JSON.stringify(hardDeps);

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

    // Build adjacency list (considering only hard dependencies for critical path)
    const graph = new Map<string, string[]>();
    for (const node of nodes) {
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }
      // Only consider hard dependencies for critical path
      const hardDeps = node.dependencies.filter(dep => dep.type === 'hard');
      for (const dep of hardDeps) {
        if (!graph.has(dep.nodeId)) {
          graph.set(dep.nodeId, []);
        }
        graph.get(dep.nodeId)?.push(node.id);
      }
    }

    // Find nodes with no hard dependencies (starting points)
    const startNodes = nodes.filter(
      n => n.dependencies.filter(d => d.type === 'hard').length === 0
    );
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
    nodes: ExecutionGraphNode[],
    metadata: {
      maxParallelism: number;
      sequentialTimeMultiplier: string;
      parallelizableGroups: string[][];
      criticalPath: string[];
    }
  ) {
    const hasParallelNodes = metadata.maxParallelism > 1;

    // Determine recommended strategy
    let recommendedStrategy: 'sequential' | 'parallel' | 'hybrid';
    if (!hasParallelNodes) {
      recommendedStrategy = 'sequential';
    } else if (metadata.maxParallelism >= 4) {
      recommendedStrategy = 'parallel';
    } else {
      recommendedStrategy = 'hybrid';
    }

    // Identify sync points (between technique boundaries)
    const syncPoints = this.identifySyncPoints(nodes);

    // Generate parallelization benefits description
    const parallelizationBenefits = this.generateParallelizationBenefits(nodes, metadata);

    // Generate execution guidance
    const executionGuidance = hasParallelNodes
      ? 'Nodes with empty dependencies can execute immediately. For nodes with dependencies, wait for hard dependencies to complete before starting. Soft dependencies are preferential - better results if completed first, but not blocking. Check the dependencies array for each node to determine execution order.'
      : 'Execute nodes sequentially in the order provided. Each node depends on the previous one completing.';

    return {
      recommendedStrategy,
      syncPoints,
      sequentialTimeMultiplier: metadata.sequentialTimeMultiplier,
      parallelizationBenefits,
      executionGuidance,
      errorHandling: 'continue-on-non-critical-failure',
    };
  }

  /**
   * Identify sync points between techniques
   */
  private static identifySyncPoints(nodes: ExecutionGraphNode[]): string[] {
    const syncPoints: string[] = [];
    let lastTechnique: LateralTechnique | null = null;

    for (const node of nodes) {
      if (lastTechnique && lastTechnique !== node.technique) {
        // Sync point at technique boundary
        syncPoints.push(node.id);
      }
      lastTechnique = node.technique;
    }

    return syncPoints;
  }

  /**
   * Generate description of parallelization benefits
   */
  private static generateParallelizationBenefits(
    nodes: ExecutionGraphNode[],
    metadata: { maxParallelism: number; parallelizableGroups: string[][] }
  ): string {
    if (metadata.maxParallelism <= 1) {
      return 'Sequential execution ensures each step builds on previous insights for maximum coherence.';
    }

    const techniques = new Set(nodes.map(n => n.technique));
    const techniqueCount = techniques.size;

    if (techniques.has('six_hats')) {
      return 'Running Six Hats perspectives in parallel provides diverse viewpoints simultaneously, reducing cognitive bias from sequential influence.';
    } else if (techniques.has('scamper')) {
      return 'Parallel SCAMPER transformations allow exploring multiple modification approaches simultaneously, increasing creative output.';
    } else if (techniques.has('nine_windows')) {
      return 'Examining all nine windows in parallel provides a comprehensive system view across time and scale simultaneously.';
    } else if (techniqueCount > 1) {
      return `Running ${techniqueCount} techniques in parallel provides diverse problem-solving approaches simultaneously, reducing overall thinking time by approximately ${metadata.maxParallelism}x.`;
    }

    return 'Parallel execution enables exploring multiple perspectives simultaneously, reducing time and increasing diversity of insights.';
  }

  /**
   * Determine if a step can be skipped if it fails
   */
  private static canSkipIfFailed(technique: LateralTechnique): boolean {
    // For parallel techniques, individual steps can often be skipped
    const parallelTechniques: LateralTechnique[] = ['six_hats', 'scamper', 'nine_windows'];

    return parallelTechniques.includes(technique);
  }
}
