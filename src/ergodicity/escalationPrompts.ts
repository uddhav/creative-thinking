/**
 * Dynamic Escalation Prompts
 *
 * Generates behavioral prompts based on dismissal patterns,
 * not domain categories. References the LLM's own discoveries.
 */

import type { RiskEngagementMetrics, DismissalPattern } from './riskDismissalTracker.js';
import type { SessionData } from '../types/index.js';
import { adaptiveRiskAssessment } from './AdaptiveRiskAssessment.js';

export interface EscalationPrompt {
  level: number;
  prompt: string;
  requiresResponse: boolean;
  minimumConfidence?: number;
  locksProgress?: boolean;
}

export class EscalationPromptGenerator {
  /**
   * Generate appropriate escalation prompt based on metrics and patterns
   */
  generatePrompt(
    metrics: RiskEngagementMetrics,
    patterns: DismissalPattern[],
    sessionData: SessionData
  ): EscalationPrompt | null {
    switch (metrics.escalationLevel) {
      case 1:
        return null; // Normal operation, no escalation needed

      case 2:
        return this.generateLevel2Prompt(metrics, patterns, sessionData);

      case 3:
        return this.generateLevel3Prompt(metrics, patterns, sessionData);

      case 4:
        return this.generateLevel4Prompt(metrics, patterns, sessionData);

      default:
        return null;
    }
  }

  /**
   * Level 2: Pattern recognition with contextual awareness
   */
  private generateLevel2Prompt(
    metrics: RiskEngagementMetrics,
    patterns: DismissalPattern[],
    sessionData: SessionData
  ): EscalationPrompt {
    const discoveredRisks = this.extractDiscoveredRisks(sessionData);
    const patternDescriptions = patterns.map(p => p.evidence[0]).join('; ');

    return {
      level: 2,
      prompt: `⚠️ BEHAVIORAL PATTERN DETECTED

You've provided ${metrics.consecutiveLowConfidence} consecutive risk assessments with confidence < 0.3.
Average confidence: ${metrics.averageConfidence.toFixed(2)}

Pattern: ${patternDescriptions}

YOUR OWN ANALYSIS identified these risks:
${discoveredRisks
  .slice(0, 5)
  .map((r, i) => `${i + 1}. ${r}`)
  .join('\n')}

This pattern suggests you may not be engaging with the framework you're using. Please:
1. Re-read the risks YOU discovered above
2. Consider how your proposed action addresses each one
3. Provide a substantive assessment (confidence > 0.3)

Remember: These are YOUR discoveries, not generic warnings.`,
      requiresResponse: true,
      minimumConfidence: 0.3,
    };
  }

  /**
   * Level 3: Behavioral lock with adaptive requirements
   */
  private generateLevel3Prompt(
    metrics: RiskEngagementMetrics,
    patterns: DismissalPattern[],
    sessionData: SessionData
  ): EscalationPrompt {
    const discoveredRisks = this.extractDiscoveredRisks(sessionData);
    const proposedActions = this.extractProposedActions(sessionData);
    const contradictions = this.findContradictions(discoveredRisks, proposedActions);

    // Analyze context for adaptive language
    const problem = sessionData.problem || '';
    const recentAction = proposedActions[0] || '';
    const context = adaptiveRiskAssessment.analyzeContext(problem, recentAction);

    // Generate adaptive escalation
    const adaptivePrompt = adaptiveRiskAssessment.generateAdaptiveEscalation(
      3,
      metrics.discoveredRiskIndicators,
      context
    );

    // Add the contradictions and specific requirements
    const fullPrompt = `${adaptivePrompt}

YOUR discoveries vs YOUR actions:
${contradictions
  .slice(0, 3)
  .map((c, i) => `${i + 1}. ${c}`)
  .join('\n')}

The next step is LOCKED until you provide:

1. **Specific calculations** based on YOUR identified risks:
   ${this.generateAdaptiveCalculationRequirements(discoveredRisks, context)}

2. **Exit conditions** - When would you abandon this approach?
   - Condition 1: _________________ (must be measurable)
   - Condition 2: _________________ (must be time-bound)
   - Condition 3: _________________ (must relate to YOUR risks)

3. **Simple explanation** - Explain to someone unfamiliar with the domain:
   "This action could fail because _________________
    If it fails, the impact would be _________________
    I would know it's failing when _________________"

Minimum confidence required: 0.5
This is not procedural. Your pattern indicates dangerous overconfidence in the face of risks YOU identified.`;

    return {
      level: 3,
      prompt: fullPrompt,
      requiresResponse: true,
      minimumConfidence: 0.5,
      locksProgress: true,
    };
  }

  /**
   * Level 4: High-stakes decision with adaptive language
   */
  private generateLevel4Prompt(
    metrics: RiskEngagementMetrics,
    patterns: DismissalPattern[],
    sessionData: SessionData
  ): EscalationPrompt {
    const highStakesIndicators = metrics.discoveredRiskIndicators.filter(i =>
      ['survival threat', 'irreversibility', 'total commitment language'].includes(i)
    );

    // Extract the most recent high-stakes action from session
    const recentActions = this.extractProposedActions(sessionData);
    const criticalAction =
      recentActions.find(
        a =>
          a.toLowerCase().includes('all') ||
          a.toLowerCase().includes('everything') ||
          a.toLowerCase().includes('bet')
      ) ||
      recentActions[0] ||
      'your proposed action';

    // The most severe pattern information is embedded in the patterns array
    // which is already being used to generate the escalation prompt

    // Analyze context to generate appropriate language
    const problem = sessionData.problem || '';
    const context = adaptiveRiskAssessment.analyzeContext(problem, criticalAction);

    // Generate adaptive escalation using context
    const adaptivePrompt = adaptiveRiskAssessment.generateAdaptiveEscalation(
      4,
      highStakesIndicators,
      context
    );

    return {
      level: 4,
      prompt: adaptivePrompt,
      requiresResponse: true,
      minimumConfidence: 0.7,
      locksProgress: true,
    };
  }

  /**
   * Extract risks discovered by the LLM from session history
   */
  private extractDiscoveredRisks(sessionData: SessionData): string[] {
    const risks: string[] = [];

    // From risk discovery data
    if (sessionData.riskDiscoveryData?.risks) {
      const discoveryRisks = sessionData.riskDiscoveryData.risks;
      if ('identifiedRisks' in discoveryRisks && Array.isArray(discoveryRisks.identifiedRisks)) {
        risks.push(
          ...discoveryRisks.identifiedRisks.map((r: { risk?: string } | string) =>
            typeof r === 'string' ? r : r.risk || ''
          )
        );
      }
    }

    // From history entries
    sessionData.history.forEach(entry => {
      if (entry.risks) {
        risks.push(...entry.risks);
      }
      if (entry.failureModes) {
        risks.push(...entry.failureModes);
      }

      // From ruin assessment responses
      if (
        'ruinAssessment' in entry &&
        entry.ruinAssessment &&
        'assessment' in entry.ruinAssessment
      ) {
        const assessment = entry.ruinAssessment.assessment as Record<string, unknown>;
        if ('isIrreversible' in assessment && assessment.isIrreversible) {
          risks.push('Irreversible action identified');
        }
        if ('survivabilityThreatened' in assessment && assessment.survivabilityThreatened) {
          risks.push('Survival threat acknowledged');
        }
      }
    });

    // From engagement metrics
    if (sessionData.riskEngagementMetrics) {
      risks.push(...sessionData.riskEngagementMetrics.discoveredRiskIndicators);
    }

    return [...new Set(risks)]; // Remove duplicates
  }

  /**
   * Extract proposed actions from session
   */
  private extractProposedActions(sessionData: SessionData): string[] {
    return sessionData.history
      .map(entry => entry.output)
      .filter(output => output.length > 20) // Meaningful outputs only
      .slice(-5); // Recent actions
  }

  /**
   * Find contradictions between discoveries and actions
   */
  private findContradictions(risks: string[], actions: string[]): string[] {
    const contradictions: string[] = [];

    // Check for high-commitment language despite risks
    const hasHighRisk = risks.some(
      r => r.toLowerCase().includes('irreversible') || r.toLowerCase().includes('survival')
    );

    const hasHighCommitment = actions.some(
      a =>
        a.toLowerCase().includes('all') ||
        a.toLowerCase().includes('everything') ||
        a.toLowerCase().includes('bet')
    );

    if (hasHighRisk && hasHighCommitment) {
      contradictions.push(
        'You identified irreversible/survival risks but propose total commitment'
      );
    }

    // Check for specific risk-action mismatches
    actions.forEach((action, i) => {
      const actionLower = action.toLowerCase();

      if (risks.some(r => r.includes('time pressure')) && !actionLower.includes('deadline')) {
        contradictions.push(`Action ${i + 1} ignores time pressure you discovered`);
      }

      if (risks.some(r => r.includes('uncertainty')) && actionLower.includes('certain')) {
        contradictions.push(`Action ${i + 1} shows certainty despite acknowledged uncertainty`);
      }
    });

    return contradictions;
  }

  /**
   * Generate calculation requirements based on discovered risks (legacy)
   */
  private generateCalculationRequirements(risks: string[]): string {
    const calculations: string[] = [];

    if (
      risks.some(r => r.toLowerCase().includes('financial') || r.toLowerCase().includes('invest'))
    ) {
      calculations.push('- Maximum financial loss in dollars: $_______');
      calculations.push('- Percentage of net worth at risk: ____%');
    }

    if (risks.some(r => r.toLowerCase().includes('time'))) {
      calculations.push('- Time to recover from worst case: _____ months');
      calculations.push('- Deadline for decision reversal: _______');
    }

    if (risks.some(r => r.toLowerCase().includes('irreversible'))) {
      calculations.push('- Cost to partially reverse: $_______');
      calculations.push('- Probability of successful reversal: ____%');
    }

    // Always include these
    calculations.push('- Number of alternative approaches: _____');
    calculations.push('- Confidence in THIS approach vs best alternative: ____%');

    return calculations.join('\n   ');
  }

  /**
   * Generate adaptive calculation requirements based on context
   */
  private generateAdaptiveCalculationRequirements(
    risks: string[],
    context: ReturnType<typeof adaptiveRiskAssessment.analyzeContext>
  ): string {
    const calculations: string[] = [];

    // Business context calculations
    if (context.hasBusinessContext) {
      if (
        risks.some(r => r.toLowerCase().includes('vendor') || r.toLowerCase().includes('migration'))
      ) {
        calculations.push('- Migration cost estimate: _______');
        calculations.push('- Cost of staying with current solution: _______');
        calculations.push('- Switching costs if vendor fails: _______');
      }
      if (
        risks.some(r => r.toLowerCase().includes('financial') || r.toLowerCase().includes('budget'))
      ) {
        calculations.push(`- Maximum ${context.resourceType} at risk: _______`);
        calculations.push('- Percentage of annual budget: ____%');
        calculations.push('- Impact on cash flow: _______');
      }
      calculations.push('- Number of employees/customers affected: _____');
      calculations.push('- Revenue impact if this fails: _______');
    }

    // Personal finance calculations
    else if (context.hasPersonalFinance) {
      calculations.push(`- Maximum ${context.resourceType} at risk: _______`);
      calculations.push('- Percentage of total resources: ____%');
      calculations.push('- Emergency fund remaining after: _______');
    }

    // Technical migration calculations
    else if (context.hasTechnicalMigration) {
      calculations.push('- Data migration complexity (1-10): _____');
      calculations.push('- Rollback time required: _____ hours');
      calculations.push('- System downtime tolerance: _____ hours');
      calculations.push('- Integration points affected: _____');
    }

    // Health/safety calculations
    else if (context.hasHealthSafety) {
      calculations.push('- Recovery time if complications: _____ weeks');
      calculations.push('- Probability of success: ____%');
      calculations.push('- Quality of life impact (1-10): _____');
    }

    // Time-based calculations (universal)
    if (risks.some(r => r.toLowerCase().includes('time'))) {
      calculations.push(`- Time to recover from worst case: ${context.recoveryTimeframe}`);
      calculations.push('- Deadline for decision reversal: _______');
    }

    // Irreversibility calculations (universal)
    if (risks.some(r => r.toLowerCase().includes('irreversible'))) {
      calculations.push('- Cost/effort to partially reverse: _______');
      calculations.push('- Probability of successful reversal: ____%');
    }

    // Always include these
    calculations.push('- Number of alternative approaches: _____');
    calculations.push('- Confidence in THIS approach vs best alternative: ____%');

    return calculations.join('\n   ');
  }

  /**
   * Generate reflection requirements
   */
  generateReflectionRequirement(sessionData: SessionData, currentStep: number): string | null {
    const metrics = sessionData.riskEngagementMetrics;
    if (!metrics || metrics.escalationLevel < 2) return null;

    // Find previous high-confidence discoveries
    const previousInsights = sessionData.history
      .filter((entry, index) => {
        if (
          'ruinAssessment' in entry &&
          entry.ruinAssessment &&
          'assessment' in entry.ruinAssessment
        ) {
          const assessment = entry.ruinAssessment.assessment as Record<string, unknown>;
          return (
            'confidence' in assessment &&
            typeof assessment.confidence === 'number' &&
            assessment.confidence > 0.5 &&
            index < currentStep - 1
          );
        }
        return false;
      })
      .map((entry, index) => ({
        step: index + 1,
        risks: entry.risks || [],
        output: entry.output.substring(0, 100) + '...',
      }));

    if (previousInsights.length === 0) return null;

    return `📋 REFLECTION REQUIRED

In previous steps, YOU identified these risks with high confidence:
${previousInsights.map(i => `Step ${i.step}: ${i.risks.join(', ')}`).join('\n')}

Your current proposal: "${sessionData.history[currentStep - 1]?.output.substring(0, 100)}..."

Explain how your current proposal addresses EACH risk you previously identified.
If it doesn't address a risk, explain why that risk no longer applies.`;
  }
}
