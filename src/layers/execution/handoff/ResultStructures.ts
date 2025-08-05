/**
 * Result Structuring Strategies
 * Different ways to structure parallel results for LLM consumption
 */

import type { ParallelResult } from '../../../types/handoff.js';
import type {
  HierarchicalStructure,
  FlatStructure,
  ComparativeStructure,
  NarrativeStructure,
} from '../../../types/handoff.js';

export class ResultStructures {
  createHierarchicalStructure(results: ParallelResult[]): HierarchicalStructure {
    return {
      type: 'hierarchical',
      summary: {
        techniqueCount: results.length,
        totalInsights: this.countTotalInsights(results),
        totalIdeas: this.countTotalIdeas(results),
        executionTime: this.calculateTotalTime(results),
      },
      techniques: results.map(result => ({
        technique: result.technique,
        summary: this.summarizeTechnique(result),
        keyInsights: this.extractKeyInsights(result),
        ideas: this.structureIdeas(result),
        risks: this.structureRisks(result),
        metrics: result.metrics,
        subSections: this.createSubSections(result),
      })),
      crossTechniqueAnalysis: {
        commonThemes: this.findCommonThemes(results),
        divergentPerspectives: this.findDivergentPerspectives(results),
        complementaryInsights: this.findComplementaryInsights(results),
      },
    };
  }

  createFlatStructure(results: ParallelResult[]): FlatStructure {
    const allIdeas: FlatStructure['allIdeas'] = [];
    const allInsights: FlatStructure['allInsights'] = [];
    const allRisks: FlatStructure['allRisks'] = [];

    results.forEach(result => {
      // Extract ideas
      const ideas = this.extractAllIdeas(result);
      ideas.forEach((idea, index) => {
        allIdeas.push({
          id: `${result.technique}_idea_${index}`,
          content: idea,
          technique: result.technique,
          category: this.categorizeIdea(idea),
          tags: this.extractTags(idea),
          confidence: result.metrics?.confidence,
        });
      });

      // Extract insights
      if (result.insights) {
        result.insights.forEach((insight: string) => {
          allInsights.push({
            insight,
            technique: result.technique,
            importance: this.assessImportance(insight),
          });
        });
      }

      // Extract risks from results (assuming they're stored in the results object)
      // TODO: Update this when actual risk structure is defined
      const resultData = result.results as Record<string, unknown>;
      const risks = resultData?.risks as unknown[];
      if (risks && Array.isArray(risks)) {
        risks.forEach((risk: unknown) => {
          const riskDescription =
            typeof risk === 'string'
              ? risk
              : ((risk as Record<string, unknown>)?.description as string) || 'Unknown risk';

          allRisks.push({
            risk: riskDescription,
            technique: result.technique,
            severity: this.assessSeverity(riskDescription),
            mitigation: this.suggestMitigation(riskDescription),
          });
        });
      }
    });

    return {
      type: 'flat',
      allIdeas,
      allInsights,
      allRisks,
    };
  }

  createComparativeStructure(results: ParallelResult[]): ComparativeStructure {
    const dimensions = this.identifyComparisonDimensions(results);

    return {
      type: 'comparative',
      dimensions: dimensions.map(dim => ({
        name: dim.name,
        description: dim.description,
        techniqueComparisons: results.map(result => ({
          technique: result.technique,
          value: this.extractDimensionValue(result, dim),
          evidence: this.extractDimensionEvidence(result, dim),
        })),
      })),
      comparisonMatrix: this.createComparisonMatrix(results, dimensions),
      recommendations: this.generateComparativeRecommendations(results, dimensions),
    };
  }

  createNarrativeStructure(results: ParallelResult[], problem: string): NarrativeStructure {
    return {
      type: 'narrative',
      story: this.weaveNarrative(results, problem),
      chapters: [
        {
          title: 'The Challenge',
          content: this.narrateProblemContext(problem, results),
        },
        {
          title: 'Multiple Perspectives',
          content: this.narrateTechniqueJourneys(results),
        },
        {
          title: 'Emerging Insights',
          content: this.narrateEmergingPatterns(results),
        },
        {
          title: 'Synthesis Opportunities',
          content: this.narrateSynthesisOpportunities(results),
        },
      ],
      callToAction: this.createCallToAction(results),
    };
  }

  // Helper methods for hierarchical structure
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

  private calculateTotalTime(results: ParallelResult[]): number {
    return Math.max(...results.map(r => r.metrics?.executionTime || 0));
  }

  private summarizeTechnique(result: ParallelResult): string {
    const insightCount = result.insights?.length || 0;
    const resultData = result.results as Record<string, unknown>;
    const risks = resultData?.risks as unknown[];
    const riskCount = risks?.length || 0;
    const completeness = result.metrics?.completedSteps
      ? `${result.metrics.completedSteps}/${result.metrics.totalSteps} steps`
      : 'unknown';

    return `Generated ${insightCount} insights and identified ${riskCount} risks. Completeness: ${completeness}`;
  }

  private extractKeyInsights(result: ParallelResult): string[] {
    return result.insights?.slice(0, 3) || [];
  }

  private structureIdeas(result: ParallelResult): HierarchicalStructure['techniques'][0]['ideas'] {
    const ideas: HierarchicalStructure['techniques'][0]['ideas'] = [];

    // Extract from insights
    if (result.insights) {
      result.insights.forEach((insight: string, index: number) => {
        ideas.push({
          id: `${result.technique}_insight_${index}`,
          content: insight,
          category: 'insight',
          confidence: result.metrics?.confidence,
        });
      });
    }

    // Extract from results object
    if (result.results && typeof result.results === 'object') {
      Object.entries(result.results).forEach(([key, value]) => {
        ideas.push({
          id: `${result.technique}_${key}`,
          content: String(value),
          category: key,
          confidence: result.metrics?.confidence,
        });
      });
    }

    return ideas;
  }

  private structureRisks(result: ParallelResult): HierarchicalStructure['techniques'][0]['risks'] {
    const resultData = result.results as Record<string, unknown>;
    const risks = resultData?.risks as unknown[];
    if (!risks || !Array.isArray(risks)) return [];

    return risks.map((risk: unknown) => {
      const riskDescription =
        typeof risk === 'string'
          ? risk
          : ((risk as Record<string, unknown>)?.description as string) || 'Unknown risk';

      return {
        description: riskDescription,
        severity: this.assessSeverity(riskDescription),
        mitigation: this.suggestMitigation(riskDescription),
      };
    });
  }

  private createSubSections(result: ParallelResult): Array<{ title: string; content: string }> {
    const sections: Array<{ title: string; content: string }> = [];

    // Add technique-specific sections based on available data
    if (result.metrics?.pathDependencies) {
      sections.push({
        title: 'Path Dependencies',
        content: `Identified ${result.metrics.pathDependencies} path dependencies that may affect future options.`,
      });
    }

    if (result.metrics?.flexibility !== undefined) {
      sections.push({
        title: 'Flexibility Assessment',
        content: `Current flexibility score: ${(result.metrics.flexibility * 100).toFixed(0)}%`,
      });
    }

    return sections;
  }

  private findCommonThemes(
    results: ParallelResult[]
  ): HierarchicalStructure['crossTechniqueAnalysis']['commonThemes'] {
    const themeMap = new Map<string, { techniques: Set<string>; evidence: string[] }>();

    // Extract themes from each result
    results.forEach(result => {
      const themes = this.extractThemes(result);
      themes.forEach(theme => {
        if (!themeMap.has(theme)) {
          themeMap.set(theme, { techniques: new Set(), evidence: [] });
        }
        const entry = themeMap.get(theme);
        if (entry) {
          entry.techniques.add(result.technique);
          if (result.insights && result.insights.length > 0) {
            entry.evidence.push(`${result.technique}: ${result.insights[0]}`);
          }
        }
      });
    });

    // Convert to array format
    return Array.from(themeMap.entries())
      .filter(([_, data]) => data.techniques.size > 1) // Only common themes
      .map(([theme, data]) => ({
        theme,
        techniques: Array.from(data.techniques),
        evidence: data.evidence.slice(0, 3),
      }));
  }

  private findDivergentPerspectives(
    results: ParallelResult[]
  ): HierarchicalStructure['crossTechniqueAnalysis']['divergentPerspectives'] {
    // Identify topics where techniques have different views
    const topics = ['approach', 'priority', 'risk', 'timeline'];
    const perspectives: HierarchicalStructure['crossTechniqueAnalysis']['divergentPerspectives'] =
      [];

    topics.forEach(topic => {
      const views = results
        .map(result => ({
          technique: result.technique,
          view: this.extractViewOnTopic(result, topic),
        }))
        .filter(v => v.view !== null);

      if (views.length > 1 && this.hasSignificantDivergence(views)) {
        perspectives.push({
          topic,
          perspectives: views as Array<{ technique: string; view: string }>,
        });
      }
    });

    return perspectives;
  }

  private findComplementaryInsights(
    results: ParallelResult[]
  ): HierarchicalStructure['crossTechniqueAnalysis']['complementaryInsights'] {
    const complementary: HierarchicalStructure['crossTechniqueAnalysis']['complementaryInsights'] =
      [];

    // Look for insights that work well together
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const synergies = this.findSynergies(results[i], results[j]);
        complementary.push(...synergies);
      }
    }

    return complementary.slice(0, 5); // Top 5 synergies
  }

  // Helper methods for flat structure
  private extractAllIdeas(result: ParallelResult): string[] {
    const ideas: string[] = [];

    if (result.insights) {
      ideas.push(...result.insights);
    }

    if (result.results && typeof result.results === 'object') {
      Object.values(result.results).forEach(value => {
        if (typeof value === 'string') {
          ideas.push(value);
        }
      });
    }

    return ideas;
  }

  private categorizeIdea(idea: string): string {
    // Simple categorization based on keywords
    if (idea.toLowerCase().includes('user') || idea.toLowerCase().includes('customer')) {
      return 'user-focused';
    }
    if (idea.toLowerCase().includes('technical') || idea.toLowerCase().includes('system')) {
      return 'technical';
    }
    if (idea.toLowerCase().includes('business') || idea.toLowerCase().includes('revenue')) {
      return 'business';
    }
    return 'general';
  }

  private extractTags(idea: string): string[] {
    const tags: string[] = [];
    const keywords = [
      'innovation',
      'efficiency',
      'scalability',
      'cost',
      'quality',
      'automation',
      'design',
      'implementation',
    ];

    keywords.forEach(keyword => {
      if (idea.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });

    return tags;
  }

  private assessImportance(insight: string): 'low' | 'medium' | 'high' {
    // Simple importance assessment based on keywords
    const highImportanceKeywords = ['critical', 'essential', 'must', 'key', 'fundamental'];
    const lowImportanceKeywords = ['minor', 'optional', 'nice-to-have', 'consider'];

    const insightLower = insight.toLowerCase();

    if (highImportanceKeywords.some(keyword => insightLower.includes(keyword))) {
      return 'high';
    }
    if (lowImportanceKeywords.some(keyword => insightLower.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  private assessSeverity(risk: string): 'low' | 'medium' | 'high' {
    const highSeverityKeywords = ['critical', 'severe', 'major', 'catastrophic'];
    const lowSeverityKeywords = ['minor', 'small', 'minimal', 'negligible'];

    const riskLower = risk.toLowerCase();

    if (highSeverityKeywords.some(keyword => riskLower.includes(keyword))) {
      return 'high';
    }
    if (lowSeverityKeywords.some(keyword => riskLower.includes(keyword))) {
      return 'low';
    }
    return 'medium';
  }

  private suggestMitigation(risk: string): string {
    // Simple mitigation suggestions based on risk type
    if (risk.toLowerCase().includes('user')) {
      return 'Conduct user testing and gather feedback';
    }
    if (risk.toLowerCase().includes('technical')) {
      return 'Perform technical proof of concept';
    }
    if (risk.toLowerCase().includes('resource')) {
      return 'Allocate contingency resources';
    }
    return 'Monitor closely and develop contingency plan';
  }

  // Helper methods for comparative structure
  private identifyComparisonDimensions(
    results: ParallelResult[]
  ): Array<{ name: string; description: string }> {
    const dimensions = [
      { name: 'Innovation Level', description: 'How innovative are the solutions?' },
      { name: 'Implementation Complexity', description: 'How complex to implement?' },
    ];

    // Add risk dimension only if risks were identified
    const hasRisks = results.some(r => {
      const resultData = r.results as Record<string, unknown>;
      const risks = resultData?.risks as unknown[];
      return risks && risks.length > 0;
    });

    if (hasRisks) {
      dimensions.push({ name: 'Risk Level', description: 'What is the overall risk?' });
    }

    // Always include these
    dimensions.push(
      { name: 'User Impact', description: 'How much does it impact users?' },
      { name: 'Resource Requirements', description: 'What resources are needed?' }
    );

    return dimensions;
  }

  private extractDimensionValue(
    result: ParallelResult,
    dimension: { name: string; description: string }
  ): string | number {
    // Extract values based on dimension
    switch (dimension.name) {
      case 'Innovation Level':
        return this.assessInnovation(result);
      case 'Implementation Complexity':
        return this.assessComplexity(result);
      case 'Risk Level': {
        const resultData = result.results as Record<string, unknown>;
        const risks = resultData?.risks as unknown[];
        return risks?.length || 0;
      }
      case 'User Impact':
        return this.assessUserImpact(result);
      case 'Resource Requirements':
        return this.assessResourceNeeds(result);
      default:
        return 'Unknown';
    }
  }

  private extractDimensionEvidence(
    result: ParallelResult,
    dimension: { name: string; description: string }
  ): string[] {
    const evidence: string[] = [];

    if (result.insights) {
      result.insights.forEach((insight: string) => {
        if (this.insightRelatedToDimension(insight, dimension)) {
          evidence.push(insight);
        }
      });
    }

    return evidence.slice(0, 2);
  }

  private createComparisonMatrix(
    results: ParallelResult[],
    dimensions: Array<{ name: string; description: string }>
  ): Record<string, Record<string, unknown>> {
    const matrix: Record<string, Record<string, unknown>> = {};

    results.forEach(result => {
      matrix[result.technique] = {};
      dimensions.forEach(dim => {
        matrix[result.technique][dim.name] = this.extractDimensionValue(result, dim);
      });
    });

    return matrix;
  }

  private generateComparativeRecommendations(
    results: ParallelResult[],
    dimensions: Array<{ name: string; description: string }>
  ): string[] {
    const recommendations: string[] = [];

    // Find best technique for each dimension
    dimensions.forEach(dim => {
      const best = this.findBestForDimension(results, dim);
      if (best) {
        recommendations.push(`For ${dim.name.toLowerCase()}, consider ${best.technique} approach`);
      }
    });

    return recommendations;
  }

  // Helper methods for narrative structure
  private weaveNarrative(results: ParallelResult[], problem: string): string {
    return `Our journey began with a challenge: "${problem}". We embarked on a parallel exploration, employing ${results.length} different creative thinking techniques simultaneously. Each technique offered its unique lens, revealing different facets of the problem and potential solutions.`;
  }

  private narrateProblemContext(problem: string, results: ParallelResult[]): string {
    return `The challenge we faced was clear yet complex: "${problem}". To tackle this multifaceted problem, we chose to approach it from ${results.length} different angles simultaneously, knowing that each perspective would reveal unique insights and opportunities.`;
  }

  private narrateTechniqueJourneys(results: ParallelResult[]): string {
    const journeys = results
      .map(result => `The ${result.technique} approach ${this.describeTechniqueJourney(result)}`)
      .join('\n\n');

    return `Each technique took us on a different journey:\n\n${journeys}`;
  }

  private narrateEmergingPatterns(results: ParallelResult[]): string {
    const themes = this.findCommonThemes(results);
    const themeNarrative =
      themes.length > 0
        ? `Common themes emerged across our explorations: ${themes.map(t => t.theme).join(', ')}.`
        : 'While each technique offered unique insights, surprising patterns began to emerge.';

    return `${themeNarrative} These convergent insights suggest deeper truths about our challenge and point toward integrated solutions.`;
  }

  private narrateSynthesisOpportunities(results: ParallelResult[]): string {
    const synergies = this.findComplementaryInsights(results);
    const synergyCount = synergies.length;

    return `The parallel exploration has revealed ${results.length} distinct pathways forward. ${
      synergyCount > 0
        ? `We discovered ${synergyCount} synergistic combinations where techniques complement each other beautifully.`
        : 'Each technique offers unique perspectives.'
    } The richness of these perspectives creates opportunities for innovative synthesis.`;
  }

  private createCallToAction(results: ParallelResult[]): string {
    const totalIdeas = this.countTotalIdeas(results);
    return `With ${totalIdeas} ideas generated across ${results.length} techniques, the next step is to synthesize these insights into a coherent action plan. Consider which combinations of approaches best address your specific context and constraints.`;
  }

  // Utility methods
  private extractThemes(result: ParallelResult): string[] {
    const themes: string[] = [];
    const text = JSON.stringify(result.insights || []) + JSON.stringify(result.results || {});

    const themeKeywords = [
      'innovation',
      'efficiency',
      'user experience',
      'scalability',
      'sustainability',
      'collaboration',
      'automation',
      'quality',
    ];

    themeKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        themes.push(keyword);
      }
    });

    return themes;
  }

  private extractViewOnTopic(result: ParallelResult, topic: string): string | null {
    // Extract technique's view on a specific topic
    if (!result.insights) return null;

    for (const insight of result.insights) {
      if (insight.toLowerCase().includes(topic)) {
        return insight;
      }
    }

    return null;
  }

  private hasSignificantDivergence(
    views: Array<{ technique: string; view: string | null }>
  ): boolean {
    // Simple check for divergence
    const uniqueViews = new Set(views.map(v => v.view));
    return uniqueViews.size > 1;
  }

  private findSynergies(
    result1: ParallelResult,
    result2: ParallelResult
  ): HierarchicalStructure['crossTechniqueAnalysis']['complementaryInsights'] {
    const synergies: HierarchicalStructure['crossTechniqueAnalysis']['complementaryInsights'] = [];

    // Look for complementary insights
    if (result1.insights && result2.insights) {
      // Simple synergy detection based on complementary themes
      const themes1 = this.extractThemes(result1);
      const themes2 = this.extractThemes(result2);

      themes1.forEach(theme1 => {
        themes2.forEach(theme2 => {
          if (this.areComplementary(theme1, theme2)) {
            synergies.push({
              insight: `${theme1} + ${theme2} synergy`,
              techniques: [result1.technique, result2.technique],
              synergy: `${result1.technique}'s ${theme1} approach complements ${result2.technique}'s ${theme2} perspective`,
            });
          }
        });
      });
    }

    return synergies;
  }

  private areComplementary(theme1: string, theme2: string): boolean {
    const complementaryPairs = [
      ['innovation', 'implementation'],
      ['user experience', 'technical'],
      ['efficiency', 'quality'],
      ['scalability', 'sustainability'],
    ];

    return complementaryPairs.some(
      pair =>
        (pair.includes(theme1) && pair.includes(theme2)) ||
        (pair.includes(theme2) && pair.includes(theme1))
    );
  }

  private assessInnovation(result: ParallelResult): string {
    const innovationKeywords = ['novel', 'breakthrough', 'innovative', 'creative', 'unique'];
    let score = 0;

    if (result.insights) {
      result.insights.forEach((insight: string) => {
        innovationKeywords.forEach(keyword => {
          if (insight.toLowerCase().includes(keyword)) score++;
        });
      });
    }

    if (score >= 3) return 'High';
    if (score >= 1) return 'Medium';
    return 'Low';
  }

  private assessComplexity(result: ParallelResult): string {
    const complexityIndicators = [
      'complex',
      'difficult',
      'challenging',
      'intricate',
      'sophisticated',
    ];
    let score = 0;

    if (result.insights) {
      result.insights.forEach((insight: string) => {
        complexityIndicators.forEach(indicator => {
          if (insight.toLowerCase().includes(indicator)) score++;
        });
      });
    }

    if (score >= 3) return 'High';
    if (score >= 1) return 'Medium';
    return 'Low';
  }

  private assessUserImpact(result: ParallelResult): string {
    const userKeywords = ['user', 'customer', 'experience', 'satisfaction', 'engagement'];
    let mentions = 0;

    const text = JSON.stringify(result.insights || []);
    userKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) mentions++;
    });

    if (mentions >= 3) return 'High';
    if (mentions >= 1) return 'Medium';
    return 'Low';
  }

  private assessResourceNeeds(result: ParallelResult): string {
    const resourceKeywords = ['resource', 'budget', 'time', 'team', 'investment'];
    let mentions = 0;

    const text = JSON.stringify(result.insights || []);
    resourceKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) mentions++;
    });

    if (mentions >= 3) return 'High';
    if (mentions >= 1) return 'Medium';
    return 'Low';
  }

  private insightRelatedToDimension(
    insight: string,
    dimension: { name: string; description: string }
  ): boolean {
    const dimensionKeywords: Record<string, string[]> = {
      'Innovation Level': ['innovative', 'novel', 'creative', 'breakthrough'],
      'Implementation Complexity': ['complex', 'simple', 'difficult', 'straightforward'],
      'Risk Level': ['risk', 'danger', 'uncertainty', 'safe'],
      'User Impact': ['user', 'customer', 'experience', 'satisfaction'],
      'Resource Requirements': ['resource', 'cost', 'time', 'budget'],
    };

    const keywords = dimensionKeywords[dimension.name] || [];
    return keywords.some(keyword => insight.toLowerCase().includes(keyword));
  }

  private findBestForDimension(
    results: ParallelResult[],
    dimension: { name: string; description: string }
  ): ParallelResult | null {
    // Simple selection based on dimension
    let best: ParallelResult | null = null;
    let bestScore = -1;

    results.forEach(result => {
      const score = this.scoreTechniqueForDimension(result, dimension);
      if (score > bestScore) {
        bestScore = score;
        best = result;
      }
    });

    return best;
  }

  private scoreTechniqueForDimension(
    result: ParallelResult,
    dimension: { name: string; description: string }
  ): number {
    // Simple scoring based on evidence
    const evidence = this.extractDimensionEvidence(result, dimension);
    return evidence.length;
  }

  private describeTechniqueJourney(result: ParallelResult): string {
    const insightCount = result.insights?.length || 0;
    const descriptor = insightCount > 5 ? 'revealed numerous' : 'uncovered several';
    return `${descriptor} insights, focusing on ${this.extractThemes(result).join(' and ')} aspects of the challenge.`;
  }
}
