/**
 * Helper utilities for integration tests
 */

import { expect } from 'vitest';
import type { LateralThinkingServer } from '../../index.js';
import type {
  LateralTechnique,
  ExecuteThinkingStepInput,
  SixHatsColor,
  ScamperAction,
  DesignThinkingStage,
} from '../../index.js';

/**
 * Create a session with a specified number of steps already executed
 */
export async function createSessionWithSteps(
  server: LateralThinkingServer,
  technique: LateralTechnique,
  stepCount: number,
  problem: string = 'Test problem'
): Promise<{
  sessionId: string;
  planId: string;
  problem: string;
  technique: LateralTechnique;
}> {
  // Plan session
  const planResult = await server.planThinkingSession({
    problem,
    techniques: [technique],
  });
  const plan = JSON.parse(planResult.content[0].text);

  let sessionId: string | undefined;
  const totalSteps = getTotalSteps(technique);

  for (let i = 1; i <= stepCount; i++) {
    const input: ExecuteThinkingStepInput = {
      planId: plan.planId,
      technique,
      problem,
      currentStep: i,
      totalSteps,
      output: `Step ${i} output for ${technique}`,
      nextStepNeeded: i < stepCount,
      sessionId,
      ...getTechniqueSpecificFields(technique, i),
    };

    const result = await server.executeThinkingStep(input);

    if (i === 1) {
      sessionId = JSON.parse(result.content[0].text).sessionId as string;
    }
  }

  return {
    sessionId: sessionId!,
    planId: plan.planId,
    problem,
    technique,
  };
}

/**
 * Get total steps for a technique
 */
export function getTotalSteps(technique: LateralTechnique): number {
  const stepCounts: Record<LateralTechnique, number> = {
    six_hats: 6,
    po: 4,
    random_entry: 3,
    scamper: 7,
    concept_extraction: 4,
    yes_and: 4,
    design_thinking: 5,
    triz: 4,
    neural_state: 4,
    temporal_work: 5,
    cross_cultural: 4,
    collective_intel: 5,
  };
  return stepCounts[technique] || 4;
}

/**
 * Get technique-specific fields for a given step
 */
export function getTechniqueSpecificFields(
  technique: LateralTechnique,
  step: number
): Partial<ExecuteThinkingStepInput> {
  switch (technique) {
    case 'six_hats': {
      const hatColors: SixHatsColor[] = ['blue', 'white', 'red', 'yellow', 'black', 'green'];
      return { hatColor: hatColors[step - 1] };
    }

    case 'scamper': {
      const actions: ScamperAction[] = [
        'substitute',
        'combine',
        'adapt',
        'modify',
        'put_to_other_use',
        'eliminate',
        'reverse',
      ];
      return { scamperAction: actions[step - 1] };
    }

    case 'design_thinking': {
      const stages: DesignThinkingStage[] = ['empathize', 'define', 'ideate', 'prototype', 'test'];
      return { designStage: stages[step - 1] };
    }

    case 'po':
      if (step === 1) return { provocation: 'Po: Test provocation' };
      if (step === 2) return { principles: ['Principle 1', 'Principle 2'] };
      if (step === 3) return { ideaList: ['Idea 1', 'Idea 2'] };
      if (step === 4) return { minimalSolution: 'Minimal viable solution' };
      break;

    case 'random_entry':
      if (step === 1) return { randomStimulus: 'Test stimulus' };
      if (step === 2) return { connections: ['Connection 1', 'Connection 2'] };
      break;

    case 'concept_extraction':
      if (step === 1) return { successExample: 'Test success example' };
      if (step === 2) return { extractedConcepts: ['Concept 1', 'Concept 2'] };
      if (step === 3) return { abstractedPatterns: ['Pattern 1', 'Pattern 2'] };
      if (step === 4) return { applications: ['Application 1', 'Application 2'] };
      break;

    case 'yes_and':
      if (step === 1) return { initialIdea: 'Initial test idea' };
      if (step === 2) return { additions: ['Addition 1', 'Addition 2'] };
      if (step === 3) return { evaluations: ['Strong point', 'Weak point'] };
      if (step === 4) return { synthesis: 'Final synthesized solution' };
      break;

    case 'triz':
      if (step === 1) return { contradiction: 'Test contradiction' };
      if (step === 2) return { inventivePrinciples: ['Principle 1', 'Principle 2'] };
      break;

    case 'neural_state':
      if (step === 1) return { dominantNetwork: 'dmn' };
      if (step === 2) return { suppressionDepth: 5 };
      if (step === 3) return { switchingRhythm: ['Pattern 1', 'Pattern 2'] };
      if (step === 4) return { integrationInsights: ['Insight 1', 'Insight 2'] };
      break;

    case 'temporal_work':
      if (step === 1)
        return {
          temporalLandscape: {
            pressurePoints: ['Deadline 1'],
            flexibleWindows: ['Morning slots'],
            deadZones: ['After 3pm'],
            kairosOpportunities: ['Team sync'],
            fixedDeadlines: ['Project due date'],
          },
        };
      if (step === 2) return { circadianAlignment: ['Peak hours: 9-11am'] };
      if (step === 3) return { pressureTransformation: ['Convert deadline to milestone'] };
      if (step === 4) return { asyncSyncBalance: ['Async docs, sync decisions'] };
      if (step === 5) return { temporalEscapeRoutes: ['Buffer time on Fridays'] };
      break;

    case 'cross_cultural':
      if (step === 1) return { culturalFrameworks: ['Framework 1', 'Framework 2'] };
      if (step === 2) return { parallelPaths: ['Path 1', 'Path 2'] };
      if (step === 3) return { bridgeBuilding: ['Bridge concept 1'] };
      if (step === 4) return { respectfulSynthesis: ['Synthesis approach'] };
      break;
  }

  return {};
}

/**
 * Generate realistic output for a technique step
 */
export function generateStepOutput(
  technique: LateralTechnique,
  step: number,
  problem: string
): string {
  const baseOutput = `Applying ${technique} step ${step} to: ${problem}. `;

  const techniqueOutputs: Record<LateralTechnique, string[]> = {
    six_hats: [
      'Setting up structured thinking process',
      'Gathering facts and data',
      'Exploring emotional responses',
      'Finding positive aspects',
      'Identifying risks and concerns',
      'Generating creative solutions',
    ],
    po: [
      'Creating provocative statement',
      'Extracting underlying principles',
      'Generating practical ideas',
      'Validating and refining solution',
    ],
    random_entry: [
      'Selected random stimulus',
      'Making connections to problem',
      'Applying insights to solution',
    ],
    scamper: [
      'Substituting key elements',
      'Combining with other ideas',
      'Adapting from other contexts',
      'Modifying scale or attributes',
      'Finding alternative uses',
      'Eliminating unnecessary parts',
      'Reversing or rearranging',
    ],
    concept_extraction: [
      'Analyzing successful example',
      'Extracting core concepts',
      'Abstracting patterns',
      'Applying to current problem',
    ],
    yes_and: [
      'Starting with initial idea',
      'Building on the concept',
      'Evaluating strengths and weaknesses',
      'Creating integrated solution',
    ],
    design_thinking: [
      'Understanding user needs',
      'Defining core problem',
      'Generating ideas',
      'Creating prototype',
      'Testing with users',
    ],
    triz: [
      'Identifying contradiction',
      'Finding inventive principles',
      'Removing constraints',
      'Minimizing complexity',
    ],
    neural_state: [
      'Assessing current mental state',
      'Adjusting cognitive mode',
      'Developing switching rhythm',
      'Integrating insights',
    ],
    temporal_work: [
      'Mapping time landscape',
      'Aligning with natural rhythms',
      'Transforming time pressure',
      'Balancing sync/async work',
      'Creating escape routes',
    ],
    cross_cultural: [
      'Exploring cultural perspectives',
      'Developing parallel approaches',
      'Building conceptual bridges',
      'Creating respectful synthesis',
    ],
    collective_intel: [
      'Assessing collective state',
      'Orchestrating perspectives',
      'Facilitating emergence',
      'Harvesting insights',
      'Evolving collective understanding',
    ],
  };

  const outputs = techniqueOutputs[technique] || ['Processing step'];
  return baseOutput + (outputs[step - 1] || outputs[0]);
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock MCP request
 */
export function createMCPRequest(method: string, params: any = {}, id: number = 1): any {
  return {
    jsonrpc: '2.0',
    method,
    params,
    id,
  };
}

/**
 * Verify session contains expected data
 */
export function verifySessionData(
  sessionData: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  expectations: {
    technique?: LateralTechnique;
    problem?: string;
    stepCount?: number;
    hasInsights?: boolean;
    isComplete?: boolean;
  }
): void {
  if (expectations.technique) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.technique).toBe(expectations.technique);
  }

  if (expectations.problem) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.problem).toBe(expectations.problem);
  }

  if (expectations.stepCount !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.currentStep).toBe(expectations.stepCount);
  }

  if (expectations.hasInsights) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.insights).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.insights.length).toBeGreaterThan(0);
  }

  if (expectations.isComplete !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(sessionData.nextStepNeeded).toBe(!expectations.isComplete);
  }
}

/**
 * Create a batch of test problems
 */
export function generateTestProblems(count: number, prefix: string = 'Test problem'): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;

  if (label) {
    console.log(`${label}: ${duration}ms`); // eslint-disable-line no-console
  }

  return { result, duration };
}
