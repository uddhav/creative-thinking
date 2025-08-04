/**
 * ParallelPlanGenerator - Generates parallel execution plans for creative thinking techniques
 * Splits multi-technique sessions into independent plans that can run concurrently
 */
import { randomUUID } from 'crypto';
import { TechniqueDependencyAnalyzer, } from './TechniqueDependencyAnalyzer.js';
import { defaultParallelismConfig } from '../../config/parallelism.js';
import { logger } from '../../utils/Logger.js';
/**
 * Generates parallel execution plans for creative thinking sessions
 */
export class ParallelPlanGenerator {
    techniqueRegistry;
    dependencyAnalyzer;
    constructor(techniqueRegistry) {
        this.techniqueRegistry = techniqueRegistry;
        this.dependencyAnalyzer = new TechniqueDependencyAnalyzer();
    }
    /**
     * Generate parallel or sequential plans based on execution mode
     */
    generateParallelPlans(input, executionMode, convergenceOptions) {
        // Sequential mode - use existing logic
        if (executionMode === 'sequential') {
            return this.generateSequentialPlan(input);
        }
        const { problem, techniques, objectives, constraints } = input;
        // 1. Analyze dependencies
        const dependencyGraph = this.dependencyAnalyzer.analyzeDependencies(techniques);
        // 2. Create execution groups
        const executionGroups = this.createExecutionGroups(techniques, dependencyGraph, input.maxParallelism);
        // 3. Generate individual plans
        const parallelPlans = executionGroups.map((group, index) => this.createPlanForGroup(group, input, index));
        // 4. Create convergence plan if needed
        let convergencePlan;
        if (convergenceOptions?.method === 'execute_thinking_step') {
            convergencePlan = this.createConvergencePlan(parallelPlans, input, convergenceOptions);
        }
        // 5. Generate coordination strategy
        const coordinationStrategy = this.createCoordinationStrategy(parallelPlans, convergencePlan, convergenceOptions);
        // 6. Build final output
        const allPlans = convergencePlan ? [...parallelPlans, convergencePlan] : parallelPlans;
        return {
            planId: `parallel_${randomUUID()}`,
            problem,
            techniques,
            executionMode: 'parallel',
            parallelPlans: allPlans,
            convergenceOptions,
            coordinationStrategy,
            totalSteps: this.calculateTotalSteps(parallelPlans, convergencePlan),
            estimatedTotalTime: this.estimateParallelTime(parallelPlans, convergencePlan),
            objectives,
            constraints,
            createdAt: Date.now(),
            workflow: this.createCombinedWorkflow(parallelPlans), // For backward compatibility
        };
    }
    /**
     * Generate a sequential plan (fallback for sequential mode)
     */
    generateSequentialPlan(input) {
        const { problem, techniques, objectives, constraints, timeframe } = input;
        const workflow = this.createSequentialWorkflow(techniques, problem, timeframe);
        return {
            planId: `plan_${randomUUID()}`,
            problem,
            techniques,
            executionMode: 'sequential',
            workflow,
            totalSteps: workflow.reduce((sum, item) => sum + item.steps.length, 0),
            estimatedTotalTime: this.estimateSequentialTime(workflow),
            objectives,
            constraints,
            createdAt: Date.now(),
        };
    }
    /**
     * Create execution groups based on dependencies and parallelism constraints
     */
    createExecutionGroups(techniques, dependencyGraph, maxParallelism) {
        const maxGroups = maxParallelism || defaultParallelismConfig.limits.maxParallelism;
        // Use dependency analyzer to find optimal grouping
        const groups = this.dependencyAnalyzer.findOptimalGrouping(techniques, maxGroups);
        // Optimize groups for balanced execution
        return this.optimizeGroups(groups, dependencyGraph);
    }
    /**
     * Create a plan for a group of techniques
     */
    createPlanForGroup(techniques, input, groupIndex) {
        const planId = `plan_group_${groupIndex}_${randomUUID()}`;
        // Generate workflow for techniques in this group
        const workflow = techniques.map(technique => {
            const handler = this.techniqueRegistry.getHandler(technique);
            const info = handler.getTechniqueInfo();
            const steps = this.generateStepsForTechnique(technique, input.problem, info.totalSteps);
            return {
                technique,
                steps,
                estimatedTime: this.estimateTime(technique, input.timeframe),
                requiredInputs: this.getRequiredInputs(technique),
                expectedOutputs: this.getExpectedOutputs(technique),
            };
        });
        // Check if this group can run independently
        const dependencies = this.findGroupDependencies(techniques);
        return {
            planId,
            techniques,
            workflow,
            estimatedTime: this.calculateGroupTime(workflow, 'parallel'),
            canExecuteIndependently: dependencies.length === 0,
            dependencies,
            metadata: {
                techniqueCount: techniques.length,
                totalSteps: workflow.reduce((sum, w) => sum + w.steps.length, 0),
                complexity: this.assessGroupComplexity(techniques),
            },
        };
    }
    /**
     * Create a convergence plan for synthesizing parallel results
     */
    createConvergencePlan(parallelPlans, input, convergenceOptions) {
        const planId = `plan_convergence_${randomUUID()}`;
        // Create convergence workflow based on input context
        const { problem, objectives, constraints } = input;
        // Customize steps based on convergence options
        const synthesisStrategy = convergenceOptions.convergencePlan?.metadata?.synthesisStrategy || 'comprehensive';
        const convergenceSteps = [
            {
                stepNumber: 1,
                description: `Analyze results from all parallel techniques for: ${problem}`,
                expectedOutput: 'Comprehensive overview of all generated ideas and insights',
                criticalLens: 'Identify patterns, conflicts, and synergies across approaches',
                successCriteria: ['All parallel results reviewed', 'Key themes identified'],
            },
            {
                stepNumber: 2,
                description: 'Synthesize insights across techniques' +
                    (objectives?.length ? ` to meet objectives: ${objectives.join(', ')}` : ''),
                expectedOutput: 'Unified insights that leverage strengths of each approach',
                criticalLens: 'Resolve conflicts and find complementary aspects',
                successCriteria: ['Conflicts resolved', 'Synergies exploited', 'Gaps identified'],
            },
            {
                stepNumber: 3,
                description: 'Generate final recommendations' +
                    (constraints?.length ? ` respecting constraints: ${constraints.join(', ')}` : ''),
                expectedOutput: 'Actionable recommendations based on synthesized insights',
                criticalLens: 'Ensure recommendations are practical and comprehensive',
                successCriteria: [
                    'Clear action items',
                    'Addresses original problem',
                    'Risk assessment included',
                ],
            },
        ];
        const workflow = [
            {
                technique: 'convergence',
                steps: convergenceSteps,
                estimatedTime: '15 minutes',
                requiredInputs: ['Results from all parallel plans'],
                expectedOutputs: ['Synthesized insights', 'Unified recommendations', 'Action plan'],
            },
        ];
        return {
            planId,
            techniques: ['convergence'],
            workflow,
            estimatedTime: '15 minutes',
            canExecuteIndependently: false,
            dependencies: parallelPlans.map(p => p.planId),
            metadata: {
                techniqueCount: 1,
                totalSteps: convergenceSteps.length,
                complexity: synthesisStrategy === 'comprehensive' ? 'high' : 'medium',
            },
        };
    }
    /**
     * Create coordination strategy for parallel execution
     */
    createCoordinationStrategy(parallelPlans, convergencePlan, convergenceOptions) {
        const syncPoints = [];
        // Add sync point before convergence
        if (convergencePlan) {
            syncPoints.push({
                afterPlanIds: parallelPlans.map(p => p.planId),
                action: 'wait', // Wait for all parallel plans to complete
            });
        }
        // Add checkpoints for long-running plans
        const longRunningPlans = parallelPlans.filter(p => p.metadata && p.metadata.totalSteps > 10);
        if (longRunningPlans.length > 0) {
            syncPoints.push({
                afterPlanIds: longRunningPlans.map(p => p.planId),
                action: 'checkpoint',
            });
        }
        return {
            syncPoints,
            sharedContext: {
                enabled: convergenceOptions?.method === 'execute_thinking_step',
                updateStrategy: 'checkpoint', // Update shared context at checkpoints
            },
            errorHandling: 'partial_results', // Continue with available results if some fail
        };
    }
    /**
     * Calculate total steps across all plans
     */
    calculateTotalSteps(parallelPlans, convergencePlan) {
        // In parallel execution, total steps is the max of parallel groups plus convergence
        const maxParallelSteps = Math.max(...parallelPlans.map(plan => plan.workflow.reduce((sum, w) => sum + w.steps.length, 0)));
        const convergenceSteps = convergencePlan
            ? convergencePlan.workflow.reduce((sum, w) => sum + w.steps.length, 0)
            : 0;
        return maxParallelSteps + convergenceSteps;
    }
    /**
     * Estimate time for parallel execution
     */
    estimateParallelTime(parallelPlans, convergencePlan) {
        // Find the longest running parallel group
        const maxParallelTime = Math.max(...parallelPlans.map(plan => this.parseTimeMinutes(plan.estimatedTime)));
        // Add convergence time if applicable
        const convergenceTime = convergencePlan
            ? this.parseTimeMinutes(convergencePlan.estimatedTime)
            : 0;
        // Add overhead for coordination (10%)
        const overhead = Math.ceil(maxParallelTime * 0.1);
        const totalMinutes = maxParallelTime + convergenceTime + overhead;
        return `${totalMinutes} minutes (parallel execution)`;
    }
    /**
     * Parse time string to minutes
     */
    parseTimeMinutes(timeStr) {
        const match = timeStr.match(/(\d+)\s*minutes?/);
        return match ? parseInt(match[1], 10) : 30;
    }
    /**
     * Optimize groups for balanced execution
     */
    optimizeGroups(groups, dependencyGraph) {
        // Balance groups by estimated execution time and dependencies
        const optimized = [...groups];
        // Verify no dependencies are split across groups
        for (let i = 0; i < optimized.length; i++) {
            for (const technique of optimized[i]) {
                const dependencies = dependencyGraph.getDependencies(technique);
                // Check if any dependencies are in other groups
                for (let j = 0; j < optimized.length; j++) {
                    if (i === j)
                        continue;
                    for (const dep of dependencies) {
                        if (optimized[j].includes(dep)) {
                            // Move dependent technique to the same group as its dependency
                            optimized[i] = optimized[i].filter(t => t !== technique);
                            optimized[j].push(technique);
                            break;
                        }
                    }
                }
            }
        }
        // Calculate dependency depth for each group for complexity assessment
        const groupComplexities = optimized.map(group => {
            let maxDepth = 0;
            for (const technique of group) {
                const deps = dependencyGraph.getDependencies(technique);
                maxDepth = Math.max(maxDepth, deps.length);
            }
            return maxDepth;
        });
        // Balance groups by size and complexity
        if (optimized.length > 1) {
            const avgComplexity = groupComplexities.reduce((a, b) => a + b, 0) / groupComplexities.length;
            const maxSize = Math.max(...optimized.map(g => g.length));
            const minSize = Math.min(...optimized.map(g => g.length));
            // Log optimization info for debugging
            if (maxSize - minSize > 2 || Math.max(...groupComplexities) > avgComplexity * 2) {
                logger.debug('Group imbalance detected', {
                    sizeRange: `${minSize}-${maxSize}`,
                    complexities: groupComplexities,
                    avgComplexity: parseFloat(avgComplexity.toFixed(2)),
                    imbalanceType: maxSize - minSize > 2 ? 'size' : 'complexity',
                });
            }
        }
        return optimized.filter(group => group.length > 0); // Remove empty groups
    }
    /**
     * Create sequential workflow for backward compatibility
     */
    createSequentialWorkflow(techniques, problem, timeframe) {
        return techniques.map(technique => {
            const handler = this.techniqueRegistry.getHandler(technique);
            const info = handler.getTechniqueInfo();
            const steps = this.generateStepsForTechnique(technique, problem, info.totalSteps);
            return {
                technique,
                steps,
                estimatedTime: this.estimateTime(technique, timeframe),
            };
        });
    }
    /**
     * Create combined workflow from parallel plans (for backward compatibility)
     */
    createCombinedWorkflow(parallelPlans) {
        const combined = [];
        for (const plan of parallelPlans) {
            combined.push(...plan.workflow);
        }
        return combined;
    }
    /**
     * Generate steps for a specific technique
     */
    generateStepsForTechnique(technique, problem, totalSteps) {
        const handler = this.techniqueRegistry.getHandler(technique);
        const steps = [];
        for (let i = 1; i <= totalSteps; i++) {
            const stepInfo = handler.getStepInfo(i);
            steps.push({
                stepNumber: i,
                description: stepInfo.focus,
                expectedOutput: `${stepInfo.name} output for: ${problem}`,
                criticalLens: this.getCriticalLensForStep(technique, i),
                successCriteria: this.getSuccessCriteriaForStep(technique, i),
            });
        }
        return steps;
    }
    /**
     * Get critical lens for a specific step
     */
    getCriticalLensForStep(technique, step) {
        // Add critical thinking prompts for specific techniques/steps
        const criticalLenses = {
            six_hats: {
                5: 'Identify potential risks and downsides', // Black hat
            },
            triz: {
                3: 'Challenge the solution for robustness',
            },
            disney_method: {
                3: 'Apply rigorous criticism to find flaws', // Critic phase
            },
        };
        return criticalLenses[technique]?.[step];
    }
    /**
     * Get success criteria for a specific step
     */
    getSuccessCriteriaForStep(technique, step) {
        // Define success criteria for key steps
        if (step === 1) {
            return ['Problem clearly understood', 'Initial approach defined'];
        }
        // Last step criteria
        const handler = this.techniqueRegistry.getHandler(technique);
        const info = handler.getTechniqueInfo();
        if (step === info.totalSteps) {
            return ['Actionable insights generated', 'Next steps identified'];
        }
        return undefined;
    }
    /**
     * Estimate time for a technique
     */
    estimateTime(technique, timeframe) {
        const timeEstimates = {
            six_hats: 30,
            po: 20,
            random_entry: 15,
            scamper: 40,
            concept_extraction: 25,
            yes_and: 20,
            design_thinking: 50,
            triz: 40,
            neural_state: 30,
            temporal_work: 35,
            cross_cultural: 30,
            collective_intel: 35,
            disney_method: 30,
            nine_windows: 25,
            convergence: 15,
        };
        const baseMinutes = timeEstimates[technique] || 30;
        // Adjust based on timeframe
        let multiplier = 1;
        if (timeframe === 'quick')
            multiplier = 0.5;
        else if (timeframe === 'thorough')
            multiplier = 1.5;
        else if (timeframe === 'comprehensive')
            multiplier = 2;
        const adjustedMinutes = Math.round(baseMinutes * multiplier);
        return `${adjustedMinutes} minutes`;
    }
    /**
     * Calculate time for a group of techniques
     */
    calculateGroupTime(workflow, mode) {
        const times = workflow.map(w => this.parseTimeMinutes(w.estimatedTime));
        const totalMinutes = mode === 'sequential' ? times.reduce((sum, t) => sum + t, 0) : Math.max(...times);
        return `${totalMinutes} minutes`;
    }
    /**
     * Estimate sequential time
     */
    estimateSequentialTime(workflow) {
        const totalMinutes = workflow.reduce((sum, w) => sum + this.parseTimeMinutes(w.estimatedTime), 0);
        return `${totalMinutes} minutes`;
    }
    /**
     * Get required inputs for a technique
     */
    getRequiredInputs(technique) {
        const inputs = {
            six_hats: ['Problem statement', 'Context'],
            po: ['Current assumptions', 'Constraints'],
            random_entry: ['Problem area', 'Random stimulus source'],
            scamper: ['Object/process to modify', 'Current state'],
            concept_extraction: ['Success example', 'Problem context'],
            yes_and: ['Initial idea', 'Collaboration mindset'],
            design_thinking: ['User needs', 'Problem context', 'Resources'],
            triz: ['Technical problem', 'System constraints', 'Contradictions'],
            neural_state: ['Current mental state', 'Task requirements'],
            temporal_work: ['Time constraints', 'Work patterns'],
            cross_cultural: ['Cultural contexts', 'Problem domain'],
            collective_intel: ['Knowledge sources', 'Synthesis goals'],
            disney_method: ['Vision', 'Resources', 'Constraints'],
            nine_windows: ['System definition', 'Time horizons'],
            convergence: ['Results from all techniques', 'Original problem'],
        };
        return inputs[technique] || ['Problem statement'];
    }
    /**
     * Get expected outputs for a technique
     */
    getExpectedOutputs(technique) {
        const outputs = {
            six_hats: ['Multi-perspective analysis', 'Balanced decision'],
            po: ['Challenged assumptions', 'New possibilities'],
            random_entry: ['Creative connections', 'Novel ideas'],
            scamper: ['Modified solutions', 'Innovation options'],
            concept_extraction: ['Core principles', 'Transferable patterns'],
            yes_and: ['Built-up ideas', 'Collaborative solutions'],
            design_thinking: ['User-centered solution', 'Prototype plan'],
            triz: ['Technical solution', 'Resolved contradictions'],
            neural_state: ['Optimized cognitive approach', 'Mental strategies'],
            temporal_work: ['Time-based solutions', 'Rhythm patterns'],
            cross_cultural: ['Diverse perspectives', 'Cultural insights'],
            collective_intel: ['Synthesized knowledge', 'Collective wisdom'],
            disney_method: ['Refined vision', 'Practical plan', 'Risk assessment'],
            nine_windows: ['System understanding', 'Evolution insights'],
            convergence: ['Unified solution', 'Action plan', 'Risk mitigation'],
        };
        return outputs[technique] || ['Insights', 'Solutions'];
    }
    /**
     * Find dependencies for a group
     */
    findGroupDependencies(techniques) {
        const dependencies = [];
        // Check each technique in this group for dependencies
        for (const technique of techniques) {
            const techDeps = this.dependencyAnalyzer.getAllDependencies(technique);
            // Check if any dependencies are in other groups
            for (const dep of techDeps.hard) {
                // Find which group contains this dependency
                // Note: This is a simplified implementation - in real usage,
                // we'd need to track which techniques are in which groups
                if (!techniques.includes(dep)) {
                    // Dependency is in another group
                    dependencies.push(`group_containing_${dep}`);
                }
            }
        }
        return [...new Set(dependencies)]; // Remove duplicates
    }
    /**
     * Assess complexity of a group
     */
    assessGroupComplexity(techniques) {
        const complexityScores = {
            six_hats: 2,
            po: 2,
            random_entry: 1,
            scamper: 3,
            concept_extraction: 2,
            yes_and: 1,
            design_thinking: 3,
            triz: 3,
            neural_state: 2,
            temporal_work: 2,
            cross_cultural: 2,
            collective_intel: 3,
            disney_method: 2,
            nine_windows: 2,
            convergence: 3,
        };
        const totalScore = techniques.reduce((sum, tech) => sum + (complexityScores[tech] || 2), 0);
        const avgScore = totalScore / techniques.length;
        if (avgScore <= 1.5)
            return 'low';
        if (avgScore <= 2.5)
            return 'medium';
        return 'high';
    }
}
//# sourceMappingURL=ParallelPlanGenerator.js.map