/**
 * Validators for execution layer
 * Handles plan and technique validation
 */
export class ExecutionValidator {
    /**
     * Validate plan ID if provided
     */
    static validatePlanId(input, sessionManager) {
        if (!input.planId) {
            return { valid: true };
        }
        const plan = sessionManager.getPlan(input.planId);
        if (!plan) {
            return {
                valid: false,
                error: {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                error: 'Invalid planId',
                                message: `Plan ${input.planId} not found. Please create a plan first using plan_thinking_session.`,
                            }, null, 2),
                        },
                    ],
                    isError: true,
                },
            };
        }
        // Validate technique matches plan
        if (!plan.techniques.includes(input.technique)) {
            return {
                valid: false,
                error: {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                error: 'Technique mismatch',
                                plannedTechniques: plan.techniques,
                                requestedTechnique: input.technique,
                            }, null, 2),
                        },
                    ],
                    isError: true,
                },
            };
        }
        return { valid: true };
    }
}
//# sourceMappingURL=validators.js.map