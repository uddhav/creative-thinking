import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SessionAdapter } from './adapters/SessionAdapter.js';
import { TechniqueAdapter } from './adapters/TechniqueAdapter.js';
import { ExecutionAdapter } from './adapters/ExecutionAdapter.js';

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
                text: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                  isError: true,
                }),
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
                text: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                  isError: true,
                }),
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

        // Optional technique-specific fields
        hatColor: z.string().optional(),
        provocation: z.string().optional(),
        randomStimulus: z.string().optional(),
        scamperAction: z.string().optional(),
        principles: z.array(z.string()).optional(),
        connections: z.array(z.string()).optional(),
        extractedConcepts: z.array(z.string()).optional(),
        applications: z.array(z.string()).optional(),
        risks: z.array(z.string()).optional(),
        mitigations: z.array(z.string()).optional(),

        // Many more optional fields for different techniques...
        // We'll add these as needed
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
                text: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                  isError: true,
                }),
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
