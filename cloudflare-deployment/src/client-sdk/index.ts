/**
 * Creative Thinking MCP Client SDK
 *
 * A TypeScript/JavaScript SDK for interacting with the Creative Thinking MCP Server
 */

export { CreativeThinkingClient } from './CreativeThinkingClient.js';
export { StreamingClient } from './StreamingClient.js';
export { MCPTransport } from './transports/MCPTransport.js';
export { HTTPTransport } from './transports/HTTPTransport.js';
export { SSETransport } from './transports/SSETransport.js';
export { WebSocketTransport } from './transports/WebSocketTransport.js';

// Export types
export type {
  ClientConfig,
  ClientOptions,
  TransportType,
  ConnectionState,
  ClientEvents,
  ErrorHandler,
  EventHandler,
} from './types.js';

export type {
  Technique,
  TechniqueStep,
  Session,
  SessionState,
  PlanningResult,
  ExecutionResult,
  DiscoveryResult,
} from './models.js';

// Re-export streaming types
export type {
  StreamingEvent,
  ProgressEvent,
  StateChangeEvent,
  WarningEvent,
  VisualOutputEvent,
  CollaborationEvent,
} from '../streaming/types.js';

// Re-export sampling types
export type {
  SamplingRequest,
  SamplingResult,
  ModelPreferences,
  EnhancementOptions,
} from './sampling-types.js';
