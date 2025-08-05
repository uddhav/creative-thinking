/**
 * ParallelStepExecutor - Handles execution of steps within parallel sessions
 * Manages shared context, dependencies, and coordination between parallel executions
 */

import type { ExecuteThinkingStepInput, LateralThinkingResponse } from '../../types/index.js';
import type { SessionManager } from '../../core/SessionManager.js';
import type { SessionSynchronizer } from '../../core/session/SessionSynchronizer.js';
import type { SharedContext } from '../../types/parallel-session.js';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';

/**
 * Handles execution context for parallel sessions
 */
export interface ParallelExecutionContext {
  sessionId: string;
  groupId: string;
  sharedContext: SharedContext | undefined;
  canProceed: boolean;
  waitingFor: string[];
  dependencies: string[];
}

/**
 * Executes steps within parallel sessions with proper coordination
 */
export class ParallelStepExecutor {
  private errorHandler: ErrorHandler;

  constructor(
    private sessionManager: SessionManager,
    private sessionSynchronizer: SessionSynchronizer
  ) {
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Check if a session can execute based on parallel group membership
   */
  checkParallelExecutionContext(
    sessionId: string,
    input: ExecuteThinkingStepInput
  ): ParallelExecutionContext {
    try {
      const session = this.sessionManager.getSession(sessionId);
      if (!session) {
        throw ErrorFactory.sessionNotFound(sessionId);
      }

      // Check if session is part of a parallel group
      if (!session.parallelGroupId) {
        // Not part of a parallel group, can proceed normally
        return {
          sessionId,
          groupId: '',
          sharedContext: undefined,
          canProceed: true,
          waitingFor: [],
          dependencies: [],
        };
      }

      const groupId = session.parallelGroupId;
      const group = this.sessionManager.getParallelGroup(groupId);

      if (!group) {
        throw ErrorFactory.missingField(`Parallel group ${groupId}`);
      }

      // Check dependencies
      const canStart = this.sessionManager.canSessionStart(sessionId);
      const dependencies = session.dependsOn || [];
      const waitingFor = this.getUncompletedDependencies(
        sessionId,
        dependencies,
        group.completedSessions
      );

      // Get shared context
      const sharedContext = this.sessionSynchronizer.getSharedContext(groupId);

      return {
        sessionId,
        groupId,
        sharedContext,
        canProceed: canStart,
        waitingFor,
        dependencies,
      };
    } catch (error) {
      throw this.errorHandler.wrapError(error as Error, {
        context: 'parallel_execution_context',
        sessionId,
        technique: input.technique,
      });
    }
  }

  /**
   * Execute a step with parallel coordination
   */
  async executeWithCoordination(
    input: ExecuteThinkingStepInput,
    sessionId: string,
    baseExecutor: (input: ExecuteThinkingStepInput) => Promise<LateralThinkingResponse>
  ): Promise<LateralThinkingResponse> {
    const context = this.checkParallelExecutionContext(sessionId, input);

    // If not in parallel group or can't proceed, handle appropriately
    if (!context.groupId) {
      // Not in a parallel group, execute normally
      return baseExecutor(input);
    }

    if (!context.canProceed) {
      // Return a waiting response
      return this.buildWaitingResponse(sessionId, context);
    }

    // Update shared context before execution
    if (context.sharedContext && input.currentStep === 1) {
      await this.updateSharedContextPreExecution(sessionId, context.groupId, input);
    }

    // Execute the step
    const response = await baseExecutor(input);

    // Update shared context after execution
    if (context.sharedContext) {
      await this.updateSharedContextPostExecution(sessionId, context.groupId, input, response);
    }

    // Mark session as complete if this was the last step
    if (!input.nextStepNeeded) {
      this.sessionManager.markSessionComplete(sessionId);
    }

    return response;
  }

  /**
   * Get uncompleted dependencies
   */
  private getUncompletedDependencies(
    sessionId: string,
    dependencies: string[],
    completedSessions: Set<string>
  ): string[] {
    return dependencies.filter(dep => !completedSessions.has(dep));
  }

  /**
   * Build a response for a session that's waiting on dependencies
   */
  private buildWaitingResponse(
    sessionId: string,
    context: ParallelExecutionContext
  ): LateralThinkingResponse {
    const waitingDetails =
      context.waitingFor.length > 0
        ? `Waiting for sessions: ${context.waitingFor.join(', ')}`
        : 'Waiting for dependencies to complete';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              sessionId,
              status: 'waiting',
              message: 'Session is waiting for dependencies to complete before proceeding',
              details: waitingDetails,
              groupId: context.groupId,
              dependencies: context.dependencies,
              waitingFor: context.waitingFor,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  /**
   * Update shared context before execution
   */
  private async updateSharedContextPreExecution(
    sessionId: string,
    groupId: string,
    input: ExecuteThinkingStepInput
  ): Promise<void> {
    await this.sessionSynchronizer.updateSharedContext(sessionId, groupId, {
      type: 'immediate',
      metrics: {
        step: input.currentStep,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Update shared context after execution
   */
  private async updateSharedContextPostExecution(
    sessionId: string,
    groupId: string,
    input: ExecuteThinkingStepInput,
    response: LateralThinkingResponse
  ): Promise<void> {
    try {
      // Extract insights from response
      const responseData = JSON.parse(response.content[0].text) as { insights?: string[] };
      const insights = responseData.insights || [];

      // Extract themes (simple word frequency for now)
      const themes = this.extractThemes(input.output);

      await this.sessionSynchronizer.updateSharedContext(sessionId, groupId, {
        type: 'immediate',
        insights,
        themes,
        metrics: {
          step: input.currentStep,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      // Log error but don't fail the execution
      console.error(`Failed to update shared context: ${String(error)}`);
    }
  }

  /**
   * Extract themes from output text
   */
  private extractThemes(output: string): Array<{ theme: string; weight: number }> {
    const words = output.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};

    // Count words (excluding common words)
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
    ]);

    for (const word of words) {
      if (word.length > 3 && !commonWords.has(word)) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    }

    // Convert to themes with weights
    return Object.entries(wordCount)
      .filter(([, count]) => count > 1)
      .map(([theme, count]) => ({ theme, weight: count }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5); // Top 5 themes
  }

  /**
   * Check if this session should wait for checkpoint
   */
  shouldWaitForCheckpoint(sessionId: string): boolean {
    const session = this.sessionManager.getSession(sessionId);
    if (!session?.parallelGroupId) return false;

    const group = this.sessionManager.getParallelGroup(session.parallelGroupId);
    if (!group) return false;

    // TODO: Implement checkpoint logic based on plan metadata
    // For now, no checkpoints
    return false;
  }

  /**
   * Wait for checkpoint completion
   */
  waitForCheckpoint(sessionId: string, groupId: string, checkpointId: string): void {
    // Process any pending updates at checkpoint
    this.sessionSynchronizer.processCheckpoint(groupId);

    // In a real implementation, this would coordinate with other sessions
    // For now, we just mark that we've reached the checkpoint
    console.error(`[ParallelStepExecutor] Session ${sessionId} reached checkpoint ${checkpointId}`);
  }
}
