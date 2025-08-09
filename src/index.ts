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
import {
  wrapComplexityAnalyzer,
  wrapErgodicityManager,
  wrapSessionManager,
} from './utils/PerformanceIntegration.js';

// Ergodicity
import { ErgodicityManager } from './ergodicity/index.js';

// Types
import type {
  LateralTechnique,
  SessionData,
  SessionOperationData,
  ExecuteThinkingStepInput,
} from './types/index.js';
import type { DiscoverTechniquesInput, PlanThinkingSessionInput } from './types/planning.js';
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

/**
 * Main server class that orchestrates all components
 */
export class LateralThinkingServer {
  private sessionManager: SessionManager;
  private responseBuilder: ResponseBuilder;
  private metricsCollector: MetricsCollector;
  private techniqueRegistry: TechniqueRegistry;
  private visualFormatter: VisualFormatter;
  private complexityAnalyzer: HybridComplexityAnalyzer;
  private ergodicityManager: ErgodicityManager;
  private neuralOptimizationEnabled: boolean;
  private culturalFrameworksEnabled: boolean;
  private sessionOperationsHandler: SessionOperationsHandler;

  // Expose for testing
  get sessions() {
    return this.sessionManager['sessions'];
  }

  get config() {
    // Return the actual config object for testing
    return this.sessionManager['config'];
  }

  // Public getters for dependency injection
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  getVisualFormatter(): VisualFormatter {
    return this.visualFormatter;
  }

  cleanupOldSessions(): void {
    this.sessionManager.cleanupOldSessions();
  }

  // Test methods
  initializeSession(technique: string, problem: string): string {
    const sessionData: SessionData = {
      technique: technique as LateralTechnique,
      problem,
      history: [],
      branches: {},
      insights: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
    };
    return this.sessionManager.createSession(sessionData);
  }

  touchSession(sessionId: string): void {
    void this.sessionManager.touchSession(sessionId);
  }

  evictOldestSessions(): void {
    // Eviction is handled internally by SessionManager
    console.error('[Server] Manual eviction requested - eviction is automatically handled');
  }

  logMemoryMetrics(): void {
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

    const disableThoughtLogging =
      (process.env.DISABLE_THOUGHT_LOGGING || '').toLowerCase() === 'true';
    this.visualFormatter = new VisualFormatter(disableThoughtLogging);

    // Store feature flags for use by techniques
    this.neuralOptimizationEnabled =
      (process.env.NEURAL_OPTIMIZATION || '').toLowerCase() === 'true';
    this.culturalFrameworksEnabled = process.env.CULTURAL_FRAMEWORKS !== undefined;

    // Initialize session operations handler
    this.sessionOperationsHandler = new SessionOperationsHandler(
      this.sessionManager,
      this.responseBuilder
    );
  }

  /**
   * Process lateral thinking requests
   */
  async processLateralThinking(input: unknown) {
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
        const validationWithWorkflow = validation as { workflow?: unknown; errors: string[] };
        if (validationWithWorkflow.workflow) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: validation.errors[0],
                    workflow: validationWithWorkflow.workflow,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
        return this.responseBuilder.buildErrorResponse(
          new Error(validation.errors.join('; ')),
          'execution'
        );
      }

      const data = input as ExecuteThinkingStepInput;

      // Execute thinking step using the execution layer
      const result = await executeThinkingStep(
        data,
        this.sessionManager,
        this.techniqueRegistry,
        this.visualFormatter,
        this.metricsCollector,
        this.complexityAnalyzer,
        this.ergodicityManager
      );

      return result;
    } catch (error) {
      if (error instanceof Error) {
        return this.responseBuilder.buildErrorResponse(error, 'execution');
      }
      return this.responseBuilder.buildErrorResponse(
        new CreativeThinkingError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred during step execution',
          'execution',
          { error: String(error) }
        ),
        'execution'
      );
    }
  }

  /**
   * Discover techniques handler
   */
  discoverTechniques(input: unknown) {
    try {
      const validator = ValidationStrategyFactory.createValidator('discover');
      const validation = validator.validate(input);
      if (!validation.valid) {
        return this.responseBuilder.buildErrorResponse(
          new Error(validation.errors.join('; ')),
          'discovery'
        );
      }

      const data = input as DiscoverTechniquesInput;
      const output = discoverTechniques(data, this.techniqueRegistry, this.complexityAnalyzer);

      return this.responseBuilder.buildDiscoveryResponse(output);
    } catch (error) {
      if (error instanceof Error) {
        return this.responseBuilder.buildErrorResponse(error, 'discovery');
      }
      return this.responseBuilder.buildErrorResponse(
        new CreativeThinkingError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred during discovery',
          'discovery',
          { error: String(error) }
        ),
        'discovery'
      );
    }
  }

  /**
   * Plan thinking session handler
   */
  planThinkingSession(input: unknown) {
    try {
      const validator = ValidationStrategyFactory.createValidator('plan');
      const validation = validator.validate(input);
      if (!validation.valid) {
        return this.responseBuilder.buildErrorResponse(
          new Error(validation.errors.join('; ')),
          'planning'
        );
      }

      const data = input as PlanThinkingSessionInput;
      const output = planThinkingSession(data, this.sessionManager, this.techniqueRegistry);

      return this.responseBuilder.buildPlanningResponse(output);
    } catch (error) {
      if (error instanceof Error) {
        return this.responseBuilder.buildErrorResponse(error, 'planning');
      }
      return this.responseBuilder.buildErrorResponse(
        new CreativeThinkingError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred during planning',
          'planning',
          { error: String(error) }
        ),
        'planning'
      );
    }
  }

  /**
   * Execute thinking step handler
   */
  async executeThinkingStep(input: unknown) {
    return this.processLateralThinking(input);
  }

  /**
   * Handle session operations - delegate to SessionOperationsHandler
   */
  private async handleSessionOperation(input: SessionOperationData) {
    return this.sessionOperationsHandler.handleSessionOperation(input);
  }

  private isSessionOperation(input: unknown): input is SessionOperationData {
    return typeof input === 'object' && input !== null && 'sessionOperation' in input;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.sessionManager.destroy();
  }
}

// Initialize MCP server
const server = new Server(
  {
    name: 'creative-thinking',
    version: '2.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Create server instance
const lateralServer = new LateralThinkingServer();

// Set up request handlers
const requestHandlers = new RequestHandlers(server, lateralServer);
requestHandlers.setupHandlers();

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Creative Thinking MCP server running on stdio');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
