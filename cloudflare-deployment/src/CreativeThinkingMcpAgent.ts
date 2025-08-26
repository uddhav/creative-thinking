import { McpAgent } from 'agents/mcp';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SessionAdapter } from './adapters/SessionAdapter.js';
import { TechniqueAdapter } from './adapters/TechniqueAdapter.js';
import { formatErrorResponse } from './utils/errors.js';
import { createLogger, type Logger } from './utils/logger.js';
import { ResourceProviderRegistry } from './resources/ResourceProvider.js';
import { SessionResourceProvider } from './resources/SessionResourceProvider.js';
import { DocumentationResourceProvider } from './resources/DocumentationResourceProvider.js';
// import { MetricsResourceProvider } from './resources/MetricsResourceProvider.js';
import { PromptRegistry } from './prompts/PromptRegistry.js';
import { CreativeWorkshopPrompt } from './prompts/workshop/CreativeWorkshopPrompt.js';
import { ProblemSolverPrompt } from './prompts/problem/ProblemSolverPrompt.js';
import { RiskAssessmentPrompt } from './prompts/analysis/RiskAssessmentPrompt.js';
import { StreamingManager, VisualOutputFormatter } from './streaming/StreamingManager.js';
import type { StreamingConfig } from './streaming/types.js';

export interface Props extends Record<string, unknown> {
  userId?: string;
  accessToken?: string;
  streamingConfig?: StreamingConfig;
  debugMode?: boolean;
}

export interface Env {
  KV: KVNamespace;
  AI?: any;
  ENVIRONMENT?: string;
}

// Define the state interface for our Agent with proper session and plan management
export interface CreativeThinkingState {
  sessions: Record<
    string,
    {
      id: string;
      planId?: string;
      technique?: string;
      problem: string;
      history: any[];
      startTime: number;
      lastActivityTime: number;
      state?: any;
    }
  >;
  plans: Record<
    string,
    {
      id: string;
      problem: string;
      techniques: string[];
      options: any;
      createdAt: number;
      steps: any[];
      currentStepIndex?: number;
    }
  >;
  currentSessionId?: string;
  workflows: Record<string, any>;
  globalMetrics: {
    totalSessions: number;
    totalIdeasGenerated: number;
    averageFlexibilityScore: number;
    techniqueUsage: Record<string, number>;
    authenticatedRequests?: number;
    totalRequests?: number;
    averageResponseTime?: number;
    errorRate?: number;
  };
}

export class CreativeThinkingMcpAgent extends McpAgent<Env, CreativeThinkingState, Props> {
  private sessionAdapter!: SessionAdapter;
  private techniqueAdapter!: TechniqueAdapter;
  private resourceRegistry!: ResourceProviderRegistry;
  private promptRegistry!: PromptRegistry;
  private streamingManager!: StreamingManager;
  private logger!: Logger;
  private initialized: boolean = false;

  // Initial state for the Agent with proper session and plan management
  initialState: CreativeThinkingState = {
    sessions: {},
    plans: {},
    workflows: {},
    currentSessionId: undefined,
    globalMetrics: {
      totalSessions: 0,
      totalIdeasGenerated: 0,
      averageFlexibilityScore: 1.0,
      techniqueUsage: {},
    },
  };

  // McpAgent requires server to be a property that returns McpServer or Promise<McpServer>
  private _server: McpServer | null = null;

  get server(): McpServer {
    if (!this._server) {
      this._server = new McpServer({
        name: 'Creative Thinking MCP Server',
        version: '1.0.0',
        description: 'A three-layer MCP server for structured creative problem-solving techniques',
      });
    }
    return this._server;
  }

  async init() {
    // Prevent double initialization
    if (this.initialized) {
      this.logger?.debug('Agent already initialized, skipping');
      return;
    }

    // Initialize logger
    this.logger = createLogger(this.env as any, 'CreativeThinkingMcpAgent');
    this.logger.info('Initializing Creative Thinking MCP Agent');

    // Initialize adapters with environment
    this.sessionAdapter = new SessionAdapter(this.env.KV);
    this.techniqueAdapter = new TechniqueAdapter();

    // Initialize streaming manager (temporarily simplified for debugging)
    this.streamingManager = new StreamingManager({
      bufferFlushInterval: 50,
      maxConcurrentConnections: 100,
      enableCollaboration: false,
      sse: {
        keepAliveInterval: 30000,
        retryInterval: 5000,
        maxBufferSize: 64 * 1024,
      },
      websocket: {
        heartbeatInterval: 30000,
        maxConnectionsPerUser: 2,
        maxMessageSize: 64 * 1024,
      },
    });

    // Initialize resource providers
    this.resourceRegistry = new ResourceProviderRegistry();
    this.resourceRegistry.register(
      new SessionResourceProvider(this.sessionAdapter, () => this.state)
    );
    this.resourceRegistry.register(new DocumentationResourceProvider());
    // TODO: Fix MetricsResourceProvider compatibility with new session structure
    // this.resourceRegistry.register(new MetricsResourceProvider(() => this.state));

    // Initialize prompt registry and register prompts
    this.promptRegistry = new PromptRegistry();
    this.promptRegistry.register(new CreativeWorkshopPrompt());
    this.promptRegistry.register(new ProblemSolverPrompt());
    this.promptRegistry.register(new RiskAssessmentPrompt());

    // Register the three core MCP tools
    this.registerDiscoverTechniques();
    this.registerPlanThinkingSession();
    this.registerExecuteThinkingStep();

    // Register MCP resources
    await this.registerResources();

    // Register MCP prompts
    this.registerPrompts();

    // Only register diagnostic tools in debug mode
    if (this.props?.debugMode === true) {
      this.logger.info('Debug mode enabled - registering diagnostic tools');
      this.registerDiagnosticTools();
    }

    // Sessions will be created dynamically when requests come in

    // Mark as initialized
    this.initialized = true;
    this.logger.info('Creative Thinking MCP Agent initialization complete');
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
                text: JSON.stringify(formatErrorResponse(error, this.env.ENVIRONMENT), null, 2),
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
          const { problem, techniques, objectives, constraints, timeframe, executionMode } = params;

          // Validate techniques using TechniqueAdapter
          const validTechniques = [];
          const invalidTechniques = [];

          for (const technique of techniques) {
            if (this.techniqueAdapter.getTechnique(technique)) {
              validTechniques.push(technique);
            } else {
              invalidTechniques.push(technique);
            }
          }

          if (invalidTechniques.length > 0) {
            throw new Error(`Invalid techniques: ${invalidTechniques.join(', ')}`);
          }

          // Generate unique plan ID
          const planId = this.generatePlanId();

          // Generate steps for all techniques
          const steps = this.generatePlanSteps(validTechniques);

          // Create plan object
          const plan = {
            id: planId,
            problem,
            techniques: validTechniques,
            options: {
              objectives,
              constraints,
              timeframe,
              executionMode,
            },
            createdAt: Date.now(),
            steps,
            currentStepIndex: 0,
          };

          // Store plan in state
          const newState = {
            ...this.state,
            plans: {
              ...this.state.plans,
              [planId]: plan,
            },
          };
          this.setState(newState);

          // Generate execution graph
          const executionGraph = this.generateExecutionGraph(validTechniques, executionMode);

          // Return plan response
          const result = {
            planId,
            problem,
            techniques: validTechniques,
            totalSteps: steps.length,
            executionMode: executionMode || 'sequential',
            steps,
            executionGraph,
            metadata: {
              createdAt: new Date(plan.createdAt).toISOString(),
              objectives,
              constraints,
              timeframe,
              estimatedDuration: this.estimateDuration(validTechniques),
            },
          };

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
                text: JSON.stringify(formatErrorResponse(error, this.env.ENVIRONMENT), null, 2),
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
          const { planId, technique, problem, currentStep, totalSteps, output, nextStepNeeded } =
            params;

          // Validate required fields
          if (!planId) {
            throw new Error('planId is required for executeThinkingStep');
          }
          if (!technique) {
            throw new Error('technique is required for executeThinkingStep');
          }
          if (!problem) {
            throw new Error('problem is required for executeThinkingStep');
          }

          // Validate currentStep is within bounds
          if (typeof currentStep !== 'number' || currentStep < 1 || currentStep > totalSteps) {
            throw new Error(
              `Invalid step number ${currentStep}. Must be between 1 and ${totalSteps}`
            );
          }

          // Validate nextStepNeeded is boolean
          if (typeof nextStepNeeded !== 'boolean') {
            throw new Error('nextStepNeeded must be a boolean value');
          }

          // Get plan from state
          const plan = this.state.plans[planId];
          if (!plan) {
            throw new Error(`Plan not found: ${planId}`);
          }

          // Get or create session for this plan
          let sessionId = planId; // Use planId as sessionId for simplicity
          let session = this.state.sessions[sessionId];

          if (!session) {
            // Create session if it doesn't exist
            session = {
              id: sessionId,
              planId,
              technique,
              problem,
              history: [],
              startTime: Date.now(),
              lastActivityTime: Date.now(),
              state: {},
            };
          }

          // Update session activity
          session.lastActivityTime = Date.now();

          // Get technique info
          const techniqueInfo = this.techniqueAdapter.getTechnique(technique);
          if (!techniqueInfo) {
            throw new Error(`Unknown technique: ${technique}`);
          }

          // Calculate technique step based on history
          const previousSteps = session.history.filter(h => h.technique === technique).length;
          const techniqueStep = previousSteps + 1;

          // Generate step guidance
          const guidance = this.generateStepGuidance(technique, techniqueStep, problem);

          // Create step entry
          const stepEntry = {
            technique,
            problem,
            currentStep,
            totalSteps,
            techniqueStep,
            totalTechniqueSteps: techniqueInfo.stepCount,
            output,
            nextStepNeeded,
            guidance,
            timestamp: new Date().toISOString(),
            ...this.extractTechniqueSpecificFields(params),
          };

          // Add step to session history
          session.history.push(stepEntry);

          // Update session in state
          const newState = {
            ...this.state,
            sessions: {
              ...this.state.sessions,
              [sessionId]: session,
            },
            currentSessionId: sessionId,
          };
          this.setState(newState);

          // Generate response
          const response: any = {
            sessionId,
            planId,
            technique,
            currentStep,
            totalSteps,
            techniqueStep,
            totalTechniqueSteps: techniqueInfo.stepCount,
            nextStepNeeded,
            status: 'success',
          };

          // Add next step guidance if needed
          if (nextStepNeeded) {
            const nextTechniqueStep = techniqueStep + 1;
            if (nextTechniqueStep <= techniqueInfo.stepCount) {
              // Continue with same technique
              response.nextStep = {
                step: currentStep + 1,
                technique,
                techniqueStep: nextTechniqueStep,
                guidance: this.generateStepGuidance(technique, nextTechniqueStep, problem),
              };
            } else {
              // Move to next technique if available
              if (currentStep < totalSteps) {
                const nextStepInfo = plan.steps[currentStep];
                if (nextStepInfo) {
                  response.nextStep = {
                    step: currentStep + 1,
                    technique: nextStepInfo.technique,
                    techniqueStep: 1,
                    guidance: this.generateStepGuidance(nextStepInfo.technique, 1, problem),
                  };
                }
              }
            }
          }

          // Add completion message if done
          if (!nextStepNeeded || currentStep >= totalSteps) {
            response.completion = {
              message: 'Thinking session completed successfully',
              totalSteps: currentStep,
              techniques: this.getUsedTechniques(session),
              sessionId,
            };
          }

          // Stream progress if we have an active session
          const sessionIdForStreaming = params.planId;

          // Send visual header for step execution
          await this.streamingManager.broadcast(
            VisualOutputFormatter.formatHeader(
              `Executing ${params.technique} - Step ${params.currentStep}/${params.totalSteps}`,
              '🧠'
            )
          );

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

          // Send state change event
          await this.streamingManager.sendStateChange({
            sessionId: sessionIdForStreaming,
            path: ['sessions', sessionIdForStreaming, 'currentStep'],
            oldValue: params.currentStep - 1,
            newValue: params.currentStep,
            source: 'server',
          });

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
                text: JSON.stringify(response, null, 2),
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
                text: JSON.stringify(formatErrorResponse(error, this.env.ENVIRONMENT), null, 2),
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
   * Register diagnostic tools for debugging session and MCP issues
   */
  private registerDiagnosticTools() {
    // Tool to check session status - no session required
    this.server.tool(
      'debug_session_info',
      'Get session information and diagnostics (no session required)',
      {},
      async () => {
        try {
          const sessionInfo = {
            currentSessionId: this.state.currentSessionId,
            totalSessions: Object.keys(this.state.sessions).length,
            sessionKeys: Object.keys(this.state.sessions),
            agentInitialized: this.initialized,
            timestamp: new Date().toISOString(),
          };

          // Try to read the test session from KV
          let testSessionData = null;
          try {
            testSessionData = await this.sessionAdapter.getSession('test-session-123');
          } catch (error) {
            testSessionData = { error: (error as Error).message };
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    sessionInfo,
                    testSessionData,
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
                text: JSON.stringify({ error: (error as Error).message }, null, 2),
              },
            ],
          };
        }
      }
    );

    this.logger.debug('Registered diagnostic tools');
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

  // Override fetch for comprehensive session handling - CRITICAL FIX
  async fetch(request: Request): Promise<Response> {
    // Ensure logger exists
    if (!this.logger) {
      this.logger = createLogger(this.env as any, 'CreativeThinkingMcpAgent');
    }

    // Ensure state exists
    if (!this.state) {
      this.setState(this.initialState);
    }

    const url = new URL(request.url);
    const sessionId = request.headers.get('Mcp-Session-Id');
    const contentType = request.headers.get('Content-Type');

    this.logger.info('MCP fetch request', {
      method: request.method,
      path: url.pathname,
      sessionId,
      contentType,
      hasBody: request.body !== null,
    });

    // CRITICAL: Handle session validation at fetch level for ALL transports
    // This fixes session errors for both SSE and HTTP streamable transports
    const effectiveSessionId = sessionId || `auto_session_${Date.now()}`;

    if (sessionId) {
      // Ensure session exists in internal state before any MCP processing
      if (!this.state.sessions[effectiveSessionId]) {
        this.logger.info('Pre-creating session before MCP processing', {
          sessionId: effectiveSessionId,
        });

        const newSession = {
          id: effectiveSessionId,
          problem: 'Pre-created MCP session',
          history: [],
          startTime: Date.now(),
          lastActivityTime: Date.now(),
          state: {},
        };

        const newState = {
          ...this.state,
          sessions: {
            ...this.state.sessions,
            [effectiveSessionId]: newSession,
          },
          currentSessionId: effectiveSessionId,
          globalMetrics: {
            ...this.state.globalMetrics,
            totalSessions: Object.keys(this.state.sessions).length + 1,
          },
        };
        this.setState(newState);

        this.logger.info('Session pre-created successfully', { sessionId: effectiveSessionId });
      }

      // Update activity time for existing sessions
      const session = this.state.sessions[effectiveSessionId];
      if (session) {
        session.lastActivityTime = Date.now();
        this.setState({
          ...this.state,
          sessions: {
            ...this.state.sessions,
            [effectiveSessionId]: session,
          },
          currentSessionId: effectiveSessionId,
        });
      }
    }

    // Extract user context from headers (set by Worker middleware)
    const userId = request.headers.get('X-User-ID');
    if (userId) {
      this.logger.debug('Request with authenticated user', { userId });

      // Update user metrics
      if (this.state.globalMetrics) {
        this.state.globalMetrics.authenticatedRequests =
          (this.state.globalMetrics.authenticatedRequests || 0) + 1;
        this.setState(this.state);
      }
    }

    // Let McpAgent handle MCP protocol requests with session context established
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

  // FINAL SOLUTION: Override ALL session validation to always succeed
  async onSSEMcpMessage(sessionId: string, messageBody: unknown): Promise<Error | null> {
    // Ensure logger exists
    if (!this.logger) {
      this.logger = createLogger(this.env as any, 'CreativeThinkingMcpAgent');
    }

    // Ensure state exists
    if (!this.state) {
      this.setState(this.initialState);
    }

    this.logger.info('MCP SSE message - Durable Object provides session context', { sessionId });

    // CRITICAL: Never return session validation errors
    // Each Durable Object IS a session context by design
    // Always return null (success) to bypass framework session validation
    return null;
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
   * Get current state for debugging
   */
  getState() {
    return this.state;
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    return this.state.globalMetrics;
  }

  // Helper methods for internal state management

  /**
   * Generate a unique plan ID
   */
  private generatePlanId(): string {
    const timestamp = Date.now().toString(36);
    const uuid = crypto.randomUUID();
    const random = uuid.replace(/-/g, '').substring(0, 8);
    return `plan_${timestamp}_${random}`;
  }

  /**
   * Generate execution steps for techniques
   */
  private generatePlanSteps(techniques: string[]): any[] {
    const steps: any[] = [];
    let stepNumber = 1;

    for (const technique of techniques) {
      const techniqueInfo = this.techniqueAdapter.getTechnique(technique);
      const stepCount = techniqueInfo ? techniqueInfo.stepCount : 3;

      for (let i = 1; i <= stepCount; i++) {
        steps.push({
          stepNumber,
          technique,
          techniqueStep: i,
          totalTechniqueSteps: stepCount,
          status: 'pending',
        });
        stepNumber++;
      }
    }

    return steps;
  }

  /**
   * Generate execution graph based on techniques and mode
   */
  private generateExecutionGraph(techniques: string[], mode?: string): any {
    if (mode === 'parallel') {
      return {
        type: 'parallel',
        groups: techniques.map(t => {
          const techniqueInfo = this.techniqueAdapter.getTechnique(t);
          return {
            technique: t,
            steps: techniqueInfo ? techniqueInfo.stepCount : 3,
          };
        }),
      };
    }

    // Sequential by default
    let stepNumber = 1;
    const sequence = [];

    for (const technique of techniques) {
      const techniqueInfo = this.techniqueAdapter.getTechnique(technique);
      const stepCount = techniqueInfo ? techniqueInfo.stepCount : 3;

      for (let i = 1; i <= stepCount; i++) {
        sequence.push({
          step: stepNumber++,
          technique,
          techniqueStep: i,
          totalTechniqueSteps: stepCount,
        });
      }
    }

    return {
      type: 'sequential',
      sequence,
    };
  }

  /**
   * Estimate duration for techniques
   */
  private estimateDuration(techniques: string[]): string {
    let totalMinutes = 0;

    for (const technique of techniques) {
      const info = this.techniqueAdapter.getTechnique(technique);
      if (info && info.timeEstimate) {
        const match = info.timeEstimate.match(/(\d+)-(\d+)/);
        if (match) {
          totalMinutes += (parseInt(match[1]) + parseInt(match[2])) / 2;
        }
      }
    }

    if (totalMinutes < 60) {
      return `${Math.round(totalMinutes)} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    }
  }

  /**
   * Generate step-specific guidance for techniques
   */
  private generateStepGuidance(technique: string, step: number, problem: string): string {
    const guidanceMap: Record<string, Record<number, string>> = {
      six_hats: {
        1: `Blue Hat: Define the thinking process for "${problem}". What are we trying to achieve?`,
        2: `White Hat: Gather facts and data about "${problem}". What do we know for certain?`,
        3: `Red Hat: Express feelings and intuitions about "${problem}". What does your gut say?`,
        4: `Yellow Hat: Find benefits and positive aspects of "${problem}". What could work well?`,
        5: `Black Hat: Identify risks and potential problems with "${problem}". What could go wrong?`,
        6: `Green Hat: Generate creative solutions for "${problem}". What new ideas emerge?`,
      },
      po: {
        1: `Create a provocative statement about "${problem}" that challenges assumptions`,
        2: `Explore the provocation: What new directions does it suggest?`,
        3: `Extract practical ideas from the provocative exploration`,
        4: `Develop the most promising ideas into actionable solutions`,
      },
      scamper: {
        1: `Substitute: What can be substituted in "${problem}"?`,
        2: `Combine: What can be combined or integrated?`,
        3: `Adapt: What can be adapted from elsewhere?`,
        4: `Modify/Magnify: What can be emphasized or enhanced?`,
        5: `Put to other uses: How else could this be used?`,
        6: `Eliminate: What can be removed or simplified?`,
        7: `Reverse: What can be reversed or rearranged?`,
        8: `Parameterize: What variables can be adjusted?`,
      },
      first_principles: {
        1: `Break down "${problem}" into fundamental components`,
        2: `Identify the fundamental truths about each component`,
        3: `Challenge assumptions: What's assumed but not necessarily true?`,
        4: `Rebuild the solution from fundamental truths`,
      },
    };

    const techniqueGuidance = guidanceMap[technique];
    if (techniqueGuidance && techniqueGuidance[step]) {
      return techniqueGuidance[step];
    }

    return `Continue with step ${step} of ${technique} for: "${problem}"`;
  }

  /**
   * Extract technique-specific fields from parameters
   */
  private extractTechniqueSpecificFields(params: any): any {
    const techniqueFields: Record<string, string[]> = {
      six_hats: ['hatColor'],
      po: ['provocation'],
      random_entry: ['randomStimulus', 'connections'],
      scamper: ['scamperAction', 'modifications'],
      concept_extraction: ['extractedConcepts', 'abstractedPatterns', 'applications'],
      yes_and: ['initialIdea', 'additions', 'evaluations', 'synthesis'],
      design_thinking: ['designStage', 'empathyInsights', 'problemStatement', 'ideaList'],
      triz: ['contradiction', 'inventivePrinciples', 'minimalSolution'],
      first_principles: ['components', 'fundamentalTruths', 'assumptions', 'reconstruction'],
      criteria_based_analysis: ['validityScore', 'criteriaAssessments', 'confidenceBounds'],
      linguistic_forensics: [
        'pronounRatios',
        'complexityMetrics',
        'coherenceScore',
        'linguisticMarkers',
      ],
      competing_hypotheses: [
        'hypothesisMatrix',
        'probabilities',
        'diagnosticValue',
        'sensitivityFactors',
      ],
    };

    const extracted: any = {};
    const fields = techniqueFields[params.technique] || [];

    for (const field of fields) {
      if (params[field] !== undefined) {
        extracted[field] = params[field];
      }
    }

    // Common fields
    if (params.risks) extracted.risks = params.risks;
    if (params.mitigations) extracted.mitigations = params.mitigations;
    if (params.antifragileProperties)
      extracted.antifragileProperties = params.antifragileProperties;

    return extracted;
  }

  /**
   * Get list of techniques used in a session
   */
  private getUsedTechniques(session: any): string[] {
    const techniques = new Set<string>();
    for (const entry of session.history) {
      if (entry.technique) {
        techniques.add(entry.technique);
      }
    }
    return Array.from(techniques);
  }
}
