/**
 * Streaming Manager
 *
 * Unified streaming management for both SSE and WebSocket transports
 */

import { SSETransport } from './SSETransport.js';
import { WebSocketTransport, WebSocketConnectionManager } from './WebSocketTransport.js';
import type {
  StreamingConfig,
  StreamingEvent,
  ProgressEvent,
  StateChangeEvent,
  WarningEvent,
  VisualOutputEvent,
  CollaborationEvent,
  ProgressReporter,
} from './types.js';

/**
 * Visual output formatter for rich terminal-like output
 */
export class VisualOutputFormatter {
  /**
   * Format a header with styling
   */
  static formatHeader(title: string, icon?: string): VisualOutputEvent {
    return {
      event: 'visual',
      data: {
        type: 'header',
        style: {
          bold: true,
          color: '#3B82F6', // blue
          icon: icon || '📋',
        },
        content: title,
      },
    };
  }

  /**
   * Format a progress bar
   */
  static formatProgressBar(percent: number, label?: string): VisualOutputEvent {
    const filled = Math.floor(percent / 5); // 20 segments
    const empty = 20 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    return {
      event: 'visual',
      data: {
        type: 'progress',
        style: {
          color: percent < 33 ? '#EF4444' : percent < 66 ? '#F59E0B' : '#10B981',
        },
        content: `${bar} ${percent.toFixed(1)}%${label ? ` - ${label}` : ''}`,
      },
    };
  }

  /**
   * Format a divider line
   */
  static formatDivider(style: 'solid' | 'dashed' | 'double' = 'solid'): VisualOutputEvent {
    const dividers = {
      solid: '─'.repeat(50),
      dashed: '┈'.repeat(50),
      double: '═'.repeat(50),
    };

    return {
      event: 'visual',
      data: {
        type: 'divider',
        style: {
          color: '#6B7280', // gray
        },
        content: dividers[style],
      },
    };
  }

  /**
   * Format technique output
   */
  static formatTechniqueOutput(
    technique: string,
    step: number,
    content: string,
    color?: string
  ): VisualOutputEvent {
    return {
      event: 'visual',
      data: {
        type: 'content',
        style: {
          color: color || '#8B5CF6', // purple
          bold: false,
        },
        content: {
          technique,
          step,
          output: content,
        },
      },
    };
  }

  /**
   * Format warning message
   */
  static formatWarning(level: string, message: string): VisualOutputEvent {
    const colors: Record<string, string> = {
      SAFE: '#10B981', // green
      CAUTION: '#F59E0B', // yellow
      WARNING: '#F97316', // orange
      CRITICAL: '#EF4444', // red
    };

    const icons: Record<string, string> = {
      SAFE: '✅',
      CAUTION: '⚠️',
      WARNING: '⚠️',
      CRITICAL: '🚨',
    };

    return {
      event: 'visual',
      data: {
        type: 'content',
        style: {
          color: colors[level] || '#6B7280',
          bold: level === 'CRITICAL',
          icon: icons[level] || '📌',
        },
        content: message,
      },
    };
  }
}

/**
 * Unified Streaming Manager
 */
export class StreamingManager {
  private config: StreamingConfig;
  private sseTransports: Map<string, SSETransport> = new Map();
  private wsManager: WebSocketConnectionManager;
  private stateSubscribers: Map<string, Set<string>> = new Map(); // sessionId -> connectionIds

  constructor(config: StreamingConfig = {}) {
    this.config = {
      bufferFlushInterval: config.bufferFlushInterval || 50,
      maxConcurrentConnections: config.maxConcurrentConnections || 1000,
      enableCollaboration: config.enableCollaboration !== false,
      sse: config.sse || {},
      websocket: config.websocket || {},
    };

    this.wsManager = new WebSocketConnectionManager(config.websocket?.maxConnectionsPerUser || 5);
  }

  /**
   * Handle HTTP request - determine transport type
   */
  async handleRequest(request: Request, connectionId: string): Promise<Response> {
    const upgrade = request.headers.get('Upgrade');
    const accept = request.headers.get('Accept');

    // Check for WebSocket upgrade
    if (upgrade === 'websocket') {
      return this.handleWebSocketUpgrade(request, connectionId);
    }

    // Check for SSE
    if (accept?.includes('text/event-stream')) {
      return this.handleSSERequest(request, connectionId);
    }

    // Not a streaming request
    return new Response('Not a streaming request', { status: 400 });
  }

  /**
   * Handle SSE request
   */
  private async handleSSERequest(request: Request, connectionId: string): Promise<Response> {
    const transport = new SSETransport(this.config.sse);
    this.sseTransports.set(connectionId, transport);

    return transport.handleRequest(request, async sse => {
      // Initial setup
      await this.setupSSEConnection(connectionId, sse);

      // Keep connection alive until closed
      while (sse.isActive()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Cleanup
      this.sseTransports.delete(connectionId);
    });
  }

  /**
   * Handle WebSocket upgrade
   */
  private async handleWebSocketUpgrade(request: Request, connectionId: string): Promise<Response> {
    const transport = new WebSocketTransport(this.config.websocket);
    const response = await transport.handleUpgrade(request);

    if (response.status === 101) {
      await this.wsManager.addConnection(connectionId, transport);
    }

    return response;
  }

  /**
   * Set up SSE connection
   */
  private async setupSSEConnection(connectionId: string, transport: SSETransport): Promise<void> {
    // Send initial visual header
    await transport.sendVisualOutput(
      'header',
      'Creative Thinking MCP Server - Streaming Connected',
      { icon: '🚀' }
    );
  }

  /**
   * Broadcast event to all connections
   */
  async broadcast(event: StreamingEvent): Promise<void> {
    // Broadcast to SSE connections
    const ssePromises = Array.from(this.sseTransports.values()).map(transport =>
      transport.send(event).catch(console.error)
    );

    // Broadcast to WebSocket connections
    await this.wsManager.broadcast(event);

    await Promise.all(ssePromises);
  }

  /**
   * Send event to specific connection
   */
  async sendToConnection(connectionId: string, event: StreamingEvent): Promise<void> {
    // Try SSE first
    const sseTransport = this.sseTransports.get(connectionId);
    if (sseTransport) {
      await sseTransport.send(event);
      return;
    }

    // Try WebSocket
    const wsTransport = this.wsManager.getConnection(connectionId);
    if (wsTransport) {
      await wsTransport.send(event);
      return;
    }

    throw new Error(`Connection not found: ${connectionId}`);
  }

  /**
   * Stream progress for a long-running operation
   */
  async streamProgress<T>(
    operation: string,
    sessionId: string,
    totalSteps: number,
    task: (reporter: ProgressReporter) => Promise<T>
  ): Promise<T> {
    let currentStep = 0;
    const startTime = Date.now();

    const reporter: ProgressReporter = {
      update: (current: number, total: number, metadata?: any) => {
        currentStep = current;
        const percentComplete = (current / total) * 100;
        const elapsed = Date.now() - startTime;
        const estimatedTotal = (elapsed / current) * total;
        const estimatedRemaining = Math.round((estimatedTotal - elapsed) / 1000);

        const progressEvent: ProgressEvent = {
          event: 'progress',
          data: {
            operation,
            sessionId,
            currentStep: current,
            totalSteps: total,
            percentComplete,
            estimatedTimeRemaining: estimatedRemaining,
            metadata,
          },
        };

        this.broadcast(progressEvent).catch(console.error);

        // Also send visual progress bar
        const visualEvent = VisualOutputFormatter.formatProgressBar(
          percentComplete,
          metadata?.label
        );
        this.broadcast(visualEvent).catch(console.error);
      },

      getCurrent: () => ({
        step: currentStep,
        total: totalSteps,
        percent: (currentStep / totalSteps) * 100,
      }),

      complete: () => {
        reporter.update(totalSteps, totalSteps, { status: 'complete' });
      },

      fail: (error: Error) => {
        this.broadcast({
          event: 'error',
          data: {
            operation,
            sessionId,
            error: error.message,
            timestamp: Date.now(),
          },
        }).catch(console.error);
      },
    };

    try {
      // Send start event with visual header
      await this.broadcast(VisualOutputFormatter.formatHeader(`Starting: ${operation}`, '🔄'));

      reporter.update(0, totalSteps, { status: 'starting' });

      // Execute the task
      const result = await task(reporter);

      // Send completion
      reporter.complete();

      await this.broadcast(VisualOutputFormatter.formatHeader(`Completed: ${operation}`, '✅'));

      return result;
    } catch (error) {
      reporter.fail(error as Error);

      await this.broadcast(
        VisualOutputFormatter.formatWarning(
          'CRITICAL',
          `Failed: ${operation} - ${(error as Error).message}`
        )
      );

      throw error;
    }
  }

  /**
   * Send state change event
   */
  async sendStateChange(change: Omit<StateChangeEvent['data'], 'timestamp'>): Promise<void> {
    const event: StateChangeEvent = {
      event: 'state_change',
      data: {
        ...change,
        timestamp: Date.now(),
      },
    };

    // Send to subscribers of this session
    const subscribers = this.stateSubscribers.get(change.sessionId);
    if (subscribers) {
      for (const connectionId of subscribers) {
        await this.sendToConnection(connectionId, event).catch(console.error);
      }
    }
  }

  /**
   * Send warning event
   */
  async sendWarning(warning: Omit<WarningEvent['data'], 'timestamp'>): Promise<void> {
    const event: WarningEvent = {
      event: 'warning',
      data: warning,
    };

    // Broadcast warnings to all connections
    await this.broadcast(event);

    // Also send visual warning
    await this.broadcast(VisualOutputFormatter.formatWarning(warning.level, warning.message));
  }

  /**
   * Send collaboration event
   */
  async sendCollaboration(
    sessionId: string,
    collaboration: Omit<CollaborationEvent['data'], 'timestamp'>
  ): Promise<void> {
    if (!this.config.enableCollaboration) return;

    const event: CollaborationEvent = {
      event: 'collaboration',
      data: {
        ...collaboration,
        timestamp: Date.now(),
      },
    };

    // Send to session subscribers
    const subscribers = this.stateSubscribers.get(sessionId);
    if (subscribers) {
      for (const connectionId of subscribers) {
        await this.sendToConnection(connectionId, event).catch(console.error);
      }
    }
  }

  /**
   * Subscribe connection to session updates
   */
  subscribeToSession(connectionId: string, sessionId: string): void {
    const subscribers = this.stateSubscribers.get(sessionId) || new Set();
    subscribers.add(connectionId);
    this.stateSubscribers.set(sessionId, subscribers);
  }

  /**
   * Unsubscribe connection from session updates
   */
  unsubscribeFromSession(connectionId: string, sessionId: string): void {
    const subscribers = this.stateSubscribers.get(sessionId);
    if (subscribers) {
      subscribers.delete(connectionId);
      if (subscribers.size === 0) {
        this.stateSubscribers.delete(sessionId);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    sseConnections: number;
    wsConnections: number;
    totalConnections: number;
    activeSessionSubscriptions: number;
  } {
    return {
      sseConnections: this.sseTransports.size,
      wsConnections: this.wsManager.getConnectionCount(),
      totalConnections: this.sseTransports.size + this.wsManager.getConnectionCount(),
      activeSessionSubscriptions: this.stateSubscribers.size,
    };
  }

  /**
   * Clean up inactive connections
   */
  async cleanup(): Promise<void> {
    // Clean up closed SSE connections
    for (const [id, transport] of this.sseTransports.entries()) {
      if (!transport.isActive()) {
        this.sseTransports.delete(id);

        // Remove from subscriptions
        for (const subscribers of this.stateSubscribers.values()) {
          subscribers.delete(id);
        }
      }
    }

    // WebSocket manager handles its own cleanup
  }
}
