/**
 * Adaptive Risk Assessment
 *
 * Generates context-appropriate risk assessment language based on
 * the detected context, without categorizing into fixed domains.
 * All high-stakes decisions are treated seriously with appropriate terminology.
 */
export class AdaptiveRiskAssessment {
    /**
     * Analyze context from problem and output text
     */
    analyzeContext(problem, output) {
        const fullText = `${problem} ${output}`.toLowerCase();
        // Detect various contexts (not exclusive - can have multiple)
        const hasPersonalFinance = this.detectPersonalFinance(fullText);
        const hasBusinessContext = this.detectBusinessContext(fullText);
        const hasHealthSafety = this.detectHealthSafety(fullText);
        const hasCreativeExploration = this.detectCreativeExploration(fullText);
        const hasTechnicalMigration = this.detectTechnicalMigration(fullText);
        // Detect high stakes regardless of domain
        const hasHighStakes = this.detectHighStakes(fullText);
        // Determine resource type
        const resourceType = this.detectResourceType(fullText, {
            hasPersonalFinance,
            hasBusinessContext,
            hasHealthSafety,
        });
        // Identify stakeholders
        const stakeholders = this.identifyStakeholders(fullText, {
            hasPersonalFinance,
            hasBusinessContext,
        });
        // Estimate recovery timeframe
        const recoveryTimeframe = this.estimateRecoveryTimeframe(fullText);
        return {
            hasPersonalFinance,
            hasBusinessContext,
            hasHealthSafety,
            hasCreativeExploration,
            hasTechnicalMigration,
            hasHighStakes,
            resourceType,
            stakeholders,
            recoveryTimeframe,
        };
    }
    /**
     * Generate adaptive risk assessment prompt based on context
     */
    generateAdaptivePrompt(problem, proposedAction, context) {
        const header = this.getContextualHeader(context);
        const questions = this.getContextualQuestions(context);
        const stakeholderSection = this.getStakeholderSection(context);
        const mitigationSection = this.getMitigationSection(context);
        return `${header} for "${problem}":

Proposed action: ${proposedAction}

${questions}

${stakeholderSection}

${mitigationSection}

Remember: ${this.getContextualReminder(context)}`;
    }
    /**
     * Generate context-appropriate escalation language
     */
    generateAdaptiveEscalation(level, indicators, context) {
        if (level >= 4) {
            return this.generateHighStakesEscalation(context, indicators);
        }
        if (level === 3) {
            return this.generateModerateEscalation(context, indicators);
        }
        return this.generateLowEscalation(context);
    }
    detectPersonalFinance(text) {
        const indicators = [
            'my savings',
            'my portfolio',
            'personal investment',
            'retirement fund',
            'life savings',
            'personal wealth',
            'my money',
            'individual investor',
        ];
        return indicators.some(ind => text.includes(ind));
    }
    detectBusinessContext(text) {
        const indicators = [
            'company',
            'business',
            'vendor',
            'enterprise',
            'organization',
            'corporate',
            'startup',
            'firm',
            'customer',
            'client',
            'revenue',
            'profit',
            'employee',
            'team',
            'department',
        ];
        return indicators.some(ind => text.includes(ind));
    }
    detectHealthSafety(text) {
        const indicators = [
            'health',
            'medical',
            'surgery',
            'treatment',
            'safety',
            'injury',
            'disease',
            'condition',
            'doctor',
            'hospital',
            'medication',
        ];
        return indicators.some(ind => text.includes(ind));
    }
    detectCreativeExploration(text) {
        const indicators = [
            'brainstorm',
            'what if',
            'imagine',
            'explore',
            'creative',
            'hypothetical',
            'thought experiment',
            'conceptual',
            'ideate',
        ];
        return indicators.some(ind => text.includes(ind));
    }
    detectTechnicalMigration(text) {
        const indicators = [
            'migration',
            'platform',
            'vendor',
            'system',
            'infrastructure',
            'deployment',
            'integration',
            'api',
            'database',
            'architecture',
        ];
        return indicators.some(ind => text.includes(ind));
    }
    detectHighStakes(text) {
        const indicators = [
            'all',
            'everything',
            'entire',
            'irreversible',
            'permanent',
            'cannot undo',
            'no going back',
            'critical',
            'essential',
            'survival',
            'bankrupt',
            'fatal',
            'destroy',
            'ruin',
        ];
        return indicators.some(ind => text.includes(ind));
    }
    detectResourceType(text, context) {
        if (context.hasPersonalFinance) {
            if (text.includes('savings'))
                return 'personal savings';
            if (text.includes('retirement'))
                return 'retirement funds';
            if (text.includes('portfolio'))
                return 'investment portfolio';
            return 'personal resources';
        }
        if (context.hasBusinessContext) {
            if (text.includes('budget'))
                return 'company budget';
            if (text.includes('runway'))
                return 'business runway';
            if (text.includes('revenue'))
                return 'revenue streams';
            return 'company resources';
        }
        if (context.hasHealthSafety) {
            return 'health and wellbeing';
        }
        return 'resources';
    }
    identifyStakeholders(text, context) {
        const stakeholders = [];
        if (context.hasPersonalFinance) {
            stakeholders.push('you');
            if (text.includes('family'))
                stakeholders.push('your family');
            if (text.includes('dependents'))
                stakeholders.push('your dependents');
        }
        if (context.hasBusinessContext) {
            if (text.includes('employee'))
                stakeholders.push('employees');
            if (text.includes('customer') || text.includes('client'))
                stakeholders.push('customers');
            if (text.includes('investor'))
                stakeholders.push('investors');
            if (text.includes('partner'))
                stakeholders.push('partners');
            if (stakeholders.length === 0)
                stakeholders.push('organization stakeholders');
        }
        if (stakeholders.length === 0) {
            stakeholders.push('affected parties');
        }
        return stakeholders;
    }
    estimateRecoveryTimeframe(text) {
        if (text.includes('permanent') || text.includes('irreversible')) {
            return 'permanent - cannot recover';
        }
        if (text.includes('years'))
            return 'years';
        if (text.includes('months'))
            return 'months';
        if (text.includes('weeks'))
            return 'weeks';
        if (text.includes('bankrupt') || text.includes('ruin'))
            return 'may not be able to recover';
        return 'unknown timeframe';
    }
    getContextualHeader(context) {
        if (context.hasHighStakes) {
            return '🚨 HIGH-STAKES DECISION ASSESSMENT';
        }
        if (context.hasHealthSafety) {
            return '⚕️ HEALTH & SAFETY RISK ASSESSMENT';
        }
        if (context.hasBusinessContext && !context.hasPersonalFinance) {
            return '🏢 BUSINESS DECISION ASSESSMENT';
        }
        if (context.hasPersonalFinance) {
            return '💰 FINANCIAL DECISION ASSESSMENT';
        }
        if (context.hasTechnicalMigration) {
            return '🔧 TECHNICAL MIGRATION ASSESSMENT';
        }
        if (context.hasCreativeExploration) {
            return '💡 CREATIVE EXPLORATION CHECK';
        }
        return '⚠️ DECISION RISK ASSESSMENT';
    }
    getContextualQuestions(context) {
        const questions = [];
        // Universal questions
        questions.push('1. **Reversibility**: Can this decision be undone? At what cost?');
        // Context-specific questions
        if (context.hasBusinessContext) {
            questions.push('2. **Business Impact**: Effect on operations, revenue, and growth?');
            questions.push('3. **Stakeholder Impact**: How are employees, customers, partners affected?');
            questions.push('4. **Recovery Plan**: Can the business survive if this fails?');
        }
        else if (context.hasPersonalFinance) {
            questions.push('2. **Personal Impact**: Effect on financial security and goals?');
            questions.push('3. **Survival Impact**: Can you meet basic needs if this fails?');
            questions.push('4. **Time to Recovery**: How long to recover from worst case?');
        }
        else if (context.hasHealthSafety) {
            questions.push('2. **Health Impact**: Physical and mental health consequences?');
            questions.push('3. **Professional Guidance**: Have you consulted qualified professionals?');
            questions.push('4. **Emergency Plan**: What if complications arise?');
        }
        else {
            questions.push('2. **Impact Scope**: Who and what will be affected?');
            questions.push('3. **Worst Case**: Can you survive the worst outcome?');
            questions.push('4. **Alternatives**: What other options exist?');
        }
        questions.push('5. **Confidence Level**: How certain are you about the outcomes?');
        return questions.join('\n');
    }
    getStakeholderSection(context) {
        if (context.stakeholders.length === 0) {
            return '';
        }
        return `**Who is affected**:
${context.stakeholders.map(s => `- ${s}`).join('\n')}`;
    }
    getMitigationSection(context) {
        const mitigations = [];
        if (context.hasHighStakes) {
            mitigations.push('- Set clear exit criteria before proceeding');
            mitigations.push('- Define maximum acceptable loss');
            mitigations.push('- Create contingency plans');
        }
        if (context.hasBusinessContext) {
            mitigations.push('- Consider phased rollout or pilot');
            mitigations.push('- Ensure stakeholder alignment');
            mitigations.push('- Document rollback procedures');
        }
        if (context.hasTechnicalMigration) {
            mitigations.push('- Plan parallel run period');
            mitigations.push('- Ensure data backup and recovery');
            mitigations.push('- Test rollback procedures');
        }
        if (mitigations.length === 0) {
            mitigations.push('- Consider starting with small, reversible steps');
            mitigations.push('- Identify early warning signs');
        }
        return `**Risk Mitigation**:
${mitigations.join('\n')}`;
    }
    getContextualReminder(context) {
        if (context.hasHighStakes) {
            return ('High-stakes decisions affect ' +
                context.stakeholders.join(', ') +
                '. Ensure you can survive the worst case.');
        }
        if (context.hasBusinessContext) {
            return 'Business decisions impact multiple stakeholders. Consider the broader implications.';
        }
        if (context.hasPersonalFinance) {
            return 'In non-ergodic domains, you cannot recover from ruin to try again.';
        }
        if (context.hasHealthSafety) {
            return 'Health decisions require professional guidance. This tool provides perspective, not medical advice.';
        }
        if (context.hasCreativeExploration) {
            return 'Creative exploration is about possibility. Focus on learning over risk.';
        }
        return 'Consider both immediate and long-term consequences of this decision.';
    }
    generateHighStakesEscalation(context, indicators) {
        return `🔴 CRITICAL: HIGH-STAKES DECISION DETECTED

You've identified these risks: ${indicators.join(', ')}

This decision affects: ${context.stakeholders.join(', ')}
Resources at stake: ${context.resourceType}
Recovery timeframe if failed: ${context.recoveryTimeframe}

Before proceeding, YOU MUST address:

1. **What's at stake** (be specific):
   - Resources at risk: _________________
   - ${context.hasBusinessContext ? 'Company runway remaining' : 'Personal resources remaining'}: _________________
   - What CANNOT be lost: _________________
   - Time to recover if lost: _________________

2. **Stakeholder impact**:
   ${context.stakeholders.map(s => `- Impact on ${s}: _________________`).join('\n   ')}

3. **Exit criteria**:
   "I will STOP this path if:
    □ Loss exceeds ______ of ${context.resourceType}
    □ These warning signs appear: _________________
    □ Time horizon exceeds: _________________"

4. **Validation**:
   □ I have analyzed worst-case scenarios
   □ I have contingency plans for failure
   □ ${context.hasBusinessContext ? 'Key stakeholders are aligned' : 'I have discussed with trusted advisors'}
   □ I can survive if this completely fails

Your confidence must exceed 0.7 to proceed with high-stakes actions.
This escalation triggered because YOU identified potentially ruinous risks.`;
    }
    generateModerateEscalation(context, indicators) {
        return `⚠️ WARNING: Significant risks detected.

Identified concerns: ${indicators.join(', ')}
Affecting: ${context.stakeholders.join(', ')}

Please ensure you have:
- Calculated maximum acceptable loss
- Identified early warning signs  
- ${context.hasBusinessContext ? 'Documented decision rationale' : 'Considered alternatives'}
- ${context.hasTechnicalMigration ? 'Tested rollback procedures' : 'Created contingency plans'}
- Defined success criteria

Proceed with caution and monitoring.`;
    }
    generateLowEscalation(context) {
        return `ℹ️ Decision checkpoint:

Consider:
- Have you identified the key trade-offs?
- Can you test assumptions with small steps?
- What would you learn from failure?

${context.hasCreativeExploration ? 'This appears to be exploratory. Focus on learning.' : 'Proceed with appropriate caution.'}`;
    }
}
// Export singleton instance
export const adaptiveRiskAssessment = new AdaptiveRiskAssessment();
//# sourceMappingURL=AdaptiveRiskAssessment.js.map