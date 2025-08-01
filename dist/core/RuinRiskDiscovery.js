/**
 * Dynamic Ruin Risk Discovery Framework
 *
 * This meta-framework helps LLMs discover domain-specific risks during inference
 * rather than relying on hard-coded validations. It uses Socratic questioning
 * to guide risk discovery and then enforces the LLM's own discovered constraints.
 */
/**
 * Main discovery framework that guides LLMs through risk identification
 */
export class RuinRiskDiscovery {
    discoveryHistory = new Map();
    /**
     * Get structured prompts for the discovery process
     */
    getDiscoveryPrompts(problem, proposedAction) {
        return {
            domainIdentification: `Analyzing "${problem}":
1. What domain(s) does this belong to? (e.g., financial, health, career, military, transportation, legal, relationships)
2. What makes this domain non-ergodic (if applicable)?
3. Are there irreversible actions or absorbing barriers?
4. Can you recover from failures in this domain?`,
            riskDiscovery: `For the identified domain(s), discover the specific risks:
1. What actions could cause irreversible harm?
2. What are the "ruin" scenarios in this domain?
3. What are the early warning signs of approaching danger?
4. What dependencies or correlations amplify risk?`,
            ruinScenarios: `Detail the potential ruin scenarios:
1. What does complete failure look like in this domain?
2. What sequence of events leads to ruin?
3. How quickly can ruin occur?
4. What are the points of no return?
5. Are there cascade effects?`,
            safetyPractices: `Identify domain-specific safety practices:
1. What established safety frameworks exist? (e.g., Kelly Criterion in finance)
2. What do experts in this domain do to avoid ruin?
3. What are the "golden rules" or heuristics?
4. What safety margins are typically used?
5. How is risk typically measured and limited?`,
            maxAcceptableLoss: `Calculate maximum acceptable exposure:
1. Given the risks identified, what's the maximum safe exposure?
2. How did you calculate this limit?
3. What assumptions underlie this calculation?
4. How does this change with different time horizons?
5. What buffers should be added for uncertainty?`,
            validation: proposedAction
                ? `Validate "${proposedAction}" against discovered constraints:
1. Does this exceed any safety limits you identified?
2. What percentage of maximum acceptable risk does this represent?
3. Are all identified safety practices being followed?
4. What could go wrong with this specific action?
5. What would you need to change to make this safe?`
                : `How would you validate any proposed action in this domain?`,
        };
    }
    /**
     * Process LLM's domain assessment response
     */
    processDomainAssessment(response) {
        // This would parse the LLM's response to extract domain information
        // For now, return a structure that execution layer can use
        return {
            primaryDomain: this.extractPrimaryDomain(response),
            domainCharacteristics: this.extractCharacteristics(response),
            confidence: this.assessConfidence(response),
        };
    }
    /**
     * Process discovered risks from LLM response
     */
    processRiskDiscovery(domain, response) {
        const discovery = {
            domain,
            identifiedRisks: this.extractRisks(response),
            domainSpecificSafetyPractices: this.extractSafetyPractices(response),
            maxAcceptableLoss: this.extractMaxLoss(response),
        };
        // Cache for future reference
        this.discoveryHistory.set(domain, discovery);
        return discovery;
    }
    /**
     * Validate an action against discovered risks
     */
    validateAgainstDiscoveredRisks(action, discovery, ruinScenarios) {
        const violatedConstraints = [];
        // Check if action violates any discovered safety practices
        discovery.domainSpecificSafetyPractices.forEach(practice => {
            if (this.actionViolatesPractice(action, practice)) {
                violatedConstraints.push(practice);
            }
        });
        // Assess overall risk level
        const riskLevel = this.assessRiskLevel(action, discovery, ruinScenarios);
        return {
            isValid: violatedConstraints.length === 0 && riskLevel !== 'unacceptable',
            violatedConstraints,
            riskLevel,
            educationalFeedback: this.generateEducationalFeedback(violatedConstraints, discovery),
        };
    }
    /**
     * Force the LLM to calculate specific risk metrics
     */
    getForcedCalculations(domain, action) {
        const baseCalculations = {
            worstCaseImpact: `If "${action}" fails completely, what's the specific impact?`,
            recoveryTime: `How long would it take to recover from the worst case scenario?`,
            alternativeCount: `How many alternative approaches exist to achieve the same goal?`,
            reversibilityCost: `What would it cost (time/money/effort) to reverse this action?`,
        };
        // Add domain-aware calculations
        if (domain.includes('financial')) {
            baseCalculations['portfolioPercentage'] =
                'What percentage of total portfolio/assets does this represent?';
            baseCalculations['correlationRisk'] =
                'What other assets/income would be affected if this fails?';
        }
        if (domain.includes('health')) {
            baseCalculations['recoveryProbability'] =
                "What's the probability of full recovery if this goes wrong?";
            baseCalculations['qualityOfLifeImpact'] =
                'How would this affect quality of life if it fails?';
        }
        if (domain.includes('career')) {
            baseCalculations['reputationImpact'] =
                'How would this affect professional reputation if it fails?';
            baseCalculations['networkEffect'] = 'How many professional relationships could be damaged?';
        }
        return baseCalculations;
    }
    // Private helper methods
    extractPrimaryDomain(response) {
        // Simple extraction - in practice, this would be more sophisticated
        const domains = [
            'financial',
            'health',
            'career',
            'military',
            'transportation',
            'legal',
            'relationship',
        ];
        for (const domain of domains) {
            if (response.toLowerCase().includes(domain)) {
                return domain;
            }
        }
        return 'general';
    }
    extractCharacteristics(response) {
        const lower = response.toLowerCase();
        return {
            hasIrreversibleActions: lower.includes('irreversible') || lower.includes('permanent'),
            hasAbsorbingBarriers: lower.includes('no return') || lower.includes('absorbing'),
            allowsRecovery: !lower.includes('cannot recover') && !lower.includes('no recovery'),
            timeHorizon: this.extractTimeHorizon(response),
        };
    }
    extractTimeHorizon(response) {
        if (response.includes('immediate') || response.includes('instant'))
            return 'immediate';
        if (response.includes('days') || response.includes('weeks'))
            return 'short';
        if (response.includes('months'))
            return 'medium';
        return 'long';
    }
    assessConfidence(response) {
        // Higher confidence if response is detailed and specific
        const wordCount = response.split(' ').length;
        const hasSpecifics = /\d+%|\$\d+|specific|exactly|precisely/.test(response);
        const hasUncertainty = /maybe|perhaps|possibly|might|could/.test(response.toLowerCase());
        let confidence = Math.min(wordCount / 200, 0.5); // Base confidence from detail
        if (hasSpecifics)
            confidence += 0.3;
        if (hasUncertainty)
            confidence -= 0.2;
        return Math.max(0.1, Math.min(1, confidence));
    }
    extractRisks(response) {
        // This would parse structured risks from the response
        // For now, return a placeholder structure
        const risks = [];
        if (response.toLowerCase().includes('bankrupt') || response.toLowerCase().includes('ruin')) {
            risks.push({
                risk: 'Complete financial ruin',
                reversibility: 'irreversible',
                impactMagnitude: 'catastrophic',
            });
        }
        if (response.toLowerCase().includes('permanent') ||
            response.toLowerCase().includes('irreversible')) {
            risks.push({
                risk: 'Irreversible loss or damage',
                reversibility: 'irreversible',
                impactMagnitude: 'severe',
            });
        }
        return risks;
    }
    extractSafetyPractices(response) {
        const practices = [];
        // Look for common safety practice patterns
        const practicePatterns = [
            /never\s+(?:risk|invest|commit)\s+more\s+than\s+(\d+%)/gi,
            /always\s+(?:maintain|keep|have)\s+(.+)/gi,
            /maximum\s+(?:position|exposure|risk)\s+(?:should be|is)\s+(.+)/gi,
            /(?:experts|professionals)\s+(?:recommend|suggest|advise)\s+(.+)/gi,
        ];
        practicePatterns.forEach(pattern => {
            const matches = response.matchAll(pattern);
            for (const match of matches) {
                practices.push(match[0]);
            }
        });
        return practices;
    }
    extractMaxLoss(response) {
        const lossPattern = /maximum\s+(?:acceptable|safe)\s+(?:loss|exposure|risk)[\s\S]{0,20}(\d+%|\$[\d,]+)/i;
        const match = response.match(lossPattern);
        return match ? match[1] : undefined;
    }
    actionViolatesPractice(action, practice) {
        // This would check if the proposed action violates a discovered practice
        // For example, if practice says "never risk more than 10%" and action suggests 50%
        const practiceLimit = this.extractNumericLimit(practice);
        const actionAmount = this.extractNumericAmount(action);
        if (practiceLimit !== null && actionAmount !== null) {
            return actionAmount > practiceLimit;
        }
        return false;
    }
    extractNumericLimit(text) {
        const match = text.match(/(\d+)%/);
        return match ? parseInt(match[1]) : null;
    }
    extractNumericAmount(text) {
        const match = text.match(/(\d+)%/);
        return match ? parseInt(match[1]) : null;
    }
    assessRiskLevel(action, discovery, scenarios) {
        // Count severe/catastrophic risks
        const severeRisks = discovery.identifiedRisks.filter(r => r.impactMagnitude === 'severe' || r.impactMagnitude === 'catastrophic').length;
        // Check if any ruin scenarios are triggered
        const triggeredScenarios = scenarios.filter(s => s.triggers.some(trigger => action.toLowerCase().includes(trigger.toLowerCase()))).length;
        if (triggeredScenarios > 0 || severeRisks > 2)
            return 'unacceptable';
        if (severeRisks > 0)
            return 'high';
        if (discovery.identifiedRisks.length > 3)
            return 'medium';
        return 'low';
    }
    generateEducationalFeedback(violations, discovery) {
        if (violations.length === 0)
            return '';
        return `Your recommendation violates the following safety practices you identified:
${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Remember: In ${discovery.domain}, ${discovery.maxAcceptableLoss
            ? `you determined the maximum acceptable loss is ${discovery.maxAcceptableLoss}`
            : 'these constraints exist to prevent ruin'}.

Consider revising your recommendation to respect these discovered limits.`;
    }
    /**
     * Get previously discovered risks for a domain (if any)
     */
    getCachedDiscovery(domain) {
        return this.discoveryHistory.get(domain);
    }
}
//# sourceMappingURL=RuinRiskDiscovery.js.map