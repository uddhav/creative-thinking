/**
 * Synthesis Prompt Generator
 * Generates prompts to guide LLM synthesis of parallel results
 */
import { MAX_PROMPT_LENGTH } from './constants.js';
export class SynthesisPromptGenerator {
    // Helper to truncate prompts to size limit
    truncatePrompt(prompt) {
        if (prompt.length <= MAX_PROMPT_LENGTH) {
            return prompt;
        }
        // Truncate with ellipsis
        return prompt.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
    }
    generateSynthesisPrompts(structuredResults, problem, strategy) {
        const prompts = [];
        // Core synthesis prompt
        prompts.push(this.createCoreSynthesisPrompt(structuredResults, problem));
        // Strategy-specific prompts
        switch (strategy) {
            case 'comprehensive':
                prompts.push(...this.createComprehensivePrompts(structuredResults));
                break;
            case 'focused':
                prompts.push(...this.createFocusedPrompts(structuredResults));
                break;
            case 'action_oriented':
                prompts.push(...this.createActionOrientedPrompts(structuredResults));
                break;
            case 'risk_aware':
                prompts.push(...this.createRiskAwarePrompts(structuredResults));
                break;
        }
        // Optional prompts based on results
        if (this.hasConflicts(structuredResults)) {
            prompts.push(this.createConflictResolutionPrompt(structuredResults));
        }
        if (this.hasHighComplexity(structuredResults)) {
            prompts.push(this.createComplexityManagementPrompt(structuredResults));
        }
        if (this.hasInnovativeIdeas(structuredResults)) {
            prompts.push(this.createInnovationRefinementPrompt(structuredResults));
        }
        return prompts;
    }
    createCoreSynthesisPrompt(results, problem) {
        const techniqueCount = this.getTechniqueCount(results);
        const totalIdeas = this.getTotalIdeas(results);
        const techniques = this.getTechniqueNames(results);
        const promptText = `You have received results from ${techniqueCount} parallel creative thinking techniques exploring: "${problem}"

The techniques used were: ${techniques.join(', ')}

Total ideas generated: ${totalIdeas}

Please synthesize these results by:
1. Identifying the most promising ideas across all techniques
2. Finding synergies and complementary insights
3. Resolving any conflicts or contradictions
4. Creating actionable recommendations

Consider using sequential thinking or other tools if deeper analysis would be beneficial.`;
        return {
            id: 'core_synthesis',
            priority: 'high',
            prompt: this.truncatePrompt(promptText),
            context: {
                totalIdeas,
                techniqueCount,
                techniques,
                resultFormat: results.type,
            },
            suggestedApproach: this.suggestSynthesisApproach(results),
        };
    }
    createComprehensivePrompts(results) {
        const techniqueCount = results.type === 'hierarchical'
            ? results.summary.techniqueCount
            : results.type === 'comparative'
                ? results.dimensions.length
                : 0;
        return [
            {
                id: 'deep_analysis',
                priority: 'medium',
                prompt: `Perform a deep analysis of the ${techniqueCount} parallel technique results:
1. Map relationships between ideas from different techniques
2. Identify cause-effect chains across insights
3. Discover hidden assumptions in each approach
4. Evaluate long-term implications of combined solutions`,
                focusAreas: ['relationships', 'causality', 'assumptions', 'implications'],
            },
            {
                id: 'stakeholder_perspectives',
                priority: 'medium',
                prompt: `Analyze how different stakeholders would view the synthesized solutions:
- End users/customers
- Implementation team
- Business leadership
- External partners
Consider acceptability, feasibility, and value for each group.`,
                focusAreas: ['stakeholders', 'feasibility', 'value'],
            },
            {
                id: 'integration_strategy',
                priority: 'low',
                prompt: `Develop an integration strategy that combines insights from all techniques:
- Which ideas reinforce each other?
- What is the optimal sequence for implementation?
- How can we maintain flexibility while pursuing multiple approaches?`,
                focusAreas: ['integration', 'sequencing', 'flexibility'],
            },
        ];
    }
    createFocusedPrompts(results) {
        const topThemes = this.extractTopThemes(results);
        return [
            {
                id: 'focused_synthesis',
                priority: 'high',
                prompt: `Focus your synthesis on the most prominent themes that emerged:
${topThemes.map((theme, i) => `${i + 1}. ${theme}`).join('\n')}

For each theme:
- Identify the best idea from any technique
- Explain why it stands out
- Suggest immediate next steps`,
                focusAreas: topThemes,
                context: { topThemes },
            },
            {
                id: 'quick_wins',
                priority: 'medium',
                prompt: `Identify 3-5 "quick wins" from the parallel exploration:
- Low effort, high impact ideas
- No significant dependencies
- Can be implemented within 2 weeks
- Measurable outcomes`,
                focusAreas: ['quick_wins', 'immediate_impact'],
            },
        ];
    }
    createActionOrientedPrompts(results) {
        const ideaCount = results.type === 'hierarchical'
            ? results.summary.totalIdeas
            : results.type === 'flat'
                ? results.allIdeas.length
                : 0;
        return [
            {
                id: 'immediate_actions',
                priority: 'high',
                prompt: `Based on ${ideaCount} ideas from the parallel exploration, what are the top 3-5 immediate actions that should be taken? 

Consider:
- Quick wins identified across techniques
- Low-risk, high-impact opportunities
- Prerequisites for larger initiatives
- Resource availability

Format each action with:
- Clear description
- Expected outcome
- Timeline
- Success metrics`,
                focusAreas: ['immediate_actions', 'quick_wins', 'prerequisites'],
            },
            {
                id: 'implementation_roadmap',
                priority: 'medium',
                prompt: `Create a phased implementation roadmap that sequences the ideas from different techniques:

Phase 1 (0-1 month): Foundation
Phase 2 (1-3 months): Core Implementation  
Phase 3 (3-6 months): Optimization

For each phase, specify:
- Key deliverables from each technique
- Dependencies and prerequisites
- Resource requirements
- Risk mitigation strategies`,
                focusAreas: ['roadmap', 'phasing', 'dependencies'],
            },
            {
                id: 'success_metrics',
                priority: 'low',
                prompt: `Define success metrics for the synthesized solution:
- Leading indicators (early signs of progress)
- Lagging indicators (outcome measures)
- Technique-specific metrics
- Overall success criteria`,
                focusAreas: ['metrics', 'measurement', 'success_criteria'],
            },
        ];
    }
    createRiskAwarePrompts(results) {
        const risks = this.extractAllRisks(results);
        return [
            {
                id: 'risk_synthesis',
                priority: 'high',
                prompt: `Analyze and synthesize the risks identified across all techniques:

${risks
                    .slice(0, 10)
                    .map(risk => `- ${risk}`)
                    .join('\n')}

For the top 5 most critical risks:
1. Assess combined probability and impact
2. Identify which techniques' solutions might increase/decrease each risk
3. Propose integrated mitigation strategies
4. Define early warning indicators`,
                focusAreas: ['risk_assessment', 'mitigation', 'monitoring'],
                context: { totalRisks: risks.length },
            },
            {
                id: 'failure_mode_analysis',
                priority: 'medium',
                prompt: `Perform a failure mode analysis on the synthesized solution:
- What could go wrong when combining ideas from different techniques?
- Are there hidden interdependencies that create new risks?
- What are the cascade effects of partial implementation?
- How can we build in graceful degradation?`,
                focusAreas: ['failure_modes', 'interdependencies', 'resilience'],
            },
            {
                id: 'antifragile_design',
                priority: 'low',
                prompt: `Design antifragile elements into the synthesized solution:
- How can the solution improve under stress?
- What learning mechanisms can we embed?
- How do we benefit from volatility?
- What options preserve future flexibility?`,
                focusAreas: ['antifragility', 'adaptation', 'learning'],
            },
        ];
    }
    createConflictResolutionPrompt(results) {
        const conflicts = this.identifyConflicts(results);
        return {
            id: 'conflict_resolution',
            priority: 'high',
            prompt: `The parallel exploration revealed conflicting recommendations:

${conflicts
                .slice(0, 5)
                .map(c => `- ${c.description}`)
                .join('\n')}

For each conflict:
1. Analyze the underlying assumptions causing the conflict
2. Determine if both approaches can coexist in different contexts
3. If not, recommend which approach to prioritize and why
4. Suggest how to test assumptions before committing`,
            focusAreas: ['conflict_resolution', 'decision_making'],
            context: { conflictCount: conflicts.length },
        };
    }
    createComplexityManagementPrompt(results) {
        const techniqueCount = results.type === 'hierarchical' ? results.summary.techniqueCount : 0;
        const hasRisks = results.type === 'flat' && results.allRisks.length > 0;
        return {
            id: 'complexity_management',
            priority: 'medium',
            prompt: `The ${techniqueCount} parallel techniques show high complexity${hasRisks ? ' with identified risks' : ''}. Create a strategy to manage this:

1. Identify the essential vs. nice-to-have elements
2. Propose a minimal viable synthesis (MVS)
3. Design a learning approach to add complexity incrementally
4. Create decision trees for navigating options

Consider using sequential thinking to break down the complexity systematically.`,
            focusAreas: ['simplification', 'prioritization', 'incremental_approach'],
            suggestedApproach: 'Sequential thinking recommended for systematic breakdown',
        };
    }
    createInnovationRefinementPrompt(results) {
        const innovativeCount = results.type === 'hierarchical'
            ? results.techniques.filter(t => t.keyInsights.some(i => i.toLowerCase().includes('innovat'))).length
            : 0;
        return {
            id: 'innovation_refinement',
            priority: 'medium',
            prompt: `${innovativeCount > 0 ? innovativeCount : 'Several'} innovative ideas emerged from the parallel exploration. Refine the top innovations:

1. Combine compatible innovative elements from different techniques
2. Address practical implementation challenges
3. Design experiments to validate assumptions
4. Create innovation metrics to track success

Focus on maintaining the innovative spirit while ensuring feasibility.`,
            focusAreas: ['innovation', 'feasibility', 'validation'],
        };
    }
    // Helper methods for analyzing results
    hasConflicts(results) {
        if (results.type === 'hierarchical') {
            return results.crossTechniqueAnalysis.divergentPerspectives.length > 0;
        }
        // Simple heuristic for other formats
        return this.getTotalIdeas(results) > 20;
    }
    hasHighComplexity(results) {
        const ideaCount = this.getTotalIdeas(results);
        const techniqueCount = this.getTechniqueCount(results);
        return ideaCount > 30 || techniqueCount > 4;
    }
    hasInnovativeIdeas(results) {
        if (results.type === 'flat') {
            return results.allIdeas.some(idea => idea.tags?.includes('innovation') || idea.content.toLowerCase().includes('innovative'));
        }
        // Simple check for other formats
        return true; // Assume some innovation in creative thinking
    }
    getTechniqueCount(results) {
        switch (results.type) {
            case 'hierarchical':
                return results.techniques.length;
            case 'flat':
                return new Set(results.allIdeas.map(i => i.technique)).size;
            case 'comparative':
                return results.dimensions[0]?.techniqueComparisons.length || 0;
            case 'narrative':
                return results.chapters.length - 1; // Approximate from chapter count
            default:
                return 0;
        }
    }
    getTotalIdeas(results) {
        switch (results.type) {
            case 'hierarchical':
                return results.summary.totalIdeas;
            case 'flat':
                return results.allIdeas.length;
            case 'comparative':
                return results.dimensions.length * this.getTechniqueCount(results);
            case 'narrative':
                return 0; // Not directly available in narrative format
            default:
                return 0;
        }
    }
    getTechniqueNames(results) {
        switch (results.type) {
            case 'hierarchical':
                return results.techniques.map(t => t.technique);
            case 'flat':
                return [...new Set(results.allIdeas.map(i => i.technique))];
            case 'comparative':
                return results.dimensions[0]?.techniqueComparisons.map(tc => tc.technique) || [];
            case 'narrative':
                return []; // Not directly available
            default:
                return [];
        }
    }
    suggestSynthesisApproach(results) {
        const complexity = this.assessComplexity(results);
        const conflicts = this.hasConflicts(results);
        if (complexity === 'high' || conflicts) {
            return 'Consider using sequential thinking to systematically analyze and integrate results';
        }
        else if (complexity === 'medium') {
            return 'Direct synthesis recommended with focus on key themes and synergies';
        }
        else {
            return 'Simple integration of complementary ideas should suffice';
        }
    }
    extractTopThemes(results) {
        if (results.type === 'hierarchical') {
            return results.crossTechniqueAnalysis.commonThemes.slice(0, 3).map(t => t.theme);
        }
        // Default themes for other formats
        return ['innovation', 'implementation', 'user value'];
    }
    extractAllRisks(results) {
        switch (results.type) {
            case 'hierarchical':
                return results.techniques.flatMap(t => t.risks.map(r => r.description));
            case 'flat':
                return results.allRisks.map(r => r.risk);
            default:
                return [];
        }
    }
    identifyConflicts(results) {
        if (results.type === 'hierarchical') {
            return results.crossTechniqueAnalysis.divergentPerspectives.map(dp => ({
                description: `${dp.topic}: ${dp.perspectives.map(p => p.technique).join(' vs ')}`,
            }));
        }
        return [];
    }
    assessComplexity(results) {
        const ideaCount = this.getTotalIdeas(results);
        const techniqueCount = this.getTechniqueCount(results);
        if (ideaCount > 50 || techniqueCount > 5)
            return 'high';
        if (ideaCount > 20 || techniqueCount > 3)
            return 'medium';
        return 'low';
    }
}
//# sourceMappingURL=SynthesisPromptGenerator.js.map