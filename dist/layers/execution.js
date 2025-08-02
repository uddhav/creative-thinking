/**
 * Execution Layer
 * Handles the execution of thinking steps
 */
// Most ergodicity imports are now handled by orchestrators
import { ResponseBuilder } from '../core/ResponseBuilder.js';
import { ExecutionError, ErrorCode, PersistenceError } from '../errors/types.js';
import { monitorCriticalSectionAsync, addPerformanceSummary, } from '../utils/PerformanceIntegration.js';
// Risk and option generation imports are now handled by orchestrators
// Import new orchestrators
import { ExecutionValidator } from './execution/ExecutionValidator.js';
import { RiskAssessmentOrchestrator } from './execution/RiskAssessmentOrchestrator.js';
import { ErgodicityOrchestrator } from './execution/ErgodicityOrchestrator.js';
import { ExecutionResponseBuilder } from './execution/ExecutionResponseBuilder.js';
import { EscalationPromptGenerator } from '../ergodicity/escalationPrompts.js';
export async function executeThinkingStep(input, sessionManager, techniqueRegistry, visualFormatter, metricsCollector, complexityAnalyzer, ergodicityManager) {
    const responseBuilder = new ResponseBuilder();
    // Initialize orchestrators
    const executionValidator = new ExecutionValidator(sessionManager, techniqueRegistry, visualFormatter);
    const riskAssessmentOrchestrator = new RiskAssessmentOrchestrator(visualFormatter);
    const ergodicityOrchestrator = new ErgodicityOrchestrator(visualFormatter, ergodicityManager);
    const executionResponseBuilder = new ExecutionResponseBuilder(complexityAnalyzer, new EscalationPromptGenerator(), techniqueRegistry);
    try {
        // Validate plan if provided
        const planValidation = executionValidator.validatePlan(input);
        if (!planValidation.isValid) {
            return planValidation.error;
        }
        const plan = planValidation.plan;
        // Get or create session
        const { session, sessionId } = executionValidator.validateAndGetSession(input, ergodicityManager);
        // Get technique handler
        const handler = techniqueRegistry.getHandler(input.technique);
        // Calculate technique-local step
        const { techniqueLocalStep: calculatedTechniqueLocalStep, techniqueIndex } = executionValidator.calculateTechniqueLocalStep(input, plan);
        // Validate step and get step info
        const stepValidation = executionValidator.validateStepAndGetInfo(input, calculatedTechniqueLocalStep, handler);
        if (!stepValidation.isValid) {
            // Handle invalid step gracefully with detailed context
            const techniqueInfo = handler.getTechniqueInfo();
            const errorContext = {
                providedStep: input.currentStep,
                validRange: `1-${techniqueInfo.totalSteps}`,
                technique: input.technique,
                techniqueLocalStep: calculatedTechniqueLocalStep,
                globalStep: input.currentStep,
                message: `Step ${input.currentStep} is outside valid range for ${techniqueInfo.name}`,
            };
            const operationData = {
                ...input,
                sessionId,
            };
            let nextStepGuidance;
            if (input.nextStepNeeded) {
                nextStepGuidance = `Complete the ${techniqueInfo.name} process`;
            }
            const minimalMetadata = {
                techniqueEffectiveness: 0.5,
                pathDependenciesCreated: [],
                flexibilityImpact: -0.05,
                errorContext,
            };
            return responseBuilder.buildExecutionResponse(sessionId, operationData, [], nextStepGuidance, session.history.length, minimalMetadata);
        }
        const { stepInfo, normalizedStep: techniqueLocalStep } = stepValidation;
        // Check for ergodicity prompts
        ergodicityOrchestrator.checkErgodicityPrompts(input, techniqueLocalStep);
        // Perform comprehensive risk assessment
        const riskAssessment = riskAssessmentOrchestrator.assessRisks(input, session);
        if (riskAssessment.requiresIntervention) {
            return riskAssessment.interventionResponse;
        }
        // Get mode indicator
        const modeIndicator = visualFormatter.getModeIndicator(input.technique, techniqueLocalStep);
        // Display visual output
        const visualOutput = visualFormatter.formatOutput(input.technique, input.problem, techniqueLocalStep, input.totalSteps, stepInfo, modeIndicator, input);
        if (visualOutput && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
            // Only log if thought logging is enabled
            // IMPORTANT: Use stderr for visual output - stdout is reserved for JSON-RPC
            process.stderr.write(visualOutput);
        }
        // Handle SCAMPER path impact
        if (input.technique === 'scamper' && input.scamperAction) {
            const scamperHandler = handler;
            input.pathImpact = scamperHandler.analyzePathImpact(input.scamperAction, input.output, session.history);
            // Build modification history from session (previous steps only)
            input.modificationHistory = [];
            // Include previous SCAMPER modifications from history
            session.history.forEach(entry => {
                if (entry.technique === 'scamper' &&
                    entry.scamperAction &&
                    entry.pathImpact &&
                    input.modificationHistory) {
                    input.modificationHistory.push({
                        action: entry.scamperAction,
                        modification: entry.output,
                        timestamp: entry.timestamp || new Date().toISOString(),
                        impact: entry.pathImpact,
                        cumulativeFlexibility: entry.flexibilityScore || entry.pathImpact.flexibilityRetention,
                    });
                }
            });
            // Add flexibility score to the input
            input.flexibilityScore = input.pathImpact.flexibilityRetention;
            // Generate alternatives if flexibility is low
            if (input.pathImpact.flexibilityRetention < 0.4) {
                input.alternativeSuggestions = scamperHandler.generateAlternatives(input.scamperAction, input.pathImpact.flexibilityRetention);
            }
        }
        // Track ergodicity and generate options if needed
        const { currentFlexibility, optionGenerationResult } = await ergodicityOrchestrator.trackErgodicityAndGenerateOptions(input, session, techniqueLocalStep, sessionId);
        // Record step in history (exclude realityAssessment from operationData to avoid duplication)
        const { realityAssessment: inputRealityAssessment, ...inputWithoutReality } = input;
        // If there's a reality assessment from input, we should handle it separately
        if (inputRealityAssessment) {
            // Reality assessment is handled through realityResult and added to response separately
            // This prevents duplication in the operation data
        }
        const operationData = {
            ...inputWithoutReality,
            sessionId,
        };
        session.history.push({
            ...operationData,
            timestamp: new Date().toISOString(),
        });
        // Handle revisions and branches
        if (input.isRevision && input.revisesStep !== undefined) {
            if (!input.branchId) {
                input.branchId = `branch_${Date.now()}`;
            }
            if (!session.branches[input.branchId]) {
                session.branches[input.branchId] = [];
            }
            session.branches[input.branchId].push(operationData);
        }
        // Update metrics
        metricsCollector.updateMetrics(session, operationData);
        // Build comprehensive execution response
        const response = executionResponseBuilder.buildResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility, optionGenerationResult);
        // Handle session completion
        if (!input.nextStepNeeded) {
            session.endTime = Date.now();
            // Final summary
            visualFormatter.formatSessionSummary(input.technique, input.problem, session.insights, session.metrics);
        }
        // Auto-save if enabled
        if (input.autoSave) {
            try {
                await monitorCriticalSectionAsync('session_autosave', () => sessionManager.saveSessionToPersistence(sessionId), { sessionId });
            }
            catch (error) {
                // Add auto-save failure to response with context
                const parsedResponse = JSON.parse(response.content[0].text);
                // Provide more context about the error
                if (error instanceof PersistenceError &&
                    error.code === ErrorCode.PERSISTENCE_NOT_AVAILABLE) {
                    parsedResponse.autoSaveStatus = 'disabled';
                    parsedResponse.autoSaveMessage =
                        'Persistence is not configured. Session data is stored in memory only.';
                }
                else {
                    parsedResponse.autoSaveStatus = 'failed';
                    parsedResponse.autoSaveError =
                        error instanceof Error ? error.message : 'Auto-save failed';
                }
                response.content[0].text = JSON.stringify(parsedResponse, null, 2);
            }
        }
        // Add performance summary if profiling is enabled
        return addPerformanceSummary(response);
    }
    catch (error) {
        if (error instanceof Error) {
            return responseBuilder.buildErrorResponse(error, 'execution');
        }
        return responseBuilder.buildErrorResponse(new ExecutionError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred during execution', { error: String(error) }), 'execution');
    }
}
//# sourceMappingURL=execution.js.map