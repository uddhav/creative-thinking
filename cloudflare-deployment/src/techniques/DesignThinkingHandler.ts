/**
 * Design Thinking technique handler
 */

import type { DesignThinkingStage } from '../types/index.js';
import { BaseTechniqueHandler, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface StageInfo {
  name: string;
  focus: string;
  emoji: string;
  criticalLens: string;
}

export class DesignThinkingHandler extends BaseTechniqueHandler {
  private readonly stages: Record<DesignThinkingStage, StageInfo> = {
    empathize: {
      name: 'Empathize',
      focus: 'Understand user needs and context',
      emoji: '❤️',
      criticalLens: 'Challenge assumptions about user needs',
    },
    define: {
      name: 'Define',
      focus: 'Frame the problem clearly',
      emoji: '📍',
      criticalLens: "Question if you're solving the right problem",
    },
    ideate: {
      name: 'Ideate',
      focus: 'Generate diverse solutions',
      emoji: '💡',
      criticalLens: 'Identify failure modes in each idea',
    },
    prototype: {
      name: 'Prototype',
      focus: 'Build quick, testable versions',
      emoji: '🔨',
      criticalLens: 'Stress-test assumptions early',
    },
    test: {
      name: 'Test',
      focus: 'Validate with real users',
      emoji: '🧪',
      criticalLens: 'Look for unexpected failures and edge cases',
    },
  };

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
      return `Complete the Design Thinking process for "${problem}"`;
    }

    const stage = this.stageOrder[step - 1];
    const info = this.stages[stage];

    switch (stage) {
      case 'empathize':
        return `❤️ EMPATHIZE: Who is affected by "${problem}"? What are their real needs, fears, and contexts?`;

      case 'define':
        return `📍 DEFINE: Based on empathy insights, what is the core problem? Frame it as: "How might we..."`;

      case 'ideate':
        return `💡 IDEATE: Generate multiple solutions. For each idea, also identify: What could go wrong?`;

      case 'prototype':
        return `🔨 PROTOTYPE: Create a simple version to test assumptions. Include failure scenarios in the prototype`;

      case 'test':
        return `🧪 TEST: Validate with users. Specifically look for: edge cases, unexpected uses, and failure modes`;

      default:
        return `Apply ${info.name} to "${problem}"`;
    }
  }

  extractInsights(
    history: Array<{
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
    const insights: string[] = [];

    history.forEach(entry => {
      switch (entry.designStage) {
        case 'empathize':
          if (entry.empathyInsights && entry.empathyInsights.length > 0) {
            insights.push(`User need: ${entry.empathyInsights[0]}`);
          }
          break;

        case 'define':
          if (entry.problemStatement) {
            insights.push(`Problem defined: ${entry.problemStatement}`);
          }
          break;

        case 'ideate':
          if (entry.ideaList && entry.ideaList.length > 0) {
            insights.push(`${entry.ideaList.length} ideas generated`);
          }
          if (entry.failureModesPredicted && entry.failureModesPredicted.length > 0) {
            insights.push(`Risk identified: ${entry.failureModesPredicted[0]}`);
          }
          break;

        case 'prototype':
          if (entry.prototypeDescription) {
            insights.push(`Prototype: ${entry.prototypeDescription.slice(0, 100)}...`);
          }
          break;

        case 'test':
          if (entry.userFeedback && entry.userFeedback.length > 0) {
            insights.push(`User feedback: ${entry.userFeedback[0]}`);
          }
          if (entry.failureInsights && entry.failureInsights.length > 0) {
            insights.push(`Failure insight: ${entry.failureInsights[0]}`);
          }
          break;
      }
    });

    return insights;
  }

  getStage(step: number): DesignThinkingStage {
    return this.stageOrder[step - 1];
  }
}
