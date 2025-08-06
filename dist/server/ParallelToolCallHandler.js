/**
 * ParallelToolCallHandler - Handles Anthropic-style parallel tool calls
 * Manages concurrent execution of multiple tool calls and technique parallelization
 */
import { ParallelismValidator } from '../layers/discovery/ParallelismValidator.js';
import { workflowGuard } from '../core/WorkflowGuard.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import { ParallelExecutionContext } from '../layers/execution/ParallelExecutionContext.js';
/**
 * Handles parallel tool calls following Anthropic's pattern
 */
export class ParallelToolCallHandler {
    lateralServer;
    parallelismValidator;
    maxParallelCalls;
    toolCallCounter = 0; // For generating unique IDs
    constructor(lateralServer, maxParallelCalls = 10) {
        this.lateralServer = lateralServer;
        this.parallelismValidator = new ParallelismValidator();
        this.maxParallelCalls = maxParallelCalls;
    }
    /**
     * Check if the request contains parallel tool calls
     */
    isParallelRequest(params) {
        return (Array.isArray(params) &&
            params.length > 0 &&
            params.every(call => typeof call === 'object' &&
                call !== null &&
                ('name' in call || 'type' in call) &&
                ('arguments' in call || 'input' in call)));
    }
    /**
     * Generate unique tool_use_id
     */
    generateToolUseId() {
        this.toolCallCounter++;
        return `toolu_${Date.now()}_${this.toolCallCounter.toString().padStart(3, '0')}`;
    }
    /**
     * Normalize tool call to common format
     */
    normalizeToolCall(call) {
        // If it's Anthropic format, normalize to our internal format
        if (call.type === 'tool_use' && call.input) {
            return {
                ...call,
                arguments: call.input,
                id: call.id || this.generateToolUseId(),
            };
        }
        // Ensure all calls have an ID
        if (!call.id) {
            call.id = this.generateToolUseId();
        }
        return call;
    }
    /**
     * Process parallel tool calls
     */
    async processParallelToolCalls(calls) {
        // Normalize all calls to ensure they have IDs
        const normalizedCalls = calls.map(call => this.normalizeToolCall(call));
        // Check workflow violations first
        const workflowViolation = workflowGuard.checkParallelExecutionViolations(normalizedCalls);
        if (workflowViolation) {
            const error = workflowGuard.getViolationError(workflowViolation);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: error.message,
                            code: error.code,
                            recovery: error.recovery,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
        // Validate parallel calls
        const validation = this.validateParallelCalls(normalizedCalls);
        if (!validation.isValid) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Invalid parallel tool calls',
                            errors: validation.errors,
                            warnings: validation.warnings,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
        // Check if all calls are execute_thinking_step
        const allExecute = normalizedCalls.every(call => call.name === 'execute_thinking_step');
        if (allExecute) {
            return this.processParallelExecutions(normalizedCalls);
        }
        else {
            // For mixed or non-execute calls, process sequentially for now
            // (discover and plan must be sequential)
            return this.processSequentialCalls(normalizedCalls);
        }
    }
    /**
     * Process parallel execute_thinking_step calls
     */
    async processParallelExecutions(calls) {
        try {
            // Check memory pressure before parallel execution
            // Note: We access sessionManager and visualFormatter through the server
            // These are private properties on the server, so we need type assertions
            const serverWithInternals = this.lateralServer;
            const parallelContext = ParallelExecutionContext.getInstance(serverWithInternals.sessionManager, serverWithInternals.visualFormatter);
            const memoryCheck = parallelContext.checkMemoryPressure();
            if (!memoryCheck.canProceed) {
                // Fall back to sequential execution due to memory pressure
                if (memoryCheck.warning) {
                    console.error(`[ParallelToolCallHandler] ${memoryCheck.warning}`);
                }
                return this.processSequentialCalls(calls);
            }
            if (memoryCheck.warning) {
                console.error(`[ParallelToolCallHandler] Warning: ${memoryCheck.warning}`);
            }
            // Execute all calls in parallel with error isolation
            const results = await Promise.allSettled(calls.map(async (call) => {
                try {
                    const result = await this.lateralServer.executeThinkingStep(call.arguments);
                    return { call, result };
                }
                catch (error) {
                    // Return error response in expected format
                    return {
                        call,
                        result: {
                            isError: true,
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify({
                                        error: {
                                            message: error instanceof Error ? error.message : 'Unknown error',
                                            technique: call.arguments.technique,
                                            step: call.arguments.currentStep,
                                        },
                                    }),
                                },
                            ],
                        },
                    };
                }
            }));
            // Build response based on format preference
            // Always return standard MCP format responses
            // The order of responses matches the order of requests for correlation
            const combinedContent = results.map((result, index) => {
                const call = calls[index];
                if (result.status === 'fulfilled') {
                    const { result: response } = result.value;
                    // For standard tool responses, return the content directly
                    // MCP expects the actual tool response, not wrapped in additional metadata
                    if (response.isError) {
                        // Return error response as-is
                        return response.content[0];
                    }
                    else {
                        // Return success response as-is
                        return response.content[0];
                    }
                }
                else {
                    // Handle rejected promises
                    return {
                        type: 'text',
                        text: JSON.stringify({
                            error: {
                                message: result.reason instanceof Error ? result.reason.message : 'Execution failed',
                                reason: String(result.reason),
                                toolIndex: index,
                                technique: call.arguments.technique,
                                step: call.arguments.currentStep,
                            },
                        }, null, 2),
                    };
                }
            });
            return {
                content: combinedContent,
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: 'Parallel execution failed',
                            message: error instanceof Error ? error.message : 'Unknown error',
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    /**
     * Process calls sequentially (for non-parallelizable operations)
     */
    async processSequentialCalls(calls) {
        // Always return standard MCP format responses
        // Process each call and collect responses in order
        const responses = [];
        for (const call of calls) {
            try {
                let result;
                switch (call.name) {
                    case 'discover_techniques':
                        result = this.lateralServer.discoverTechniques(call.arguments);
                        break;
                    case 'plan_thinking_session':
                        result = this.lateralServer.planThinkingSession(call.arguments);
                        break;
                    case 'execute_thinking_step':
                        result = await this.lateralServer.executeThinkingStep(call.arguments);
                        break;
                    default:
                        throw new ValidationError(ErrorCode.INVALID_INPUT, `Unknown tool: ${call.name}`, 'toolName');
                }
                // Return the tool's response content directly
                responses.push(result.content[0]);
            }
            catch (error) {
                // For errors, return an error response in standard format
                responses.push({
                    type: 'text',
                    text: JSON.stringify({
                        error: {
                            message: error instanceof Error ? error.message : 'Unknown error',
                            tool: call.name,
                        },
                    }, null, 2),
                });
            }
        }
        // Return all responses in order
        return {
            content: responses,
        };
    }
    /**
     * Validate parallel tool calls
     */
    validateParallelCalls(calls) {
        const errors = [];
        const warnings = [];
        // Check max parallel calls
        if (calls.length > this.maxParallelCalls) {
            errors.push(`Too many parallel calls: ${calls.length} exceeds maximum of ${this.maxParallelCalls}`);
        }
        // Check tool types
        const toolNames = calls.map(c => c.name);
        const uniqueTools = new Set(toolNames);
        // Discover and plan cannot be parallel with anything
        if (uniqueTools.has('discover_techniques') && calls.length > 1) {
            errors.push('discover_techniques must be called alone (cannot be parallel with other tools)');
        }
        if (uniqueTools.has('plan_thinking_session') && calls.length > 1) {
            errors.push('plan_thinking_session must be called alone (cannot be parallel with other tools)');
        }
        // If all are execute_thinking_step, validate they can run in parallel
        if (toolNames.every(name => name === 'execute_thinking_step')) {
            const validation = this.validateParallelExecutions(calls);
            errors.push(...validation.errors);
            warnings.push(...validation.warnings);
        }
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Validate parallel execute_thinking_step calls
     */
    validateParallelExecutions(calls) {
        const errors = [];
        const warnings = [];
        // Validate required parameters for each call
        for (let i = 0; i < calls.length; i++) {
            const args = calls[i].arguments;
            if (!args.technique || !args.problem || !args.currentStep || !args.totalSteps) {
                errors.push(`Call ${i + 1}: Missing required parameters (technique, problem, currentStep, totalSteps)`);
            }
            // Validate step ranges
            const currentStep = args.currentStep;
            const totalSteps = args.totalSteps;
            if (currentStep < 1 || currentStep > totalSteps) {
                errors.push(`Call ${i + 1}: Invalid step ${currentStep} for technique ${String(args.technique)} (must be 1-${totalSteps})`);
            }
        }
        // Extract execution details
        const executions = calls.map(call => ({
            planId: call.arguments.planId,
            sessionId: call.arguments.sessionId,
            technique: call.arguments.technique,
            currentStep: call.arguments.currentStep,
            totalSteps: call.arguments.totalSteps,
        }));
        // Check consistency of plan IDs
        const planIds = new Set(executions.map(e => e.planId));
        if (planIds.size > 1 && !planIds.has(undefined)) {
            errors.push('All parallel executions must have the same planId or no planId');
        }
        // Check consistency of session IDs for same technique
        const techniqueGroups = new Map();
        for (const exec of executions) {
            if (!techniqueGroups.has(exec.technique)) {
                techniqueGroups.set(exec.technique, []);
            }
            techniqueGroups.get(exec.technique)?.push(exec);
        }
        for (const [technique, group] of techniqueGroups) {
            const sessionIds = new Set(group.map(e => e.sessionId));
            if (sessionIds.size > 1 && !sessionIds.has(undefined)) {
                errors.push(`Technique ${technique}: All parallel steps must use the same sessionId`);
            }
            // Check for duplicate steps within same technique
            const steps = group.map(e => e.currentStep);
            const uniqueSteps = new Set(steps);
            if (uniqueSteps.size !== steps.length) {
                errors.push(`Technique ${technique}: Duplicate step numbers detected in parallel calls`);
            }
        }
        // Check technique dependencies using ParallelismValidator
        const techniques = [...new Set(executions.map(e => e.technique))];
        if (techniques.length > 1) {
            const validation = this.parallelismValidator.validateParallelRequest(techniques);
            if (!validation.isValid) {
                errors.push(...validation.errors);
            }
            warnings.push(...validation.warnings);
        }
        return { errors, warnings };
    }
    /**
     * Create execution groups for a plan
     */
    createExecutionGroups(plan) {
        const groups = [];
        if (plan.executionMode === 'parallel') {
            // Group techniques that can run in parallel
            const techniques = plan.techniques;
            const processed = new Set();
            for (const technique of techniques) {
                if (processed.has(technique))
                    continue;
                const group = {
                    techniques: [technique],
                    canRunInParallel: true,
                    parallelSteps: this.canTechniqueStepsRunInParallel(technique),
                };
                // Find other techniques that can run in parallel with this one
                for (const otherTechnique of techniques) {
                    if (otherTechnique === technique || processed.has(otherTechnique))
                        continue;
                    if (this.parallelismValidator.canTechniquesRunInParallel(technique, otherTechnique)) {
                        group.techniques.push(otherTechnique);
                        processed.add(otherTechnique);
                    }
                }
                processed.add(technique);
                groups.push(group);
            }
        }
        else {
            // Sequential execution - each technique in its own group
            for (const technique of plan.techniques) {
                groups.push({
                    techniques: [technique],
                    canRunInParallel: false,
                    parallelSteps: this.canTechniqueStepsRunInParallel(technique),
                });
            }
        }
        // Add convergence as final group if needed
        if (plan.convergenceConfig) {
            groups.push({
                techniques: ['convergence'],
                canRunInParallel: false,
                parallelSteps: false,
            });
        }
        return groups;
    }
    /**
     * Determine if a technique's steps can run in parallel
     */
    canTechniqueStepsRunInParallel(technique) {
        // Techniques whose steps can run in parallel
        const parallelStepTechniques = [
            'six_hats', // All hats can be worn simultaneously
            'scamper', // All transformations can be applied at once
            'nine_windows', // All windows can be viewed simultaneously
        ];
        // Techniques that MUST be sequential
        const sequentialStepTechniques = [
            'disney_method', // Dreamer → Realist → Critic
            'design_thinking', // Empathize → Define → Ideate → Prototype → Test
            'triz', // Problem → Contradiction → Principles → Solution
            'po', // Provocation → Exploration → Development → Implementation
        ];
        if (parallelStepTechniques.includes(technique)) {
            return true;
        }
        if (sequentialStepTechniques.includes(technique)) {
            return false;
        }
        // Default to sequential for safety
        return false;
    }
}
//# sourceMappingURL=ParallelToolCallHandler.js.map