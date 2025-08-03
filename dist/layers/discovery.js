/**
 * Discovery Layer
 * Analyzes problems and recommends appropriate techniques
 */
import { ProblemAnalyzer } from './discovery/ProblemAnalyzer.js';
import { TechniqueRecommender } from './discovery/TechniqueRecommender.js';
import { WorkflowBuilder } from './discovery/WorkflowBuilder.js';
import { MemoryContextGenerator } from './discovery/MemoryContextGenerator.js';
import { ParallelismDetector } from './discovery/ParallelismDetector.js';
import { ParallelismValidator } from './discovery/ParallelismValidator.js';
import { ExecutionModeController } from './discovery/ExecutionModeController.js';
export function discoverTechniques(input, techniqueRegistry, complexityAnalyzer) {
    const { problem, context, preferredOutcome, constraints, currentFlexibility } = input;
    // Analyze problem complexity
    const fullText = `${problem} ${context || ''}`;
    const complexityAssessment = complexityAnalyzer.analyze(fullText);
    // Initialize analyzers
    const problemAnalyzer = new ProblemAnalyzer();
    const techniqueRecommender = new TechniqueRecommender();
    const workflowBuilder = new WorkflowBuilder();
    const memoryContextGenerator = new MemoryContextGenerator();
    // Initialize parallelism components
    const parallelismDetector = new ParallelismDetector();
    const parallelismValidator = new ParallelismValidator();
    const executionModeController = new ExecutionModeController(parallelismDetector, parallelismValidator);
    // Categorize the problem
    const problemCategory = problemAnalyzer.categorizeProblem(problem, context);
    // Get technique recommendations
    const recommendations = techniqueRecommender.recommendTechniques(problemCategory, preferredOutcome, constraints, complexityAssessment.level, techniqueRegistry);
    // Determine execution mode
    const executionDecision = executionModeController.determineExecutionMode(input, recommendations.map(r => r.technique));
    // Get detailed execution mode analysis (not used in output currently)
    const _executionModeAnalysis = executionModeController.analyzeExecutionMode(input, recommendations.map(r => r.technique));
    // Build integration suggestions
    let integrationSuggestions = workflowBuilder.buildIntegrationSuggestions(recommendations.map(r => r.technique), complexityAssessment.level);
    // Update integration suggestions based on execution mode
    if (executionDecision.mode === 'parallel') {
        if (!integrationSuggestions) {
            integrationSuggestions = {};
        }
        integrationSuggestions.parallel = recommendations.map(r => r.technique);
    }
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
    // Add execution mode warnings
    if (executionDecision.warnings) {
        warnings.push(...executionDecision.warnings);
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
            timeConstraint: problemAnalyzer.hasTimeConstraint(problem, constraints),
            collaborationNeeded: problemAnalyzer.needsCollaboration(problem, context),
            flexibilityScore: currentFlexibility,
        },
        complexityAssessment: enhancedComplexityAssessment,
        problemAnalysis: {
            observation: memoryContextGenerator.generateObservation(problem, context, problemCategory, constraints),
            historicalRelevance: memoryContextGenerator.generateHistoricalRelevance(problemCategory, preferredOutcome),
            searchableFactors: memoryContextGenerator.generateSearchableFactors(problem, context, problemCategory, constraints),
        },
    };
}
//# sourceMappingURL=discovery.js.map