#!/usr/bin/env node

/**
 * Creative Thinking MCP Server
 * A modular implementation of lateral thinking techniques
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

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

// Ergodicity
import { ErgodicityManager } from './ergodicity/index.js';

// Types
import type {
  LateralTechnique,
  SessionData,
  SessionOperationData,
  ExecuteThinkingStepInput,
  Tool,
} from './types/index.js';
import type { DiscoverTechniquesInput, PlanThinkingSessionInput } from './types/planning.js';
import { CreativeThinkingError, ErrorCode, SessionError, ValidationError } from './errors/types.js';

// Discovery and planning logic
import { discoverTechniques } from './layers/discovery.js';
import { planThinkingSession } from './layers/planning.js';
import { executeThinkingStep } from './layers/execution.js';

// Export types for external use
export * from './types/index.js';
export * from './types/planning.js';

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

  // Expose for testing
  get sessions() {
    return this.sessionManager['sessions'];
  }

  get config() {
    // Return the actual config object for testing
    return this.sessionManager['config'];
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
    this.sessionManager.touchSession(sessionId);
  }

  cleanupOldSessions(): void {
    this.sessionManager['cleanupOldSessions']();
  }

  evictOldestSessions(): void {
    this.sessionManager['evictOldestSessions']();
  }

  logMemoryMetrics(): void {
    this.sessionManager['logMemoryMetrics']();
  }

  constructor() {
    this.sessionManager = new SessionManager();
    this.responseBuilder = new ResponseBuilder();
    this.metricsCollector = new MetricsCollector();
    this.techniqueRegistry = new TechniqueRegistry();
    this.complexityAnalyzer = new HybridComplexityAnalyzer();
    this.ergodicityManager = new ErgodicityManager();

    const disableThoughtLogging =
      (process.env.DISABLE_THOUGHT_LOGGING || '').toLowerCase() === 'true';
    this.visualFormatter = new VisualFormatter(disableThoughtLogging);

    // Store feature flags for use by techniques
    this.neuralOptimizationEnabled =
      (process.env.NEURAL_OPTIMIZATION || '').toLowerCase() === 'true';
    this.culturalFrameworksEnabled = !!process.env.CULTURAL_FRAMEWORKS;
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
   * Handle session operations
   */
  private async handleSessionOperation(input: SessionOperationData) {
    try {
      switch (input.sessionOperation) {
        case 'save':
          return await this.handleSaveOperation();
        case 'load':
          return await this.handleLoadOperation(input);
        case 'list':
          return await this.handleListOperation(input);
        case 'delete':
          return await this.handleDeleteOperation(input);
        case 'export':
          return await this.handleExportOperation(input);
        default:
          throw new ValidationError(
            ErrorCode.INVALID_INPUT,
            `Unknown session operation: ${input.sessionOperation as string}`,
            'sessionOperation',
            { providedOperation: input.sessionOperation }
          );
      }
    } catch (error) {
      if (error instanceof Error) {
        return this.responseBuilder.buildErrorResponse(error, 'session');
      }
      return this.responseBuilder.buildErrorResponse(
        new CreativeThinkingError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred during session operation',
          'session',
          { error: String(error) }
        ),
        'session'
      );
    }
  }

  private async handleSaveOperation() {
    const currentSessionId = this.sessionManager.getCurrentSessionId();
    if (!currentSessionId) {
      throw new SessionError(ErrorCode.SESSION_NOT_FOUND, 'No active session to save', undefined, {
        operation: 'save',
      });
    }

    await this.sessionManager.saveSessionToPersistence(currentSessionId);
    return this.responseBuilder.buildSessionOperationResponse('save', {
      sessionId: currentSessionId,
      message: 'Session saved successfully',
    });
  }

  private async handleLoadOperation(input: SessionOperationData) {
    if (!input.loadOptions?.sessionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required for load operation',
        'loadOptions.sessionId'
      );
    }

    const session = await this.sessionManager.loadSessionFromPersistence(
      input.loadOptions.sessionId
    );

    return this.responseBuilder.buildSessionOperationResponse('load', {
      sessionId: input.loadOptions.sessionId,
      session: {
        technique: session.technique,
        problem: session.problem,
        stepsCompleted: session.history.length,
        lastStep: session.history[session.history.length - 1]?.currentStep || 0,
      },
    });
  }

  private async handleListOperation(input: SessionOperationData) {
    const sessions = await this.sessionManager.listPersistedSessions(input.listOptions);

    const formatted = this.responseBuilder.formatSessionList(sessions);
    return this.responseBuilder.buildSessionOperationResponse('list', formatted);
  }

  private async handleDeleteOperation(input: SessionOperationData) {
    if (!input.deleteOptions?.sessionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required for delete operation',
        'deleteOptions.sessionId'
      );
    }

    await this.sessionManager.deletePersistedSession(input.deleteOptions.sessionId);
    return this.responseBuilder.buildSessionOperationResponse('delete', {
      sessionId: input.deleteOptions.sessionId,
      message: 'Session deleted successfully',
    });
  }

  private async handleExportOperation(input: SessionOperationData) {
    if (!input.exportOptions?.sessionId) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'sessionId is required for export operation',
        'exportOptions.sessionId'
      );
    }

    if (!input.exportOptions?.format) {
      throw new ValidationError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        'format is required for export operation',
        'exportOptions.format'
      );
    }

    const validFormats = ['json', 'markdown', 'csv'];
    if (!validFormats.includes(input.exportOptions.format)) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        `Invalid export format: ${input.exportOptions.format}. Must be one of: ${validFormats.join(', ')}`,
        'exportOptions.format',
        { providedFormat: input.exportOptions.format, validFormats }
      );
    }

    const session = this.sessionManager.getSession(input.exportOptions.sessionId);
    if (!session) {
      // Try loading from persistence
      const loadedSession = await this.sessionManager.loadSessionFromPersistence(
        input.exportOptions.sessionId
      );
      if (!loadedSession) {
        throw new SessionError(
          ErrorCode.SESSION_NOT_FOUND,
          `Session ${input.exportOptions.sessionId} not found`,
          input.exportOptions.sessionId
        );
      }
    }

    const sessionData =
      session ||
      (await this.sessionManager.loadSessionFromPersistence(input.exportOptions.sessionId));

    const exportData = this.responseBuilder.formatExportData(
      sessionData,
      input.exportOptions.format
    );

    return this.responseBuilder.buildSessionOperationResponse('export', {
      format: input.exportOptions.format,
      data: exportData,
    });
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

// Tool definitions
const DISCOVER_TECHNIQUES_TOOL: Tool = {
  name: 'discover_techniques',
  description:
    'Analyzes a problem and recommends appropriate lateral thinking techniques based on problem characteristics and desired outcomes',
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description: 'The problem or challenge to solve',
      },
      context: {
        type: 'string',
        description: 'Additional context about the situation',
      },
      preferredOutcome: {
        type: 'string',
        enum: ['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'],
        description: 'The type of solution preferred',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any constraints or limitations to consider',
      },
    },
    required: ['problem'],
  },
};

const PLAN_THINKING_SESSION_TOOL: Tool = {
  name: 'plan_thinking_session',
  description:
    'Creates a structured workflow for applying one or more lateral thinking techniques to a problem',
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description: 'The problem to solve',
      },
      techniques: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'six_hats',
            'po',
            'random_entry',
            'scamper',
            'concept_extraction',
            'yes_and',
            'design_thinking',
            'triz',
            'neural_state',
            'temporal_work',
            'cross_cultural',
            'collective_intel',
          ],
        },
        description: 'The techniques to include in the workflow',
      },
      objectives: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific objectives for this session',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Constraints to work within',
      },
      timeframe: {
        type: 'string',
        enum: ['quick', 'thorough', 'comprehensive'],
        description: 'How much time/depth to invest',
      },
    },
    required: ['problem', 'techniques'],
  },
};

const EXECUTE_THINKING_STEP_TOOL: Tool = {
  name: 'execute_thinking_step',
  description:
    'Executes a single step in the lateral thinking process, maintaining session state and providing structured guidance',
  inputSchema: {
    type: 'object',
    properties: {
      planId: { type: 'string' },
      sessionId: { type: 'string' },
      technique: { type: 'string' },
      problem: { type: 'string' },
      currentStep: { type: 'number' },
      totalSteps: { type: 'number' },
      output: { type: 'string' },
      nextStepNeeded: { type: 'boolean' },
      autoSave: {
        type: 'boolean',
        description: 'Whether to automatically save the session after this step',
      },
      // Technique-specific fields would be added here
      // ... (abbreviated for brevity)
    },
    required: [
      'planId',
      'technique',
      'problem',
      'currentStep',
      'totalSteps',
      'output',
      'nextStepNeeded',
    ],
  },
};

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

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [DISCOVER_TECHNIQUES_TOOL, PLAN_THINKING_SESSION_TOOL, EXECUTE_THINKING_STEP_TOOL],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  const { name, arguments: args } = request.params;

  try {
    let result;
    switch (name) {
      case 'discover_techniques':
        result = lateralServer.discoverTechniques(args);
        break;

      case 'plan_thinking_session':
        result = lateralServer.planThinkingSession(args);
        break;

      case 'execute_thinking_step':
        result = await lateralServer.executeThinkingStep(args);
        break;

      default:
        throw new ValidationError(ErrorCode.INVALID_INPUT, `Unknown tool: ${name}`, 'toolName', {
          providedTool: name,
        });
    }

    // MCP expects the content array directly
    return {
      content: result.content,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
});

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
