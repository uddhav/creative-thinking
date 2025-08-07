/**
 * ExecutionValidator - Handles validation logic for thinking step execution
 * Extracted from executeThinkingStep to improve maintainability
 */
import { ErrorContextBuilder } from '../../core/ErrorContextBuilder.js';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import { ErrorFactory } from '../../errors/enhanced-errors.js';
import { ErrorHandler } from '../../errors/ErrorHandler.js';
import { ConvergenceValidator } from '../../core/validators/ConvergenceValidator.js';
import { SessionEncoder } from '../../core/session/SessionEncoder.js';
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
        // Check if planId is a base64 encoded session
        if (SessionEncoder.isEncodedSession(input.planId)) {
            // Validate the encoded session
            if (SessionEncoder.isValid(input.planId)) {
                // Decode the session and create a minimal plan from it
                const decodedSession = SessionEncoder.decode(input.planId);
                if (decodedSession) {
                    // Create a minimal plan from the decoded session
                    const minimalPlan = {
                        planId: decodedSession.planId,
                        problem: decodedSession.problem,
                        techniques: decodedSession.techniques || [decodedSession.technique],
                        workflow: [],
                        totalSteps: decodedSession.totalSteps,
                        objectives: decodedSession.objectives,
                        constraints: decodedSession.constraints,
                        executionMode: 'sequential',
                    };
                    // Allow execution as the session is valid
                    return { isValid: true, plan: minimalPlan };
                }
            }
            // Check why it's invalid for better error messages
            const decoded = SessionEncoder.decode(input.planId);
            const enhancedError = ErrorFactory.planNotFound(input.planId);
            if (decoded) {
                const age = Date.now() - decoded.timestamp;
                const expiryTime = 30 * 24 * 60 * 60 * 1000; // 30 days
                if (age > expiryTime) {
                    // Session expired
                    const daysAgo = Math.floor(age / (24 * 60 * 60 * 1000));
                    return {
                        isValid: false,
                        error: this.errorHandler.handleError(enhancedError, 'planning', {
                            planId: input.planId.substring(0, 20) + '...',
                            message: `Session expired ${daysAgo} days ago (sessions expire after 30 days)`,
                            suggestion: 'Please create a new plan to continue.',
                        }),
                    };
                }
                else if (decoded.currentStep > decoded.totalSteps) {
                    // Invalid step
                    return {
                        isValid: false,
                        error: this.errorHandler.handleError(enhancedError, 'planning', {
                            planId: input.planId.substring(0, 20) + '...',
                            message: `Invalid step ${decoded.currentStep} (max: ${decoded.totalSteps})`,
                            suggestion: 'Session data may be corrupted. Please create a new plan.',
                        }),
                    };
                }
            }
            // Corrupted or invalid format
            return {
                isValid: false,
                error: this.errorHandler.handleError(enhancedError, 'planning', {
                    message: 'Invalid session data format',
                    suggestion: 'The session data appears corrupted. Please create a new plan.',
                }),
            };
        }
        // Regular planId - look up in memory
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
            // Check if sessionId is base64 encoded
            if (SessionEncoder.isEncodedSessionId(sessionId)) {
                // Validate the encoded session
                if (SessionEncoder.isValidSession(sessionId)) {
                    // Decode the session and create minimal session from it
                    const decodedSession = SessionEncoder.decodeSession(sessionId);
                    if (decodedSession) {
                        // Extract the original sessionId
                        const originalSessionId = decodedSession.sessionId;
                        // Check if we have this session in memory
                        const existingSession = this.sessionManager.getSession(originalSessionId);
                        if (existingSession) {
                            // Use existing session if found
                            session = existingSession;
                            sessionId = originalSessionId;
                        }
                        else {
                            // Create minimal session from decoded state
                            session = this.initializeSession(input, ergodicityManager);
                            // Update session with decoded state
                            session.problem = decodedSession.problem;
                            session.technique = decodedSession.technique;
                            // Restore history length if provided
                            if (decodedSession.historyLength) {
                                // Create placeholder history entries
                                for (let i = 0; i < decodedSession.historyLength; i++) {
                                    session.history.push({
                                        currentStep: i + 1,
                                        totalSteps: decodedSession.totalSteps,
                                        technique: decodedSession.technique,
                                        problem: decodedSession.problem,
                                        output: decodedSession.lastOutput || `Step ${i + 1} output`,
                                        nextStepNeeded: i + 1 < decodedSession.totalSteps,
                                        timestamp: new Date().toISOString(),
                                    });
                                }
                            }
                            // Create session with original ID
                            sessionId = this.sessionManager.createSession(session, originalSessionId);
                            console.error(`Restored session from encoded state: ${originalSessionId}`);
                        }
                        // Track activity
                        if (input.currentStep === 1) {
                            this.telemetry.trackTechniqueStart(sessionId, input.technique).catch(console.error);
                        }
                    }
                    else {
                        // Invalid encoded session
                        const enhancedError = ErrorFactory.sessionNotFound(sessionId);
                        return {
                            error: this.errorHandler.handleError(enhancedError, 'execution', {
                                sessionId: 'Invalid or expired encoded session',
                                suggestion: 'The encoded session may have expired. Please start a new session.',
                            }),
                        };
                    }
                }
                else {
                    // Expired or invalid encoded session
                    const enhancedError = ErrorFactory.sessionNotFound(sessionId);
                    return {
                        error: this.errorHandler.handleError(enhancedError, 'execution', {
                            sessionId: 'Expired encoded session',
                            suggestion: 'The encoded session has expired. Please start a new session.',
                        }),
                    };
                }
            }
            else {
                // Regular sessionId - existing logic
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