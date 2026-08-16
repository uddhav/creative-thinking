/**
 * CompletionGatekeeper - Enforces completion requirements and prevents premature termination
 * Provides configurable enforcement levels and technique-specific requirements
 */

import type {
  ExecuteThinkingStepInput,
  SessionData,
  LateralThinkingResponse,
} from '../../types/index.js';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import {
  SessionCompletionTracker,
  type SessionCompletionMetadata,
} from '../../core/session/SessionCompletionTracker.js';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { loadEnforcementConfigFromEnv } from '../../config/CompletionEnforcementConfig.js';
import { EnforcementLevel, type CompletionGatekeeperConfig } from '../../types/enforcement.js';

// Re-export for backward compatibility
export { EnforcementLevel, type CompletionGatekeeperConfig };

/**
 * Enforces completion requirements for thinking sessions
 */
export class CompletionGatekeeper {
  private config: CompletionGatekeeperConfig;
  private completionTracker = new SessionCompletionTracker();
  private responseBuilder = new ResponseBuilder();

  constructor(config?: Partial<CompletionGatekeeperConfig>) {
    // Load config from environment first, then apply any explicit overrides
    const envConfig = loadEnforcementConfigFromEnv();
    this.config = { ...envConfig, ...config };
  }

  /**
   * Check if execution can proceed to next step
   */
  canProceedToNextStep(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // No enforcement
    if (this.config.enforcementLevel === EnforcementLevel.NONE) {
      return { allowed: true };
    }

    // Check every termination, not only the ones whose step NUMBER is early.
    //
    // This used to fire only when `currentStep < totalSteps`, so a session that
    // skipped an interior step and then ended on the final step number sailed
    // past the gate: 14 of 15 steps run, step 7 never sent, and the response
    // said `completed: true` with zero warnings — while its own
    // `techniqueStatuses` recorded the gap. The always-block-on-skips check
    // below only protects terminations that reach it. Ending is what makes a
    // missing step permanent, so ending is when the check runs; a genuinely
    // complete session has no skips and passes untouched.
    if (!input.nextStepNeeded) {
      return this.handleEarlyTermination(input, session, plan);
    }

    return { allowed: true };
  }

  /**
   * Check if synthesis is allowed based on completion status
   */
  canProceedToSynthesis(
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // Both gatekeeper paths run only when the session is trying to end, so
    // incompleteness here is a real finding rather than progress.
    const metadata = this.completionTracker.calculateCompletionMetadata(session, plan, true);
    const synthesisCheck = this.completionTracker.canProceedToSynthesis(metadata);

    if (synthesisCheck.allowed || this.config.enforcementLevel === EnforcementLevel.LENIENT) {
      return { allowed: true };
    }

    // Build blocking response
    const response = this.buildBlockingResponse(
      'Synthesis Blocked - Incomplete Analysis',
      synthesisCheck.reason || 'Insufficient completion',
      synthesisCheck.requiredActions || [],
      metadata
    );

    return { allowed: false, response };
  }

  /**
   * Handle early termination attempt
   */
  private handleEarlyTermination(
    input: ExecuteThinkingStepInput,
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // Both gatekeeper paths run only when the session is trying to end, so
    // incompleteness here is a real finding rather than progress.
    const metadata = this.completionTracker.calculateCompletionMetadata(session, plan, true);
    const completionPercentage = metadata.overallProgress;
    const remainingSteps = input.totalSteps - input.currentStep;

    // CRITICAL: Always block early termination if steps are skipped
    const totalSkippedSteps = metadata.techniqueStatuses.reduce(
      (sum, s) => sum + s.skippedSteps.length,
      0
    );
    if (totalSkippedSteps > 0) {
      return this.blockTermination(
        input,
        metadata,
        `❌ BLOCKED: ${totalSkippedSteps} steps were skipped. ALL steps MUST be completed sequentially.`
      );
    }

    // Check enforcement level
    switch (this.config.enforcementLevel) {
      case EnforcementLevel.LENIENT:
        // Even in lenient mode, block if very incomplete
        if (completionPercentage < 0.5) {
          return this.blockTermination(
            input,
            metadata,
            `⚠️ Cannot terminate: Only ${Math.round(completionPercentage * 100)}% complete. ` +
              `${remainingSteps} steps remain. ALL steps must be executed.`
          );
        }
        return { allowed: true };

      case EnforcementLevel.STANDARD:
        // Block on what the caller failed to RUN, not on what they never
        // planned. `criticalGapsIdentified` lists techniques the tracker
        // thinks the problem deserved — including ones the plan never
        // contained — so gating on it here refused a fully-run 5-step plan
        // with "100% complete. MANDATORY: Complete all 0 remaining steps."
        // Skipped steps are already an unconditional block above; the gaps
        // stay in the metadata for the caller to weigh.
        if (completionPercentage < 0.7) {
          return this.blockTermination(
            input,
            metadata,
            `❌ Early termination BLOCKED: ${Math.round(completionPercentage * 100)}% complete. ` +
              `MANDATORY: Complete all ${remainingSteps} remaining steps.`
          );
        }
        // Require confirmation for moderate completion
        if (completionPercentage < this.config.requireConfirmationThreshold) {
          return this.requireConfirmation(input, metadata);
        }
        return { allowed: true };

      case EnforcementLevel.STRICT:
        // Always enforce minimum threshold strictly
        if (completionPercentage < this.config.minimumCompletionThreshold) {
          return this.blockTermination(
            input,
            metadata,
            `❌ STRICT MODE: Termination BLOCKED. ` +
              `Minimum ${Math.round(this.config.minimumCompletionThreshold * 100)}% required, ` +
              `currently ${Math.round(completionPercentage * 100)}%. ` +
              `MUST complete all ${remainingSteps} remaining steps.`
          );
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  }

  /**
   * Block termination with response
   */
  private blockTermination(
    input: ExecuteThinkingStepInput,
    metadata: SessionCompletionMetadata,
    reason: string
  ): { allowed: boolean; response: LateralThinkingResponse } {
    const remainingSteps = metadata.totalPlannedSteps - metadata.completedSteps;
    const requiredActions = [
      `Complete ${remainingSteps} more steps`,
      ...metadata.criticalGapsIdentified,
    ];

    const response = this.buildBlockingResponse(
      'Early Termination Blocked',
      reason,
      requiredActions,
      metadata
    );

    return { allowed: false, response };
  }

  /**
   * Require confirmation for termination
   */
  private requireConfirmation(
    input: ExecuteThinkingStepInput,
    metadata: SessionCompletionMetadata
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    // In standard mode, we'll add a strong warning but allow continuation
    // In a real implementation, this could trigger a confirmation dialog
    const warnings = [
      `⚠️ Only ${Math.round(metadata.overallProgress * 100)}% complete`,
      `Missing perspectives: ${metadata.missedPerspectives.join(', ')}`,
      'Consider completing more steps for comprehensive analysis',
    ];

    // For now, we'll allow but with warnings
    // In a UI implementation, this would trigger a confirmation
    console.warn('Confirmation required for early termination:', warnings);
    return { allowed: true };
  }

  /**
   * Build blocking response
   */
  private buildBlockingResponse(
    title: string,
    reason: string,
    requiredActions: string[],
    metadata: SessionCompletionMetadata
  ): LateralThinkingResponse {
    const totalSkippedSteps = metadata.techniqueStatuses.reduce(
      (sum, s) => sum + s.skippedSteps.length,
      0
    );
    const outstandingWork = this.describeOutstandingWork(metadata);

    const content = {
      blocked: true,
      title,
      reason,
      completionStatus: {
        overallProgress: Math.round(metadata.overallProgress * 100),
        progressDisplay: this.completionTracker.formatProgressDisplay(metadata),
        criticalGaps: metadata.criticalGapsIdentified,
        missedPerspectives: metadata.missedPerspectives,
        skippedSteps: totalSkippedSteps,
      },
      requiredActions: [
        '❌ MANDATORY: Complete ALL remaining steps sequentially',
        ...requiredActions,
      ],
      criticalInstructions: [
        '1. Set nextStepNeeded: true to continue execution',
        '2. Execute EVERY step in sequence (no skipping)',
        '3. Each step MUST build on previous insights',
        '4. Do NOT terminate until ALL steps are complete',
      ],
      suggestions: [
        'ALL steps in the thinking process are REQUIRED',
        'Use execute_thinking_step with the NEXT sequential step number',
        metadata.skippedTechniques.length > 0
          ? `Execute skipped techniques: ${metadata.skippedTechniques.join(', ')}`
          : null,
      ].filter(Boolean),
      override: this.config.allowExplicitSkip
        ? {
            // What actually clears the block, not a switch that does not exist.
            //
            // This read "To skip anyway, set forceComplete: true in your
            // request". No tool schema declares `forceComplete`, nothing reads
            // one, and `allowExplicitSkip` is on in three of the four
            // enforcement levels — so a blocked caller followed the
            // instruction, the field was ignored, the same block fired again
            // and the session looped. The config and this block stay, because
            // a deployment may key off them; the sentence they carry is now
            // the route that exists, named from what the tracker measured.
            message:
              `There is no skip flag. Call execute_thinking_step for ${outstandingWork} ` +
              `and this block clears on its own.`,
            consequences: metadata.missedPerspectives,
          }
        : undefined,
    };

    return this.responseBuilder.buildSuccessResponse(content);
  }

  /**
   * Name the steps a caller still owes, in technique-local numbering.
   *
   * A technique that has run at all reports its gaps in `skippedSteps`; one
   * that never started reports nothing there and appears in `skippedTechniques`
   * instead, so both lists are read.
   */
  private describeOutstandingWork(metadata: SessionCompletionMetadata): string {
    const perTechnique = [
      ...metadata.techniqueStatuses
        .filter(s => s.skippedSteps.length > 0)
        .map(s => `${s.technique} steps ${s.skippedSteps.join(', ')}`),
      ...metadata.skippedTechniques.map(technique => {
        const status = metadata.techniqueStatuses.find(s => s.technique === technique);
        return status ? `${technique} steps 1-${status.totalSteps}` : `${technique}`;
      }),
    ];

    if (perTechnique.length > 0) {
      return perTechnique.join('; ');
    }

    // No plan, or a single-technique session the tracker measures without
    // per-step numbering — say how many are outstanding rather than invent
    // which ones.
    const remaining = Math.max(0, metadata.totalPlannedSteps - metadata.completedSteps);
    return `the ${remaining} step${remaining === 1 ? '' : 's'} still outstanding`;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CompletionGatekeeperConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current enforcement level
   */
  getEnforcementLevel(): EnforcementLevel {
    return this.config.enforcementLevel;
  }

  /**
   * Check if a specific technique is critical
   */
  isCriticalTechnique(technique: string): boolean {
    return this.config.criticalTechniques.includes(technique);
  }

  /**
   * Get mandatory steps for a problem type
   */
  getMandatorySteps(problemType: string): string[] {
    return this.config.mandatoryStepsForProblemTypes[problemType] || [];
  }
}
