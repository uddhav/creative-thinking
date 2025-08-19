/**
 * WebSocket Transport
 *
 * WebSocket transport for MCP communication
 */

import { BaseTransport } from './BaseTransport.js';
import type { ClientConfig, ClientOptions } from '../types.js';

export class WebSocketTransport extends BaseTransport {
  private ws?: WebSocket;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private messageQueue: any[] = [];
  private isReady = false;

  constructor(config: ClientConfig) {
    super(config);
  }

  /**
   * Connect to the server via WebSocket
   */
  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve, reject) => {
      const url = new URL(this.config.serverUrl);
      url.protocol = url.protocol.replace('http', 'ws');
      url.pathname = '/ws';

      this.ws = new WebSocket(url.toString());

      this.ws.addEventListener('open', () => {
        this.isReady = true;
        this.setState('connected');
        this.flushMessageQueue();
        resolve();
      });

      this.ws.addEventListener('error', () => {
        this.setState('error');
        reject(new Error('WebSocket connection failed'));
      });

      this.ws.addEventListener('close', () => {
        this.isReady = false;
        this.setState('disconnected');
        this.handleAutoReconnect();
      });

      this.ws.addEventListener('message', (event: MessageEvent) => {
        this.handleMessage(event.data);
      });
    });
  }

  /**
   * Disconnect from WebSocket
   */
  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }

    // Clear pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();

    this.isReady = false;
    this.messageQueue = [];
    this.setState('disconnected');
    this.cleanup();
  }

  /**
   * Send a request via WebSocket
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

      // Create request message
      const message = {
        jsonrpc: '2.0',
        id: requestId,
        method,
        params,
      };

      // Send or queue message
      if (this.isReady) {
        this.sendMessage(message);
      } else {
        this.messageQueue.push(message);
      }
    });
  }

  /**
   * Send a message via WebSocket
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));

      if (this.config.debug) {
        console.log('[WebSocket] Send:', message);
      }
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (this.config.debug) {
        console.log('[WebSocket] Receive:', message);
      }

      // Handle JSON-RPC response
      if (message.id) {
        const pending = this.pendingRequests.get(message.id);

        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.id);

          if (message.error) {
            pending.reject(new Error(message.error.message || 'Request failed'));
          } else {
            pending.resolve(message.result);
          }
        }
      }

      // Handle server-initiated messages (notifications)
      if (!message.id && message.method) {
        this.handleNotification(message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle server notifications
   */
  private handleNotification(message: any): void {
    // Emit events based on notification type
    switch (message.method) {
      case 'session/created':
        this.emit('sessionCreated', message.params.sessionId);
        break;
      case 'session/updated':
        this.emit('sessionUpdated', message.params.sessionId, message.params.update);
        break;
      case 'progress':
        this.emit('progress', message.params);
        break;
      case 'warning':
        this.emit('warning', message.params.level, message.params.message);
        break;
      default:
        this.emit('streamingEvent', message);
    }
  }

  /**
   * Flush queued messages
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
