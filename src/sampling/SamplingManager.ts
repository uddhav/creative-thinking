/**
 * SamplingManager
 * Manages MCP Sampling requests to client for LLM completions
 */

import { randomUUID } from 'crypto';
import type {
  SamplingRequest,
  SamplingResult,
  SamplingError,
  PendingSamplingRequest,
  SamplingCapability,
  SamplingStats,
} from './types.js';

export class SamplingManager {
  private pendingRequests = new Map<string, PendingSamplingRequest>();
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
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Set the sampling capability from client
   */
  setCapability(capability: SamplingCapability): void {
    this.capability = capability;
  }

  /**
   * Check if sampling is available
   */
  isAvailable(): boolean {
    return this.capability?.supported === true;
  }

  /**
   * Request sampling from client
   */
  async requestSampling(
    request: SamplingRequest,
    feature?: string,
    retryCount = 0
  ): Promise<SamplingResult> {
    // Check if sampling is available
    if (!this.isAvailable()) {
      throw new Error(
        JSON.stringify(
          this.createError('model_not_available', 'Sampling is not available from client')
        )
      );
    }

    // Validate request
    this.validateRequest(request);

    // Update stats
    this.stats.totalRequests++;
    if (feature) {
      this.stats.requestsByFeature[feature] = (this.stats.requestsByFeature[feature] || 0) + 1;
    }

    const requestId = randomUUID();
    const startTime = Date.now();

    try {
      // Create promise for async response
      const responsePromise = this.createPendingRequest(requestId);

      // Send sampling request via transport
      this.sendSamplingRequest(requestId, request, feature);

      // Wait for response with timeout
      const result = await this.waitForResponse(responsePromise, request);

      // Update success stats
      this.updateSuccessStats(startTime, result);

      return result;
    } catch (error) {
      // Update failure stats
      this.stats.failedRequests++;

      // Handle retry logic
      const samplingError = this.extractSamplingError(error);
      if (this.shouldRetry(samplingError, retryCount)) {
        await this.delay(this.RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
        return this.requestSampling(request, feature, retryCount + 1);
      }

      throw error;
    } finally {
      // Clean up pending request
      this.cleanupPendingRequest(requestId);
    }
  }

  /**
   * Handle sampling response from client
   */
  handleSamplingResponse(requestId: string, result: SamplingResult | SamplingError): void {
    const pending = this.pendingRequests.get(requestId);
    if (!pending) {
      console.error(`[SamplingManager] No pending request found for ID: ${requestId}`);
      return;
    }

    // Clean up before resolving/rejecting
    this.cleanupPendingRequest(requestId);

    // Check if it's an error
    if ('code' in result) {
      pending.reject(result);
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Validate sampling request
   */
  private validateRequest(request: SamplingRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error(
        JSON.stringify(this.createError('invalid_request', 'Messages array cannot be empty'))
      );
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new Error(
          JSON.stringify(
            this.createError('invalid_request', 'Each message must have role and content')
          )
        );
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        throw new Error(
          JSON.stringify(this.createError('invalid_request', `Invalid role: ${message.role}`))
        );
      }
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 1) {
        throw new Error(
          JSON.stringify(this.createError('invalid_request', 'Temperature must be between 0 and 1'))
        );
      }
    }

    if (request.maxTokens !== undefined) {
      if (request.maxTokens <= 0) {
        throw new Error(
          JSON.stringify(this.createError('invalid_request', 'maxTokens must be positive'))
        );
      }
      if (this.capability?.maxTokens && request.maxTokens > this.capability.maxTokens) {
        throw new Error(
          JSON.stringify(
            this.createError(
              'invalid_request',
              `maxTokens ${request.maxTokens} exceeds limit ${this.capability.maxTokens}`
            )
          )
        );
      }
    }

    if (request.modelPreferences) {
      const { costPriority, speedPriority, intelligencePriority } = request.modelPreferences;
      for (const [name, value] of Object.entries({
        costPriority,
        speedPriority,
        intelligencePriority,
      })) {
        if (value !== undefined && (value < 0 || value > 1)) {
          throw new Error(
            JSON.stringify(this.createError('invalid_request', `${name} must be between 0 and 1`))
          );
        }
      }
    }
  }

  /**
   * Create a pending request
   */
  private createPendingRequest(requestId: string): Promise<SamplingResult> {
    return new Promise<SamplingResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.cleanupPendingRequest(requestId);
        reject(
          new Error(JSON.stringify(this.createError('timeout', 'Sampling request timed out')))
        );
      }, this.DEFAULT_TIMEOUT);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timestamp: Date.now(),
        timeoutHandle,
      });
    });
  }

  /**
   * Send sampling request via transport
   */
  private sendSamplingRequest(requestId: string, request: SamplingRequest, feature?: string): void {
    // This will be connected to the actual transport in the main server
    // For now, we'll emit an event that the server can handle
    const samplingPayload = {
      jsonrpc: '2.0' as const,
      id: requestId,
      method: 'sampling/create',
      params: {
        ...request,
        metadata: {
          ...request.metadata,
          serverName: 'creative-thinking',
          feature: feature || 'general',
          timestamp: new Date().toISOString(),
        },
      },
    };

    // The server will handle sending this via transport
    // For now, store it for the server to pick up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (globalThis as any).__pendingSamplingRequest = samplingPayload;
  }

  /**
   * Wait for response with timeout
   */
  private async waitForResponse(
    responsePromise: Promise<SamplingResult>,
    request: SamplingRequest
  ): Promise<SamplingResult> {
    // The timeout is already handled in createPendingRequest
    // No need for another timeout here
    // Keep the request parameter for potential future use
    if (request.maxTokens && request.maxTokens > 10000) {
      console.error(`[SamplingManager] Large token request: ${request.maxTokens}`);
    }
    return responsePromise;
  }

  /**
   * Clean up pending request
   */
  private cleanupPendingRequest(requestId: string): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      if (pending.timeoutHandle) {
        clearTimeout(pending.timeoutHandle);
      }
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Update success statistics
   */
  private updateSuccessStats(startTime: number, result: SamplingResult): void {
    this.stats.successfulRequests++;

    if (result.totalTokens) {
      this.stats.totalTokensUsed += result.totalTokens;
    }

    const responseTime = Date.now() - startTime;
    this.requestTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }

    // Calculate moving average
    this.stats.averageResponseTime =
      this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
  }

  /**
   * Extract SamplingError from unknown error
   */
  private extractSamplingError(error: unknown): SamplingError {
    if (error instanceof Error) {
      // Try to parse error message as SamplingError
      try {
        const parsed = JSON.parse(error.message) as SamplingError;
        if (parsed.code && parsed.message) {
          return parsed;
        }
      } catch {
        // Not a JSON error
      }
      // Create generic error from Error instance
      return this.createError('server_error', error.message);
    }
    // Handle non-Error objects
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, unknown>;
      if (typeof errorObj.code === 'string' && typeof errorObj.message === 'string') {
        return errorObj as unknown as SamplingError;
      }
    }
    // Fallback for unknown error types
    return this.createError('server_error', String(error));
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: SamplingError, retryCount: number): boolean {
    if (retryCount >= this.MAX_RETRIES) {
      return false;
    }

    // Retry on transient errors
    return ['rate_limit_exceeded', 'timeout', 'server_error'].includes(error.code);
  }

  /**
   * Create sampling error
   */
  private createError(code: SamplingError['code'], message: string): SamplingError {
    return { code, message };
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get sampling statistics
   */
  getStats(): SamplingStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
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
   * Check rate limits
   */
  checkRateLimits(): boolean {
    if (!this.capability?.rateLimits) {
      return true;
    }

    // Simple rate limit check - can be enhanced
    const recentRequests = Array.from(this.pendingRequests.values()).filter(
      req => Date.now() - req.timestamp < 60000 // Last minute
    );

    if (
      this.capability.rateLimits.requestsPerMinute &&
      recentRequests.length >= this.capability.rateLimits.requestsPerMinute
    ) {
      return false;
    }

    return true;
  }

  /**
   * Clean up manager
   */
  destroy(): void {
    // Clear all pending requests
    for (const [_requestId, pending] of this.pendingRequests) {
      if (pending.timeoutHandle) {
        clearTimeout(pending.timeoutHandle);
      }
      pending.reject(
        new Error(JSON.stringify(this.createError('server_error', 'Sampling manager destroyed')))
      );
    }
    this.pendingRequests.clear();
  }
}
