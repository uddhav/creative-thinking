/**
 * MemoryContextGenerator - Handles memory context generation for problem analysis
 * Extracted from discoverTechniques to improve maintainability
 */

export class MemoryContextGenerator {
  /**
   * Generate observation about the problem for memory context
   */
  generateObservation(
    problem: string,
    context: string | undefined,
    category: string,
    constraints: string[] | undefined
  ): string {
    const constraintText =
      constraints && constraints.length > 0
        ? ` with ${constraints.length} constraint${constraints.length > 1 ? 's' : ''}`
        : '';

    const contextText = context ? ' in a specific context' : '';

    return `This ${category} challenge${contextText}${constraintText} focuses on: ${problem}`;
  }

  /**
   * Generate historical relevance for similar problems
   */
  generateHistoricalRelevance(category: string, preferredOutcome: string | undefined): string {
    const outcomeMap: Record<string, string> = {
      innovative: 'breakthrough solutions through divergent thinking',
      systematic: 'structured approaches and methodical analysis',
      'risk-aware': 'balanced solutions considering potential pitfalls',
      collaborative: 'collective intelligence and diverse perspectives',
      analytical: 'deep understanding and root cause analysis',
    };

    const outcomeText =
      preferredOutcome && outcomeMap[preferredOutcome]
        ? outcomeMap[preferredOutcome]
        : 'creative problem-solving';

    const categoryInsights: Record<string, string> = {
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
  generateSearchableFactors(
    problem: string,
    context: string | undefined,
    category: string,
    constraints: string[] | undefined
  ): string[] {
    const factors: string[] = [`${category} problem`];

    // Add key problem terms
    const problemWords = problem
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !['the', 'and', 'for', 'with', 'that'].includes(word));
    factors.push(...problemWords.slice(0, 3).map(w => `${w} challenge`));

    // Add constraint types
    if (constraints && constraints.length > 0) {
      constraints.forEach(constraint => {
        if (constraint.toLowerCase().includes('time')) factors.push('time constraint');
        if (constraint.toLowerCase().includes('budget')) factors.push('budget constraint');
        if (constraint.toLowerCase().includes('resource')) factors.push('resource constraint');
        if (constraint.toLowerCase().includes('technical')) factors.push('technical constraint');
      });
    }

    // Add context indicators
    if (context) {
      if (context.toLowerCase().includes('team')) factors.push('team context');
      if (context.toLowerCase().includes('user')) factors.push('user context');
      if (context.toLowerCase().includes('market')) factors.push('market context');
    }

    // Add complexity level
    factors.push(`${category} complexity`);

    return [...new Set(factors)]; // Remove duplicates
  }
}
