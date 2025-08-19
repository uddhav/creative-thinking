/**
 * Risk Assessment Prompt
 *
 * Comprehensive risk and opportunity analysis for ideas and solutions
 */

import { BasePrompt } from '../BasePrompt.js';
import type {
  RiskAssessmentArgs,
  PromptResult,
  PromptMessage,
  PromptMetadata,
  PromptCategory,
} from '../types.js';

export class RiskAssessmentPrompt extends BasePrompt<RiskAssessmentArgs> {
  name = 'risk_assessment';
  description = 'Comprehensive risk and opportunity analysis';
  category: PromptCategory = 'analysis' as PromptCategory;

  async generate(args: RiskAssessmentArgs): Promise<PromptResult> {
    // Validate required arguments
    this.validateArgs(args, ['idea']);

    // Determine risk tolerance level
    const riskTolerance = args.risk_tolerance || 'moderate';

    // Generate assessment messages
    const messages: PromptMessage[] = [];

    // System context
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'I am a comprehensive risk and opportunity assessment tool using structured thinking techniques.',
        },
      ],
    });

    // User request
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: this.formatAssessmentRequest(args),
        },
      ],
    });

    // Initial assessment framework
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatAssessmentFramework(args.idea, riskTolerance),
        },
      ],
    });

    // Black Hat analysis (risks)
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '## Black Hat Analysis (Critical Risks)\n\nLet me identify potential risks and failure modes using critical thinking:',
        },
        {
          type: 'tool_use',
          toolUse: {
            toolName: 'execute_thinking_step',
            arguments: {
              technique: 'six_hats',
              problem: `Assess risks for: ${args.idea}`,
              hatColor: 'black',
              currentStep: 1,
              totalSteps: 3,
              output: 'Identifying critical risks and failure modes',
              nextStepNeeded: true,
            },
          },
        },
      ],
    });

    // Yellow Hat analysis (opportunities)
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '## Yellow Hat Analysis (Opportunities)\n\nNow exploring positive potential and opportunities:',
        },
        {
          type: 'tool_use',
          toolUse: {
            toolName: 'execute_thinking_step',
            arguments: {
              technique: 'six_hats',
              problem: `Assess opportunities for: ${args.idea}`,
              hatColor: 'yellow',
              currentStep: 2,
              totalSteps: 3,
              output: 'Identifying benefits and positive outcomes',
              nextStepNeeded: true,
            },
          },
        },
      ],
    });

    // Green Hat mitigation (creative solutions)
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '## Green Hat Solutions (Risk Mitigation)\n\nGenerating creative mitigation strategies:',
        },
        {
          type: 'tool_use',
          toolUse: {
            toolName: 'execute_thinking_step',
            arguments: {
              technique: 'six_hats',
              problem: `Mitigate risks for: ${args.idea}`,
              hatColor: 'green',
              currentStep: 3,
              totalSteps: 3,
              output: 'Creating innovative risk mitigation strategies',
              nextStepNeeded: false,
            },
          },
        },
      ],
    });

    // Risk matrix and recommendations
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatRiskMatrix(args.idea, riskTolerance),
        },
      ],
    });

    // Reference relevant metrics
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'resource',
          resource: {
            uri: 'metrics://warnings/active',
            text: 'View active risk warnings',
          },
        },
        {
          type: 'resource',
          resource: {
            uri: 'metrics://flexibility/current',
            text: 'Check implementation flexibility',
          },
        },
      ],
    });

    return {
      description: `Risk assessment for: "${args.idea.substring(0, 50)}..."`,
      messages,
    };
  }

  private formatAssessmentRequest(args: RiskAssessmentArgs): string {
    let request = `Idea: ${args.idea}`;

    if (args.context) {
      request += `\n\nContext: ${args.context}`;
    }

    if (args.risk_tolerance) {
      request += `\n\nRisk Tolerance: ${args.risk_tolerance}`;
    }

    return request;
  }

  private formatAssessmentFramework(idea: string, riskTolerance: string): string {
    let framework = `## Risk & Opportunity Assessment Framework\n\n`;
    framework += `**Idea**: "${idea}"\n`;
    framework += `**Risk Tolerance**: ${this.formatRiskTolerance(riskTolerance)}\n\n`;

    framework += `### Assessment Methodology\n\n`;
    framework += `I'll conduct a comprehensive assessment using:\n\n`;

    framework += `1. **Risk Identification** (Black Hat Thinking)\n`;
    framework += `   - Technical risks\n`;
    framework += `   - Market risks\n`;
    framework += `   - Operational risks\n`;
    framework += `   - Financial risks\n`;
    framework += `   - Regulatory/compliance risks\n\n`;

    framework += `2. **Opportunity Analysis** (Yellow Hat Thinking)\n`;
    framework += `   - Direct benefits\n`;
    framework += `   - Indirect advantages\n`;
    framework += `   - Strategic positioning\n`;
    framework += `   - Learning opportunities\n\n`;

    framework += `3. **Mitigation Strategies** (Green Hat Thinking)\n`;
    framework += `   - Preventive measures\n`;
    framework += `   - Contingency plans\n`;
    framework += `   - Risk transfer options\n`;
    framework += `   - Opportunity amplification\n\n`;

    framework += `Let's begin the systematic assessment:`;

    return framework;
  }

  private formatRiskMatrix(idea: string, riskTolerance: string): string {
    let matrix = `## Risk Assessment Matrix\n\n`;

    matrix += `### Risk Categories\n\n`;
    matrix += `| Risk Type | Probability | Impact | Mitigation Priority |\n`;
    matrix += `|-----------|------------|--------|--------------------|\n`;
    matrix += `| Technical | Medium | High | Critical |\n`;
    matrix += `| Market | Low | High | Monitor |\n`;
    matrix += `| Operational | Medium | Medium | Important |\n`;
    matrix += `| Financial | Low | Medium | Standard |\n`;
    matrix += `| Regulatory | Low | High | Monitor |\n\n`;

    matrix += `### Opportunity Matrix\n\n`;
    matrix += `| Opportunity | Likelihood | Value | Action Priority |\n`;
    matrix += `|-------------|-----------|-------|----------------|\n`;
    matrix += `| Market Growth | High | High | Pursue |\n`;
    matrix += `| Cost Savings | Medium | Medium | Evaluate |\n`;
    matrix += `| Innovation | High | Medium | Develop |\n`;
    matrix += `| Partnerships | Medium | High | Explore |\n\n`;

    matrix += `### Recommendations\n\n`;
    matrix += this.generateRecommendations(riskTolerance);

    matrix += `### Risk-Adjusted Decision\n\n`;
    matrix += `Based on the ${riskTolerance} risk tolerance:\n\n`;

    if (riskTolerance === 'low') {
      matrix += `✅ **Proceed with caution**: Implement comprehensive risk mitigation before moving forward\n`;
      matrix += `- Focus on proven approaches\n`;
      matrix += `- Implement in phases with checkpoints\n`;
      matrix += `- Maintain fallback options\n`;
    } else if (riskTolerance === 'high') {
      matrix += `🚀 **Fast implementation recommended**: Accept calculated risks for potential high returns\n`;
      matrix += `- Move quickly to capture opportunities\n`;
      matrix += `- Accept some uncertainty\n`;
      matrix += `- Focus on upside potential\n`;
    } else {
      matrix += `⚖️ **Balanced approach recommended**: Proceed with selective risk mitigation\n`;
      matrix += `- Address critical risks first\n`;
      matrix += `- Balance speed with safety\n`;
      matrix += `- Monitor and adjust as needed\n`;
    }

    return matrix;
  }

  private formatRiskTolerance(tolerance: string): string {
    const descriptions: Record<string, string> = {
      low: 'Conservative (minimize risks)',
      moderate: 'Balanced (managed risks)',
      high: 'Aggressive (accept risks for returns)',
    };
    return descriptions[tolerance] || 'Moderate';
  }

  private generateRecommendations(riskTolerance: string): string {
    let recommendations = '';

    if (riskTolerance === 'low') {
      recommendations += `1. **Implement robust testing** before full deployment\n`;
      recommendations += `2. **Create detailed contingency plans** for each risk\n`;
      recommendations += `3. **Establish clear exit criteria** if risks materialize\n`;
      recommendations += `4. **Consider insurance or hedging** for financial risks\n`;
    } else if (riskTolerance === 'high') {
      recommendations += `1. **Focus on speed to market** to capture opportunities\n`;
      recommendations += `2. **Accept calculated risks** with high reward potential\n`;
      recommendations += `3. **Build learning loops** to adapt quickly\n`;
      recommendations += `4. **Prepare for pivots** if initial approach fails\n`;
    } else {
      recommendations += `1. **Prioritize critical risk mitigation** while maintaining momentum\n`;
      recommendations += `2. **Implement phased rollout** with validation checkpoints\n`;
      recommendations += `3. **Monitor key risk indicators** continuously\n`;
      recommendations += `4. **Maintain flexibility** to adjust approach\n`;
    }

    recommendations += `\n`;
    return recommendations;
  }

  getMetadata(): PromptMetadata {
    return {
      name: this.name,
      category: this.category,
      description: this.description,
      tags: ['risk', 'assessment', 'analysis', 'opportunity', 'mitigation'],
      difficulty: 'intermediate',
      estimatedTime: '20-40 minutes',
      prerequisites: ['Understanding of basic risk concepts'],
    };
  }
}
