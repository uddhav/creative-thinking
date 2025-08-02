/**
 * ErrorContextBuilder - Provides reusable methods for building consistent error contexts
 * Extracted to reduce duplication across validators and error handlers
 */
export class ErrorContextBuilder {
    /**
     * Build workflow error response (plan not found, technique mismatch, etc.)
     */
    buildWorkflowError(errorType, context) {
        if (errorType === 'plan_not_found') {
            if (!context.planId) {
                throw new Error('planId is required for plan_not_found error');
            }
            return this.buildPlanNotFoundError(context.planId);
        }
        else {
            return this.buildTechniqueMismatchError(context);
        }
    }
    /**
     * Build plan not found error
     */
    buildPlanNotFoundError(planId) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: '❌ WORKFLOW ERROR: Plan not found',
                        message: `The planId '${planId}' does not exist. You cannot skip the planning step!`,
                        guidance: '⚠️ REQUIRED THREE-STEP WORKFLOW:',
                        workflow: [
                            '1️⃣ Call discover_techniques to analyze your problem',
                            '2️⃣ Call plan_thinking_session to create a plan (returns planId)',
                            '3️⃣ Call execute_thinking_step with the planId from step 2',
                        ],
                        example: {
                            correct_sequence: [
                                {
                                    step: 1,
                                    tool: 'discover_techniques',
                                    args: { problem: 'Your problem here' },
                                    returns: 'Recommended techniques',
                                },
                                {
                                    step: 2,
                                    tool: 'plan_thinking_session',
                                    args: { problem: 'Your problem here', techniques: ['six_hats'] },
                                    returns: { planId: 'plan_abc123', workflow: '...' },
                                },
                                {
                                    step: 3,
                                    tool: 'execute_thinking_step',
                                    args: {
                                        planId: 'plan_abc123', // ← Use the ACTUAL planId from step 2
                                        technique: 'six_hats',
                                        problem: 'Your problem here',
                                        currentStep: 1,
                                        totalSteps: 6,
                                        output: 'Your thinking here',
                                        nextStepNeeded: true,
                                    },
                                },
                            ],
                        },
                        your_error: `You tried to use planId '${planId}' which doesn't exist`,
                        fix: '👉 Start over with discover_techniques',
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
    /**
     * Build technique mismatch error
     */
    buildTechniqueMismatchError(context) {
        const { planId, technique, expectedTechniques = [] } = context;
        const techniquesList = expectedTechniques.join(', ');
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: '❌ TECHNIQUE MISMATCH ERROR',
                        message: `You requested technique '${technique}' but your plan only includes: ${techniquesList}`,
                        guidance: 'You must use one of the techniques from your plan',
                        yourPlan: {
                            planId,
                            techniques: expectedTechniques,
                        },
                        requestedTechnique: technique,
                        fix: `Change your technique parameter to one of: ${techniquesList}`,
                        example: {
                            correct: {
                                planId,
                                technique: expectedTechniques[0], // Use first technique from plan
                                problem: 'Your problem here',
                                currentStep: 1,
                                totalSteps: 6, // This would need to be calculated based on technique
                                output: 'Your thinking here',
                                nextStepNeeded: true,
                            },
                        },
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
    /**
     * Build session error response
     */
    buildSessionError(context) {
        const baseError = {
            error: {
                message: context.message,
            },
        };
        if (context.errorType === 'invalid_format') {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            ...baseError,
                            guidance: context.guidance ||
                                'Session IDs must be alphanumeric with underscores, hyphens, and dots only, maximum 64 characters',
                            providedSessionId: context.sessionId,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(baseError, null, 2),
                },
            ],
            isError: true,
        };
    }
    /**
     * Build step error context (for ExecutionMetadata)
     */
    buildStepErrorContext(context) {
        return {
            providedStep: context.providedStep,
            validRange: context.validRange,
            technique: context.technique,
            techniqueLocalStep: context.techniqueLocalStep || context.providedStep,
            globalStep: context.globalStep || context.providedStep,
            message: context.message ||
                `Step ${context.providedStep} is invalid for ${context.technique}. ${context.validRange}`,
        };
    }
    /**
     * Build generic error response
     */
    buildGenericError(message, details) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        error: message,
                        ...details,
                    }, null, 2),
                },
            ],
            isError: true,
        };
    }
}
//# sourceMappingURL=ErrorContextBuilder.js.map