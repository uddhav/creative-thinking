/**
 * WorkflowGuard - Enforces the three-tool workflow pattern
 * Tracks tool usage and provides helpful guidance when workflow is violated
 */
import { ErrorFactory } from '../errors/enhanced-errors.js';
export class WorkflowGuard {
    recentCalls = [];
    CALL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
    parallelCallGroups = new Map(); // Track parallel calls by planId
    validTechniques = [
        'six_hats',
        'po',
        'random_entry',
        'scamper',
        'concept_extraction',
        'yes_and',
        'design_thinking',
        'triz',
        'neural_state',
        'temporal_work',
        'cross_cultural',
        'collective_intel',
        'disney_method',
        'nine_windows',
        'convergence', // Special technique for synthesizing parallel results
    ];
    /**
     * Record a tool call
     */
    recordCall(toolName, args) {
        this.recentCalls.push({
            toolName,
            timestamp: Date.now(),
            args,
        });
        this.cleanupOldCalls();
    }
    /**
     * Check if the workflow is being followed correctly
     */
    checkWorkflowViolation(toolName, args) {
        this.cleanupOldCalls();
        if (toolName === 'execute_thinking_step') {
            return this.checkExecutionViolations(args);
        }
        return null;
    }
    /**
     * Check violations for parallel execution calls
     */
    checkParallelExecutionViolations(calls) {
        this.cleanupOldCalls();
        // All calls must be execute_thinking_step
        const nonExecuteCalls = calls.filter(call => call.name !== 'execute_thinking_step');
        if (nonExecuteCalls.length > 0) {
            return {
                type: 'parallel_inconsistent',
                message: 'Parallel calls must all be execute_thinking_step',
                guidance: [
                    'Only execute_thinking_step can be called in parallel',
                    'discover_techniques and plan_thinking_session must be called individually',
                ],
            };
        }
        // Check that all have the same planId
        const planIds = new Set(calls.map(call => {
            const args = call.arguments;
            return args.planId;
        }));
        if (planIds.size > 1) {
            return {
                type: 'parallel_inconsistent',
                message: 'All parallel executions must use the same planId',
                guidance: [
                    'Parallel calls must be part of the same planning session',
                    'Use the planId from plan_thinking_session for all parallel calls',
                ],
            };
        }
        // Check that discovery and planning were done
        const hasDiscovery = this.recentCalls.some(call => call.toolName === 'discover_techniques');
        const hasPlanning = this.recentCalls.some(call => call.toolName === 'plan_thinking_session');
        if (!hasDiscovery || !hasPlanning) {
            return {
                type: 'parallel_without_plan',
                message: 'Parallel execution requires prior discovery and planning',
                guidance: [
                    '1. First call discover_techniques to analyze the problem',
                    '2. Then call plan_thinking_session with executionMode: "parallel"',
                    '3. Finally execute techniques in parallel using the planId',
                ],
            };
        }
        // Track parallel call group
        const planId = Array.from(planIds)[0];
        if (planId) {
            this.parallelCallGroups.set(planId, calls.map(call => ({
                toolName: 'execute_thinking_step',
                timestamp: Date.now(),
                args: call.arguments,
            })));
        }
        return null;
    }
    /**
     * Get helpful error response for workflow violations
     * Now returns specialized error objects instead of generic responses
     */
    getViolationError(violation) {
        switch (violation.type) {
            case 'skipped_discovery':
                return ErrorFactory.discoverySkipped();
            case 'skipped_planning':
                return ErrorFactory.planningSkipped();
            case 'invalid_technique': {
                // Extract technique from violation message
                const match = violation.message.match(/Invalid technique '([^']+)'/);
                const technique = match ? match[1] : 'unknown';
                // Get recommended techniques from recent discovery call
                const discoveryCall = this.recentCalls.find(call => call.toolName === 'discover_techniques');
                const recommended = this.getRecommendedTechniques(discoveryCall);
                return ErrorFactory.unauthorizedTechnique(technique, recommended);
            }
            case 'fabricated_planid':
                return ErrorFactory.workflowBypassAttempt('Using fabricated or invalid planId');
            case 'parallel_without_plan':
                return ErrorFactory.workflowBypassAttempt('Attempting parallel execution without proper planning');
            case 'parallel_inconsistent':
                return ErrorFactory.workflowBypassAttempt(violation.message);
            default:
                return ErrorFactory.workflowBypassAttempt(violation.message);
        }
    }
    checkExecutionViolations(args) {
        const execArgs = args;
        // Check for recent discovery call
        const hasDiscovery = this.recentCalls.some(call => call.toolName === 'discover_techniques');
        // Check for recent planning call
        const hasPlanning = this.recentCalls.some(call => call.toolName === 'plan_thinking_session');
        // If no discovery was called
        if (!hasDiscovery) {
            return {
                type: 'skipped_discovery',
                message: 'You must start with discover_techniques to analyze the problem',
                guidance: [
                    '1. First call discover_techniques with your problem description',
                    '2. Review the recommended techniques',
                    '3. Then call plan_thinking_session with chosen techniques',
                    '4. Finally use execute_thinking_step with the returned planId',
                ],
                example: JSON.stringify({
                    step1: {
                        tool: 'discover_techniques',
                        args: {
                            problem: 'How to improve team collaboration',
                            context: 'Remote team struggling with communication',
                        },
                    },
                    step2: {
                        tool: 'plan_thinking_session',
                        args: {
                            problem: 'How to improve team collaboration',
                            techniques: ['six_hats', 'yes_and'],
                        },
                    },
                    step3: {
                        tool: 'execute_thinking_step',
                        args: {
                            planId: '<planId from step 2>',
                            technique: 'six_hats',
                            problem: 'How to improve team collaboration',
                            currentStep: 1,
                            totalSteps: 6,
                            output: 'My analysis...',
                            nextStepNeeded: true,
                        },
                    },
                }, null, 2),
            };
        }
        // If no planning was called
        if (!hasPlanning) {
            return {
                type: 'skipped_planning',
                message: 'You must create a plan before executing thinking steps',
                guidance: [
                    '1. You already called discover_techniques - good!',
                    '2. Now call plan_thinking_session with your chosen techniques',
                    '3. Use the planId from the response in execute_thinking_step',
                    'The planId ensures your session is properly tracked and guided',
                ],
            };
        }
        // Check for invalid technique
        if (execArgs.technique && !this.validTechniques.includes(execArgs.technique)) {
            return {
                type: 'invalid_technique',
                message: `Invalid technique '${execArgs.technique}'. This technique does not exist.`,
                guidance: [
                    'Use only techniques returned by discover_techniques',
                    'Or choose from the list of valid techniques',
                    'Custom or made-up techniques are not supported',
                ],
            };
        }
        return null;
    }
    cleanupOldCalls() {
        const cutoff = Date.now() - this.CALL_WINDOW_MS;
        this.recentCalls = this.recentCalls.filter(call => call.timestamp > cutoff);
    }
    /**
     * Extract recommended techniques from discovery call
     */
    getRecommendedTechniques(discoveryCall) {
        if (!discoveryCall)
            return [];
        // In a real implementation, this would parse the discovery response
        // For now, return a sensible default based on validTechniques
        return this.validTechniques.slice(0, 3);
    }
}
// Singleton instance
export const workflowGuard = new WorkflowGuard();
//# sourceMappingURL=WorkflowGuard.js.map