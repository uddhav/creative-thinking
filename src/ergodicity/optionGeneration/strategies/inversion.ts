/**
 * Inversion Strategy - Create options by flipping assumptions
 */

import { BaseOptionStrategy } from './base.js';
import { getSecureRandomIndex } from '../../../utils/safeCrypto.js';
import type {
  Option,
  OptionGenerationContext,
  OptionCategory,
  InvertibleAssumption,
} from '../types.js';

export class InversionStrategy extends BaseOptionStrategy {
  readonly strategyName = 'inversion' as const;
  readonly description = 'Create options by inverting current assumptions and constraints';
  readonly typicalFlexibilityGain = { min: 0.15, max: 0.35 };
  readonly applicableCategories: OptionCategory[] = ['conceptual', 'process', 'relational'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Inversion works well when stuck with "must" or "cannot" constraints
    const hasStrongAssumptions = context.pathMemory.constraints.some(
      c => c.strength > 0.7 || c.reversibilityCost > 0.7
    );

    const hasRigidThinking = context.pathMemory.pathHistory.some(
      e =>
        e.decision.includes('must') ||
        e.decision.includes('always') ||
        e.decision.includes('never') ||
        e.decision.includes('only')
    );

    return hasStrongAssumptions || hasRigidThinking;
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];
    const assumptions = this.identifyInvertibleAssumptions(context);

    // Generate inversion options for top assumptions
    assumptions.slice(0, 3).forEach(assumption => {
      const option = this.createInversionOption(assumption, context);
      if (option && this.isCategoryAllowed(option.category, context)) {
        options.push(option);
      }
    });

    // Add constraint-to-feature inversion if applicable
    if (this.hasInvertibleConstraints(context)) {
      const constraintOption = this.createConstraintInversionOption(context);
      if (constraintOption && this.isCategoryAllowed(constraintOption.category, context)) {
        options.push(constraintOption);
      }
    }

    // Add process inversion option
    const processOption = this.createProcessInversionOption(context);
    if (processOption && this.isCategoryAllowed(processOption.category, context)) {
      options.push(processOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    // Inversions vary in effort based on scope
    if (option.name.includes('Assumption')) return 'low';
    if (option.name.includes('Process')) return 'medium';
    return 'high'; // Constraint inversions often require more work
  }

  private identifyInvertibleAssumptions(context: OptionGenerationContext): InvertibleAssumption[] {
    const assumptions: InvertibleAssumption[] = [];

    // Extract assumptions from constraints
    context.pathMemory.constraints.forEach((constraint, index) => {
      const assumption = this.extractAssumption(constraint.description);
      if (assumption) {
        assumptions.push({
          id: `constraint_${index}`,
          assumption: assumption.original,
          domain: constraint.type,
          inversion: assumption.inverted,
          potentialBenefit: this.assessInversionBenefit(assumption.inverted),
          riskLevel: constraint.strength > 0.7 ? 'high' : 'medium',
          exampleApplication: this.generateExample(assumption.inverted, constraint.type),
        });
      }
    });

    // Extract assumptions from decisions
    context.pathMemory.pathHistory.slice(-10).forEach((event, index) => {
      const assumption = this.extractAssumption(event.decision);
      if (assumption) {
        assumptions.push({
          id: `decision_${index}`,
          assumption: assumption.original,
          domain: 'process',
          inversion: assumption.inverted,
          potentialBenefit: 'Opens new solution paths',
          riskLevel: event.commitmentLevel > 0.6 ? 'medium' : 'low',
          exampleApplication: this.generateExample(assumption.inverted, 'process'),
        });
      }
    });

    // Add common implicit assumptions
    if (assumptions.length < 2) {
      assumptions.push(...this.getCommonAssumptions(context));
    }

    // Sort by potential impact (low risk, high benefit first)
    return assumptions.sort((a, b) => {
      const aScore = a.riskLevel === 'low' ? 3 : a.riskLevel === 'medium' ? 2 : 1;
      const bScore = b.riskLevel === 'low' ? 3 : b.riskLevel === 'medium' ? 2 : 1;
      return bScore - aScore;
    });
  }

  private createInversionOption(
    assumption: InvertibleAssumption,
    context: OptionGenerationContext
  ): Option {
    // Adjust risk tolerance based on current flexibility
    const isLowFlexibility = context.currentFlexibility.flexibilityScore < 0.4;
    const riskTolerance = isLowFlexibility ? 'cautious' : 'bold';

    // Check if we have strong constraints that make inversion harder
    const hasStrongConstraints = context.pathMemory.constraints.some(c => c.strength > 0.7);

    const actions = [
      `Question the assumption: "${assumption.assumption}"`,
      `Explore what happens if: "${assumption.inversion}"`,
      `Identify benefits of the inverted approach`,
      `Design ${riskTolerance === 'cautious' ? 'minimal viable' : 'comprehensive'} experiment to test inversion`,
      `Measure impact on flexibility and outcomes`,
    ];

    const prerequisites = hasStrongConstraints
      ? [
          'Document current assumption and its basis',
          'Identify stakeholders affected by change',
          'Prepare detailed rollback plan',
          'Get stakeholder buy-in for experiment',
        ]
      : [
          'Document current assumption and its basis',
          'Identify stakeholders affected by change',
          'Prepare rollback plan',
        ];

    const urgencyNote = isLowFlexibility
      ? ' Start with low-risk inversions to build confidence.'
      : ' Bold inversions can create breakthrough opportunities.';

    return this.createOption(
      `Invert: ${this.shortenAssumption(assumption.assumption)}`,
      `Challenge the assumption that ${assumption.assumption}. Instead, explore: ${assumption.inversion}. ${assumption.potentialBenefit}. Example: ${assumption.exampleApplication}${urgencyNote}`,
      'conceptual',
      actions,
      prerequisites
    );
  }

  private createConstraintInversionOption(context: OptionGenerationContext): Option {
    const invertibleConstraint = context.pathMemory.constraints.find(
      c => c.strength > 0.5 && c.type !== 'regulatory'
    );

    if (!invertibleConstraint) {
      return this.createGenericConstraintInversion();
    }

    // Truncate long constraint descriptions
    const constraintDesc =
      invertibleConstraint.description.length > 100
        ? invertibleConstraint.description.substring(0, 97) + '...'
        : invertibleConstraint.description;

    const actions = [
      `Identify the constraint: ${constraintDesc}`,
      'List all negative impacts of the constraint',
      'Brainstorm how each negative could become a positive',
      'Design features that leverage the constraint',
      'Create value proposition around the constraint',
    ];

    return this.createOption(
      'Turn Constraint into Feature',
      `Transform the limitation "${constraintDesc}" into a unique selling point or differentiator. What seems like a restriction can become a source of innovation and competitive advantage.`,
      'conceptual',
      actions,
      ['Marketing team alignment', 'Customer feedback on constraint perception']
    );
  }

  private createProcessInversionOption(context: OptionGenerationContext): Option | null {
    const currentProcess = this.extractProcessFlow(context);
    if (!currentProcess) return null;

    const actions = [
      'Map current process flow',
      `Reverse the order: ${currentProcess.reversed}`,
      'Identify what breaks with reversal',
      'Design adaptations to make reversal work',
      'Test reversed process with safe experiment',
    ];

    return this.createOption(
      'Reverse Process Flow',
      `Invert the current process from "${currentProcess.original}" to "${currentProcess.reversed}". This challenges sequential assumptions and may reveal unnecessary dependencies or new efficiencies.`,
      'process',
      actions,
      ['Process documentation complete', 'Team trained on reversal logic']
    );
  }

  private extractAssumption(text: string): { original: string; inverted: string } | null {
    const lowerText = text.toLowerCase();

    // Pattern matching for assumptions
    if (lowerText.includes('must')) {
      const assumption = text;
      const inverted = text.replace(/must/gi, 'could optionally');
      return { original: assumption, inverted };
    }

    if (lowerText.includes('always')) {
      const assumption = text;
      const inverted = text.replace(/always/gi, 'sometimes not');
      return { original: assumption, inverted };
    }

    if (lowerText.includes('never')) {
      const assumption = text;
      const inverted = text.replace(/never/gi, 'sometimes');
      return { original: assumption, inverted };
    }

    if (lowerText.includes('requires')) {
      const assumption = text;
      const inverted = text.replace(/requires/gi, 'works without');
      return { original: assumption, inverted };
    }

    if (lowerText.includes('depends on')) {
      const assumption = text;
      const inverted = text.replace(/depends on/gi, 'is independent of');
      return { original: assumption, inverted };
    }

    return null;
  }

  private assessInversionBenefit(inversion: string): string {
    const benefits = [
      'Eliminates dependency bottlenecks',
      'Creates unexpected value propositions',
      'Reduces system complexity',
      'Opens parallel execution paths',
      'Challenges market expectations positively',
      'Simplifies user experience',
      'Reduces resource requirements',
    ];

    // Simple heuristic based on inversion type
    if (inversion.includes('optional')) return benefits[0];
    if (inversion.includes('without')) return benefits[2];
    if (inversion.includes('independent')) return benefits[3];
    if (inversion.includes('sometimes not')) return benefits[5];

    // Random selection for variety
    return benefits[getSecureRandomIndex(benefits.length)];
  }

  private generateExample(inversion: string, domain: string): string {
    const examples: Record<string, string[]> = {
      technical: [
        'GitHub made version control distributed instead of centralized',
        'NoSQL databases removed schema requirements',
        'Serverless computing eliminated server management',
      ],
      process: [
        'Agile inverted detailed planning to iterative discovery',
        'Just-in-time manufacturing reversed inventory stockpiling',
        'Test-driven development writes tests before code',
      ],
      relational: [
        'Open source inverted proprietary development',
        'Crowdsourcing reversed expert-only contributions',
        'Self-service replaced assisted service models',
      ],
      default: [
        'Netflix eliminated late fees by inverting rental model',
        'Tesla sold cars directly, bypassing dealerships',
        'Airbnb turned constraint of no hotels into home-sharing',
      ],
    };

    const domainExamples = examples[domain] || examples.default;
    return domainExamples[getSecureRandomIndex(domainExamples.length)];
  }

  private shortenAssumption(assumption: string): string {
    const words = assumption.split(/\s+/);
    if (words.length <= 4) return assumption;

    // Extract key words
    const keywords = words.filter(
      word =>
        word.length > 3 &&
        !['that', 'this', 'with', 'from', 'must', 'always', 'never'].includes(word.toLowerCase())
    );

    return keywords.slice(0, 3).join(' ') + '...';
  }

  private hasInvertibleConstraints(context: OptionGenerationContext): boolean {
    return context.pathMemory.constraints.some(c => c.type !== 'regulatory' && c.strength > 0.5);
  }

  private getCommonAssumptions(context: OptionGenerationContext): InvertibleAssumption[] {
    const flexibility = context.currentFlexibility.flexibilityScore;

    if (flexibility < 0.3) {
      return [
        {
          id: 'common_1',
          assumption: 'We must preserve all existing functionality',
          domain: 'technical',
          inversion: 'We could deprecate rarely-used features',
          potentialBenefit: 'Reduces maintenance burden and complexity',
          riskLevel: 'medium',
          exampleApplication: 'Apple removed headphone jack to enable new features',
        },
      ];
    }

    return [
      {
        id: 'common_2',
        assumption: 'Changes must be gradual and safe',
        domain: 'process',
        inversion: 'Bold changes could create breakthrough value',
        potentialBenefit: 'Leapfrogs competition and captures attention',
        riskLevel: 'high',
        exampleApplication: 'SpaceX pursued reusable rockets when everyone said impossible',
      },
    ];
  }

  private createGenericConstraintInversion(): Option {
    return this.createOption(
      'Convert Limitations to Advantages',
      'Identify your biggest constraints and explore how they could become unique advantages. Limitations often force creative solutions that become competitive differentiators.',
      'conceptual',
      [
        'List top 3 constraints',
        'Brainstorm positive aspects of each constraint',
        'Find examples of similar constraints becoming advantages',
        'Design features that embrace constraints',
        'Test market response to constraint-as-feature',
      ],
      ['Competitive analysis of constraint handling']
    );
  }

  private extractProcessFlow(context: OptionGenerationContext): {
    original: string;
    reversed: string;
  } | null {
    const recentSteps = context.pathMemory.pathHistory.slice(-4);
    if (recentSteps.length < 2) return null;

    const firstStep = this.extractActionWord(recentSteps[0].decision);
    const lastStep = this.extractActionWord(recentSteps[recentSteps.length - 1].decision);

    if (firstStep && lastStep && firstStep !== lastStep) {
      return {
        original: `${firstStep} → ... → ${lastStep}`,
        reversed: `${lastStep} → ... → ${firstStep}`,
      };
    }

    return null;
  }

  private extractActionWord(decision: string): string | null {
    const words = decision.toLowerCase().split(/\s+/);
    const actionWords = [
      'analyze',
      'design',
      'implement',
      'test',
      'deploy',
      'plan',
      'execute',
      'validate',
    ];

    const found = words.find(word => actionWords.some(action => word.includes(action)));

    return found || null;
  }
}
