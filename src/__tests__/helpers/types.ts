/**
 * Type definitions for test helpers
 */

import type { LateralTechnique } from '../../index.js';

export interface TechniqueRecommendation {
  technique: LateralTechnique;
  score: number;
  reasoning: string;
}

export interface DiscoverTechniquesResponse {
  recommendations: TechniqueRecommendation[];
  reasoning: string;
  suggestedWorkflow?: string;
  flexibilityWarning?: {
    currentFlexibility: number;
    isLow: boolean;
    message: string;
  };
  generatedOptions?: {
    totalOptions: number;
    topOptions: Array<{
      name: string;
      description: string;
      strategy: string;
      flexibilityGain: number;
    }>;
  };
  escapeVelocityAnalysis?: {
    isEscapeNeeded: boolean;
    urgency: string;
    availableProtocols: string[];
    recommendation: string;
  };
  // Additional properties that may be present
  flexibilityScore?: number;
  optionGenerationRecommended?: boolean;
  recommendedTechniques?: LateralTechnique[];
}

export interface PlanThinkingSessionResponse {
  planId: string;
  workflow: Array<{
    stepNumber: number;
    technique: LateralTechnique;
    description: string;
    expectedDuration: string;
    riskConsiderations?: string[];
    totalSteps: number;
  }>;
  estimatedSteps: number;
  estimatedDuration: string;
  successCriteria: string[];
  createdAt: string;
}

export interface ExecuteThinkingStepResponse {
  sessionId: string;
  technique: LateralTechnique;
  problem: string;
  currentStep: number;
  nextStepGuidance?: string;
  nextStepNeeded: boolean;
  insights?: string[];
  summary?: string;
  pathImpact?: {
    commitmentLevel: string;
    reversibility: string;
    flexibilityImpact: number;
  };
  flexibilityScore?: number;
  // Additional properties that may be present in certain contexts
  guidance?: string;
  warning?: string;
  nextSteps?: string[];
  alternativeSuggestions?: string[];
  contextFromPreviousTechniques?: Record<string, unknown>;
}

export interface ServerResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export function parseServerResponse<T>(response: ServerResponse): T {
  if (response.isError) {
    throw new Error('Server returned error');
  }
  return safeJsonParse<T>(response.content[0].text, 'server response');
}

/**
 * Safely parse JSON with error handling
 * @param text - JSON string to parse
 * @param context - Optional context for error messages
 * @returns Parsed object or throws descriptive error
 */
export function safeJsonParse<T = unknown>(text: string, context?: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    const errorMessage = context
      ? `Failed to parse JSON in ${context}: ${error instanceof Error ? error.message : 'Unknown error'}`
      : `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`;
    throw new Error(errorMessage);
  }
}
