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
    const { category: problemCategory, evidenceBreadth } = problemAnalyzer.categorizeProblemWithEvidence(problem, context);
    // The recommendation set is sized by evidence breadth — how many categories
    // the problem genuinely implicates — not by the readability-complexity
    // level. Complexity rises with any appended sentence, so keying the set on
    // it changed the recommendations whenever a user added harmless context;
    // breadth only moves when a new topic clears the evidence bar.
    // `complexityAssessment` keeps its other jobs (warnings, sequential-thinking
    // suggestions, the response field) untouched.
    const recommendationTier = evidenceBreadth >= 3 ? 'high' : evidenceBreadth === 2 ? 'medium' : 'low';
    // Get technique recommendations. The primary persona's bias is passed in so
    // it is blended during scoring, before ranking and truncation — applying it
    // afterwards could only reorder survivors, letting a technique the persona
    // most favours be truncated away and never recovered.
    let recommendations = techniqueRecommender.recommendTechniques(problemCategory, effectivePreferredOutcome, constraints, recommendationTier, techniqueRegistry, resolvedPersonas[0]?.techniqueBias);
    // Humanistic quality coverage: ensure technique set collectively embodies
    // intelligence, courage, tenacity, curiosity, and justice
    const { recommendations: coverageAdjusted, coverage: qualityCoverage, adjusted: coverageWasAdjusted, } = HumanisticQualityCoverage.fillCoverageGaps(recommendations);
    if (coverageWasAdjusted) {
        recommendations = coverageAdjusted;
    }
    const finalQualityCoverage = coverageWasAdjusted
        ? qualityCoverage
        : HumanisticQualityCoverage.analyzeCoverage(recommendations.map(r => r.technique));
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