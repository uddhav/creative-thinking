/**
 * HTTP Transport
 *
 * Standard HTTP transport for MCP communication
 */

import { BaseTransport } from './BaseTransport.js';
import type { ClientConfig, ClientOptions, ConnectionState } from '../types.js';

export class HTTPTransport extends BaseTransport {
  private abortController?: AbortController;

  constructor(config: ClientConfig) {
    super(config as any);
  }

  /**
   * Send a request (delegates to request method)
   */
  async send(method: string, params: any): Promise<any> {
    return this.request(method, params);
  }

  /**
   * Connect to the server
   */
  async connect(): Promise<void> {
    this.setState('connecting');

    try {
      // Test connection with a simple request
      await this.request('ping', {}, { timeout: this.config.timeout?.connect });
      this.setState('connected');
    } catch (error) {
      this.setState('error');
      throw new Error(`Failed to connect: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
    this.setState('disconnected');
  }

  /**
   * Make an HTTP request
   */
  async request<T = any>(method: string, params?: any, options?: ClientOptions): Promise<T> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // Create abort controller for this request
    const controller = new AbortController();
    const timeout = options?.timeout || this.config.timeout?.request || 30000;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Merge signals if provided
    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const url = this.buildUrl(method);
      const headers = this.buildHeaders(options);

      const requestBody = JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      });

      if (this.config.debug) {
        console.log(`[HTTP] Request ${requestId}:`, { method, params });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();

      if (this.config.debug) {
        console.log(`[HTTP] Response ${requestId} (${Date.now() - startTime}ms):`, data);
      }

      // Handle JSON-RPC response
      if (data.error) {
        throw new Error(data.error.message || 'Request failed');
      }

      return data.result as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as any).name === 'AbortError') {
        throw new Error('Request timeout');
      }

      // Handle retry logic
      if (this.shouldRetry(error, options)) {
        return this.retryRequest(method, params, options);
      }

      throw error;
    }
  }

  /**
   * Build URL for request
   */
  private buildUrl(method: string): string {
    const baseUrl = this.config.serverUrl;

    // Handle special endpoints
    if (method.startsWith('resources/')) {
      return `${baseUrl}/api/resources`;
    }
    if (method.startsWith('prompts/')) {
      return `${baseUrl}/api/prompts`;
    }
    if (method.startsWith('tools/')) {
      return `${baseUrl}/api/tools`;
    }

    // Default API endpoint
    return `${baseUrl}/api`;
  }

  /**
   * Build headers for request
   */
  private buildHeaders(options?: ClientOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...options?.headers,
    };

    // Add authentication headers
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'api-key':
          headers['X-API-Key'] = this.config.auth.credentials.apiKey;
          break;
        case 'basic':
          const { username, password } = this.config.auth.credentials;
          headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
          break;
        case 'oauth':
          headers['Authorization'] = `Bearer ${this.config.auth.credentials.token}`;
          break;
      }
    }

    return headers;
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: any, options?: ClientOptions): boolean {
    if (options?.retry === false) return false;
    if (this.retryCount >= (this.config.retry?.maxAttempts || 3)) return false;

    // Retry on network errors and 5xx errors
    const retryableErrors = ['NetworkError', 'TimeoutError', 'HTTP 502', 'HTTP 503', 'HTTP 504'];

    return retryableErrors.some(e => error.message?.includes(e));
  }

  /**
   * Retry a request with exponential backoff
   */
  private async retryRequest<T>(method: string, params?: any, options?: ClientOptions): Promise<T> {
    this.retryCount++;

    const delay = Math.min(
      (this.config.retry?.initialDelay || 1000) *
        Math.pow(this.config.retry?.backoffFactor || 2, this.retryCount - 1),
      this.config.retry?.maxDelay || 30000
    );

    if (this.config.debug) {
      console.log(`[HTTP] Retrying request (attempt ${this.retryCount}) after ${delay}ms`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      return await this.request<T>(method, params, options);
    } finally {
      this.retryCount--;
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
