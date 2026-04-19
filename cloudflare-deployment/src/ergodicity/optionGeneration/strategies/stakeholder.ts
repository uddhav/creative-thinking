/**
 * Stakeholder Strategy - Create options by shifting perspectives
 */

import { BaseOptionStrategy } from './base.js';
import type { Option, OptionGenerationContext, OptionCategory } from '../types.js';

interface Stakeholder {
  name: string;
  currentPosition: string;
  flexibility: 'low' | 'medium' | 'high';
  influence: 'low' | 'medium' | 'high';
}

export class StakeholderStrategy extends BaseOptionStrategy {
  readonly strategyName = 'stakeholder' as const;
  readonly description =
    'Generate options by considering different stakeholder perspectives and needs';
  readonly typicalFlexibilityGain = { min: 0.15, max: 0.4 };
  readonly applicableCategories: OptionCategory[] = ['relational', 'process'];

  isApplicable(context: OptionGenerationContext): boolean {
    // Look for stakeholder-related constraints or decisions
    const hasStakeholderConstraints = context.pathMemory.constraints.some(
      c =>
        c.type === 'relational' ||
        c.description.toLowerCase().includes('stakeholder') ||
        c.description.toLowerCase().includes('user') ||
        c.description.toLowerCase().includes('customer')
    );

    const hasRelationalCommitments = context.pathMemory.pathHistory.some(
      e =>
        e.decision.toLowerCase().includes('agreed') ||
        e.decision.toLowerCase().includes('promised') ||
        e.commitmentLevel > 0.5
    );

    return hasStakeholderConstraints || hasRelationalCommitments;
  }

  generate(context: OptionGenerationContext): Option[] {
    const options: Option[] = [];
    const stakeholders = this.identifyStakeholders(context);

    // Generate perspective shift options
    const perspectiveOption = this.createPerspectiveShiftOption(stakeholders, context);
    if (perspectiveOption && this.isCategoryAllowed(perspectiveOption.category, context)) {
      options.push(perspectiveOption);
    }

    // Generate stakeholder reframe option
    const reframeOption = this.createStakeholderReframeOption(stakeholders, context);
    if (reframeOption && this.isCategoryAllowed(reframeOption.category, context)) {
      options.push(reframeOption);
    }

    // Generate coalition building option
    const coalitionOption = this.createCoalitionOption(stakeholders, context);
    if (coalitionOption && this.isCategoryAllowed(coalitionOption.category, context)) {
      options.push(coalitionOption);
    }

    // Generate value redistribution option
    const redistributionOption = this.createValueRedistributionOption(stakeholders, context);
    if (redistributionOption && this.isCategoryAllowed(redistributionOption.category, context)) {
      options.push(redistributionOption);
    }

    return options;
  }

  estimateEffort(option: Option): 'low' | 'medium' | 'high' {
    if (option.name.includes('Perspective')) return 'low';
    if (option.name.includes('Reframe')) return 'medium';
    return 'high'; // Coalition and redistribution require more coordination
  }

  private identifyStakeholders(context: OptionGenerationContext): Stakeholder[] {
    const stakeholders: Stakeholder[] = [];

    // Extract from constraints and decisions
    const mentionedStakeholders = new Set<string>();

    context.pathMemory.constraints.forEach(c => {
      const extracted = this.extractStakeholderMentions(c.description);
      extracted.forEach(s => mentionedStakeholders.add(s));
    });

    context.pathMemory.pathHistory.forEach(e => {
      const extracted = this.extractStakeholderMentions(e.decision);
      extracted.forEach(s => mentionedStakeholders.add(s));
    });

    // Convert to stakeholder profiles
    mentionedStakeholders.forEach(name => {
      stakeholders.push({
        name,
        currentPosition: this.inferPosition(name, context),
        flexibility: this.assessStakeholderFlexibility(name, context),
        influence: this.assessStakeholderInfluence(name, context),
      });
    });

    // Add default stakeholders if few found
    if (stakeholders.length < 3) {
      stakeholders.push(
        {
          name: 'End Users',
          currentPosition: 'Need simple, effective solutions',
          flexibility: 'high',
          influence: 'medium',
        },
        {
          name: 'Team Members',
          currentPosition: 'Want sustainable workload',
          flexibility: 'medium',
          influence: 'high',
        },
        {
          name: 'Leadership',
          currentPosition: 'Focused on outcomes and timeline',
          flexibility: 'low',
          influence: 'high',
        }
      );
    }

    return stakeholders;
  }

  private createPerspectiveShiftOption(
    stakeholders: Stakeholder[],
    context: OptionGenerationContext
  ): Option {
    const flexibleStakeholder = stakeholders.find(s => s.flexibility === 'high') || stakeholders[0];

    // Check past stakeholder engagement and current urgency
    const pastEngagements = context.pathMemory.pathHistory.filter(
      e =>
        e.decision.toLowerCase().includes('stakeholder') ||
        e.decision.toLowerCase().includes('perspective')
    ).length;
    const isUrgent = context.currentFlexibility.flexibilityScore < 0.35;

    // Adjust approach based on engagement history and urgency
    const engagementDepth = pastEngagements > 2 ? 'targeted' : isUrgent ? 'rapid' : 'comprehensive';

    const actions = [
      `${engagementDepth === 'rapid' ? 'Quick interview with' : 'Interview'} ${flexibleStakeholder.name} to understand ${engagementDepth === 'targeted' ? 'unaddressed' : 'their core'} needs`,
      'Map current solution to their perspective',
      `Identify ${engagementDepth === 'comprehensive' ? 'all' : 'key'} misalignments between our view and theirs`,
      `Redesign approach from their viewpoint${engagementDepth === 'targeted' ? ' focusing on gaps' : ''}`,
      'Validate new approach with other stakeholders',
    ];

    const prerequisites =
      engagementDepth === 'rapid'
        ? ['30-minute stakeholder slot', 'Prepared questions']
        : engagementDepth === 'targeted'
          ? ['Previous engagement notes', 'Gap analysis prepared']
          : [
              'Stakeholder availability for deep dive',
              'Open mindset in team',
              'Workshop materials',
            ];

    const approachNote =
      engagementDepth === 'rapid'
        ? ' Quick wins through fresh perspective.'
        : engagementDepth === 'targeted'
          ? ' Focus on previously missed insights.'
          : ' Deep understanding drives breakthrough solutions.';

    return this.createOption(
      `Adopt ${flexibleStakeholder.name} Perspective`,
      `Shift primary viewpoint from internal to ${flexibleStakeholder.name} perspective. They ${flexibleStakeholder.currentPosition.toLowerCase()}. Designing from their viewpoint may reveal simpler, more flexible solutions.${approachNote}`,
      'relational',
      actions,
      prerequisites
    );
  }

  private createStakeholderReframeOption(
    stakeholders: Stakeholder[],
    context: OptionGenerationContext
  ): Option {
    const influentialStakeholder =
      stakeholders.find(s => s.influence === 'high') || stakeholders[0];

    // Check communication history and constraint types
    const pastCommunications = context.pathMemory.pathHistory.filter(
      e =>
        e.decision.toLowerCase().includes('communicate') ||
        e.decision.toLowerCase().includes('frame')
    ).length;
    const hasRelationalConstraints = context.pathMemory.constraints.some(
      c => c.type === 'relational' || c.description.toLowerCase().includes('perception')
    );

    // Adjust framing strategy based on context
    const framingStrategy =
      pastCommunications > 2 ? 'innovative' : hasRelationalConstraints ? 'corrective' : 'strategic';

    const actions = [
      `Identify ${framingStrategy === 'corrective' ? 'problematic' : 'current'} framing of the problem`,
      `Develop ${framingStrategy} framing appealing to ${influentialStakeholder.name}`,
      `Create ${framingStrategy === 'innovative' ? 'bold' : 'compelling'} narrative connecting new frame to their interests`,
      `Test reframe with ${framingStrategy === 'corrective' ? 'affected' : 'small'} group`,
      `Roll out new framing in ${framingStrategy === 'innovative' ? 'phased' : 'all'} communications`,
    ];

    const prerequisites =
      framingStrategy === 'corrective'
        ? ['Root cause analysis of perception issues', 'Trust-building plan']
        : framingStrategy === 'innovative'
          ? ['Creative messaging workshop', 'Bold communication strategy']
          : ['Understanding of stakeholder values', 'Communication channel access'];

    const strategyNote =
      framingStrategy === 'corrective'
        ? ' Address existing perception issues directly.'
        : framingStrategy === 'innovative'
          ? ' Previous framings worked - try bold new angle.'
          : ' Strategic positioning for maximum influence.';

    return this.createOption(
      'Reframe for Key Stakeholders',
      `Reposition the current challenge in terms that resonate with ${influentialStakeholder.name}. Transform constraints into opportunities by aligning with what they value most.${strategyNote}`,
      'relational',
      actions,
      prerequisites
    );
  }

  private createCoalitionOption(
    stakeholders: Stakeholder[],
    context: OptionGenerationContext
  ): Option | null {
    const potentialAllies = stakeholders.filter(
      s => s.flexibility !== 'low' && s.influence !== 'low'
    );

    if (potentialAllies.length < 2) return null;

    // Check coalition-building history and political constraints
    const pastCoalitionAttempts = context.pathMemory.pathHistory.filter(
      e =>
        e.decision.toLowerCase().includes('coalition') || e.decision.toLowerCase().includes('unite')
    ).length;
    const hasPoliticalConstraints = context.pathMemory.constraints.some(
      c => c.type === 'relational' || c.description.toLowerCase().includes('political')
    );

    // Adjust coalition strategy based on context
    const coalitionApproach =
      pastCoalitionAttempts > 1 ? 'selective' : hasPoliticalConstraints ? 'careful' : 'ambitious';

    const actions = [
      `Identify ${coalitionApproach === 'selective' ? 'unique' : 'shared'} interests between ${potentialAllies.map(s => s.name).join(' and ')}`,
      `Design ${coalitionApproach === 'careful' ? 'low-risk' : 'win-win'} proposal addressing ${coalitionApproach === 'selective' ? 'specific' : 'shared'} interests`,
      `Approach stakeholders ${coalitionApproach === 'careful' ? 'very carefully' : 'individually first'}`,
      `Facilitate ${coalitionApproach === 'ambitious' ? 'expansive' : 'focused'} joint discussion`,
      `${coalitionApproach === 'careful' ? 'Gradually formalize' : 'Formalize'} coalition agreement`,
    ];

    const prerequisites =
      coalitionApproach === 'careful'
        ? ['Deep trust with each stakeholder', 'Political landscape mapping', 'Exit strategy']
        : coalitionApproach === 'selective'
          ? ['Clear unique value proposition', 'Previous coalition learnings']
          : ['Trust with key stakeholders', 'Neutral facilitator available'];

    const approachNote =
      coalitionApproach === 'careful'
        ? ' Navigate political sensitivities with care.'
        : coalitionApproach === 'selective'
          ? ' Focus on unexplored coalition opportunities.'
          : ' Build powerful alliance for transformation.';

    return this.createOption(
      'Build Stakeholder Coalition',
      `Unite ${potentialAllies.map(s => s.name).join(' and ')} around ${coalitionApproach === 'selective' ? 'unique' : 'shared'} interests. Combined influence can overcome individual constraints and create new possibilities.${approachNote}`,
      'relational',
      actions,
      prerequisites
    );
  }

  private createValueRedistributionOption(
    stakeholders: Stakeholder[],
    context: OptionGenerationContext
  ): Option {
    // Identify underserved stakeholders
    const underservedCount = stakeholders.filter(s => s.flexibility === 'low').length;

    // Check for past value redistribution attempts and resource constraints
    const pastRedistributions = context.pathMemory.pathHistory.filter(
      e =>
        e.decision.toLowerCase().includes('value') ||
        e.decision.toLowerCase().includes('redistribute')
    ).length;
    const hasResourceConstraints = context.pathMemory.constraints.some(
      c => c.type === 'resource' || c.description.toLowerCase().includes('limited')
    );

    // Adjust redistribution strategy based on context
    const redistributionStrategy =
      pastRedistributions > 1 ? 'innovative' : hasResourceConstraints ? 'efficient' : 'expansive';

    const actions = [
      'Map current value distribution across stakeholders',
      `Identify ${redistributionStrategy === 'innovative' ? 'overlooked' : 'underserved'} stakeholders with high potential`,
      `Design value shifts that create ${redistributionStrategy === 'efficient' ? 'maximum impact with minimal cost' : 'positive-sum outcomes'}`,
      `Model impact of ${redistributionStrategy} redistribution`,
      `Create ${redistributionStrategy === 'efficient' ? 'lean' : 'phased'} implementation plan`,
    ];

    const prerequisites =
      redistributionStrategy === 'innovative'
        ? ['Creative value mapping session', 'Stakeholder journey analysis', 'Innovation budget']
        : redistributionStrategy === 'efficient'
          ? ['Cost-benefit analysis', 'Resource optimization plan']
          : [
              'Current value flow analysis',
              'Stakeholder impact assessment',
              'Change management resources',
            ];

    const strategyNote =
      redistributionStrategy === 'innovative'
        ? ` ${underservedCount} underserved groups identified. Find creative new value streams.`
        : redistributionStrategy === 'efficient'
          ? ` Resource-conscious approach to maximize impact.`
          : ` ${underservedCount} underserved groups offer expansion opportunities.`;

    return this.createOption(
      'Redistribute Stakeholder Value',
      `Redesign how value flows between stakeholders. By better serving currently underserved groups, new options and alliances become possible. Focus on ${redistributionStrategy === 'efficient' ? 'doing more with less' : 'expanding the pie, not just dividing it'}.${strategyNote}`,
      'relational',
      actions,
      prerequisites
    );
  }

  private extractStakeholderMentions(text: string): string[] {
    const stakeholders: string[] = [];
    const lowerText = text.toLowerCase();

    // Common stakeholder terms
    const patterns = [
      { pattern: 'customer', name: 'Customers' },
      { pattern: 'user', name: 'Users' },
      { pattern: 'team', name: 'Team' },
      { pattern: 'management', name: 'Management' },
      { pattern: 'leadership', name: 'Leadership' },
      { pattern: 'stakeholder', name: 'Stakeholders' },
      { pattern: 'partner', name: 'Partners' },
      { pattern: 'vendor', name: 'Vendors' },
      { pattern: 'investor', name: 'Investors' },
    ];

    patterns.forEach(({ pattern, name }) => {
      if (lowerText.includes(pattern)) {
        stakeholders.push(name);
      }
    });

    return [...new Set(stakeholders)]; // Remove duplicates
  }

  private inferPosition(stakeholderName: string, context: OptionGenerationContext): string {
    // Infer stakeholder position from context
    const constraints = context.pathMemory.constraints.filter(c =>
      c.description.toLowerCase().includes(stakeholderName.toLowerCase())
    );

    if (constraints.length > 0) {
      // They have constraints, so likely want relief
      return 'Seeking flexibility and reduced constraints';
    }

    // Default positions by stakeholder type
    const positions: Record<string, string> = {
      Customers: 'Want reliable, valuable solutions',
      Users: 'Need intuitive, efficient experiences',
      Team: 'Desire clear direction and reasonable workload',
      Management: 'Require predictable delivery and ROI',
      Leadership: 'Focus on strategic alignment and growth',
      Partners: 'Seek mutual benefit and stability',
      Vendors: 'Want clear requirements and timely payment',
      Investors: 'Expect returns and risk mitigation',
    };

    return positions[stakeholderName] || 'Have specific needs and constraints';
  }

  private assessStakeholderFlexibility(
    name: string,
    context: OptionGenerationContext
  ): 'low' | 'medium' | 'high' {
    // Assess based on how often they appear in rigid constraints
    const rigidMentions = context.pathMemory.constraints.filter(
      c => c.description.toLowerCase().includes(name.toLowerCase()) && c.reversibilityCost > 0.6
    ).length;

    if (rigidMentions > 2) return 'low';
    if (rigidMentions > 0) return 'medium';
    return 'high';
  }

  private assessStakeholderInfluence(
    name: string,
    context: OptionGenerationContext
  ): 'low' | 'medium' | 'high' {
    // Assess based on appearance in high-commitment decisions
    const highCommitmentMentions = context.pathMemory.pathHistory.filter(
      e => e.decision.toLowerCase().includes(name.toLowerCase()) && e.commitmentLevel > 0.5
    ).length;

    if (highCommitmentMentions > 2) return 'high';
    if (highCommitmentMentions > 0) return 'medium';

    // Special cases
    if (name.includes('Leadership') || name.includes('Management')) return 'high';
    if (name.includes('Customer') || name.includes('User')) return 'medium';

    return 'low';
  }
}
