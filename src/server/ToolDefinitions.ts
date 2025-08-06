/**
 * ToolDefinitions - MCP tool definitions for the creative thinking server
 * Extracted from index.ts to improve maintainability
 */

import type { Tool } from '../types/index.js';

export const DISCOVER_TECHNIQUES_TOOL: Tool = {
  name: 'discover_techniques',
  description:
    'STEP 1 of 3: Analyzes a problem and recommends appropriate lateral thinking techniques. This is the FIRST tool you must call when starting any creative thinking session. Returns recommendations and available techniques that can be used in the next step. MANDATORY PARAMETER: You MUST provide the "problem" parameter as a string describing the challenge to solve. DO NOT call this with an empty object {}. Example: {"problem": "How to improve team communication"}',
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description:
          'REQUIRED: The problem or challenge to solve. This parameter is MANDATORY and must be a non-empty string.',
      },
      context: {
        type: 'string',
        description: 'Additional context about the situation',
      },
      preferredOutcome: {
        type: 'string',
        enum: ['innovative', 'systematic', 'risk-aware', 'collaborative', 'analytical'],
        description: 'The type of solution preferred',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Any constraints or limitations to consider',
      },
    },
    required: ['problem'],
  },
};

export const PLAN_THINKING_SESSION_TOOL: Tool = {
  name: 'plan_thinking_session',
  description:
    'STEP 2 of 3: Creates a structured workflow for applying lateral thinking techniques. This tool MUST be called AFTER discover_techniques and BEFORE execute_thinking_step. Returns a planId that is REQUIRED for the execution step. MANDATORY PARAMETERS: "problem" (string) and "techniques" (array of strings). Valid techniques: six_hats, po, random_entry, scamper, concept_extraction, yes_and, design_thinking, triz, neural_state, temporal_work, cross_cultural, collective_intel, disney_method, nine_windows, convergence. Example: {"problem": "How to reduce costs", "techniques": ["six_hats", "scamper"]}',
  inputSchema: {
    type: 'object',
    properties: {
      problem: {
        type: 'string',
        description:
          'REQUIRED: The problem to solve. Must match the problem from discover_techniques.',
      },
      techniques: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'six_hats',
            'po',
            'random_entry',
            'scamper',
            'concept_extraction',
            'yes_and',
            'design_thinking',
            'triz',
            'neural_state',
            'temporal_work',
            'cross_cultural',
            'collective_intel',
            'disney_method',
            'nine_windows',
            'convergence',
          ],
        },
        description:
          'REQUIRED: Array of technique names to execute. Each technique will have multiple steps that MUST ALL be completed.',
      },
      objectives: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific objectives for this session',
      },
      constraints: {
        type: 'array',
        items: { type: 'string' },
        description: 'Constraints to work within',
      },
      timeframe: {
        type: 'string',
        enum: ['quick', 'thorough', 'comprehensive'],
        description: 'How much time/depth to invest',
      },
      executionMode: {
        type: 'string',
        enum: ['sequential', 'parallel', 'auto'],
        description:
          'How to execute techniques: sequential (one after another), parallel (simultaneously), auto (let system decide)',
        default: 'sequential',
      },
      maxParallelism: {
        type: 'number',
        description: 'Maximum number of techniques to run in parallel (1-10)',
        minimum: 1,
        maximum: 10,
        default: 3,
      },
    },
    required: ['problem', 'techniques'],
  },
};

export const EXECUTE_THINKING_STEP_TOOL: Tool = {
  name: 'execute_thinking_step',
  description:
    'STEP 3 of 3: Executes a single step in the lateral thinking process. CRITICAL: You MUST execute EVERY SINGLE STEP for EACH technique in the plan. DO NOT skip any steps - each step builds on previous insights. Steps must be executed sequentially (1, 2, 3, etc.) without gaps. WARNING: This tool REQUIRES a valid planId from plan_thinking_session. The workflow is: 1) discover_techniques, 2) plan_thinking_session (get planId), 3) execute_thinking_step repeatedly until ALL steps are complete. Set nextStepNeeded=true until the FINAL step of the FINAL technique. MANDATORY PARAMETERS: planId, technique, problem, currentStep, totalSteps, output, nextStepNeeded.',
  inputSchema: {
    type: 'object',
    properties: {
      planId: {
        type: 'string',
        description: 'REQUIRED: The planId returned from plan_thinking_session. Must be provided.',
      },
      sessionId: { type: 'string' },
      technique: {
        type: 'string',
        description: 'REQUIRED: The current technique being executed from the plan.',
      },
      problem: {
        type: 'string',
        description: 'REQUIRED: The problem being solved. Must match previous calls.',
      },
      currentStep: {
        type: 'number',
        description: 'REQUIRED: Current step number (1-based). Must be sequential without gaps.',
      },
      totalSteps: {
        type: 'number',
        description: 'REQUIRED: Total number of steps for this technique.',
      },
      output: {
        type: 'string',
        description:
          'REQUIRED: The thinking output for this step. Must contain substantive analysis.',
      },
      nextStepNeeded: {
        type: 'boolean',
        description:
          'REQUIRED: Set to true unless this is the FINAL step of the FINAL technique. Critical for completion.',
      },
      autoSave: {
        type: 'boolean',
        description: 'Whether to automatically save the session after this step',
      },
      // Six Hats specific
      hatColor: {
        type: 'string',
        enum: ['blue', 'white', 'red', 'yellow', 'black', 'green'],
      },
      // PO specific
      provocation: { type: 'string' },
      principles: { type: 'array', items: { type: 'string' } },
      // Random Entry specific
      randomStimulus: { type: 'string' },
      connections: { type: 'array', items: { type: 'string' } },
      // SCAMPER specific
      scamperAction: {
        type: 'string',
        enum: [
          'substitute',
          'combine',
          'adapt',
          'modify',
          'put_to_other_use',
          'eliminate',
          'reverse',
          'parameterize',
        ],
      },
      modifications: { type: 'array', items: { type: 'string' } },
      pathImpact: { type: 'object' },
      // Concept Extraction specific
      successExample: { type: 'string' },
      extractedConcepts: { type: 'array', items: { type: 'string' } },
      abstractedPatterns: { type: 'array', items: { type: 'string' } },
      applications: { type: 'array', items: { type: 'string' } },
      // Yes, And... specific
      initialIdea: { type: 'string' },
      additions: { type: 'array', items: { type: 'string' } },
      evaluations: { type: 'array', items: { type: 'string' } },
      synthesis: { type: 'string' },
      // Design Thinking specific
      designStage: {
        type: 'string',
        enum: ['empathize', 'define', 'ideate', 'prototype', 'test'],
      },
      empathyInsights: { type: 'array', items: { type: 'string' } },
      problemStatement: { type: 'string' },
      ideaList: { type: 'array', items: { type: 'string' } },
      prototypeDescription: { type: 'string' },
      userFeedback: { type: 'array', items: { type: 'string' } },
      // TRIZ specific
      contradiction: { type: 'string' },
      inventivePrinciples: { type: 'array', items: { type: 'string' } },
      minimalSolution: { type: 'string' },
      // Neural State specific
      dominantNetwork: { type: 'string', enum: ['dmn', 'ecn'] },
      suppressionDepth: { type: 'number', minimum: 0, maximum: 10 },
      switchingRhythm: { type: 'array', items: { type: 'string' } },
      integrationInsights: { type: 'array', items: { type: 'string' } },
      // Temporal Work specific
      temporalLandscape: { type: 'object' },
      circadianAlignment: { type: 'array', items: { type: 'string' } },
      pressureTransformation: { type: 'array', items: { type: 'string' } },
      asyncSyncBalance: { type: 'array', items: { type: 'string' } },
      temporalEscapeRoutes: { type: 'array', items: { type: 'string' } },
      // Cross-Cultural specific
      culturalFrameworks: { type: 'array', items: { type: 'string' } },
      bridgeBuilding: { type: 'array', items: { type: 'string' } },
      respectfulSynthesis: { type: 'array', items: { type: 'string' } },
      parallelPaths: { type: 'array', items: { type: 'string' } },
      // Collective Intelligence specific
      wisdomSources: { type: 'array', items: { type: 'string' } },
      emergentPatterns: { type: 'array', items: { type: 'string' } },
      synergyCombinations: { type: 'array', items: { type: 'string' } },
      collectiveInsights: { type: 'array', items: { type: 'string' } },
      // Disney Method specific
      disneyRole: {
        type: 'string',
        enum: ['dreamer', 'realist', 'critic'],
      },
      dreamerVision: { type: 'array', items: { type: 'string' } },
      realistPlan: { type: 'array', items: { type: 'string' } },
      criticRisks: { type: 'array', items: { type: 'string' } },
      // Nine Windows specific
      nineWindowsMatrix: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            timeFrame: { type: 'string', enum: ['past', 'present', 'future'] },
            systemLevel: { type: 'string', enum: ['sub-system', 'system', 'super-system'] },
            content: { type: 'string' },
            pathDependencies: { type: 'array', items: { type: 'string' } },
            irreversible: { type: 'boolean' },
          },
        },
      },
      currentCell: {
        type: 'object',
        properties: {
          timeFrame: { type: 'string', enum: ['past', 'present', 'future'] },
          systemLevel: { type: 'string', enum: ['sub-system', 'system', 'super-system'] },
        },
      },
      interdependencies: { type: 'array', items: { type: 'string' } },
      // Risk/Adversarial fields (unified framework)
      risks: { type: 'array', items: { type: 'string' } },
      failureModes: { type: 'array', items: { type: 'string' } },
      mitigations: { type: 'array', items: { type: 'string' } },
      antifragileProperties: { type: 'array', items: { type: 'string' } },
      blackSwans: { type: 'array', items: { type: 'string' } },
      failureInsights: { type: 'array', items: { type: 'string' } },
      stressTestResults: { type: 'array', items: { type: 'string' } },
      failureModesPredicted: { type: 'array', items: { type: 'string' } },
      viaNegativaRemovals: { type: 'array', items: { type: 'string' } },
      // Revision support
      isRevision: { type: 'boolean' },
      revisesStep: { type: 'number' },
      branchFromStep: { type: 'number' },
      branchId: { type: 'string' },
      flexibilityScore: { type: 'number', minimum: 0, maximum: 1 },
      alternativeSuggestions: { type: 'array', items: { type: 'string' } },
      // Convergence technique specific
      parallelResults: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            planId: { type: 'string' },
            technique: { type: 'string' },
            results: { type: 'object' },
            insights: { type: 'array', items: { type: 'string' } },
            metrics: { type: 'object' },
          },
        },
        description:
          'Results from parallel technique executions to synthesize (convergence technique only)',
      },
      convergenceStrategy: {
        type: 'string',
        enum: ['merge', 'select', 'hierarchical'],
        description:
          'How to synthesize parallel results: merge (combine all), select (choose best), hierarchical (organize by importance)',
      },
    },
    required: [
      'planId',
      'technique',
      'problem',
      'currentStep',
      'totalSteps',
      'output',
      'nextStepNeeded',
    ],
  },
};

/**
 * Get all tool definitions
 */
export function getAllTools(): Tool[] {
  return [DISCOVER_TECHNIQUES_TOOL, PLAN_THINKING_SESSION_TOOL, EXECUTE_THINKING_STEP_TOOL];
}
