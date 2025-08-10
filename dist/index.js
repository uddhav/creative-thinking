#!/usr/bin/env node
/**
 * Creative Thinking MCP Server
 * A modular implementation of lateral thinking techniques
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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
import { RequestHandlers } from './server/RequestHandlers.js';
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
        // Create core components
        const sessionManager = new SessionManager();
        const complexityAnalyzer = new HybridComplexityAnalyzer();
        const ergodicityManager = new ErgodicityManager();
        // Wrap with performance monitoring if enabled
        this.sessionManager = wrapSessionManager(sessionManager);
        this.complexityAnalyzer = wrapComplexityAnalyzer(complexityAnalyzer);
        this.ergodicityManager = wrapErgodicityManager(ergodicityManager);
        // Initialize other components
        this.responseBuilder = new ResponseBuilder();
        this.metricsCollector = new MetricsCollector();
        this.techniqueRegistry = new TechniqueRegistry();
        const disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || '').toLowerCase() === 'true';
        this.visualFormatter = new VisualFormatter(disableThoughtLogging);
        // Store feature flags for use by techniques
        this.neuralOptimizationEnabled =
            (process.env.NEURAL_OPTIMIZATION || '').toLowerCase() === 'true';
        this.culturalFrameworksEnabled = process.env.CULTURAL_FRAMEWORKS !== undefined;
        // Initialize session operations handler
        this.sessionOperationsHandler = new SessionOperationsHandler(this.sessionManager, this.responseBuilder);
        // Initialize sampling handler
        this.samplingHandler = new SamplingHandler();
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
            // Execute thinking step using the execution layer
            const result = await executeThinkingStep(data, this.sessionManager, this.techniqueRegistry, this.visualFormatter, this.metricsCollector, this.complexityAnalyzer, this.ergodicityManager);
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
            const output = discoverTechniques(data, this.techniqueRegistry, this.complexityAnalyzer);
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
// Track active requests for proper shutdown
const activeRequests = 0;
// Initialize MCP server
const server = new Server({
    name: 'creative-thinking',
    version: '2.0.0',
}, {
    capabilities: {
        tools: {},
        prompts: {},
    },
});
// Create server instance
const lateralServer = new LateralThinkingServer();
// Set up request handlers
const requestHandlers = new RequestHandlers(server, lateralServer);
requestHandlers.setupHandlers();
// Function to get total active requests
function getActiveRequests() {
    return requestHandlers.getActiveRequests() + activeRequests;
}
// Graceful shutdown handling
let isShuttingDown = false;
let transport = null;
let shutdownTimeout = null;
async function gracefulShutdown(signal) {
    if (isShuttingDown) {
        console.error(`[Server] Already shutting down, ignoring ${signal}`);
        return;
    }
    isShuttingDown = true;
    const totalActiveRequests = getActiveRequests();
    console.error(`[Server] Received ${signal}, starting graceful shutdown...`);
    console.error(`[Server] Active requests: ${totalActiveRequests}`);
    // Set a timeout for forceful shutdown
    shutdownTimeout = setTimeout(() => {
        console.error('[Server] Shutdown timeout reached, forcing exit');
        process.exit(1);
    }, 5000); // 5 second timeout
    // Wait for active requests to complete (up to 2 seconds)
    const waitStart = Date.now();
    let currentActive = getActiveRequests();
    while (currentActive > 0 && Date.now() - waitStart < 2000) {
        console.error(`[Server] Waiting for ${currentActive} active requests...`);
        await new Promise(resolve => setTimeout(resolve, 100));
        currentActive = getActiveRequests();
    }
    if (currentActive > 0) {
        console.error(`[Server] Warning: ${currentActive} requests still active after 2s`);
    }
    try {
        const stdoutWithHandle = process.stdout;
        const stderrWithHandle = process.stderr;
        if (stdoutWithHandle.isTTY && stdoutWithHandle._handle?.setBlocking) {
            try {
                stdoutWithHandle._handle.setBlocking(true);
            }
            catch {
                // Ignore errors if setBlocking is not available
            }
        }
        if (stderrWithHandle.isTTY && stderrWithHandle._handle?.setBlocking) {
            try {
                stderrWithHandle._handle.setBlocking(true);
            }
            catch {
                // Ignore errors if setBlocking is not available
            }
        }
        // Destroy the lateral thinking server to clean up resources
        lateralServer.destroy();
        console.error('[Server] Cleaned up server resources');
        // Close the transport connection if it exists
        if (transport) {
            await transport.close();
            console.error('[Server] Closed transport connection');
        }
        // Disconnect the MCP server
        await server.close();
        console.error('[Server] Closed MCP server');
        // Explicitly flush stdio streams
        await new Promise(resolve => {
            if (process.stdout && !process.stdout.writableEnded) {
                process.stdout.end(() => {
                    console.error('[Server] Stdout flushed');
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
        await new Promise(resolve => {
            if (process.stderr && !process.stderr.writableEnded) {
                process.stderr.end(() => {
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
        console.error('[Server] Graceful shutdown complete');
        // Add a small delay to ensure all data is transmitted
        // This helps prevent the incomplete_stream error in Claude Desktop
        await new Promise(resolve => setTimeout(resolve, 100));
        // Clear the shutdown timeout
        if (shutdownTimeout) {
            clearTimeout(shutdownTimeout);
        }
        // Use process.exitCode instead of process.exit() for cleaner shutdown
        process.exitCode = 0;
        // Force exit after another delay if process doesn't exit naturally
        setTimeout(() => {
            console.error('[Server] Forcing exit after grace period');
            process.exit(0);
        }, 500);
    }
    catch (error) {
        console.error('[Server] Error during graceful shutdown:', error);
        // Still add a small delay even on error to help with stream flushing
        await new Promise(resolve => setTimeout(resolve, 50));
        // Clear the shutdown timeout
        if (shutdownTimeout) {
            clearTimeout(shutdownTimeout);
        }
        process.exitCode = 1;
        // Force exit after delay
        setTimeout(() => {
            process.exit(1);
        }, 500);
    }
}
// Register signal handlers for graceful shutdown
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGHUP', () => void gracefulShutdown('SIGHUP'));
// Handle uncaught errors
process.on('uncaughtException', error => {
    console.error('[Server] Uncaught exception:', error);
    void gracefulShutdown('uncaughtException').then(() => {
        process.exitCode = 1;
    });
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Server] Unhandled rejection at:', promise, 'reason:', reason);
    void gracefulShutdown('unhandledRejection').then(() => {
        process.exitCode = 1;
    });
});
// Start server
async function main() {
    try {
        transport = new StdioServerTransport();
        // Handle transport events
        transport.onclose = () => {
            console.error('[Server] Transport closed');
            if (!isShuttingDown) {
                void gracefulShutdown('transport-close');
            }
        };
        transport.onerror = error => {
            console.error('[Server] Transport error:', error);
            if (!isShuttingDown) {
                void gracefulShutdown('transport-error');
            }
        };
        await server.connect(transport);
        console.error('Creative Thinking MCP server running on stdio');
        console.error('[Server] Debug mode:', process.env.DEBUG_MCP === 'true' ? 'ENABLED' : 'disabled');
        console.error('[Server] To enable debug logging, set DEBUG_MCP=true');
    }
    catch (error) {
        console.error('[Server] Failed to start server:', error);
        process.exit(1);
    }
}
main().catch(error => {
    console.error('[Server] Fatal error:', error);
    if (!isShuttingDown) {
        void gracefulShutdown('fatal-error').then(() => {
            process.exitCode = 1;
        });
    }
});
//# sourceMappingURL=index.js.map