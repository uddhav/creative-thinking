/**
 * RiskGenerator
 * Uses MCP Sampling to generate comprehensive risk assessments
 */

import type { SamplingManager } from '../SamplingManager.js';
import type { RiskAssessment, SamplingError } from '../types.js';

export class RiskGenerator {
  constructor(private samplingManager: SamplingManager) {}

  /**
   * Generate risk assessment for a solution
   */
  async generateRisks(
    solution: string,
    context?: string,
    domain?: string
  ): Promise<RiskAssessment> {
    try {
      // Check if sampling is available
      if (!this.samplingManager.isAvailable()) {
        return this.fallbackRiskAssessment(solution);
      }

      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(domain),
            },
            {
              role: 'user',
              content: this.buildUserPrompt(solution, context),
            },
          ],
          modelPreferences: {
            hints: ['analytical', 'thorough', 'risk-aware'],
            intelligencePriority: 0.9,
            speedPriority: 0.3,
          },
          temperature: 0.3, // Lower temperature for more focused analysis
          maxTokens: 1000,
        },
        'risk_generation'
      );

      return this.parseRiskAssessment(result.content, solution);
    } catch (error) {
      console.error('[RiskGenerator] Risk assessment failed:', error);
      return this.handleError(solution, error as SamplingError);
    }
  }

  /**
   * Generate risks for multiple solutions
   */
  async generateBatchRisks(
    solutions: Array<{ solution: string; context?: string }>,
    domain?: string
  ): Promise<RiskAssessment[]> {
    const assessments = await Promise.allSettled(
      solutions.map(({ solution, context }) => this.generateRisks(solution, context, domain))
    );

    return assessments.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[RiskGenerator] Failed to assess solution ${index}:`, result.reason);
        return this.fallbackRiskAssessment(solutions[index].solution);
      }
    });
  }

  /**
   * Build system prompt for risk assessment
   */
  private buildSystemPrompt(domain?: string): string {
    const domainContext = domain
      ? `focusing on ${domain} domain risks`
      : 'across all relevant domains';

    return `You are an expert risk analyst specializing in comprehensive failure mode analysis.
Your task is to identify potential risks, failure modes, and unintended consequences ${domainContext}.

Your analysis should:
1. Identify both obvious and non-obvious risks
2. Consider technical, business, user, and ethical dimensions
3. Assess severity and likelihood realistically
4. Provide actionable mitigation strategies
5. Think about edge cases and black swan events
6. Consider path dependencies and non-ergodic risks

Be thorough but practical. Focus on risks that could materially impact success.`;
  }

  /**
   * Build user prompt for risk assessment
   */
  private buildUserPrompt(solution: string, context?: string): string {
    let prompt = `Analyze the following solution for potential risks and failure modes:

Solution: ${solution}`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `

Please provide a comprehensive risk assessment including:

1. CRITICAL RISKS (High severity, High likelihood)
   - List 2-3 critical risks that could cause complete failure

2. MAJOR RISKS (High severity OR High likelihood)
   - List 3-4 significant risks that need active management

3. MODERATE RISKS (Medium severity and likelihood)
   - List 2-3 risks to monitor

4. EDGE CASES & BLACK SWANS
   - Identify 1-2 low probability but high impact scenarios

For each risk, provide:
- Description of the risk
- Severity (1-5 scale)
- Likelihood (1-5 scale)
- 1-2 specific mitigation strategies

End with an OVERALL RISK ASSESSMENT: [low/medium/high/critical]`;

    return prompt;
  }

  /**
   * Parse AI response into structured risk assessment
   */
  private parseRiskAssessment(aiResponse: string, solution: string): RiskAssessment {
    const assessment: RiskAssessment = {
      risks: [],
      overallRisk: 'medium',
    };

    try {
      // Parse sections from response
      const sections = this.parseSections(aiResponse);

      // Extract risks from each category
      const criticalRisks = this.extractRisks(sections['CRITICAL RISKS'], 5, 4);
      const majorRisks = this.extractRisks(sections['MAJOR RISKS'], 4, 3);
      const moderateRisks = this.extractRisks(sections['MODERATE RISKS'], 3, 2);
      const edgeCases = this.extractRisks(sections['EDGE CASES'], 5, 1);

      // Combine all risks and limit to 10 total
      assessment.risks = [...criticalRisks, ...majorRisks, ...moderateRisks, ...edgeCases].slice(
        0,
        10
      );

      // Extract overall risk level
      const overallMatch = aiResponse.match(
        /OVERALL RISK (?:ASSESSMENT|LEVEL):\s*\[?(low|medium|high|critical)\]?/i
      );
      if (overallMatch) {
        assessment.overallRisk = overallMatch[1].toLowerCase() as typeof assessment.overallRisk;
      } else if (criticalRisks.length > 0) {
        assessment.overallRisk = 'critical';
      } else if (majorRisks.length > 2) {
        assessment.overallRisk = 'high';
      }

      // If no risks found, parse as simple list
      if (assessment.risks.length === 0) {
        assessment.risks = this.parseSimpleRiskList(aiResponse);
      }
    } catch (error) {
      console.error('[RiskGenerator] Failed to parse AI response:', error);
      assessment.risks = this.parseSimpleRiskList(aiResponse);
    }

    // Ensure we have at least some risks
    if (assessment.risks.length === 0) {
      assessment.risks = this.generateBasicRisks(solution);
    }

    return assessment;
  }

  /**
   * Parse sections from AI response
   */
  private parseSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check for section headers
      if (/^(CRITICAL RISKS|MAJOR RISKS|MODERATE RISKS|EDGE CASES)/i.test(line)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.split(/[:(]/)[0].trim().toUpperCase();
        currentContent = [];
      } else if (/^\d+\.\s+[A-Z\s]+[:]/i.test(line)) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line
          .replace(/^\d+\.\s+([A-Z\s]+)[:].*/, '$1')
          .trim()
          .toUpperCase();
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Extract risks from a section
   */
  private extractRisks(
    sectionText: string | undefined,
    defaultSeverity: number,
    defaultLikelihood: number
  ): RiskAssessment['risks'] {
    if (!sectionText) return [];

    const risks: RiskAssessment['risks'] = [];
    const riskBlocks = this.splitIntoRiskBlocks(sectionText);

    for (const block of riskBlocks) {
      const risk = this.parseRiskBlock(block, defaultSeverity, defaultLikelihood);
      if (risk) {
        risks.push(risk);
      }
    }

    return risks;
  }

  /**
   * Split text into individual risk blocks
   */
  private splitIntoRiskBlocks(text: string): string[] {
    const blocks: string[] = [];
    const lines = text.split('\n');
    let currentBlock: string[] = [];

    for (const line of lines) {
      if (/^[-•*]\s+/.test(line.trim()) && currentBlock.length > 0) {
        // New bullet point, save previous block
        blocks.push(currentBlock.join('\n'));
        currentBlock = [line];
      } else if (/^\d+[.)]\s+/.test(line.trim()) && currentBlock.length > 0) {
        // New numbered item, save previous block
        blocks.push(currentBlock.join('\n'));
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }

    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }

    return blocks.filter(b => b.trim().length > 10);
  }

  /**
   * Parse individual risk block
   */
  private parseRiskBlock(
    block: string,
    defaultSeverity: number,
    defaultLikelihood: number
  ): RiskAssessment['risks'][0] | null {
    // Extract description (first line or until "Severity")
    const descMatch = block.match(/^[-•*\d.)]*\s*(.+?)(?:\n|Severity:|Likelihood:|Mitigation:)/is);
    if (!descMatch) return null;

    const risk: RiskAssessment['risks'][0] = {
      description: descMatch[1].trim(),
      severity: defaultSeverity,
      likelihood: defaultLikelihood,
      mitigations: [],
    };

    // Extract severity
    const severityMatch = block.match(/Severity[:\s]*(\d)/i);
    if (severityMatch) {
      risk.severity = Math.min(5, Math.max(1, parseInt(severityMatch[1])));
    }

    // Extract likelihood
    const likelihoodMatch = block.match(/Likelihood[:\s]*(\d)/i);
    if (likelihoodMatch) {
      risk.likelihood = Math.min(5, Math.max(1, parseInt(likelihoodMatch[1])));
    }

    // Extract mitigations
    const mitigationMatch = block.match(/Mitigation[s]?[:\s]*(.+)/is);
    if (mitigationMatch) {
      const mitigationText = mitigationMatch[1];
      risk.mitigations = this.extractBulletPoints(mitigationText);
    }

    return risk;
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-•*]\s+/.test(trimmed)) {
        points.push(trimmed.replace(/^[-•*]\s+/, '').trim());
      } else if (/^\d+[.)]\s+/.test(trimmed)) {
        points.push(trimmed.replace(/^\d+[.)]\s+/, '').trim());
      } else if (trimmed && trimmed.length > 10) {
        points.push(trimmed);
      }
    }

    return points.slice(0, 3); // Max 3 mitigations per risk
  }

  /**
   * Parse simple risk list from unstructured text
   */
  private parseSimpleRiskList(text: string): RiskAssessment['risks'] {
    const risks: RiskAssessment['risks'] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 20 && /risk|failure|problem|issue|challenge/i.test(trimmed)) {
        risks.push({
          description: trimmed.replace(/^[-•*\d.)]\s+/, '').substring(0, 200),
          severity: 3,
          likelihood: 3,
          mitigations: [],
        });
      }
    }

    return risks.slice(0, 10); // Max 10 risks
  }

  /**
   * Generate basic risks when parsing fails
   */
  private generateBasicRisks(_solution: string): RiskAssessment['risks'] {
    return [
      {
        description: 'Implementation complexity may exceed initial estimates',
        severity: 3,
        likelihood: 4,
        mitigations: ['Start with MVP', 'Use agile methodology'],
      },
      {
        description: 'User adoption may be slower than expected',
        severity: 4,
        likelihood: 3,
        mitigations: ['Conduct user research', 'Create onboarding program'],
      },
      {
        description: 'Technical scalability challenges',
        severity: 3,
        likelihood: 2,
        mitigations: ['Design for scale from start', 'Use cloud infrastructure'],
      },
    ];
  }

  /**
   * Fallback risk assessment when AI is not available
   */
  private fallbackRiskAssessment(_solution: string): RiskAssessment {
    return {
      risks: [
        {
          description: 'Market acceptance uncertainty',
          severity: 4,
          likelihood: 3,
          mitigations: ['Validate with target users', 'Start with pilot program'],
        },
        {
          description: 'Resource constraints',
          severity: 3,
          likelihood: 4,
          mitigations: ['Phase implementation', 'Seek additional funding'],
        },
        {
          description: 'Technical integration challenges',
          severity: 3,
          likelihood: 3,
          mitigations: ['Create detailed technical plan', 'Build integration tests'],
        },
        {
          description: 'Competitive response',
          severity: 2,
          likelihood: 3,
          mitigations: ['Focus on unique value', 'Build strong relationships'],
        },
      ],
      overallRisk: 'medium',
    };
  }

  /**
   * Handle risk generation errors
   */
  private handleError(solution: string, error: SamplingError): RiskAssessment {
    console.error('[RiskGenerator] Error:', error.code, error.message);

    switch (error.code) {
      case 'rate_limit_exceeded':
        return {
          risks: [
            {
              description: 'Risk assessment temporarily limited',
              severity: 2,
              likelihood: 1,
              mitigations: ['Manual risk review recommended'],
            },
          ],
          overallRisk: 'medium',
        };

      case 'timeout':
        // Return basic risks for timeout
        return {
          risks: this.generateBasicRisks(solution),
          overallRisk: 'medium',
        };

      default:
        return this.fallbackRiskAssessment(solution);
    }
  }

  /**
   * Calculate overall risk from individual risks
   */
  calculateOverallRisk(risks: RiskAssessment['risks']): RiskAssessment['overallRisk'] {
    if (risks === undefined || risks.length === 0) return 'low';

    const criticalCount = risks.filter(r => r.severity >= 5 && r.likelihood >= 4).length;
    const highCount = risks.filter(r => r.severity * r.likelihood >= 12).length;
    const mediumCount = risks.filter(r => r.severity * r.likelihood >= 6).length;

    if (criticalCount > 0) return 'critical';
    if (highCount >= 3) return 'high';
    if (mediumCount >= 3) return 'medium';
    return 'low';
  }
}
