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

    // Check if trying to terminate early
    if (!input.nextStepNeeded && input.currentStep < input.totalSteps) {
      return this.handleEarlyTermination(input, session, plan);
    }

    return { allowed: true };
  }

  /**
   * Check if synthesis/convergence is allowed
   */
  canProceedToSynthesis(
    session: SessionData,
    plan?: PlanThinkingSessionOutput
  ): { allowed: boolean; response?: LateralThinkingResponse } {
    const metadata = this.completionTracker.calculateCompletionMetadata(session, plan);
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
    const metadata = this.completionTracker.calculateCompletionMetadata(session, plan);
    const completionPercentage = metadata.overallProgress;

    // Check enforcement level
    switch (this.config.enforcementLevel) {
      case EnforcementLevel.LENIENT:
        // Just warn, don't block
        if (completionPercentage < this.config.minimumCompletionThreshold) {
          console.warn(
            `Early termination at ${Math.round(completionPercentage * 100)}% completion`
          );
        }
        return { allowed: true };

      case EnforcementLevel.STANDARD:
        // Block if below critical threshold or missing critical steps
        if (completionPercentage < 0.3 || metadata.criticalGapsIdentified.length > 0) {
          return this.blockTermination(input, metadata, 'Critical analysis gaps detected');
        }
        // Require confirmation for moderate completion
        if (completionPercentage < this.config.requireConfirmationThreshold) {
          return this.requireConfirmation(input, metadata);
        }
        return { allowed: true };

      case EnforcementLevel.STRICT:
        // Enforce minimum threshold
        if (completionPercentage < this.config.minimumCompletionThreshold) {
          return this.blockTermination(
            input,
            metadata,
            `Minimum ${Math.round(this.config.minimumCompletionThreshold * 100)}% completion required`
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
    const content = {
      blocked: true,
      title,
      reason,
      completionStatus: {
        overallProgress: Math.round(metadata.overallProgress * 100),
        progressDisplay: this.completionTracker.formatProgressDisplay(metadata),
        criticalGaps: metadata.criticalGapsIdentified,
        missedPerspectives: metadata.missedPerspectives,
      },
      requiredActions,
      suggestions: [
        'Continue with the planned workflow to ensure comprehensive analysis',
        'Use execute_thinking_step with nextStepNeeded: true to proceed',
        metadata.skippedTechniques.length > 0
          ? `Execute skipped techniques: ${metadata.skippedTechniques.join(', ')}`
          : null,
      ].filter(Boolean),
      override: this.config.allowExplicitSkip
        ? {
            message: 'To skip anyway, set forceComplete: true in your request',
            consequences: metadata.missedPerspectives,
          }
        : undefined,
    };

    return this.responseBuilder.buildSuccessResponse(content);
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
