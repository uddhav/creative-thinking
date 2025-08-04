/**
 * WorkflowGuard - Enforces the three-tool workflow pattern
 * Tracks tool usage and provides helpful guidance when workflow is violated
 */

import { ErrorFactory } from '../errors/enhanced-errors.js';

interface ToolCall {
  toolName: string;
  timestamp: number;
  args?: unknown;
}

interface WorkflowViolation {
  type: 'skipped_discovery' | 'skipped_planning' | 'invalid_technique' | 'fabricated_planid';
  message: string;
  guidance: string[];
  example?: string;
}

export class WorkflowGuard {
  private recentCalls: ToolCall[] = [];
  private readonly CALL_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  private validTechniques = [
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
  ];

  /**
   * Record a tool call
   */
  recordCall(toolName: string, args?: unknown): void {
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
  checkWorkflowViolation(toolName: string, args: unknown): WorkflowViolation | null {
    this.cleanupOldCalls();

    if (toolName === 'execute_thinking_step') {
      return this.checkExecutionViolations(args);
    }

    return null;
  }

  /**
   * Get helpful error response for workflow violations
   * Now returns specialized error objects instead of generic responses
   */
  getViolationError(violation: WorkflowViolation): Error {
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
        const discoveryCall = this.recentCalls.find(
          call => call.toolName === 'discover_techniques'
        );
        const recommended = this.getRecommendedTechniques(discoveryCall);
        return ErrorFactory.unauthorizedTechnique(technique, recommended);
      }

      case 'fabricated_planid':
        return ErrorFactory.workflowBypassAttempt('Using fabricated or invalid planId');

      default:
        return ErrorFactory.workflowBypassAttempt(violation.message);
    }
  }

  private checkExecutionViolations(args: unknown): WorkflowViolation | null {
    const execArgs = args as { planId?: string; technique?: string };

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
        example: JSON.stringify(
          {
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
          },
          null,
          2
        ),
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

  private cleanupOldCalls(): void {
    const cutoff = Date.now() - this.CALL_WINDOW_MS;
    this.recentCalls = this.recentCalls.filter(call => call.timestamp > cutoff);
  }

  /**
   * Extract recommended techniques from discovery call
   */
  private getRecommendedTechniques(discoveryCall?: ToolCall): string[] {
    if (!discoveryCall) return [];

    // In a real implementation, this would parse the discovery response
    // For now, return a sensible default based on validTechniques
    return this.validTechniques.slice(0, 3);
  }
}

// Singleton instance
export const workflowGuard = new WorkflowGuard();
