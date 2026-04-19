/**
 * Capability Strategy - Create options by developing new skills
 */

import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';
import type { LateralTechnique } from '../../../index.js';

export class CapabilityStrategy extends BaseOptionStrategy {
  readonly strategyName = 'capability' as const;
  readonly description = 'Build flexibility by developing new capabilities and skills';
  readonly typicalFlexibilityGain = { min: 0.2, max: 0.45 };
  readonly applicableCategories: OptionCategory[] = ['capability', 'process'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Look for capability gaps or skill constraints
    const hasCapabilityConstraints = context.pathMemory.constraints.some(
      c =>
        c.description.toLowerCase().includes('skill') ||
        c.description.toLowerCase().includes('expertise') ||
        c.description.toLowerCase().includes('knowledge') ||
        c.description.toLowerCase().includes('capability')
    );

    const hasLimitedTechniques =
      new Set(context.pathMemory.pathHistory.map(e => e.technique)).size < 3;

    return hasCapabilityConstraints || hasLimitedTechniques;
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];
    const capabilities = this.analyzeCapabilityGaps(context);

    // Generate skill development option
    const skillOption = this.createSkillDevelopmentOption(capabilities, context);
    if (skillOption && this.isCategoryAllowed(skillOption.category, context)) {
      options.push(skillOption);
    }

    // Generate knowledge transfer option
    const transferOption = this.createKnowledgeTransferOption(capabilities, context);
    if (transferOption && this.isCategoryAllowed(transferOption.category, context)) {
      options.push(transferOption);
    }

    // Generate tool mastery option
    const toolOption = this.createToolMasteryOption(capabilities, context);
    if (toolOption && this.isCategoryAllowed(toolOption.category, context)) {
      options.push(toolOption);
    }

    // Generate learning system option
    const systemOption = this.createLearningSystemOption(context);
    if (systemOption && this.isCategoryAllowed(systemOption.category, context)) {
      options.push(systemOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    if (option.name.includes('Quick')) return 'low';
    if (option.name.includes('Transfer') || option.name.includes('Tool')) return 'medium';
    return 'high'; // System building requires more effort
  }

  private analyzeCapabilityGaps(context: OptionGenerationContext): {
    missingSkills: string[];
    underutilizedSkills: string[];
    emergingNeeds: string[];
    transferOpportunities: string[];
  } {
    const analysis = {
      missingSkills: [] as string[],
      underutilizedSkills: [] as string[],
      emergingNeeds: [] as string[],
      transferOpportunities: [] as string[],
    };

    // Analyze constraints for skill gaps
    context.pathMemory.constraints.forEach(c => {
      if (c.reversibilityCost > 0.6) {
        // High commitment constraints often indicate skill gaps
        const skill = this.inferRequiredSkill(c.description);
        if (skill) {
          analysis.missingSkills.push(skill);
        }
      }
    });

    // Analyze techniques used vs available
    const usedTechniques = new Set(context.pathMemory.pathHistory.map(e => e.technique));
    const allTechniques: LateralTechnique[] = [
      'six_hats',
      'po',
      'random_entry',
      'scamper',
      'concept_extraction',
      'yes_and',
      'design_thinking',
      'triz',
    ];

    allTechniques.forEach(technique => {
      if (!usedTechniques.has(technique)) {
        analysis.underutilizedSkills.push(`${technique} methodology`);
      }
    });

    // Identify emerging needs based on problem evolution
    if (context.currentFlexibility.flexibilityScore < 0.3) {
      analysis.emergingNeeds.push('constraint navigation', 'rapid pivoting', 'crisis management');
    } else {
      analysis.emergingNeeds.push(
        'opportunity recognition',
        'strategic thinking',
        'innovation methods'
      );
    }

    // Identify transfer opportunities
    if (analysis.missingSkills.length > 0 && analysis.underutilizedSkills.length > 0) {
      analysis.transferOpportunities.push('cross-functional learning');
    }

    return analysis;
  }

  private createSkillDevelopmentOption(
    capabilities: ReturnType<typeof this.analyzeCapabilityGaps>,
    context: OptionGenerationContext
  ): Option {
    const prioritySkill =
      capabilities.missingSkills[0] || capabilities.emergingNeeds[0] || 'adaptive thinking';

    // Adjust urgency based on current flexibility
    const isUrgent = context.currentFlexibility.flexibilityScore < 0.3;
    const timeframe = isUrgent ? 'rapid' : 'systematic';

    const actions = [
      `Assess current ${prioritySkill} level`,
      `Identify ${timeframe} learning resources and methods`,
      'Create practice opportunities',
      'Apply new skills to current challenges',
      'Share learnings with team',
    ];

    // Check for time constraints
    const hasTimeConstraints = context.pathMemory.constraints.some(
      c =>
        c.description.toLowerCase().includes('time') ||
        c.description.toLowerCase().includes('deadline')
    );

    const prerequisites = hasTimeConstraints
      ? ['Minimal time allocation for learning', 'Just-in-time learning resources']
      : ['Time allocation for learning', 'Access to learning resources'];

    return this.createOption(
      `Develop ${this.formatSkillName(prioritySkill)} Capability`,
      `Build ${prioritySkill} skills to address current constraints. This capability will open new solution approaches and reduce dependency on external expertise. ${isUrgent ? 'Focus on immediate application.' : 'Build deep expertise systematically.'}`,
      'capability',
      actions,
      prerequisites
    );
  }

  private createKnowledgeTransferOption(
    capabilities: ReturnType<typeof this.analyzeCapabilityGaps>,
    context: OptionGenerationContext
  ): Option {
    const transferableSkill = capabilities.underutilizedSkills[0] || 'existing expertise';

    // Check team size and collaboration constraints
    const hasCollaborationConstraints = context.pathMemory.constraints.some(
      c =>
        c.description.toLowerCase().includes('team') ||
        c.description.toLowerCase().includes('collaboration')
    );

    const actions = hasCollaborationConstraints
      ? [
          'Identify critical knowledge gaps',
          'Create lightweight knowledge capture',
          'Use asynchronous transfer methods',
          'Document key insights only',
          'Verify critical knowledge transfer',
        ]
      : [
          'Map knowledge holders and seekers',
          'Design knowledge transfer format',
          'Create documentation templates',
          'Facilitate transfer sessions',
          'Verify knowledge absorption',
        ];

    const urgencyLevel =
      context.currentFlexibility.flexibilityScore < 0.4 ? 'rapid' : 'comprehensive';

    return this.createOption(
      'Enable Knowledge Transfer',
      `Transfer ${transferableSkill} from those who have it to those who need it. This multiplies team capability without external investment. ${urgencyLevel === 'rapid' ? 'Focus on critical knowledge first.' : 'Build comprehensive knowledge base.'}`,
      'capability',
      actions,
      ['Knowledge holder availability', 'Documentation infrastructure']
    );
  }

  private createToolMasteryOption(
    capabilities: ReturnType<typeof this.analyzeCapabilityGaps>,
    context: OptionGenerationContext
  ): Option {
    const underusedTechnique =
      capabilities.underutilizedSkills
        .find(s => s.includes('methodology'))
        ?.replace(' methodology', '') || 'analytical tools';

    // Adapt learning approach based on flexibility urgency
    const needsQuickWins = context.currentFlexibility.flexibilityScore < 0.35;
    const problemDomain = context.sessionState?.problem || 'current challenge';

    const actions = needsQuickWins
      ? [
          `Quick scan of ${underusedTechnique} core concepts`,
          `Apply immediately to ${problemDomain}`,
          'Learn by doing with real problems',
          'Document immediate wins',
          'Share quick wins with team',
        ]
      : [
          `Learn ${underusedTechnique} fundamentals`,
          'Practice with low-stakes problems',
          'Apply to current challenge',
          'Document what works',
          'Train others in successful applications',
        ];

    return this.createOption(
      `Master ${this.formatSkillName(underusedTechnique)} Technique`,
      `Develop proficiency in ${underusedTechnique} to expand problem-solving toolkit. New techniques often reveal hidden options in familiar problems. ${needsQuickWins ? 'Fast-track learning for immediate impact.' : 'Build solid foundation for long-term mastery.'}`,
      'capability',
      actions,
      needsQuickWins
        ? ['Quick reference guides', 'Immediate application opportunity']
        : ['Learning materials', 'Practice time', 'Patience with learning curve']
    );
  }

  private createLearningSystemOption(context: OptionGenerationContext): Option {
    // Scale system complexity based on constraints and flexibility
    const hasResourceConstraints = context.pathMemory.constraints.some(
      c => c.type === 'resource' || c.description.toLowerCase().includes('budget')
    );
    const isLowFlexibility = context.currentFlexibility.flexibilityScore < 0.4;

    const actions =
      hasResourceConstraints || isLowFlexibility
        ? [
            'Create simple learning log',
            'Add 5-minute retrospectives',
            'Use existing tools for capture',
            'Share learnings in standup',
            'Track one key metric',
          ]
        : [
            'Design capture mechanism for learnings',
            'Create reflection triggers after decisions',
            'Build searchable knowledge repository',
            'Establish regular skill-sharing sessions',
            'Measure capability growth over time',
          ];

    const systemScale =
      hasResourceConstraints || isLowFlexibility ? 'lightweight' : 'comprehensive';

    return this.createOption(
      `Build ${systemScale === 'lightweight' ? 'Lightweight' : ''} Learning System`,
      `Create ${systemScale} approach to capturing and spreading learning. This compounds team capability over time and prevents repeated mistakes. ${systemScale === 'lightweight' ? 'Start small with minimal overhead.' : 'Build robust knowledge infrastructure.'}`,
      'capability',
      actions,
      systemScale === 'lightweight'
        ? ['5 minutes per day commitment', 'Existing collaboration tools']
        : ['Team commitment to documentation', 'Simple tools for capture']
    );
  }

  private inferRequiredSkill(constraintDescription: string): string | null {
    const lowerDesc = constraintDescription.toLowerCase();

    // Map constraint patterns to required skills
    if (lowerDesc.includes('technical') || lowerDesc.includes('complex')) {
      return 'technical problem-solving';
    }
    if (lowerDesc.includes('stakeholder') || lowerDesc.includes('communication')) {
      return 'stakeholder management';
    }
    if (lowerDesc.includes('resource') || lowerDesc.includes('budget')) {
      return 'resource optimization';
    }
    if (lowerDesc.includes('time') || lowerDesc.includes('deadline')) {
      return 'time management';
    }
    if (lowerDesc.includes('quality') || lowerDesc.includes('standard')) {
      return 'quality assurance';
    }

    return null;
  }

  private formatSkillName(skill: string): string {
    // Format skill name for display
    return skill
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
