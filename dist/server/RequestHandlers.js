/**
 * RequestHandlers - MCP request handlers for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */
import { CallToolRequestSchema, ListToolsRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { workflowGuard } from '../core/WorkflowGuard.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import { getAllTools } from './ToolDefinitions.js';
import { ObjectFieldValidator } from '../core/validators/ObjectFieldValidator.js';
import { PromptsHandler } from './PromptsHandler.js';
export class RequestHandlers {
    server;
    lateralServer;
    activeRequests = 0;
    requestLog = [];
    // Batch collection for parallel execution
    batchCollector = new Map();
    // Configuration
    BATCH_COLLECTION_WINDOW = parseInt(process.env.MCP_BATCH_WINDOW || '10'); // ms
    MAX_PARALLEL_EXECUTIONS = parseInt(process.env.MCP_MAX_PARALLEL || '11');
    // Prompts handler
    promptsHandler;
    constructor(server, lateralServer) {
        this.server = server;
        this.lateralServer = lateralServer;
        // Set up WorkflowGuard with SessionManager for plan validation
        workflowGuard.setSessionManager(this.lateralServer.getSessionManager());
        // Initialize prompts handler
        this.promptsHandler = new PromptsHandler();
    }
    getActiveRequests() {
        return this.activeRequests;
    }
    /**
     * Set up all request handlers
     */
    setupHandlers() {
        this.setupListToolsHandler();
        this.setupCallToolHandler();
        this.setupListPromptsHandler();
        this.setupGetPromptHandler();
        this.setupSamplingHandlers();
    }
    /**
     * Handle tool listing requests
     */
    setupListToolsHandler() {
        this.server.setRequestHandler(ListToolsRequestSchema, () => ({
            tools: getAllTools(),
        }));
    }
    /**
     * Handle prompts listing requests
     */
    setupListPromptsHandler() {
        this.server.setRequestHandler(ListPromptsRequestSchema, () => ({
            prompts: this.promptsHandler.getPrompts(),
        }));
    }
    /**
     * Handle get prompt requests
     */
    setupGetPromptHandler() {
        this.server.setRequestHandler(GetPromptRequestSchema, request => {
            const promptName = request.params.name;
            const promptData = this.promptsHandler.getPrompt(promptName);
            if (!promptData) {
                throw new Error(`Unknown prompt: ${promptName}`);
            }
            return promptData;
        });
    }
    /**
     * Handle tool call requests
     */
    setupCallToolHandler() {
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            this.activeRequests++;
            const requestTimestamp = new Date().toISOString();
            // Early logging to catch requests before any processing
            if (request.params && typeof request.params === 'object' && 'name' in request.params) {
                const toolName = request.params.name;
                // Add to request log
                this.requestLog.push({
                    timestamp: requestTimestamp,
                    method: `tools/call:${String(toolName)}`,
                });
                // Keep only last 100 requests in log
                if (this.requestLog.length > 100) {
                    this.requestLog.shift();
                }
            }
            // Array format validation is handled by validateRequiredParameters and ObjectFieldValidator
            // These validators ensure proper JSON-RPC error responses for invalid formats
            // Check if this is execute_thinking_step that could be part of a batch
            const toolName = request.params?.name;
            if (toolName === 'execute_thinking_step') {
                const args = request.params?.arguments;
                const planId = args?.planId;
                // If we have a planId, this could be part of a batch
                if (planId) {
                    return await this.handlePotentialBatchCall(request, planId);
                }
            }
            // Process as a single call
            return await this.processSingleCall(request);
        });
    }
    /**
     * Validate required parameters for each tool
     */
    validateRequiredParameters(toolName, args) {
        // Check for empty or missing arguments object
        if (!args ||
            typeof args !== 'object' ||
            Object.keys(args).length === 0) {
            return (`❌ ERROR: ${toolName} called with empty parameters!\n\n` +
                `REQUIRED PARAMETERS MISSING:\n` +
                this.getRequiredParametersMessage(toolName) +
                `\n\n⚠️ CRITICAL: All creative thinking tools require parameters. ` +
                `Empty {} calls are not allowed.\n` +
                `Please provide the required parameters and try again.`);
        }
        // Tool-specific validation
        const params = args;
        switch (toolName) {
            case 'discover_techniques':
                if (!params.problem || typeof params.problem !== 'string' || params.problem.trim() === '') {
                    return (`❌ ERROR: discover_techniques requires a non-empty 'problem' parameter!\n\n` +
                        `You provided: ${JSON.stringify(args)}\n\n` +
                        `CORRECT USAGE:\n` +
                        `{\n` +
                        `  "problem": "Your specific problem or challenge here"\n` +
                        `}\n\n` +
                        `Example: {"problem": "How to improve team productivity"}\n\n` +
                        `⚠️ The 'problem' parameter is MANDATORY and must describe the challenge to solve.`);
                }
                break;
            case 'plan_thinking_session':
                if (!params.problem || typeof params.problem !== 'string' || params.problem.trim() === '') {
                    return (`❌ ERROR: plan_thinking_session requires a 'problem' parameter!\n\n` +
                        `MISSING: problem (string) - The challenge to solve`);
                }
                if (!params.techniques ||
                    !Array.isArray(params.techniques) ||
                    params.techniques.length === 0) {
                    return (`❌ ERROR: plan_thinking_session requires a 'techniques' array!\n\n` +
                        `You provided: ${JSON.stringify(args)}\n\n` +
                        `CORRECT USAGE:\n` +
                        `{\n` +
                        `  "problem": "Your problem here",\n` +
                        `  "techniques": ["six_hats", "scamper"]\n` +
                        `}\n\n` +
                        `Valid techniques: six_hats, po, random_entry, scamper, concept_extraction, ` +
                        `yes_and, design_thinking, triz, neural_state, temporal_work, cross_cultural, ` +
                        `collective_intel, disney_method, nine_windows`);
                }
                break;
            case 'execute_thinking_step': {
                const missingParams = [];
                if (!params.planId)
                    missingParams.push('planId (from plan_thinking_session)');
                if (!params.technique)
                    missingParams.push('technique');
                if (!params.problem)
                    missingParams.push('problem');
                if (typeof params.currentStep !== 'number')
                    missingParams.push('currentStep (number)');
                if (typeof params.totalSteps !== 'number')
                    missingParams.push('totalSteps (number)');
                if (!params.output)
                    missingParams.push('output (thinking content)');
                if (typeof params.nextStepNeeded !== 'boolean')
                    missingParams.push('nextStepNeeded (boolean)');
                if (missingParams.length > 0) {
                    return (`❌ ERROR: execute_thinking_step missing required parameters!\n\n` +
                        `MANDATORY PARAMETERS MISSING: ${missingParams.join(', ')}\n\n` +
                        `⚠️ CRITICAL: You must execute ALL steps sequentially (1, 2, 3, etc.) ` +
                        `without skipping any. Each step builds on previous insights.\n\n` +
                        `Remember: nextStepNeeded should be true until the FINAL step.`);
                }
                // Validate object fields for specific techniques
                const technique = params.technique;
                // Nine Windows: validate currentCell
                if (technique === 'nine_windows' && params.currentCell !== undefined) {
                    const validation = ObjectFieldValidator.validateCurrentCell(params.currentCell);
                    if (!validation.isValid) {
                        return (`❌ ERROR: Invalid currentCell format!\n\n` +
                            `${validation.error}\n\n` +
                            `${validation.suggestion || ''}\n\n` +
                            `CORRECT FORMAT:\n` +
                            `currentCell: {\n` +
                            `  "timeFrame": "past" | "present" | "future",\n` +
                            `  "systemLevel": "sub-system" | "system" | "super-system"\n` +
                            `}`);
                    }
                }
                // Concept Extraction: validate pathImpact
                if (technique === 'concept_extraction' && params.pathImpact !== undefined) {
                    const validation = ObjectFieldValidator.validateIsObject(params.pathImpact, 'pathImpact');
                    if (!validation.isValid) {
                        return (`❌ ERROR: Invalid pathImpact format!\n\n` +
                            `${validation.error}\n\n` +
                            `${validation.suggestion || ''}\n\n` +
                            `Note: pathImpact should be an object, not a string or other type.`);
                    }
                }
                // Temporal Work: validate temporalLandscape
                if (technique === 'temporal_work' && params.temporalLandscape !== undefined) {
                    const validation = ObjectFieldValidator.validateIsObject(params.temporalLandscape, 'temporalLandscape');
                    if (!validation.isValid) {
                        return (`❌ ERROR: Invalid temporalLandscape format!\n\n` +
                            `${validation.error}\n\n` +
                            `${validation.suggestion || ''}\n\n` +
                            `Note: temporalLandscape should be an object, not a string or other type.`);
                    }
                }
                // Validate array fields for all techniques
                const arrayValidation = ObjectFieldValidator.validateTechniqueArrayFields(technique, params);
                if (!arrayValidation.isValid) {
                    return (`❌ ERROR: Invalid array field format!\n\n` +
                        `${arrayValidation.error}\n\n` +
                        `${arrayValidation.recovery || ''}\n\n` +
                        `IMPORTANT: Array fields must be actual JavaScript arrays, not JSON strings.\n` +
                        `Example: dreamerVision: ["idea1", "idea2"], NOT dreamerVision: '["idea1", "idea2"]'`);
                }
                // Check for step skipping
                if (params.currentStep > 1) {
                    // This is a follow-up step, we should warn about completeness
                    return null; // Let it proceed but the system will track if steps are skipped
                }
                break;
            }
        }
        return null; // No validation errors
    }
    /**
     * Handle a call that might be part of a batch
     */
    async handlePotentialBatchCall(request, planId) {
        return new Promise((resolve, reject) => {
            if (!this.batchCollector.has(planId)) {
                // Start collecting for this planId
                const timeout = setTimeout(() => {
                    void this.processBatch(planId);
                }, this.BATCH_COLLECTION_WINDOW);
                this.batchCollector.set(planId, {
                    calls: [],
                    timeout,
                });
            }
            // Add this call to the batch
            const batch = this.batchCollector.get(planId);
            if (!batch)
                return reject(new Error('Batch collector not found'));
            batch.calls.push({ request, resolve, reject });
            // If we've hit the max parallel executions, process immediately
            if (batch.calls.length >= this.MAX_PARALLEL_EXECUTIONS) {
                clearTimeout(batch.timeout);
                void this.processBatch(planId);
            }
        });
    }
    /**
     * Process a batch of calls in parallel
     */
    async processBatch(planId) {
        const batch = this.batchCollector.get(planId);
        if (!batch || batch.calls.length === 0)
            return;
        this.batchCollector.delete(planId);
        clearTimeout(batch.timeout);
        const startTime = Date.now();
        // Process all calls in parallel with timing using Promise.allSettled for robustness
        const timingPromises = batch.calls.map(async ({ request }, index) => {
            const callStart = Date.now();
            try {
                const result = await this.processSingleCall(request);
                const callDuration = Date.now() - callStart;
                return { result, duration: callDuration, index, success: true };
            }
            catch (error) {
                const callDuration = Date.now() - callStart;
                return {
                    error,
                    duration: callDuration,
                    index,
                    success: false,
                    errorMessage: error instanceof Error ? error.message : String(error),
                };
            }
        });
        // Use Promise.allSettled to handle both successes and failures gracefully
        const settlements = await Promise.allSettled(timingPromises);
        const successfulResults = [];
        const failedResults = [];
        const allDurations = [];
        settlements.forEach((settlement, index) => {
            if (settlement.status === 'fulfilled') {
                const result = settlement.value;
                allDurations.push(result.duration);
                if (result.success) {
                    successfulResults.push({
                        index,
                        result: result.result,
                        duration: result.duration,
                    });
                }
                else {
                    // This was a caught error within processSingleCall
                    failedResults.push({
                        index,
                        error: result.error,
                        errorMessage: result.errorMessage || 'Unknown error',
                        duration: result.duration,
                    });
                }
            }
            else {
                // This should rarely happen as we catch errors above
                failedResults.push({
                    index,
                    error: settlement.reason,
                    errorMessage: 'Unexpected promise rejection',
                    duration: 0,
                });
            }
        });
        const totalDuration = Date.now() - startTime;
        // Resolve/reject promises based on their individual results
        batch.calls.forEach(({ resolve, reject }, index) => {
            const successResult = successfulResults.find(r => r.index === index);
            if (successResult) {
                resolve(successResult.result);
            }
            else {
                const failResult = failedResults.find(r => r.index === index);
                if (failResult) {
                    // Instead of rejecting, we could also resolve with an error response
                    // This depends on how we want to handle failures
                    const errorResponse = {
                        content: [
                            {
                                type: 'text',
                                text: `Error processing request: ${failResult.errorMessage}`,
                            },
                        ],
                        isError: true,
                    };
                    resolve(errorResponse);
                }
                else {
                    // This shouldn't happen, but handle it just in case
                    reject(new Error('Result not found for request'));
                }
            }
        });
    }
    /**
     * Process a single tool call
     */
    async processSingleCall(request) {
        this.activeRequests++;
        try {
            // Extract parameters
            const params = request.params;
            const name = params.name;
            const args = params.arguments;
            // Pre-validate required parameters
            const validationError = this.validateRequiredParameters(name, args);
            if (validationError) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: validationError,
                        },
                    ],
                    isError: true,
                };
            }
            // Record the tool call for workflow tracking
            workflowGuard.recordCall(name, args);
            // Check for workflow violations before executing
            const violation = workflowGuard.checkWorkflowViolation(name, args);
            if (violation) {
                const violationError = workflowGuard.getViolationError(violation);
                const enhancedError = violationError;
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                error: enhancedError.message,
                                code: enhancedError.code,
                                recovery: enhancedError.recovery,
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
            // Execute the tool
            let result;
            switch (name) {
                case 'discover_techniques':
                    result = this.lateralServer.discoverTechniques(args);
                    break;
                case 'plan_thinking_session':
                    result = this.lateralServer.planThinkingSession(args);
                    break;
                case 'execute_thinking_step':
                    result = await this.lateralServer.executeThinkingStep(args);
                    break;
                default:
                    throw new ValidationError(ErrorCode.INVALID_INPUT, `Unknown tool: ${name}`, 'toolName', {
                        providedTool: name,
                    });
            }
            // Ensure we always return a properly formatted response
            const response = {
                content: result.content,
            };
            // Validate response structure before sending
            if (!response.content || !Array.isArray(response.content)) {
                // Fix the response structure
                response.content = [
                    {
                        type: 'text',
                        text: JSON.stringify(result),
                    },
                ];
            }
            return response;
        }
        finally {
            this.activeRequests--;
        }
    }
    /**
     * Get required parameters message for a tool
     */
    getRequiredParametersMessage(toolName) {
        switch (toolName) {
            case 'discover_techniques':
                return (`• problem (string): The challenge or problem to solve\n` +
                    `• context (string, optional): Additional context\n` +
                    `• preferredOutcome (string, optional): Type of solution preferred\n` +
                    `• constraints (array, optional): Any limitations`);
            case 'plan_thinking_session':
                return (`• problem (string): The problem to solve\n` +
                    `• techniques (array): List of techniques to use\n` +
                    `• objectives (array, optional): Specific goals\n` +
                    `• timeframe (string, optional): quick/thorough/comprehensive`);
            case 'execute_thinking_step':
                return (`• planId (string): The ID from plan_thinking_session\n` +
                    `• technique (string): Current technique being executed\n` +
                    `• problem (string): The problem being solved\n` +
                    `• currentStep (number): Current step number (sequential)\n` +
                    `• totalSteps (number): Total steps for this technique\n` +
                    `• output (string): Your thinking for this step\n` +
                    `• nextStepNeeded (boolean): true unless final step`);
            default:
                return 'Unknown tool';
        }
    }
    /**
     * Set up sampling-related handlers
     * Note: MCP Sampling uses custom methods that are not part of the standard schemas
     */
    setupSamplingHandlers() {
        // For now, we'll handle sampling through the existing infrastructure
        // When a client sends capability info, it will be processed through the tool calls
        // In the future, we can add custom handlers for:
        // - sampling/createRequest (server -> client)
        // - sampling/createResponse (client -> server)
        // Sampling handler is initialized but no logging needed
    }
}
//# sourceMappingURL=RequestHandlers.js.map