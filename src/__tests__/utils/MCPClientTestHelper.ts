/**
 * MCP Client Test Helper
 * Utility class for testing the MCP server using the official MCP Client
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  CallToolRequest,
  CallToolResult,
  ListToolsResult,
  Implementation,
} from '@modelcontextprotocol/sdk/types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MCPClientOptions {
  serverPath?: string;
  clientName?: string;
  clientVersion?: string;
  env?: Record<string, string>;
  stderr?: 'inherit' | 'pipe' | 'ignore';
}

export class MCPClientTestHelper {
  private client: Client;
  private transport?: StdioClientTransport;
  private serverPath: string;
  private stderrData: string[] = [];

  constructor(options: MCPClientOptions = {}) {
    const {
      serverPath = path.join(__dirname, '../../../dist/index.js'),
      clientName = 'test-client',
      clientVersion = '1.0.0',
    } = options;

    this.serverPath = serverPath;

    // Create the MCP client
    this.client = new Client({
      name: clientName,
      version: clientVersion,
    } as Implementation);

    // Set up error handler
    this.client.onerror = error => {
      console.error('MCP Client error:', error);
    };
  }

  /**
   * Connect to the MCP server
   */
  async connect(options: MCPClientOptions = {}): Promise<void> {
    const { env = process.env, stderr = 'pipe' } = options;

    // Create stdio transport
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [this.serverPath],
      env: {
        ...env,
        // Disable visual output for tests
        DISABLE_THOUGHT_LOGGING: 'true',
      },
      stderr,
    });

    // Connect the client to the transport
    await this.client.connect(this.transport);
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<ListToolsResult> {
    return await this.client.listTools();
  }

  /**
   * Call a tool with arguments
   */
  async callTool(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
    const params: CallToolRequest['params'] = {
      name,
      arguments: args,
    };
    const result = await this.client.callTool(params);

    // Check if the result contains an error message
    if (result.content?.[0]?.type === 'text') {
      const text = result.content[0].text;

      // Check for plain text errors
      if (text.includes('❌ ERROR:') || text.startsWith('Error:')) {
        throw new Error(text);
      }

      // Check for JSON errors
      try {
        const parsed = JSON.parse(text);
        if (parsed.error) {
          throw new Error(parsed.error.message || JSON.stringify(parsed.error));
        }
      } catch {
        // Not JSON or no error, continue
      }
    }

    return result;
  }

  /**
   * Helper to call discover_techniques
   */
  async discoverTechniques(
    problem: string,
    context?: string
  ): Promise<{
    recommendations: unknown[];
    availableTechniques: string[];
    [key: string]: unknown;
  }> {
    const result = await this.callTool('discover_techniques', {
      problem,
      ...(context && { context }),
    });

    // Parse the response content
    const content = result.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      // Check if it's an error response
      if (parsed.error) {
        throw new Error(parsed.error.message || JSON.stringify(parsed.error));
      }
      return parsed as {
        recommendations: unknown[];
        availableTechniques: string[];
        [key: string]: unknown;
      };
    }
    throw new Error('Unexpected response format');
  }

  /**
   * Helper to call plan_thinking_session
   */
  async planThinkingSession(
    problem: string,
    techniques: string[],
    objectives?: string[]
  ): Promise<{ planId: string; workflow: unknown[] }> {
    const result = await this.callTool('plan_thinking_session', {
      problem,
      techniques,
      ...(objectives && { objectives }),
    });

    // Parse the response content
    const content = result.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      // Check if it's an error response
      if (parsed.error) {
        throw new Error(parsed.error.message || JSON.stringify(parsed.error));
      }
      return parsed as { planId: string; workflow: unknown[] };
    }
    throw new Error('Unexpected response format');
  }

  /**
   * Helper to call execute_thinking_step
   */
  async executeThinkingStep(params: {
    planId: string;
    technique: string;
    problem: string;
    currentStep: number;
    totalSteps: number;
    output: string;
    nextStepNeeded: boolean;
    [key: string]: unknown;
  }): Promise<{
    sessionId: string;
    technique: string;
    currentStep: number;
    nextStepNeeded: boolean;
    [key: string]: unknown;
  }> {
    const result = await this.callTool('execute_thinking_step', params);

    // Parse the response content
    const content = result.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      // Check if it's an error response
      if (parsed.error) {
        throw new Error(parsed.error.message || JSON.stringify(parsed.error));
      }
      return parsed as {
        sessionId: string;
        technique: string;
        currentStep: number;
        nextStepNeeded: boolean;
        [key: string]: unknown;
      };
    }
    throw new Error('Unexpected response format');
  }

  /**
   * Call multiple tools in parallel (simulating Anthropic format)
   * The Client itself doesn't support parallel calls, but we can test
   * the server's ability to handle them by using Promise.all
   */
  async callToolsInParallel(
    calls: Array<{ name: string; arguments: Record<string, unknown> }>
  ): Promise<CallToolResult[]> {
    // Note: The official MCP Client doesn't directly support parallel tool calls
    // in the Anthropic format. This is a simulation using Promise.all
    const promises = calls.map(call => this.callTool(call.name, call.arguments));
    return await Promise.all(promises);
  }

  /**
   * Get the client instance for advanced operations
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get server capabilities after connection
   */
  getServerCapabilities() {
    return this.client.getServerCapabilities();
  }

  /**
   * Get server version after connection
   */
  getServerVersion() {
    return this.client.getServerVersion();
  }

  /**
   * Helper to extract text content from a tool result
   */
  static extractTextContent(result: CallToolResult): string {
    const content = result.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Expected text content');
  }

  /**
   * Helper to parse JSON from a tool result
   */
  static parseToolResult(result: CallToolResult): unknown {
    const text = MCPClientTestHelper.extractTextContent(result);
    return JSON.parse(text);
  }
}
