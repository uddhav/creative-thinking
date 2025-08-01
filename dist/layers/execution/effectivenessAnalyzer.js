/**
 * Effectiveness analysis for thinking techniques
 * Evaluates the quality and impact of outputs
 */
export class EffectivenessAnalyzer {
    /**
     * Analyze the effectiveness of a thinking step
     */
    static analyzeEffectiveness(input) {
        let novelty = 0;
        let actionability = 0;
        let riskAwareness = 0;
        // Analyze output content
        const outputLength = input.output.length;
        const hasSpecifics = /\b(specific|detail|step|action|implement)\b/i.test(input.output);
        const hasRisks = input.risks && input.risks.length > 0;
        const hasMitigations = input.mitigations && input.mitigations.length > 0;
        // Calculate novelty score
        if (outputLength > 100)
            novelty += 0.3;
        if (input.output.includes('novel') || input.output.includes('unique'))
            novelty += 0.2;
        if (input.randomStimulus || input.provocation)
            novelty += 0.3;
        if (input.connections && input.connections.length > 2)
            novelty += 0.2;
        // Calculate actionability score
        if (hasSpecifics)
            actionability += 0.4;
        if (input.output.includes('can') || input.output.includes('will'))
            actionability += 0.2;
        if (input.applications && input.applications.length > 0)
            actionability += 0.4;
        // Calculate risk awareness score
        if (hasRisks)
            riskAwareness += 0.4;
        if (hasMitigations)
            riskAwareness += 0.4;
        if (input.blackSwans && input.blackSwans.length > 0)
            riskAwareness += 0.2;
        // Technique-specific adjustments
        switch (input.technique) {
            case 'six_hats':
                if (input.hatColor === 'black' && hasRisks)
                    riskAwareness = Math.min(1, riskAwareness + 0.2);
                if (input.hatColor === 'green' && outputLength > 150)
                    novelty = Math.min(1, novelty + 0.2);
                break;
            case 'scamper':
                if (input.scamperAction && outputLength > 100)
                    actionability = Math.min(1, actionability + 0.2);
                break;
            case 'design_thinking':
                if (input.designStage === 'prototype' && hasSpecifics)
                    actionability = Math.min(1, actionability + 0.3);
                break;
            case 'triz':
                if (input.inventivePrinciples && input.inventivePrinciples.length > 0) {
                    novelty = Math.min(1, novelty + 0.3);
                    actionability = Math.min(1, actionability + 0.2);
                }
                break;
        }
        // Ensure scores are between 0 and 1
        novelty = Math.max(0, Math.min(1, novelty));
        actionability = Math.max(0, Math.min(1, actionability));
        riskAwareness = Math.max(0, Math.min(1, riskAwareness));
        // Calculate overall score
        const overall = (novelty + actionability + riskAwareness) / 3;
        // Generate feedback
        let feedback;
        if (overall < 0.3) {
            feedback = 'Consider adding more specific details or examples';
        }
        else if (overall < 0.6) {
            feedback = 'Good progress - consider deepening the analysis';
        }
        else {
            feedback = 'Excellent thinking - comprehensive and actionable';
        }
        return {
            novelty,
            actionability,
            riskAwareness,
            overall,
            feedback,
        };
    }
    /**
     * Get effectiveness level description
     */
    static getEffectivenessLevel(metrics) {
        if (metrics.overall >= 0.8)
            return 'Highly Effective';
        if (metrics.overall >= 0.6)
            return 'Effective';
        if (metrics.overall >= 0.4)
            return 'Moderately Effective';
        return 'Needs Enhancement';
    }
}
//# sourceMappingURL=effectivenessAnalyzer.js.map