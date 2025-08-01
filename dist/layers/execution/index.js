/**
 * Main execution layer module
 * Orchestrates the execution of thinking steps
 */
import { ExecutionValidator } from './validators.js';
import { SessionHandler } from './sessionHandler.js';
import { ComplexityChecker } from './complexityChecker.js';
import { MetadataGenerator } from './metadataGenerator.js';
import { EffectivenessAnalyzer } from './effectivenessAnalyzer.js';
import { PathAnalyzer } from './pathAnalyzer.js';
import { MemoryPatternDetector } from './memoryPatternDetector.js';
import { isErgodicityResult } from './types.js';
import { ValidationError, ErrorCode } from '../../errors/index.js';
// Re-export types
export * from './types.js';
/**
 * Main execution function
 */
export async function executeThinkingStep(input, sessionManager, responseBuilder, techniqueHandlers, ergodicityManager, memoryAnalyzer, realityIntegration) {
    try {
        // Validate plan ID if provided
        const validation = ExecutionValidator.validatePlanId(input, sessionManager);
        if (!validation.valid && validation.error) {
            return validation.error;
        }
        // Initialize or get session
        const sessionId = SessionHandler.initializeSession(input, sessionManager);
        // Check complexity
        const complexity = ComplexityChecker.analyzeComplexity(input);
        // Get technique handler
        const handler = techniqueHandlers.get(input.technique);
        if (!handler) {
            throw new ValidationError(ErrorCode.INVALID_TECHNIQUE, `Unknown technique: ${input.technique}`, 'technique');
        }
        // Validate the step
        if (!handler.validateStep(input.currentStep, input)) {
            throw new ValidationError(ErrorCode.INVALID_STEP_SEQUENCE, `Invalid step ${input.currentStep} for technique ${input.technique}`, 'currentStep');
        }
        // Get step info
        const stepInfo = handler.getStepInfo(input.currentStep);
        // Get guidance for next step if needed
        const nextStepGuidance = input.nextStepNeeded
            ? handler.getStepGuidance(input.currentStep + 1, input.problem)
            : undefined;
        // The output preserves all input fields
        const output = input;
        // Record ergodicity if available
        let ergodicityResult;
        if (ergodicityManager) {
            const recordResult = await ergodicityManager.recordThinkingStep(input.technique, input.currentStep, input.output, {
                optionsOpened: [],
                optionsClosed: [],
                reversibilityCost: 0.5,
                commitmentLevel: 0.5,
            });
            if (isErgodicityResult(recordResult)) {
                ergodicityResult = recordResult;
            }
        }
        // Analyze effectiveness
        const effectiveness = EffectivenessAnalyzer.analyzeEffectiveness(input);
        // Analyze path dependencies
        const pathAnalysis = PathAnalyzer.analyzePath(input, ergodicityResult);
        // Detect memory patterns
        const memoryPattern = MemoryPatternDetector.detectPatterns(input, sessionId, sessionManager);
        // Save step to session
        SessionHandler.saveStep(sessionId, input, output, sessionManager);
        // Generate metadata
        const metadata = MetadataGenerator.generateMetadata(input, sessionId, ergodicityResult, complexity, effectiveness, pathAnalysis, memoryPattern);
        // Check if session is complete
        const isComplete = SessionHandler.isSessionComplete(input, sessionId, sessionManager);
        // Build response
        if (isComplete) {
            const insights = SessionHandler.getSessionInsights(sessionId, sessionManager);
            const session = sessionManager.getSession(sessionId);
            const summaryMetadata = MetadataGenerator.generateSummaryMetadata(sessionId, input.technique, input.totalSteps, insights);
            return responseBuilder.buildExecutionResponse(sessionId, input, insights, undefined, session?.history?.length || 0, { ...metadata, status: 'completed', sessionSummary: summaryMetadata });
        }
        return responseBuilder.buildExecutionResponse(sessionId, input, handler.extractInsights([{ output: input.output }]), nextStepGuidance, undefined, metadata);
    }
    catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new ValidationError(ErrorCode.INTERNAL_ERROR, error instanceof Error ? error.message : 'Unknown error during execution', 'execution');
    }
}
//# sourceMappingURL=index.js.map