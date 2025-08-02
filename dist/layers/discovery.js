/**
 * Discovery Layer
 * Analyzes problems and recommends appropriate techniques
 */
export function discoverTechniques(input, techniqueRegistry, complexityAnalyzer) {
    const { problem, context, preferredOutcome, constraints, currentFlexibility } = input;
    // Analyze problem complexity
    const fullText = `${problem} ${context || ''}`;
    const complexityAssessment = complexityAnalyzer.analyze(fullText);
    // Categorize the problem
    const problemCategory = categorizeProblem(problem, context);
    // Get technique recommendations
    const recommendations = recommendTechniques(problemCategory, preferredOutcome, constraints, complexityAssessment.level, techniqueRegistry);
    // Build integration suggestions
    let integrationSuggestions = buildIntegrationSuggestions(recommendations.map(r => r.technique), complexityAssessment.level);
    // Create workflow if multiple techniques recommended
    const workflow = recommendations.length > 1
        ? createWorkflow(recommendations.map(r => r.technique), problemCategory)
        : undefined;
    // Add warnings for high complexity
    const warnings = [];
    if (complexityAssessment.level === 'high') {
        warnings.push('High complexity detected - consider sequential thinking approach');
        warnings.push('Breaking down the problem into smaller parts may be beneficial');
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
    return {
        problem,
        problemCategory,
        recommendations,
        integrationSuggestions,
        workflow,
        warnings,
        contextAnalysis: {
            complexity: complexityAssessment.level,
            timeConstraint: hasTimeConstraint(problem, constraints),
            collaborationNeeded: needsCollaboration(problem, context),
            flexibilityScore: currentFlexibility,
        },
        complexityAssessment: enhancedComplexityAssessment,
        problemAnalysis: {
            observation: generateObservation(problem, context, problemCategory, constraints),
            historicalRelevance: generateHistoricalRelevance(problemCategory, preferredOutcome),
            searchableFactors: generateSearchableFactors(problem, context, problemCategory, constraints),
        },
    };
}
function categorizeProblem(problem, context) {
    const fullText = `${problem} ${context || ''}`.toLowerCase();
    // Check for temporal first since it's more specific
    if (fullText.includes('time') ||
        fullText.includes('deadline') ||
        fullText.includes('schedule') ||
        fullText.includes('temporal') ||
        fullText.includes('timing') ||
        fullText.includes('calendar')) {
        return 'temporal';
    }
    // Check for cognitive/focus problems
    if (fullText.includes('focus') ||
        fullText.includes('cognitive') ||
        fullText.includes('attention') ||
        fullText.includes('mental') ||
        fullText.includes('brain') ||
        fullText.includes('productivity')) {
        return 'cognitive';
    }
    // Check for implementation/execution problems
    if (fullText.includes('implement') ||
        fullText.includes('execute') ||
        fullText.includes('deploy') ||
        fullText.includes('launch') ||
        fullText.includes('realize') ||
        fullText.includes('make it happen') ||
        fullText.includes('put into practice')) {
        return 'implementation';
    }
    // Check for system-level analysis problems
    if (fullText.includes('system') ||
        fullText.includes('ecosystem') ||
        fullText.includes('holistic') ||
        fullText.includes('comprehensive') ||
        fullText.includes('multi-level') ||
        fullText.includes('scale') ||
        fullText.includes('component')) {
        return 'systems';
    }
    // Check for organizational/cultural keywords before user-centered (to prioritize cross-cultural work)
    if (fullText.includes('team') ||
        fullText.includes('collaboration') ||
        fullText.includes('communication') ||
        fullText.includes('stakeholder') ||
        fullText.includes('collective') ||
        fullText.includes('consensus') ||
        fullText.includes('crowd') ||
        fullText.includes('together') ||
        fullText.includes('perspectives') ||
        fullText.includes('synthesize') ||
        fullText.includes('wisdom') ||
        fullText.includes('swarm') ||
        fullText.includes('bring') ||
        fullText.includes('multiple') ||
        fullText.includes('emergent') ||
        fullText.includes('global') ||
        fullText.includes('culture') ||
        fullText.includes('diverse') ||
        fullText.includes('inclusive') ||
        fullText.includes('multicultural')) {
        return 'organizational';
    }
    if (fullText.includes('user') ||
        fullText.includes('customer') ||
        fullText.includes('experience')) {
        return 'user-centered';
    }
    if (fullText.includes('technical') ||
        fullText.includes('system') ||
        fullText.includes('architecture') ||
        fullText.includes('energy') ||
        fullText.includes('machine') ||
        fullText.includes('motion') ||
        fullText.includes('physics') ||
        fullText.includes('engineering')) {
        return 'technical';
    }
    if (fullText.includes('creative') ||
        fullText.includes('innovative') ||
        fullText.includes('new')) {
        return 'creative';
    }
    if (fullText.includes('process') ||
        fullText.includes('workflow') ||
        fullText.includes('efficiency')) {
        return 'process';
    }
    if (fullText.includes('strategy') ||
        fullText.includes('business') ||
        fullText.includes('market')) {
        return 'strategic';
    }
    return 'general';
}
function recommendTechniques(problemCategory, preferredOutcome, constraints, complexity, techniqueRegistry) {
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
        adjustForPreferredOutcome(recommendations, preferredOutcome);
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
function adjustForPreferredOutcome(recommendations, outcome) {
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
                    reasoning: 'Builds collaborative solutions without criticism',
                    effectiveness: 0.9,
                });
            }
            break;
    }
}
function buildIntegrationSuggestions(techniques, complexity) {
    const suggestions = {};
    // Sequential suggestions for high complexity
    if (complexity === 'high' && techniques.length > 1) {
        suggestions.sequence = techniques;
    }
    // Parallel suggestions for independent aspects
    if (techniques.includes('six_hats') && techniques.includes('scamper')) {
        suggestions.parallel = ['six_hats', 'scamper'];
    }
    // Conditional suggestions
    if (techniques.includes('design_thinking')) {
        suggestions.conditional = [
            {
                condition: 'If user research reveals technical constraints',
                technique: 'triz',
            },
        ];
    }
    return suggestions;
}
function createWorkflow(techniques, problemCategory) {
    const phases = [];
    // Phase 1: Understanding
    if (techniques.includes('six_hats') || techniques.includes('design_thinking')) {
        const understandingFocus = problemCategory === 'user-centered'
            ? 'Empathize with users and understand their needs'
            : problemCategory === 'technical'
                ? 'Analyze technical constraints and requirements'
                : 'Explore problem space and gather insights';
        phases.push({
            name: 'Understanding',
            techniques: techniques.filter(t => ['six_hats', 'design_thinking'].includes(t)),
            focus: understandingFocus,
        });
    }
    // Phase 2: Generation
    const generativeTechniques = techniques.filter(t => ['po', 'random_entry', 'scamper', 'concept_extraction', 'yes_and'].includes(t));
    if (generativeTechniques.length > 0) {
        const generationFocus = problemCategory === 'innovative'
            ? 'Create breakthrough ideas and challenge assumptions'
            : problemCategory === 'optimization'
                ? 'Generate efficiency improvements and refinements'
                : 'Create diverse solution options';
        phases.push({
            name: 'Generation',
            techniques: generativeTechniques,
            focus: generationFocus,
        });
    }
    // Phase 3: Integration
    const integrativeTechniques = techniques.filter(t => ['triz', 'collective_intel', 'temporal_work'].includes(t));
    if (integrativeTechniques.length > 0) {
        phases.push({
            name: 'Integration',
            techniques: integrativeTechniques,
            focus: 'Synthesize and refine solutions',
        });
    }
    return { phases };
}
function hasTimeConstraint(problem, constraints) {
    const timeWords = ['deadline', 'urgent', 'asap', 'quickly', 'time-sensitive'];
    const problemHasTime = timeWords.some(word => problem.toLowerCase().includes(word));
    const constraintsHaveTime = constraints?.some(c => timeWords.some(word => c.toLowerCase().includes(word))) || false;
    return problemHasTime || constraintsHaveTime;
}
function needsCollaboration(problem, context) {
    const collabWords = ['team', 'stakeholder', 'collaboration', 'together', 'group'];
    const fullText = `${problem} ${context || ''}`.toLowerCase();
    return collabWords.some(word => fullText.includes(word));
}
/**
 * Generate observation about the problem for memory context
 */
function generateObservation(problem, context, category, constraints) {
    const constraintText = constraints && constraints.length > 0
        ? ` with ${constraints.length} constraint${constraints.length > 1 ? 's' : ''}`
        : '';
    const contextText = context ? ' in a specific context' : '';
    return `This ${category} challenge${contextText}${constraintText} focuses on: ${problem}`;
}
/**
 * Generate historical relevance for similar problems
 */
function generateHistoricalRelevance(category, preferredOutcome) {
    const outcomeMap = {
        innovative: 'breakthrough solutions through divergent thinking',
        systematic: 'structured approaches and methodical analysis',
        'risk-aware': 'balanced solutions considering potential pitfalls',
        collaborative: 'collective intelligence and diverse perspectives',
        analytical: 'deep understanding and root cause analysis',
    };
    const outcomeText = preferredOutcome && outcomeMap[preferredOutcome]
        ? outcomeMap[preferredOutcome]
        : 'creative problem-solving';
    const categoryInsights = {
        'user-centered': `User-centered challenges often benefit from ${outcomeText}, especially when combining empathy with systematic exploration`,
        technical: `Technical problems frequently yield to ${outcomeText} when contradictions are identified and resolved systematically`,
        creative: `Creative challenges thrive on ${outcomeText}, particularly when conventional boundaries are questioned`,
        process: `Process improvements emerge from ${outcomeText}, often revealing hidden inefficiencies`,
        organizational: `Organizational challenges require ${outcomeText} to align diverse stakeholder perspectives`,
        temporal: `Time-based problems benefit from ${outcomeText} by revealing hidden scheduling flexibilities`,
        cognitive: `Cognitive challenges improve through ${outcomeText}, optimizing mental resources`,
        strategic: `Strategic problems demand ${outcomeText} to navigate complex market dynamics`,
        general: `General problems can be approached through ${outcomeText} to uncover unexpected solutions`,
    };
    return categoryInsights[category] || categoryInsights.general;
}
/**
 * Generate searchable factors for memory indexing
 */
function generateSearchableFactors(problem, context, category, constraints) {
    const factors = [`${category} problem`];
    // Add key problem terms
    const problemWords = problem
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'that'].includes(word));
    factors.push(...problemWords.slice(0, 3).map(w => `${w} challenge`));
    // Add constraint types
    if (constraints && constraints.length > 0) {
        constraints.forEach(constraint => {
            if (constraint.toLowerCase().includes('time'))
                factors.push('time constraint');
            if (constraint.toLowerCase().includes('budget'))
                factors.push('budget constraint');
            if (constraint.toLowerCase().includes('resource'))
                factors.push('resource constraint');
            if (constraint.toLowerCase().includes('technical'))
                factors.push('technical constraint');
        });
    }
    // Add context indicators
    if (context) {
        if (context.toLowerCase().includes('team'))
            factors.push('team context');
        if (context.toLowerCase().includes('user'))
            factors.push('user context');
        if (context.toLowerCase().includes('market'))
            factors.push('market context');
    }
    // Add complexity level
    factors.push(`${category} complexity`);
    return [...new Set(factors)]; // Remove duplicates
}
//# sourceMappingURL=discovery.js.map