/**
 * WorkflowBuilder - Handles workflow creation and integration suggestions
 * Extracted from discoverTechniques to improve maintainability
 */
export class WorkflowBuilder {
    /**
     * Build integration suggestions for multiple techniques
     */
    buildIntegrationSuggestions(techniques, complexity) {
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
    /**
     * Create a phased workflow for multiple techniques
     */
    createWorkflow(techniques, problemCategory) {
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
        // Phase 4: everything the three lists above do not name. Twenty-two of the
        // thirty-two techniques are in none of them, so a recommendation such as
        // temporal_creativity or steelman_red_team used to vanish from the
        // workflow while the same response recommended it (#417). Order within
        // the phase is the recommendation order.
        const bucketed = new Set(phases.flatMap(p => p.techniques));
        const specialized = techniques.filter(t => !bucketed.has(t));
        if (specialized.length > 0) {
            phases.push({
                name: 'Specialized',
                techniques: specialized,
                focus: `Apply the techniques recommended for this ${problemCategory} problem`,
            });
        }
        return { phases };
    }
}
//# sourceMappingURL=WorkflowBuilder.js.map