/**
 * Constants for complexity analysis
 */

// Complexity level thresholds based on factor count
export const COMPLEXITY_THRESHOLDS = {
  DISCOVERY: {
    HIGH: 4,    // 4+ complexity factors
    MEDIUM: 2,  // 2-3 complexity factors
  },
  EXECUTION: {
    HIGH: 3,    // 3+ complexity factors during execution
    MEDIUM: 1,  // 1-2 complexity factors
  },
} as const;

// Confidence thresholds for determining analysis method
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,   // Use local analysis only
  MEDIUM: 0.7,  // Consider using MCP sampling
  LOW: 0.5,     // Definitely use MCP sampling if available
} as const;

// NLP analysis thresholds
export const NLP_THRESHOLDS = {
  SENTENCE_LENGTH: {
    COMPLEX: 25,   // Very long sentences
    MODERATE: 15,  // Moderately long sentences
  },
  ENTITY_COUNT: {
    MANY: 5,      // Many entities indicate complexity
    SOME: 3,      // Some entities
  },
  WORD_COUNT: {
    MIN: 10,      // Minimum words for meaningful analysis
    MAX: 500,     // Maximum before truncation
  },
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  MAX_SIZE: 100,           // Maximum cache entries
  TTL_MS: 60 * 60 * 1000, // 1 hour TTL
} as const;

// MCP Sampling configuration
export const SAMPLING_CONFIG = {
  MAX_TOKENS: 200,
  MODEL_HINTS: [{ name: 'claude-3-haiku-20240307' }],
  SPEED_PRIORITY: 0.8,
  INTELLIGENCE_PRIORITY: 0.6,
  TIMEOUT_MS: 5000, // 5 second timeout
} as const;

// Complexity factor patterns for NLP detection
export const COMPLEXITY_PATTERNS = {
  INTERACTION: {
    keywords: ['interact', 'interconnect', 'depend', 'connect', 'influence', 'affect', 'relate'],
    requiresContext: ['multiple'],
  },
  CONFLICT: {
    keywords: ['conflict', 'compete', 'contradict', 'oppose', 'tension', 'versus', 'conflicting'],
    requiresContext: [],
  },
  UNCERTAINTY: {
    keywords: ['uncertain', 'uncertainty', 'dynamic', 'chang', 'evolv', 'unclear', 'ambiguous'],
    requiresContext: [],
  },
  STAKEHOLDER: {
    keywords: ['stakeholder', 'stakeholders', 'user', 'customer', 'team', 'department'],
    requiresContext: ['multiple', 'diverse', 'various'],
  },
  SYSTEM: {
    keywords: ['system', 'systems', 'ecosystem', 'complex', 'architecture', 'infrastructure'],
    requiresContext: [],
  },
  TIME_PRESSURE: {
    keywords: ['deadline', 'urgent', 'asap', 'immediate', 'time pressure', 'tight'],
    requiresContext: [],
  },
} as const;