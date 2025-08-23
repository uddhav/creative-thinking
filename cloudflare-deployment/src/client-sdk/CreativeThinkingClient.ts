/**
 * Creative Thinking MCP Client
 *
 * Main client class for interacting with the Creative Thinking MCP Server
 */

import type {
  ClientConfig,
  ClientOptions,
  Transport,
  ClientEvents,
  ConnectionState,
  BatchRequest,
  BatchResponse,
  ClientMetrics,
} from './types.js';

import type {
  Technique,
  Session,
  DiscoveryResult,
  PlanningResult,
  ExecutionResult,
  Resource,
  ResourceContent,
  Prompt,
  PromptResult,
  Tool,
  ToolResult,
} from './models.js';

import { HTTPTransport } from './transports/HTTPTransport.js';
import { SSETransport } from './transports/SSETransport.js';
import { WebSocketTransport } from './transports/WebSocketTransport.js';
import { StreamingClient } from './StreamingClient.js';
import { EventEmitter } from './utils/EventEmitter.js';

export class CreativeThinkingClient extends EventEmitter<ClientEvents> {
  private config: ClientConfig;
  private transport: Transport;
  private streaming?: StreamingClient;
  private metrics: ClientMetrics = {
    requestCount: 0,
    successCount: 0,
    errorCount: 0,
    averageLatency: 0,
    bytesReceived: 0,
    bytesSent: 0,
    connectionTime: 0,
    reconnectCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  private latencies: number[] = [];

  constructor(config: ClientConfig) {
    super();
    this.config = this.validateConfig(config);
    this.transport = this.createTransport();

    // Set up streaming if enabled
    if (config.enableStreaming) {
      this.streaming = new StreamingClient(config.serverUrl + '/stream');
      this.setupStreamingEvents();
    }

    // Set up transport events
    this.setupTransportEvents();
  }

  /**
   * Connect to the server
   */
  async connect(): Promise<void> {
    const startTime = Date.now();
    await this.transport.connect();
    this.metrics.connectionTime = Date.now() - startTime;

    if (this.streaming) {
      await this.streaming.connect();
    }

    this.emit('connect');
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.streaming) {
      await this.streaming.disconnect();
    }

    await this.transport.disconnect();
    this.emit('disconnect');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.transport.isConnected();
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return this.transport.getState();
  }

  // ============= Core MCP Tools =============

  /**
   * Discover available techniques for a problem
   */
  async discoverTechniques(
    problem: string,
    context?: string,
    constraints?: string[],
    options?: ClientOptions
  ): Promise<DiscoveryResult> {
    return this.request(
      'discover_techniques',
      {
        problem,
        context,
        constraints,
      },
      options
    );
  }

  /**
   * Plan a thinking session
   */
  async planThinkingSession(
    problem: string,
    techniques: string[],
    options?: {
      objectives?: string[];
      constraints?: string[];
      timeframe?: 'quick' | 'thorough' | 'comprehensive';
      executionMode?: 'sequential' | 'parallel' | 'auto';
    },
    clientOptions?: ClientOptions
  ): Promise<PlanningResult> {
    return this.request(
      'plan_thinking_session',
      {
        problem,
        techniques,
        ...options,
      },
      clientOptions
    );
  }

  /**
   * Execute a thinking step
   */
  async executeThinkingStep(
    params: {
      planId: string;
      technique: string;
      problem: string;
      currentStep: number;
      totalSteps: number;
      output: string;
      nextStepNeeded: boolean;
      [key: string]: any; // Allow technique-specific fields
    },
    options?: ClientOptions
  ): Promise<ExecutionResult> {
    return this.request('execute_thinking_step', params, options);
  }

  // ============= Session Management =============

  /**
   * Create a new session
   */
  async createSession(problem: string, metadata?: Record<string, any>): Promise<Session> {
    const result = await this.request('create_session', { problem, metadata });
    this.emit('sessionCreated', result.id);
    return result;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session> {
    return this.request('get_session', { sessionId });
  }

  /**
   * List all sessions
   */
  async listSessions(filter?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
  }): Promise<Session[]> {
    return this.request('list_sessions', filter);
  }

  /**
   * Update session
   */
  async updateSession(sessionId: string, update: Partial<Session>): Promise<Session> {
    const result = await this.request('update_session', { sessionId, update });
    this.emit('sessionUpdated', sessionId, update);
    return result;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.request('delete_session', { sessionId });
    this.emit('sessionDeleted', sessionId);
  }

  // ============= Resources =============

  /**
   * List available resources
   */
  async listResources(): Promise<Resource[]> {
    return this.request('resources/list');
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<ResourceContent> {
    return this.request('resources/read', { uri });
  }

  // ============= Prompts =============

  /**
   * List available prompts
   */
  async listPrompts(): Promise<Prompt[]> {
    return this.request('prompts/list');
  }

  /**
   * Get a prompt
   */
  async getPrompt(name: string, args?: Record<string, any>): Promise<PromptResult> {
    return this.request('prompts/get', { name, ...args });
  }

  // ============= Tools =============

  /**
   * List available tools
   */
  async listTools(): Promise<Tool[]> {
    return this.request('tools/list');
  }

  /**
   * Call a tool
   */
  async callTool(name: string, params?: any, options?: ClientOptions): Promise<ToolResult> {
    return this.request(`tools/call/${name}`, params, options);
  }

  // ============= Sampling (AI Enhancement) =============

  /**
   * Check sampling capability
   */
  async getSamplingCapability(): Promise<any> {
    return this.request('sampling_capability');
  }

  /**
   * Enhance an idea with AI
   */
  async enhanceIdea(
    idea: string,
    context?: string,
    options?: {
      style?: 'creative' | 'analytical' | 'practical' | 'innovative';
      depth?: 'shallow' | 'moderate' | 'deep';
      addExamples?: boolean;
      addRisks?: boolean;
    }
  ): Promise<string> {
    return this.request('enhance_idea', {
      idea,
      context,
      ...options,
    });
  }

  /**
   * Generate variations of an idea
   */
  async generateVariations(
    idea: string,
    count?: number,
    style?: 'similar' | 'diverse' | 'opposite'
  ): Promise<string[]> {
    return this.request('generate_variations', {
      idea,
      count,
      style,
    });
  }

  /**
   * Synthesize multiple ideas
   */
  async synthesizeIdeas(ideas: string[], goal?: string): Promise<string> {
    return this.request('synthesize_ideas', {
      ideas,
      goal,
    });
  }

  // ============= Batch Operations =============

  /**
   * Execute batch requests
   */
  async batch(requests: BatchRequest[]): Promise<BatchResponse[]> {
    return this.request('batch', { requests });
  }

  // ============= Streaming =============

  /**
   * Get streaming client
   */
  getStreamingClient(): StreamingClient | undefined {
    return this.streaming;
  }

  /**
   * Subscribe to session updates
   */
  subscribeToSession(sessionId: string): void {
    if (this.streaming) {
      this.streaming.subscribeToSession(sessionId);
    }
  }

  /**
   * Unsubscribe from session updates
   */
  unsubscribeFromSession(sessionId: string): void {
    if (this.streaming) {
      this.streaming.unsubscribeFromSession(sessionId);
    }
  }

  // ============= Metrics =============

  /**
   * Get client metrics
   */
  getMetrics(): ClientMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageLatency: 0,
      bytesReceived: 0,
      bytesSent: 0,
      connectionTime: 0,
      reconnectCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
    this.latencies = [];
  }

  // ============= Private Methods =============

  /**
   * Validate configuration
   */
  private validateConfig(config: ClientConfig): ClientConfig {
    if (!config.serverUrl) {
      throw new Error('serverUrl is required');
    }

    return {
      transport: 'http',
      autoReconnect: true,
      enableStreaming: false,
      enableSampling: false,
      debug: false,
      ...config,
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffFactor: 2,
        ...config.retry,
      },
      timeout: {
        connect: 10000,
        request: 30000,
        idle: 60000,
        ...config.timeout,
      },
    };
  }

  /**
   * Create transport based on config
   */
  private createTransport(): Transport {
    switch (this.config.transport) {
      case 'sse':
        return new SSETransport(this.config);
      case 'websocket':
        return new WebSocketTransport(this.config);
      case 'http':
      default:
        return new HTTPTransport(this.config);
    }
  }

  /**
   * Set up transport events
   */
  private setupTransportEvents(): void {
    this.transport.on('stateChange', state => {
      this.emit('stateChange', state);
    });

    this.transport.on('error', error => {
      this.emit('error', error);
    });

    this.transport.on('reconnect', attempt => {
      this.metrics.reconnectCount++;
      this.emit('reconnect', attempt);
    });
  }

  /**
   * Set up streaming events
   */
  private setupStreamingEvents(): void {
    if (!this.streaming) return;

    this.streaming.on('progress', (event: any) => {
      // Convert streaming progress event to client progress event
      this.emit('progress', {
        operation: event.data?.operation || 'unknown',
        current: event.data?.currentStep || 0,
        total: event.data?.totalSteps || 100,
        percent: event.data?.percentComplete || 0,
        metadata: event.data?.metadata,
      });
    });

    this.streaming.on('warning', (level, message) => {
      this.emit('warning', level, message);
    });

    this.streaming.on('streamingEvent', event => {
      this.emit('streamingEvent', event);
    });
  }

  /**
   * Make a request
   */
  private async request<T = any>(
    method: string,
    params?: any,
    options?: ClientOptions
  ): Promise<T> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      const result = await this.transport.request<T>(method, params, options);

      // Update metrics
      this.metrics.successCount++;
      const latency = Date.now() - startTime;
      this.latencies.push(latency);
      if (this.latencies.length > 100) {
        this.latencies.shift();
      }
      this.metrics.averageLatency =
        this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;

      return result;
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }
}
