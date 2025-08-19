/**
 * Client SDK Models
 *
 * Data models for the Creative Thinking MCP Server
 */

/**
 * Thinking technique
 */
export interface Technique {
  name: string;
  category: string;
  description: string;
  stepCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeEstimate: string;
  tags: string[];
}

/**
 * Technique step
 */
export interface TechniqueStep {
  technique: string;
  stepNumber: number;
  totalSteps: number;
  output: string;
  metadata?: Record<string, any>;
  nextStepNeeded: boolean;
}

/**
 * Session state
 */
export interface SessionState {
  id: string;
  planId?: string;
  problem: string;
  currentTechnique?: string;
  currentStep?: number;
  techniques: string[];
  completedTechniques: string[];
  ideas: string[];
  insights: string[];
  risks: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

/**
 * Session
 */
export interface Session {
  id: string;
  state: SessionState;
  history: TechniqueStep[];
  metrics: SessionMetrics;
}

/**
 * Session metrics
 */
export interface SessionMetrics {
  totalSteps: number;
  completedSteps: number;
  ideasGenerated: number;
  techniquesUsed: number;
  flexibilityScore: number;
  riskScore: number;
  timeElapsed: number;
}

/**
 * Discovery result
 */
export interface DiscoveryResult {
  problem: string;
  analysis: {
    type: string;
    complexity: string;
    domain: string;
    constraints: string[];
  };
  recommendations: {
    techniques: TechniqueRecommendation[];
    approach: string;
    estimatedTime: string;
  };
  availableTechniques: Technique[];
}

/**
 * Technique recommendation
 */
export interface TechniqueRecommendation {
  name: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  expectedOutcome: string;
}

/**
 * Planning result
 */
export interface PlanningResult {
  planId: string;
  problem: string;
  techniques: string[];
  workflow: WorkflowStep[];
  estimatedDuration: number;
  executionMode: 'sequential' | 'parallel' | 'auto';
  metadata?: Record<string, any>;
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  order: number;
  technique: string;
  description: string;
  expectedOutputs: string[];
  dependencies?: number[];
}

/**
 * Execution result
 */
export interface ExecutionResult {
  planId: string;
  technique: string;
  currentStep: number;
  totalSteps: number;
  output: string;
  nextStepNeeded: boolean;
  sessionUpdate?: Partial<SessionState>;
  insights?: string[];
  ideas?: string[];
  risks?: string[];
  metadata?: Record<string, any>;
}

/**
 * Resource descriptor
 */
export interface Resource {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
}

/**
 * Resource content
 */
export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: Uint8Array;
  metadata?: Record<string, any>;
}

/**
 * Prompt descriptor
 */
export interface Prompt {
  name: string;
  description: string;
  arguments: PromptArgument[];
}

/**
 * Prompt argument
 */
export interface PromptArgument {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  default?: any;
}

/**
 * Prompt result
 */
export interface PromptResult {
  description: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Tool descriptor
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

/**
 * Tool result
 */
export interface ToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
  }>;
}

/**
 * Error response
 */
export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp?: string;
  requestId?: string;
}
