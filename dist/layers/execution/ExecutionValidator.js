/**
 * ExecutionValidator - Handles validation logic for thinking step execution
 * Extracted from executeThinkingStep to improve maintainability
 */
import { ErrorContextBuilder } from '../../core/ErrorContextBuilder.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { ConvergenceValidator } from '../../core/validators/ConvergenceValidator.js';
export class ExecutionValidator {
    sessionManager;
    techniqueRegistry;
    visualFormatter;
    errorBuilder = new ErrorContextBuilder();
    telemetry = TelemetryCollector.getInstance();
    errorHandler = new ErrorHandler();
    convergenceValidator = new ConvergenceValidator();
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
            const enhancedError = ErrorFactory.planNotFound(input.planId);
            return {
                isValid: false,
                error: this.errorHandler.handleError(enhancedError, 'planning', {
                    planId: input.planId,
                }),
            };
        }
        // Validate technique matches plan
        // Special case: convergence technique is always allowed as it synthesizes parallel results
        if (input.technique !== 'convergence' && !plan.techniques.includes(input.technique)) {
            const planTechnique = plan.techniques[0]; // Use first technique as the expected one
            const enhancedError = ErrorFactory.techniqueMismatch(planTechnique, input.technique, input.planId);
            return {
                isValid: false,
                error: this.errorHandler.handleError(enhancedError, 'planning', {
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
                    // Track session start and technique start
                    this.telemetry.trackSessionStart(sessionId, input.problem.length).catch(console.error);
                    this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
                }
                catch (error) {
                    // Handle session creation errors (e.g. invalid session ID format)
                    const message = error instanceof Error ? error.message : 'The provided session ID format is invalid';
                    const enhancedError = ErrorFactory.invalidInput('sessionId', 'valid session ID format', input.sessionId);
                    return {
                        error: this.errorHandler.handleError(enhancedError, 'discovery', {
                            sessionId: input.sessionId,
                            errorType: 'invalid_format',
                            message,
                        }),
                    };
                }
            }
            else {
                session = existingSession;
                // Track technique start if this is the first step
                if (input.currentStep === 1) {
                    this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
                }
            }
        }
        else {
            // Create new session with auto-generated ID
            session = this.initializeSession(input, ergodicityManager);
            sessionId = this.sessionManager.createSession(session);
            // Track session start and technique start
            this.telemetry.trackSessionStart(sessionId, input.problem.length).catch(console.error);
            this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
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
            // Find which technique we're on
            for (let i = 0; i < plan.workflow.length; i++) {
                if (plan.workflow[i].technique === input.technique) {
                    techniqueIndex = i;
                    break;
                }
                // Only accumulate steps for sequential execution
                if (plan.executionMode !== 'parallel') {
                    stepsBeforeThisTechnique += plan.workflow[i].steps.length;
                }
            }
            // In parallel mode, each technique uses its own local step numbering
            // In sequential mode, convert cumulative step to local step
            if (plan.executionMode === 'parallel') {
                // Techniques run independently with their own step numbering (1-N)
                techniqueLocalStep = input.currentStep;
            }
            else {
                // Sequential execution uses cumulative step numbering
                techniqueLocalStep = input.currentStep - stepsBeforeThisTechnique;
            }
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
     * Validate convergence technique usage
     */
    validateConvergenceTechnique(input) {
        // Use dedicated ConvergenceValidator for convergence-specific validation
        const convergenceValidation = this.convergenceValidator.validateConvergence(input);
        if (!convergenceValidation.isValid) {
            return convergenceValidation;
        }
        // Check for non-convergence techniques with parallel-specific fields
        if (input.technique !== 'convergence' && input.parallelResults) {
            return {
                isValid: false,
                error: this.errorBuilder.buildGenericError('Non-convergence techniques should not have parallel results', {
                    technique: input.technique,
                    hasParallelResults: true,
                }),
            };
        }
        return { isValid: true };
    }
    /**
     * Initialize a new session
     */
    initializeSession(input, ergodicityManager) {
        const pathMemory = ergodicityManager.getPathMemory();
        const sessionData = {
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
        // Add planId in parallelMetadata if provided
        if (input.planId) {
            sessionData.parallelMetadata = {
                planId: input.planId,
                techniques: [input.technique],
                canExecuteIndependently: true,
            };
        }
        return sessionData;
    }
}
//# sourceMappingURL=ExecutionValidator.js.map