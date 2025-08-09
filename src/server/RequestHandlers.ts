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
import { ObjectFieldValidator } from '../core/validators/ObjectFieldValidator.js';

export class RequestHandlers {
  constructor(
    private server: Server,
    private lateralServer: LateralThinkingServer
  ) {
    // Set up WorkflowGuard with SessionManager for plan validation
    workflowGuard.setSessionManager(this.lateralServer.getSessionManager());
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
      // Early logging to catch requests before any processing
      if (request.params && typeof request.params === 'object' && 'name' in request.params) {
        const toolName = (request.params as Record<string, unknown>).name;
        if (toolName === 'execute_thinking_step') {
          console.error('[ExecuteStep] Request received for execute_thinking_step');
        }
      }

      // Array format validation is handled by validateRequiredParameters and ObjectFieldValidator
      // These validators ensure proper JSON-RPC error responses for invalid formats

      // Handle single tool call (MCP standard)
      // Safely extract parameters to prevent crashes with malformed data
      let name: string;
      let args: unknown;

      try {
        if (!request.params || typeof request.params !== 'object') {
          const errorMessage =
            'Error: Invalid request format - params must be an object with name and arguments properties';

          console.error('[RequestHandler] Invalid params format:', {
            timestamp: new Date().toISOString(),
            paramsType: typeof request.params,
            params: request.params,
            message: errorMessage,
          });

          return {
            content: [
              {
                type: 'text',
                text: errorMessage,
              },
            ],
            isError: true,
          };
        }

        const params = request.params as Record<string, unknown>;
        name = params.name as string;
        args = params.arguments;

        if (!name || typeof name !== 'string') {
          const errorMessage = 'Error: Tool name is required and must be a string';

          console.error('[RequestHandler] Invalid tool name:', {
            timestamp: new Date().toISOString(),
            name,
            nameType: typeof name,
            message: errorMessage,
          });

          return {
            content: [
              {
                type: 'text',
                text: errorMessage,
              },
            ],
            isError: true,
          };
        }
      } catch (extractError) {
        const errorMessage = `Error: Failed to parse request parameters: ${extractError instanceof Error ? extractError.message : 'Unknown error'}`;

        // Log detailed error information
        console.error('[RequestHandler] Parameter extraction failed:', {
          timestamp: new Date().toISOString(),
          error: extractError,
          requestParams: JSON.stringify(request.params).substring(0, 500),
          message: errorMessage,
        });

        return {
          content: [
            {
              type: 'text',
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }

      try {
        // Pre-validate required parameters
        const validationError = this.validateRequiredParameters(name, args);
        if (validationError) {
          console.error('[RequestHandler] Validation error:', {
            timestamp: new Date().toISOString(),
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
          // Since ErrorFactory returns CreativeThinkingError which implements EnhancedError
          const enhancedError = violationError as CreativeThinkingError;

          console.error('[RequestHandler] Workflow violation detected:', {
            timestamp: new Date().toISOString(),
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
