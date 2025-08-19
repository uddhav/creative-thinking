/**
 * SSE Transport
 *
 * Server-Sent Events transport for MCP communication
 */

import { BaseTransport } from './BaseTransport.js';
import type { ClientConfig, ClientOptions } from '../types.js';

export class SSETransport extends BaseTransport {
  private eventSource?: EventSource;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(config: ClientConfig) {
    super(config);
  }

  /**
   * Connect to the server via SSE
   */
  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve, reject) => {
      const url = `${this.config.serverUrl}/mcp`;
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.setState('connected');
        resolve();
      };

      this.eventSource.onerror = () => {
        this.setState('error');
        reject(new Error('SSE connection failed'));
        this.handleAutoReconnect();
      };

      this.eventSource.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      // Set up typed event listeners for MCP responses
      this.eventSource.addEventListener('response', (event: any) => {
        this.handleResponse(JSON.parse(event.data));
      });
    });
  }

  /**
   * Disconnect from SSE
   */
  async disconnect(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    // Clear pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    this.setState('disconnected');
    this.cleanup();
  }

  /**
   * Send a request via SSE (actually sends via HTTP, receives via SSE)
   */
  async request<T = any>(method: string, params?: any, options?: ClientOptions): Promise<T> {
    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(
        () => {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        },
        options?.timeout || this.config.timeout?.request || 30000
      );

      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      // Send request via HTTP POST
      this.sendRequest(requestId, method, params, options).catch(error => {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Send request via HTTP
   */
  private async sendRequest(
    requestId: string,
    method: string,
    params?: any,
    options?: ClientOptions
  ): Promise<void> {
    const url = `${this.config.serverUrl}/mcp`;
    const headers = this.buildHeaders(options);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      }),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Handle SSE message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      this.handleResponse(message);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  }

  /**
   * Handle response message
   */
  private handleResponse(message: any): void {
    const { id, result, error } = message;
    const pending = this.pendingRequests.get(id);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(id);

      if (error) {
        pending.reject(new Error(error.message || 'Request failed'));
      } else {
        pending.resolve(result);
      }
    }
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

    // Add authentication
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
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
