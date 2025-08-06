/**
 * RequestHandlers - MCP request handlers for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { LateralThinkingServer } from '../index.js';
import { workflowGuard } from '../core/WorkflowGuard.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import { getAllTools } from './ToolDefinitions.js';
import type { CreativeThinkingError } from '../errors/enhanced-errors.js';
import { ParallelToolCallHandler } from './ParallelToolCallHandler.js';
import { loadParallelConfig, validateParallelConfig } from '../config/parallel.js';

export class RequestHandlers {
  private parallelHandler: ParallelToolCallHandler;
  private parallelConfig = loadParallelConfig();

  constructor(
    private server: Server,
    private lateralServer: LateralThinkingServer
  ) {
    // Validate configuration on startup
    const configErrors = validateParallelConfig(this.parallelConfig);
    if (configErrors.length > 0) {
      console.error('[ParallelConfig] Configuration errors:', configErrors);
      // Use defaults if validation fails
      this.parallelConfig = loadParallelConfig();
    }

    // Initialize parallel handler with configuration
    this.parallelHandler = new ParallelToolCallHandler(
      lateralServer,
      this.parallelConfig.maxParallelCalls
    );

    // Log configuration if in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ParallelConfig] Loaded configuration:', {
        enabled: this.parallelConfig.enabled,
        maxCalls: this.parallelConfig.maxParallelCalls,
        timeout: this.parallelConfig.parallelTimeoutMs,
        syncStrategy: this.parallelConfig.syncStrategy,
      });
    }
  }

  /**
   * Set up all request handlers
   */
  setupHandlers(): void {
    this.setupListToolsHandler();
    this.setupCallToolHandler();
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
   * Handle tool call requests
   */
  private setupCallToolHandler(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      // Debug logging for test mode
      if (process.env.NODE_ENV === 'test') {
        console.error(
          'Received request params type:',
          Array.isArray(request.params) ? 'array' : 'object'
        );
        if (Array.isArray(request.params)) {
          console.error('Array length:', request.params.length);
        }
      }

      // Check if this is a parallel tool call (array format)
      if (this.parallelConfig.enabled && this.parallelHandler.isParallelRequest(request.params)) {
        // Handle parallel tool calls
        if (process.env.NODE_ENV === 'test') {
          console.error('Processing as parallel tool calls');
        }
        const useAnthropicFormat = this.parallelConfig.responseFormat === 'anthropic';
        const result = await this.parallelHandler.processParallelToolCalls(
          request.params,
          useAnthropicFormat
        );
        return {
          content: result.content,
        };
      }

      // Handle single tool call (backward compatibility)
      const { name, arguments: args } = request.params;

      try {
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
          };
        }

        // Record the tool call for workflow tracking
        workflowGuard.recordCall(name, args);

        // Check for workflow violations before executing
        const violation = workflowGuard.checkWorkflowViolation(name, args);
        if (violation) {
          const violationError = workflowGuard.getViolationError(violation);
          // Since ErrorFactory returns CreativeThinkingError which implements EnhancedError
          const enhancedError = violationError as CreativeThinkingError;
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
          };
        }

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
            throw new ValidationError(
              ErrorCode.INVALID_INPUT,
              `Unknown tool: ${name}`,
              'toolName',
              {
                providedTool: name,
              }
            );
        }

        // MCP expects the content array directly
        return {
          content: result.content,
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
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
            `MISSING: ${missingParams.join(', ')}\n\n` +
            `⚠️ CRITICAL: You must execute ALL steps sequentially (1, 2, 3, etc.) ` +
            `without skipping any. Each step builds on previous insights.\n\n` +
            `Remember: nextStepNeeded should be true until the FINAL step.`
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
