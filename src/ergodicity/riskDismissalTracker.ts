/**
 * Risk Dismissal Tracker
 *
 * Monitors patterns of low-engagement risk assessments and triggers
 * behavioral escalations. Domain-agnostic - responds to engagement
 * quality, not content categories.
 */

import type { RuinRiskAssessment } from './prompts.js';
import type { SessionData } from '../types/index.js';

export interface RiskEngagementMetrics {
  dismissalCount: number;
  averageConfidence: number;
  escalationLevel: number;
  lastSubstantiveEngagement?: string; // timestamp
  discoveredRiskIndicators: string[]; // from LLM's own analysis
  consecutiveLowConfidence: number;
  totalAssessments: number;
}

export interface DismissalPattern {
  type: 'consecutive' | 'rapid' | 'contradictory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence: string[];
}

export class RiskDismissalTracker {
  private readonly LOW_CONFIDENCE_THRESHOLD = 0.3;
  private readonly RAPID_DISMISSAL_WINDOW = 60000; // 1 minute

  /**
   * Track a risk assessment and update engagement metrics
   */
  trackAssessment(
    assessment: RuinRiskAssessment,
    sessionData: SessionData,
    proposedAction: string
  ): RiskEngagementMetrics {
    // Initialize metrics if not present
    if (!sessionData.riskEngagementMetrics) {
      sessionData.riskEngagementMetrics = {
        dismissalCount: 0,
        averageConfidence: 0,
        escalationLevel: 1,
        discoveredRiskIndicators: [],
        consecutiveLowConfidence: 0,
        totalAssessments: 0,
      };
    }

    const metrics = sessionData.riskEngagementMetrics;
    metrics.totalAssessments++;

    // Extract risk indicators first to determine if this is actually a risky situation
    const newIndicators = this.extractRiskIndicators(assessment, proposedAction);
    const hasActualRisks =
      assessment.isIrreversible ||
      assessment.survivabilityThreatened ||
      newIndicators.length > 0 ||
      (assessment.riskFeatures &&
        (assessment.riskFeatures.timePressure === 'high' ||
          assessment.riskFeatures.timePressure === 'critical' ||
          assessment.riskFeatures.impactRadius === 'broad' ||
          assessment.riskFeatures.impactRadius === 'systemic'));

    // Update average confidence
    const oldAverage = metrics.averageConfidence;
    metrics.averageConfidence =
      (oldAverage * (metrics.totalAssessments - 1) + assessment.confidence) /
      metrics.totalAssessments;

    // Only track as dismissal if there are actual risks AND confidence is low
    if (hasActualRisks && assessment.confidence < this.LOW_CONFIDENCE_THRESHOLD) {
      metrics.dismissalCount++;
      metrics.consecutiveLowConfidence++;
    } else {
      // Reset consecutive count on substantive engagement OR when no risks present
      if (assessment.confidence > 0.5 || !hasActualRisks) {
        metrics.consecutiveLowConfidence = 0;
        if (assessment.confidence > 0.5) {
          metrics.lastSubstantiveEngagement = new Date().toISOString();
        }
      }
    }

    // Add new indicators to metrics
    newIndicators.forEach(indicator => {
      if (!metrics.discoveredRiskIndicators.includes(indicator)) {
        metrics.discoveredRiskIndicators.push(indicator);
      }
    });

    // Update escalation level based on patterns
    metrics.escalationLevel = this.calculateEscalationLevel(metrics, sessionData);

    return metrics as RiskEngagementMetrics;
  }

  /**
   * Detect dismissal patterns from session history
   */
  detectPatterns(sessionData: SessionData): DismissalPattern[] {
    const patterns: DismissalPattern[] = [];
    const metrics = sessionData.riskEngagementMetrics;

    if (!metrics) return patterns;

    // Pattern 1: Consecutive low confidence
    if (metrics.consecutiveLowConfidence >= 3) {
      patterns.push({
        type: 'consecutive',
        severity: this.getConsecutiveSeverity(metrics.consecutiveLowConfidence),
        evidence: [
          `${metrics.consecutiveLowConfidence} consecutive assessments with confidence < ${this.LOW_CONFIDENCE_THRESHOLD}`,
          `Average confidence: ${metrics.averageConfidence.toFixed(2)}`,
        ],
      });
    }

    // Pattern 2: Rapid dismissal
    const rapidDismissals = this.checkRapidDismissals(sessionData);
    if (rapidDismissals > 2) {
      patterns.push({
        type: 'rapid',
        severity: rapidDismissals > 4 ? 'high' : 'medium',
        evidence: [
          `${rapidDismissals} assessments dismissed within ${this.RAPID_DISMISSAL_WINDOW / 1000}s`,
          'Suggests not reading or considering the prompts',
        ],
      });
    }

    // Pattern 3: Contradictory assessments
    const contradictions = this.findContradictions(sessionData);
    if (contradictions.length > 0) {
      patterns.push({
        type: 'contradictory',
        severity: 'high',
        evidence: contradictions,
      });
    }

    return patterns;
  }

  /**
   * Evaluate if a response meets the requirements to unlock progress
   */
  evaluateUnlockResponse(
    response: string,
    requiredConfidence: number,
    metrics: RiskEngagementMetrics
  ): { isValid: boolean; feedback: string } {
    const responseLower = response.toLowerCase();

    // Check for specific commitments
    const hasExitCriteria =
      responseLower.includes('will exit if') ||
      responseLower.includes('abandon if') ||
      responseLower.includes('stop if');

    const hasSpecificCalculations =
      /\d+/.test(response) && // Contains numbers
      (responseLower.includes('percent') ||
        responseLower.includes('%') ||
        responseLower.includes('months') ||
        responseLower.includes('years') ||
        responseLower.includes('dollars') ||
        responseLower.includes('$'));

    const hasStakeholderConsideration =
      responseLower.includes('employee') ||
      responseLower.includes('customer') ||
      responseLower.includes('partner') ||
      responseLower.includes('investor') ||
      responseLower.includes('family') ||
      responseLower.includes('team');

    const hasContingencyPlan =
      responseLower.includes('if fails') ||
      responseLower.includes('backup') ||
      responseLower.includes('contingency') ||
      responseLower.includes('rollback');

    // Calculate response quality score
    let qualityScore = 0;
    if (hasExitCriteria) qualityScore += 0.3;
    if (hasSpecificCalculations) qualityScore += 0.3;
    if (hasStakeholderConsideration) qualityScore += 0.2;
    if (hasContingencyPlan) qualityScore += 0.2;

    // Check minimum length for substantive response
    const wordCount = response.split(/\s+/).length;
    if (wordCount < 50) {
      return {
        isValid: false,
        feedback:
          'Response too brief. Please provide detailed analysis addressing all requirements.',
      };
    }

    // Check if confidence meets requirement
    if (qualityScore < requiredConfidence) {
      const missing = [];
      if (!hasExitCriteria) missing.push('clear exit criteria');
      if (!hasSpecificCalculations) missing.push('specific calculations');
      if (!hasStakeholderConsideration) missing.push('stakeholder impact analysis');
      if (!hasContingencyPlan) missing.push('contingency planning');

      return {
        isValid: false,
        feedback: `Response lacks: ${missing.join(', ')}. Quality score: ${qualityScore.toFixed(2)}/${requiredConfidence.toFixed(2)}`,
      };
    }

    // Reset metrics on successful unlock
    metrics.consecutiveLowConfidence = 0;
    metrics.escalationLevel = Math.max(1, metrics.escalationLevel - 1);

    return {
      isValid: true,
      feedback: 'Response meets requirements. Behavioral lock released.',
    };
  }

  /**
   * Calculate appropriate escalation level
   */
  private calculateEscalationLevel(
    metrics: RiskEngagementMetrics,
    sessionData: SessionData
  ): number {
    // Don't escalate on first few assessments - give time to understand
    if (metrics.totalAssessments <= 3) {
      return 1;
    }

    // Don't escalate if no actual risks have been discovered
    if (metrics.discoveredRiskIndicators.length === 0) {
      return 1;
    }

    // No domain-specific escalation limits - all contexts treated equally
    // The adaptive language system will handle context-appropriate messaging

    // Check for high-stakes indicators first
    const hasHighStakes = this.detectHighStakesIndicators(sessionData);

    // Level 4: Critical - only for severe patterns with high stakes
    // Increased thresholds: now requires 4+ consecutive or 6+ total dismissals
    if (hasHighStakes && (metrics.consecutiveLowConfidence >= 4 || metrics.dismissalCount >= 6)) {
      return 4;
    }

    // Level 3: Persistent dismissal OF ACTUAL RISKS
    // Increased threshold from 6 to 8 dismissals
    if (metrics.dismissalCount >= 8) {
      return 3;
    }

    // Level 2: Pattern emerging (require more dismissals)
    // Increased thresholds from 3 to 5 dismissals
    if (
      metrics.dismissalCount >= 5 ||
      (metrics.consecutiveLowConfidence >= 4 && metrics.discoveredRiskIndicators.length > 0)
    ) {
      return 2;
    }

    // Level 1: Normal operation
    return 1;
  }

  /**
   * Extract risk indicators from assessment
   */
  private extractRiskIndicators(assessment: RuinRiskAssessment, proposedAction: string): string[] {
    const indicators: string[] = [];

    if (assessment.isIrreversible) {
      indicators.push('irreversibility');
    }

    if (assessment.survivabilityThreatened) {
      indicators.push('survival threat');
    }

    if (assessment.riskFeatures) {
      const { timePressure, impactRadius, uncertaintyLevel } = assessment.riskFeatures;

      if (timePressure === 'high' || timePressure === 'critical') {
        indicators.push('high time pressure');
      }

      if (impactRadius === 'broad' || impactRadius === 'systemic') {
        indicators.push(`${impactRadius} impact`);
      }

      if (uncertaintyLevel === 'high') {
        indicators.push('high uncertainty');
      }
    }

    // Extract from proposed action with improved context awareness
    const actionLower = proposedAction.toLowerCase();

    // Check for true total commitment language, avoiding false positives
    // like "all-stock", "all-weather", "all-cap" etc.
    const totalCommitmentPhrases = [
      'all in',
      'everything on',
      'entire savings',
      'entire portfolio on',
      'all my money',
      'everything i have',
      'bet it all',
      'risk everything',
    ];

    // Check for standalone "all" or "everything" that aren't part of compound terms
    const hasStandaloneAll = /\ball\s+(my|our|the)\s+(money|savings|resources|funds)/i.test(
      proposedAction
    );
    const hasStandaloneEverything = /\beverything\s+(on|into|at)\b/i.test(proposedAction);

    // Exclude common false positives in financial contexts
    const falsePositives = [
      'all-stock',
      'all-weather',
      'all-cap',
      'all-equity',
      'all-bond',
      'all-season',
      'allocation',
      'all things considered',
      'all else being equal',
    ];

    const containsFalsePositive = falsePositives.some(fp => actionLower.includes(fp));

    if (
      !containsFalsePositive &&
      (totalCommitmentPhrases.some(phrase => actionLower.includes(phrase)) ||
        hasStandaloneAll ||
        hasStandaloneEverything)
    ) {
      indicators.push('total commitment language');
    }

    // Check for actual gambling language (not just portfolio "bets")
    const gamblingPhrases = [
      'bet it all',
      'gamble everything',
      'roll the dice',
      'double or nothing',
    ];

    // Check for true gambling context, not investment terminology
    const hasGamblingContext =
      gamblingPhrases.some(phrase => actionLower.includes(phrase)) ||
      /\b(bet|gamble)\s+(all|everything|it all)/i.test(proposedAction);

    if (hasGamblingContext) {
      indicators.push('gambling language');
    }

    return indicators;
  }

  /**
   * Check for rapid dismissals
   */
  private checkRapidDismissals(sessionData: SessionData): number {
    if (!sessionData.history || sessionData.history.length < 2) return 0;

    let rapidCount = 0;

    // Look at recent history
    const recentHistory = sessionData.history.slice(-10);

    for (let i = 1; i < recentHistory.length; i++) {
      const current = recentHistory[i];
      const previous = recentHistory[i - 1];

      if (!current.timestamp || !previous.timestamp) continue;

      const currentTime = new Date(current.timestamp).getTime();
      const previousTime = new Date(previous.timestamp).getTime();
      const timeDiff = currentTime - previousTime;

      // Check if assessment was rapid and low confidence
      if (timeDiff < this.RAPID_DISMISSAL_WINDOW) {
        if (
          'ruinAssessment' in current &&
          current.ruinAssessment &&
          'assessment' in current.ruinAssessment
        ) {
          const assessment = current.ruinAssessment.assessment as Record<string, unknown>;
          if (
            'confidence' in assessment &&
            typeof assessment.confidence === 'number' &&
            assessment.confidence < this.LOW_CONFIDENCE_THRESHOLD
          ) {
            rapidCount++;
          }
        }
      }
    }

    return rapidCount;
  }

  /**
   * Find contradictions between assessments and actions
   */
  private findContradictions(sessionData: SessionData): string[] {
    const contradictions: string[] = [];

    if (!sessionData.history) return contradictions;

    // Check if proposed actions violate discovered risks
    sessionData.history.forEach((entry, index) => {
      if (
        'ruinAssessment' in entry &&
        entry.ruinAssessment &&
        'assessment' in entry.ruinAssessment
      ) {
        const assessment = entry.ruinAssessment.assessment as Record<string, unknown>;

        const confidence =
          'confidence' in assessment && typeof assessment.confidence === 'number'
            ? assessment.confidence
            : 1;

        const survivabilityThreatened =
          'survivabilityThreatened' in assessment && assessment.survivabilityThreatened === true;

        const isIrreversible = 'isIrreversible' in assessment && assessment.isIrreversible === true;

        // Low confidence but high-risk action
        if (confidence < 0.3 && survivabilityThreatened) {
          contradictions.push(
            `Step ${index + 1}: Acknowledged survival threat with low confidence (${confidence})`
          );
        }

        // Irreversible action with casual dismissal
        if (isIrreversible && confidence < 0.5) {
          contradictions.push(
            `Step ${index + 1}: Irreversible action dismissed with confidence ${confidence}`
          );
        }
      }
    });

    // Also check for high-risk indicators with low confidence
    const metrics = sessionData.riskEngagementMetrics;
    if (metrics && metrics.discoveredRiskIndicators.length > 0 && metrics.averageConfidence < 0.3) {
      const hasHighRisk = metrics.discoveredRiskIndicators.some(
        i => i.includes('irreversibility') || i.includes('survival')
      );
      if (hasHighRisk) {
        contradictions.push(
          `High-risk indicators (${metrics.discoveredRiskIndicators.join(', ')}) with low average confidence (${metrics.averageConfidence.toFixed(2)})`
        );
      }
    }

    return contradictions;
  }

  /**
   * Detect high-stakes indicators from content
   */
  private detectHighStakesIndicators(sessionData: SessionData): boolean {
    const metrics = sessionData.riskEngagementMetrics;
    if (!metrics) return false;

    // Check discovered risk indicators
    const highStakesIndicators = [
      'survival threat',
      'irreversibility',
      'systemic impact',
      'total commitment language',
      'gambling language',
    ];

    return highStakesIndicators.some(indicator =>
      metrics.discoveredRiskIndicators.includes(indicator)
    );
  }

  /**
   * Get severity based on consecutive dismissals
   */
  private getConsecutiveSeverity(count: number): DismissalPattern['severity'] {
    if (count >= 7) return 'critical';
    if (count >= 5) return 'high';
    if (count >= 3) return 'medium';
    return 'low';
  }

  /**
   * Generate behavioral feedback based on patterns
   */
  generateBehavioralFeedback(patterns: DismissalPattern[], metrics: RiskEngagementMetrics): string {
    if (patterns.length === 0) return '';

    const criticalPattern = patterns.find(p => p.severity === 'critical');
    const highPattern = patterns.find(p => p.severity === 'high');

    if (criticalPattern) {
      return this.generateCriticalFeedback(criticalPattern, metrics);
    }

    if (highPattern) {
      return this.generateHighFeedback(highPattern, metrics);
    }

    return this.generateMediumFeedback(patterns[0], metrics);
  }

  private generateCriticalFeedback(
    pattern: DismissalPattern,
    metrics: RiskEngagementMetrics
  ): string {
    return `🚨 CRITICAL: Dangerous dismissal pattern detected.

Your behavior shows:
${pattern.evidence.map(e => `- ${e}`).join('\n')}

Your OWN analysis identified these risks: ${metrics.discoveredRiskIndicators.join(', ')}

The next step is LOCKED until you:
1. Re-read YOUR discovered risks
2. Provide analysis with confidence > 0.5
3. Address each risk YOU identified

This is not a procedural warning. Your pattern suggests overconfidence that could lead to the exact failures you discovered.`;
  }

  private generateHighFeedback(pattern: DismissalPattern, metrics: RiskEngagementMetrics): string {
    return `⚠️ WARNING: Pattern of dismissive behavior detected.

Evidence:
${pattern.evidence.map(e => `- ${e}`).join('\n')}

You discovered: ${metrics.discoveredRiskIndicators.slice(0, 3).join(', ')}
Yet your confidence remains at ${metrics.averageConfidence.toFixed(2)}

Please engage substantively with the risks YOU identified, not just acknowledge them.`;
  }

  private generateMediumFeedback(
    pattern: DismissalPattern,
    metrics: RiskEngagementMetrics
  ): string {
    return `📊 Pattern detected: ${pattern.type} dismissals.

Your average confidence: ${metrics.averageConfidence.toFixed(2)}
Consecutive low-confidence assessments: ${metrics.consecutiveLowConfidence}

Remember: You identified "${metrics.discoveredRiskIndicators[0] || 'risks'}" - please address them specifically.`;
  }
}
