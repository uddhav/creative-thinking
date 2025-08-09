/**
 * Execution Mode Controller - Simplified for sequential execution only
 * Always returns sequential execution mode
 */
/**
 * Simplified execution mode controller that always selects sequential mode
 */
export class ExecutionModeController {
    constructor() {
        // No dependencies needed for sequential-only mode
    }
    /**
     * Determine execution mode (always returns sequential)
     */
    determineExecutionMode(input, recommendedTechniques) {
        const warnings = [];
        // Add warnings based on input analysis
        if (recommendedTechniques.length > 3) {
            warnings.push(`${recommendedTechniques.length} techniques recommended - consider focusing on top 3 for better results`);
        }
        if (input.constraints && input.constraints.some(c => c.toLowerCase().includes('time'))) {
            warnings.push('Time constraint detected - sequential execution may take longer');
        }
        // Always use sequential mode
        const decision = {
            mode: 'sequential',
            reason: 'Sequential execution is the only supported mode in this simplified version',
            warnings: warnings.length > 0 ? warnings : undefined,
        };
        return decision;
    }
    /**
     * Validate execution mode (always valid for sequential)
     */
    validateExecutionMode(mode) {
        if (mode === 'sequential') {
            return { isValid: true };
        }
        return {
            isValid: false,
            error: `Execution mode "${mode}" is not supported. Only "sequential" mode is available.`,
        };
    }
}
//# sourceMappingURL=ExecutionModeController.js.map