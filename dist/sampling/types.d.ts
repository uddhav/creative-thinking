/**
 * MCP Sampling Types
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
     * Model identifier
     */
    id: string;
    /**
     * Model provider
     */
    provider?: string;
    /**
     * Model name
     */
    name?: string;
}
/**
 * Sampling result from client
 */
export interface SamplingResult {
    /**
     * The generated content
     */
    content: string;
    /**
     * Model used for generation
     */
    model?: ModelInfo;
    /**
     * Tokens used in prompt
     */
    promptTokens?: number;
    /**
     * Tokens in completion
     */
    completionTokens?: number;
    /**
     * Total tokens used
     */
    totalTokens?: number;
    /**
     * Stop reason
     */
    stopReason?: 'stop' | 'length' | 'stop_sequence' | 'error';
    /**
     * Additional metadata from response
     */
    metadata?: Record<string, unknown>;
}
/**
 * Sampling error details
 */
export interface SamplingError {
    /**
     * Error code
     */
    code: 'model_not_available' | 'rate_limit_exceeded' | 'invalid_request' | 'unauthorized' | 'timeout' | 'server_error';
    /**
     * Human-readable error message
     */
    message: string;
    /**
     * Additional error details
     */
    details?: Record<string, unknown>;
}
/**
 * Enhanced idea result
 */
export interface EnhancedIdea {
    /**
     * Original idea
     */
    original: string;
    /**
     * Enhanced version
     */
    enhanced: string;
    /**
     * Additional features added
     */
    features?: string[];
    /**
     * Implementation considerations
     */
    implementation?: string[];
    /**
     * Unique value propositions
     */
    valueProps?: string[];
}
/**
 * Risk assessment result
 */
export interface RiskAssessment {
    /**
     * Identified risks
     */
    risks: Array<{
        /**
         * Risk description
         */
        description: string;
        /**
         * Severity level (1-5)
         */
        severity: number;
        /**
         * Likelihood (1-5)
         */
        likelihood: number;
        /**
         * Suggested mitigations
         */
        mitigations?: string[];
    }>;
    /**
     * Overall risk level
     */
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Session summary result
 */
export interface SessionSummary {
    /**
     * Key insights from session
     */
    insights: string[];
    /**
     * Best ideas generated
     */
    bestIdeas: Array<{
        idea: string;
        technique: string;
        score?: number;
    }>;
    /**
     * Identified risks and mitigations
     */
    risks?: RiskAssessment;
    /**
     * Recommended next steps
     */
    nextSteps: string[];
    /**
     * Patterns observed
     */
    patterns?: string[];
    /**
     * Action items
     */
    actionItems?: Array<{
        task: string;
        priority: 'low' | 'medium' | 'high';
        deadline?: string;
    }>;
}
/**
 * Technique recommendation result
 */
export interface TechniqueRecommendation {
    /**
     * Recommended technique
     */
    technique: string;
    /**
     * Reason for recommendation
     */
    reasoning: string;
    /**
     * Expected benefits
     */
    expectedBenefits: string[];
    /**
     * Alternative techniques
     */
    alternatives?: Array<{
        technique: string;
        reasoning: string;
    }>;
    /**
     * Confidence score (0-1)
     */
    confidence: number;
}
/**
 * Sampling capability from client
 */
export interface SamplingCapability {
    /**
     * Whether sampling is supported
     */
    supported: boolean;
    /**
     * Available models
     */
    models?: string[];
    /**
     * Maximum tokens supported
     */
    maxTokens?: number;
    /**
     * Rate limits
     */
    rateLimits?: {
        requestsPerMinute?: number;
        tokensPerMinute?: number;
    };
}
/**
 * Pending sampling request
 */
export interface PendingSamplingRequest {
    /**
     * Promise resolver
     */
    resolve: (result: SamplingResult) => void;
    /**
     * Promise rejector
     */
    reject: (error: Error | SamplingError) => void;
    /**
     * Request timestamp
     */
    timestamp: number;
    /**
     * Request timeout handle
     */
    timeoutHandle?: NodeJS.Timeout;
}
/**
 * Sampling statistics
 */
export interface SamplingStats {
    /**
     * Total requests made
     */
    totalRequests: number;
    /**
     * Successful requests
     */
    successfulRequests: number;
    /**
     * Failed requests
     */
    failedRequests: number;
    /**
     * Total tokens used
     */
    totalTokensUsed: number;
    /**
     * Average response time (ms)
     */
    averageResponseTime: number;
    /**
     * Requests by feature
     */
    requestsByFeature: Record<string, number>;
}
//# sourceMappingURL=types.d.ts.map