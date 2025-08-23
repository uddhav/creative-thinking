import { randomUUID } from 'node:crypto';
import { McpAgent } from 'agents/mcp';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SessionAdapter } from './adapters/SessionAdapter.js';
import { TechniqueAdapter } from './adapters/TechniqueAdapter.js';
import { ExecutionAdapter } from './adapters/ExecutionAdapter.js';
import { formatErrorResponse } from './utils/errors.js';
import { createLogger, type Logger } from './utils/logger.js';
import { ResourceProviderRegistry } from './resources/ResourceProvider.js';
import { SessionResourceProvider } from './resources/SessionResourceProvider.js';
import { DocumentationResourceProvider } from './resources/DocumentationResourceProvider.js';
import { MetricsResourceProvider } from './resources/MetricsResourceProvider.js';
import { PromptRegistry } from './prompts/PromptRegistry.js';
import { CreativeWorkshopPrompt } from './prompts/workshop/CreativeWorkshopPrompt.js';
import { ProblemSolverPrompt } from './prompts/problem/ProblemSolverPrompt.js';
import { RiskAssessmentPrompt } from './prompts/analysis/RiskAssessmentPrompt.js';
import { StreamingManager, VisualOutputFormatter } from './streaming/StreamingManager.js';
import type { StreamingConfig } from './streaming/types.js';
import { SamplingManager } from './sampling/SamplingManager.js';
import { IdeaEnhancer } from './sampling/features/IdeaEnhancer.js';
import type { SamplingCapability } from './sampling/types.js';

export interface Props extends Record<string, unknown> {
  userId?: string;
  accessToken?: string;
  streamingConfig?: StreamingConfig;
  samplingEnabled?: boolean;
}

export interface Env {
  KV: KVNamespace;
  AI?: any;
}

// Define the state interface for our Agent
export interface CreativeThinkingState {
  sessions: Record<string, any>;
  currentSessionId?: string;
  workflows: Record<string, any>;
  globalMetrics: {
    totalSessions: number;
    totalIdeasGenerated: number;
    averageFlexibilityScore: number;
    techniqueUsage: Record<string, number>;
  };
}

export class CreativeThinkingMcpAgent extends McpAgent<Env, CreativeThinkingState, Props> {
  private sessionAdapter!: SessionAdapter;
  private techniqueAdapter!: TechniqueAdapter;
  private executionAdapter!: ExecutionAdapter;
  private resourceRegistry!: ResourceProviderRegistry;
  private promptRegistry!: PromptRegistry;
  private streamingManager!: StreamingManager;
  private samplingManager!: SamplingManager;
  private ideaEnhancer!: IdeaEnhancer;
  private logger!: Logger;

  // Initial state for the Agent
  initialState: CreativeThinkingState = {
    sessions: {},
    workflows: {},
    currentSessionId: undefined,
    globalMetrics: {
      totalSessions: 0,
      totalIdeasGenerated: 0,
      averageFlexibilityScore: 1.0,
      techniqueUsage: {},
    },
  };

  // McpAgent requires server to be a property that returns McpServer
  server = new McpServer({
    name: 'Creative Thinking MCP Server',
    version: '1.0.0',
    description: 'A three-layer MCP server for structured creative problem-solving techniques',
  });

  async init() {
    // Initialize logger
    this.logger = createLogger(this.env as any, 'CreativeThinkingMcpAgent');

    // Initialize adapters with environment
    this.sessionAdapter = new SessionAdapter(this.env.KV);
    this.techniqueAdapter = new TechniqueAdapter();
    this.executionAdapter = new ExecutionAdapter(this.sessionAdapter, this.techniqueAdapter);

    // Initialize streaming manager
    this.streamingManager = new StreamingManager(
      this.props.streamingConfig || {
        bufferFlushInterval: 50,
        maxConcurrentConnections: 1000,
        enableCollaboration: true,
        sse: {
          keepAliveInterval: 30000,
          retryInterval: 5000,
          maxBufferSize: 1024 * 1024,
        },
        websocket: {
          heartbeatInterval: 30000,
          maxConnectionsPerUser: 5,
          maxMessageSize: 1024 * 1024,
        },
      }
    );

    // Initialize sampling manager for AI enhancement
    this.samplingManager = new SamplingManager();

    // Set sampling capability if enabled
    if (this.props.samplingEnabled !== false) {
      this.samplingManager.setCapability({
        supported: true,
        providers: ['cloudflare-ai', 'openai', 'anthropic'],
        maxTokens: 4096,
        defaultPreferences: {
          intelligencePriority: 0.7,
          speedPriority: 0.5,
          costPriority: 0.5,
        },
      });
    }

    // Initialize AI-enhanced features
    this.ideaEnhancer = new IdeaEnhancer(this.samplingManager);

    // Set up sampling notification handler for streaming
    this.samplingManager.setNotificationHandler(notification => {
      this.streamingManager
        .broadcast({
          event: 'sampling',
          data: notification,
        })
        .catch(err => this.logger.error('Failed to broadcast sampling notification', err));
    });

    // Initialize resource providers
    this.resourceRegistry = new ResourceProviderRegistry();
    this.resourceRegistry.register(
      new SessionResourceProvider(this.sessionAdapter, () => this.state)
    );
    this.resourceRegistry.register(new DocumentationResourceProvider());
    this.resourceRegistry.register(new MetricsResourceProvider(() => this.state));

    // Initialize prompt registry and register prompts
    this.promptRegistry = new PromptRegistry();
    this.promptRegistry.register(new CreativeWorkshopPrompt());
    this.promptRegistry.register(new ProblemSolverPrompt());
    this.promptRegistry.register(new RiskAssessmentPrompt());

    // Register the three core MCP tools
    this.registerDiscoverTechniques();
    this.registerPlanThinkingSession();
    this.registerExecuteThinkingStep();

    // Register MCP sampling tools
    this.registerSamplingTools();

    // Register MCP resources
    this.registerResources();

    // Register MCP prompts
    this.registerPrompts();
  }

  private registerDiscoverTechniques() {
    this.server.tool(
      'discover_techniques',
      'Analyze a problem and recommend appropriate creative thinking techniques',
      {
        problem: z.string().describe('The problem or challenge to analyze'),
        context: z.string().optional().describe('Additional context about the problem'),
        constraints: z.array(z.string()).optional().describe('Any constraints or requirements'),
        domain: z.string().optional().describe('The domain or field of the problem'),
      },
      async params => {
        try {
          const result = await this.techniqueAdapter.discoverTechniques(params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );
  }

  private registerPlanThinkingSession() {
    this.server.tool(
      'plan_thinking_session',
      'Create a structured workflow using selected thinking techniques',
      {
        problem: z.string().describe('The problem to solve'),
        techniques: z.array(z.string()).describe('Array of technique names to use'),
        objectives: z.array(z.string()).optional().describe('Specific objectives for the session'),
        constraints: z.array(z.string()).optional().describe('Constraints to work within'),
        timeframe: z
          .enum(['quick', 'thorough', 'comprehensive'])
          .optional()
          .describe('How much time/depth to invest'),
        executionMode: z
          .enum(['sequential', 'parallel', 'auto'])
          .optional()
          .describe('How to execute techniques'),
        maxParallelism: z
          .number()
          .min(1)
          .max(10)
          .optional()
          .describe('Maximum parallel techniques'),
      },
      async params => {
        try {
          const result = await this.executionAdapter.planThinkingSession(params);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );
  }

  private registerExecuteThinkingStep() {
    this.server.tool(
      'execute_thinking_step',
      'Execute a single step in the creative thinking workflow',
      {
        planId: z.string().describe('The plan ID from plan_thinking_session'),
        technique: z.string().describe('The current technique being executed'),
        problem: z.string().describe('The problem being solved'),
        currentStep: z.number().describe('Current step number'),
        totalSteps: z.number().describe('Total number of steps'),
        output: z.string().describe('The thinking output for this step'),
        nextStepNeeded: z.boolean().describe('Whether another step is needed'),

        // Optional technique-specific fields - Complete set from ToolDefinitions.ts

        // Six Hats specific
        hatColor: z.enum(['blue', 'white', 'red', 'yellow', 'black', 'green']).optional(),

        // PO specific
        provocation: z.string().optional(),
        principles: z.array(z.string()).optional(),

        // Random Entry specific
        randomStimulus: z.string().optional(),
        connections: z.array(z.string()).optional(),

        // SCAMPER specific
        scamperAction: z
          .enum([
            'substitute',
            'combine',
            'adapt',
            'modify',
            'put_to_other_use',
            'eliminate',
            'reverse',
            'parameterize',
          ])
          .optional(),
        modifications: z.array(z.string()).optional(),
        pathImpact: z.object({}).passthrough().optional(),

        // Concept Extraction specific
        successExample: z.string().optional(),
        extractedConcepts: z.array(z.string()).optional(),
        abstractedPatterns: z.array(z.string()).optional(),
        applications: z.array(z.string()).optional(),

        // Yes, And... specific
        initialIdea: z.string().optional(),
        additions: z.array(z.string()).optional(),
        evaluations: z.array(z.string()).optional(),
        synthesis: z.string().optional(),

        // Design Thinking specific
        designStage: z.enum(['empathize', 'define', 'ideate', 'prototype', 'test']).optional(),
        empathyInsights: z.array(z.string()).optional(),
        problemStatement: z.string().optional(),
        ideaList: z.array(z.string()).optional(),
        prototypeDescription: z.string().optional(),
        userFeedback: z.array(z.string()).optional(),

        // TRIZ specific
        contradiction: z.string().optional(),
        inventivePrinciples: z.array(z.string()).optional(),
        minimalSolution: z.string().optional(),

        // Neural State specific
        dominantNetwork: z.enum(['dmn', 'ecn']).optional(),
        suppressionDepth: z.number().min(0).max(10).optional(),
        switchingRhythm: z.array(z.string()).optional(),
        integrationInsights: z.array(z.string()).optional(),

        // Temporal Work specific
        temporalLandscape: z.object({}).passthrough().optional(),
        circadianAlignment: z.array(z.string()).optional(),
        pressureTransformation: z.array(z.string()).optional(),
        asyncSyncBalance: z.array(z.string()).optional(),
        temporalEscapeRoutes: z.array(z.string()).optional(),

        // Cross-Cultural specific
        culturalFrameworks: z.array(z.string()).optional(),
        bridgeBuilding: z.array(z.string()).optional(),
        respectfulSynthesis: z.array(z.string()).optional(),
        parallelPaths: z.array(z.string()).optional(),

        // Collective Intelligence specific
        wisdomSources: z.array(z.string()).optional(),
        emergentPatterns: z.array(z.string()).optional(),
        synergyCombinations: z.array(z.string()).optional(),
        collectiveInsights: z.array(z.string()).optional(),

        // Disney Method specific
        disneyRole: z.enum(['dreamer', 'realist', 'critic']).optional(),
        dreamerVision: z.array(z.string()).optional(),
        realistPlan: z.array(z.string()).optional(),
        criticRisks: z.array(z.string()).optional(),

        // Nine Windows specific
        nineWindowsMatrix: z
          .array(
            z.object({
              timeFrame: z.enum(['past', 'present', 'future']),
              systemLevel: z.enum(['sub-system', 'system', 'super-system']),
              content: z.string(),
              pathDependencies: z.array(z.string()).optional(),
              irreversible: z.boolean().optional(),
            })
          )
          .optional(),
        currentCell: z
          .object({
            timeFrame: z.enum(['past', 'present', 'future']),
            systemLevel: z.enum(['sub-system', 'system', 'super-system']),
          })
          .optional(),
        interdependencies: z.array(z.string()).optional(),

        // Paradoxical Problem specific
        paradox: z.string().optional(),
        contradictions: z.array(z.string()).optional(),
        solutionA: z.string().optional(),
        solutionB: z.string().optional(),
        metaPath: z.string().optional(),
        bridge: z.string().optional(),
        validation: z.string().optional(),
        pathContexts: z.array(z.string()).optional(),
        resolutionVerified: z.boolean().optional(),

        // Quantum Superposition specific
        solutionStates: z.array(z.string()).optional(),
        interferencePatterns: z
          .object({
            constructive: z.array(z.string()).optional(),
            destructive: z.array(z.string()).optional(),
            hybrid: z.array(z.string()).optional(),
          })
          .optional(),
        entanglements: z
          .array(
            z.object({
              states: z.array(z.string()),
              dependency: z.string(),
            })
          )
          .optional(),
        amplitudes: z.object({}).passthrough().optional(),
        measurementCriteria: z.array(z.string()).optional(),
        chosenState: z.string().optional(),
        preservedInsights: z.array(z.string()).optional(),

        // Temporal Creativity specific
        pathHistory: z
          .array(
            z.object({
              decision: z.string(),
              impact: z.string(),
              constraintsCreated: z.array(z.string()).optional(),
              optionsClosed: z.array(z.string()).optional(),
            })
          )
          .optional(),
        decisionPatterns: z.array(z.string()).optional(),
        currentConstraints: z.array(z.string()).optional(),
        activeOptions: z.array(z.string()).optional(),
        timelineProjections: z
          .object({
            bestCase: z.array(z.string()).optional(),
            probableCase: z.array(z.string()).optional(),
            worstCase: z.array(z.string()).optional(),
            blackSwanScenarios: z.array(z.string()).optional(),
            antifragileDesign: z.array(z.string()).optional(),
          })
          .optional(),
        delayOptions: z.array(z.string()).optional(),
        accelerationOptions: z.array(z.string()).optional(),
        parallelTimelines: z.array(z.string()).optional(),
        lessonIntegration: z.array(z.string()).optional(),
        strategyEvolution: z.string().optional(),
        synthesisStrategy: z.string().optional(),
        preservedOptions: z.array(z.string()).optional(),

        // First Principles specific
        components: z.array(z.string()).optional(),
        breakdown: z.array(z.string()).optional(),
        fundamentalTruths: z.array(z.string()).optional(),
        foundations: z.array(z.string()).optional(),
        assumptions: z.array(z.string()).optional(),
        challenges: z.array(z.string()).optional(),
        reconstruction: z.string().optional(),
        rebuilding: z.string().optional(),
        solution: z.string().optional(),

        // Meta-Learning specific
        metaSynthesis: z.string().optional(),

        // Biomimetic Path specific
        immuneResponse: z.array(z.string()).optional(),
        antibodies: z.array(z.string()).optional(),
        mutations: z.array(z.string()).optional(),
        selectionPressure: z.string().optional(),
        symbioticRelationships: z.array(z.string()).optional(),
        ecosystemBalance: z.string().optional(),
        swarmBehavior: z.array(z.string()).optional(),
        resiliencePatterns: z.array(z.string()).optional(),
        redundancy: z.array(z.string()).optional(),
        naturalSynthesis: z.string().optional(),
        biologicalStrategies: z.array(z.string()).optional(),

        // Neuro-Computational specific
        neuralMappings: z.array(z.string()).optional(),
        patternGenerations: z.array(z.string()).optional(),
        interferenceAnalysis: z
          .object({
            constructive: z.array(z.string()),
            destructive: z.array(z.string()),
          })
          .optional(),
        computationalModels: z.array(z.string()).optional(),
        optimizationCycles: z.number().optional(),
        convergenceMetrics: z
          .object({
            coherence: z.number().optional(),
            novelty: z.number().optional(),
            utility: z.number().optional(),
          })
          .optional(),
        finalSynthesis: z.string().optional(),

        // Risk/Adversarial fields (unified framework)
        risks: z.array(z.string()).optional(),
        failureModes: z.array(z.string()).optional(),
        mitigations: z.array(z.string()).optional(),
        antifragileProperties: z.array(z.string()).optional(),
        blackSwans: z.array(z.string()).optional(),
        failureInsights: z.array(z.string()).optional(),
        stressTestResults: z.array(z.string()).optional(),
        failureModesPredicted: z.array(z.string()).optional(),
        viaNegativaRemovals: z.array(z.string()).optional(),

        // Revision support
        isRevision: z.boolean().optional(),
        revisesStep: z.number().optional(),
        branchFromStep: z.number().optional(),
        branchId: z.string().optional(),
        flexibilityScore: z.number().min(0).max(1).optional(),
        alternativeSuggestions: z.array(z.string()).optional(),

        // Session management
        autoSave: z.boolean().optional(),
      },
      async params => {
        try {
          // Stream progress if we have an active session
          const sessionId = params.planId;

          // Send visual header for step execution
          await this.streamingManager.broadcast(
            VisualOutputFormatter.formatHeader(
              `Executing ${params.technique} - Step ${params.currentStep}/${params.totalSteps}`,
              '🧠'
            )
          );

          // Execute with progress reporting
          const result = await this.streamingManager.streamProgress(
            `execute_step_${params.technique}`,
            sessionId,
            params.totalSteps,
            async reporter => {
              // Update progress for current step
              reporter.update(params.currentStep - 1, params.totalSteps, {
                technique: params.technique,
                label: `Processing step ${params.currentStep}`,
              });

              // Execute the actual step
              const stepResult = await this.executionAdapter.executeThinkingStep(params);

              // Send visual output for the step result
              if (params.output) {
                await this.streamingManager.broadcast(
                  VisualOutputFormatter.formatTechniqueOutput(
                    params.technique,
                    params.currentStep,
                    params.output
                  )
                );
              }

              // Update progress to current step complete
              reporter.update(params.currentStep, params.totalSteps, {
                technique: params.technique,
                label: `Completed step ${params.currentStep}`,
              });

              // Send state change event
              await this.streamingManager.sendStateChange({
                sessionId,
                path: ['sessions', sessionId, 'currentStep'],
                oldValue: params.currentStep - 1,
                newValue: params.currentStep,
                source: 'server',
              });

              return stepResult;
            }
          );

          // Send completion visual if this is the last step
          if (!params.nextStepNeeded) {
            await this.streamingManager.broadcast(VisualOutputFormatter.formatDivider('double'));
            await this.streamingManager.broadcast(
              VisualOutputFormatter.formatHeader(`✨ Completed ${params.technique} Technique`, '✅')
            );
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          // Send error as warning
          await this.streamingManager.sendWarning({
            level: 'CRITICAL',
            type: 'performance',
            message: `Error in ${params.technique} step ${params.currentStep}: ${(error as Error).message}`,
            details: { error: (error as Error).stack },
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Convert our content format to MCP-compatible format
   */
  private convertToMcpContent(content: any): any {
    // If it's a string, convert to text content
    if (typeof content === 'string') {
      return { type: 'text' as const, text: content };
    }

    // If it's already a text content object
    if (content && content.type === 'text') {
      return content;
    }

    // If it's an array, convert the first item to text
    if (Array.isArray(content)) {
      const first = content[0];
      if (first && first.type === 'text') {
        return first;
      }
      // For other content types, convert to text representation
      if (first && first.type === 'resource') {
        return {
          type: 'text' as const,
          text: `[Resource: ${first.resource.uri}${first.resource.text ? ` - ${first.resource.text}` : ''}]`,
        };
      }
      if (first && first.type === 'tool_use') {
        return {
          type: 'text' as const,
          text: `[Tool Use: ${first.toolUse.toolName}(${JSON.stringify(first.toolUse.arguments)})]`,
        };
      }
      // Default to text representation of first item
      return { type: 'text' as const, text: JSON.stringify(first) };
    }

    // Default fallback
    return { type: 'text' as const, text: JSON.stringify(content) };
  }

  /**
   * Register MCP prompts with the server
   */
  private registerPrompts() {
    // Creative Workshop Prompt
    this.server.prompt(
      'creative_workshop',
      'Facilitate a complete creative thinking workshop',
      {
        topic: z.string().describe('Workshop topic or challenge'),
        duration: z.string().optional().describe('Duration in minutes (e.g., "60")'),
        participants: z.string().optional().describe('Number of participants'),
        objectives: z.string().optional().describe('Comma-separated objectives'),
      },
      async (args, extra) => {
        const prompt = this.promptRegistry.get('creative_workshop');
        if (!prompt) {
          throw new Error('Creative workshop prompt not found');
        }

        // Convert string arguments to proper types
        const workshopArgs = {
          topic: args.topic,
          duration: args.duration ? parseInt(args.duration) : undefined,
          participants: args.participants,
          objectives: args.objectives ? args.objectives.split(',').map(s => s.trim()) : undefined,
        };

        const result = await prompt.generate(workshopArgs);

        // Convert our prompt format to MCP format
        return {
          description: result.description,
          messages: result.messages.map(msg => ({
            role: msg.role,
            content: this.convertToMcpContent(msg.content),
          })),
        };
      }
    );

    // Problem Solver Prompt
    this.server.prompt(
      'problem_solver',
      'Comprehensive problem-solving wizard',
      {
        problem: z.string().describe('Problem description'),
        context: z.string().optional().describe('Additional context'),
        desired_outcome: z.string().optional().describe('What success looks like'),
      },
      async (args, extra) => {
        const prompt = this.promptRegistry.get('problem_solver');
        if (!prompt) {
          throw new Error('Problem solver prompt not found');
        }

        const result = await prompt.generate(args);

        // Convert our prompt format to MCP format
        return {
          description: result.description,
          messages: result.messages.map(msg => ({
            role: msg.role,
            content: this.convertToMcpContent(msg.content),
          })),
        };
      }
    );

    // Risk Assessment Prompt
    this.server.prompt(
      'risk_assessment',
      'Comprehensive risk and opportunity analysis',
      {
        idea: z.string().describe('Idea or solution to assess'),
        context: z.string().optional().describe('Implementation context'),
        risk_tolerance: z.string().optional().describe('Risk tolerance level (low/moderate/high)'),
      },
      async (args, extra) => {
        const prompt = this.promptRegistry.get('risk_assessment');
        if (!prompt) {
          throw new Error('Risk assessment prompt not found');
        }

        const result = await prompt.generate(args);

        // Convert our prompt format to MCP format
        return {
          description: result.description,
          messages: result.messages.map(msg => ({
            role: msg.role,
            content: this.convertToMcpContent(msg.content),
          })),
        };
      }
    );

    this.logger.debug(`Registered ${this.promptRegistry.list().length} prompts`);
  }

  /**
   * Register MCP sampling tools
   */
  private registerSamplingTools() {
    // Tool to check sampling capability
    this.server.tool(
      'sampling_capability',
      'Check if MCP Sampling is available and get capability details',
      {},
      async () => {
        const capability = this.samplingManager.getCapability();
        const stats = this.samplingManager.getStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  available: this.samplingManager.isAvailable(),
                  capability,
                  stats,
                  pendingRequests: this.samplingManager.getPendingCount(),
                },
                null,
                2
              ),
            },
          ],
        };
      }
    );

    // Tool to enhance ideas with AI
    this.server.tool(
      'enhance_idea',
      'Enhance a creative idea using AI',
      {
        idea: z.string().describe('The idea to enhance'),
        context: z.string().optional().describe('Additional context'),
        style: z.enum(['creative', 'analytical', 'practical', 'innovative']).optional(),
        depth: z.enum(['shallow', 'moderate', 'deep']).optional(),
        addExamples: z.boolean().optional(),
        addRisks: z.boolean().optional(),
      },
      async params => {
        try {
          const enhanced = await this.ideaEnhancer.enhanceIdea(params.idea, params.context, {
            style: params.style,
            depth: params.depth,
            addExamples: params.addExamples,
            addRisks: params.addRisks,
          });

          // Update metrics
          this.state.globalMetrics.totalIdeasGenerated++;

          return {
            content: [
              {
                type: 'text',
                text: enhanced,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );

    // Tool to generate idea variations
    this.server.tool(
      'generate_variations',
      'Generate variations of an idea',
      {
        idea: z.string().describe('The original idea'),
        count: z.number().min(1).max(10).default(3).describe('Number of variations'),
        style: z.enum(['similar', 'diverse', 'opposite']).optional(),
      },
      async params => {
        try {
          const variations = await this.ideaEnhancer.generateVariations(
            params.idea,
            params.count,
            params.style
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    original: params.idea,
                    variations,
                    count: variations.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );

    // Tool to synthesize multiple ideas
    this.server.tool(
      'synthesize_ideas',
      'Combine multiple ideas into a unified solution',
      {
        ideas: z.array(z.string()).min(2).describe('Ideas to synthesize'),
        goal: z.string().optional().describe('Overall goal for synthesis'),
      },
      async params => {
        try {
          const synthesis = await this.ideaEnhancer.synthesizeIdeas(params.ideas, params.goal);

          return {
            content: [
              {
                type: 'text',
                text: synthesis,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );

    // Tool to test direct sampling
    this.server.tool(
      'test_sampling',
      'Test MCP Sampling with a custom prompt',
      {
        prompt: z.string().describe('The prompt to send'),
        temperature: z.number().min(0).max(1).optional(),
        maxTokens: z.number().min(1).max(4096).optional(),
      },
      async params => {
        try {
          if (!this.samplingManager.isAvailable()) {
            throw new Error('MCP Sampling is not available');
          }

          const result = await this.samplingManager.requestSampling(
            {
              messages: [{ role: 'user', content: params.prompt }],
              temperature: params.temperature,
              maxTokens: params.maxTokens,
            },
            'test_sampling'
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatErrorResponse(error), null, 2),
              },
            ],
          };
        }
      }
    );

    this.logger.debug('Registered 5 MCP Sampling tools');
  }

  /**
   * Register MCP resources with the server
   */
  private async registerResources() {
    // Get all resources from all providers
    const allResources = await this.resourceRegistry.listAllResources();

    // Register each resource with the MCP server
    for (const resource of allResources) {
      this.server.resource(resource.name, resource.uri, async (uri: URL) => {
        const content = await this.resourceRegistry.readResource(uri.toString());
        if (!content) {
          throw new Error(`Resource not found: ${uri.toString()}`);
        }
        return {
          contents: [
            content.text
              ? {
                  uri: content.uri,
                  mimeType: content.mimeType,
                  text: content.text,
                }
              : {
                  uri: content.uri,
                  mimeType: content.mimeType,
                  blob: content.blob!,
                },
          ],
        };
      });
    }

    // Register resource templates for dynamic URIs
    const templates = await this.resourceRegistry.listAllTemplates();
    for (const template of templates) {
      // Create a proper ResourceTemplate instance
      const resourceTemplate = new ResourceTemplate(template.uriTemplate, {
        list: async () => {
          // Return possible URIs for this template
          const resources = await this.resourceRegistry.listAllResources();
          const filtered = resources
            .filter((r: { uri: string }) => r.uri.startsWith(template.uriTemplate.split('/')[0]))
            .map((r: { uri: string; name: string; mimeType: string }) => ({
              uri: r.uri,
              name: r.name,
              mimeType: r.mimeType,
            }));

          return {
            resources: filtered,
          };
        },
      });

      this.server.resource(
        template.name,
        resourceTemplate,
        {
          mimeType: template.mimeType,
          description: template.description,
        },
        async (uri: URL, variables: { [key: string]: string | string[] }) => {
          // The URI has already been resolved with the template variables
          const content = await this.resourceRegistry.readResource(uri.toString());
          if (!content) {
            throw new Error(`Resource not found: ${uri.toString()}`);
          }

          return {
            contents: [
              content.text
                ? {
                    uri: content.uri,
                    mimeType: content.mimeType,
                    text: content.text,
                  }
                : {
                    uri: content.uri,
                    mimeType: content.mimeType,
                    blob: content.blob!,
                  },
            ],
          };
        }
      );
    }

    this.logger.debug(
      `Registered ${allResources.length} resources and ${templates.length} templates`
    );
  }

  // Lifecycle method: Called when state is updated
  onStateUpdate(state: CreativeThinkingState | undefined, source: any): void {
    if (state) {
      this.logger.debug('State updated', {
        sessions: Object.keys(state.sessions).length,
        totalSessions: state.globalMetrics.totalSessions,
        source: source === 'server' ? 'server' : 'client',
      });
    }
  }

  // Lifecycle method: Called when Agent starts
  async onStart(): Promise<void> {
    this.logger.info('Creative Thinking MCP Agent started');
    await this.init();
  }

  // Override fetch to handle streaming endpoints
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle streaming endpoints
    if (url.pathname.startsWith('/stream')) {
      return this.handleStreamingRequest(request);
    }

    // Handle streaming stats endpoint
    if (url.pathname === '/stream/stats') {
      return new Response(JSON.stringify(this.getStreamingStats()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Otherwise, let McpAgent handle the request
    return super.fetch(request);
  }

  // Handle WebSocket messages through McpAgent
  async webSocketMessage(ws: WebSocket, event: ArrayBuffer | string): Promise<void> {
    // McpAgent handles the MCP protocol, but we can add custom handling if needed
    await super.webSocketMessage(ws, event);

    // Update metrics after processing
    const state = this.state;
    if (state) {
      state.globalMetrics.totalSessions = Object.keys(state.sessions).length;
      this.setState(state);
    }
  }

  // Handle WebSocket errors
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    this.logger.error('WebSocket error', error);
    await super.webSocketError(ws, error);
  }

  // Handle WebSocket close
  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean
  ): Promise<void> {
    this.logger.debug(`WebSocket closed: code=${code}, reason=${reason}, clean=${wasClean}`);
    await super.webSocketClose(ws, code, reason, wasClean);
  }

  // Override onError from McpAgent base class
  onError(error: Error) {
    this.logger.error('MCP Agent error', error);
    return {
      status: 500,
      message: 'Internal server error',
    };
  }

  /**
   * Handle streaming requests (SSE or WebSocket)
   * This method should be called from the main worker for streaming endpoints
   */
  async handleStreamingRequest(request: Request): Promise<Response> {
    // Generate a unique connection ID
    const connectionId = randomUUID();

    // Extract session ID from query params or headers
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    // Subscribe to session updates if session ID provided
    if (sessionId) {
      this.streamingManager.subscribeToSession(connectionId, sessionId);
    }

    // Handle the streaming request
    const response = await this.streamingManager.handleRequest(request, connectionId);

    // Clean up on disconnect
    if (sessionId) {
      // The cleanup will happen when the connection closes
      // StreamingManager handles this internally
    }

    return response;
  }

  /**
   * Get streaming statistics
   */
  getStreamingStats() {
    return this.streamingManager.getStats();
  }

  /**
   * Broadcast a custom event to all connected clients
   */
  async broadcastEvent(event: any) {
    await this.streamingManager.broadcast(event);
  }
}
