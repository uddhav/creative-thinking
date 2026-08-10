/**
 * Design Thinking technique handler
 */

import type { DesignThinkingStage } from '../types/index.js';
import { BaseTechniqueHandler, firstSentence, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class DesignThinkingHandler extends BaseTechniqueHandler {
  // Step metadata lives in `stepsWithReflexivity`; per-stage critical lenses are
  // sourced by the planning layer via getCriticalLensForStep(). A duplicate
  // `stages` table used to sit here, read by nothing once the out-of-range
  // fallback was standardised, so it was removed rather than left to drift.
  private readonly stageOrder: DesignThinkingStage[] = [
    'empathize',
    'define',
    'ideate',
    'prototype',
    'test',
  ];

  private readonly stepsWithReflexivity: StepInfo[] = [
    {
      name: 'Empathize',
      focus: 'Understand user needs and context | Challenge assumptions about user needs',
      emoji: '❤️',
      type: 'thinking',
    },
    {
      name: 'Define',
      focus: "Frame the problem clearly | Question if you're solving the right problem",
      emoji: '📍',
      type: 'thinking',
    },
    {
      name: 'Ideate',
      focus: 'Generate diverse solutions | Identify failure modes in each idea',
      emoji: '💡',
      type: 'thinking',
    },
    {
      name: 'Prototype',
      focus: 'Build quick, testable versions | Stress-test assumptions early',
      emoji: '🔨',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Creating physical/digital artifacts',
          'Building testable prototypes',
          'Materializing ideas',
        ],
        realityChanges: [
          'Prototype exists as tangible artifact',
          'Resources committed to prototype',
          'Design decisions become concrete',
        ],
        futureConstraints: [
          'Must work within prototype limitations',
          'User expectations shaped by prototype',
          'Future iterations constrained by initial design',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Test',
      focus: 'Validate with real users | Look for unexpected failures and edge cases',
      emoji: '🧪',
      type: 'action',
      reflexiveEffects: {
        triggers: ['User testing sessions', 'Collecting feedback', 'Measuring performance'],
        realityChanges: [
          'User expectations formed',
          'Feedback documented',
          'Performance metrics established',
        ],
        futureConstraints: [
          'Must address identified issues',
          'User feedback shapes future direction',
          'Test results become benchmarks',
        ],
        reversibility: 'high',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Design Thinking',
      emoji: '🎨',
      totalSteps: 5,
      description: 'Human-centered problem solving with embedded risk management',
      focus: 'Iterate through empathy, definition, ideation, prototyping, and testing',
      parallelSteps: {
        canParallelize: false,
        dependencies: [
          [1, 2],
          [2, 3],
          [3, 4],
          [4, 5],
        ], // Empathize → Define → Ideate → Prototype → Test
        description:
          'Must be executed sequentially: each stage builds on insights from the previous one',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.stepsWithReflexivity.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Design Thinking technique. Valid steps are 1-${this.stepsWithReflexivity.length}`,
        'step',
        { providedStep: step, validRange: [1, this.stepsWithReflexivity.length] }
      );
    }
    return this.stepsWithReflexivity[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > this.stageOrder.length) {
      return `Complete the Design Thinking process for: "${problem}"`;
    }

    const stage = this.stageOrder[step - 1];

    switch (stage) {
      case 'empathize':
        return `❤️ EMPATHIZE: Who is affected by "${problem}"? What are their real needs, fears, and contexts?`;

      case 'define':
        return `📍 DEFINE: Based on empathy insights, what is the core problem hiding inside "${problem}"? Frame it as: "How might we..."`;

      case 'ideate':
        return `💡 IDEATE: Generate multiple solutions to "${problem}". For each idea, also identify: What could go wrong?`;

      case 'prototype':
        return `🔨 PROTOTYPE: Create a simple version to test your assumptions about "${problem}". Include failure scenarios in the prototype`;

      case 'test':
        return `🧪 TEST: Validate with the people living with "${problem}". Specifically look for: edge cases, unexpected uses, and failure modes`;

      default:
        return `Complete the Design Thinking process for: "${problem}"`;
    }
  }

  /**
   * Report what each stage recorded, keyed on `entry.currentStep`.
   *
   * The whole extraction used to hang off `entry.designStage`, which nothing
   * requires and the schema does not mark required — a session that ran all
   * five stages without naming them reported nothing at all. `currentStep` is
   * always present, so it decides the stage and `designStage` is treated as the
   * confirmation it is: used only when the caller sent no step number.
   */
  extractInsights(
    history: Array<{
      currentStep?: number;
      designStage?: string;
      empathyInsights?: string[];
      problemStatement?: string;
      ideaList?: string[];
      failureModesPredicted?: string[];
      prototypeDescription?: string;
      stressTestResults?: string[];
      userFeedback?: string[];
      failureInsights?: string[];
      output?: string;
    }>
  ): string[] {
    const totalSteps = this.stepsWithReflexivity.length;
    const latestByStep = new Map<number, (typeof history)[number]>();

    history.forEach((entry, index) => {
      const stageStep = entry.designStage
        ? this.stageOrder.indexOf(entry.designStage as DesignThinkingStage) + 1
        : 0;
      const step = entry.currentStep ?? (stageStep > 0 ? stageStep : index + 1);
      if (step >= 1 && step <= totalSteps) {
        latestByStep.set(step, entry);
      }
    });

    const insights: string[] = [];
    const pushEach = (prefix: string, values: string[] | undefined): void => {
      if (!Array.isArray(values)) {
        return;
      }
      values.forEach(value => {
        if (typeof value === 'string' && value.trim().length > 0) {
          insights.push(`${prefix}: ${value.trim()}`);
        }
      });
    };

    for (let step = 1; step <= totalSteps; step++) {
      const entry = latestByStep.get(step);
      if (!entry) {
        continue;
      }
      const stepName = this.stepsWithReflexivity[step - 1].name;

      // `entry.output` was declared on the parameter and read by nothing.
      const output = entry.output?.trim();
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      switch (step) {
        case 1:
          pushEach('User need', entry.empathyInsights);
          break;

        case 2:
          if (entry.problemStatement?.trim()) {
            insights.push(`Problem defined: ${entry.problemStatement.trim()}`);
          }
          break;

        case 3:
          // The ideas themselves, not a count of them.
          pushEach('Idea', entry.ideaList);
          pushEach('Risk identified', entry.failureModesPredicted);
          break;

        case 4:
          if (entry.prototypeDescription?.trim()) {
            insights.push(`Prototype: ${entry.prototypeDescription.trim()}`);
          }
          // Declared, whitelisted by ObjectFieldValidator, and read by nothing.
          pushEach('Stress test', entry.stressTestResults);
          break;

        case 5:
          pushEach('User feedback', entry.userFeedback);
          pushEach('Failure insight', entry.failureInsights);
          break;
      }
    }

    return insights;
  }

  getStage(step: number): DesignThinkingStage {
    return this.stageOrder[step - 1];
  }
}
