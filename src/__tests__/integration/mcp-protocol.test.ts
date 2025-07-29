/**
 * Integration tests for MCP (Model Context Protocol) compliance
 * Tests the server's ability to handle MCP requests/responses correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { LateralThinkingServer } from '../../index.js';

describe('MCP Protocol Compliance', () => {
  let mcpServer: Server;
  let thinkingServer: LateralThinkingServer;

  beforeEach(() => {
    thinkingServer = new LateralThinkingServer();
    mcpServer = new Server(
      {
        name: 'creative-thinking-test',
        version: '0.1.0',
      },
      {
        capabilities: {},
      }
    );

    // Setup handlers from main server
    setupMCPHandlers(mcpServer, thinkingServer);
  });

  describe('tools/list', () => {
    it('should return all three tools', async () => {
      const response = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 1,
      });

      expect(response.result).toBeDefined();
      expect(response.result.tools).toHaveLength(3);

      const toolNames = response.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('discover_techniques');
      expect(toolNames).toContain('plan_thinking_session');
      expect(toolNames).toContain('execute_thinking_step');
    });

    it('should have correct tool schemas', async () => {
      const response = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 2,
      });

      const discoverTool = response.result.tools.find((t: any) => t.name === 'discover_techniques');
      expect(discoverTool.inputSchema.required).toContain('problem');

      const planTool = response.result.tools.find((t: any) => t.name === 'plan_thinking_session');
      expect(planTool.inputSchema.required).toContain('problem');
      expect(planTool.inputSchema.required).toContain('techniques');

      const executeTool = response.result.tools.find(
        (t: any) => t.name === 'execute_thinking_step'
      );
      expect(executeTool.inputSchema.required).toContain('planId');
      expect(executeTool.inputSchema.required).toContain('technique');
    });
  });

  describe('tools/call - discover_techniques', () => {
    it('should discover techniques for a problem', async () => {
      const response = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 3,
        params: {
          name: 'discover_techniques',
          arguments: {
            problem: 'How to improve team communication',
            context: 'Remote team of 20 people',
            preferredOutcome: 'collaborative',
          },
        },
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();

      const result = JSON.parse(response.result.content[0].text);
      expect(result.recommendedTechniques).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.workflow).toBeDefined();
    });

    it('should handle missing required parameters', async () => {
      const response = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 4,
        params: {
          name: 'discover_techniques',
          arguments: {
            // Missing required 'problem' parameter
            context: 'Some context',
          },
        },
      });

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('problem');
    });
  });

  describe('tools/call - complete workflow', () => {
    it('should execute discover -> plan -> execute workflow', async () => {
      // Step 1: Discover techniques
      const discoverResponse = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 5,
        params: {
          name: 'discover_techniques',
          arguments: {
            problem: 'Reduce meeting fatigue',
          },
        },
      });

      const discoverResult = JSON.parse(discoverResponse.result.content[0].text);
      const recommendedTechnique = discoverResult.recommendedTechniques[0];

      // Step 2: Plan session
      const planResponse = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 6,
        params: {
          name: 'plan_thinking_session',
          arguments: {
            problem: 'Reduce meeting fatigue',
            techniques: [recommendedTechnique],
          },
        },
      });

      const planResult = JSON.parse(planResponse.result.content[0].text);
      expect(planResult.planId).toBeDefined();
      expect(planResult.workflow).toBeDefined();

      // Step 3: Execute first step
      const executeResponse = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 7,
        params: {
          name: 'execute_thinking_step',
          arguments: {
            planId: planResult.planId,
            technique: recommendedTechnique,
            problem: 'Reduce meeting fatigue',
            currentStep: 1,
            totalSteps: planResult.workflow[0].totalSteps,
            output: 'Initial analysis of meeting fatigue causes',
            nextStepNeeded: true,
          },
        },
      });

      const executeResult = JSON.parse(executeResponse.result.content[0].text);
      expect(executeResult.sessionId).toBeDefined();
      expect(executeResult.nextStepNeeded).toBe(true);
      expect(executeResult.currentStep).toBe(1);
    });
  });

  describe('Protocol Error Handling', () => {
    it('should handle unknown tool names', async () => {
      const response = await simulateMCPRequest(mcpServer, {
        jsonrpc: '2.0',
        method: 'tools/call',
        id: 8,
        params: {
          name: 'unknown_tool',
          arguments: {},
        },
      });

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('Unknown tool');
    });

    it('should handle malformed JSON-RPC requests', async () => {
      const response = await simulateMCPRequest(mcpServer, {
        // Missing jsonrpc version
        method: 'tools/call',
        id: 9,
        params: {},
      } as any);

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32600); // Invalid Request
    });
  });
});

// Helper function to simulate MCP request/response
async function simulateMCPRequest(server: Server, request: any): Promise<any> {
  // The server's handleMessage method expects to be called with proper context
  // We'll directly call the appropriate handler based on the request method

  if (request.method === 'tools/list') {
    const handler = (server as any)._requestHandlers.get(ListToolsRequestSchema);
    if (handler) {
      const result = await handler(request);
      return { result, jsonrpc: '2.0', id: request.id };
    }
  } else if (request.method === 'tools/call') {
    const handler = (server as any)._requestHandlers.get(CallToolRequestSchema);
    if (handler) {
      try {
        const result = await handler(request);
        return { result, jsonrpc: '2.0', id: request.id };
      } catch (error: any) {
        return {
          error: {
            code: -32603,
            message: error.message || 'Internal error',
          },
          jsonrpc: '2.0',
          id: request.id,
        };
      }
    }
  }

  return {
    error: {
      code: -32601,
      message: `Method not found: ${request.method}`,
    },
    jsonrpc: '2.0',
    id: request.id,
  };
}

// Setup MCP handlers (mirrors main server setup)
function setupMCPHandlers(mcpServer: Server, thinkingServer: LateralThinkingServer): void {
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'discover_techniques',
          description:
            'Analyzes your problem and recommends the most suitable creative thinking techniques',
          inputSchema: {
            type: 'object',
            properties: {
              problem: {
                type: 'string',
                description: 'The problem or challenge you want to solve',
              },
              context: { type: 'string', description: 'Additional context about the situation' },
              preferredOutcome: {
                type: 'string',
                enum: ['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'],
                description: 'The type of solution you prefer',
              },
              constraints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Any constraints or limitations to consider',
              },
            },
            required: ['problem'],
          },
        },
        {
          name: 'plan_thinking_session',
          description:
            'Creates a structured workflow for applying one or more creative thinking techniques',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to solve' },
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
        },
        {
          name: 'execute_thinking_step',
          description: 'Executes a single step in your creative thinking process',
          inputSchema: {
            type: 'object',
            properties: {
              planId: { type: 'string', description: 'ID from plan_thinking_session' },
              technique: {
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
                ],
                description: 'The lateral thinking technique to use',
              },
              problem: { type: 'string', description: 'The problem or challenge to address' },
              currentStep: {
                type: 'number',
                minimum: 1,
                description: 'Current step number in the technique',
              },
              totalSteps: {
                type: 'number',
                minimum: 1,
                description: 'Total steps for this technique',
              },
              output: { type: 'string', description: 'Your creative output for this step' },
              nextStepNeeded: {
                type: 'boolean',
                description: 'Whether another step is needed',
              },
              // ... other fields omitted for brevity
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
        },
      ],
    };
  });

  mcpServer.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        case 'discover_techniques':
          if (!args.problem) {
            throw new Error('Missing required parameter: problem');
          }
          result = await thinkingServer.discoverTechniques(args);
          break;

        case 'plan_thinking_session':
          if (!args.problem || !args.techniques) {
            throw new Error('Missing required parameters: problem and/or techniques');
          }
          result = await thinkingServer.planThinkingSession(args);
          break;

        case 'execute_thinking_step':
          if (
            !args.planId ||
            !args.technique ||
            !args.problem ||
            args.currentStep === undefined ||
            args.totalSteps === undefined ||
            !args.output ||
            args.nextStepNeeded === undefined
          ) {
            throw new Error('Missing required parameters');
          }
          result = await thinkingServer.executeThinkingStep(args);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              result.content?.[0]?.text ? JSON.parse(result.content[0].text) : result
            ),
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  });
}
