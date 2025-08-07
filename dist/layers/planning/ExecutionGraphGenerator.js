/**
 * ExecutionGraphGenerator - Generates DAG for client-side parallel execution
 */
export class ExecutionGraphGenerator {
    /**
     * Generate execution graph from workflow
     */
    static generateExecutionGraph(planId, problem, workflows) {
        const nodes = [];
        let nodeId = 0;
        let globalStepNumber = 0;
        // Process each technique workflow
        for (const workflow of workflows) {
            const techniqueNodes = this.generateTechniqueNodes(planId, problem, workflow, nodeId, globalStepNumber);
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
    static generateTechniqueNodes(planId, problem, workflow, startNodeId, startStepNumber) {
        const nodes = [];
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
    static getDependencies(technique, stepIndex, startNodeId) {
        // Techniques with parallel steps (no dependencies between steps)
        const parallelTechniques = ['six_hats', 'scamper', 'nine_windows'];
        // Techniques with sequential steps (each depends on previous)
        const sequentialTechniques = [
            'design_thinking',
            'disney_method',
            'triz',
            'po',
        ];
        // Hybrid techniques with custom patterns
        const hybridTechniques = [
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
    static getHybridDependencies(technique, stepIndex, startNodeId) {
        switch (technique) {
            case 'concept_extraction':
                // Steps 2-3 can be parallel after step 1
                if (stepIndex === 0)
                    return [];
                if (stepIndex === 1 || stepIndex === 2)
                    return [`node-${startNodeId + 1}`];
                return [`node-${startNodeId + stepIndex}`];
            case 'neural_state':
                // Steps 2-3 can be parallel after step 1, step 4 depends on all
                if (stepIndex === 0)
                    return [];
                if (stepIndex === 1 || stepIndex === 2)
                    return [`node-${startNodeId + 1}`];
                if (stepIndex === 3)
                    return [`node-${startNodeId + 2}`, `node-${startNodeId + 3}`];
                return [];
            default:
                // Default to sequential for other hybrid techniques
                if (stepIndex === 0)
                    return [];
                return [`node-${startNodeId + stepIndex}`];
        }
    }
    /**
     * Build complete parameters for execute_thinking_step
     */
    static buildParameters(planId, problem, technique, currentStep, totalSteps, step) {
        const baseParams = {
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
     */
    static getTechniqueSpecificParams(technique, currentStep, step) {
        switch (technique) {
            case 'six_hats': {
                const hatColors = ['blue', 'white', 'red', 'yellow', 'black', 'green', 'purple'];
                return {
                    hatColor: hatColors[currentStep - 1],
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
                ];
                return {
                    scamperAction: scamperActions[currentStep - 1],
                };
            }
            case 'design_thinking': {
                const designStages = ['empathize', 'define', 'ideate', 'prototype', 'test'];
                return {
                    designStage: designStages[currentStep - 1],
                };
            }
            case 'disney_method': {
                const disneyRoles = ['dreamer', 'realist', 'critic'];
                return {
                    disneyRole: disneyRoles[currentStep - 1],
                };
            }
            case 'nine_windows': {
                const nineWindowsCells = [
                    { systemLevel: 'sub-system', timeFrame: 'past' },
                    { systemLevel: 'sub-system', timeFrame: 'present' },
                    { systemLevel: 'sub-system', timeFrame: 'future' },
                    { systemLevel: 'system', timeFrame: 'past' },
                    { systemLevel: 'system', timeFrame: 'present' },
                    { systemLevel: 'system', timeFrame: 'future' },
                    { systemLevel: 'super-system', timeFrame: 'past' },
                    { systemLevel: 'super-system', timeFrame: 'present' },
                    { systemLevel: 'super-system', timeFrame: 'future' },
                ];
                const cell = nineWindowsCells[currentStep - 1];
                return {
                    currentCell: cell,
                };
            }
            case 'po':
                return {
                    provocation: step.description || '',
                };
            case 'random_entry':
                return {
                    randomStimulus: step.stimulus || '',
                };
            case 'triz':
                return {
                    contradiction: step.contradiction || '',
                    inventivePrinciples: [],
                };
            default:
                return {};
        }
    }
    /**
     * Calculate metadata for the execution graph
     */
    static calculateMetadata(nodes) {
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
     */
    static findParallelizableGroups(nodes) {
        const groups = [];
        const processed = new Set();
        for (const node of nodes) {
            if (processed.has(node.id))
                continue;
            // Find all nodes that can run in parallel with this node
            const group = [node.id];
            processed.add(node.id);
            for (const other of nodes) {
                if (processed.has(other.id))
                    continue;
                // Nodes can run in parallel if they have the same dependencies
                if (this.arraysEqual(node.dependencies, other.dependencies)) {
                    group.push(other.id);
                    processed.add(other.id);
                }
            }
            if (group.length > 0) {
                groups.push(group);
            }
        }
        return groups;
    }
    /**
     * Find the critical path through the graph
     */
    static findCriticalPath(nodes) {
        if (nodes.length === 0)
            return [];
        // Build adjacency list
        const graph = new Map();
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
        if (startNodes.length === 0)
            return [];
        // Find longest path from each start node
        let longestPath = [];
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
    static dfs(nodeId, graph, visited) {
        if (visited.has(nodeId))
            return [];
        visited.add(nodeId);
        const neighbors = graph.get(nodeId) || [];
        let longestSubpath = [];
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
    static generateInstructions(_nodes, metadata) {
        const hasParallelNodes = metadata.maxParallelism > 1;
        return {
            forInvoker: `This is a Directed Acyclic Graph (DAG) for execution. Each node represents a call to execute_thinking_step with the provided parameters. ${hasParallelNodes
                ? 'Nodes with no dependencies or the same dependencies can be executed in parallel by making concurrent execute_thinking_step calls. To execute in parallel: identify nodes with empty or satisfied dependencies, then call execute_thinking_step for each node simultaneously. Monitor completion and proceed to dependent nodes.'
                : 'Execute nodes sequentially in the order provided, as each depends on the previous.'} The planId and all required parameters are pre-populated in each node. Simply use the parameters object from each node when calling execute_thinking_step.`,
            executionStrategy: hasParallelNodes ? 'parallel-capable' : 'sequential',
            errorHandling: 'continue-on-non-critical-failure',
        };
    }
    /**
     * Estimate duration for a technique step
     */
    static estimateDuration(technique) {
        // Rough estimates in milliseconds
        const estimates = {
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
    static canSkipIfFailed(technique) {
        // For parallel techniques, individual steps can often be skipped
        const parallelTechniques = ['six_hats', 'scamper', 'nine_windows'];
        return parallelTechniques.includes(technique);
    }
    /**
     * Check if two arrays are equal
     */
    static arraysEqual(a, b) {
        if (a.length !== b.length)
            return false;
        const sortedA = [...a].sort();
        const sortedB = [...b].sort();
        return sortedA.every((val, idx) => val === sortedB[idx]);
    }
}
//# sourceMappingURL=ExecutionGraphGenerator.js.map