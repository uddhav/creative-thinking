/**
 * Next Action Suggester
 * Suggests what the LLM might do with parallel results
 */

import type { ParallelResult } from '../../../types/handoff.js';
import type {
  LLMHandoffOptions,
  SuggestedAction,
  ResultCharacteristics,
} from '../../../types/handoff.js';

export class NextActionSuggester {
  suggestNextActions(results: ParallelResult[], options: LLMHandoffOptions): SuggestedAction[] {
    const actions: SuggestedAction[] = [];

    // Analyze characteristics of results
    const characteristics = this.analyzeResultCharacteristics(results);

    // Sequential thinking suggestion
    if (characteristics.highComplexity || characteristics.needsDeepAnalysis) {
      actions.push({
        tool: 'mcp__sequential-thinking__sequentialthinking',
        priority: 'high',
        reason: 'Results show high complexity requiring structured analysis',
        suggestedPrompt: this.createSequentialThinkingPrompt(results),
        expectedBenefit: 'Systematic breakdown and analysis of complex patterns',
      });
    }

    // Memory/knowledge graph suggestion
    if (characteristics.manyInsights || characteristics.reusablePatterns) {
      actions.push({
        tool: 'mcp__memory__create_entities',
        priority: 'medium',
        reason: 'Valuable insights should be preserved for future reference',
        suggestedActions: [
          'Create entities for key concepts discovered',
          'Establish relationships between ideas from different techniques',
          'Document successful patterns for reuse',
        ],
        expectedBenefit: 'Build knowledge base for future creative sessions',
      });
    }

    // Research suggestion
    if (characteristics.knowledgeGaps || characteristics.externalValidationNeeded) {
      actions.push({
        tool: 'WebSearch',
        priority: 'medium',
        reason: 'External validation or additional research recommended',
        suggestedQueries: this.generateResearchQueries(results),
        expectedBenefit: 'Validate assumptions and fill knowledge gaps',
      });
    }

    // File system suggestion for documentation
    if (this.shouldDocumentResults(results, characteristics)) {
      actions.push({
        tool: 'mcp__filesystem__write_file',
        priority: 'low',
        reason: 'Document synthesized results for team reference',
        suggestedActions: [
          'Create synthesis report in project documentation',
          'Export key insights to shareable format',
          'Update project roadmap with new ideas',
        ],
        expectedBenefit: 'Persistent documentation for team alignment',
      });
    }

    // Direct synthesis suggestion
    if (characteristics.clearPatterns && !characteristics.conflicts) {
      actions.push({
        tool: 'direct_synthesis',
        priority: 'high',
        reason: 'Results show clear patterns ready for synthesis',
        approach: 'Combine complementary insights and create unified recommendations',
        expectedBenefit: 'Quick synthesis leveraging natural convergence',
      });
    }

    // Conflict resolution through additional analysis
    if (characteristics.conflicts) {
      actions.push({
        tool: 'comparative_analysis',
        priority: 'high',
        reason: 'Conflicting recommendations require deeper analysis',
        approach: 'Compare underlying assumptions and contexts for each approach',
        suggestedActions: [
          'Identify root causes of conflicts',
          'Determine contextual validity of each approach',
          'Design A/B tests for empirical validation',
        ],
        expectedBenefit: 'Informed decision-making between alternatives',
      });
    }

    // Focus area specific suggestions
    if (options.focusAreas && options.focusAreas.length > 0) {
      actions.push(...this.generateFocusAreaActions(options.focusAreas, results));
    }

    return this.prioritizeActions(actions);
  }

  private analyzeResultCharacteristics(results: ParallelResult[]): ResultCharacteristics {
    return {
      highComplexity: this.assessComplexity(results) > 0.7,
      needsDeepAnalysis: this.needsDeepAnalysis(results),
      manyInsights: this.countTotalInsights(results) > 20,
      reusablePatterns: this.hasReusablePatterns(results),
      knowledgeGaps: this.detectKnowledgeGaps(results),
      externalValidationNeeded: this.needsExternalValidation(results),
      clearPatterns: this.hasClearPatterns(results),
      conflicts: this.hasSignificantConflicts(results),
    };
  }

  private assessComplexity(results: ParallelResult[]): number {
    let complexity = 0;

    // Factor 1: Number of techniques
    complexity += Math.min(results.length * 0.1, 0.3);

    // Factor 2: Total number of ideas/insights
    const totalIdeas = this.countTotalIdeas(results);
    complexity += Math.min(totalIdeas * 0.01, 0.3);

    // Factor 3: Interconnectedness (based on shared themes)
    const sharedThemes = this.countSharedThemes(results);
    complexity += Math.min(sharedThemes * 0.05, 0.2);

    // Factor 4: Risk count
    const totalRisks = this.countTotalRisks(results);
    complexity += Math.min(totalRisks * 0.02, 0.2);

    return Math.min(complexity, 1.0);
  }

  private needsDeepAnalysis(results: ParallelResult[]): boolean {
    // Check for indicators that suggest deep analysis would be beneficial
    const hasComplexDependencies = results.some(
      r => r.metrics?.pathDependencies && r.metrics.pathDependencies > 3
    );

    const hasLowConfidence = results.some(
      r => r.metrics?.confidence !== undefined && r.metrics.confidence < 0.5
    );

    const hasIncompleteExploration = results.some(
      r =>
        r.metrics?.completedSteps &&
        r.metrics.totalSteps &&
        r.metrics.completedSteps < r.metrics.totalSteps * 0.7
    );

    return hasComplexDependencies || hasLowConfidence || hasIncompleteExploration;
  }

  private countTotalInsights(results: ParallelResult[]): number {
    return results.reduce((sum, r) => sum + (r.insights?.length || 0), 0);
  }

  private countTotalIdeas(results: ParallelResult[]): number {
    return results.reduce((sum, r) => {
      let count = r.insights?.length || 0;
      if (r.results && typeof r.results === 'object') {
        count += Object.keys(r.results).length;
      }
      return sum + count;
    }, 0);
  }

  private countTotalRisks(results: ParallelResult[]): number {
    return results.reduce((sum, r) => {
      const resultData = r.results as Record<string, unknown>;
      const risks = resultData?.risks as unknown[];
      return sum + (risks?.length || 0);
    }, 0);
  }

  private hasReusablePatterns(results: ParallelResult[]): boolean {
    // Check if there are patterns worth preserving
    const techniques = ['concept_extraction', 'triz', 'design_thinking'];
    const hasPatternTechniques = results.some(r => techniques.includes(r.technique));

    const hasAbstractedConcepts = results.some((r: ParallelResult) =>
      r.insights?.some(
        (i: string) => i.toLowerCase().includes('pattern') || i.toLowerCase().includes('principle')
      )
    );

    return hasPatternTechniques || hasAbstractedConcepts;
  }

  private detectKnowledgeGaps(results: ParallelResult[]): boolean {
    // Look for indicators of knowledge gaps
    const gapIndicators = ['unknown', 'unclear', 'need to research', 'assumption', 'hypothesis'];

    return results.some((r: ParallelResult) =>
      r.insights?.some((insight: string) =>
        gapIndicators.some(indicator => insight.toLowerCase().includes(indicator))
      )
    );
  }

  private needsExternalValidation(results: ParallelResult[]): boolean {
    // Check if external validation would be valuable
    const hasMarketClaims = results.some((r: ParallelResult) =>
      r.insights?.some(
        (i: string) =>
          i.toLowerCase().includes('market') ||
          i.toLowerCase().includes('competitor') ||
          i.toLowerCase().includes('industry')
      )
    );

    const hasTechnicalClaims = results.some((r: ParallelResult) =>
      r.insights?.some(
        (i: string) =>
          i.toLowerCase().includes('performance') ||
          i.toLowerCase().includes('benchmark') ||
          i.toLowerCase().includes('state-of-the-art')
      )
    );

    return hasMarketClaims || hasTechnicalClaims;
  }

  private hasClearPatterns(results: ParallelResult[]): boolean {
    // Check if patterns are clear and consistent
    const themes = this.extractAllThemes(results);
    const themeFrequency = this.calculateThemeFrequency(themes);

    // Clear patterns if some themes appear in multiple techniques
    const multiTechniqueThemes = Object.values(themeFrequency).filter(f => f > 1).length;

    return multiTechniqueThemes >= 3;
  }

  private hasSignificantConflicts(results: ParallelResult[]): boolean {
    // Look for conflicting recommendations
    const recommendations = this.extractRecommendations(results);

    // Simple conflict detection based on opposing keywords
    const opposingPairs = [
      ['centralize', 'decentralize'],
      ['automate', 'manual'],
      ['expand', 'focus'],
      ['speed', 'quality'],
      ['standardize', 'customize'],
    ];

    for (const [word1, word2] of opposingPairs) {
      const hasWord1 = recommendations.some(r => r.toLowerCase().includes(word1));
      const hasWord2 = recommendations.some(r => r.toLowerCase().includes(word2));

      if (hasWord1 && hasWord2) {
        return true;
      }
    }

    return false;
  }

  private countSharedThemes(results: ParallelResult[]): number {
    const themesByTechnique = results.map(r => this.extractThemes(r));
    const sharedThemes = new Set<string>();

    for (let i = 0; i < themesByTechnique.length; i++) {
      for (let j = i + 1; j < themesByTechnique.length; j++) {
        const shared = themesByTechnique[i].filter(t => themesByTechnique[j].includes(t));
        shared.forEach(t => sharedThemes.add(t));
      }
    }

    return sharedThemes.size;
  }

  private createSequentialThinkingPrompt(results: ParallelResult[]): string {
    const totalIdeas = this.countTotalIdeas(results);
    const techniques = results.map(r => r.technique).join(', ');

    return `Analyze the ${totalIdeas} ideas from parallel creative thinking (${techniques}) to:
1. Map relationships and dependencies between ideas
2. Identify the critical path for implementation
3. Resolve conflicts between different approaches
4. Create a prioritized action plan with clear sequencing`;
  }

  private generateResearchQueries(results: ParallelResult[]): string[] {
    const queries: string[] = [];

    // Extract key concepts that need validation
    results.forEach(result => {
      if (result.insights) {
        result.insights.forEach((insight: string) => {
          // Look for claims that need validation
          if (insight.includes('market') || insight.includes('industry')) {
            queries.push(`current market trends ${this.extractKeyPhrase(insight)}`);
          }
          if (insight.includes('technology') || insight.includes('solution')) {
            queries.push(`best practices ${this.extractKeyPhrase(insight)}`);
          }
        });
      }
    });

    return [...new Set(queries)].slice(0, 5); // Unique queries, max 5
  }

  private shouldDocumentResults(
    results: ParallelResult[],
    characteristics: ResultCharacteristics
  ): boolean {
    // Document if results are substantial and valuable
    const hasSubstantialContent = this.countTotalIdeas(results) > 15;
    const hasValuableInsights = characteristics.manyInsights || characteristics.reusablePatterns;
    const isComplete = results.every(
      r => !r.metrics?.completedSteps || r.metrics.completedSteps === r.metrics.totalSteps
    );

    return hasSubstantialContent && hasValuableInsights && isComplete;
  }

  private generateFocusAreaActions(
    focusAreas: string[],
    results: ParallelResult[]
  ): SuggestedAction[] {
    const actions: SuggestedAction[] = [];
    const totalIdeas = this.countTotalIdeas(results);
    const totalRisks = this.countTotalRisks(results);

    focusAreas.forEach(area => {
      switch (area.toLowerCase()) {
        case 'implementation':
          actions.push({
            tool: 'implementation_planning',
            priority: 'high',
            reason: `Focus area: ${area} - Need to implement ${totalIdeas} ideas from parallel exploration`,
            approach: 'Create detailed implementation plan from synthesized ideas',
            suggestedActions: [
              'Define implementation phases',
              'Identify resource requirements',
              'Create timeline with milestones',
            ],
          });
          break;

        case 'innovation':
          actions.push({
            tool: 'innovation_refinement',
            priority: 'medium',
            reason: `Focus area: ${area}`,
            approach: 'Refine and enhance innovative ideas from parallel exploration',
            suggestedActions: [
              'Combine innovative elements from different techniques',
              'Design experiments to test novel concepts',
              'Create innovation metrics',
            ],
          });
          break;

        case 'risk':
          actions.push({
            tool: 'risk_analysis',
            priority: 'high',
            reason: `Focus area: ${area} - ${totalRisks} risks identified across techniques`,
            approach: 'Deep dive into risk assessment and mitigation',
            suggestedActions: [
              'Catalog all identified risks',
              'Assess probability and impact',
              'Design mitigation strategies',
            ],
          });
          break;
      }
    });

    return actions;
  }

  private prioritizeActions(actions: SuggestedAction[]): SuggestedAction[] {
    // Sort by priority (high -> medium -> low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private extractThemes(result: ParallelResult): string[] {
    const themes: string[] = [];
    const text = JSON.stringify(result.insights || []) + JSON.stringify(result.results || {});

    const themeKeywords = [
      'innovation',
      'efficiency',
      'quality',
      'user experience',
      'scalability',
      'cost',
      'automation',
      'integration',
      'sustainability',
    ];

    themeKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        themes.push(keyword);
      }
    });

    return themes;
  }

  private extractAllThemes(results: ParallelResult[]): string[] {
    return results.flatMap(r => this.extractThemes(r));
  }

  private calculateThemeFrequency(themes: string[]): Record<string, number> {
    const frequency: Record<string, number> = {};

    themes.forEach(theme => {
      frequency[theme] = (frequency[theme] || 0) + 1;
    });

    return frequency;
  }

  private extractRecommendations(results: ParallelResult[]): string[] {
    const recommendations: string[] = [];

    results.forEach(result => {
      if (result.insights) {
        recommendations.push(...result.insights);
      }
      if (result.results && typeof result.results === 'object') {
        Object.values(result.results).forEach(value => {
          if (typeof value === 'string') {
            recommendations.push(value);
          }
        });
      }
    });

    return recommendations;
  }

  private extractKeyPhrase(text: string): string {
    // Simple key phrase extraction
    const words = text.split(' ').filter(w => w.length > 3);
    return words.slice(0, 3).join(' ');
  }
}
