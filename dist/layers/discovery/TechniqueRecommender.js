/**
 * TechniqueRecommender - Handles technique recommendation logic
 * Extracted from discoverTechniques to improve maintainability
 * Enhanced with multi-factor scoring system for intelligent recommendations
 */
import { ALL_LATERAL_TECHNIQUES } from '../../types/index.js';
import { TechniqueScorer } from './TechniqueScorer.js';
/**
 * How well a technique fits the problem category recommending it.
 *
 * ORDINAL levels, not measurements. Nothing benchmarks whether `triz` beats
 * `scamper` on technical problems; this is one practitioner's judgement about
 * which tool to reach for first.
 *
 * The scale exists because these were hand-written decimals spanning SIXTEEN
 * distinct values — 0.82, 0.83, 0.84, 0.85, 0.86, 0.88, 0.92, 0.98 among them.
 * There is no basis on which 0.83 differs from 0.84, and a dead
 * EFFECTIVENESS_SCORES table sat in this class unused while every call site
 * wrote its own decimal, which is how they accumulated.
 *
 * Six tiers, chosen to sit ON the clusters the author actually used so that
 * naming them preserves the intended ordering rather than flattening it. An
 * earlier four-tier version moved values by up to 0.08 and changed the top
 * recommendation in 46 of 396 scenarios — collapsing further destroys real
 * signal, notably the category-defining entries.
 *
 * Change a technique's standing by moving it a TIER, never by inventing a
 * decimal; `ordinalScale.test.ts` fails the build otherwise.
 */
export const TECHNIQUE_FIT = {
    /** The technique this problem category exists for */
    DEFINING: 0.95,
    /** A leading choice for this category */
    PRIMARY: 0.9,
    /** Strongly applicable */
    STRONG: 0.85,
    /** Clearly applicable, not a headline choice */
    SOLID: 0.8,
    /** A useful secondary angle */
    MODERATE: 0.75,
    /** Occasionally relevant; included for breadth */
    WEAK: 0.7,
};
/** Bound provenance fields to 3 decimals so response size stays predictable. */
function round3(n) {
    return Math.round(n * 1000) / 1000;
}
/**
 * Combine crux and persona bias maps by per-technique MAX before the 70/30
 * blend. Max, not product: two agreeing sub-1 signals must not produce weaker
 * steering than either alone (0.8 × 0.8 = 0.64 — the first draft's mistake,
 * caught in vetting).
 */
function combineBiasMaps(cruxBias, personaBias) {
    if (!cruxBias)
        return personaBias;
    if (!personaBias)
        return cruxBias;
    const combined = { ...personaBias };
    for (const [technique, value] of Object.entries(cruxBias)) {
        combined[technique] = Math.max(combined[technique] ?? 0, value);
    }
    return combined;
}
export class TechniqueRecommender {
    // Wildcard inclusion probability (20% chance)
    WILDCARD_PROBABILITY = parseFloat(process.env.WILDCARD_PROBABILITY || '0.20');
    // Dynamic recommendation limits based on complexity
    RECOMMENDATION_LIMITS = {
        low: { min: 2, max: 3, wildcard: 1 },
        medium: { min: 3, max: 5, wildcard: 1 },
        high: { min: 5, max: 7, wildcard: 2 },
    };
    // An unused EFFECTIVENESS_SCORES table sat here with eight levels. It was
    // declared and never referenced once — every call site wrote a raw decimal
    // instead, which is how sixteen distinct values accumulated. Superseded by
    // TECHNIQUE_FIT above, which is used and is test-enforced.
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
    /**
     * Weighting used when a persona is active. The 70/30 split lets a persona's
     * preferences influence ranking without letting them dominate problem fit.
     *
     * The bias is applied during scoring, BEFORE sorting and truncation. Applying
     * it afterwards would only reorder the survivors, so a technique the persona
     * most favours could be truncated away and never recovered — which is exactly
     * what happened when preferredOutcome boosted competing techniques past it.
     */
    PERSONA_BASE_WEIGHT = 0.7;
    PERSONA_BIAS_WEIGHT = 0.3;
    recommendTechniques(problemCategory, preferredOutcome, constraints, 
    // The recommendation tier: sizes the set (RECOMMENDATION_LIMITS) and feeds
    // multi-factor scoring. Discovery derives it from evidence breadth — how
    // many categories the problem genuinely implicates — NOT from the
    // readability-complexity level, which rises with any appended sentence and
    // used to change the set whenever a user added harmless context.
    complexity, techniqueRegistry, techniqueBias, cruxBias) {
        const recommendations = [];
        // Category-based recommendations
        switch (problemCategory) {
            case 'user-centered':
                recommendations.push({
                    technique: 'design_thinking',
                    reasoning: 'Human-centered approach ideal for user experience challenges',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Explores user needs from multiple perspectives',
                    effectiveness: TECHNIQUE_FIT.WEAK,
                });
                break;
            case 'technical':
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'Systematic innovation for technical contradictions',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Maintains multiple contradictory technical solutions until optimal conditions emerge',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Deconstruct technical problems to fundamental components',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'biomimetic_path',
                    reasoning: 'Nature-inspired solutions to technical challenges',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Structured modifications for technical improvements',
                    effectiveness: TECHNIQUE_FIT.MODERATE,
                });
                break;
            case 'creative':
                recommendations.push({
                    technique: 'random_entry',
                    reasoning: 'Breaks conventional thinking with random stimuli',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'po',
                    reasoning: 'Provocations challenge creative boundaries',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'perception_optimization',
                    reasoning: 'Design subjective experience for creative value',
                    effectiveness: TECHNIQUE_FIT.MODERATE,
                });
                recommendations.push({
                    technique: 'anecdotal_signal',
                    reasoning: 'Draw inspiration from outliers and edge cases',
                    effectiveness: TECHNIQUE_FIT.WEAK,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Change environmental context to boost creativity',
                    effectiveness: TECHNIQUE_FIT.WEAK,
                });
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Explores multiple creative possibilities simultaneously without premature commitment',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Synthesizes creative solutions from diverse cultural perspectives',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                break;
            case 'process':
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Systematic process improvement through modifications',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Rebuild process from fundamental requirements',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Optimize process timing and workflow management',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'nine_windows',
                    // MODERATE, not the arithmetically-nearest SOLID: authored at 0.78,
                    // deliberately below temporal_work's 0.80. Snapping up tied the two
                    // and let the systematic multiplier carry nine_windows past scamper,
                    // which this arm ranks first. Tier chosen to preserve that ordering.
                    reasoning: 'Systematic process analysis across time and scale',
                    effectiveness: TECHNIQUE_FIT.MODERATE,
                });
                recommendations.push({
                    technique: 'concept_extraction',
                    reasoning: 'Learn from successful process examples',
                    effectiveness: TECHNIQUE_FIT.WEAK,
                });
                break;
            case 'organizational':
                recommendations.push({
                    technique: 'yes_and',
                    reasoning: 'Builds collaborative solutions without criticism',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'collective_intel',
                    reasoning: 'Harnesses team wisdom and diverse perspectives',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Reshape organizational environment for behavioral change',
                    effectiveness: TECHNIQUE_FIT.MODERATE,
                });
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Integrates diverse cultural frameworks respectfully',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'cultural':
            case 'cultural_integration':
            case 'multicultural':
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Primary technique for orchestrating cross-cultural creative synthesis',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'collective_intel',
                    reasoning: 'Foundational collective intelligence and diverse wisdom integration',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Integrates time-based cultural evolution and adaptability',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'paradoxical':
                recommendations.push({
                    technique: 'paradoxical_problem',
                    reasoning: 'Transcends contradictions through path-dependent analysis',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Maintains contradictory states until optimal collapse',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'Systematic contradiction resolution',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'biological':
            case 'biomimetic':
            case 'evolutionary':
            case 'adaptive':
                recommendations.push({
                    technique: 'biomimetic_path',
                    reasoning: 'Applies evolutionary strategies and biological patterns to innovation',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'collective_intel',
                    reasoning: 'Swarm intelligence and collective behavior patterns',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'meta_learning',
                    reasoning: 'Adaptive learning from patterns',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                break;
            case 'temporal':
                recommendations.push({
                    technique: 'temporal_creativity',
                    reasoning: 'Advanced temporal thinking with path memory integration',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'temporal_work',
                    reasoning: 'Time management and kairos-chronos integration',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'scamper',
                    reasoning: 'Modify and adapt temporal constraints',
                    effectiveness: TECHNIQUE_FIT.WEAK,
                });
                break;
            case 'cognitive':
                recommendations.push({
                    technique: 'neural_state',
                    reasoning: 'Optimizes brain network switching for enhanced cognitive performance',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Structured thinking to manage cognitive load',
                    effectiveness: TECHNIQUE_FIT.WEAK,
                });
                recommendations.push({
                    technique: 'cognitive_bias_audit',
                    reasoning: "Run Munger's checklist of misjudgment tendencies against the decision",
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'latticework',
                    reasoning: 'Apply multiple disciplinary lenses instead of one habitual model',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'strategic':
                recommendations.push({
                    technique: 'reverse_benchmarking',
                    reasoning: 'Find competitive advantage where all competitors fail',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'anecdotal_signal',
                    reasoning: 'Detect early strategic changes from outlier signals',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'perception_optimization',
                    reasoning: 'Optimize strategic value perception in market',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Reframe competitive environment for strategic advantage',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Build strategy from fundamental market truths',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Comprehensive strategic analysis from all angles',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                break;
            case 'implementation':
                recommendations.push({
                    technique: 'disney_method',
                    reasoning: 'Sequential approach from vision to practical implementation',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'design_thinking',
                    reasoning: 'Prototype and test implementation approaches',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                break;
            case 'systems':
                recommendations.push({
                    technique: 'nine_windows',
                    reasoning: 'Systematic analysis across time and system levels',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'System contradictions and evolution patterns',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Analyze system from fundamental components',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'meta_learning',
                    reasoning: 'Learn from system patterns and behaviors',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'latticework',
                    reasoning: 'Cross-disciplinary lenses reveal system dynamics one model would miss',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'validation':
            case 'verification':
            case 'truth':
                recommendations.push({
                    technique: 'criteria_based_analysis',
                    // DEFINING, not the arithmetically-nearest PRIMARY: authored at 0.92,
                    // deliberately above competing_hypotheses' 0.88. Both snapping to
                    // PRIMARY tied them and let the innovative multiplier break the tie
                    // the wrong way. Promoting rather than demoting keeps the full
                    // authored order intact (0.92 > 0.88 > 0.85); demoting the runner-up
                    // would instead tie it with linguistic_forensics.
                    reasoning: 'Systematic truth verification through established criteria',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'linguistic_forensics',
                    reasoning: 'Deep analysis of communication patterns for authenticity',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'competing_hypotheses',
                    reasoning: 'Prevent confirmation bias through systematic comparison',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                break;
            case 'decision':
            case 'multi-factor':
            case 'uncertainty':
                recommendations.push({
                    technique: 'competing_hypotheses',
                    reasoning: 'Bayesian approach to handle multiple competing explanations',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'criteria_based_analysis',
                    reasoning: 'Structured assessment with confidence scoring',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Consider all perspectives before deciding',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'cognitive_bias_audit',
                    reasoning: 'Audit your own psychology for biases before committing to a decision',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'latticework',
                    reasoning: 'Weigh the decision through several disciplinary lenses before committing',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            // Deliberately three entries, no more. Low-complexity problems get three
            // recommendation slots, so a fourth would be invisible in exactly the way
            // latticework is invisible in the crowded `decision` group above.
            case 'retention':
                recommendations.push({
                    technique: 'keeper_test',
                    reasoning: 'Re-decide the incumbent: would you take it on today, at the current price?',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'cognitive_bias_audit',
                    reasoning: 'Surface the endowment, sunk-cost and status-quo pull toward keeping it',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'nine_windows',
                    reasoning: 'Its past row reconstructs why the thing exists before you judge it',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            // Three entries, for the reason given above the retention group: low
            // complexity truncates to three slots, and a fourth would be invisible.
            // Declined deliberately: registering this technique in `implementation`
            // as well. That group has room at two entries and red-teaming a launch
            // plan is on point, but it is unreachable from adversarial phrasings
            // (it needs intent `request_action` plus an implement/deploy/launch
            // verb), so the only effect would be to reshuffle existing rankings.
            case 'adversarial':
                recommendations.push({
                    technique: 'steelman_red_team',
                    reasoning: 'Build the opposing case until its holders would sign it, then attack the plan through it',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'competing_hypotheses',
                    reasoning: 'Generate the alternatives the plan assumes away, and price the deception case',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'cognitive_bias_audit',
                    reasoning: 'Name the tendencies that made the plan feel safe, and that will resist the findings',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'communication':
            case 'stakeholder':
            case 'understanding':
                recommendations.push({
                    technique: 'linguistic_forensics',
                    reasoning: 'Reveal hidden patterns and motivations in communication',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Change decision environments to influence stakeholder behavior',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'perception_optimization',
                    reasoning: 'Optimize message perception and subjective value',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'design_thinking',
                    reasoning: 'Empathize with stakeholders to understand needs',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'cultural_integration',
                    reasoning: 'Bridge communication gaps across cultural differences',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                break;
            case 'behavioral':
            case 'psychology':
            case 'perception':
                recommendations.push({
                    technique: 'perception_optimization',
                    reasoning: 'Optimize for subjective experience over objective metrics',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'context_reframing',
                    reasoning: 'Change decision environments to influence behavior',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'anecdotal_signal',
                    reasoning: 'Detect behavioral patterns from individual outliers',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'reverse_benchmarking',
                    reasoning: 'Find opportunities in anti-mimetic behavior',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                recommendations.push({
                    technique: 'cognitive_bias_audit',
                    reasoning: 'Detect lollapalooza confluences of psychological tendencies',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                break;
            case 'fundamental':
            case 'first-principles':
            case 'basics':
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Deconstruct to absolute fundamentals and rebuild',
                    effectiveness: TECHNIQUE_FIT.DEFINING,
                });
                recommendations.push({
                    technique: 'triz',
                    reasoning: 'Apply fundamental innovation principles',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                recommendations.push({
                    technique: 'concept_extraction',
                    reasoning: 'Extract core patterns from successful examples',
                    effectiveness: TECHNIQUE_FIT.SOLID,
                });
                break;
            case 'learning':
            case 'knowledge':
            case 'synthesis':
                recommendations.push({
                    technique: 'meta_learning',
                    reasoning: 'Synthesize patterns across multiple learning experiences',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'biomimetic_path',
                    reasoning: 'Apply evolutionary and biological learning strategies',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'temporal_creativity',
                    reasoning: 'Learn from historical patterns and future projections',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            case 'computational':
            case 'algorithmic':
            case 'neural':
                recommendations.push({
                    technique: 'neuro_computational',
                    reasoning: 'Neural synthesis with computational optimization',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'quantum_superposition',
                    reasoning: 'Parallel processing of multiple solution states',
                    effectiveness: TECHNIQUE_FIT.PRIMARY,
                });
                recommendations.push({
                    technique: 'first_principles',
                    reasoning: 'Algorithmic decomposition to basic operations',
                    effectiveness: TECHNIQUE_FIT.STRONG,
                });
                break;
            default:
                recommendations.push({
                    technique: 'six_hats',
                    reasoning: 'Versatile technique for comprehensive exploration',
                    effectiveness: TECHNIQUE_FIT.SOLID,
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
                    effectiveness: TECHNIQUE_FIT.WEAK,
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
                c.toLowerCase().includes('stakeholder')) ??
                false) ||
                problemCategory === 'organizational',
            preferredOutcome,
        };
        // A declared crux INJECTS its techniques as candidates before scoring.
        // Bias alone cannot do this — it only rescales what the category switch
        // already produced, and the point of a crux is to surface techniques the
        // keyword categorization missed.
        if (cruxBias) {
            const present = new Set(recommendations.map(r => r.technique));
            for (const [technique, fit] of Object.entries(cruxBias)) {
                if (!present.has(technique)) {
                    recommendations.push({
                        technique,
                        reasoning: 'Matches the declared crux — surfaced ahead of keyword categorization',
                        effectiveness: fit,
                        isCruxInjected: true,
                    });
                }
            }
        }
        // Crux and persona biases combine by per-technique MAX (two agreeing
        // sub-1 signals must not multiply into weaker steering than either alone),
        // then the single 70/30 blend applies.
        const blendBias = combineBiasMaps(cruxBias, techniqueBias);
        // Apply multi-factor scoring to all recommendations, blending in persona
        // bias here so it participates in ranking rather than merely reordering
        // whatever survived truncation.
        const scoredRecommendations = recommendations.map(rec => {
            const multiFactorScore = this.scorer.calculateScore(rec.technique, problemContext, rec.effectiveness // Use initial effectiveness as category score
            );
            const biasScore = blendBias?.[rec.technique];
            const effectiveness = biasScore === undefined
                ? multiFactorScore
                : Math.min(1, multiFactorScore * this.PERSONA_BASE_WEIGHT + biasScore * this.PERSONA_BIAS_WEIGHT);
            // Provenance for the caller: the four factors behind the blend, rounded
            // to 3 decimals so response size stays bounded. Quality fillers appended
            // later never pass through here — their absence of a breakdown is honest.
            const breakdown = this.scorer.getScoreBreakdown(rec.technique, problemContext, rec.effectiveness);
            return {
                ...rec,
                effectiveness,
                scoreBreakdown: {
                    categoryFit: round3(breakdown.categoryFit),
                    complexityMatch: round3(breakdown.complexityMatch),
                    constraintCompatibility: round3(breakdown.constraintCompatibility),
                    outcomeAlignment: round3(breakdown.outcomeAlignment),
                },
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
            const timeLabel = timeEstimate === 'quick' ? '⚡' : timeEstimate === 'moderate' ? '⏱️' : '⏳';
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
        // The wildcard draw is deterministic, seeded from what was chosen: the
        // same category and set always draw the same wildcard, or none. It used
        // to be Math.random(), which made discover_techniques non-deterministic —
        // the same problem got different recommendation sets on one call in five,
        // untestable and indistinguishable from a routing change. Seeding from
        // the chosen set keeps the anti-pigeonhole variety ACROSS problems while
        // making every individual problem's answer repeatable.
        const wildcardSeed = `${problemCategory}|${topRecommendations
            .map(r => r.technique)
            .sort()
            .join(',')}`;
        if (this.seededUnit(wildcardSeed) >= this.WILDCARD_PROBABILITY) {
            return topRecommendations;
        }
        // Add wildcard technique(s) to prevent pigeonholing
        const wildcardCount = limits.wildcard;
        const excludeTechniques = new Set(topRecommendations.map(r => r.technique));
        for (let i = 0; i < wildcardCount; i++) {
            const wildcardRecommendation = this.selectWildcardTechnique(excludeTechniques, techniqueRegistry, `${wildcardSeed}#${i}`);
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
     * FNV-1a hash of a string, folded to a unit interval [0, 1). The wildcard
     * path needs repeatable draws, not cryptographic ones.
     */
    seededUnit(seed) {
        let hash = 0x811c9dc5;
        for (let i = 0; i < seed.length; i++) {
            hash ^= seed.charCodeAt(i);
            hash = Math.imul(hash, 0x01000193);
        }
        return (hash >>> 0) / 0x100000000;
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
                        effectiveness: TECHNIQUE_FIT.SOLID,
                    });
                }
                break;
            case 'risk-aware':
                // Ensure six_hats is included for black hat thinking
                if (!recommendations.find(r => r.technique === 'six_hats')) {
                    recommendations.push({
                        technique: 'six_hats',
                        reasoning: 'Black hat provides systematic risk analysis',
                        effectiveness: TECHNIQUE_FIT.STRONG,
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
                        effectiveness: TECHNIQUE_FIT.SOLID,
                    });
                }
                if (!recommendations.find(r => r.technique === 'collective_intel')) {
                    recommendations.push({
                        technique: 'collective_intel',
                        reasoning: 'Leverages group wisdom for better outcomes',
                        effectiveness: TECHNIQUE_FIT.SOLID,
                    });
                }
                break;
        }
    }
    /**
     * Select a wildcard technique to prevent algorithmic pigeonholing
     */
    selectWildcardTechnique(excludeTechniques, techniqueRegistry, seed) {
        // Use the single source of truth for all techniques
        // This ensures we always include all available techniques
        const availableTechniques = ALL_LATERAL_TECHNIQUES.filter(t => !excludeTechniques.has(t) && techniqueRegistry.isValidTechnique(t));
        if (availableTechniques.length === 0) {
            return null;
        }
        // Seeded selection — repeatable for a given problem, varied across them.
        const wildcardTechnique = availableTechniques[Math.floor(this.seededUnit(`${seed}|pick`) * availableTechniques.length)];
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
        const reasoning = wildcardReasons[Math.floor(this.seededUnit(`${seed}|reason`) * wildcardReasons.length)];
        return {
            technique: wildcardTechnique,
            reasoning: `${reasoning} (${info.totalSteps} steps)`,
            effectiveness: TECHNIQUE_FIT.WEAK, // Moderate effectiveness as it's exploratory
        };
    }
}
//# sourceMappingURL=TechniqueRecommender.js.map