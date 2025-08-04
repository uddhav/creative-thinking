/**
 * Planning Layer
 * Creates structured workflows for thinking sessions
 */

import { randomUUID } from 'crypto';
import type {
  PlanThinkingSessionInput,
  PlanThinkingSessionOutput,
  ThinkingStep,
} from '../types/planning.js';
import type { LateralTechnique } from '../types/index.js';
import type { SessionManager } from '../core/SessionManager.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
import type { TechniqueHandler } from '../techniques/types.js';
import { ParallelPlanGenerator } from './planning/ParallelPlanGenerator.js';
import { ParallelismDetector } from './discovery/ParallelismDetector.js';
import { ParallelismValidator } from './discovery/ParallelismValidator.js';

interface ScamperHandlerType extends TechniqueHandler {
  getAction(step: number): string;
  getAllActions(): Record<
    string,
    {
      description: string;
      emoji: string;
      riskQuestion: string;
      pathIndicator: string;
      commitmentLevel: string;
      typicalReversibilityCost: number;
    }
  >;
}

export function planThinkingSession(
  input: PlanThinkingSessionInput,
  sessionManager: SessionManager,
  techniqueRegistry: TechniqueRegistry
): PlanThinkingSessionOutput {
  const {
    problem,
    techniques,
    objectives,
    constraints,
    timeframe = 'thorough',
    executionMode = 'sequential',
    maxParallelism,
    convergenceOptions,
  } = input;

  // Check if parallel execution is requested or should be considered
  if (executionMode === 'parallel' || executionMode === 'auto') {
    // Use ParallelPlanGenerator for parallel planning
    const parallelGenerator = new ParallelPlanGenerator(sessionManager, techniqueRegistry);

    // For 'auto' mode, detect if parallel is beneficial
    let finalExecutionMode: 'parallel' | 'sequential' =
      executionMode === 'auto' ? 'sequential' : executionMode;
    if (executionMode === 'auto') {
      const detector = new ParallelismDetector();
      const validator = new ParallelismValidator();

      const detection = detector.detectExecutionMode(problem);
      const validation = validator.validateParallelRequest(techniques, maxParallelism);

      // Use parallel if confidence is high and validation passes
      finalExecutionMode =
        detection.confidence > 0.7 && validation.isValid ? 'parallel' : 'sequential';
    }

    // Generate parallel plans if appropriate
    if (finalExecutionMode === 'parallel') {
      const parallelPlan = parallelGenerator.generateParallelPlans(
        input,
        'parallel',
        convergenceOptions
      );

      // Save plan
      sessionManager.savePlan(parallelPlan.planId, parallelPlan);
      return parallelPlan;
    }
  }

  // Continue with sequential planning
  // Generate unique plan ID
  const planId = `plan_${randomUUID()}`;

  // Build workflow for each technique
  const workflow = techniques.map(technique => {
    const handler = techniqueRegistry.getHandler(technique);
    const info = handler.getTechniqueInfo();
    const steps = generateStepsForTechnique(technique as string, problem, info.totalSteps, handler);

    return {
      technique,
      steps,
      estimatedTime: estimateTime(technique, timeframe),
      requiredInputs: getRequiredInputs(technique),
      expectedOutputs: getExpectedOutputs(technique),
      integrationPoints:
        techniques.length > 1 ? getIntegrationPoints(technique, techniques) : undefined,
    };
  });

  // Calculate total steps
  const totalSteps = workflow.reduce((sum, w) => sum + w.steps.length, 0);

  // Create integration strategy for multi-technique sessions
  const integrationStrategy =
    techniques.length > 1 ? createIntegrationStrategy(techniques, timeframe) : undefined;

  // Generate success metrics
  const successMetrics = generateSuccessMetrics(objectives, timeframe);

  // Create risk mitigation plan
  const riskMitigation = generateRiskMitigation(problem, constraints);

  // Assess flexibility
  const flexibilityAssessment = assessFlexibility(constraints);

  // Generate planning insights for memory context
  const planningInsights = {
    techniqueRationale: generateTechniqueRationale(techniques, problem, constraints),
    sequenceLogic: generateSequenceLogic(techniques, integrationStrategy),
    historicalNote: generateHistoricalNote(techniques, objectives),
  };

  // Generate complexity assessment
  const complexityAssessment = assessComplexity(techniques, constraints, totalSteps);

  // Save plan
  const plan: PlanThinkingSessionOutput = {
    planId,
    problem,
    techniques,
    workflow,
    totalSteps,
    estimatedTotalTime: calculateTotalTime(workflow),
    objectives,
    constraints,
    integrationStrategy,
    successMetrics,
    riskMitigation,
    flexibilityAssessment,
    createdAt: Date.now(),
    planningInsights,
    complexityAssessment,
    executionMode,
  };

  sessionManager.savePlan(planId, plan);

  return plan;
}

function generateStepsForTechnique(
  technique: string,
  problem: string,
  totalSteps: number,
  handler: TechniqueHandler
): ThinkingStep[] {
  const steps: ThinkingStep[] = [];

  for (let i = 1; i <= totalSteps; i++) {
    let guidance = handler.getStepGuidance(i, problem);

    // Add path indicators for SCAMPER
    if (technique === 'scamper' && 'getAction' in handler && 'getAllActions' in handler) {
      const scamperHandler = handler as ScamperHandlerType;
      const action = scamperHandler.getAction(i);
      const actions = scamperHandler.getAllActions();
      const actionInfo = actions[action];
      if (actionInfo) {
        // Add path indicator to guidance
        const indicator =
          actionInfo.commitmentLevel === 'irreversible'
            ? '🔒'
            : actionInfo.commitmentLevel === 'high'
              ? '🔒'
              : '🔄';
        guidance = `${indicator} ${guidance}`;
      }
    }

    steps.push({
      stepNumber: i,
      description: guidance,
      expectedOutput: getExpectedOutputForStep(technique, i),
      criticalLens: getCriticalLensForStep(technique, i),
      risks: getRisksForStep(technique, i),
      successCriteria: getSuccessCriteriaForStep(technique, i),
    });
  }

  return steps;
}

function estimateTime(technique: string, timeframe: string): string {
  const baseTime: Record<string, number> = {
    six_hats: 30,
    po: 20,
    random_entry: 15,
    scamper: 35,
    concept_extraction: 25,
    yes_and: 20,
    design_thinking: 40,
    triz: 30,
    neural_state: 25,
    temporal_work: 30,
    cross_cultural: 25,
    collective_intel: 30,
    disney_method: 25,
    nine_windows: 45,
  };

  const multiplier = timeframe === 'quick' ? 0.5 : timeframe === 'comprehensive' ? 1.5 : 1;
  const minutes = Math.round((baseTime[technique] || 30) * multiplier);

  return `${minutes} minutes`;
}

function getRequiredInputs(technique: string): string[] {
  const inputs: Record<string, string[]> = {
    six_hats: ['Problem statement', 'Context'],
    po: ['Initial assumptions', 'Constraints'],
    random_entry: ['Random stimulus source', 'Problem focus'],
    scamper: ['Current solution/product', 'Modification goals'],
    concept_extraction: ['Success examples', 'Target domain'],
    yes_and: ['Initial idea', 'Collaboration mindset'],
    design_thinking: ['User context', 'Resources available'],
    triz: ['Technical contradiction', 'System constraints'],
    neural_state: ['Current mental state', 'Focus area'],
    temporal_work: ['Time constraints', 'Flexibility needs'],
    cross_cultural: ['Cultural contexts', 'Respect guidelines'],
    collective_intel: ['Knowledge sources', 'Integration goals'],
  };

  return inputs[technique] || ['Problem statement'];
}

function getExpectedOutputs(technique: string): string[] {
  const outputs: Record<string, string[]> = {
    six_hats: ['Multi-perspective analysis', 'Balanced decision', 'Risk assessment'],
    po: ['Breakthrough concepts', 'Challenge to assumptions'],
    random_entry: ['Novel connections', 'Unexpected solutions'],
    scamper: ['Modified solutions', 'Innovation paths'],
    concept_extraction: ['Abstracted principles', 'Transfer applications'],
    yes_and: ['Enhanced ideas', 'Collaborative solutions'],
    design_thinking: ['User-centered solution', 'Tested prototype'],
    triz: ['Resolved contradiction', 'Innovative solution'],
    neural_state: ['Optimized thinking state', 'Integrated insights'],
    temporal_work: ['Time-aware design', 'Flexible implementation'],
    cross_cultural: ['Culturally adaptive solution', 'Respectful integration'],
    collective_intel: ['Synthesized wisdom', 'Emergent insights'],
    disney_method: ['Implementable vision', 'Practical plan', 'Risk-aware solution'],
    nine_windows: [
      'Multi-dimensional understanding',
      'System evolution insights',
      'Path dependencies mapped',
    ],
  };

  return outputs[technique] || ['Solution options'];
}

function getIntegrationPoints(
  technique: string,
  allTechniques: string[]
): Array<{ withTechnique: LateralTechnique; atStep: number; purpose: string }> | undefined {
  const points: Array<{ withTechnique: LateralTechnique; atStep: number; purpose: string }> = [];

  // Six Hats can integrate with everything at black hat step
  if (technique === 'six_hats' && allTechniques.includes('scamper')) {
    points.push({
      withTechnique: 'scamper' as LateralTechnique,
      atStep: 5, // Black hat
      purpose: 'Risk assessment of modifications',
    });
  }

  // Design Thinking can integrate at test phase
  if (technique === 'design_thinking' && allTechniques.includes('po')) {
    points.push({
      withTechnique: 'po' as LateralTechnique,
      atStep: 5, // Test
      purpose: 'Challenge prototype assumptions',
    });
  }

  return points.length > 0 ? points : undefined;
}

function createIntegrationStrategy(
  techniques: string[],
  timeframe: string
): PlanThinkingSessionOutput['integrationStrategy'] {
  // For quick sessions, run techniques in parallel
  if (timeframe === 'quick') {
    return {
      approach: 'parallel',
      syncPoints: [1, Math.ceil(techniques.length / 2), techniques.length],
    };
  }

  // For thorough sessions, use sequential with decision gates
  return {
    approach: 'sequential',
    decisionGates: techniques.map((tech, index) => ({
      afterStep: index + 1,
      criteria: `Sufficient insights from ${tech}`,
      options: ['Continue to next technique', 'Iterate current technique', 'Skip remaining'],
    })),
  };
}

function generateSuccessMetrics(objectives?: string[], timeframe?: string): string[] {
  const baseMetrics = [
    'Generated at least 3 viable solutions',
    'Identified and addressed key risks',
    'Achieved clarity on problem definition',
  ];

  if (objectives) {
    objectives.forEach(obj => {
      if (obj.toLowerCase().includes('innovative')) {
        baseMetrics.push('Created at least 1 breakthrough concept');
      }
      if (obj.toLowerCase().includes('practical')) {
        baseMetrics.push('Developed implementable solution');
      }
      if (obj.toLowerCase().includes('consensus')) {
        baseMetrics.push('Achieved stakeholder alignment');
      }
    });
  }

  if (timeframe === 'thorough') {
    baseMetrics.push('Thorough analysis from all angles');
  }

  return baseMetrics;
}

function generateRiskMitigation(
  problem: string,
  constraints?: string[]
): Array<{ risk: string; mitigation: string; triggerIndicators: string[] }> {
  const mitigations = [];

  // Always include cognitive overload risk
  mitigations.push({
    risk: 'Cognitive overload from complex problem',
    mitigation: 'Take breaks between techniques, use visual aids',
    triggerIndicators: ['Confusion', 'Fatigue', 'Circular thinking'],
  });

  // Add constraint-based risks
  if (constraints) {
    if (constraints.some(c => c.toLowerCase().includes('time'))) {
      mitigations.push({
        risk: 'Time pressure reducing quality',
        mitigation: 'Focus on high-impact techniques first',
        triggerIndicators: ['Rushed decisions', 'Skipping steps'],
      });
    }
    if (constraints.some(c => c.toLowerCase().includes('stakeholder'))) {
      mitigations.push({
        risk: 'Stakeholder resistance to novel solutions',
        mitigation: 'Include stakeholder perspectives early',
        triggerIndicators: ['Pushback', 'Concerns about feasibility'],
      });
    }
  }

  return mitigations;
}

function assessFlexibility(
  constraints?: string[]
): PlanThinkingSessionOutput['flexibilityAssessment'] {
  let score = 1.0; // Start with full flexibility
  const escapeRoutes: string[] = [];

  if (constraints) {
    // Each constraint reduces flexibility
    score -= constraints.length * 0.1;

    // Hard constraints reduce more
    constraints.forEach(c => {
      if (c.toLowerCase().includes('must') || c.toLowerCase().includes('cannot')) {
        score -= 0.1;
      }
    });
  }

  score = Math.max(0.1, Math.min(1.0, score)); // Clamp between 0.1 and 1.0

  // Generate escape routes based on flexibility
  if (score < 0.4) {
    escapeRoutes.push('Consider relaxing non-critical constraints');
    escapeRoutes.push('Break problem into smaller, more flexible parts');
    escapeRoutes.push('Seek alternative problem framing');
  }

  return {
    score,
    optionGenerationRecommended: score < 0.4,
    escapeRoutes,
  };
}

function calculateTotalTime(workflow: PlanThinkingSessionOutput['workflow']): string {
  let totalMinutes = 0;

  workflow.forEach(w => {
    const match = w.estimatedTime.match(/(\d+) minutes/);
    if (match) {
      totalMinutes += parseInt(match[1], 10);
    }
  });

  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''}${minutes > 0 ? ` ${minutes} minutes` : ''}`;
  }
}

function getExpectedOutputForStep(technique: string, step: number): string {
  // Technique-specific expected outputs
  const outputs: Record<string, Record<number, string>> = {
    six_hats: {
      1: 'Clear process definition and objectives',
      2: 'Comprehensive fact gathering',
      3: 'Emotional landscape mapping',
      4: 'Positive possibilities identified',
      5: 'Critical risks and obstacles listed',
      6: 'Creative solutions generated',
      7: 'Path dependency analysis',
    },
    scamper: {
      1: 'Substitution options',
      2: 'Combination possibilities',
      3: 'Adaptation strategies',
      4: 'Modification ideas',
      5: 'Alternative uses',
      6: 'Elements to eliminate',
      7: 'Reversal concepts',
    },
    disney_method: {
      1: 'Bold vision without constraints',
      2: 'Concrete implementation plan',
      3: 'Risk mitigation strategies',
    },
    nine_windows: {
      1: 'Past sub-system analysis',
      2: 'Past system evolution',
      3: 'Past environmental factors',
      4: 'Current component state',
      5: 'Current system analysis',
      6: 'Current environment mapping',
      7: 'Future component possibilities',
      8: 'Future system scenarios',
      9: 'Future environmental changes',
    },
  };

  return outputs[technique]?.[step] || 'Insights and ideas related to the step focus';
}

function getCriticalLensForStep(technique: string, step: number): string | undefined {
  if (technique === 'six_hats' && step === 5) {
    return 'Focus on identifying all possible failure modes and Black Swan events';
  }
  if (technique === 'design_thinking' && step === 5) {
    return 'Look specifically for edge cases and unexpected user behaviors';
  }
  if (technique === 'scamper' && step === 6) {
    return 'Consider unintended consequences of elimination';
  }
  return undefined;
}

function getRisksForStep(technique: string, step: number): string[] | undefined {
  if (technique === 'scamper') {
    switch (step) {
      case 2: // Combine
        return ['High commitment - Difficult to reverse', 'Loss of modularity'];
      case 6: // Eliminate
        return ['⚠️ IRREVERSIBLE ACTION - Cannot be undone', 'Loss of essential features'];
      default:
        return undefined;
    }
  }
  if (technique === 'po' && step === 1) {
    return ['Provocation too extreme to extract value', 'Getting stuck in absurdity'];
  }
  if (technique === 'design_thinking' && step === 5) {
    return ['Edge cases not discovered', 'Unexpected user behaviors'];
  }
  if (technique === 'six_hats' && step === 5) {
    return ['Overlooking critical risks', 'Analysis paralysis', 'Excessive pessimism'];
  }
  if (technique === 'triz' && step === 1) {
    return ['Misidentifying the core contradiction', 'Oversimplifying complex problems'];
  }
  if (technique === 'temporal_work' && step === 1) {
    return ['Over-optimization can reduce adaptability', 'Missing hidden time constraints'];
  }
  if (technique === 'temporal_work' && step === 5) {
    return ['Early rushing creates quality ceiling', 'Escape routes not tested'];
  }
  if (technique === 'neural_state' && step === 1) {
    return ['Individual variation in neural patterns', 'Misidentifying dominant network'];
  }
  if (technique === 'neural_state' && step === 3) {
    return ['Avoid forced switching that disrupts flow', 'Over-scheduling cognitive states'];
  }
  if (technique === 'collective_intel' && step === 1) {
    return ['Source bias awareness', 'Echo chamber effects'];
  }
  if (technique === 'collective_intel' && step === 3) {
    return ['Pattern projection bias', 'False pattern recognition'];
  }
  if (technique === 'cross_cultural' && step === 1) {
    return ['Cultural sensitivity required', 'Avoiding stereotypes'];
  }
  if (technique === 'cross_cultural' && step === 3) {
    return ['Maintain authenticity', 'Avoid cultural appropriation'];
  }
  return undefined;
}

function getSuccessCriteriaForStep(technique: string, step: number): string[] | undefined {
  const criteria: Record<string, Record<number, string[]>> = {
    six_hats: {
      1: ['Clear objectives defined', 'Process understood by all'],
      2: ['Key facts identified', 'Information gaps noted'],
      6: ['At least 3 creative ideas generated', 'Ideas are genuinely different'],
    },
    design_thinking: {
      1: ['User needs understood', 'Empathy established'],
      3: ['Diverse ideas generated', 'Quantity over quality achieved'],
      5: ['User feedback collected', 'Iterations identified'],
    },
  };

  return criteria[technique]?.[step];
}

/**
 * Generate technique rationale for memory context
 */
function generateTechniqueRationale(
  techniques: string[],
  problem: string,
  constraints?: string[]
): string {
  const techniqueReasons: Record<string, string> = {
    six_hats: 'systematic exploration from multiple perspectives',
    po: 'provocative thinking to break conventional boundaries',
    random_entry: 'lateral connections through unexpected stimuli',
    scamper: 'structured modifications with path dependency awareness',
    concept_extraction: 'learning from successful patterns',
    yes_and: 'collaborative building on ideas',
    design_thinking: 'human-centered problem solving',
    triz: 'contradiction resolution through inventive principles',
    neural_state: 'cognitive optimization for creative thinking',
    temporal_work: 'time-aware design with flexibility',
    cross_cultural: 'culturally adaptive solutions',
    collective_intel: 'wisdom synthesis from multiple sources',
  };

  const reasons = techniques.map(t => techniqueReasons[t] || 'creative exploration').join(', ');
  const constraintText =
    constraints && constraints.length > 0
      ? ` while respecting ${constraints.length} constraint${constraints.length > 1 ? 's' : ''}`
      : '';

  return `Selected for ${reasons}${constraintText}`;
}

/**
 * Generate sequence logic explanation
 */
function generateSequenceLogic(
  techniques: string[],
  integrationStrategy?: PlanThinkingSessionOutput['integrationStrategy']
): string {
  if (techniques.length === 1) {
    return 'Single technique approach for focused exploration';
  }

  // Use integration strategy if provided
  const strategyText = integrationStrategy
    ? ` (${integrationStrategy.approach} approach${integrationStrategy.syncPoints ? ' with sync points' : ''})`
    : '';

  const hasUnderstanding = techniques.some(t => ['six_hats', 'design_thinking'].includes(t));
  const hasGeneration = techniques.some(t =>
    ['po', 'random_entry', 'scamper', 'yes_and'].includes(t)
  );
  const hasIntegration = techniques.some(t => ['triz', 'collective_intel'].includes(t));

  const phases: string[] = [];
  if (hasUnderstanding) phases.push('understanding');
  if (hasGeneration) phases.push('generation');
  if (hasIntegration) phases.push('integration');

  if (phases.length > 1) {
    return `Sequenced through ${phases.join(' → ')} phases to maximize creative flow while preserving optionality${strategyText}`;
  }

  return `Techniques ordered to build on each other's insights${strategyText}`;
}

/**
 * Generate historical note about similar workflows
 */
function generateHistoricalNote(techniques: string[], objectives?: string[]): string {
  const techniquePatterns: Record<string, string> = {
    'six_hats,scamper':
      'This combination has proven effective for product improvements by balancing systematic analysis with creative modifications',
    'design_thinking,po': 'Pairing empathy with provocation often reveals hidden user needs',
    'triz,scamper':
      'Technical contradiction resolution followed by systematic modification creates robust innovations',
    'random_entry,yes_and':
      'Random stimuli enhanced through collaborative building generates unexpected breakthroughs',
  };

  const key = techniques.sort().join(',');
  const pattern = techniquePatterns[key];

  if (pattern) {
    return pattern;
  }

  // Generate generic historical note
  const objectiveText =
    objectives && objectives.length > 0 ? ` for ${objectives[0].toLowerCase()}` : '';

  return `This ${techniques.length}-technique workflow creates comprehensive exploration${objectiveText}`;
}

/**
 * Assess complexity of the planned workflow
 */
function assessComplexity(
  techniques: string[],
  constraints?: string[],
  totalSteps?: number
): { level: 'low' | 'medium' | 'high'; suggestion?: string } {
  const techniqueCount = techniques.length;
  const constraintCount = constraints?.length || 0;
  const stepCount = totalSteps || 0;

  // Calculate complexity score
  let score = 0;
  if (techniqueCount > 2) score += 2;
  else if (techniqueCount > 1) score += 1;

  if (constraintCount > 3) score += 2;
  else if (constraintCount > 1) score += 1;

  if (stepCount > 20) score += 2;
  else if (stepCount > 10) score += 1;

  // Determine level and suggestion
  if (score >= 4) {
    return {
      level: 'high',
      suggestion:
        'This multi-phase plan could benefit from sequential thinking to manage dependencies and ensure systematic progress',
    };
  } else if (score >= 2) {
    return {
      level: 'medium',
      suggestion: undefined,
    };
  } else {
    return {
      level: 'low',
      suggestion: undefined,
    };
  }
}
