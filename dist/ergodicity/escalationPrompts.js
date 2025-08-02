/**
 * Dynamic Escalation Prompts
 *
 * Generates behavioral prompts based on dismissal patterns,
 * not domain categories. References the LLM's own discoveries.
 */
export class EscalationPromptGenerator {
    /**
     * Generate appropriate escalation prompt based on metrics and patterns
     */
    generatePrompt(metrics, patterns, sessionData) {
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
    generateLevel2Prompt(metrics, patterns, sessionData) {
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
     * Level 3: Behavioral lock with self-referential requirements
     */
    generateLevel3Prompt(metrics, patterns, sessionData) {
        const discoveredRisks = this.extractDiscoveredRisks(sessionData);
        const proposedActions = this.extractProposedActions(sessionData);
        const contradictions = this.findContradictions(discoveredRisks, proposedActions);
        return {
            level: 3,
            prompt: `🚨 STOP - ENGAGEMENT REQUIRED

${metrics.dismissalCount} dismissals detected. ${metrics.consecutiveLowConfidence} consecutive low-confidence assessments.

YOUR discoveries vs YOUR actions:
${contradictions
                .slice(0, 3)
                .map((c, i) => `${i + 1}. ${c}`)
                .join('\n')}

The next step is LOCKED until you provide:

1. **Specific calculations** based on YOUR identified risks:
   ${this.generateCalculationRequirements(discoveredRisks)}

2. **Exit conditions** - When would you abandon this approach?
   - Condition 1: _________________ (must be measurable)
   - Condition 2: _________________ (must be time-bound)
   - Condition 3: _________________ (must relate to YOUR risks)

3. **Simple explanation** - Explain to someone unfamiliar with the domain:
   "This action could fail because _________________
    If it fails, the impact would be _________________
    I would know it's failing when _________________"

Minimum confidence required: 0.5
This is not procedural. Your pattern indicates dangerous overconfidence in the face of risks YOU identified.`,
            requiresResponse: true,
            minimumConfidence: 0.5,
            locksProgress: true,
        };
    }
    /**
     * Level 4: High-stakes personal declaration
     */
    generateLevel4Prompt(metrics, patterns, sessionData) {
        const highStakesIndicators = metrics.discoveredRiskIndicators.filter(i => ['survival threat', 'irreversibility', 'total commitment language'].includes(i));
        // Extract the most recent high-stakes action from session
        const recentActions = this.extractProposedActions(sessionData);
        const criticalAction = recentActions.find(a => a.toLowerCase().includes('all') ||
            a.toLowerCase().includes('everything') ||
            a.toLowerCase().includes('bet')) ||
            recentActions[0] ||
            'your proposed action';
        // Get the most severe pattern
        const severePattern = patterns.find(p => p.severity === 'critical') ||
            patterns.find(p => p.severity === 'high') ||
            patterns[0];
        return {
            level: 4,
            prompt: `🔴 CRITICAL: HIGH-STAKES DECISION DETECTED

Your analysis identified: ${highStakesIndicators.join(', ')}
Yet you've dismissed ${metrics.dismissalCount} risk assessments.

Pattern detected: ${severePattern ? severePattern.evidence.join('; ') : 'Systematic dismissal'}
Most recent action: "${criticalAction.substring(0, 100)}..."

Before proceeding, YOU MUST declare concrete stakes:

1. **What's at risk** (be specific):
   - Amount: $_________________ 
   - Percentage of total resources: _____%
   - What CANNOT be lost: _________________
   - Time to recover if lost: _____ months/years

2. **Historical perspective**:
   Similar overconfidence has led to:
   - Enron (2001): "New economy" dismissal of traditional risks → $74B loss
   - LTCM (1998): "Models can't fail" → $4.6B loss, systemic crisis
   - Your scenario: _________________

3. **Falsifiable commitment**:
   "I will EXIT this position if:
    □ Loss exceeds ____% of committed resources
    □ These indicators appear: _________________
    □ Time horizon exceeds: _________________"

4. **Cooling-off declaration**:
   □ I understand this decision cannot be made impulsively
   □ I will review this after a 24-hour cooling period
   □ I have discussed this with someone who disagrees

Your confidence must exceed 0.7 to proceed with high-stakes actions.
This escalation triggered because YOU identified potentially ruinous risks.`,
            requiresResponse: true,
            minimumConfidence: 0.7,
            locksProgress: true,
        };
    }
    /**
     * Extract risks discovered by the LLM from session history
     */
    extractDiscoveredRisks(sessionData) {
        const risks = [];
        // From risk discovery data
        if (sessionData.riskDiscoveryData?.risks) {
            const discoveryRisks = sessionData.riskDiscoveryData.risks;
            if ('identifiedRisks' in discoveryRisks && Array.isArray(discoveryRisks.identifiedRisks)) {
                risks.push(...discoveryRisks.identifiedRisks.map((r) => typeof r === 'string' ? r : r.risk || ''));
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
            if ('ruinAssessment' in entry &&
                entry.ruinAssessment &&
                'assessment' in entry.ruinAssessment) {
                const assessment = entry.ruinAssessment.assessment;
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
    extractProposedActions(sessionData) {
        return sessionData.history
            .map(entry => entry.output)
            .filter(output => output.length > 20) // Meaningful outputs only
            .slice(-5); // Recent actions
    }
    /**
     * Find contradictions between discoveries and actions
     */
    findContradictions(risks, actions) {
        const contradictions = [];
        // Check for high-commitment language despite risks
        const hasHighRisk = risks.some(r => r.toLowerCase().includes('irreversible') || r.toLowerCase().includes('survival'));
        const hasHighCommitment = actions.some(a => a.toLowerCase().includes('all') ||
            a.toLowerCase().includes('everything') ||
            a.toLowerCase().includes('bet'));
        if (hasHighRisk && hasHighCommitment) {
            contradictions.push('You identified irreversible/survival risks but propose total commitment');
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
     * Generate calculation requirements based on discovered risks
     */
    generateCalculationRequirements(risks) {
        const calculations = [];
        if (risks.some(r => r.toLowerCase().includes('financial') || r.toLowerCase().includes('invest'))) {
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
     * Generate reflection requirements
     */
    generateReflectionRequirement(sessionData, currentStep) {
        const metrics = sessionData.riskEngagementMetrics;
        if (!metrics || metrics.escalationLevel < 2)
            return null;
        // Find previous high-confidence discoveries
        const previousInsights = sessionData.history
            .filter((entry, index) => {
            if ('ruinAssessment' in entry &&
                entry.ruinAssessment &&
                'assessment' in entry.ruinAssessment) {
                const assessment = entry.ruinAssessment.assessment;
                return ('confidence' in assessment &&
                    typeof assessment.confidence === 'number' &&
                    assessment.confidence > 0.5 &&
                    index < currentStep - 1);
            }
            return false;
        })
            .map((entry, index) => ({
            step: index + 1,
            risks: entry.risks || [],
            output: entry.output.substring(0, 100) + '...',
        }));
        if (previousInsights.length === 0)
            return null;
        return `📋 REFLECTION REQUIRED

In previous steps, YOU identified these risks with high confidence:
${previousInsights.map(i => `Step ${i.step}: ${i.risks.join(', ')}`).join('\n')}

Your current proposal: "${sessionData.history[currentStep - 1]?.output.substring(0, 100)}..."

Explain how your current proposal addresses EACH risk you previously identified.
If it doesn't address a risk, explain why that risk no longer applies.`;
    }
}
//# sourceMappingURL=escalationPrompts.js.map