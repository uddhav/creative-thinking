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

    return metrics;
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
   * Calculate appropriate escalation level
   */
  private calculateEscalationLevel(
    metrics: RiskEngagementMetrics,
    sessionData: SessionData
  ): number {
    // Don't escalate on first assessment
    if (metrics.totalAssessments === 1) {
      return 1;
    }

    // Don't escalate if no actual risks have been discovered
    if (metrics.discoveredRiskIndicators.length === 0) {
      return 1;
    }

    // Check for high-stakes indicators first
    const hasHighStakes = this.detectHighStakesIndicators(sessionData);

    // Level 4: Critical - high stakes with dismissive behavior
    if (hasHighStakes && (metrics.consecutiveLowConfidence >= 2 || metrics.dismissalCount >= 3)) {
      return 4;
    }

    // Level 3: Persistent dismissal OF ACTUAL RISKS
    if (metrics.dismissalCount >= 6) {
      return 3;
    }

    // Level 2: Pattern emerging (require actual dismissals, not just low confidence)
    if (
      metrics.dismissalCount >= 3 ||
      (metrics.consecutiveLowConfidence >= 3 && metrics.discoveredRiskIndicators.length > 0)
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

    // Extract from proposed action
    const actionLower = proposedAction.toLowerCase();
    // Use word boundaries to avoid false positives like "allocation" containing "all"
    const actionWords = actionLower.split(/\b/);
    if (
      actionWords.includes('all') ||
      actionWords.includes('everything') ||
      actionLower.includes('all in') ||
      actionLower.includes('entire')
    ) {
      indicators.push('total commitment language');
    }

    if (
      actionWords.includes('bet') ||
      actionWords.includes('gamble') ||
      actionLower.includes('betting') ||
      actionLower.includes('gambling')
    ) {
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
