/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with multi-factor scoring system for intelligent recommendations
 */
import { TechniqueScorer } from './TechniqueScorer.js';
export class TechniqueRecommender {
    // Wildcard inclusion probability (20% chance)
    WILDCARD_PROBABILITY = parseFloat(process.env.WILDCARD_PROBABILITY || '0.20');
    // Dynamic recommendation limits based on complexity
    RECOMMENDATION_LIMITS = {
        low: { min: 2, max: 3, wildcard: 1 },
        medium: { min: 3, max: 5, wildcard: 1 },
        high: { min: 5, max: 7, wildcard: 2 },
    };
    // Cache for technique info to avoid repeated lookups
    techniqueInfoCache = new Map();
    // Multi-factor scorer for intelligent recommendations
    scorer;
    constructor() {
        this.scorer = new TechniqueScorer();
    }
    /**
     * Recommend techniques based on problem category and other factors
     * Now enhanced with multi-factor scoring
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
                    technique: 'quantum_superposition',
                    reasoning: 'Maintains multiple contradictory technical solutions until optimal conditions emerge',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Deconstruct technical problems to fundamental components',
                    effectiveness: 0.88,
                });
                recommendations.push({
                    technique: 'neuro_computational',
                    reasoning: 'Apply neural synthesis and computational modeling',
                    effectiveness: 0.82,
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
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Explores multiple creative possibilities simultaneously without premature commitment',
                    effectiveness: 0.88,
                });
                recommendations.push({
                    technique: 'perception_optimization',
                    reasoning: 'Enhances subjective experience and perceived value',
                    effectiveness: 0.83,
                });
                recommendations.push({
                    technique: 'anecdotal_signal',
                    reasoning: 'Find inspiration in outliers and edge cases',
                    effectiveness: 0.78,
                });
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Synthesizes creative solutions from diverse cultural perspectives',
                    effectiveness: 0.82,
                });
                break;
            case 'process':
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Systematic process improvement through modifications',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Rebuild process from fundamental requirements',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'nine_windows',
                    reasoning: 'Analyze process across time and system levels',
                    effectiveness: 0.8,
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
                    technique: 'cultural_integration',
                    reasoning: 'Integrates diverse cultural frameworks respectfully',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Reshapes organizational decision environments',
                    effectiveness: 0.78,
                });
                break;
            case 'cultural':
            case 'cultural_integration':
            case 'multicultural':
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Primary technique for orchestrating cross-cultural creative synthesis',
                    effectiveness: 0.95,
                });
                recommendations.push({
                    technique: 'collective_intel',
                    reasoning: 'Foundational collective intelligence and diverse wisdom integration',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Integrates time-based cultural evolution and adaptability',
                    effectiveness: 0.85,
                });
                break;
            case 'paradoxical':
                recommendations.push({
                    technique: 'paradoxical_problem',
                    reasoning: 'Transcends contradictions through path-dependent analysis',
                    effectiveness: 0.95,
                });
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Maintains contradictory states until optimal collapse',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'Systematic contradiction resolution',
                    effectiveness: 0.85,
                });
                break;
            case 'biological':
            case 'biomimetic':
            case 'evolutionary':
            case 'adaptive':
                recommendations.push({
                    technique: 'biomimetic_path',
                    reasoning: 'Applies evolutionary strategies and biological patterns to innovation',
                    effectiveness: 0.92,
                });
                recommendations.push({
                    technique: 'collective_intel',
                    reasoning: 'Swarm intelligence and collective behavior patterns',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'meta_learning',
                    reasoning: 'Adaptive learning from patterns',
                    effectiveness: 0.88,
                });
                break;
            case 'temporal':
                recommendations.push({
                    technique: 'temporal_creativity',
                    reasoning: 'Advanced temporal thinking with path memory integration',
                    effectiveness: 0.98,
                });
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Time management and kairos-chronos integration',
                    effectiveness: 0.85,
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
                    technique: 'reverse_benchmarking',
                    reasoning: 'Find competitive advantage where all competitors fail',
                    effectiveness: 0.92,
                });
                recommendations.push({
                    technique: 'anecdotal_signal',
                    reasoning: 'Detect early strategic changes from outlier signals',
                    effectiveness: 0.88,
                });
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
            case 'validation':
            case 'verification':
            case 'truth':
                recommendations.push({
                    technique: 'criteria_based_analysis',
                    reasoning: 'Systematic truth verification through established criteria',
                    effectiveness: 0.92,
                });
                recommendations.push({
                    technique: 'linguistic_forensics',
                    reasoning: 'Deep analysis of communication patterns for authenticity',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'competing_hypotheses',
                    reasoning: 'Prevent confirmation bias through systematic comparison',
                    effectiveness: 0.88,
                });
                break;
            case 'decision':
            case 'multi-factor':
            case 'uncertainty':
                recommendations.push({
                    technique: 'competing_hypotheses',
                    reasoning: 'Bayesian approach to handle multiple competing explanations',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'criteria_based_analysis',
                    reasoning: 'Structured assessment with confidence scoring',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Consider all perspectives before deciding',
                    effectiveness: 0.8,
                });
                break;
            case 'communication':
            case 'stakeholder':
            case 'understanding':
                recommendations.push({
                    technique: 'linguistic_forensics',
                    reasoning: 'Reveal hidden patterns and motivations in communication',
                    effectiveness: 0.88,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Change decision environments to influence stakeholder behavior',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'design_thinking',
                    reasoning: 'Empathize with stakeholders to understand needs',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Bridge communication gaps across cultural differences',
                    effectiveness: 0.82,
                });
                break;
            case 'behavioral':
            case 'psychology':
            case 'perception':
                recommendations.push({
                    technique: 'perception_optimization',
                    reasoning: 'Optimize for subjective experience over objective metrics',
                    effectiveness: 0.92,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Change decision environments to influence behavior',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'anecdotal_signal',
                    reasoning: 'Detect behavioral patterns from individual outliers',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'reverse_benchmarking',
                    reasoning: 'Find opportunities in anti-mimetic behavior',
                    effectiveness: 0.82,
                });
                break;
            case 'fundamental':
            case 'first-principles':
            case 'basics':
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Deconstruct to absolute fundamentals and rebuild',
                    effectiveness: 0.95,
                });
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'Apply fundamental innovation principles',
                    effectiveness: 0.85,
                });
                recommendations.push({
                    technique: 'concept_extraction',
                    reasoning: 'Extract core patterns from successful examples',
                    effectiveness: 0.8,
                });
                break;
            case 'learning':
            case 'knowledge':
            case 'synthesis':
                recommendations.push({
                    technique: 'meta_learning',
                    reasoning: 'Synthesize patterns across multiple learning experiences',
                    effectiveness: 0.9,
                });
                recommendations.push({
                    technique: 'biomimetic_path',
                    reasoning: 'Apply evolutionary and biological learning strategies',
                    effectiveness: 0.88,
                });
                recommendations.push({
                    technique: 'temporal_creativity',
                    reasoning: 'Learn from historical patterns and future projections',
                    effectiveness: 0.85,
                });
                break;
            case 'computational':
            case 'algorithmic':
            case 'neural':
                recommendations.push({
                    technique: 'neuro_computational',
                    reasoning: 'Neural synthesis with computational optimization',
                    effectiveness: 0.92,
                });
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Parallel processing of multiple solution states',
                    effectiveness: 0.88,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Algorithmic decomposition to basic operations',
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
        // Build problem context for multi-factor scoring
        const problemContext = {
            category: problemCategory,
            complexity,
            hasTimeConstraints: constraints?.some(c => c.toLowerCase().includes('time') ||
                c.toLowerCase().includes('deadline') ||
                c.toLowerCase().includes('urgent')) ?? false,
            hasResourceConstraints: constraints?.some(c => c.toLowerCase().includes('resource') ||
                c.toLowerCase().includes('budget') ||
                c.toLowerCase().includes('limited')) ?? false,
            needsCollaboration: (constraints?.some(c => c.toLowerCase().includes('team') ||
                c.toLowerCase().includes('collaboration') ||
                c.toLowerCase().includes('stakeholder')) ?? false) ||
                problemCategory === 'organizational',
            preferredOutcome,
        };
        // Apply multi-factor scoring to all recommendations
        const scoredRecommendations = recommendations.map(rec => {
            const multiFactorScore = this.scorer.calculateScore(rec.technique, problemContext, rec.effectiveness // Use initial effectiveness as category score
            );
            return {
                ...rec,
                effectiveness: multiFactorScore, // Replace with multi-factor score
            };
        });
        // Sort by multi-factor score
        scoredRecommendations.sort((a, b) => b.effectiveness - a.effectiveness);
        // Validate techniques exist and enhance with additional info (with caching)
        const validatedRecommendations = scoredRecommendations
            .filter(rec => techniqueRegistry.isValidTechnique(rec.technique))
            .map(rec => {
            // Use cache for technique info (performance optimization)
            let info = this.techniqueInfoCache.get(rec.technique);
            if (!info) {
                info = techniqueRegistry.getTechniqueInfo(rec.technique);
                this.techniqueInfoCache.set(rec.technique, info);
            }
            // Get execution time estimate
            const timeEstimate = this.scorer.estimateExecutionTime(rec.technique);
            const timeLabel = timeEstimate === 'quick' ? '⚡' :
                timeEstimate === 'moderate' ? '⏱️' : '⏳';
            return {
                ...rec,
                // Enhance reasoning with step count and time estimate
                reasoning: `${rec.reasoning} (${info.totalSteps} steps ${timeLabel})`,
            };
        });
        // Get dynamic recommendation count based on complexity
        const limits = this.RECOMMENDATION_LIMITS[complexity] || this.RECOMMENDATION_LIMITS.medium;
        const maxRecommendations = parseInt(process.env.MAX_TECHNIQUE_RECOMMENDATIONS || String(limits.max));
        const baseRecommendationCount = Math.min(validatedRecommendations.length, maxRecommendations);
        // Get top recommendations based on dynamic limit
        const topRecommendations = validatedRecommendations.slice(0, baseRecommendationCount);
        // Early exit if wildcard not needed (performance optimization)
        if (Math.random() >= this.WILDCARD_PROBABILITY) {
            return topRecommendations;
        }
        // Add wildcard technique(s) to prevent pigeonholing
        const wildcardCount = limits.wildcard;
        const excludeTechniques = new Set(topRecommendations.map(r => r.technique));
        for (let i = 0; i < wildcardCount; i++) {
            const wildcardRecommendation = this.selectWildcardTechnique(excludeTechniques, techniqueRegistry);
            if (wildcardRecommendation) {
                topRecommendations.push({
                    ...wildcardRecommendation,
                    isWildcard: true,
                });
                excludeTechniques.add(wildcardRecommendation.technique);
            }
        }
        return topRecommendations;
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
                    if (['yes_and', 'collective_intel', 'cultural_integration'].includes(r.technique)) {
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
    /**
     * Select a wildcard technique to prevent algorithmic pigeonholing
     */
    selectWildcardTechnique(excludeTechniques, techniqueRegistry) {
        // All available techniques (all 28)
        const allTechniques = [
            'six_hats',
            'po',
            'random_entry',
            'scamper',
            'concept_extraction',
            'yes_and',
            'design_thinking',
            'triz',
            'neural_state',
            'temporal_work',
            'cultural_integration',
            'collective_intel',
            'disney_method',
            'nine_windows',
            'quantum_superposition',
            'temporal_creativity',
            'paradoxical_problem',
            'meta_learning',
            'biomimetic_path',
            'first_principles',
            'neuro_computational',
            'criteria_based_analysis',
            'linguistic_forensics',
            'competing_hypotheses',
            'reverse_benchmarking',
            'context_reframing',
            'perception_optimization',
            'anecdotal_signal',
        ];
        // Filter out already recommended techniques (O(1) lookup with Set)
        const availableTechniques = allTechniques.filter(t => !excludeTechniques.has(t) && techniqueRegistry.isValidTechnique(t));
        if (availableTechniques.length === 0) {
            return null;
        }
        // Randomly select a wildcard technique
        const wildcardTechnique = availableTechniques[Math.floor(Math.random() * availableTechniques.length)];
        // Use cache for technique info (performance optimization)
        let info = this.techniqueInfoCache.get(wildcardTechnique);
        if (!info) {
            info = techniqueRegistry.getTechniqueInfo(wildcardTechnique);
            this.techniqueInfoCache.set(wildcardTechnique, info);
        }
        // Generate wildcard reasoning
        const wildcardReasons = [
            'Consider this alternative approach for unexpected insights',
            'Wildcard technique to explore unconventional solutions',
            'Alternative perspective to prevent solution fixation',
            'Complementary technique for comprehensive exploration',
            'Unexpected angle to challenge assumptions',
        ];
        const reasoning = wildcardReasons[Math.floor(Math.random() * wildcardReasons.length)];
        return {
            technique: wildcardTechnique,
            reasoning: `${reasoning} (${info.totalSteps} steps)`,
            effectiveness: 0.65, // Moderate effectiveness as it's exploratory
        };
    }
}
//# sourceMappingURL=TechniqueRecommender.js.map