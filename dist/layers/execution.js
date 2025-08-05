/**
 * Execution Layer
 * Handles the execution of thinking steps
 */
// Most ergodicity imports are now handled by orchestrators
import { ResponseBuilder } from '../core/ResponseBuilder.js';
import { ErrorCode, PersistenceError } from '../errors/types.js';
import { monitorCriticalSectionAsync, addPerformanceSummary, } from '../utils/PerformanceIntegration.js';
import { ErrorContextBuilder } from '../core/ErrorContextBuilder.js';
import { ErrorHandler } from '../errors/ErrorHandler.js';
import { ErrorFactory } from '../errors/enhanced-errors.js';
// Risk and option generation imports are now handled by orchestrators
// Import new orchestrators
import { ExecutionValidator } from './execution/ExecutionValidator.js';
import { RiskAssessmentOrchestrator } from './execution/RiskAssessmentOrchestrator.js';
import { ErgodicityOrchestrator } from './execution/ErgodicityOrchestrator.js';
import { ExecutionResponseBuilder } from './execution/ExecutionResponseBuilder.js';
import { EscalationPromptGenerator } from '../ergodicity/escalationPrompts.js';
// Import parallel execution components
import { ParallelExecutionContext } from './execution/ParallelExecutionContext.js';
export async function executeThinkingStep(input, sessionManager, techniqueRegistry, visualFormatter, metricsCollector, complexityAnalyzer, ergodicityManager) {
    const responseBuilder = new ResponseBuilder();
    const errorContextBuilder = new ErrorContextBuilder();
    const errorHandler = new ErrorHandler();
    // Initialize orchestrators
    const executionValidator = new ExecutionValidator(sessionManager, techniqueRegistry, visualFormatter);
    const riskAssessmentOrchestrator = new RiskAssessmentOrchestrator(visualFormatter);
    const ergodicityOrchestrator = new ErgodicityOrchestrator(visualFormatter, ergodicityManager);
    const executionResponseBuilder = new ExecutionResponseBuilder(complexityAnalyzer, new EscalationPromptGenerator(), techniqueRegistry);
    // Get parallel execution context (singleton)
    const parallelContext = ParallelExecutionContext.getInstance(sessionManager, visualFormatter);
    try {
        // Validate plan if provided
        const planValidation = executionValidator.validatePlan(input);
        if (!planValidation.isValid && planValidation.error) {
            return planValidation.error;
        }
        const plan = planValidation.plan;
        // Validate convergence technique usage
        const convergenceValidation = executionValidator.validateConvergenceTechnique(input);
        if (!convergenceValidation.isValid && convergenceValidation.error) {
            return convergenceValidation.error;
        }
        // Check if this is a convergence execution
        if (input.technique === 'convergence') {
            const convergenceExecutor = parallelContext.getConvergenceExecutor();
            return convergenceExecutor.executeConvergence(input, input.sessionId || '');
        }
        // Get or create session
        const sessionValidation = executionValidator.validateAndGetSession(input, ergodicityManager);
        if (sessionValidation.error) {
            return sessionValidation.error;
        }
        const { session, sessionId } = sessionValidation;
        if (!session || !sessionId) {
            throw ErrorFactory.sessionNotFound(input.sessionId || 'unknown');
        }
        // Check if session is part of a parallel group (only if needed)
        const isParallelNeeded = parallelContext.isParallelExecutionNeeded(input.technique, sessionId);
        let parallelExecutionInfo = {
            groupId: null,
            canProceed: true,
            dependencies: [],
            sharedContext: undefined,
            waitingFor: [],
        };
        if (isParallelNeeded || session.parallelGroupId) {
            const parallelStepExecutor = parallelContext.getParallelStepExecutor();
            parallelExecutionInfo = parallelStepExecutor.checkParallelExecutionContext(sessionId, input);
        }
        // If session can't proceed due to dependencies, return waiting response
        if (parallelExecutionInfo.groupId && !parallelExecutionInfo.canProceed) {
            // Report progress as waiting
            const progressCoordinator = parallelContext.getProgressCoordinator();
            void progressCoordinator.reportProgress({
                groupId: parallelExecutionInfo.groupId,
                sessionId,
                technique: input.technique,
                currentStep: input.currentStep,
                totalSteps: input.totalSteps,
                status: 'waiting',
                timestamp: Date.now(),
                metadata: {
                    dependencies: parallelExecutionInfo.dependencies,
                },
            });
            const parallelStepExecutor = parallelContext.getParallelStepExecutor();
            return parallelStepExecutor.executeWithCoordination(input, sessionId, () => Promise.resolve(responseBuilder.buildExecutionResponse(sessionId, { ...input, sessionId }, [], 'Waiting for dependencies to complete', session.history.length, {
                techniqueEffectiveness: 0.5,
                pathDependenciesCreated: [],
                flexibilityImpact: 0,
            })));
        }
        // Initialize shared context for parallel group if needed
        if (parallelExecutionInfo.groupId && !parallelExecutionInfo.sharedContext) {
            const sessionSynchronizer = parallelContext.getSessionSynchronizer();
            sessionSynchronizer.initializeSharedContext(parallelExecutionInfo.groupId);
        }
        // Get technique handler
        const handler = techniqueRegistry.getHandler(input.technique);
        // Calculate technique-local step
        const { techniqueLocalStep: calculatedTechniqueLocalStep, techniqueIndex } = executionValidator.calculateTechniqueLocalStep(input, plan);
        // Validate step and get step info
        const stepValidation = executionValidator.validateStepAndGetInfo(input, calculatedTechniqueLocalStep, handler);
        if (!stepValidation.isValid) {
            // Handle invalid step gracefully with detailed context
            const techniqueInfo = handler.getTechniqueInfo();
            const errorContext = errorContextBuilder.buildStepErrorContext({
                providedStep: input.currentStep,
                validRange: `1-${techniqueInfo.totalSteps}`,
                technique: input.technique,
                techniqueLocalStep: calculatedTechniqueLocalStep,
                globalStep: input.currentStep,
                message: `Step ${input.currentStep} is outside valid range for ${techniqueInfo.name}`,
            });
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
        if (riskAssessment.requiresIntervention && riskAssessment.interventionResponse) {
            return riskAssessment.interventionResponse;
        }
        // Report progress for parallel execution
        if (parallelExecutionInfo.groupId) {
            const progressCoordinator = parallelContext.getProgressCoordinator();
            void progressCoordinator.reportProgress({
                groupId: parallelExecutionInfo.groupId,
                sessionId,
                technique: input.technique,
                currentStep: input.currentStep,
                totalSteps: input.totalSteps,
                status: 'in_progress',
                timestamp: Date.now(),
            });
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
            // Performance monitoring for revision chains
            const revisionCount = session.history.filter(h => h.isRevision).length;
            if (revisionCount > 0 && revisionCount % 10 === 0) {
                // Log performance warning every 10 revisions
                const sessionDuration = Date.now() - (session.startTime || Date.now());
                const avgRevisionTime = sessionDuration / revisionCount;
                if (process.env.LOG_LEVEL === 'DEBUG' || process.env.NODE_ENV === 'development') {
                    process.stderr.write(`[Performance] Deep revision chain detected: ${revisionCount} revisions, avg time: ${avgRevisionTime.toFixed(2)}ms\n`);
                }
            }
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
        let response;
        // If in parallel group, execute with coordination
        if (parallelExecutionInfo.groupId) {
            const parallelStepExecutor = parallelContext.getParallelStepExecutor();
            response = await parallelStepExecutor.executeWithCoordination(input, sessionId, () => Promise.resolve(executionResponseBuilder.buildResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility, optionGenerationResult)));
        }
        else {
            response = executionResponseBuilder.buildResponse(input, session, sessionId, handler, techniqueLocalStep, techniqueIndex, plan, currentFlexibility, optionGenerationResult);
        }
        // Handle session completion
        if (!input.nextStepNeeded) {
            session.endTime = Date.now();
            // Report completion for parallel execution
            if (parallelExecutionInfo.groupId) {
                const progressCoordinator = parallelContext.getProgressCoordinator();
                void progressCoordinator.reportProgress({
                    groupId: parallelExecutionInfo.groupId,
                    sessionId,
                    technique: input.technique,
                    currentStep: input.currentStep,
                    totalSteps: input.totalSteps,
                    status: 'completed',
                    timestamp: Date.now(),
                    metadata: {
                        insightsGenerated: session.insights.length,
                    },
                });
            }
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
        // Check if this is a parallel execution error
        const sessionId = input.sessionId || '';
        const session = sessionManager.getSession(sessionId);
        if (session?.parallelGroupId) {
            // Handle with parallel error handler
            const parallelErrorContext = {
                sessionId,
                groupId: session.parallelGroupId,
                technique: input.technique,
                step: input.currentStep,
                errorType: 'execution_error',
            };
            // Report error to progress coordinator
            const progressCoordinator = parallelContext.getProgressCoordinator();
            void progressCoordinator.reportProgress({
                groupId: session.parallelGroupId,
                sessionId,
                technique: input.technique,
                currentStep: input.currentStep,
                totalSteps: input.totalSteps,
                status: 'failed',
                timestamp: Date.now(),
                metadata: {
                    errorMessage: error instanceof Error ? error.message : String(error),
                },
            });
            const parallelErrorHandler = parallelContext.getParallelErrorHandler();
            return parallelErrorHandler.handleParallelError(error, parallelErrorContext);
        }
        // Use standard error handler for non-parallel execution
        return errorHandler.handleError(error, 'execution', {
            technique: input.technique,
            step: input.currentStep,
            sessionId: input.sessionId,
        });
    }
}
//# sourceMappingURL=execution.js.map