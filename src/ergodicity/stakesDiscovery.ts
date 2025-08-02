/**
 * Dynamic Stakes Discovery
 *
 * Forces concrete thinking about what's at risk without
 * predefined domain templates. Uses the LLM's own risk
 * discoveries to prompt specific quantification.
 */

import type { SessionData } from '../types/index.js';
import type { RiskEngagementMetrics } from './riskDismissalTracker.js';

export interface StakesDeclaration {
  whatIsAtRisk: string;
  quantifiedAmount?: string;
  percentageOfTotal?: number;
  cannotBeLost: string[];
  timeToRecover?: string;
  alternativeCount?: number;
  exitConditions: ExitCondition[];
}

export interface ExitCondition {
  condition: string;
  measurable: boolean;
  timeBound?: string;
  relatedToRisk: string;
}

export class StakesDiscovery {
  /**
   * Generate stakes requirement based on discovered risks
   */
  generateStakesPrompt(sessionData: SessionData, proposedAction: string): string {
    const discoveredRisks = this.extractRelevantRisks(sessionData);
    const riskIndicators = sessionData.riskEngagementMetrics?.discoveredRiskIndicators || [];

    return `📊 CONCRETE STAKES REQUIRED

Your analysis identified these risk factors:
${discoveredRisks
  .slice(0, 5)
  .map((r, i) => `${i + 1}. ${r}`)
  .join('\n')}

For your proposed action: "${proposedAction}"

Please quantify SPECIFICALLY:

1. **What is at risk?**
   ${this.generateRiskSpecificPrompts(riskIndicators)}

2. **Time dimensions:**
   - How long until this decision becomes irreversible? _______
   - Time needed to recover from worst-case scenario: _______
   - Window of opportunity (if time-sensitive): _______

3. **Alternatives assessment:**
   - Number of alternative approaches you've considered: _____
   - Why this approach over the safest alternative: _______
   - What you gain by taking additional risk: _______

4. **Cannot afford to lose:**
   List what absolutely cannot be lost (be specific):
   - _______________________
   - _______________________
   - _______________________

This is not a form. Think about YOUR specific situation and the risks YOU discovered.`;
  }

  /**
   * Generate risk-specific quantification prompts
   */
  private generateRiskSpecificPrompts(indicators: string[]): string {
    const prompts: string[] = [];

    // Always include these base prompts
    prompts.push('- Specific amount/value at risk: _______');
    prompts.push('- This represents ____% of available resources');

    // Add prompts based on discovered indicators
    if (indicators.some(i => i.includes('financial') || i.includes('invest'))) {
      prompts.push('- Dollar amount that could be lost: $_______');
      prompts.push('- Months of income this represents: _______');
    }

    if (indicators.some(i => i.includes('time'))) {
      prompts.push('- Hours/days/years that cannot be recovered: _______');
      prompts.push('- Opportunity cost in time: _______');
    }

    if (indicators.some(i => i.includes('reputation') || i.includes('social'))) {
      prompts.push('- Relationships that could be damaged: _______');
      prompts.push('- Years to rebuild reputation if damaged: _______');
    }

    if (indicators.some(i => i.includes('health') || i.includes('physical'))) {
      prompts.push('- Physical/mental health impact severity (1-10): _____');
      prompts.push('- Recovery time if health is impacted: _______');
    }

    if (indicators.some(i => i.includes('career') || i.includes('professional'))) {
      prompts.push('- Career setback in years: _______');
      prompts.push('- Transferable skills that remain: _______');
    }

    return prompts.join('\n   ');
  }

  /**
   * Extract relevant risks from session
   */
  private extractRelevantRisks(sessionData: SessionData): string[] {
    const risks: string[] = [];

    // From risk discovery
    if (sessionData.riskDiscoveryData?.risks) {
      const discoveryRisks = sessionData.riskDiscoveryData.risks;
      if ('identifiedRisks' in discoveryRisks && Array.isArray(discoveryRisks.identifiedRisks)) {
        risks.push(
          ...discoveryRisks.identifiedRisks.map((r: { risk?: string } | string) =>
            typeof r === 'string' ? r : r.risk || JSON.stringify(r)
          )
        );
      }
    }

    // From session history
    sessionData.history.forEach(entry => {
      if (entry.risks) risks.push(...entry.risks);
      if (entry.failureModes) risks.push(...entry.failureModes);

      // Extract from text output
      const riskPhrases = this.extractRiskPhrasesFromText(entry.output);
      risks.push(...riskPhrases);
    });

    return [...new Set(risks)].filter(r => r.length > 10); // Unique, meaningful risks
  }

  /**
   * Extract risk phrases from free text
   */
  private extractRiskPhrasesFromText(text: string): string[] {
    const risks: string[] = [];

    // Pattern matching for risk language
    const riskPatterns = [
      /could lose ([^.!?]+)/gi,
      /risk of ([^.!?]+)/gi,
      /might fail ([^.!?]+)/gi,
      /danger of ([^.!?]+)/gi,
      /threat to ([^.!?]+)/gi,
      /jeopardize ([^.!?]+)/gi,
    ];

    riskPatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          risks.push(match[1].trim());
        }
      }
    });

    return risks;
  }

  /**
   * Validate stakes declaration
   */
  validateStakes(
    declaration: Partial<StakesDeclaration>,
    metrics: RiskEngagementMetrics
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    if (!declaration.whatIsAtRisk || declaration.whatIsAtRisk.length < 10) {
      missing.push('Specific description of what is at risk');
    }

    if (!declaration.cannotBeLost || declaration.cannotBeLost.length === 0) {
      missing.push('What cannot be lost (must list at least one item)');
    }

    if (!declaration.exitConditions || declaration.exitConditions.length < 2) {
      missing.push('At least 2 exit conditions required');
    }

    // Validate exit conditions
    if (declaration.exitConditions) {
      const invalidConditions = declaration.exitConditions.filter(
        ec => !ec.measurable || ec.condition.length < 10
      );
      if (invalidConditions.length > 0) {
        missing.push('Exit conditions must be specific and measurable');
      }
    }

    // High-stakes validation
    if (metrics.escalationLevel >= 4) {
      if (!declaration.quantifiedAmount) {
        missing.push('Specific quantified amount for high-stakes decision');
      }
      if (!declaration.percentageOfTotal || declaration.percentageOfTotal === 0) {
        missing.push('Percentage of total resources for high-stakes decision');
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Generate historical context based on stakes
   */
  generateHistoricalContext(declaration: Partial<StakesDeclaration>, indicators: string[]): string {
    const examples: string[] = [];

    // Select relevant historical examples based on indicators
    if (indicators.some(i => i.includes('total commitment') || i.includes('all'))) {
      examples.push(
        'LTCM (1998): "Our models account for everything" → Lost 90% in 4 months',
        'Amaranth (2006): "Natural gas prices are predictable" → Lost $6.6B in 1 week'
      );
    }

    if (indicators.some(i => i.includes('irreversible'))) {
      examples.push(
        'Blockbuster (2000): "Streaming will never replace stores" → Bankrupt by 2010',
        'Kodak (1975): "Digital will never match film quality" → Lost 90% of workforce'
      );
    }

    if (indicators.some(i => i.includes('survival threat'))) {
      examples.push(
        'Lehman Brothers (2008): "Real estate always recovers" → 158-year firm collapsed',
        'Enron (2001): "Mark-to-market accounting is innovative" → Complete destruction'
      );
    }

    if (examples.length === 0) {
      examples.push(
        'General principle: Overconfidence in the face of identified risks is the most common path to ruin'
      );
    }

    return `📚 HISTORICAL PERSPECTIVE

Similar confidence despite identified risks:
${examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Your situation: ${declaration.whatIsAtRisk || 'Unspecified risk'} with ${declaration.percentageOfTotal || '??'}% exposure

What makes your situation different from these failures?`;
  }
}
