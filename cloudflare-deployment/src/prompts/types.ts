/**
 * MCP Prompts Type Definitions
 *
 * Defines the types and interfaces for the MCP Prompts implementation
 */

import type { z } from 'zod';

/**
 * Prompt argument definition
 */
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

/**
 * Content block types for prompt messages (MCP compliant)
 */
export type TextContent = {
  type: 'text';
  text: string;
};

export type ImageContent = {
  type: 'image';
  data: string;
  mimeType: string;
};

export type ResourceContent = {
  type: 'resource';
  resource: {
    uri: string;
    text?: string;
  };
};

export type ToolUseContent = {
  type: 'tool_use';
  toolUse: {
    toolName: string;
    arguments: Record<string, any>;
  };
};

export type PromptContent = TextContent | ImageContent | ResourceContent | ToolUseContent;

/**
 * Prompt message structure (simplified for internal use)
 */
export interface PromptMessage {
  role: 'user' | 'assistant';
  content: TextContent | PromptContent[];
}

/**
 * Result returned by a prompt
 */
export interface PromptResult {
  description?: string;
  messages: PromptMessage[];
}

/**
 * Base interface for prompt implementations
 */
export interface IPrompt<TArgs = any> {
  name: string;
  description: string;
  arguments?: PromptArgument[];
  generate(args: TArgs): Promise<PromptResult>;
}

/**
 * Prompt registration configuration
 */
export interface PromptConfig<TArgs = any> {
  name: string;
  title?: string;
  description?: string;
  argsSchema?: z.ZodSchema<TArgs>;
  handler: (args: TArgs) => Promise<PromptResult>;
}

/**
 * Workshop prompt arguments
 */
export interface WorkshopArgs {
  topic: string;
  duration?: number;
  participants?: string;
  objectives?: string[];
}

/**
 * Problem solver prompt arguments
 */
export interface ProblemSolverArgs {
  problem: string;
  context?: string;
  desired_outcome?: string;
}

/**
 * Innovation sprint prompt arguments
 */
export interface InnovationSprintArgs {
  challenge: string;
  constraints?: string[];
  timeframe?: string;
}

/**
 * Technique selector prompt arguments
 */
export interface TechniqueSelectorArgs {
  situation: string;
  preferences?: string;
}

/**
 * Risk assessment prompt arguments
 */
export interface RiskAssessmentArgs {
  idea: string;
  context?: string;
  risk_tolerance?: string;
}

/**
 * Flexibility check prompt arguments
 */
export interface FlexibilityCheckArgs {
  current_state: string;
  commitments?: string[];
}

/**
 * Session review prompt arguments
 */
export interface SessionReviewArgs {
  session_id?: string;
  focus_areas?: string[];
}

/**
 * Technique mastery prompt arguments
 */
export interface TechniqueMasteryArgs {
  technique: string;
  experience_level?: string;
}

/**
 * Problem analysis result
 */
export interface ProblemAnalysis {
  type: 'technical' | 'creative' | 'strategic' | 'operational' | 'interpersonal';
  complexity: 'simple' | 'moderate' | 'complex';
  recommendedTechniques: string[];
  estimatedDuration: number;
  keyConsiderations: string[];
}

/**
 * Prompt categories for organization
 */
export enum PromptCategory {
  WORKSHOP = 'workshop',
  PROBLEM_SOLVING = 'problem_solving',
  ANALYSIS = 'analysis',
  LEARNING = 'learning',
}

/**
 * Prompt metadata for discovery
 */
export interface PromptMetadata {
  name: string;
  category: PromptCategory;
  description: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime?: string;
  prerequisites?: string[];
}
