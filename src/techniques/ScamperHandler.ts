/**
 * SCAMPER technique handler with Path Dependency Analysis and Reflexivity
 */

import type { ScamperAction, ScamperPathImpact } from '../types/index.js';
import { BaseTechniqueHandler, firstSentence, type TechniqueInfo, type StepInfo } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';

interface ScamperActionInfo {
  description: string;
  emoji: string;
  riskQuestion: string;
  pathIndicator: string;
  commitmentLevel: 'low' | 'medium' | 'high' | 'irreversible';
  typicalReversibilityCost: number;
}

export class ScamperHandler extends BaseTechniqueHandler {
  private readonly actions: Record<ScamperAction, ScamperActionInfo> = {
    substitute: {
      description: 'Replace components or elements',
      emoji: '🔄',
      riskQuestion: 'What dependencies will the substitution create?',
      pathIndicator: '⚠️ Medium commitment',
      commitmentLevel: 'medium',
      typicalReversibilityCost: 0.25,
    },
    combine: {
      description: 'Merge elements or ideas',
      emoji: '🔗',
      riskQuestion: 'Will combining make future separation difficult?',
      pathIndicator: '🔒 High commitment',
      commitmentLevel: 'high',
      typicalReversibilityCost: 0.8,
    },
    adapt: {
      description: 'Adjust for different context',
      emoji: '🔧',
      riskQuestion: 'What flexibility do we lose through adaptation?',
      pathIndicator: '⚠️ Medium commitment',
      commitmentLevel: 'medium',
      typicalReversibilityCost: 0.4,
    },
    modify: {
      description: 'Change attributes or qualities',
      emoji: '✏️',
      riskQuestion: 'Can modifications be easily reverted?',
      pathIndicator: '🔄 Low commitment',
      commitmentLevel: 'low',
      typicalReversibilityCost: 0.2,
    },
    put_to_other_use: {
      description: 'Find new applications',
      emoji: '🎯',
      riskQuestion: 'Does repurposing close off original uses?',
      pathIndicator: '🔄 Low commitment',
      commitmentLevel: 'low',
      typicalReversibilityCost: 0.1,
    },
    eliminate: {
      description: 'Remove elements',
      emoji: '❌',
      // Two-sided by design. This asked only what removal costs, which quietly
      // made keeping the free option — the cost of retention never appeared in
      // the question at all. The reversibility rating below is NOT softened:
      // deletion genuinely is harder to undo than addition, and the staged
      // alternatives are sound engineering rather than bias.
      riskQuestion:
        'What is permanently lost through elimination — and what does keeping it continue to cost?',
      pathIndicator: '🔒 Irreversible',
      commitmentLevel: 'irreversible',
      typicalReversibilityCost: 0.85,
    },
    reverse: {
      description: 'Invert or rearrange',
      emoji: '🔀',
      riskQuestion: 'What assumptions does reversal challenge?',
      pathIndicator: '🔄 Low commitment',
      commitmentLevel: 'low',
      typicalReversibilityCost: 0.3,
    },
    parameterize: {
      description: 'Identify and vary key parameters systematically',
      emoji: '🔢',
      riskQuestion: 'Which parameters create path dependencies when changed?',
      pathIndicator: '⚠️ Variable commitment',
      commitmentLevel: 'medium',
      typicalReversibilityCost: 0.35,
    },
  };

  private readonly actionOrder: ScamperAction[] = [
    'substitute',
    'combine',
    'adapt',
    'modify',
    'put_to_other_use',
    'eliminate',
    'reverse',
    'parameterize',
  ];

  // Steps with reflexivity data - ALL are action steps since SCAMPER is about modifications
  private readonly steps: StepInfo[] = [
    {
      name: 'Substitute',
      focus: 'Replace components or elements',
      emoji: '🔄',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Component replacement', 'Material substitution', 'Process alternative'],
        realityChanges: [
          'Original components no longer in use',
          'New dependencies on substitute elements',
          'Changed performance characteristics',
        ],
        futureConstraints: [
          'Must maintain compatibility with substitutes',
          'Cannot revert without replacement cost',
          'New supply chain dependencies',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Combine',
      focus: 'Merge elements or ideas',
      emoji: '🔗',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Element merging', 'Feature integration', 'System combination'],
        realityChanges: [
          'Previously separate elements now interdependent',
          'New emergent properties from combination',
          'Increased system complexity',
        ],
        futureConstraints: [
          'Separation becomes costly or impossible',
          'Must maintain combined functionality',
          'Integration points become critical dependencies',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Adapt',
      focus: 'Adjust for different context',
      emoji: '🔧',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Context adjustment', 'Environment fitting', 'Use case modification'],
        realityChanges: [
          'System optimized for specific context',
          'Loss of general-purpose flexibility',
          'New context-specific requirements',
        ],
        futureConstraints: [
          'Limited to adapted contexts',
          'Reverse adaptation requires redesign',
          'Context changes require re-adaptation',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Modify',
      focus: 'Change attributes or qualities',
      emoji: '✏️',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Attribute changes', 'Quality adjustments', 'Property modifications'],
        realityChanges: [
          'Original specifications no longer valid',
          'New performance profile established',
          'Modified user expectations',
        ],
        futureConstraints: [
          'Must work within modified parameters',
          'Documentation needs updating',
          'Testing based on new attributes',
        ],
        reversibility: 'high',
      },
    },
    {
      name: 'Put to other use',
      focus: 'Find new applications',
      emoji: '🎯',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Repurposing', 'New application discovery', 'Alternative usage'],
        realityChanges: [
          'New user base or market',
          'Different value proposition',
          'Shifted positioning',
        ],
        futureConstraints: [
          'Must serve new use case',
          'Original use may be abandoned',
          'New stakeholder expectations',
        ],
        reversibility: 'high',
      },
    },
    {
      name: 'Eliminate',
      focus: 'Remove elements permanently',
      emoji: '❌',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Component removal', 'Feature deletion', 'Process elimination'],
        realityChanges: [
          'Elements permanently removed from system',
          'Simplified but reduced functionality',
          'Dependencies on eliminated elements broken',
        ],
        futureConstraints: [
          'Cannot rely on eliminated elements',
          'Restoration requires complete rebuild',
          'Users must adapt to missing features',
          'Permanent loss of capability',
        ],
        reversibility: 'low',
      },
    },
    {
      name: 'Reverse',
      focus: 'Invert or rearrange',
      emoji: '🔀',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Order inversion', 'Flow reversal', 'Relationship rearrangement'],
        realityChanges: [
          'Fundamental assumptions challenged',
          'New operational sequence',
          'Inverted dependencies',
        ],
        futureConstraints: [
          'Must work with reversed logic',
          'Training on new flow required',
          'Reversed mental models needed',
        ],
        reversibility: 'medium',
      },
    },
    {
      name: 'Parameterize',
      focus: 'Identify and vary key parameters',
      emoji: '🔢',
      type: 'action',
      reflexiveEffects: {
        triggers: ['Variable identification', 'Parameter adjustment', 'Configuration changes'],
        realityChanges: [
          'System becomes configurable',
          'Multiple valid states exist',
          'Complexity from parameter space',
        ],
        futureConstraints: [
          'Must maintain parameter compatibility',
          'Configuration management required',
          'Testing across parameter space needed',
        ],
        reversibility: 'medium',
      },
    },
  ];

  getTechniqueInfo(): TechniqueInfo {
    return {
      name: 'SCAMPER+P',
      emoji: '🔧',
      totalSteps: 8,
      description: 'Systematic creative modification with path dependency awareness',
      focus: 'Transform through structured modifications',
      enhancedFocus: 'Now includes Parameterize and PDA (Path Dependency Analysis) for each action',
      parallelSteps: {
        canParallelize: true,
        description:
          'All SCAMPER transformations can be applied simultaneously to explore multiple modification paths',
      },
      reflexivityProfile: {
        primaryCommitmentType: 'structural',
        overallReversibility: 'medium',
        riskLevel: 'high', // High because every step creates modifications
      },
    };
  }

  getStepInfo(step: number): StepInfo {
    if (step < 1 || step > this.steps.length) {
      throw new ValidationError(
        ErrorCode.INVALID_STEP,
        `Invalid step ${step} for SCAMPER technique. Valid steps are 1-${this.steps.length}`,
        'step',
        { providedStep: step, validRange: `1-${this.steps.length}` }
      );
    }
    return this.steps[step - 1];
  }

  getStepGuidance(step: number, problem: string): string {
    // Handle out of bounds gracefully
    if (step < 1 || step > this.actionOrder.length) {
      return `Complete the SCAMPER+P process for: "${problem}"`;
    }

    const action = this.actionOrder[step - 1];
    const info = this.actions[action];

    return `${info.emoji} ${action.toUpperCase()}: ${info.description} for "${problem}". ${info.riskQuestion}`;
  }

  analyzePathImpact(
    action: ScamperAction,
    modification: string,
    // Kept for call-site compatibility; the history-degradation factors that
    // read it were retired with the verb-static retention math.
    _history: Array<{ scamperAction?: string }>
  ): ScamperPathImpact {
    const actionInfo = this.actions[action];
    if (!actionInfo) {
      throw new ValidationError(
        ErrorCode.INVALID_FIELD_VALUE,
        `Invalid SCAMPER action: ${action}. Valid actions are: ${Object.keys(this.actions).join(', ')}`,
        'scamperAction',
        { providedAction: action, validActions: Object.keys(this.actions) }
      );
    }

    // Base impact from action type. `flexibilityRetention` here is only a
    // seed: the execution layer overwrites it with 1 − the applied
    // reversibility cost — the same ladder the session actually charges —
    // replacing a verb-static product of three history-degradation factors
    // that reported near-zero retention from history length alone.
    const baseImpact: ScamperPathImpact = {
      reversible: actionInfo.commitmentLevel === 'low' || actionInfo.commitmentLevel === 'medium',
      dependenciesCreated: this.identifyDependencies(action, modification),
      optionsClosed: this.identifyClosedOptions(action, modification),
      optionsOpened: this.identifyOpenedOptions(action),
      flexibilityRetention: 1 - actionInfo.typicalReversibilityCost,
      commitmentLevel: actionInfo.commitmentLevel,
    };

    // Add recovery path for all actions
    baseImpact.recoveryPath = this.generateRecoveryPath(action);

    return baseImpact;
  }

  private identifyDependencies(action: ScamperAction, modification: string): string[] {
    const dependencies: string[] = [];

    switch (action) {
      case 'substitute':
        dependencies.push('New component compatibility');
        dependencies.push('Integration requirements');
        break;
      case 'combine':
        dependencies.push('Coupled functionality');
        dependencies.push('Shared resources');
        break;
      case 'adapt':
        dependencies.push('Context-specific adjustments');
        dependencies.push('Environmental constraints');
        break;
      case 'eliminate':
        dependencies.push('Dependencies on eliminated component');
        dependencies.push('Downstream impacts');
        break;
      case 'parameterize':
        dependencies.push('Parameter constraints');
        dependencies.push('Variable interdependencies');
        dependencies.push('Configuration management');
        break;
    }

    // Add context-specific dependency if modification is substantive
    if (modification && modification.length > 20) {
      dependencies.push(`Specific constraints from: ${modification.substring(0, 30)}...`);
    }

    return dependencies;
  }

  private identifyClosedOptions(action: ScamperAction, modification: string): string[] {
    const closed: string[] = [];

    switch (action) {
      case 'eliminate':
        closed.push(`Restoration of removed ${modification}`);
        closed.push('Features dependent on eliminated elements');
        break;
      case 'combine':
        closed.push('Independent operation of elements');
        closed.push('Separate scaling strategies');
        break;
      case 'substitute':
        closed.push('Using original component');
        closed.push('Hybrid approaches with old element');
        break;
      case 'parameterize':
        closed.push('Fixed value approaches');
        closed.push('Non-configurable implementations');
        break;
    }

    return closed;
  }

  /**
   * Options this action opens.
   *
   * Every entry is a consequence of the action itself. A word-count test used
   * to add "Complex transformation opportunities" to any modification longer
   * than five words, so a step written in a full sentence was recorded as
   * having opened an option that a terser one had not — and once options
   * entered the flexibility measure, that handed every realistic SCAMPER step
   * a credit for its prose length.
   */
  private identifyOpenedOptions(action: ScamperAction): string[] {
    const opened: string[] = [];

    switch (action) {
      case 'substitute':
        opened.push('New material properties to exploit');
        opened.push('Different optimization paths');
        break;
      case 'combine':
        opened.push('Synergistic enhancements');
        opened.push('Unified interface opportunities');
        break;
      case 'put_to_other_use':
        opened.push('New market segments');
        opened.push('Cross-domain applications');
        break;
      case 'reverse':
        opened.push('Counter-intuitive approaches');
        opened.push('Paradigm shifts from inversion');
        break;
      case 'parameterize':
        opened.push('Configuration space');
        opened.push('Dynamic adaptation');
        opened.push('A/B testing opportunities');
        break;
    }

    return opened;
  }

  private generateRecoveryPath(action: ScamperAction): string {
    switch (action) {
      case 'eliminate':
        return 'Requires complete reconstruction from scratch';
      case 'combine':
        return 'Maintain modular interfaces to enable future separation if needed';
      case 'reverse':
        return 'Reverse again to restore original arrangement';
      case 'adapt':
        return 'Remove adaptations to restore original design';
      case 'substitute':
        return 'Revert to original component with documentation';
      case 'modify':
        return 'Undo modifications to restore previous state';
      case 'put_to_other_use':
        return 'Return to original use case';
      case 'parameterize':
        return 'Lock parameters to stable values or implement versioning';
      default:
        return 'Create rollback plan before implementing modification';
    }
  }

  generateAlternatives(action: ScamperAction, currentFlexibility: number): string[] {
    if (currentFlexibility > 0.4) {
      return []; // No alternatives needed if flexibility is adequate
    }

    const alternatives: string[] = [];
    const actionInfo = this.actions[action];

    // Add critical warning if flexibility is very low
    if (currentFlexibility < 0.3) {
      alternatives.push('⚠️ Critical flexibility warning! Consider:');
      alternatives.push('Try "Modify" instead - it preserves more options');
    }

    // Suggest lower commitment alternatives
    if (actionInfo.commitmentLevel === 'irreversible' || actionInfo.commitmentLevel === 'high') {
      alternatives.push('Consider a reversible pilot/prototype first');
      alternatives.push('Implement in phases with checkpoints');
      alternatives.push('Create a simulation before full implementation');
    }

    // Action-specific alternatives
    switch (action) {
      case 'eliminate':
        alternatives.push('Archive instead of delete');
        alternatives.push('Deprecate gradually');
        alternatives.push('Move to optional/plugin architecture');
        break;
      case 'combine':
        alternatives.push('Loose coupling with interfaces');
        alternatives.push('Federation instead of fusion');
        alternatives.push('Temporary partnership first');
        break;
      case 'substitute':
        alternatives.push('A/B testing both options');
        alternatives.push('Gradual migration strategy');
        alternatives.push('Maintain compatibility layer');
        break;
    }

    return alternatives;
  }

  /**
   * Report what each modification was, labelled by its action.
   *
   * SCAMPER was the only technique with no extraction of its own, so it fell
   * through to the base class: any output under fifty characters dropped, the
   * rest split naively at the first `.` so "cut it by approx. 40%" became "cut
   * it by approx", unlabelled, in call order, and duplicated rather than
   * superseded when a step was revised.
   *
   * The action is derived from the step rather than demanded, the same way the
   * hat is for six_hats: `validateStep` accepts `scamperAction` only when it
   * matches `actionOrder[step - 1]`, so the step already determines it.
   */
  extractInsights(
    history: Array<{
      currentStep?: number;
      scamperAction?: string;
      modifications?: string[];
      pathImpact?: ScamperPathImpact;
      output?: string;
    }>
  ): string[] {
    const insights: string[] = [];
    const latestByStep = new Map<number, (typeof history)[number]>();

    history.forEach((entry, index) => {
      const step = entry.currentStep ?? index + 1;
      if (step >= 1 && step <= this.actionOrder.length) {
        latestByStep.set(step, entry);
      }
    });

    for (let step = 1; step <= this.actionOrder.length; step++) {
      const entry = latestByStep.get(step);
      if (!entry) continue;

      const action =
        (entry.scamperAction as ScamperAction | undefined) ?? this.actionOrder[step - 1];
      const declaredIndex = this.actionOrder.indexOf(action);
      const stepName =
        this.steps[declaredIndex >= 0 ? declaredIndex : step - 1]?.name ?? `Step ${step}`;

      const output = entry.output?.trim();
      if (output) {
        const summary = firstSentence(output);
        if (summary.length > 0) {
          insights.push(`${stepName}: ${summary}`);
        }
      }

      if (entry.modifications && entry.modifications.length > 0) {
        insights.push(`${stepName} modifications: ${entry.modifications.join('; ')}`);
      }

      // What a modification costs in future freedom is the point of running
      // SCAMPER with path analysis, and it reached no insight at all.
      const impact = entry.pathImpact;
      if (impact) {
        const closed = impact.optionsClosed?.length ?? 0;
        const opened = impact.optionsOpened?.length ?? 0;
        const parts = [
          impact.commitmentLevel ? `${impact.commitmentLevel} commitment` : undefined,
          impact.reversible === false ? 'not reversible' : undefined,
          closed > 0 ? `closes ${impact.optionsClosed.join(', ')}` : undefined,
          opened > 0 ? `opens ${impact.optionsOpened.join(', ')}` : undefined,
          impact.recoveryPath ? `recovery: ${impact.recoveryPath}` : undefined,
        ].filter(Boolean);
        if (parts.length > 0) {
          insights.push(`${stepName} path impact: ${parts.join('; ')}`);
        }
      }
    }

    return insights;
  }

  getAction(step: number): ScamperAction {
    return this.actionOrder[step - 1];
  }

  getAllActions(): Record<ScamperAction, ScamperActionInfo> {
    return { ...this.actions };
  }
}
