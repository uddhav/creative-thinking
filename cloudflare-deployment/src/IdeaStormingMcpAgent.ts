/**
 * Idea Storming MCP Agent
 *
 * A separate MCP agent for AI-powered idea enhancement and generation.
 * This agent is completely independent from the Creative Thinking agent,
 * maintaining clean separation of concerns.
 */

import { McpAgent } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SamplingManager } from './sampling/SamplingManager.js';
import { IdeaEnhancer } from './sampling/features/IdeaEnhancer.js';
import { createLogger, type Logger } from './utils/logger.js';
import { formatErrorResponse } from './utils/errors.js';
import type { ExecutionContext } from '@cloudflare/workers-types';

export interface Props extends Record<string, unknown> {
  userId?: string;
  accessToken?: string;
  debugMode?: boolean;
}

export interface Env {
  KV: KVNamespace;
  AI?: any;
  ENVIRONMENT?: string;
}

export interface IdeaStormingState {
  sessions: Record<string, any>;
  metrics: {
    totalIdeasGenerated: number;
    enhancementRequests: number;
    variationRequests: number;
    synthesisRequests: number;
    samplingRequests: number;
  };
}

export class IdeaStormingMcpAgent extends McpAgent<Env, IdeaStormingState, Props> {
  private samplingManager!: SamplingManager;
  private ideaEnhancer!: IdeaEnhancer;
  private logger!: Logger;
  private initialized: boolean = false;
  private _server: McpServer | null = null;

  // Initial state for the Agent
  initialState: IdeaStormingState = {
    sessions: {},
    metrics: {
      totalIdeasGenerated: 0,
      enhancementRequests: 0,
      variationRequests: 0,
      synthesisRequests: 0,
      samplingRequests: 0,
    },
  };

  // McpAgent requires server to be a property that returns McpServer
  get server(): McpServer {
    if (!this._server) {
      this._server = new McpServer({
        name: 'Idea Storming MCP Server',
        version: '1.0.0',
        description:
          'AI-powered idea enhancement and generation tools for creative problem-solving',
      });
    }
    return this._server;
  }

  async init() {
    // Initialize logger first to ensure it's always available
    if (!this.logger) {
      this.logger = createLogger(this.env as any, 'IdeaStormingMcpAgent');
    }

    // Prevent double initialization
    if (this.initialized) {
      this.logger.debug('Agent already initialized, skipping');
      return;
    }
    this.logger.info('Initializing Idea Storming MCP Agent', {
      debugMode: this.props?.debugMode,
    });

    // Initialize AI components
    this.samplingManager = new SamplingManager();

    // Set sampling capability if AI is available
    if (this.env.AI) {
      this.samplingManager.setCapability({
        supported: true,
        providers: ['cloudflare-ai'],
        maxTokens: 1024,
        defaultPreferences: {
          intelligencePriority: 0.7,
          speedPriority: 0.5,
          costPriority: 0.5,
        },
      });
    }

    // Initialize idea enhancer
    this.ideaEnhancer = new IdeaEnhancer(this.samplingManager);

    // Set up sampling notification handler
    this.samplingManager.setNotificationHandler((notification: any) => {
      this.logger.debug('Sampling notification', notification);
    });

    // Register AI enhancement tools
    this.registerEnhanceIdea();
    this.registerGenerateVariations();
    this.registerSynthesizeIdeas();
    this.registerSamplingCapability();

    // Register debug tools only in debug mode
    if (this.props?.debugMode === true) {
      this.logger.info('Debug mode enabled - registering diagnostic tools');
      this.registerDebugTools();
    }

    // Mark as initialized
    this.initialized = true;
    this.logger.info('Idea Storming MCP Agent initialization complete');
  }

  /**
   * Register tool to check sampling capability
   */
  private registerSamplingCapability() {
    this.server.tool(
      'sampling_capability',
      'Check if AI sampling is available and get capability details',
      {},
      async () => {
        const capability = this.samplingManager.getCapability();
        const stats = this.samplingManager.getStats();

        // Update metrics
        this.state.metrics.samplingRequests++;

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
  }

  /**
   * Register tool to enhance ideas with AI
   */
  private registerEnhanceIdea() {
    this.server.tool(
      'enhance_idea',
      'Enhance a creative idea using AI to add depth, examples, and analysis',
      {
        idea: z.string().describe('The idea to enhance'),
        context: z.string().optional().describe('Additional context about the idea'),
        style: z
          .enum(['creative', 'analytical', 'practical', 'innovative'])
          .optional()
          .describe('Enhancement style'),
        depth: z.enum(['shallow', 'moderate', 'deep']).optional().describe('Level of detail'),
        addExamples: z.boolean().optional().describe('Include practical examples'),
        addRisks: z.boolean().optional().describe('Include risk analysis'),
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
          this.state.metrics.enhancementRequests++;
          this.state.metrics.totalIdeasGenerated++;

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
                text: JSON.stringify(formatErrorResponse(error, this.env.ENVIRONMENT), null, 2),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Register tool to generate idea variations
   */
  private registerGenerateVariations() {
    this.server.tool(
      'generate_variations',
      'Generate multiple variations of an idea',
      {
        idea: z.string().describe('The original idea'),
        count: z.number().min(1).max(10).default(3).describe('Number of variations to generate'),
        style: z
          .enum(['similar', 'diverse', 'opposite'])
          .optional()
          .describe(
            'Variation style - similar keeps close to original, diverse explores broadly, opposite contradicts'
          ),
      },
      async params => {
        try {
          const variations = await this.ideaEnhancer.generateVariations(
            params.idea,
            params.count,
            params.style
          );

          // Update metrics
          this.state.metrics.variationRequests++;
          this.state.metrics.totalIdeasGenerated += variations.length;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    original: params.idea,
                    variations,
                    count: variations.length,
                    style: params.style || 'diverse',
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
                text: JSON.stringify(formatErrorResponse(error, this.env.ENVIRONMENT), null, 2),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Register tool to synthesize multiple ideas
   */
  private registerSynthesizeIdeas() {
    this.server.tool(
      'synthesize_ideas',
      'Combine multiple ideas into a unified solution',
      {
        ideas: z.array(z.string()).min(2).describe('Array of ideas to synthesize'),
        goal: z.string().optional().describe('Overall goal or objective for the synthesis'),
      },
      async params => {
        try {
          const synthesis = await this.ideaEnhancer.synthesizeIdeas(params.ideas, params.goal);

          // Update metrics
          this.state.metrics.synthesisRequests++;
          this.state.metrics.totalIdeasGenerated++;

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
                text: JSON.stringify(formatErrorResponse(error, this.env.ENVIRONMENT), null, 2),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Register debug tools for development
   */
  private registerDebugTools() {
    this.server.tool(
      'debug_idea_metrics',
      'Get metrics and debugging information for idea storming',
      {},
      async () => {
        try {
          const debugInfo = {
            agentInitialized: this.initialized,
            metrics: this.state.metrics,
            samplingAvailable: this.samplingManager.isAvailable(),
            samplingStats: this.samplingManager.getStats(),
            timestamp: new Date().toISOString(),
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(debugInfo, null, 2),
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

  // Override fetch to ensure state initialization
  async fetch(request: Request): Promise<Response> {
    // Ensure logger exists
    if (!this.logger) {
      this.logger = createLogger(this.env as any, 'IdeaStormingMcpAgent');
    }

    // Ensure state exists
    if (!this.state) {
      this.setState(this.initialState);
    }

    const url = new URL(request.url);
    this.logger.info('MCP fetch request', {
      method: request.method,
      path: url.pathname,
    });

    // Call parent fetch
    return super.fetch(request);
  }

  // Lifecycle method
  async onStart(): Promise<void> {
    this.logger.info('Idea Storming MCP Agent started');
    await this.init();
  }
}
