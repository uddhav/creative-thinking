/**
 * CompletionGatekeeper - Enforces completion requirements and prevents premature termination
 * Provides configurable enforcement levels and technique-specific requirements
 */
import { SessionCompletionTracker, } from '../../core/session/SessionCompletionTracker.js';
import { ResponseBuilder } from '../../core/ResponseBuilder.js';
import { loadEnforcementConfigFromEnv } from '../../config/CompletionEnforcementConfig.js';
import { EnforcementLevel } from '../../types/enforcement.js';
// Re-export for backward compatibility
export { EnforcementLevel };
/**
 * Enforces completion requirements for thinking sessions
 */
export class CompletionGatekeeper {
    config;
    completionTracker = new SessionCompletionTracker();
    responseBuilder = new ResponseBuilder();
    constructor(config) {
        // Load config from environment first, then apply any explicit overrides
        const envConfig = loadEnforcementConfigFromEnv();
        this.config = { ...envConfig, ...config };
    }
    /**
     * Check if execution can proceed to next step
     */
    canProceedToNextStep(input, session, plan) {
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
     * Check if synthesis is allowed based on completion status
     */
    canProceedToSynthesis(session, plan) {
        const metadata = this.completionTracker.calculateCompletionMetadata(session, plan);
        const synthesisCheck = this.completionTracker.canProceedToSynthesis(metadata);
        if (synthesisCheck.allowed || this.config.enforcementLevel === EnforcementLevel.LENIENT) {
            return { allowed: true };
        }
        // Build blocking response
        const response = this.buildBlockingResponse('Synthesis Blocked - Incomplete Analysis', synthesisCheck.reason || 'Insufficient completion', synthesisCheck.requiredActions || [], metadata);
        return { allowed: false, response };
    }
    /**
     * Handle early termination attempt
     */
    handleEarlyTermination(input, session, plan) {
        const metadata = this.completionTracker.calculateCompletionMetadata(session, plan);
        const completionPercentage = metadata.overallProgress;
        const remainingSteps = input.totalSteps - input.currentStep;
        // CRITICAL: Always block early termination if steps are skipped
        const totalSkippedSteps = metadata.techniqueStatuses.reduce((sum, s) => sum + s.skippedSteps.length, 0);
        if (totalSkippedSteps > 0) {
            return this.blockTermination(input, metadata, `❌ BLOCKED: ${totalSkippedSteps} steps were skipped. ALL steps MUST be completed sequentially.`);
        }
        // Check enforcement level
        switch (this.config.enforcementLevel) {
            case EnforcementLevel.LENIENT:
                // Even in lenient mode, block if very incomplete
                if (completionPercentage < 0.5) {
                    return this.blockTermination(input, metadata, `⚠️ Cannot terminate: Only ${Math.round(completionPercentage * 100)}% complete. ` +
                        `${remainingSteps} steps remain. ALL steps must be executed.`);
                }
                return { allowed: true };
            case EnforcementLevel.STANDARD:
                // Block if below 70% or missing critical steps
                if (completionPercentage < 0.7 || metadata.criticalGapsIdentified.length > 0) {
                    return this.blockTermination(input, metadata, `❌ Early termination BLOCKED: ${Math.round(completionPercentage * 100)}% complete. ` +
                        `MANDATORY: Complete all ${remainingSteps} remaining steps.`);
                }
                // Require confirmation for moderate completion
                if (completionPercentage < this.config.requireConfirmationThreshold) {
                    return this.requireConfirmation(input, metadata);
                }
                return { allowed: true };
            case EnforcementLevel.STRICT:
                // Always enforce minimum threshold strictly
                if (completionPercentage < this.config.minimumCompletionThreshold) {
                    return this.blockTermination(input, metadata, `❌ STRICT MODE: Termination BLOCKED. ` +
                        `Minimum ${Math.round(this.config.minimumCompletionThreshold * 100)}% required, ` +
                        `currently ${Math.round(completionPercentage * 100)}%. ` +
                        `MUST complete all ${remainingSteps} remaining steps.`);
                }
                return { allowed: true };
            default:
                return { allowed: true };
        }
    }
    /**
     * Block termination with response
     */
    blockTermination(input, metadata, reason) {
        const remainingSteps = metadata.totalPlannedSteps - metadata.completedSteps;
        const requiredActions = [
            `Complete ${remainingSteps} more steps`,
            ...metadata.criticalGapsIdentified,
        ];
        const response = this.buildBlockingResponse('Early Termination Blocked', reason, requiredActions, metadata);
        return { allowed: false, response };
    }
    /**
     * Require confirmation for termination
     */
    requireConfirmation(input, metadata) {
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
    buildBlockingResponse(title, reason, requiredActions, metadata) {
        const totalSkippedSteps = metadata.techniqueStatuses.reduce((sum, s) => sum + s.skippedSteps.length, 0);
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
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    /**
     * Get current enforcement level
     */
    getEnforcementLevel() {
        return this.config.enforcementLevel;
    }
    /**
     * Check if a specific technique is critical
     */
    isCriticalTechnique(technique) {
        return this.config.criticalTechniques.includes(technique);
    }
    /**
     * Get mandatory steps for a problem type
     */
    getMandatorySteps(problemType) {
        return this.config.mandatoryStepsForProblemTypes[problemType] || [];
    }
}
//# sourceMappingURL=CompletionGatekeeper.js.map