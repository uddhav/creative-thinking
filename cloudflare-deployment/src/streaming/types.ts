/**
 * Streaming Transport Types and Interfaces
 *
 * Defines the types for streaming architecture supporting both SSE and WebSocket
 */

/**
 * Base streaming event
 */
export interface StreamEvent {
  event: string;
  data: any;
  id?: string;
  retry?: number;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Progress event for long-running operations
 */
export interface ProgressEvent extends StreamEvent {
  event: 'progress';
  data: {
    operation: string;
    sessionId?: string;
    technique?: string;
    currentStep: number;
    totalSteps: number;
    percentComplete: number;
    estimatedTimeRemaining?: number; // seconds
    metadata?: Record<string, any>;
  };
}

/**
 * State change event for synchronization
 */
export interface StateChangeEvent extends StreamEvent {
  event: 'state_change';
  data: {
    sessionId: string;
    path: string[]; // JSON path to changed value
    oldValue: any;
    newValue: any;
    source: 'server' | 'client';
    timestamp: number;
  };
}

/**
 * Warning event for risk notifications
 */
export interface WarningEvent extends StreamEvent {
  event: 'warning';
  data: {
    level: 'SAFE' | 'CAUTION' | 'WARNING' | 'CRITICAL';
    type: 'flexibility' | 'ergodicity' | 'resource' | 'performance';
    message: string;
    details: Record<string, any>;
    suggestedActions?: string[];
  };
}

/**
 * Visual output event for rich terminal output
 */
export interface VisualOutputEvent extends StreamEvent {
  event: 'visual';
  data: {
    type: 'header' | 'progress' | 'content' | 'footer' | 'divider';
    style?: {
      color?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      icon?: string;
    };
    content: string | Record<string, any>;
  };
}

/**
 * Collaboration event for multi-user sessions
 */
export interface CollaborationEvent extends StreamEvent {
  event: 'collaboration';
  data: {
    userId: string;
    userName?: string;
    action: 'joined' | 'left' | 'added_idea' | 'modified' | 'commented';
    technique?: string;
    content?: any;
    timestamp: number;
  };
}

/**
 * Connection event for lifecycle management
 */
export interface ConnectionEvent extends StreamEvent {
  event: 'connection';
  data: {
    status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
    connectionId?: string;
    reason?: string;
    retryAfter?: number;
  };
}

/**
 * Heartbeat event for keeping connections alive
 */
export interface HeartbeatEvent extends StreamEvent {
  event: 'heartbeat' | 'ping' | 'pong';
  data: {
    timestamp: number;
    latency?: number;
  };
}

/**
 * All possible streaming events
 */
export type StreamingEvent =
  | ProgressEvent
  | StateChangeEvent
  | WarningEvent
  | VisualOutputEvent
  | CollaborationEvent
  | ConnectionEvent
  | HeartbeatEvent
  | StreamEvent;

/**
 * Streaming transport interface
 */
export interface StreamingTransport {
  /**
   * Start streaming
   */
  start(): Promise<void>;

  /**
   * Send an event
   */
  send(event: StreamingEvent): Promise<void>;

  /**
   * Send multiple events
   */
  sendBatch(events: StreamingEvent[]): Promise<void>;

  /**
   * Close the stream
   */
  close(code?: number, reason?: string): Promise<void>;

  /**
   * Check if streaming is active
   */
  isActive(): boolean;
}

/**
 * Connection context for WebSocket
 */
export interface ConnectionContext {
  request: Request;
  connectionId: string;
  clientIp?: string;
  headers: Headers;
}

/**
 * Connection state for WebSocket
 */
export interface ConnectionState {
  sessionId?: string;
  userId?: string;
  subscriptions: Set<string>;
  lastActivity: number;
  metadata?: Record<string, any>;
}

/**
 * Progress reporter for tracking long operations
 */
export interface ProgressReporter {
  /**
   * Update progress
   */
  update(current: number, total: number, metadata?: any): void;

  /**
   * Get current progress
   */
  getCurrent(): {
    step: number;
    total: number;
    percent: number;
    metadata?: any;
  };

  /**
   * Mark as complete
   */
  complete(): void;

  /**
   * Mark as failed
   */
  fail(error: Error): void;
}

/**
 * Stream buffer for batching events
 */
export interface StreamBuffer {
  /**
   * Add event to buffer
   */
  add(event: StreamingEvent): void;

  /**
   * Flush buffer immediately
   */
  flush(): Promise<void>;

  /**
   * Get buffer size
   */
  size(): number;

  /**
   * Clear buffer
   */
  clear(): void;
}

/**
 * Connection manager interface
 */
export interface ConnectionManager {
  /**
   * Add a new connection
   */
  addConnection(id: string, connection: any): Promise<void>;

  /**
   * Remove a connection
   */
  removeConnection(id: string): void;

  /**
   * Get a connection by ID
   */
  getConnection(id: string): any | undefined;

  /**
   * Get all connections
   */
  getAllConnections(): Map<string, any>;

  /**
   * Broadcast to all connections
   */
  broadcast(event: StreamingEvent, filter?: (conn: any) => boolean): Promise<void>;

  /**
   * Get connection count
   */
  getConnectionCount(): number;
}

/**
 * SSE-specific types
 */
export interface SSEConfig {
  keepAliveInterval?: number; // milliseconds
  retryInterval?: number; // milliseconds
  maxBufferSize?: number;
  compression?: boolean;
}

/**
 * WebSocket-specific types
 */
export interface WebSocketConfig {
  heartbeatInterval?: number; // milliseconds
  maxConnectionsPerUser?: number;
  maxMessageSize?: number;
  compression?: boolean;
}

/**
 * Streaming configuration
 */
export interface StreamingConfig {
  sse?: SSEConfig;
  websocket?: WebSocketConfig;
  bufferFlushInterval?: number;
  maxConcurrentConnections?: number;
  enableCollaboration?: boolean;
}
