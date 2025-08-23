/**
 * MCP Sampling Types
 *
 * Defines types for server-to-client LLM sampling requests
 * Based on MCP Sampling specification
 */

/**
 * Message role in a conversation
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * A message in the sampling conversation
 */
export interface SamplingMessage {
  role: MessageRole;
  content: string;
}

/**
 * Model preferences for sampling requests
 */
export interface ModelPreferences {
  /**
   * Hints about desired model characteristics
   */
  hints?: string[];

  /**
   * Priority for cost optimization (0-1)
   * 0 = cost doesn't matter, 1 = minimize cost
   */
  costPriority?: number;

  /**
   * Priority for speed (0-1)
   * 0 = speed doesn't matter, 1 = maximize speed
   */
  speedPriority?: number;

  /**
   * Priority for intelligence/capability (0-1)
   * 0 = basic model ok, 1 = most capable model
   */
  intelligencePriority?: number;
}

/**
 * Context inclusion options
 */
export type ContextInclusion = 'none' | 'thisServer' | 'allServers';

/**
 * Sampling request parameters
 */
export interface SamplingRequest {
  /**
   * The conversation messages
   */
  messages: SamplingMessage[];

  /**
   * Optional model selection preferences
   */
  modelPreferences?: ModelPreferences;

  /**
   * Optional system prompt override
   */
  systemPrompt?: string;

  /**
   * What context to include from MCP servers
   */
  includeContext?: ContextInclusion;

  /**
   * Temperature for randomness (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Stop sequences to end generation
   */
  stopSequences?: string[];

  /**
   * Additional metadata for the request
   */
  metadata?: Record<string, unknown>;
}

/**
 * Model information in sampling response
 */
export interface ModelInfo {
  /**
   * The model identifier used
   */
  modelId?: string;

  /**
   * The model provider (e.g., "openai", "anthropic")
   */
  provider?: string;

  /**
   * Tokens used in the prompt
   */
  promptTokens?: number;

  /**
   * Tokens generated in the completion
   */
  completionTokens?: number;

  /**
   * Total tokens used
   */
  totalTokens?: number;
}

/**
 * Sampling result from client
 */
export interface SamplingResult {
  /**
   * The generated text
   */
  text: string;

  /**
   * Information about the model used
   */
  model?: ModelInfo;

  /**
   * The role of the generated message
   */
  role?: MessageRole;

  /**
   * Additional metadata in the response
   */
  metadata?: Record<string, unknown>;
}

/**
 * Sampling error response
 */
export interface SamplingError {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Additional error details
   */
  details?: Record<string, unknown>;
}

/**
 * Pending sampling request tracking
 */
export interface PendingSamplingRequest {
  requestId: string;
  request: SamplingRequest;
  feature?: string;
  timestamp: number;
  timeout?: NodeJS.Timeout;
  resolve: (result: SamplingResult) => void;
  reject: (error: SamplingError) => void;
}

/**
 * Sampling capability reported by client
 */
export interface SamplingCapability {
  /**
   * Whether sampling is supported
   */
  supported: boolean;

  /**
   * Available model providers
   */
  providers?: string[];

  /**
   * Default model preferences
   */
  defaultPreferences?: ModelPreferences;

  /**
   * Maximum tokens supported
   */
  maxTokens?: number;
}

/**
 * Statistics for sampling usage
 */
export interface SamplingStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  averageResponseTime: number;
  requestsByFeature: Record<string, number>;
}

/**
 * Sampling notification types for real-time updates
 */
export interface SamplingNotification {
  type: 'started' | 'progress' | 'completed' | 'failed';
  requestId: string;
  timestamp: number;
  data?: any;
}
