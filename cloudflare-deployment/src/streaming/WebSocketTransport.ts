/**
 * WebSocket Transport Implementation
 *
 * Provides bidirectional real-time communication for enhanced features
 */

import { randomUUID } from 'node:crypto';
import type {
  StreamingTransport,
  StreamingEvent,
  WebSocketConfig,
  ConnectionContext,
  ConnectionState,
  ConnectionManager,
} from './types.js';

/**
 * WebSocket message types
 */
interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'state_update' | 'rpc' | 'ping' | 'pong';
  id?: string;
  data?: any;
}

/**
 * WebSocket Transport for bidirectional streaming
 */
export class WebSocketTransport implements StreamingTransport {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private active: boolean = false;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connectionState: ConnectionState;
  private heartbeatTimer?: number;
  private lastPingTime?: number;

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      maxConnectionsPerUser: config.maxConnectionsPerUser || 5,
      maxMessageSize: config.maxMessageSize || 1024 * 1024, // 1MB
      compression: config.compression || false,
    };

    this.connectionState = {
      subscriptions: new Set(),
      lastActivity: Date.now(),
    };
  }

  /**
   * Handle WebSocket upgrade request
   */
  async handleUpgrade(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');

    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.ws = server;
    this.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Accept and configure WebSocket connection
   */
  private acceptWebSocket(ws: WebSocket): void {
    ws.accept();

    // Set up event handlers
    ws.addEventListener('message', event => this.handleMessage(event));
    ws.addEventListener('close', event => this.handleClose(event));
    ws.addEventListener('error', event => this.handleError(event));

    // Start the connection
    this.start().catch(console.error);
  }

  /**
   * Start the WebSocket connection
   */
  async start(): Promise<void> {
    if (this.active) return;

    this.active = true;
    this.connectionState.lastActivity = Date.now();

    // Start heartbeat
    this.startHeartbeat();

    // Send connection established event
    await this.send({
      event: 'connection',
      data: {
        status: 'connected',
        connectionId: randomUUID(),
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send an event to the client
   */
  async send(event: StreamingEvent): Promise<void> {
    if (!this.active || !this.ws) {
      throw new Error('WebSocket not active');
    }

    try {
      const message = JSON.stringify({
        type: 'event',
        event: event.event,
        data: event.data,
        id: event.id,
        timestamp: Date.now(),
      });

      // Check message size
      if (message.length > this.config.maxMessageSize!) {
        throw new Error('Message too large');
      }

      this.ws.send(message);
      this.connectionState.lastActivity = Date.now();
    } catch (error) {
      console.error('WebSocket send error:', error);
      throw error;
    }
  }

  /**
   * Send multiple events as a batch
   */
  async sendBatch(events: StreamingEvent[]): Promise<void> {
    // For WebSocket, we can send as a single batch message
    if (!this.active || !this.ws) {
      throw new Error('WebSocket not active');
    }

    const batchMessage = JSON.stringify({
      type: 'batch',
      events: events.map(e => ({
        event: e.event,
        data: e.data,
        id: e.id,
      })),
      timestamp: Date.now(),
    });

    if (batchMessage.length > this.config.maxMessageSize!) {
      // If batch is too large, send individually
      for (const event of events) {
        await this.send(event);
      }
    } else {
      this.ws.send(batchMessage);
      this.connectionState.lastActivity = Date.now();
    }
  }

  /**
   * Close the WebSocket connection
   */
  async close(code: number = 1000, reason: string = 'Normal closure'): Promise<void> {
    if (!this.active) return;

    // Stop heartbeat
    this.stopHeartbeat();

    // Send disconnection event
    try {
      await this.send({
        event: 'connection',
        data: {
          status: 'disconnected',
          reason,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      // Ignore errors during close
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }

    this.active = false;
  }

  /**
   * Check if transport is active
   */
  isActive(): boolean {
    return this.active && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming WebSocket message
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    try {
      const message: WSMessage = JSON.parse(event.data as string);

      this.connectionState.lastActivity = Date.now();

      switch (message.type) {
        case 'subscribe':
          await this.handleSubscribe(message.data);
          break;

        case 'unsubscribe':
          await this.handleUnsubscribe(message.data);
          break;

        case 'state_update':
          await this.handleStateUpdate(message.data);
          break;

        case 'rpc':
          await this.handleRPC(message.id!, message.data);
          break;

        case 'ping':
          await this.handlePing();
          break;

        case 'pong':
          this.handlePong();
          break;

        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      await this.sendError(error as Error);
    }
  }

  /**
   * Handle subscription request
   */
  private async handleSubscribe(resource: string): Promise<void> {
    this.connectionState.subscriptions.add(resource);

    await this.send({
      event: 'subscription',
      data: {
        action: 'subscribed',
        resource,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Handle unsubscription request
   */
  private async handleUnsubscribe(resource: string): Promise<void> {
    this.connectionState.subscriptions.delete(resource);

    await this.send({
      event: 'subscription',
      data: {
        action: 'unsubscribed',
        resource,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Handle state update from client
   */
  private async handleStateUpdate(data: any): Promise<void> {
    // Process state update and broadcast to other connections
    await this.send({
      event: 'state_change',
      data: {
        ...data,
        source: 'client',
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Handle RPC call
   */
  private async handleRPC(id: string, data: any): Promise<void> {
    try {
      // Process RPC call (would integrate with MCP tools)
      const result = await this.processRPC(data.method, data.params);

      // Send response
      this.ws?.send(
        JSON.stringify({
          type: 'rpc_response',
          id,
          result,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      // Send error response
      this.ws?.send(
        JSON.stringify({
          type: 'rpc_error',
          id,
          error: {
            message: (error as Error).message,
            code: -32603, // Internal error
          },
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * Process RPC call (stub - would integrate with actual handlers)
   */
  private async processRPC(method: string, params: any): Promise<any> {
    // This would integrate with the MCP server methods
    throw new Error(`RPC method not implemented: ${method}`);
  }

  /**
   * Handle ping message
   */
  private async handlePing(): Promise<void> {
    this.ws?.send(
      JSON.stringify({
        type: 'pong',
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Handle pong message
   */
  private handlePong(): void {
    if (this.lastPingTime) {
      const latency = Date.now() - this.lastPingTime;
      console.log(`WebSocket latency: ${latency}ms`);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket closed: ${event.code} - ${event.reason}`);
    this.active = false;
    this.stopHeartbeat();
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
  }

  /**
   * Send error message to client
   */
  private async sendError(error: Error): Promise<void> {
    await this.send({
      event: 'error',
      data: {
        message: error.message,
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeatInterval) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.active && this.ws) {
        this.lastPingTime = Date.now();
        this.ws.send(
          JSON.stringify({
            type: 'ping',
            timestamp: this.lastPingTime,
          })
        );
      }
    }, this.config.heartbeatInterval) as unknown as number;
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Update connection state
   */
  setState(updates: Partial<ConnectionState>): void {
    this.connectionState = {
      ...this.connectionState,
      ...updates,
    };
  }
}

/**
 * WebSocket Connection Manager
 */
export class WebSocketConnectionManager implements ConnectionManager {
  private connections: Map<string, WebSocketTransport> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private maxConnectionsPerUser: number;

  constructor(maxConnectionsPerUser = 5) {
    this.maxConnectionsPerUser = maxConnectionsPerUser;
  }

  async addConnection(id: string, connection: WebSocketTransport): Promise<void> {
    const state = connection.getState();

    // Check user connection limit
    if (state.userId) {
      const userConns = this.userConnections.get(state.userId) || new Set();
      if (userConns.size >= this.maxConnectionsPerUser) {
        throw new Error('Maximum connections per user exceeded');
      }
      userConns.add(id);
      this.userConnections.set(state.userId, userConns);
    }

    this.connections.set(id, connection);
  }

  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (connection) {
      const state = connection.getState();

      // Remove from user connections
      if (state.userId) {
        const userConns = this.userConnections.get(state.userId);
        if (userConns) {
          userConns.delete(id);
          if (userConns.size === 0) {
            this.userConnections.delete(state.userId);
          }
        }
      }

      this.connections.delete(id);
    }
  }

  getConnection(id: string): WebSocketTransport | undefined {
    return this.connections.get(id);
  }

  getAllConnections(): Map<string, WebSocketTransport> {
    return this.connections;
  }

  async broadcast(
    event: StreamingEvent,
    filter?: (conn: WebSocketTransport) => boolean
  ): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const connection of this.connections.values()) {
      if (!filter || filter(connection)) {
        promises.push(connection.send(event).catch(console.error));
      }
    }

    await Promise.all(promises);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get connections for a specific user
   */
  getUserConnections(userId: string): WebSocketTransport[] {
    const connectionIds = this.userConnections.get(userId);
    if (!connectionIds) return [];

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter((conn): conn is WebSocketTransport => conn !== undefined);
  }

  /**
   * Broadcast to a specific user's connections
   */
  async broadcastToUser(userId: string, event: StreamingEvent): Promise<void> {
    const connections = this.getUserConnections(userId);
    await Promise.all(connections.map(conn => conn.send(event).catch(console.error)));
  }
}
