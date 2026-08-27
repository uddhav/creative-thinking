/**
 * Creative Thinking — LateralThinkingServer class + public type re-exports.
 *
 * This file is import-safe: it has no side effects and starts no MCP server,
 * so the socketes CLI and tests can import the class without bootstrapping
 * stdio transport or signal handlers. The MCP server entry point lives in
 * `./mcp-server-main.ts`.
 */
// Core modules
import { SessionManager } from './core/SessionManager.js';
import { ResponseBuilder } from './core/ResponseBuilder.js';
import { MetricsCollector } from './core/MetricsCollector.js';
import { ValidationStrategyFactory } from './core/ValidationStrategies.js';
// Technique system
import { TechniqueRegistry } from './techniques/TechniqueRegistry.js';
// Utils
import { VisualFormatter } from './utils/VisualFormatter.js';
import { HybridComplexityAnalyzer } from './complexity/analyzer.js';
import { wrapComplexityAnalyzer, wrapErgodicityManager, wrapSessionManager, } from './utils/PerformanceIntegration.js';
// Ergodicity
import { ErgodicityManager } from './ergodicity/index.js';
import { CreativeThinkingError, ErrorCode } from './errors/types.js';
// Discovery and planning logic
import { discoverTechniques } from './layers/discovery.js';
import { planThinkingSession } from './layers/planning.js';
import { executeThinkingStep } from './layers/execution.js';
// Export types for external use
export * from './types/index.js';
export * from './types/planning.js';
// Server modules
import { SessionEncoder } from './core/session/SessionEncoder.js';
import { SessionOperationsHandler } from './server/SessionOperationsHandler.js';
import { SamplingHandler } from './server/SamplingHandler.js';
/**
 * Main server class that orchestrates all components
 */
export class LateralThinkingServer {
    sessionManager;
    responseBuilder;
    metricsCollector;
    techniqueRegistry;
    visualFormatter;
    complexityAnalyzer;
    ergodicityManager;
    neuralOptimizationEnabled;
    culturalFrameworksEnabled;
    sessionOperationsHandler;
    samplingHandler;
    // Expose for testing
    get sessions() {
        return this.sessionManager['sessions'];
    }
    get config() {
        // Return the actual config object for testing
        return this.sessionManager['config'];
    }
    // Public getters for dependency injection
    getSessionManager() {
        return this.sessionManager;
    }
    getVisualFormatter() {
        return this.visualFormatter;
    }
    getSamplingHandler() {
        return this.samplingHandler;
    }
    cleanupOldSessions() {
        this.sessionManager.cleanupOldSessions();
    }
    // Test methods
    initializeSession(technique, problem) {
        const sessionData = {
            technique: technique,
            problem,
            history: [],
            branches: {},
            insights: [],
            startTime: Date.now(),
            lastActivityTime: Date.now(),
        };
        return this.sessionManager.createSession(sessionData);
    }
    touchSession(sessionId) {
        void this.sessionManager.touchSession(sessionId);
    }
    evictOldestSessions() {
        // Eviction is handled internally by SessionManager
        console.error('[Server] Manual eviction requested - eviction is automatically handled');
    }
    logMemoryMetrics() {
        // Delegate to SessionManager which delegates to SessionCleaner
        this.sessionManager.logMemoryMetrics();
    }
    constructor() {
        // Initialize sampling handler first
        this.samplingHandler = new SamplingHandler();
        // Create core components with sampling support
        const sessionManager = new SessionManager(this.samplingHandler.getSamplingManager());
        const complexityAnalyzer = new HybridComplexityAnalyzer();
        const ergodicityManager = new ErgodicityManager();
        // Wrap with performance monitoring if enabled
        this.sessionManager = wrapSessionManager(sessionManager);
        this.complexityAnalyzer = wrapComplexityAnalyzer(complexityAnalyzer);
        this.ergodicityManager = wrapErgodicityManager(ergodicityManager);
        // Initialize other components
        this.responseBuilder = new ResponseBuilder();
        this.metricsCollector = new MetricsCollector();
        this.techniqueRegistry = TechniqueRegistry.getInstance();
        const disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || '').toLowerCase() === 'true';
        this.visualFormatter = new VisualFormatter(disableThoughtLogging);
        // Store feature flags for use by techniques
        this.neuralOptimizationEnabled =
            (process.env.NEURAL_OPTIMIZATION || '').toLowerCase() === 'true';
        this.culturalFrameworksEnabled = process.env.CULTURAL_FRAMEWORKS !== undefined;
        // Initialize session operations handler
        this.sessionOperationsHandler = new SessionOperationsHandler(this.sessionManager, this.responseBuilder);
    }
    /**
     * Process lateral thinking requests
     */
    async processLateralThinking(input) {
        try {
            // Determine operation type
            if (this.isSessionOperation(input)) {
                return this.handleSessionOperation(input);
            }
            // Resolve the problem from the plan before validating.
            //
            // The plan response states the problem once at plan scope, and its
            // execution-graph nodes omit it, so a caller executing those nodes
            // verbatim sends no `problem` at all — 25 copies of it per plan were
            // half the payload that pushed the plan response past a host's
            // tool-result limit. A caller-sent value wins: only the caller can
            // revise its own statement of the problem mid-session.
            //
            // Done here rather than deeper because this is the last point where the
            // value may legitimately be absent; every layer below is entitled to a
            // string, and making the field optional on ExecuteThinkingStepInput
            // propagates `string | undefined` through ThinkingOperationData and
            // every validator and orchestrator that reads it.
            if (input && typeof input === 'object') {
                const raw = input;
                if ((raw.problem === undefined || raw.problem === '') && typeof raw.planId === 'string') {
                    // Two homes, because a planId has two forms. An ordinary id is in
                    // the PlanManager; an ENCODED id carries the session inside itself
                    // and is decoded further down, in ExecutionValidator — too late to
                    // help here. Consulting only the manager would refuse an encoded
                    // resume with "no plan to resolve from" while the problem sat
                    // encoded in the id it was handed.
                    const planned = this.sessionManager.getPlan(raw.planId)?.problem ??
                        SessionEncoder.decode(raw.planId)?.problem;
                    if (planned) {
                        raw.problem = planned;
                    }
                    else {
                        // Optional must not mean silent: with no plan to resolve from,
                        // there is no problem anywhere, and the step would otherwise run
                        // against an empty string.
                        return this.responseBuilder.buildErrorResponse(new Error(`execute_thinking_step needs a problem: none was sent, and plan ${raw.planId} ` +
                            `is not available to resolve one from. Send \`problem\`, or use a planId from ` +
                            `plan_thinking_session in this session.`), 'execution');
                    }
                }
            }
            // Validate as thinking operation
            const validator = ValidationStrategyFactory.createValidator('execute');
            const validation = validator.validate(input);
            if (!validation.valid) {
                // Check if validation includes workflow guidance
                const validationWithWorkflow = validation;
                if (validationWithWorkflow.workflow) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    error: validation.errors[0],
                                    workflow: validationWithWorkflow.workflow,
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
                return this.responseBuilder.buildErrorResponse(new Error(validation.errors.join('; ')), 'execution');
            }
            const data = input;
            // Execute thinking step using the execution layer. The validator's
            // warnings ride along: they were computed on every call and thrown away
            // on the valid path for years — now they surface as advisory findings.
            const result = await executeThinkingStep(data, this.sessionManager, this.techniqueRegistry, this.visualFormatter, this.metricsCollector, this.complexityAnalyzer, this.ergodicityManager, validation.warnings);
            return result;
        }
        catch (error) {
            if (error instanceof Error) {
                return this.responseBuilder.buildErrorResponse(error, 'execution');
            }
            return this.responseBuilder.buildErrorResponse(new CreativeThinkingError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred during step execution', 'execution', { error: String(error) }), 'execution');
        }
    }
    /**
     * Discover techniques handler
     */
    discoverTechniques(input) {
        try {
            const validator = ValidationStrategyFactory.createValidator('discover');
            const validation = validator.validate(input);
            if (!validation.valid) {
                return this.responseBuilder.buildErrorResponse(new Error(validation.errors.join('; ')), 'discovery');
            }
            const data = input;
            const output = discoverTechniques(data, this.techniqueRegistry, this.complexityAnalyzer, this.sessionManager);
            return this.responseBuilder.buildDiscoveryResponse(output);
        }
        catch (error) {
            if (error instanceof Error) {
                return this.responseBuilder.buildErrorResponse(error, 'discovery');
            }
            return this.responseBuilder.buildErrorResponse(new CreativeThinkingError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred during discovery', 'discovery', { error: String(error) }), 'discovery');
        }
    }
    /**
     * Plan thinking session handler
     */
    planThinkingSession(input) {
        try {
            const validator = ValidationStrategyFactory.createValidator('plan');
            const validation = validator.validate(input);
            if (!validation.valid) {
                return this.responseBuilder.buildErrorResponse(new Error(validation.errors.join('; ')), 'planning');
            }
            const data = input;
            const output = planThinkingSession(data, this.sessionManager, this.techniqueRegistry);
            return this.responseBuilder.buildPlanningResponse(output);
        }
        catch (error) {
            if (error instanceof Error) {
                return this.responseBuilder.buildErrorResponse(error, 'planning');
            }
            return this.responseBuilder.buildErrorResponse(new CreativeThinkingError(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred during planning', 'planning', { error: String(error) }), 'planning');
        }
    }
    /**
     * Execute thinking step handler
     */
    async executeThinkingStep(input) {
        return this.processLateralThinking(input);
    }
    /**
     * Handle session operations - delegate to SessionOperationsHandler
     */
    async handleSessionOperation(input) {
        return this.sessionOperationsHandler.handleSessionOperation(input);
    }
    isSessionOperation(input) {
        return typeof input === 'object' && input !== null && 'sessionOperation' in input;
    }
    /**
     * Clean up resources
     */
    destroy() {
        this.sessionManager.destroy();
    }
}
//# sourceMappingURL=index.js.map