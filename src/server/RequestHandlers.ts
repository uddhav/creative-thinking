/**
 * RequestHandlers - MCP request handlers for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { LateralThinkingServer } from '../index.js';
import { workflowGuard } from '../core/WorkflowGuard.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import { getAllTools } from './ToolDefinitions.js';
import type { CreativeThinkingError } from '../errors/enhanced-errors.js';
import { ObjectFieldValidator } from '../core/validators/ObjectFieldValidator.js';
import { PromptsHandler } from './PromptsHandler.js';

export class RequestHandlers {
  private activeRequests = 0;
  private requestLog: Array<{ timestamp: string; method: string; id?: string | number }> = [];

  // Batch collection for parallel execution
  private batchCollector: Map<
    string,
    {
      calls: Array<{
        request: unknown;
        resolve: (result: Record<string, unknown>) => void;
        reject: (error: unknown) => void;
      }>;
      timeout: NodeJS.Timeout;
    }
  > = new Map();

  // Configuration
  private readonly BATCH_COLLECTION_WINDOW = parseInt(process.env.MCP_BATCH_WINDOW || '10'); // ms
  private readonly MAX_PARALLEL_EXECUTIONS = parseInt(process.env.MCP_MAX_PARALLEL || '11');

  // Prompts handler
  private promptsHandler: PromptsHandler;

  constructor(
    private server: Server,
    private lateralServer: LateralThinkingServer
  ) {
    // Set up WorkflowGuard with SessionManager for plan validation
    workflowGuard.setSessionManager(this.lateralServer.getSessionManager());

    // Initialize prompts handler
    this.promptsHandler = new PromptsHandler();
  }

  public getActiveRequests(): number {
    return this.activeRequests;
  }

  /**
   * Set up all request handlers
   */
  setupHandlers(): void {
    this.setupListToolsHandler();
    this.setupCallToolHandler();
    this.setupListPromptsHandler();
    this.setupGetPromptHandler();
  }

  /**
   * Handle tool listing requests
   */
  private setupListToolsHandler(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: getAllTools(),
    }));
  }

  /**
   * Handle prompts listing requests
   */
  private setupListPromptsHandler(): void {
    this.server.setRequestHandler(ListPromptsRequestSchema, () => ({
      prompts: this.promptsHandler.getPrompts(),
    }));
  }

  /**
   * Handle get prompt requests
   */
  private setupGetPromptHandler(): void {
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
  private setupCallToolHandler(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      this.activeRequests++;
      const requestTimestamp = new Date().toISOString();

      // Log all incoming requests
      console.error('[RequestHandler] Incoming tool call:', {
        method: request.method || 'tools/call',
        activeRequests: this.activeRequests,
        timestamp: requestTimestamp,
      });

      // Early logging to catch requests before any processing
      if (request.params && typeof request.params === 'object' && 'name' in request.params) {
        const toolName = (request.params as Record<string, unknown>).name;
        console.error('[RequestHandler] Tool name:', toolName);

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
      const toolName = (request.params as Record<string, unknown>)?.name;
      if (toolName === 'execute_thinking_step') {
        const args = (request.params as Record<string, unknown>)?.arguments as Record<
          string,
          unknown
        >;
        const planId = args?.planId as string;

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
  private validateRequiredParameters(toolName: string, args: unknown): string | null {
    // Check for empty or missing arguments object
    if (
      !args ||
      typeof args !== 'object' ||
      Object.keys(args as Record<string, unknown>).length === 0
    ) {
      return (
        `❌ ERROR: ${toolName} called with empty parameters!\n\n` +
        `REQUIRED PARAMETERS MISSING:\n` +
        this.getRequiredParametersMessage(toolName) +
        `\n\n⚠️ CRITICAL: All creative thinking tools require parameters. ` +
        `Empty {} calls are not allowed.\n` +
        `Please provide the required parameters and try again.`
      );
    }

    // Tool-specific validation
    const params = args as Record<string, unknown>;
    switch (toolName) {
      case 'discover_techniques':
        if (!params.problem || typeof params.problem !== 'string' || params.problem.trim() === '') {
          return (
            `❌ ERROR: discover_techniques requires a non-empty 'problem' parameter!\n\n` +
            `You provided: ${JSON.stringify(args)}\n\n` +
            `CORRECT USAGE:\n` +
            `{\n` +
            `  "problem": "Your specific problem or challenge here"\n` +
            `}\n\n` +
            `Example: {"problem": "How to improve team productivity"}\n\n` +
            `⚠️ The 'problem' parameter is MANDATORY and must describe the challenge to solve.`
          );
        }
        break;

      case 'plan_thinking_session':
        if (!params.problem || typeof params.problem !== 'string' || params.problem.trim() === '') {
          return (
            `❌ ERROR: plan_thinking_session requires a 'problem' parameter!\n\n` +
            `MISSING: problem (string) - The challenge to solve`
          );
        }
        if (
          !params.techniques ||
          !Array.isArray(params.techniques) ||
          params.techniques.length === 0
        ) {
          return (
            `❌ ERROR: plan_thinking_session requires a 'techniques' array!\n\n` +
            `You provided: ${JSON.stringify(args)}\n\n` +
            `CORRECT USAGE:\n` +
            `{\n` +
            `  "problem": "Your problem here",\n` +
            `  "techniques": ["six_hats", "scamper"]\n` +
            `}\n\n` +
            `Valid techniques: six_hats, po, random_entry, scamper, concept_extraction, ` +
            `yes_and, design_thinking, triz, neural_state, temporal_work, cross_cultural, ` +
            `collective_intel, disney_method, nine_windows`
          );
        }
        break;

      case 'execute_thinking_step': {
        const missingParams = [];
        if (!params.planId) missingParams.push('planId (from plan_thinking_session)');
        if (!params.technique) missingParams.push('technique');
        if (!params.problem) missingParams.push('problem');
        if (typeof params.currentStep !== 'number') missingParams.push('currentStep (number)');
        if (typeof params.totalSteps !== 'number') missingParams.push('totalSteps (number)');
        if (!params.output) missingParams.push('output (thinking content)');
        if (typeof params.nextStepNeeded !== 'boolean')
          missingParams.push('nextStepNeeded (boolean)');

        if (missingParams.length > 0) {
          return (
            `❌ ERROR: execute_thinking_step missing required parameters!\n\n` +
            `MANDATORY PARAMETERS MISSING: ${missingParams.join(', ')}\n\n` +
            `⚠️ CRITICAL: You must execute ALL steps sequentially (1, 2, 3, etc.) ` +
            `without skipping any. Each step builds on previous insights.\n\n` +
            `Remember: nextStepNeeded should be true until the FINAL step.`
          );
        }

        // Validate object fields for specific techniques
        const technique = params.technique as string;

        // Nine Windows: validate currentCell
        if (technique === 'nine_windows' && params.currentCell !== undefined) {
          const validation = ObjectFieldValidator.validateCurrentCell(params.currentCell);
          if (!validation.isValid) {
            return (
              `❌ ERROR: Invalid currentCell format!\n\n` +
              `${validation.error}\n\n` +
              `${validation.suggestion || ''}\n\n` +
              `CORRECT FORMAT:\n` +
              `currentCell: {\n` +
              `  "timeFrame": "past" | "present" | "future",\n` +
              `  "systemLevel": "sub-system" | "system" | "super-system"\n` +
              `}`
            );
          }
        }

        // Concept Extraction: validate pathImpact
        if (technique === 'concept_extraction' && params.pathImpact !== undefined) {
          const validation = ObjectFieldValidator.validateIsObject(params.pathImpact, 'pathImpact');
          if (!validation.isValid) {
            return (
              `❌ ERROR: Invalid pathImpact format!\n\n` +
              `${validation.error}\n\n` +
              `${validation.suggestion || ''}\n\n` +
              `Note: pathImpact should be an object, not a string or other type.`
            );
          }
        }

        // Temporal Work: validate temporalLandscape
        if (technique === 'temporal_work' && params.temporalLandscape !== undefined) {
          const validation = ObjectFieldValidator.validateIsObject(
            params.temporalLandscape,
            'temporalLandscape'
          );
          if (!validation.isValid) {
            return (
              `❌ ERROR: Invalid temporalLandscape format!\n\n` +
              `${validation.error}\n\n` +
              `${validation.suggestion || ''}\n\n` +
              `Note: temporalLandscape should be an object, not a string or other type.`
            );
          }
        }

        // Validate array fields for all techniques
        const arrayValidation = ObjectFieldValidator.validateTechniqueArrayFields(
          technique,
          params
        );
        if (!arrayValidation.isValid) {
          return (
            `❌ ERROR: Invalid array field format!\n\n` +
            `${arrayValidation.error}\n\n` +
            `${arrayValidation.recovery || ''}\n\n` +
            `IMPORTANT: Array fields must be actual JavaScript arrays, not JSON strings.\n` +
            `Example: dreamerVision: ["idea1", "idea2"], NOT dreamerVision: '["idea1", "idea2"]'`
          );
        }

        // Check for step skipping
        if ((params.currentStep as number) > 1) {
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
  private async handlePotentialBatchCall(
    request: unknown,
    planId: string
  ): Promise<Record<string, unknown>> {
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
      if (!batch) return reject(new Error('Batch collector not found'));
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
  private async processBatch(planId: string): Promise<void> {
    const batch = this.batchCollector.get(planId);
    if (!batch || batch.calls.length === 0) return;

    this.batchCollector.delete(planId);
    clearTimeout(batch.timeout);

    const startTime = Date.now();
    const callCount = batch.calls.length;

    console.error('[RequestHandler] Processing batch:', {
      planId,
      callCount,
      timestamp: new Date().toISOString(),
    });

    // Track individual execution times for comparison
    // const _sequentialEstimate = callCount * 500; // Estimate 500ms per call if sequential

    // Process all calls in parallel with timing using Promise.allSettled for robustness
    const timingPromises = batch.calls.map(async ({ request }, index) => {
      const callStart = Date.now();
      try {
        const result = await this.processSingleCall(request);
        const callDuration = Date.now() - callStart;
        return { result, duration: callDuration, index, success: true };
      } catch (error) {
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

    // Process settlements to separate successful and failed results
    interface SuccessResult {
      index: number;
      result: Record<string, unknown>;
      duration: number;
    }
    interface FailedResult {
      index: number;
      error: unknown;
      errorMessage: string;
      duration: number;
    }
    const successfulResults: SuccessResult[] = [];
    const failedResults: FailedResult[] = [];
    const allDurations: number[] = [];

    settlements.forEach((settlement, index) => {
      if (settlement.status === 'fulfilled') {
        const result = settlement.value;
        allDurations.push(result.duration);

        if (result.success) {
          successfulResults.push({
            index,
            result: result.result as Record<string, unknown>,
            duration: result.duration,
          });
        } else {
          // This was a caught error within processSingleCall
          failedResults.push({
            index,
            error: result.error,
            errorMessage: result.errorMessage || 'Unknown error',
            duration: result.duration,
          });
        }
      } else {
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
    const successCount = successfulResults.length;
    const failureCount = failedResults.length;

    // Calculate metrics
    const maxIndividualDuration = allDurations.length > 0 ? Math.max(...allDurations) : 0;
    const avgIndividualDuration =
      allDurations.length > 0 ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length : 0;
    const theoreticalSequentialTime = allDurations.reduce((a, b) => a + b, 0);
    const actualSpeedup =
      theoreticalSequentialTime > 0 ? theoreticalSequentialTime / totalDuration : 0;

    // Log performance metrics with success/failure breakdown
    console.error('[RequestHandler] Batch completed - Performance Metrics:', {
      planId,
      callCount,
      successCount,
      failureCount,
      successRate: `${((successCount / callCount) * 100).toFixed(1)}%`,
      totalDuration,
      maxIndividualDuration,
      avgIndividualDuration,
      theoreticalSequentialTime,
      actualSpeedup: `${actualSpeedup.toFixed(2)}x`,
      efficiency: `${((actualSpeedup / callCount) * 100).toFixed(1)}%`,
      timeSaved: `${theoreticalSequentialTime - totalDuration}ms`,
    });

    // Log failures if any occurred
    if (failureCount > 0) {
      console.error('[RequestHandler] Failed calls in batch:', {
        planId,
        failures: failedResults.map(f => ({
          index: f.index,
          errorMessage: f.errorMessage,
          duration: f.duration,
        })),
      });
    }

    // Resolve/reject promises based on their individual results
    batch.calls.forEach(({ resolve, reject }, index) => {
      const successResult = successfulResults.find(r => r.index === index);
      if (successResult) {
        resolve(successResult.result);
      } else {
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
        } else {
          // This shouldn't happen, but handle it just in case
          reject(new Error('Result not found for request'));
        }
      }
    });
  }

  /**
   * Process a single tool call
   */
  private async processSingleCall(request: unknown): Promise<Record<string, unknown>> {
    this.activeRequests++;
    const requestTimestamp = new Date().toISOString();

    try {
      // Extract parameters
      const params = (request as Record<string, unknown>).params as Record<string, unknown>;
      const name = params.name as string;
      const args = params.arguments;

      // Pre-validate required parameters
      const validationError = this.validateRequiredParameters(name, args);
      if (validationError) {
        console.error('[RequestHandler] Validation error:', {
          timestamp: requestTimestamp,
          tool: name,
          message: validationError,
        });

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
        const enhancedError = violationError as CreativeThinkingError;

        console.error('[RequestHandler] Workflow violation detected:', {
          timestamp: requestTimestamp,
          tool: name,
          violation: violation.type,
          message: enhancedError.message,
          code: enhancedError.code,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: enhancedError.message,
                  code: enhancedError.code,
                  recovery: enhancedError.recovery,
                },
                null,
                2
              ),
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
        console.error('[RequestHandler] Warning: Invalid response structure:', {
          hasContent: !!response.content,
          isArray: Array.isArray(response.content),
          contentType: typeof response.content,
        });

        // Fix the response structure
        response.content = [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ];
      }

      return response;
    } finally {
      this.activeRequests--;
    }
  }

  /**
   * Get required parameters message for a tool
   */
  private getRequiredParametersMessage(toolName: string): string {
    switch (toolName) {
      case 'discover_techniques':
        return (
          `• problem (string): The challenge or problem to solve\n` +
          `• context (string, optional): Additional context\n` +
          `• preferredOutcome (string, optional): Type of solution preferred\n` +
          `• constraints (array, optional): Any limitations`
        );

      case 'plan_thinking_session':
        return (
          `• problem (string): The problem to solve\n` +
          `• techniques (array): List of techniques to use\n` +
          `• objectives (array, optional): Specific goals\n` +
          `• timeframe (string, optional): quick/thorough/comprehensive`
        );

      case 'execute_thinking_step':
        return (
          `• planId (string): The ID from plan_thinking_session\n` +
          `• technique (string): Current technique being executed\n` +
          `• problem (string): The problem being solved\n` +
          `• currentStep (number): Current step number (sequential)\n` +
          `• totalSteps (number): Total steps for this technique\n` +
          `• output (string): Your thinking for this step\n` +
          `• nextStepNeeded (boolean): true unless final step`
        );

      default:
        return 'Unknown tool';
    }
  }
}
