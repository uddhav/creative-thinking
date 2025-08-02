/**
 * ExecutionValidator - Handles validation logic for thinking step execution
 * Extracted from executeThinkingStep to improve maintainability
 */
import { ErrorContextBuilder } from '../../core/ErrorContextBuilder.js';
export class ExecutionValidator {
    sessionManager;
    techniqueRegistry;
    visualFormatter;
    errorBuilder = new ErrorContextBuilder();
    constructor(sessionManager, techniqueRegistry, visualFormatter) {
        this.sessionManager = sessionManager;
        this.techniqueRegistry = techniqueRegistry;
        this.visualFormatter = visualFormatter;
    }
    /**
     * Validate plan exists and technique matches
     */
    validatePlan(input) {
        if (!input.planId) {
            return { isValid: true }; // Plan is optional
        }
        const plan = this.sessionManager.getPlan(input.planId);
        if (!plan) {
            return {
                isValid: false,
                error: this.errorBuilder.buildWorkflowError('plan_not_found', {
                    planId: input.planId,
                }),
            };
        }
        // Validate technique matches plan
        if (!plan.techniques.includes(input.technique)) {
            return {
                isValid: false,
                error: this.errorBuilder.buildWorkflowError('technique_mismatch', {
                    planId: input.planId,
                    technique: input.technique,
                    expectedTechniques: plan.techniques,
                }),
                plan,
            };
        }
        return { isValid: true, plan };
    }
    /**
     * Get or create session
     */
    validateAndGetSession(input, ergodicityManager) {
        let session;
        let sessionId = input.sessionId;
        if (sessionId) {
            const existingSession = this.sessionManager.getSession(sessionId);
            if (!existingSession) {
                // Create new session with the user-provided ID
                session = this.initializeSession(input, ergodicityManager);
                try {
                    sessionId = this.sessionManager.createSession(session, sessionId);
                    console.error(`Created new session with user-provided ID: ${sessionId}`);
                }
                catch (error) {
                    // Handle session creation errors (e.g. invalid session ID format)
                    return {
                        error: this.errorBuilder.buildSessionError({
                            sessionId: input.sessionId,
                            errorType: 'invalid_format',
                            message: 'Invalid session ID format: ' +
                                (error instanceof Error
                                    ? error.message
                                    : 'The provided session ID format is invalid'),
                        }),
                    };
                }
            }
            else {
                session = existingSession;
            }
        }
        else {
            // Create new session with auto-generated ID
            session = this.initializeSession(input, ergodicityManager);
            sessionId = this.sessionManager.createSession(session);
        }
        // Update session activity
        this.sessionManager.touchSession(sessionId);
        return { session, sessionId };
    }
    /**
     * Calculate technique-local step from cumulative step
     */
    calculateTechniqueLocalStep(input, plan) {
        let techniqueLocalStep = input.currentStep;
        let techniqueIndex = 0;
        let stepsBeforeThisTechnique = 0;
        if (input.planId && plan) {
            // Find which technique we're on and calculate local step
            for (let i = 0; i < plan.workflow.length; i++) {
                if (plan.workflow[i].technique === input.technique) {
                    techniqueIndex = i;
                    break;
                }
                stepsBeforeThisTechnique += plan.workflow[i].steps.length;
            }
            // Convert cumulative step to local step
            techniqueLocalStep = input.currentStep - stepsBeforeThisTechnique;
        }
        return { techniqueLocalStep, techniqueIndex, stepsBeforeThisTechnique };
    }
    /**
     * Validate step and get step info
     */
    validateStepAndGetInfo(input, techniqueLocalStep, handler) {
        // Store original step for error reporting
        const originalLocalStep = techniqueLocalStep;
        // Check if the original step is invalid
        const isOriginalStepInvalid = !handler.validateStep(originalLocalStep, input);
        if (isOriginalStepInvalid) {
            // Handle invalid step - visual formatter expects this
            const modeIndicator = this.visualFormatter.getModeIndicator(input.technique, originalLocalStep);
            // Call visual formatter to trigger "Unknown" message output
            this.visualFormatter.formatOutput(input.technique, input.problem, originalLocalStep, // Use original invalid step
            input.totalSteps, null, // No stepInfo for invalid steps
            modeIndicator, input);
            return {
                isValid: false,
                stepInfo: null,
                normalizedStep: Math.max(1, techniqueLocalStep), // Ensure at least 1
            };
        }
        // Ensure techniqueLocalStep is at least 1 for validation
        const normalizedStep = techniqueLocalStep < 1 ? 1 : techniqueLocalStep;
        // Try to get step info, handle invalid steps gracefully
        let stepInfo;
        try {
            stepInfo = handler.getStepInfo(normalizedStep);
        }
        catch (error) {
            // Handle different error scenarios
            if (error instanceof RangeError) {
                console.warn(`Step ${normalizedStep} is out of range for ${input.technique}. Using default guidance.`);
                stepInfo = null;
            }
            else if (error instanceof TypeError) {
                console.error(`Handler method error for ${input.technique}:`, error.message);
                stepInfo = null;
            }
            else {
                console.error(`Unexpected error getting step info:`, error);
                stepInfo = null;
            }
        }
        return {
            isValid: true,
            stepInfo,
            normalizedStep,
        };
    }
    /**
     * Initialize a new session
     */
    initializeSession(input, ergodicityManager) {
        const pathMemory = ergodicityManager.getPathMemory();
        return {
            technique: input.technique,
            problem: input.problem,
            history: [],
            branches: {},
            insights: [],
            startTime: Date.now(),
            lastActivityTime: Date.now(),
            pathMemory,
            ergodicityManager,
        };
    }
}
//# sourceMappingURL=ExecutionValidator.js.map