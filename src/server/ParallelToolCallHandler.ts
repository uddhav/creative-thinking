/**
 * ParallelToolCallHandler - Handles Anthropic-style parallel tool calls
 * Manages concurrent execution of multiple tool calls and technique parallelization
 */

import type { LateralThinkingServer } from '../index.js';
import type { LateralTechnique, LateralThinkingResponse } from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import { ParallelismValidator } from '../layers/discovery/ParallelismValidator.js';
import { workflowGuard } from '../core/WorkflowGuard.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
import type { CreativeThinkingError } from '../errors/enhanced-errors.js';

/**
 * Represents a single tool call in a parallel batch
 */
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * Execution group for parallel technique execution
 */
export interface ExecutionGroup {
  techniques: LateralTechnique[];
  canRunInParallel: boolean;
  stepDependencies?: Array<[number, number]>;
  parallelSteps?: boolean; // Can steps within this technique run in parallel?
}

/**
 * Result of parallel tool call validation
 */
interface ParallelValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  groups?: ExecutionGroup[];
}

/**
 * Handles parallel tool calls following Anthropic's pattern
 */
export class ParallelToolCallHandler {
  private parallelismValidator: ParallelismValidator;
  private maxParallelCalls: number;

  constructor(
    private lateralServer: LateralThinkingServer,
    maxParallelCalls = 10
  ) {
    this.parallelismValidator = new ParallelismValidator();
    this.maxParallelCalls = maxParallelCalls;
  }

  /**
   * Check if the request contains parallel tool calls
   */
  isParallelRequest(params: unknown): params is ToolCall[] {
    return (
      Array.isArray(params) &&
      params.length > 0 &&
      params.every(
        call => typeof call === 'object' && call !== null && 'name' in call && 'arguments' in call
      )
    );
  }

  /**
   * Process parallel tool calls
   */
  async processParallelToolCalls(calls: ToolCall[]): Promise<LateralThinkingResponse> {
    // Check workflow violations first
    const workflowViolation = workflowGuard.checkParallelExecutionViolations(calls);
    if (workflowViolation) {
      const error = workflowGuard.getViolationError(workflowViolation) as CreativeThinkingError;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error.message,
                code: error.code,
                recovery: error.recovery,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Validate parallel calls
    const validation = this.validateParallelCalls(calls);
    if (!validation.isValid) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Invalid parallel tool calls',
                errors: validation.errors,
                warnings: validation.warnings,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Check if all calls are execute_thinking_step
    const allExecute = calls.every(call => call.name === 'execute_thinking_step');

    if (allExecute) {
      return this.processParallelExecutions(calls);
    } else {
      // For mixed or non-execute calls, process sequentially for now
      // (discover and plan must be sequential)
      return this.processSequentialCalls(calls);
    }
  }

  /**
   * Process parallel execute_thinking_step calls
   */
  private async processParallelExecutions(calls: ToolCall[]): Promise<LateralThinkingResponse> {
    try {
      // Execute all calls in parallel
      const results = await Promise.all(
        calls.map(call => this.lateralServer.executeThinkingStep(call.arguments))
      );

      // Combine results into a single response
      const combinedContent = results.map((result, index) => ({
        type: 'text' as const,
        text: JSON.stringify(
          {
            toolIndex: index,
            technique: calls[index].arguments.technique,
            step: calls[index].arguments.currentStep,
            result: JSON.parse(result.content[0].text) as Record<string, unknown>,
          },
          null,
          2
        ),
      }));

      return {
        content: combinedContent,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Parallel execution failed',
                message: error instanceof Error ? error.message : 'Unknown error',
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Process calls sequentially (for non-parallelizable operations)
   */
  private async processSequentialCalls(calls: ToolCall[]): Promise<LateralThinkingResponse> {
    const results: unknown[] = [];

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
            throw new ValidationError(
              ErrorCode.INVALID_INPUT,
              `Unknown tool: ${call.name}`,
              'toolName'
            );
        }
        results.push(JSON.parse(result.content[0].text));
      } catch (error) {
        results.push({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  }

  /**
   * Validate parallel tool calls
   */
  private validateParallelCalls(calls: ToolCall[]): ParallelValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check max parallel calls
    if (calls.length > this.maxParallelCalls) {
      errors.push(
        `Too many parallel calls: ${calls.length} exceeds maximum of ${this.maxParallelCalls}`
      );
    }

    // Check tool types
    const toolNames = calls.map(c => c.name);
    const uniqueTools = new Set(toolNames);

    // Discover and plan cannot be parallel with anything
    if (uniqueTools.has('discover_techniques') && calls.length > 1) {
      errors.push('discover_techniques must be called alone (cannot be parallel with other tools)');
    }
    if (uniqueTools.has('plan_thinking_session') && calls.length > 1) {
      errors.push(
        'plan_thinking_session must be called alone (cannot be parallel with other tools)'
      );
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
  private validateParallelExecutions(calls: ToolCall[]): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Extract execution details
    const executions = calls.map(call => ({
      planId: call.arguments.planId as string,
      technique: call.arguments.technique as LateralTechnique,
      currentStep: call.arguments.currentStep as number,
    }));

    // Check all have same planId
    const planIds = new Set(executions.map(e => e.planId));
    if (planIds.size > 1) {
      errors.push('All parallel executions must have the same planId');
    }

    // Check for duplicate techniques at same step
    const techniqueSteps = new Set(executions.map(e => `${e.technique}-${e.currentStep}`));
    if (techniqueSteps.size !== executions.length) {
      errors.push('Duplicate technique-step combinations detected in parallel calls');
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
  createExecutionGroups(plan: PlanThinkingSessionOutput): ExecutionGroup[] {
    const groups: ExecutionGroup[] = [];

    if (plan.executionMode === 'parallel') {
      // Group techniques that can run in parallel
      const techniques = plan.techniques;
      const processed = new Set<LateralTechnique>();

      for (const technique of techniques) {
        if (processed.has(technique)) continue;

        const group: ExecutionGroup = {
          techniques: [technique],
          canRunInParallel: true,
          parallelSteps: this.canTechniqueStepsRunInParallel(technique),
        };

        // Find other techniques that can run in parallel with this one
        for (const otherTechnique of techniques) {
          if (otherTechnique === technique || processed.has(otherTechnique)) continue;

          if (this.parallelismValidator.canTechniquesRunInParallel(technique, otherTechnique)) {
            group.techniques.push(otherTechnique);
            processed.add(otherTechnique);
          }
        }

        processed.add(technique);
        groups.push(group);
      }
    } else {
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
        techniques: ['convergence' as LateralTechnique],
        canRunInParallel: false,
        parallelSteps: false,
      });
    }

    return groups;
  }

  /**
   * Determine if a technique's steps can run in parallel
   */
  private canTechniqueStepsRunInParallel(technique: LateralTechnique): boolean {
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
