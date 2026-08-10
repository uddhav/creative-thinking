/**
 * Temporal Work technique handler
 */

import { BaseTechniqueHandler, firstSentence, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

export class TemporalWorkHandler extends BaseTechniqueHandler {
  private readonly steps: StepInfo[] = [
    {
      name: 'Map Temporal Landscape',
      focus: 'Identify time constraints and opportunities',
      emoji: '🗺️',
      type: 'thinking', // Analysis and mapping
      reversibility: 'high',
    },
    {
      name: 'Circadian Alignment',
      focus: 'Align with natural rhythms',
      emoji: '🌅',
      type: 'thinking', // Analysis of patterns
      reversibility: 'high',
    },
    {
      name: 'Pressure Transformation',
      focus: 'Convert time pressure into creative force',
      emoji: '💎',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Transforming time pressure',
          'Creating deadline structures',
          'Establishing temporal constraints',
        ],
        realityChanges: [
          'Pressure dynamics established',
          'Creative constraints in place',
          'Time-boxed commitments made',
        ],
        futureConstraints: [
          'Must work within pressure framework',
          'Deadlines become immovable',
          'Creative constraints lock in',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Async-Sync Balance',
      focus: 'Design information flow patterns',
      emoji: '⚖️',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Establishing async patterns',
          'Creating sync points',
          'Designing flow structures',
        ],
        realityChanges: [
          'Communication patterns set',
          'Synchronization points fixed',
          'Information flow established',
        ],
        futureConstraints: [
          'Must maintain async/sync balance',
          'Communication patterns persist',
          'Flow structures become dependencies',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Temporal Escape Routes',
      focus: 'Build flexibility and recovery options',
      emoji: '🚪',
      type: 'action',
      reflexiveEffects: {
        triggers: [
          'Creating escape routes',
          'Building recovery options',
          'Establishing flexibility buffers',
        ],
        realityChanges: [
          'Escape mechanisms in place',
          'Recovery paths established',
          'Flexibility buffers active',
        ],
        futureConstraints: [
          'Must maintain escape routes',
          'Recovery options become expectations',
          'Flexibility has costs',
        ],
        reversibility: 'high',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'Temporal Work Design',
      emoji: '⏰',
      totalSteps: 5,
      description: 'Design solutions considering time dynamics and flexibility',
      focus: 'Work with time as a design material',
      parallelSteps: {
        canParallelize: false,
        description: 'Temporal analysis builds progressively through time landscapes',
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    const stepInfo = this.steps[step - 1];

    if (!stepInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for Temporal Work technique. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: [1, this.steps.length] }
      );
    }

    return stepInfo;
  }

  getStepGuidance(step: number, problem: string): string {
    // Out-of-range steps fall through to `default:` — one path, not an early
    // return plus an unreachable arm returning the same string.
    switch (step) {
      case 1:
        return `🗺️ Map the temporal landscape of "${problem}". What are fixed deadlines vs flexible windows?`;
      case 2:
        return `🌅 Analyze circadian rhythms and natural patterns. How can work on "${problem}" align with natural rhythms? When is the best time for different activities?`;
      case 3:
        return `💎 Transform time pressure into creative force. How can the constraints on "${problem}" enhance rather than limit?`;
      case 4:
        return `⚖️ Balance async and sync work. What parts of "${problem}" need real-time coordination vs independent progress?`;
      case 5:
        return `🚪 Design temporal escape routes. How can we build flexibility and recovery time into "${problem}"?`;
      default:
        return `Complete the Temporal Work Design process for: "${problem}"`;
    }
  }

  /**
   * Report what each step actually recorded, labelled by the step.
   *
   * Keyed on `entry.currentStep`, not on position in the array: `execute`
   * appends a history entry for every call including revisions, so one revision
   * shifts every later entry. Keying on the step also means a revision
   * supersedes the entry it revises rather than reporting twice.
   */
  extractInsights(
    history: Array<{
      currentStep?: number;
      temporalLandscape?: {
        fixedDeadlines?: string[];
        flexibleWindows?: string[];
        pressurePoints?: string[];
        deadZones?: string[];
        kairosOpportunities?: string[];
      };
      circadianAlignment?: string[];
      pressureTransformation?: string[];
      asyncSyncBalance?: string[];
      temporalEscapeRoutes?: string[];
      output?: string;
    }>
  ): string[] {
    const totalSteps = this.steps.length;
    const latestByStep = new Map<number, (typeof history)[number]>();

    history.forEach((entry, index) => {
      // Fall back to position only when the caller sent no step number.
      const step = entry.currentStep ?? index + 1;
      if (step >= 1 && step <= totalSteps) {
        latestByStep.set(step, entry);
      }
    });

    const insights: string[] = [];

    for (let step = 1; step <= totalSteps; step++) {
      const entry = latestByStep.get(step);
      if (!entry) {
        continue;
      }
      const stepName = this.steps[step - 1]?.name;
      if (!stepName) {
        continue;
      }

      const output = entry.output?.trim();
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      // Each structured field belongs to one step; report it there.
      if (step === 1 && entry.temporalLandscape) {
        // All five keys, not the two that happened to be read. A landscape
        // whose dead zones and pressure points were recorded and dropped is
        // half a landscape.
        const landscape: Array<[string, string[] | undefined]> = [
          ['Fixed deadlines', entry.temporalLandscape.fixedDeadlines],
          ['Flexible windows', entry.temporalLandscape.flexibleWindows],
          ['Pressure points', entry.temporalLandscape.pressurePoints],
          ['Dead zones', entry.temporalLandscape.deadZones],
          ['Opportunity windows', entry.temporalLandscape.kairosOpportunities],
        ];
        for (const [label, values] of landscape) {
          if (values && values.length > 0) {
            insights.push(`${label}: ${values.join(', ')}`);
          }
        }
      }
      // Steps 2, 3 and 4 are array-validated on the way in and were read by
      // nothing on the way out, so the three middle steps of a six-step
      // technique contributed no structured content at all.
      if (step === 2 && entry.circadianAlignment?.length) {
        insights.push(`${stepName}: ${entry.circadianAlignment.join(', ')}`);
      }
      if (step === 3 && entry.pressureTransformation?.length) {
        insights.push(`${stepName}: ${entry.pressureTransformation.join(', ')}`);
      }
      if (step === 4 && entry.asyncSyncBalance?.length) {
        insights.push(`${stepName}: ${entry.asyncSyncBalance.join(', ')}`);
      }
      if (step === totalSteps && entry.temporalEscapeRoutes?.length) {
        insights.push(`Escape routes: ${entry.temporalEscapeRoutes.join(', ')}`);
      }
    }

    return insights;
  }
}
