/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 */
export class TechniqueRecommender {
    /**
     * Recommend techniques based on problem category and other factors
     */
    recommendTechniques(problemCategory, preferredOutcome, constraints, complexity, techniqueRegistry) {
        const recommendations = [];
        // Category-based recommendations
        switch (problemCategory) {
            case 'user-centered':
                recommendations.push({
                    technique: 'design_thinking',
                    reasoning: 'Human-centered approach ideal for user experience challenges',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Explores user needs from multiple perspectives',
                    effectiveness: 0.7,
                });
                break;
            case 'technical':
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'Systematic innovation for technical contradictions',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Structured modifications for technical improvements',
                    effectiveness: 0.75,
                });
                break;
            case 'creative':
                recommendations.push({
                    technique: 'random_entry',
                    reasoning: 'Breaks conventional thinking with random stimuli',
                    effectiveness: 0.8,
                });
                recommendations.push({
                    technique: 'po',
                    reasoning: 'Provocations challenge creative boundaries',
                    effectiveness: 0.85,
                });
                break;
            case 'process':
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Systematic process improvement through modifications',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'concept_extraction',
                    reasoning: 'Learn from successful process examples',
                    effectiveness: 0.7,
                });
                break;
            case 'organizational':
                recommendations.push({
                    technique: 'yes_and',
                    reasoning: 'Builds collaborative solutions without criticism',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'collective_intel',
                    reasoning: 'Harnesses team wisdom and diverse perspectives',
                    effectiveness: 0.8,
                });
                recommendations.push({
                    technique: 'cross_cultural',
                    reasoning: 'Integrates diverse cultural frameworks respectfully',
                    effectiveness: 0.85,
                });
                break;
            case 'temporal':
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Specialized for time management and kairos-chronos integration',
                    effectiveness: 0.95,
                });
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Modify and adapt temporal constraints',
                    effectiveness: 0.7,
                });
                break;
            case 'cognitive':
                recommendations.push({
                    technique: 'neural_state',
                    reasoning: 'Optimizes brain network switching for enhanced cognitive performance',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Structured thinking to manage cognitive load',
                    effectiveness: 0.7,
                });
                break;
            case 'strategic':
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Comprehensive strategic analysis from all angles',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Strategic timing and flexibility considerations',
                    effectiveness: 0.75,
                });
                break;
            case 'implementation':
                recommendations.push({
                    technique: 'disney_method',
                    reasoning: 'Sequential approach from vision to practical implementation',
                    effectiveness: 0.95,
                });
                recommendations.push({
                    technique: 'design_thinking',
                    reasoning: 'Prototype and test implementation approaches',
                    effectiveness: 0.8,
                });
                break;
            case 'systems':
                recommendations.push({
                    technique: 'nine_windows',
                    reasoning: 'Systematic analysis across time and system levels',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'System contradictions and evolution patterns',
                    effectiveness: 0.85,
                });
                break;
            default:
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Versatile technique for comprehensive exploration',
                    effectiveness: 0.8,
                });
        }
        // Adjust for preferred outcome
        if (preferredOutcome) {
            this.adjustForPreferredOutcome(recommendations, preferredOutcome);
        }
        // Add complexity-based recommendations
        if (complexity === 'high') {
            if (!recommendations.find(r => r.technique === 'neural_state')) {
                recommendations.push({
                    technique: 'neural_state',
                    reasoning: 'Manages cognitive load in complex problems',
                    effectiveness: 0.7,
                });
            }
        }
        // Sort by effectiveness
        recommendations.sort((a, b) => b.effectiveness - a.effectiveness);
        // Validate techniques exist and enhance with additional info
        const validatedRecommendations = recommendations
            .filter(rec => techniqueRegistry.isValidTechnique(rec.technique))
            .map(rec => {
            const info = techniqueRegistry.getTechniqueInfo(rec.technique);
            return {
                ...rec,
                // Enhance reasoning with step count info
                reasoning: `${rec.reasoning} (${info.totalSteps} steps)`,
            };
        });
        return validatedRecommendations.slice(0, 3); // Top 3 recommendations
    }
    /**
     * Adjust recommendations based on preferred outcome
     */
    adjustForPreferredOutcome(recommendations, outcome) {
        switch (outcome) {
            case 'innovative':
                // Boost creative techniques
                recommendations.forEach(r => {
                    if (['random_entry', 'po', 'concept_extraction'].includes(r.technique)) {
                        r.effectiveness *= 1.2;
                    }
                });
                break;
            case 'systematic':
                // Boost structured techniques
                recommendations.forEach(r => {
                    if (['scamper', 'triz', 'design_thinking', 'nine_windows', 'disney_method'].includes(r.technique)) {
                        r.effectiveness *= 1.2;
                    }
                });
                // Add Nine Windows if not present for systematic analysis
                if (!recommendations.find(r => r.technique === 'nine_windows')) {
                    recommendations.push({
                        technique: 'nine_windows',
                        reasoning: 'Systematic multi-dimensional analysis',
                        effectiveness: 0.8,
                    });
                }
                break;
            case 'risk-aware':
                // Ensure six_hats is included for black hat thinking
                if (!recommendations.find(r => r.technique === 'six_hats')) {
                    recommendations.push({
                        technique: 'six_hats',
                        reasoning: 'Black hat provides systematic risk analysis',
                        effectiveness: 0.85,
                    });
                }
                break;
            case 'collaborative':
                // Boost collaborative techniques
                recommendations.forEach(r => {
                    if (['yes_and', 'collective_intel', 'cross_cultural'].includes(r.technique)) {
                        r.effectiveness *= 1.3;
                    }
                });
                // Ensure yes_and is included for collaborative outcomes
                if (!recommendations.find(r => r.technique === 'yes_and')) {
                    recommendations.push({
                        technique: 'yes_and',
                        reasoning: 'Builds on ideas collaboratively',
                        effectiveness: 0.8,
                    });
                }
                if (!recommendations.find(r => r.technique === 'collective_intel')) {
                    recommendations.push({
                        technique: 'collective_intel',
                        reasoning: 'Leverages group wisdom for better outcomes',
                        effectiveness: 0.8,
                    });
                }
                break;
        }
    }
}
//# sourceMappingURL=TechniqueRecommender.js.map