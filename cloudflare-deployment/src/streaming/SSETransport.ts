/**
 * Server-Sent Events (SSE) Transport Implementation
 *
 * Provides HTTP streaming for MCP-compliant real-time updates
 */

import { createLogger, type Logger } from '../utils/logger.js';
import type {
  StreamingTransport,
  StreamingEvent,
  SSEConfig,
  StreamBuffer,
  ProgressReporter,
} from './types.js';

/**
 * SSE Transport for HTTP streaming
 */
export class SSETransport implements StreamingTransport {
  private writer: WritableStreamDefaultWriter | null = null;
  private encoder: TextEncoder;
  private config: SSEConfig;
  private active: boolean = false;
  private eventId: number = 0;
  private keepAliveTimer?: number;
  private logger: Logger;

  constructor(config: SSEConfig = {}) {
    this.logger = createLogger({}, 'SSETransport');
    this.config = {
      keepAliveInterval: config.keepAliveInterval || 30000, // 30 seconds
      retryInterval: config.retryInterval || 5000, // 5 seconds
      maxBufferSize: config.maxBufferSize || 1024 * 1024, // 1MB
      compression: config.compression || false,
    };
    this.encoder = new TextEncoder();
  }

  /**
   * Create an SSE response for a request
   */
  async handleRequest(
    request: Request,
    handler: (transport: SSETransport) => Promise<void>
  ): Promise<Response> {
    const accept = request.headers.get('Accept');

    // Check if client accepts SSE
    if (!accept?.includes('text/event-stream')) {
      return new Response('SSE not supported', { status: 406 });
    }

    // Create a transform stream for SSE
    const { readable, writable } = new TransformStream();
    this.writer = writable.getWriter();

    // Start the SSE stream
    await this.start();

    // Process the request asynchronously
    handler(this).catch(error => {
      this.logger.error('SSE handler error', error);
      this.close();
    });

    // Return SSE response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  /**
   * Start the SSE stream
   */
  async start(): Promise<void> {
    if (this.active) return;

    this.active = true;

    // Send initial retry configuration
    if (this.config.retryInterval) {
      await this.writeRaw(`retry: ${this.config.retryInterval}\n\n`);
    }

    // Start keep-alive timer
    this.startKeepAlive();

    // Send connection established event
    await this.send({
      event: 'connection',
      data: {
        status: 'connected',
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Send a single event
   */
  async send(event: StreamingEvent): Promise<void> {
    if (!this.active || !this.writer) {
      throw new Error('SSE transport not active');
    }

    const id = ++this.eventId;
    let message = '';

    // Add event ID
    message += `id: ${id}\n`;

    // Add event type
    if (event.event) {
      message += `event: ${event.event}\n`;
    }

    // Add retry interval if specified
    if (event.retry) {
      message += `retry: ${event.retry}\n`;
    }

    // Add data (can be multi-line)
    const dataStr = JSON.stringify(event.data);
    const dataLines = dataStr.split('\n');
    for (const line of dataLines) {
      message += `data: ${line}\n`;
    }

    // End with double newline
    message += '\n';

    await this.writeRaw(message);
  }

  /**
   * Send multiple events as a batch
   */
  async sendBatch(events: StreamingEvent[]): Promise<void> {
    for (const event of events) {
      await this.send(event);
    }
  }

  /**
   * Close the SSE stream
   */
  async close(code?: number, reason?: string): Promise<void> {
    if (!this.active) return;

    // Stop keep-alive timer
    this.stopKeepAlive();

    // Send disconnection event
    try {
      await this.send({
        event: 'connection',
        data: {
          status: 'disconnected',
          reason: reason || 'Stream closed',
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      // Ignore errors during close
    }

    // Close the writer
    if (this.writer) {
      try {
        await this.writer.close();
      } catch (error) {
        // Ignore close errors
      }
      this.writer = null;
    }

    this.active = false;
  }

  /**
   * Check if the transport is active
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Write raw data to the stream
   */
  private async writeRaw(data: string): Promise<void> {
    if (!this.writer) {
      throw new Error('No writer available');
    }

    try {
      await this.writer.write(this.encoder.encode(data));
    } catch (error) {
      console.error('Write error:', error);
      this.active = false;
      throw error;
    }
  }

  /**
   * Start keep-alive timer
   */
  private startKeepAlive(): void {
    if (!this.config.keepAliveInterval) return;

    this.keepAliveTimer = setInterval(() => {
      if (this.active) {
        this.send({
          event: 'heartbeat',
          data: {
            timestamp: Date.now(),
          },
        }).catch(error => {
          console.error('Keep-alive error:', error);
          this.close();
        });
      }
    }, this.config.keepAliveInterval) as unknown as number;
  }

  /**
   * Stop keep-alive timer
   */
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = undefined;
    }
  }

  /**
   * Stream progress for a long-running operation
   */
  async streamProgress<T>(
    operation: string,
    sessionId: string,
    task: (reporter: ProgressReporter) => Promise<T>
  ): Promise<T> {
    let currentStep = 0;
    let totalSteps = 100;
    let metadata: any = {};

    const reporter: ProgressReporter = {
      update: (current: number, total: number, meta?: any) => {
        currentStep = current;
        totalSteps = total;
        if (meta) metadata = meta;

        // Send progress event
        this.send({
          event: 'progress',
          data: {
            operation,
            sessionId,
            currentStep,
            totalSteps,
            percentComplete: (current / total) * 100,
            metadata,
          },
        }).catch(console.error);
      },

      getCurrent: () => ({
        step: currentStep,
        total: totalSteps,
        percent: (currentStep / totalSteps) * 100,
        metadata,
      }),

      complete: () => {
        reporter.update(totalSteps, totalSteps, { status: 'complete' });
      },

      fail: (error: Error) => {
        this.send({
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
      // Send start event
      await this.send({
        event: 'progress',
        data: {
          operation,
          sessionId,
          currentStep: 0,
          totalSteps,
          percentComplete: 0,
          metadata: { status: 'starting' },
        },
      });

      // Execute the task
      const result = await task(reporter);

      // Send completion
      reporter.complete();

      return result;
    } catch (error) {
      reporter.fail(error as Error);
      throw error;
    }
  }

  /**
   * Send formatted visual output
   */
  async sendVisualOutput(
    type: 'header' | 'progress' | 'content' | 'footer' | 'divider',
    content: string,
    style?: {
      color?: string;
      bold?: boolean;
      icon?: string;
    }
  ): Promise<void> {
    await this.send({
      event: 'visual',
      data: {
        type,
        style,
        content,
      },
    });
  }
}

/**
 * SSE Buffer for batching events
 */
export class SSEBuffer implements StreamBuffer {
  private buffer: StreamingEvent[] = [];
  private transport: SSETransport;
  private flushInterval: number;
  private flushTimer?: number;
  private maxSize: number;

  constructor(transport: SSETransport, flushInterval = 50, maxSize = 100) {
    this.transport = transport;
    this.flushInterval = flushInterval;
    this.maxSize = maxSize;
    this.scheduleFlush();
  }

  add(event: StreamingEvent): void {
    this.buffer.push(event);

    // Immediate flush for high priority or buffer full
    if (event.priority === 'high' || this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0);
    await this.transport.sendBatch(events);

    // Reschedule flush
    this.scheduleFlush();
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush().catch(console.error);
    }, this.flushInterval) as unknown as number;
  }
}
