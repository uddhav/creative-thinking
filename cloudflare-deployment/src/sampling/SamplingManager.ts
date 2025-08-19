/**
 * Sampling Manager for Cloudflare Workers
 *
 * Manages MCP Sampling requests through the Cloudflare Agents SDK
 */

import type {
  SamplingRequest,
  SamplingResult,
  SamplingError,
  PendingSamplingRequest,
  SamplingCapability,
  SamplingStats,
  SamplingNotification,
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
  private notificationHandler?: (notification: SamplingNotification) => void;

  /**
   * Set the sampling capability from client
   */
  setCapability(capability: SamplingCapability): void {
    this.capability = capability;
    console.log('[SamplingManager] Capability set:', capability);
  }

  /**
   * Check if sampling is available
   */
  isAvailable(): boolean {
    return this.capability?.supported === true;
  }

  /**
   * Get current capability
   */
  getCapability(): SamplingCapability | null {
    return this.capability;
  }

  /**
   * Set notification handler for real-time updates
   */
  setNotificationHandler(handler: (notification: SamplingNotification) => void): void {
    this.notificationHandler = handler;
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
      throw this.createError('model_not_available', 'Sampling is not available from client');
    }

    // Validate request
    this.validateRequest(request);

    // Update stats
    this.stats.totalRequests++;
    if (feature) {
      this.stats.requestsByFeature[feature] = (this.stats.requestsByFeature[feature] || 0) + 1;
    }

    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Send start notification
    this.sendNotification({
      type: 'started',
      requestId,
      timestamp: startTime,
      data: { feature, messages: request.messages.length },
    });

    try {
      // Create promise for async response
      const responsePromise = this.createPendingRequest(requestId, request, feature);

      // Wait for response with timeout
      const result = await this.waitForResponse(responsePromise, request);

      // Update success stats
      this.updateSuccessStats(startTime, result);

      // Send completion notification
      this.sendNotification({
        type: 'completed',
        requestId,
        timestamp: Date.now(),
        data: { result: result.text.substring(0, 100) + '...' },
      });

      return result;
    } catch (error) {
      // Update failure stats
      this.stats.failedRequests++;

      // Send failure notification
      this.sendNotification({
        type: 'failed',
        requestId,
        timestamp: Date.now(),
        data: { error: (error as Error).message },
      });

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
      throw this.createError('invalid_request', 'Messages array cannot be empty');
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw this.createError('invalid_request', 'Each message must have role and content');
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        throw this.createError('invalid_request', `Invalid role: ${message.role}`);
      }
    }

    // Validate optional parameters
    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 1) {
        throw this.createError('invalid_request', 'Temperature must be between 0 and 1');
      }
    }

    if (request.maxTokens !== undefined) {
      if (request.maxTokens <= 0) {
        throw this.createError('invalid_request', 'maxTokens must be positive');
      }
      if (this.capability?.maxTokens && request.maxTokens > this.capability.maxTokens) {
        throw this.createError(
          'invalid_request',
          `maxTokens exceeds limit of ${this.capability.maxTokens}`
        );
      }
    }
  }

  /**
   * Create a pending request with promise
   */
  private createPendingRequest(
    requestId: string,
    request: SamplingRequest,
    feature?: string
  ): Promise<SamplingResult> {
    return new Promise<SamplingResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanupPendingRequest(requestId);
        reject(this.createError('timeout', 'Sampling request timed out'));
      }, this.DEFAULT_TIMEOUT);

      const pending: PendingSamplingRequest = {
        requestId,
        request,
        feature,
        timestamp: Date.now(),
        timeout,
        resolve,
        reject,
      };

      this.pendingRequests.set(requestId, pending);
    });
  }

  /**
   * Wait for response with proper error handling
   */
  private async waitForResponse(
    promise: Promise<SamplingResult>,
    request: SamplingRequest
  ): Promise<SamplingResult> {
    try {
      return await promise;
    } catch (error) {
      // Ensure proper error structure
      if (typeof error === 'object' && error !== null && 'code' in error) {
        throw error;
      }
      throw this.createError(
        'unknown_error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  /**
   * Clean up pending request
   */
  private cleanupPendingRequest(requestId: string): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      if (pending.timeout) {
        clearTimeout(pending.timeout);
      }
      this.pendingRequests.delete(requestId);
    }
  }

  /**
   * Update success statistics
   */
  private updateSuccessStats(startTime: number, result: SamplingResult): void {
    this.stats.successfulRequests++;

    const responseTime = Date.now() - startTime;
    this.requestTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.requestTimes.length > 100) {
      this.requestTimes.shift();
    }

    // Update average response time
    this.stats.averageResponseTime =
      this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;

    // Update token usage if available
    if (result.model?.totalTokens) {
      this.stats.totalTokensUsed += result.model.totalTokens;
    }
  }

  /**
   * Extract sampling error from unknown error
   */
  private extractSamplingError(error: unknown): SamplingError {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error as SamplingError;
    }
    return this.createError(
      'unknown_error',
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }

  /**
   * Determine if request should be retried
   */
  private shouldRetry(error: SamplingError, retryCount: number): boolean {
    if (retryCount >= this.MAX_RETRIES) {
      return false;
    }

    // Retry on transient errors
    const retryableCodes = ['timeout', 'rate_limit', 'temporary_failure', 'model_overloaded'];
    return retryableCodes.includes(error.code);
  }

  /**
   * Create a sampling error
   */
  private createError(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): SamplingError {
    return { code, message, details };
  }

  /**
   * Delay utility for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send notification if handler is set
   */
  private sendNotification(notification: SamplingNotification): void {
    if (this.notificationHandler) {
      this.notificationHandler(notification);
    }
  }

  /**
   * Get current statistics
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
   * Get pending request count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Cancel all pending requests
   */
  cancelAllPending(): void {
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      pending.reject(this.createError('cancelled', 'Request was cancelled'));
      this.cleanupPendingRequest(requestId);
    }
  }
}
