import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SessionAdapter } from './adapters/SessionAdapter.js';
import { TechniqueAdapter } from './adapters/TechniqueAdapter.js';
import { ExecutionAdapter } from './adapters/ExecutionAdapter.js';
import { formatErrorResponse } from './utils/errors.js';

export interface Props {
  userId?: string;
  accessToken?: string;
}

export interface Env {
  KV: KVNamespace;
  AI?: any;
}

export class CreativeThinkingMcpAgent extends McpAgent<Props, Env> {
  private sessionAdapter!: SessionAdapter;
  private techniqueAdapter!: TechniqueAdapter;
  private executionAdapter!: ExecutionAdapter;

  server = new McpServer({
    name: 'Creative Thinking MCP Server',
    version: '1.0.0',
    description: 'A three-layer MCP server for structured creative problem-solving techniques',
  });

  async init() {
    // Initialize adapters with environment
    this.sessionAdapter = new SessionAdapter(this.env.KV);
    this.techniqueAdapter = new TechniqueAdapter();
    this.executionAdapter = new ExecutionAdapter(this.sessionAdapter, this.techniqueAdapter);

    // Register the three core MCP tools
    this.registerDiscoverTechniques();
    this.registerPlanThinkingSession();
    this.registerExecuteThinkingStep();
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
          const result = await this.executionAdapter.executeThinkingStep(params);
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

  // WebSocket handlers for real-time communication
  async onConnect(connection: any, ctx: any) {
    console.log(`Client connected: ${connection.id}`);
    // Accept the connection
    connection.accept();

    // Send initial state if needed
    connection.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to Creative Thinking MCP Server',
        version: '1.0.0',
      })
    );
  }

  async onMessage(connection: any, message: string | ArrayBuffer) {
    // Handle incoming WebSocket messages
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message);

        // Handle different message types
        if (data.type === 'ping') {
          connection.send(JSON.stringify({ type: 'pong' }));
        } else if (data.type === 'progress') {
          // Stream progress updates during long operations
          connection.send(
            JSON.stringify({
              type: 'progress',
              data: data,
            })
          );
        }
      } catch (error) {
        connection.send(
          JSON.stringify({
            type: 'error',
            message: 'Invalid message format',
          })
        );
      }
    }
  }

  async onClose(connection: any, code: number, reason: string) {
    console.log(`Client disconnected: ${connection.id}, code: ${code}, reason: ${reason}`);
  }

  async onError(connection: any, error: Error) {
    console.error(`WebSocket error for ${connection.id}:`, error);
  }
}
