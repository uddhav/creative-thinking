/**
 * MCP Sampling Module
 * Exports all sampling-related functionality
 */

// Core
export { SamplingManager } from './SamplingManager.js';

// Features
export { IdeaEnhancer } from './features/IdeaEnhancer.js';
export { RiskGenerator } from './features/RiskGenerator.js';
export { SmartSummaryGenerator } from './features/SmartSummaryGenerator.js';
export { TechniqueRecommender } from './features/TechniqueRecommender.js';
export { AugmentedNLPService } from './features/AugmentedNLPService.js';

// Types
export type {
  // Core types
  MessageRole,
  SamplingMessage,
  ModelPreferences,
  ContextInclusion,
  SamplingRequest,
  ModelInfo,
  SamplingResult,
  SamplingError,
  SamplingCapability,
  SamplingStats,
  PendingSamplingRequest,

  // Feature types
  EnhancedIdea,
  RiskAssessment,
  SessionSummary,
  TechniqueRecommendation,
} from './types.js';

// Feature-specific types
export type { SessionData } from './features/SmartSummaryGenerator.js';
export type { SessionState } from './features/TechniqueRecommender.js';
export type {
  EnhancedSentiment,
  EnhancedIntent,
  SemanticUnderstanding,
  ReasoningAnalysis,
  AugmentedAnalysis,
} from './features/AugmentedNLPService.js';
