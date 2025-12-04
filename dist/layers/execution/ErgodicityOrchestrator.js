/**
 * ErgodicityOrchestrator - Handles ergodicity and option generation pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import { getErgodicityPrompt, getErgodicityGuidance } from '../../ergodicity/prompts.js';
import { OptionGenerationEngine } from '../../ergodicity/optionGeneration/engine.js';
import { monitorCriticalSectionAsync } from '../../utils/PerformanceIntegration.js';
import { ErgodicityResultAdapter } from './ErgodicityResultAdapter.js';
export class ErgodicityOrchestrator {
    visualFormatter;
    ergodicityManager;
    sessionManager;
    resultAdapter = new ErgodicityResultAdapter();
    constructor(visualFormatter, ergodicityManager, sessionManager // SessionManager - using unknown to avoid circular dependency
    ) {
        this.visualFormatter = visualFormatter;
        this.ergodicityManager = ergodicityManager;
        this.sessionManager = sessionManager;
    }
    /**
     * Check and display ergodicity prompts
     */
    checkErgodicityPrompts(input, techniqueLocalStep) {
        const ergodicityPrompt = getErgodicityPrompt(input.technique, techniqueLocalStep, input.problem);
        if (ergodicityPrompt) {
            // Add ergodicity check to the operation data
            const inputWithErgodicity = input;
            inputWithErgodicity.ergodicityCheck = {
                prompt: ergodicityPrompt.promptText,
                followUp: ergodicityPrompt.followUp,
                guidance: getErgodicityGuidance(input.technique),
                ruinCheckRequired: ergodicityPrompt.ruinCheckRequired,
            };
            // Log ergodicity prompt to stderr for user awareness
            if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                process.stderr.write('\n' + this.visualFormatter.formatErgodicityPrompt(ergodicityPrompt) + '\n');
            }
        }
    }
    /**
     * Track ergodicity and generate options if needed
     */
    async trackErgodicityAndGenerateOptions(input, session, techniqueLocalStep, sessionId = 'unknown') {
        // Calculate impact
        const impact = this.calculateImpact(input);
        // Track ergodicity
        const ergodicityResult = await monitorCriticalSectionAsync('ergodicity_tracking', () => this.ergodicityManager.recordThinkingStep(input.technique, techniqueLocalStep, input.output, impact, session), { technique: input.technique, step: techniqueLocalStep });
        // Update session with ergodicity data
        session.pathMemory = this.ergodicityManager.getPathMemory();
        // Calculate current flexibility
        const currentFlexibility = input.flexibilityScore ?? session.pathMemory?.currentFlexibility?.flexibilityScore ?? 1.0;
        // Adapt the result to the expected format
        const adaptedErgodicityResult = this.resultAdapter.adapt(ergodicityResult, currentFlexibility, session.pathMemory);
        // Note: Not updating session state with adapted ergodicity data
        // due to type incompatibility between simplified adapted types
        // and full SessionData interface requirements
        // Display flexibility warning if needed
        if (currentFlexibility < 0.4 && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
            const flexibilityWarning = this.visualFormatter.formatFlexibilityWarning(currentFlexibility, input.alternativeSuggestions);
            if (flexibilityWarning) {
                process.stderr.write('\n' + flexibilityWarning + '\n');
            }
        }
        // Display reflexivity warning if available and not disabled
        if (this.sessionManager &&
            process.env.DISABLE_REFLEXIVITY_WARNINGS !== 'true' &&
            process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
            try {
                // Access reflexivity tracker through sessionManager
                // Using type guard to safely access reflexivityTracker
                const sessionManagerWithTracker = this.sessionManager;
                const reflexivityTracker = sessionManagerWithTracker.reflexivityTracker;
                if (reflexivityTracker && typeof reflexivityTracker.generateWarning === 'function') {
                    const reflexivityWarning = reflexivityTracker.generateWarning(sessionId);
                    if (reflexivityWarning) {
                        const warningDisplay = this.visualFormatter.formatReflexivityWarning(reflexivityWarning);
                        if (warningDisplay) {
                            process.stderr.write('\n' + warningDisplay + '\n');
                        }
                    }
                }
            }
            catch {
                // Silently ignore errors to avoid breaking execution
                // Warnings are informational only
            }
        }
        // Display escape recommendations if available
        if (session.escapeRecommendation && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
            const escapeRoutes = session.escapeRecommendation.steps.slice(0, 3).map((step, i) => ({
                name: `Step ${i + 1}`,
                description: step,
            }));
            const escapeDisplay = this.visualFormatter.formatEscapeRecommendations(escapeRoutes);
            if (escapeDisplay) {
                process.stderr.write('\n' + escapeDisplay + '\n');
            }
        }
        // Generate options if flexibility is low
        let optionGenerationResult;
        if (currentFlexibility < 0.4) {
            optionGenerationResult = this.generateOptions(input, session, currentFlexibility, sessionId);
        }
        return {
            ergodicityResult: adaptedErgodicityResult,
            currentFlexibility,
            optionGenerationResult,
            pathMemory: session.pathMemory,
        };
    }
    /**
     * Calculate impact based on technique profile or specific path impact
     */
    calculateImpact(input) {
        if (input.pathImpact) {
            // Use specific path impact from SCAMPER
            const pathImpact = input.pathImpact;
            return {
                optionsClosed: pathImpact.optionsClosed,
                optionsOpened: pathImpact.optionsOpened,
                reversibilityCost: 1 - pathImpact.flexibilityRetention,
                commitmentLevel: pathImpact.commitmentLevel === 'low'
                    ? 0.2
                    : pathImpact.commitmentLevel === 'medium'
                        ? 0.5
                        : pathImpact.commitmentLevel === 'high'
                            ? 0.8
                            : 1.0,
            };
        }
        else {
            // Use technique profile for ergodicity tracking
            const techniqueProfile = this.ergodicityManager.analyzeTechniqueImpact(input.technique);
            // Check if output suggests high commitment
            const outputLower = input.output.toLowerCase();
            const highCommitmentWords = [
                'eliminate',
                'remove',
                'delete',
                'commit',
                'invest',
                'permanent',
            ];
            const hasHighCommitment = highCommitmentWords.some(word => outputLower.includes(word));
            return {
                reversibilityCost: hasHighCommitment ? 0.8 : 1 - techniqueProfile.typicalReversibility,
                commitmentLevel: hasHighCommitment ? 0.8 : techniqueProfile.typicalCommitment,
            };
        }
    }
    /**
     * Generate options when flexibility is low
     */
    generateOptions(input, session, currentFlexibility, sessionId = 'unknown') {
        try {
            const optionEngine = new OptionGenerationEngine();
            const optionSessionData = {
                sessionId,
                startTime: session.startTime || Date.now(),
                problemStatement: input.problem,
                techniquesUsed: [input.technique],
                totalSteps: input.totalSteps,
                insights: session.insights,
                pathDependencyMetrics: {
                    optionSpaceSize: 100 * currentFlexibility,
                    pathDivergence: 1 - currentFlexibility,
                    commitmentDepth: session.pathMemory?.pathHistory?.length || session.history.length,
                    reversibilityIndex: currentFlexibility,
                },
            };
            const optionContext = {
                sessionState: {
                    id: sessionId,
                    problem: input.problem,
                    technique: input.technique,
                    currentStep: input.currentStep,
                    totalSteps: input.totalSteps,
                    history: session.history.map(h => ({
                        step: h.currentStep,
                        timestamp: h.timestamp || new Date().toISOString(),
                        input: h,
                        output: h,
                    })),
                    branches: session.branches,
                    insights: session.insights,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    metrics: session.metrics,
                },
                currentFlexibility: session.pathMemory?.currentFlexibility || {
                    flexibilityScore: currentFlexibility,
                    pathDivergence: 1 - currentFlexibility,
                    reversibilityIndex: currentFlexibility,
                    barrierProximity: [],
                    optionVelocity: 0,
                    commitmentDepth: session.history.length,
                },
                pathMemory: {
                    pathHistory: session.history.map(h => ({
                        timestamp: h.timestamp || new Date().toISOString(),
                        technique: h.technique,
                        step: h.currentStep,
                        decision: h.output,
                        optionsOpened: [],
                        optionsClosed: [],
                        reversibilityCost: 0.5,
                        commitmentLevel: 0.5,
                        constraintsCreated: [],
                    })),
                    constraints: session.pathMemory?.constraints || [],
                    flexibilityOverTime: session.history.map((h, i) => ({
                        step: h.currentStep,
                        score: h.flexibilityScore || 1.0 - i * 0.1,
                        timestamp: Date.now() - (session.history.length - i) * 1000,
                    })),
                    absorbingBarriers: session.pathMemory?.absorbingBarriers || [],
                },
                sessionData: optionSessionData,
            };
            const optionGenerationResult = optionEngine.generateOptions(optionContext);
            // Log to stderr for visibility
            if (optionGenerationResult.options.length > 0 &&
                process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                process.stderr.write(`\n🔄 Option Generation activated (flexibility: ${currentFlexibility.toFixed(2)})\n`);
                process.stderr.write(`   Generated ${optionGenerationResult.options.length} options to increase flexibility\n\n`);
            }
            return optionGenerationResult;
        }
        catch (error) {
            console.error('Option generation failed:', error);
            // Continue without options rather than failing the whole step
            return undefined;
        }
    }
}
//# sourceMappingURL=ErgodicityOrchestrator.js.map