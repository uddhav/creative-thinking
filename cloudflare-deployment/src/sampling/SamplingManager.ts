/**
 * Sampling Manager for Cloudflare Workers
 *
 * Functional implementation that bridges server-side sampling requests to:
 *   1. MCP Sampling via `server.createMessage()` on the underlying
 *      `@modelcontextprotocol/sdk` Server exposed by `agents/mcp` McpAgent.
 *   2. Cloudflare Workers AI (`env.AI.run(...)`) as a fallback when the
 *      connected MCP client does not advertise the `sampling` capability.
 *
 * This replaces the previous DIY pending-promise stub which was never wired
 * to a transport and always timed out in production.
 *
 * Usage:
 *   const sm = new SamplingManager({ server: () => this.server, ai: this.env.AI });
 *   await sm.refreshCapability();
 *   const result = await sm.requestSampling({ messages, maxTokens: 400 });
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger as platformLogger } from '../utils/logger.js';
import type {
  SamplingRequest,
  SamplingResult,
  SamplingError,
  SamplingCapability,
  SamplingStats,
  SamplingNotification,
} from './types.js';

/**
 * Default Workers AI model used for fallback sampling. Chosen for balance
 * of quality and latency; can be overridden per-request via model hints.
 */
const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct';

/**
 * Minimum `maxTokens` accepted by the MCP SDK schema for sampling
 * (the field is required on the wire).
 */
const DEFAULT_MAX_TOKENS = 512;

/**
 * Timeout for a single sampling round-trip. Workers allow up to 5 minutes
 * of wall-clock time on paid plans with streamable HTTP; 30s is a safe
 * default for most client-side LLM calls.
 */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Options passed to the sampling manager constructor.
 */
export interface SamplingManagerOptions {
  /**
   * Lazy accessor for the underlying MCP SDK server instance. The accessor
   * pattern avoids binding order issues: `this.server` on McpAgent may be
   * a Promise during init, so we defer resolution until the first call.
   */
  server?: () => Promise<Server | McpServer> | Server | McpServer | undefined;

  /**
   * Optional Workers AI binding. When provided, acts as a fallback when
   * the client has no `sampling` capability.
   */
  ai?: Ai;

  /**
   * Override the default Workers AI model.
   */
  aiModel?: string;

  /**
   * Override the request timeout.
   */
  timeoutMs?: number;
}

/**
 * Functional MCP Sampling manager backed by the SDK server + Workers AI.
 */
export class SamplingManager {
  private options: SamplingManagerOptions;
  private capability: SamplingCapability | null = null;
  private stats: SamplingStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalTokensUsed: 0,
    averageResponseTime: 0,
    requestsByFeature: {},
  };
  private requestTimes: number[] = [];
  private notificationHandler?: (notification: SamplingNotification) => void;
  private readonly logger = platformLogger;

  constructor(options: SamplingManagerOptions = {}) {
    this.options = options;
  }

  /**
   * Reconcile the capability flag with the connected client's declared
   * capabilities. Should be called after the client initialize handshake.
   */
  async refreshCapability(): Promise<SamplingCapability> {
    let clientHasSampling = false;
    try {
      const inner = await this.resolveInnerServer();
      if (inner) {
        const caps = inner.getClientCapabilities();
        clientHasSampling = caps?.sampling !== undefined;
      }
    } catch (err) {
      this.logger.debug('Failed to read client capabilities', err);
    }

    const hasAi = !!this.options.ai;

    this.capability = {
      supported: clientHasSampling || hasAi,
      providers: [
        ...(clientHasSampling ? ['mcp-sampling'] : []),
        ...(hasAi ? ['cloudflare-ai'] : []),
      ],
      maxTokens: 2048,
    };

    return this.capability;
  }

  /**
   * Manual capability override, useful for tests or forced configuration.
   */
  setCapability(capability: SamplingCapability): void {
    this.capability = capability;
  }

  /**
   * Returns the current capability snapshot.
   */
  getCapability(): SamplingCapability | null {
    return this.capability;
  }

  /**
   * True when *either* MCP client sampling or Workers AI fallback is
   * available. `NLPService` uses this as a gate before making requests.
   */
  isAvailable(): boolean {
    if (this.capability) return this.capability.supported;
    // Optimistic: Workers AI binding alone is sufficient, even before
    // `refreshCapability()` has been called.
    return !!this.options.ai;
  }

  /**
   * Register a notification handler for request lifecycle events.
   */
  setNotificationHandler(handler: (notification: SamplingNotification) => void): void {
    this.notificationHandler = handler;
  }

  /**
   * Execute a sampling request, preferring MCP client sampling and
   * falling back to Workers AI.
   *
   * @param request - The sampling request.
   * @param feature - Optional feature tag for stats.
   */
  async requestSampling(request: SamplingRequest, feature?: string): Promise<SamplingResult> {
    this.validateRequest(request);

    this.stats.totalRequests++;
    if (feature) {
      this.stats.requestsByFeature[feature] = (this.stats.requestsByFeature[feature] || 0) + 1;
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    this.sendNotification({
      type: 'started',
      requestId,
      timestamp: startTime,
      data: { feature, messages: request.messages.length },
    });

    try {
      // Prefer MCP client sampling when available
      let result: SamplingResult | null = null;
      let lastError: unknown;

      const clientSupports = this.capability?.providers?.includes('mcp-sampling') ?? false;
      if (clientSupports) {
        try {
          result = await this.requestViaMcpSampling(request);
        } catch (err) {
          lastError = err;
          this.logger.debug('MCP sampling failed, will try fallback', err);
        }
      }

      // Fall back to Workers AI
      if (!result && this.options.ai) {
        try {
          result = await this.requestViaWorkersAi(request);
        } catch (err) {
          lastError = err;
          this.logger.debug('Workers AI fallback failed', err);
        }
      }

      if (!result) {
        throw (
          lastError ??
          this.makeError('model_not_available', 'No sampling backend available for request')
        );
      }

      this.updateSuccessStats(startTime, result);
      this.sendNotification({
        type: 'completed',
        requestId,
        timestamp: Date.now(),
        data: { length: result.content.length },
      });

      return result;
    } catch (error) {
      this.stats.failedRequests++;
      this.sendNotification({
        type: 'failed',
        requestId,
        timestamp: Date.now(),
        data: { error: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  /**
   * Dispatch a sampling request through the MCP SDK server → client.
   */
  private async requestViaMcpSampling(request: SamplingRequest): Promise<SamplingResult> {
    const inner = await this.resolveInnerServer();
    if (!inner) {
      throw this.makeError('model_not_available', 'MCP server not ready for sampling');
    }

    // Convert our SamplingRequest shape to MCP SDK's CreateMessageRequest params.
    // Messages must have role 'user' or 'assistant' on the wire — 'system' is
    // hoisted to `systemPrompt`.
    const systemMessages = request.messages.filter(m => m.role === 'system');
    const convoMessages = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: { type: 'text' as const, text: m.content },
      }));

    const systemPrompt =
      request.systemPrompt ??
      (systemMessages.length > 0 ? systemMessages.map(m => m.content).join('\n\n') : undefined);

    const params = {
      messages: convoMessages,
      maxTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(systemPrompt !== undefined ? { systemPrompt } : {}),
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
      ...(request.stopSequences !== undefined ? { stopSequences: request.stopSequences } : {}),
      ...(request.modelPreferences !== undefined
        ? { modelPreferences: this.adaptModelPreferences(request.modelPreferences) }
        : {}),
      ...(request.includeContext !== undefined ? { includeContext: request.includeContext } : {}),
    };

    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    const response = await inner.createMessage(params, { timeout: timeoutMs });

    // Extract text from the SDK's content block shape. For non-tool
    // responses, content is a single block (not an array).
    const block = (response.content ?? null) as
      | { type: string; text?: string }
      | Array<{ type: string; text?: string }>
      | null;

    let text = '';
    if (block) {
      if (Array.isArray(block)) {
        text = block
          .filter(b => b.type === 'text')
          .map(b => b.text ?? '')
          .join('\n');
      } else if (block.type === 'text') {
        text = block.text ?? '';
      }
    }

    return {
      content: text,
      text,
      model: {
        modelId: response.model,
        provider: 'mcp-sampling',
      },
      role: (response.role as 'user' | 'assistant' | 'system' | undefined) ?? 'assistant',
    };
  }

  /**
   * Fallback path: call Cloudflare Workers AI directly.
   * Used when the MCP client does not advertise `sampling` capability.
   */
  private async requestViaWorkersAi(request: SamplingRequest): Promise<SamplingResult> {
    const ai = this.options.ai;
    if (!ai) {
      throw this.makeError('model_not_available', 'Workers AI binding not configured');
    }

    const model = this.options.aiModel ?? DEFAULT_WORKERS_AI_MODEL;

    // Workers AI accepts the same role/content shape, including 'system'.
    const messages = request.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // If a separate systemPrompt is provided, prepend it.
    if (request.systemPrompt) {
      messages.unshift({ role: 'system', content: request.systemPrompt });
    }

    const input = {
      messages,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
    };

    // `ai.run` is typed as `unknown` across many model names in the
    // workers-types package; cast to a structural type we can consume.
    const runResponse = (await (
      ai as unknown as {
        run: (
          model: string,
          input: Record<string, unknown>
        ) => Promise<{ response?: string } | Record<string, unknown>>;
      }
    ).run(model, input)) as { response?: string };

    const text = runResponse.response ?? '';

    return {
      content: text,
      text,
      model: {
        modelId: model,
        provider: 'cloudflare-ai',
      },
      role: 'assistant',
    };
  }

  // ---- helpers ----

  /**
   * Resolve the underlying MCP SDK `Server` instance, unwrapping the
   * `McpServer` wrapper if necessary. Returns `undefined` if no server
   * accessor was provided.
   */
  private async resolveInnerServer(): Promise<Server | undefined> {
    const accessor = this.options.server;
    if (!accessor) return undefined;
    const value = accessor();
    if (!value) return undefined;
    const resolved = value instanceof Promise ? await value : value;
    if (!resolved) return undefined;
    // `McpServer` exposes the underlying `Server` via a `server` property.
    // Plain `Server` instances have `createMessage` directly.
    if ('server' in resolved && (resolved as McpServer).server) {
      return (resolved as McpServer).server;
    }
    if ('createMessage' in resolved) {
      return resolved as Server;
    }
    return undefined;
  }

  private adaptModelPreferences(prefs: {
    costPriority?: number;
    speedPriority?: number;
    intelligencePriority?: number;
    hints?: string[];
  }): {
    costPriority?: number;
    speedPriority?: number;
    intelligencePriority?: number;
    hints?: Array<{ name?: string }>;
  } {
    return {
      ...(prefs.costPriority !== undefined ? { costPriority: prefs.costPriority } : {}),
      ...(prefs.speedPriority !== undefined ? { speedPriority: prefs.speedPriority } : {}),
      ...(prefs.intelligencePriority !== undefined
        ? { intelligencePriority: prefs.intelligencePriority }
        : {}),
      ...(prefs.hints !== undefined ? { hints: prefs.hints.map(h => ({ name: h })) } : {}),
    };
  }

  private validateRequest(request: SamplingRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw this.makeError('invalid_request', 'Messages array cannot be empty');
    }
    for (const m of request.messages) {
      if (!m.role || typeof m.content !== 'string') {
        throw this.makeError('invalid_request', 'Each message must have role and string content');
      }
      if (!['system', 'user', 'assistant'].includes(m.role)) {
        throw this.makeError('invalid_request', `Invalid role: ${m.role}`);
      }
    }
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 1)) {
      throw this.makeError('invalid_request', 'Temperature must be between 0 and 1');
    }
    if (request.maxTokens !== undefined && request.maxTokens <= 0) {
      throw this.makeError('invalid_request', 'maxTokens must be positive');
    }
  }

  private updateSuccessStats(startTime: number, _result: SamplingResult): void {
    this.stats.successfulRequests++;
    const elapsed = Date.now() - startTime;
    this.requestTimes.push(elapsed);
    if (this.requestTimes.length > 100) this.requestTimes.shift();
    this.stats.averageResponseTime =
      this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
  }

  private makeError(code: string, message: string, details?: Record<string, unknown>): Error {
    const err: SamplingError = { code, message, details };
    const e = new Error(message) as Error & { samplingError: SamplingError };
    e.samplingError = err;
    return e;
  }

  private sendNotification(notification: SamplingNotification): void {
    if (this.notificationHandler) {
      try {
        this.notificationHandler(notification);
      } catch {
        // Swallow — notifications are best-effort.
      }
    }
  }

  /**
   * Get current sampling statistics.
   */
  getStats(): SamplingStats {
    return { ...this.stats };
  }

  /**
   * Reset sampling statistics.
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      averageResponseTime: 0,
      requestsByFeature: {},
    };
    this.requestTimes = [];
  }

  /**
   * No-op in the functional implementation — retained for API compatibility
   * with the previous stub used by `IdeaStormingMcpAgent`.
   */
  handleSamplingResponse(): void {
    // intentionally empty
  }

  /**
   * No-op in the functional implementation — retained for API compatibility.
   */
  getPendingCount(): number {
    return 0;
  }

  /**
   * No-op in the functional implementation — retained for API compatibility.
   */
  cancelAllPending(): void {
    // intentionally empty
  }

  /**
   * No-op in the functional implementation — retained for API compatibility.
   */
  destroy(): void {
    // intentionally empty
  }
}
