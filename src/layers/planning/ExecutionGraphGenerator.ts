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

    // nextStepNeeded: false triggers the executor's completion path, so only
    // the plan-wide last node may carry it. Per-technique terminal nodes used
    // to send false too (they were computed from technique-local counts),
    // which finalized and then blocked the session at every technique
    // boundary when the graph was executed verbatim.
    const lastNode = nodes[nodes.length - 1];
    if (lastNode) {
      lastNode.parameters.nextStepNeeded = false;

      // The terminal node ends the session, so every other technique must
      // finish first even under parallel execution. Soft dependencies order
      // it last without blocking — parallelizableGroups reads hard deps only.
      const existing = new Set(lastNode.dependencies.map(d => d.nodeId));
      let offset = 0;
      for (const workflow of workflows) {
        const techniqueFinal = nodes[offset + workflow.steps.length - 1];
        offset += workflow.steps.length;
        if (techniqueFinal && techniqueFinal !== lastNode && !existing.has(techniqueFinal.id)) {
          lastNode.dependencies.push({ nodeId: techniqueFinal.id, type: 'soft' });
          existing.add(techniqueFinal.id);
        }
      }
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

    // A plan-time assigned stimulus lives on the block's step 1 but applies to
    // EVERY step of the technique — a po/random_entry session works with one
    // value throughout. Nodes previously carried the per-step description as
    // provocation on steps 2+, so a caller executing the graph verbatim sent
    // guidance prose that the stimulus.mismatch gate then flagged.
    const blockFirst = workflow.steps[0] as
      { stimulus?: string; stimulusSource?: string } | undefined;
    const assignedStimulus =
      blockFirst?.stimulusSource === 'assigned' ? blockFirst.stimulus : undefined;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      const nodeId = `node-${startNodeId + i + 1}`;
      const stepNumber = startStepNumber + i + 1;

      // Determine dependencies based on technique type
      const dependencies = this.getDependencies(technique, i, startNodeId);

      // Build complete parameters for execute_thinking_step
      const parameters = this.buildParameters(
        planId,
        technique,
        i + 1,
        totalSteps,
        assignedStimulus !== undefined ? { ...step, stimulus: assignedStimulus } : step
      );

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
    // There is no parallel-steps class any more.
    //
    // `six_hats`, `scamper` and `nine_windows` were listed here and emitted no
    // dependencies at all, on the reasoning that their steps are independent
    // perspectives. As a claim about the method that is defensible; as a claim
    // about execution it was not. The steps of one technique run against one
    // sessionId, and concurrent writes to a session are last-writer-wins and
    // unprotected across processes — so the graph was advertising a race, and
    // contradicting the documented guarantee that steps within one technique
    // are ordered.
    //
    // They now chain like the other 29. Dependencies and parallelizableGroups
    // say the same thing, rather than a client getting a different schedule
    // depending on which field it reads.

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
      'cultural_integration',
      'collective_intel',
    ];

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
   * Build complete parameters for execute_thinking_step.
   *
   * These parameters are the contract: a caller runs them verbatim, filling
   * only `output` and threading `sessionId`. `problem` is deliberately absent
   * — one copy per node meant 25 copies of the caller's problem in a
   * five-technique plan, half the total echo. `execute_thinking_step` resolves
   * it from `planId` instead, which is why `problem` is optional there.
   */
  private static buildParameters(
    planId: string,
    technique: LateralTechnique,
    currentStep: number,
    totalSteps: number,
    step: { description?: string; stimulus?: string; contradiction?: string }
  ): Omit<ExecuteThinkingStepInput, 'problem'> {
    const baseParams: Omit<ExecuteThinkingStepInput, 'problem'> = {
      planId,
      technique,
      currentStep,
      totalSteps,
      output: '',
      // Only the plan-wide last node ends the session; generateExecutionGraph
      // flips that single node to false after all techniques are laid out.
      nextStepNeeded: true,
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
        // Prefer the plan-time assigned provocation; the description is the
        // full guidance text and only ever a fallback.
        return {
          provocation:
            (step as { stimulus?: string; description?: string }).stimulus ||
            (step as { description?: string }).description ||
            '',
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
   *
   * Never groups two steps of the SAME technique, even when the dependency
   * classification says their steps are independent — `six_hats`, `scamper`
   * and `nine_windows` are listed as parallel techniques, so all seven
   * six_hats nodes shared one empty dependency signature and landed in a
   * single group of seven.
   *
   * Two reasons that was wrong to emit. It contradicted the documented
   * guarantee that steps within one technique are ordered, naming this very
   * field as the authority on what may run concurrently. And the steps of one
   * technique run against one sessionId: concurrent writes there are
   * last-writer-wins, and unprotected across processes. Whether the six hats
   * are conceptually independent is a separate question from whether they can
   * safely share a session, and only the second one decides this field.
   */
  private static findParallelizableGroups(nodes: ExecutionGraphNode[]): string[][] {
    // Group nodes by their hard dependency signature (soft deps don't block parallel execution)
    const depGroups = new Map<string, ExecutionGraphNode[]>();

    for (const node of nodes) {
      // Create a consistent key from hard dependencies only
      // Optimized: build array in single pass without intermediate filter/map
      const hardDeps: string[] = [];
      for (const dep of node.dependencies) {
        if (dep.type === 'hard') {
          hardDeps.push(dep.nodeId);
        }
      }
      hardDeps.sort();
      const depKey = JSON.stringify(hardDeps);

      if (!depGroups.has(depKey)) {
        depGroups.set(depKey, []);
      }
      const group = depGroups.get(depKey);
      if (group) {
        group.push(node);
      }
    }

    // Split each dependency group so no technique appears twice in one round.
    // Nodes keep their order, so a technique's k-th node lands in round k and
    // different techniques' k-th nodes share it — techniques advance
    // concurrently, steps within a technique do not.
    const rounds: string[][] = [];
    for (const group of depGroups.values()) {
      const seenPerTechnique = new Map<string, number>();
      const localRounds: string[][] = [];
      for (const node of group) {
        const round = seenPerTechnique.get(node.technique) ?? 0;
        seenPerTechnique.set(node.technique, round + 1);
        (localRounds[round] ??= []).push(node.id);
      }
      rounds.push(...localRounds);
    }

    return rounds.filter(group => group.length > 0);
  }

  /**
   * Find the critical path through the graph
   */
  private static findCriticalPath(nodes: ExecutionGraphNode[]): string[] {
    if (nodes.length === 0) return [];

    // Build adjacency list (considering only hard dependencies for critical path)
    const graph = new Map<string, string[]>();
    const startNodes: ExecutionGraphNode[] = [];

    for (const node of nodes) {
      if (!graph.has(node.id)) {
        graph.set(node.id, []);
      }

      // Check for hard dependencies in a single pass
      let hasHardDeps = false;
      for (const dep of node.dependencies) {
        if (dep.type === 'hard') {
          hasHardDeps = true;
          if (!graph.has(dep.nodeId)) {
            graph.set(dep.nodeId, []);
          }
          graph.get(dep.nodeId)?.push(node.id);
        }
      }

      // Track start nodes while iterating
      if (!hasHardDeps) {
        startNodes.push(node);
      }
    }

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
    const terminalNote =
      ' The final node carries nextStepNeeded: false and ends the session - execute it only after every other node has completed.';
    const executionGuidance =
      (hasParallelNodes
        ? 'Nodes with empty dependencies can execute immediately. For nodes with dependencies, wait for hard dependencies to complete before starting. Soft dependencies are preferential - better results if completed first, but not blocking. Check the dependencies array for each node to determine execution order.'
        : 'Execute nodes sequentially in the order provided. Each node depends on the previous one completing.') +
      terminalNote;

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

    // The terminal node is always a sync point: it carries the session-ending
    // nextStepNeeded: false and must run after everything else.
    const lastNode = nodes[nodes.length - 1];
    if (lastNode && !syncPoints.includes(lastNode.id)) {
      syncPoints.push(lastNode.id);
    }

    return syncPoints;
  }

  /**
   * Generate description of parallelization benefits
   */
  private static generateParallelizationBenefits(
    nodes: ExecutionGraphNode[],
    metadata: {
      maxParallelism: number;
      parallelizableGroups: string[][];
      sequentialTimeMultiplier: string;
    }
  ): string {
    if (metadata.maxParallelism <= 1) {
      return 'Sequential execution ensures each step builds on previous insights for maximum coherence.';
    }

    const techniqueCount = new Set(nodes.map(n => n.technique)).size;

    // The per-technique strings that were here promised parallel Six Hats,
    // parallel SCAMPER and parallel Nine Windows — the steps of ONE technique
    // running at once, which the graph no longer offers because those steps
    // share a session. What is parallel is techniques against each other.
    //
    // The speedup cites `sequentialTimeMultiplier` rather than computing a
    // second figure from `maxParallelism`. Those were two different numbers
    // for one quantity in one response: a plan reporting "10x" in metadata
    // said "approximately 7x" here.
    if (techniqueCount > 1) {
      return `Running ${techniqueCount} techniques concurrently explores different approaches at the same time, cutting wall-clock time by roughly ${metadata.sequentialTimeMultiplier} versus running them end to end. Steps within a technique stay ordered.`;
    }

    return 'Independent techniques can run concurrently; the steps within each stay ordered, so a single-technique plan runs end to end.';
  }

  /**
   * Determine if a step can be skipped if it fails
   */
  private static canSkipIfFailed(technique: LateralTechnique): boolean {
    // Techniques whose steps are independent perspectives on one problem, so
    // losing one does not invalidate the rest. A separate question from
    // whether they may run CONCURRENTLY, which they may not — they share a
    // session, and concurrent writes there are last-writer-wins. These three
    // used to answer both questions from one list.
    const independentPerspectiveTechniques: LateralTechnique[] = [
      'six_hats',
      'scamper',
      'nine_windows',
    ];

    return independentPerspectiveTechniques.includes(technique);
  }
}
