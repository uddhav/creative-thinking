#!/usr/bin/env node

/**
 * Test example for the layered tool architecture
 * Demonstrates the three-layer approach: Discovery → Planning → Execution
 */

// Step 1: Discovery Layer - Analyze the problem and get recommendations
console.log('=== DISCOVERY LAYER ===\n');

const discoveryInput = {
  problem:
    'How can we improve customer satisfaction while reducing support costs in our technical support department?',
  context:
    'We have a growing user base but limited support staff. Response times are increasing and customer satisfaction scores are dropping.',
  preferredOutcome: 'systematic',
  constraints: [
    'Limited budget for new hires',
    'Must maintain 24/7 support coverage',
    'Cannot compromise on quality',
  ],
};

console.log('Discovering suitable techniques for:');
console.log(JSON.stringify(discoveryInput, null, 2));
console.log('\n--- Expected Discovery Output ---\n');

const expectedDiscoveryOutput = {
  recommendations: [
    {
      technique: 'triz',
      score: 0.9,
      reasoning:
        'TRIZ systematically resolves contradictions using inventive principles and removal',
      bestFor: ['technical problems', 'engineering challenges', 'optimization', 'simplification'],
      limitations: ['requires problem abstraction', 'learning curve for principles'],
    },
    {
      technique: 'scamper',
      score: 0.9,
      reasoning: 'SCAMPER systematically explores modifications with risk assessment',
      bestFor: ['product improvement', 'process optimization', 'iterative design'],
      limitations: ['focused on existing solutions', 'may miss radical innovations'],
    },
    {
      technique: 'design_thinking',
      score: 0.9,
      reasoning: 'Design Thinking provides human-centered innovation with threat modeling',
      bestFor: ['user experience', 'service design', 'customer problems', 'prototyping'],
      limitations: ['time-intensive', 'requires user access', 'may miss technical constraints'],
    },
  ],
  reasoning:
    'Based on your problem involving "How can we improve customer satisfaction while reducing support costs in our technical s..." with systematic outcomes, I recommend these techniques.',
  suggestedWorkflow:
    'Start with Design Thinking for user insights, then use TRIZ for technical optimization',
};

console.log(JSON.stringify(expectedDiscoveryOutput, null, 2));

// Step 2: Planning Layer - Create a workflow using recommended techniques
console.log('\n\n=== PLANNING LAYER ===\n');

const planningInput = {
  problem:
    'How can we improve customer satisfaction while reducing support costs in our technical support department?',
  techniques: ['design_thinking', 'triz'], // Based on discovery recommendations
  objectives: [
    'Understand customer pain points in support interactions',
    'Identify contradictions between cost and quality',
    'Develop innovative solutions that improve both metrics',
  ],
  timeframe: 'thorough',
};

console.log('Creating thinking session plan:');
console.log(JSON.stringify(planningInput, null, 2));
console.log('\n--- Expected Planning Output ---\n');

const expectedPlanningOutput = {
  planId: 'plan_abc123...',
  workflow: [
    {
      technique: 'design_thinking',
      stepNumber: 1,
      description: 'Empathize: Understand users and identify threat vectors',
      expectedOutputs: ['User insights', 'Pain points', 'Potential misuse cases'],
      riskConsiderations: undefined,
    },
    {
      technique: 'design_thinking',
      stepNumber: 2,
      description: 'Define: Frame problem and potential failure modes',
      expectedOutputs: ['Problem statement', 'Success metrics', 'Failure modes'],
      riskConsiderations: ['Failure modes', 'Edge cases'],
    },
    {
      technique: 'design_thinking',
      stepNumber: 3,
      description: "Ideate: Generate solutions with devil's advocate",
      expectedOutputs: ['Solution ideas', 'Risk assessments', 'Creative alternatives'],
    },
    {
      technique: 'design_thinking',
      stepNumber: 4,
      description: 'Prototype: Build quick tests including edge cases',
      expectedOutputs: ['Prototype description', 'Test plan', 'Edge cases covered'],
    },
    {
      technique: 'design_thinking',
      stepNumber: 5,
      description: 'Test: Gather feedback and harvest failures',
      expectedOutputs: ['User feedback', 'Failure insights', 'Iteration opportunities'],
    },
    {
      technique: 'triz',
      stepNumber: 6,
      description: 'Identify core contradiction',
      expectedOutputs: ['Clear contradiction statement', 'Conflicting parameters'],
      riskConsiderations: ['Oversimplification risk'],
    },
    {
      technique: 'triz',
      stepNumber: 7,
      description: 'Apply Via Negativa - What to remove?',
      expectedOutputs: ['List of removals', 'Simplification opportunities'],
    },
    {
      technique: 'triz',
      stepNumber: 8,
      description: 'Apply inventive principles',
      expectedOutputs: ['Relevant TRIZ principles', 'Creative applications'],
    },
    {
      technique: 'triz',
      stepNumber: 9,
      description: 'Develop minimal solution',
      expectedOutputs: ['Simplified solution', 'Achieved through removal'],
      riskConsiderations: ['Verify nothing essential removed'],
    },
  ],
  estimatedSteps: 9,
  objectives: [
    'Understand customer pain points in support interactions',
    'Identify contradictions between cost and quality',
    'Develop innovative solutions that improve both metrics',
  ],
  successCriteria: [
    'Multiple solution options generated',
    'Risks identified and addressed',
    'Solutions tested against failure modes',
    'Thorough analysis from all angles',
  ],
};

console.log(JSON.stringify(expectedPlanningOutput, null, 2));

// Step 3: Execution Layer - Execute first step of the plan
console.log('\n\n=== EXECUTION LAYER ===\n');

const executionInput = {
  planId: 'plan_abc123...', // From planning output
  technique: 'design_thinking',
  problem:
    'How can we improve customer satisfaction while reducing support costs in our technical support department?',
  currentStep: 1,
  totalSteps: 5, // Design thinking has 5 steps
  designStage: 'empathize',
  output: 'Through customer interviews and support ticket analysis, we discovered key pain points',
  empathyInsights: [
    'Customers frustrated by long wait times (average 45 minutes)',
    'Repetitive questions consuming 60% of agent time',
    'Customers often need to explain issue multiple times',
    'Language barriers with offshore support teams',
    'Lack of self-service options for common issues',
  ],
  risks: [
    'Sample bias - only hearing from vocal customers',
    'Support agents may filter feedback',
    'Historical data may not reflect current issues',
  ],
  nextStepNeeded: true,
};

console.log('Executing first step:');
console.log(JSON.stringify(executionInput, null, 2));
console.log('\n--- Expected Execution Output ---\n');

const expectedExecutionOutput = {
  sessionId: 'session_xyz789...',
  technique: 'design_thinking',
  currentStep: 1,
  totalSteps: 5,
  nextStepNeeded: true,
  historyLength: 1,
  branches: [],
  nextStepGuidance: 'Next: Define - Frame problem and potential failure modes',
};

console.log(JSON.stringify(expectedExecutionOutput, null, 2));

console.log('\n\n=== BENEFITS OF LAYERED APPROACH ===\n');
console.log("1. Discovery Layer helps users who don't know which technique to use");
console.log('2. Planning Layer creates structured workflows combining multiple techniques');
console.log('3. Execution Layer maintains the detailed step-by-step guidance');
console.log('4. LLM is not overwhelmed with all techniques at once');
console.log('5. More predictable and efficient tool interactions');
console.log('6. Can handle complex problems requiring multiple techniques');
