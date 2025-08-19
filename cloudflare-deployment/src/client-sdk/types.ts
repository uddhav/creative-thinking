/**
 * Client SDK Types
 *
 * Core types for the Creative Thinking MCP Client SDK
 */

/**
 * Transport types supported by the client
 */
export type TransportType = 'http' | 'sse' | 'websocket' | 'mcp';

/**
 * Connection states
 */
export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Client configuration
 */
export interface ClientConfig {
  /**
   * Server URL
   */
  serverUrl: string;

  /**
   * Transport type to use
   */
  transport?: TransportType;

  /**
   * Authentication configuration
   */
  auth?: {
    type: 'api-key' | 'oauth' | 'basic';
    credentials: Record<string, string>;
  };

  /**
   * Retry configuration
   */
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  };

  /**
   * Timeout configuration
   */
  timeout?: {
    connect?: number;
    request?: number;
    idle?: number;
  };

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Custom headers to include
   */
  headers?: Record<string, string>;

  /**
   * Auto-reconnect on disconnect
   */
  autoReconnect?: boolean;

  /**
   * Enable streaming updates
   */
  enableStreaming?: boolean;

  /**
   * Enable AI sampling features
   */
  enableSampling?: boolean;
}

/**
 * Client options for individual requests
 */
export interface ClientOptions {
  /**
   * Request timeout override
   */
  timeout?: number;

  /**
   * Custom headers for this request
   */
  headers?: Record<string, string>;

  /**
   * Abort signal for cancellation
   */
  signal?: AbortSignal;

  /**
   * Retry this specific request
   */
  retry?: boolean;

  /**
   * Metadata to attach
   */
  metadata?: Record<string, any>;
}

/**
 * Event types emitted by the client
 */
export interface ClientEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason?: string) => void;
  reconnect: (attempt: number) => void;
  error: (error: Error) => void;

  // State events
  stateChange: (state: ConnectionState) => void;

  // Progress events
  progress: (event: ProgressEvent) => void;

  // Streaming events
  streamingEvent: (event: any) => void;

  // Session events
  sessionCreated: (sessionId: string) => void;
  sessionUpdated: (sessionId: string, update: any) => void;
  sessionDeleted: (sessionId: string) => void;

  // Technique events
  techniqueStarted: (technique: string, step: number) => void;
  techniqueProgress: (technique: string, step: number, total: number) => void;
  techniqueCompleted: (technique: string) => void;
  techniqueFailed: (technique: string, error: Error) => void;

  // Warning events
  warning: (level: string, message: string) => void;
}

/**
 * Error handler function
 */
export type ErrorHandler = (error: Error) => void;

/**
 * Event handler function
 */
export type EventHandler<T = any> = (data: T) => void;

/**
 * Progress event
 */
export interface ProgressEvent {
  operation: string;
  current: number;
  total: number;
  percent: number;
  metadata?: any;
}

/**
 * Request/Response interceptors
 */
export interface Interceptors {
  request?: {
    use: (handler: (config: any) => any | Promise<any>) => void;
    eject: (id: number) => void;
  };
  response?: {
    use: (
      onFulfilled?: (response: any) => any | Promise<any>,
      onRejected?: (error: any) => any | Promise<any>
    ) => void;
    eject: (id: number) => void;
  };
}

/**
 * Transport interface
 */
export interface Transport {
  /**
   * Connect to the server
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the server
   */
  disconnect(): Promise<void>;

  /**
   * Send a request
   */
  request<T = any>(method: string, params?: any, options?: ClientOptions): Promise<T>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get connection state
   */
  getState(): ConnectionState;

  /**
   * Subscribe to events
   */
  on<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void;

  /**
   * Unsubscribe from events
   */
  off<K extends keyof ClientEvents>(event: K, handler: ClientEvents[K]): void;

  /**
   * Emit an event
   */
  emit<K extends keyof ClientEvents>(event: K, ...args: Parameters<ClientEvents[K]>): void;
}

/**
 * Batch request
 */
export interface BatchRequest {
  id: string;
  method: string;
  params?: any;
}

/**
 * Batch response
 */
export interface BatchResponse {
  id: string;
  result?: any;
  error?: any;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Enable caching
   */
  enabled?: boolean;

  /**
   * Maximum cache size in bytes
   */
  maxSize?: number;

  /**
   * Default TTL in milliseconds
   */
  ttl?: number;

  /**
   * Cache storage type
   */
  storage?: 'memory' | 'localStorage' | 'sessionStorage';

  /**
   * Cache key prefix
   */
  prefix?: string;
}

/**
 * Metrics collected by the client
 */
export interface ClientMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageLatency: number;
  bytesReceived: number;
  bytesSent: number;
  connectionTime: number;
  reconnectCount: number;
  cacheHits: number;
  cacheMisses: number;
}
