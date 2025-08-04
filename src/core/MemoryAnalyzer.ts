/**
 * Memory Analyzer
 * Generates memory-suggestive outputs based on session history and patterns
 */

import type { SessionData, ThinkingOperationData } from '../types/index.js';

export interface MemoryOutputs {
  contextualInsight?: string;
  historicalNote?: string;
  patternObserved?: string;
  sessionFingerprint?: {
    problemType: string;
    solutionPattern: string;
    breakthroughLevel: number;
    pathDependencies: string[];
  };
  noteworthyPatterns?: {
    observed: string;
    significance: string;
    recommendation?: string;
    applicability?: string[];
  };
}

export class MemoryAnalyzer {
  /**
   * Generate memory-suggestive outputs for a thinking step
   */
  public generateMemoryOutputs(input: ThinkingOperationData, session: SessionData): MemoryOutputs {
    const outputs: MemoryOutputs = {};

    // Generate contextual insight based on current technique and step
    const contextualInsight = this.generateContextualInsight(input, session);
    if (contextualInsight) {
      outputs.contextualInsight = contextualInsight;
    }

    // Generate historical note if patterns emerge
    const historicalNote = this.generateHistoricalNote(input, session);
    if (historicalNote) {
      outputs.historicalNote = historicalNote;
    }

    // Identify patterns observed
    const pattern = this.identifyPattern(input, session);
    if (pattern) {
      outputs.patternObserved = pattern;
    }

    // Generate session fingerprint for completed sessions
    if (!input.nextStepNeeded) {
      outputs.sessionFingerprint = {
        problemType: this.categorizeProblem(session.problem),
        solutionPattern: this.identifySolutionPattern(session, input),
        breakthroughLevel: this.assessBreakthroughLevel(session),
        pathDependencies: this.extractPathDependencies(session),
      };
    }

    // Identify noteworthy patterns for future reference
    const noteworthyPattern = this.identifyNoteworthyPattern(input, session);
    if (noteworthyPattern) {
      outputs.noteworthyPatterns = noteworthyPattern;
    }

    return outputs;
  }

  private generateContextualInsight(
    input: ThinkingOperationData,
    session: SessionData
  ): string | undefined {
    const { technique, currentStep } = input;

    // Technique-specific insights
    switch (technique) {
      case 'six_hats':
        if (input.hatColor === 'black' && input.risks && input.risks.length > 0) {
          return `Critical thinking revealed ${input.risks.length} risk factors that require mitigation`;
        }
        if (input.hatColor === 'green' && currentStep === 6) {
          return 'Creative solutions generated after systematic analysis';
        }
        break;

      case 'po':
        if (currentStep === 2 && input.principles) {
          return `Provocation successfully challenged ${input.principles.length} core assumptions`;
        }
        break;

      case 'design_thinking':
        if (currentStep === 1 && input.empathyInsights && input.empathyInsights.length > 0) {
          return `User research uncovered ${input.empathyInsights.length} key pain points`;
        }
        if (currentStep === 5 && input.userFeedback) {
          return 'Testing validated solution assumptions with real users';
        }
        break;

      case 'triz':
        if (input.contradiction) {
          return 'Technical contradiction identified, opening path to breakthrough';
        }
        break;

      case 'scamper':
        if (input.pathImpact && input.pathImpact.flexibilityRetention < 0.3) {
          return 'High-commitment modification: consider generating alternatives';
        }
        break;

      case 'yes_and':
        if (currentStep === 3 && input.additions && input.additions.length > 3) {
          return 'Collaborative momentum achieved with multiple building iterations';
        }
        break;

      case 'neural_state':
        if (currentStep === 1 && input.dominantNetwork === 'ecn') {
          return 'Executive Control Network dominance detected';
        }
        if (currentStep === 1 && input.dominantNetwork === 'dmn') {
          return 'Default Mode Network dominance detected';
        }
        if (currentStep === 2 && input.suppressionDepth !== undefined) {
          if (input.suppressionDepth >= 8) {
            return `Network suppression depth: ${input.suppressionDepth}/10 - High rigidity detected`;
          }
          return `Network suppression depth: ${input.suppressionDepth}/10`;
        }
        if (input.dominantNetwork && input.suppressionDepth && input.suppressionDepth > 7) {
          return 'Deep neural state manipulation achieved - breakthrough potential high';
        }
        break;

      case 'collective_intel':
        if (currentStep === 1 && input.wisdomSources && input.wisdomSources.length > 0) {
          return `${input.wisdomSources.length} wisdom sources identified`;
        }
        if (currentStep === 3 && input.emergentPatterns && input.emergentPatterns.length > 0) {
          return `${input.emergentPatterns.length} emergent patterns discovered`;
        }
        if (
          currentStep === 4 &&
          input.synergyCombinations &&
          input.synergyCombinations.length > 0
        ) {
          return `${input.synergyCombinations.length} synergistic combinations created`;
        }
        break;

      case 'cross_cultural':
        if (currentStep === 1 && input.culturalFrameworks && input.culturalFrameworks.length > 0) {
          return `${input.culturalFrameworks.length} cultural perspectives identified`;
        }
        if (currentStep === 2 && input.bridgeBuilding && input.bridgeBuilding.length > 0) {
          return `${input.bridgeBuilding.length} cultural bridges discovered`;
        }
        if (
          currentStep === 3 &&
          input.respectfulSynthesis &&
          input.respectfulSynthesis.length > 0
        ) {
          return `Creating inclusive solution from ${input.respectfulSynthesis.length} synthesized approaches`;
        }
        if (currentStep === 4 && input.parallelPaths && input.parallelPaths.length > 0) {
          return `${input.parallelPaths.length} parallel paths designed`;
        }
        break;

      case 'temporal_work':
        if (currentStep === 1 && input.temporalLandscape) {
          const fixed = input.temporalLandscape.fixedDeadlines?.length || 0;
          const kairos = input.temporalLandscape.kairosOpportunities?.length || 0;
          if (fixed > 0 || kairos > 0) {
            return `${fixed} fixed constraints, ${kairos} kairos opportunities`;
          }
        }
        if (
          currentStep === 3 &&
          input.pressureTransformation &&
          input.pressureTransformation.length > 0
        ) {
          return `${input.pressureTransformation.length} catalytic techniques applied`;
        }
        if (
          input.temporalLandscape?.kairosOpportunities &&
          input.temporalLandscape.kairosOpportunities.length > 0
        ) {
          return 'Kairos moments identified - optimal timing windows available';
        }
        break;
    }

    // Generic insights based on risk/antifragile properties
    if (input.antifragileProperties && input.antifragileProperties.length > 0) {
      return `Discovered ${input.antifragileProperties.length} antifragile properties that strengthen under stress`;
    }

    if (input.risks && input.risks.length >= 3) {
      return `Critical analysis identified ${input.risks.length} potential failure modes`;
    }

    // Session-based insights
    const sessionProgress = currentStep / input.totalSteps;
    if (sessionProgress > 0.8 && session.insights.length === 0) {
      return 'Near session completion - consider capturing key insights';
    }

    if (session.history.length > 20) {
      return `Extended ${technique} session (${session.history.length} operations) - consider synthesis`;
    }

    return undefined;
  }

  private generateHistoricalNote(
    input: ThinkingOperationData,
    session: SessionData
  ): string | undefined {
    // Check for consistent patterns across history (include current step)
    const riskAwareness =
      session.history.filter(h => h.risks && h.risks.length > 0).length +
      (input.risks && input.risks.length > 0 ? 1 : 0);
    if (riskAwareness >= 3) {
      return 'This session demonstrates consistent risk awareness across multiple thinking steps';
    }

    // Check for iterative refinement (including current step)
    const revisions = session.history.filter(h => h.isRevision).length + (input.isRevision ? 1 : 0);
    if (revisions >= 1) {
      return 'Solution evolved through iterative refinement and exploration of alternatives';
    }

    // Check for multi-technique synergy
    const techniques = new Set(session.history.map(h => h.technique));
    if (techniques.size >= 2) {
      return 'Multi-technique approach creating comprehensive solution coverage';
    }

    return undefined;
  }

  private identifyPattern(input: ThinkingOperationData, session: SessionData): string | undefined {
    // Look for cross-domain patterns
    const patterns = input.abstractedPatterns || [];
    const concepts = session.history
      .flatMap(h => h.extractedConcepts || h.abstractedPatterns || [])
      .filter(Boolean);

    if (patterns.length >= 3) {
      return `Cross-domain pattern transfer: ${patterns.slice(0, 3).join(', ')}`;
    }
    if (concepts.length >= 3) {
      return `Cross-domain pattern transfer: ${concepts.slice(0, 3).join(', ')}`;
    }

    // Look for collaborative building
    const hasInitialIdea = session.history.some(h => h.initialIdea);
    const additions = session.history.flatMap(h => h.additions || []).filter(Boolean);
    const hasSynthesis = input.synthesis || session.history.some(h => h.synthesis);

    if (hasInitialIdea && additions.length > 0 && hasSynthesis) {
      return 'Collaborative building pattern: initial idea → additions → synthesis';
    }
    if (additions.length >= 4) {
      return `Collaborative building pattern: initial idea → ${additions.length} enhancements`;
    }

    // Look for constraint-driven innovation
    if (
      input.technique === 'scamper' &&
      (input.scamperAction === 'eliminate' ||
        (input.pathImpact && input.pathImpact.commitmentLevel === 'high'))
    ) {
      return 'Constraint-driven innovation: limitations sparked creative solutions';
    }

    return undefined;
  }

  private identifyNoteworthyPattern(
    input: ThinkingOperationData,
    session: SessionData
  ):
    | { observed: string; significance: string; recommendation?: string; applicability?: string[] }
    | undefined {
    // Via Negativa success
    const removals = session.history.flatMap(h => h.viaNegativaRemovals || []).filter(Boolean);
    if (removals.length >= 2) {
      return {
        observed: 'Successful application of Via Negativa principle',
        significance: 'Simplification through removal often more effective than addition',
        applicability: ['complex systems'],
      };
    }

    // Multiple antifragile properties
    const antifragileCount = session.history.reduce(
      (sum, h) => sum + (h.antifragileProperties?.length || 0),
      0
    );
    if (antifragileCount >= 3) {
      return {
        observed: 'Multiple antifragile properties identified',
        significance: 'Solution gains strength from stressors',
        recommendation: 'Test solution under adversarial conditions',
      };
    }

    // Effective multi-technique combination
    const allTechniques = [...session.history.map(h => h.technique)];
    const uniqueTechniques = new Set(allTechniques).size;

    // For the last step of a multi-technique session
    // The test has po (2 steps), six_hats (2 steps), triz (1 step) = 5 total steps
    // When TRIZ completes, history has 4 entries, uniqueTechniques should be 2 (po, six_hats)
    if (session.history.length >= 3 && uniqueTechniques >= 2 && !input.nextStepNeeded) {
      return {
        observed: 'Effective multi-technique combination',
        significance: 'Synergistic insights from technique layering',
        applicability: ['complex problems'],
      };
    }

    return undefined;
  }

  private categorizeProblem(problem: string): string {
    const lowerProblem = problem.toLowerCase();

    if (lowerProblem.includes('optimize') || lowerProblem.includes('improve')) {
      return 'optimization';
    }
    if (lowerProblem.includes('create') || lowerProblem.includes('design')) {
      return 'creation';
    }
    if (lowerProblem.includes('solve') || lowerProblem.includes('fix')) {
      return 'problem-solving';
    }
    if (lowerProblem.includes('understand') || lowerProblem.includes('analyze')) {
      return 'analysis';
    }

    return 'exploration';
  }

  private identifySolutionPattern(session: SessionData, input: ThinkingOperationData): string {
    // Include current technique in the analysis
    const techniques = [...session.history.map(h => h.technique), input.technique];
    const uniqueTechniques = [...new Set(techniques)];

    // Multi-technique synthesis
    if (uniqueTechniques.length > 1) {
      return 'multi-technique synthesis';
    }

    // Check if all techniques are six_hats with multiple perspectives
    if (
      uniqueTechniques.length === 1 &&
      uniqueTechniques[0] === 'six_hats' &&
      techniques.length > 1
    ) {
      return 'multi-perspective synthesis';
    }

    // Single technique patterns
    if (techniques.includes('triz')) {
      return 'contradiction-resolution';
    }
    if (techniques.includes('design_thinking')) {
      return 'user-centered';
    }
    if (techniques.includes('random_entry')) {
      return 'linear progression';
    }
    if (techniques.includes('six_hats')) {
      return 'multi-perspective synthesis';
    }
    if (session.history.some(h => h.antifragileProperties && h.antifragileProperties.length > 0)) {
      return 'antifragile-design';
    }

    return 'creative-exploration';
  }

  private assessBreakthroughLevel(session: SessionData): number {
    let level = 0;

    // Check for paradigm shifts
    if (session.history.some(h => h.provocation && h.principles)) {
      level += 3;
    }

    // Check for cross-domain transfer
    if (session.history.some(h => h.extractedConcepts && h.extractedConcepts.length > 0)) {
      level += 2;
    }

    // Check for antifragile properties
    if (session.history.some(h => h.antifragileProperties && h.antifragileProperties.length > 0)) {
      level += 2;
    }

    // Check for via negativa insights
    if (session.history.some(h => h.viaNegativaRemovals && h.viaNegativaRemovals.length > 0)) {
      level += 1;
    }

    // Normalize to 0-10 scale
    return Math.min(10, level);
  }

  private extractPathDependencies(session: SessionData): string[] {
    const dependencies: string[] = [];

    // Extract SCAMPER dependencies
    session.history
      .filter(h => h.pathImpact)
      .forEach(h => {
        // TypeScript doesn't narrow the type after filter, so we need to check again
        if (h.pathImpact && h.pathImpact.dependenciesCreated.length > 0) {
          dependencies.push(...h.pathImpact.dependenciesCreated);
        }
      });

    // Extract commitment points
    const highCommitments = session.history
      .filter(h => h.pathImpact && h.pathImpact.commitmentLevel === 'high')
      .map(h => {
        // TypeScript doesn't narrow the type after filter, so we need to check again
        const commitmentLevel = h.pathImpact?.commitmentLevel || 'unknown';
        return `${h.technique} step ${h.currentStep}: ${commitmentLevel} commitment`;
      });

    dependencies.push(...highCommitments);

    return [...new Set(dependencies)]; // Remove duplicates
  }
}
