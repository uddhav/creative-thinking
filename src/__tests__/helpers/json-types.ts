/**
 * Helper types for JSON parsing in tests
 * Provides type-safe parsing utilities to avoid 'any' type issues
 */

import type { ErrorCode } from '../../errors/types.js';
import type { DiscoverTechniquesOutput, PlanThinkingSessionOutput } from '../../types/planning.js';
import type { ExecuteThinkingStepOutput } from '../../layers/execution.js';

// Error response types
export interface ErrorResponse {
  error: {
    code?: string;
    message: string;
    details?: Record<string, unknown>;
    layer?: string;
    timestamp?: string;
  };
}

// Success response types
export interface SuccessResponse<T = unknown> {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

// Type-safe JSON parsing utilities
export function parseErrorResponse(text: string): ErrorResponse {
  return JSON.parse(text) as ErrorResponse;
}

export function parseDiscoveryResponse(text: string): DiscoverTechniquesOutput {
  return JSON.parse(text) as DiscoverTechniquesOutput;
}

export function parsePlanningResponse(text: string): PlanThinkingSessionOutput {
  return JSON.parse(text) as PlanThinkingSessionOutput;
}

export function parseExecutionResponse(text: string): ExecuteThinkingStepOutput {
  return JSON.parse(text) as ExecuteThinkingStepOutput;
}

export function parseGenericResponse<T = unknown>(text: string): T {
  return JSON.parse(text) as T;
}

// Specific parsing functions for test types
export function parseComplexObject(text: string): TestComplexObject {
  return JSON.parse(text) as TestComplexObject;
}

export function parsePlanningTestResponse(text: string): TestPlanningResponse {
  return JSON.parse(text) as TestPlanningResponse;
}

export function parseExecutionTestResponse(text: string): TestExecutionResponse {
  return JSON.parse(text) as TestExecutionResponse;
}

export function parseSessionOperationResponse(text: string): TestSessionOperationResponse {
  return JSON.parse(text) as TestSessionOperationResponse;
}

// Common test response types
export interface TestErrorData {
  error: {
    code: ErrorCode;
    message: string;
    details: { detail: string };
    layer: string;
    timestamp: string;
  };
}

// Complex object type for testing
export interface TestComplexObject {
  level1: {
    level2: {
      array: Array<number | { nested: boolean }>;
      value: string;
    };
  };
}

// Planning response type
export interface TestPlanningResponse {
  planId: string;
  workflow: Array<{
    stepNumber: number;
    technique: string;
    description: string;
    expectedDuration: string;
    riskConsiderations: string[];
    totalSteps: number;
    expectedOutputs: string[];
  }>;
  estimatedSteps: number;
  estimatedDuration?: string;
  objectives?: string[];
}

// Execution response type
export interface TestExecutionResponse {
  sessionId: string;
  technique: string;
  currentStep: number;
  insights?: string[];
  hatColor?: string;
  risks?: string[];
  nextStepGuidance?: string;
  historyLength?: number;
  scamperAction?: string;
  pathImpact?: {
    reversibilityCost: number;
    dependencyChains: string[];
    flexibilityChange: number;
  };
  flexibilityScore?: number;
  alternativeSuggestions?: string[];
  isRevision?: boolean;
  revisesStep?: number;
  branchFromStep?: number;
  branchId?: string;
  provocation?: string;
  principles?: string[];
  randomStimulus?: string;
  connections?: string[];
  dominantNetwork?: string;
  suppressionDepth?: number;
  failureModes?: string[];
  mitigations?: string[];
  antifragileProperties?: string[];
  blackSwans?: string[];
}

// Session operation response
export interface TestSessionOperationResponse {
  operation: string;
  success: boolean;
  result: {
    sessionId: string;
    [key: string]: unknown;
  };
}

export interface TestPlanData {
  planId: string;
  sessionId: string;
  workflow: unknown;
  problem: string;
  objectives?: string[];
  constraints?: string[];
  timeframe?: string;
  includeOptions?: boolean;
}

export interface TestExecutionData {
  output: string;
  currentStep: number;
  totalSteps: number;
  nextStepNeeded: boolean;
  technique?: string;
  sessionId?: string;
  insights?: string[];
}
