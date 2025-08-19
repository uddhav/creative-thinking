/**
 * Streaming Client
 *
 * Handles real-time streaming connections (SSE and WebSocket)
 */

import { EventEmitter } from './utils/EventEmitter.js';
import type { StreamingEvent, ProgressEvent, WarningEvent } from '../streaming/types.js';

export interface StreamingClientEvents {
  connect: () => void;
  disconnect: () => void;
  progress: (event: ProgressEvent) => void;
  warning: (level: string, message: string) => void;
  streamingEvent: (event: StreamingEvent) => void;
  error: (error: Error) => void;
}

export class StreamingClient extends EventEmitter<StreamingClientEvents> {
  private url: string;
  private connection?: EventSource | WebSocket;
  private isSSE: boolean;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private sessionSubscriptions = new Set<string>();

  constructor(url: string, useWebSocket = false) {
    super();
    this.url = url;
    this.isSSE = !useWebSocket;
  }

  /**
   * Connect to streaming endpoint
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isSSE) {
        this.connectSSE(resolve, reject);
      } else {
        this.connectWebSocket(resolve, reject);
      }
    });
  }

  /**
   * Connect via Server-Sent Events
   */
  private connectSSE(resolve: () => void, reject: (error: Error) => void): void {
    try {
      const url = new URL(this.url);

      // Add session subscriptions to query params
      if (this.sessionSubscriptions.size > 0) {
        url.searchParams.set('sessions', Array.from(this.sessionSubscriptions).join(','));
      }

      this.connection = new EventSource(url.toString());

      this.connection.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connect');
        resolve();
      };

      this.connection.onerror = () => {
        const error = new Error('SSE connection error');
        this.emit('error', error);
        this.handleReconnect();
      };

      this.connection.onmessage = (event: MessageEvent) => {
        this.handleMessage(event.data);
      };

      // Set up typed event listeners
      this.connection.addEventListener('progress', ((event: any) => {
        const data = JSON.parse(event.data);
        this.emit('progress', data);
      }) as EventListener);

      this.connection.addEventListener('warning', ((event: any) => {
        const data = JSON.parse(event.data);
        this.emit('warning', data.level, data.message);
      }) as EventListener);

      this.connection.addEventListener('state_change', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('streamingEvent', { event: 'state_change', data });
      });

      this.connection.addEventListener('visual', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('streamingEvent', { event: 'visual', data });
      });

      this.connection.addEventListener('collaboration', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('streamingEvent', { event: 'collaboration', data });
      });

      this.connection.addEventListener('sampling', (event: any) => {
        const data = JSON.parse(event.data);
        this.emit('streamingEvent', { event: 'sampling', data });
      });
    } catch (error) {
      reject(error as Error);
    }
  }

  /**
   * Connect via WebSocket
   */
  private connectWebSocket(resolve: () => void, reject: (error: Error) => void): void {
    try {
      const url = new URL(this.url);
      url.protocol = url.protocol.replace('http', 'ws');

      // Add session subscriptions to query params
      if (this.sessionSubscriptions.size > 0) {
        url.searchParams.set('sessions', Array.from(this.sessionSubscriptions).join(','));
      }

      this.connection = new WebSocket(url.toString());

      this.connection.addEventListener('open', () => {
        this.reconnectAttempts = 0;
        this.emit('connect');

        // Subscribe to sessions
        if (this.sessionSubscriptions.size > 0) {
          this.sessionSubscriptions.forEach(sessionId => {
            this.sendWebSocketMessage({
              type: 'subscribe',
              data: sessionId,
            });
          });
        }

        resolve();
      });

      this.connection.addEventListener('error', () => {
        const error = new Error('WebSocket connection error');
        this.emit('error', error);
      });

      this.connection.addEventListener('close', () => {
        this.emit('disconnect');
        this.handleReconnect();
      });

      this.connection.addEventListener('message', (event: MessageEvent) => {
        this.handleMessage(event.data);
      });
    } catch (error) {
      reject(error as Error);
    }
  }

  /**
   * Disconnect from streaming endpoint
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.connection) {
      if (this.isSSE) {
        (this.connection as EventSource).close();
      } else {
        (this.connection as WebSocket).close();
      }
      this.connection = undefined;
    }

    this.emit('disconnect');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    if (!this.connection) return false;

    if (this.isSSE) {
      return (this.connection as EventSource).readyState === EventSource.OPEN;
    } else {
      return (this.connection as WebSocket).readyState === WebSocket.OPEN;
    }
  }

  /**
   * Subscribe to session updates
   */
  subscribeToSession(sessionId: string): void {
    this.sessionSubscriptions.add(sessionId);

    if (this.isConnected() && !this.isSSE) {
      this.sendWebSocketMessage({
        type: 'subscribe',
        data: sessionId,
      });
    }
  }

  /**
   * Unsubscribe from session updates
   */
  unsubscribeFromSession(sessionId: string): void {
    this.sessionSubscriptions.delete(sessionId);

    if (this.isConnected() && !this.isSSE) {
      this.sendWebSocketMessage({
        type: 'unsubscribe',
        data: sessionId,
      });
    }
  }

  /**
   * Send a message (WebSocket only)
   */
  send(message: any): void {
    if (!this.isSSE && this.connection && this.isConnected()) {
      (this.connection as WebSocket).send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle different message types
      if (message.type === 'event') {
        this.handleStreamingEvent(message);
      } else if (message.type === 'batch') {
        message.events.forEach((event: any) => this.handleStreamingEvent(event));
      } else if (message.type === 'rpc_response' || message.type === 'rpc_error') {
        // Handle RPC responses if needed
        this.emit('streamingEvent', message);
      } else {
        // Generic streaming event
        this.emit('streamingEvent', message);
      }
    } catch (error) {
      console.error('Failed to parse streaming message:', error);
    }
  }

  /**
   * Handle streaming event
   */
  private handleStreamingEvent(event: any): void {
    switch (event.event || event.type) {
      case 'progress':
        this.emit('progress', event.data);
        break;

      case 'warning':
        this.emit('warning', event.data.level, event.data.message);
        break;

      default:
        this.emit('streamingEvent', event);
        break;
    }
  }

  /**
   * Send WebSocket message
   */
  private sendWebSocketMessage(message: any): void {
    if (!this.isSSE && this.connection && this.isConnected()) {
      (this.connection as WebSocket).send(JSON.stringify(message));
    }
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'));
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }
}
