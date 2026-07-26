/**
 * Discovery Layer
 * Analyzes problems and recommends appropriate techniques
 */
import { ProblemAnalyzer } from './discovery/ProblemAnalyzer.js';
import { TechniqueRecommender } from './discovery/TechniqueRecommender.js';
import { WorkflowBuilder } from './discovery/WorkflowBuilder.js';
import { MemoryContextGenerator } from './discovery/MemoryContextGenerator.js';
import { PersonaResolver } from '../personas/PersonaResolver.js';
import { HumanisticQualityCoverage } from './discovery/HumanisticQualityCoverage.js';
// Create singleton instances for proper caching across requests
// This ensures the techniqueInfoCache and catalog cache are reused, improving performance
const techniqueRecommender = new TechniqueRecommender();
const personaResolver = new PersonaResolver();
export function discoverTechniques(input, techniqueRegistry, complexityAnalyzer, sessionManager) {
    const { problem, context, preferredOutcome, constraints, currentFlexibility, persona, personas } = input;
    // Resolve persona(s) if provided
    const resolvedPersonas = [];
    let effectivePreferredOutcome = preferredOutcome;
    if (persona) {
        const resolved = personaResolver.resolve(persona);
        if (resolved) {
            resolvedPersonas.push(resolved);
            // Persona's preferred outcome overrides if no explicit preference given
            if (!preferredOutcome) {
                effectivePreferredOutcome = resolved.preferredOutcome;
            }
        }
    }
    if (personas && Array.isArray(personas)) {
        for (const p of personas) {
            const resolved = personaResolver.resolve(p);
            if (resolved) {
                resolvedPersonas.push(resolved);
            }
        }
    }
    // Analyze problem complexity
    const fullText = `${problem} ${context || ''}`;
    const complexityAssessment = complexityAnalyzer.analyze(fullText);
    // Initialize analyzers
    const problemAnalyzer = new ProblemAnalyzer();
    const workflowBuilder = new WorkflowBuilder();
    const memoryContextGenerator = new MemoryContextGenerator();
    // Categorize the problem
    const problemCategory = problemAnalyzer.categorizeProblem(problem, context);
    // Get technique recommendations
    let recommendations = techniqueRecommender.recommendTechniques(problemCategory, effectivePreferredOutcome, constraints, complexityAssessment.level, techniqueRegistry);
    // Apply persona technique bias to boost/demote recommendations
    // 70/30 split ensures persona preferences influence but don't dominate recommendations
    const BASE_WEIGHT = 0.7;
    const PERSONA_BIAS_WEIGHT = 0.3;
    if (resolvedPersonas.length > 0) {
        const primaryPersona = resolvedPersonas[0];
        const bias = primaryPersona.techniqueBias;
        let biasApplied = false;
        recommendations = recommendations.map(rec => {
            const biasScore = bias[rec.technique];
            if (biasScore !== undefined) {
                biasApplied = true;
                const boosted = rec.effectiveness * BASE_WEIGHT + biasScore * PERSONA_BIAS_WEIGHT;
                return { ...rec, effectiveness: Math.min(1, boosted) };
            }
            return rec;
        });
        // Only re-sort if bias was actually applied
        if (biasApplied) {
            recommendations.sort((a, b) => b.effectiveness - a.effectiveness);
        }
    }
    // Humanistic quality coverage: ensure technique set collectively embodies
    // intelligence, courage, tenacity, curiosity, and justice
    const { recommendations: coverageAdjusted, coverage: qualityCoverage, adjusted: coverageWasAdjusted, } = HumanisticQualityCoverage.fillCoverageGaps(recommendations);
    if (coverageWasAdjusted) {
        recommendations = coverageAdjusted;
    }
    const finalQualityCoverage = coverageWasAdjusted
        ? qualityCoverage
        : HumanisticQualityCoverage.analyzeCoverage(recommendations.map(r => r.technique));
    // A persona's bias can only re-weight techniques discovery already surfaced.
    // If the persona's single most-defining technique is still absent, append it
    // so that invoking a persona makes its signature method reachable at all.
    //
    // It is scored through the SAME blend as every other recommendation, from a
    // deliberately conservative base (there is no problem-fit evidence for it),
    // so it is offered as an extra option and can never outrank a technique that
    // genuinely matched the problem. Runs after coverage analysis so the quality
    // coverage above is computed on the honestly-recommended set.
    if (resolvedPersonas.length > 0) {
        const primaryPersona = resolvedPersonas[0];
        const SIGNATURE_BIAS_THRESHOLD = 0.9;
        const SIGNATURE_BASE_EFFECTIVENESS = 0.5;
        const topBias = Object.entries(primaryPersona.techniqueBias).sort(([, a], [, b]) => b - a)[0];
        if (topBias) {
            const [signatureTechnique, signatureBias] = topBias;
            const alreadyPresent = recommendations.some(r => r.technique === signatureTechnique);
            if (signatureBias >= SIGNATURE_BIAS_THRESHOLD && !alreadyPresent) {
                // Appended, never re-sorted. Re-sorting here would hoist the quality
                // fillers added just above (flat 0.9, no problem-fit evidence) over
                // genuinely scored techniques. The append is last by construction
                // because its blended score is below anything that actually matched.
                recommendations = [
                    ...recommendations,
                    {
                        technique: signatureTechnique,
                        reasoning: `Signature technique for the ${primaryPersona.name} persona`,
                        effectiveness: SIGNATURE_BASE_EFFECTIVENESS * BASE_WEIGHT + signatureBias * PERSONA_BIAS_WEIGHT,
                    },
                ];
            }
        }
    }
    // Build integration suggestions
    let integrationSuggestions = workflowBuilder.buildIntegrationSuggestions(recommendations.map(r => r.technique), complexityAssessment.level);
    // Create workflow if multiple techniques recommended
    const workflow = recommendations.length > 1
        ? workflowBuilder.createWorkflow(recommendations.map(r => r.technique), problemCategory)
        : undefined;
    // Add warnings for high complexity
    const warnings = [];
    if (complexityAssessment.level === 'high') {
        warnings.push('High complexity detected - consider sequential thinking approach');
        warnings.push('Breaking down the problem into smaller parts may be beneficial');
    }
    // Warn about humanistic quality gaps
    if (!finalQualityCoverage.allCovered) {
        const gapNames = finalQualityCoverage.gaps.join(', ');
        if (recommendations.length < 3) {
            warnings.push(`Humanistic quality gaps detected (${gapNames}). Set is too small to auto-fill — consider adding techniques that cover these qualities.`);
        }
        else {
            warnings.push(`Humanistic quality gaps remain after adjustment: ${gapNames}. Consider supplementing with techniques strong in these areas.`);
        }
    }
    // Check for low flexibility
    if (currentFlexibility !== undefined && currentFlexibility < 0.4) {
        warnings.push(`Low flexibility detected (${currentFlexibility}). Option generation recommended to maintain creative freedom.`);
        // Add option generation recommendation to integration suggestions
        if (!integrationSuggestions) {
            integrationSuggestions = {};
        }
        integrationSuggestions.optionGeneration = {
            recommended: true,
            reason: 'Low flexibility score indicates limited creative options',
            strategies: ['Divergent thinking', 'Alternative framing', 'Constraint relaxation'],
        };
    }
    // Add suggestion to complexity assessment if high complexity
    const enhancedComplexityAssessment = {
        ...complexityAssessment,
        suggestion: complexityAssessment.level === 'high'
            ? 'Consider using sequential thinking to break down this complex problem'
            : undefined,
    };
    // Domain is always general - we don't pigeonhole into categories
    // No domain-specific warnings as we treat all problems generically
    // Store recommendations in session manager for later tracking
    if (sessionManager) {
        const recommendedTechniques = recommendations.map(r => r.technique);
        sessionManager.setLastRecommendations(problem, recommendedTechniques);
    }
    // Build persona context for output
    const personaContext = resolvedPersonas.length > 0
        ? {
            activePersonas: resolvedPersonas.map(p => ({
                id: p.id,
                name: p.name,
                tagline: p.tagline,
            })),
            isDebateMode: resolvedPersonas.length > 1,
        }
        : undefined;
    return {
        problem,
        problemCategory,
        recommendations,
        integrationSuggestions,
        workflow,
        warnings,
        contextAnalysis: {
            complexity: complexityAssessment.level,
            timeConstraint: problemAnalyzer.hasTimeConstraint(problem, constraints),
            collaborationNeeded: problemAnalyzer.needsCollaboration(problem, context),
            flexibilityScore: currentFlexibility,
        },
        complexityAssessment: enhancedComplexityAssessment,
        personaContext,
        qualityCoverage: finalQualityCoverage,
        problemAnalysis: {
            observation: memoryContextGenerator.generateObservation(problem, context, problemCategory, constraints),
            historicalRelevance: memoryContextGenerator.generateHistoricalRelevance(problemCategory, preferredOutcome),
            searchableFactors: memoryContextGenerator.generateSearchableFactors(problem, context, problemCategory, constraints),
        },
    };
}
//# sourceMappingURL=discovery.js.map