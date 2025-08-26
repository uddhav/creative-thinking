/**
 * TechniqueAdapter - Provides technique discovery and metadata
 */

export interface TechniqueInfo {
  name: string;
  displayName: string;
  description: string;
  stepCount: number;
  category: string;
  complexity: 'low' | 'medium' | 'high';
  timeEstimate: string;
  bestFor: string[];
}

export class TechniqueAdapter {
  private techniques: Map<string, TechniqueInfo>;

  constructor() {
    this.techniques = this.initializeTechniques();
  }

  private initializeTechniques(): Map<string, TechniqueInfo> {
    const techniques = new Map<string, TechniqueInfo>();

    // Define all 21 techniques with their metadata
    const techniqueList: TechniqueInfo[] = [
      {
        name: 'six_hats',
        displayName: 'Six Thinking Hats',
        description: 'Sequential thinking with different perspectives',
        stepCount: 6,
        category: 'perspective',
        complexity: 'low',
        timeEstimate: '30-45 minutes',
        bestFor: ['team decisions', 'comprehensive analysis', 'conflict resolution'],
      },
      {
        name: 'po',
        displayName: 'Provocative Operation (PO)',
        description: 'Creative disruption through provocative statements',
        stepCount: 4,
        category: 'disruption',
        complexity: 'medium',
        timeEstimate: '20-30 minutes',
        bestFor: ['breaking assumptions', 'radical innovation', 'stuck problems'],
      },
      {
        name: 'random_entry',
        displayName: 'Random Entry',
        description: 'Lateral connections from random stimuli',
        stepCount: 3,
        category: 'association',
        complexity: 'low',
        timeEstimate: '15-20 minutes',
        bestFor: ['quick ideation', 'fresh perspectives', 'creative blocks'],
      },
      {
        name: 'scamper',
        displayName: 'SCAMPER',
        description: 'Systematic transformation checklist',
        stepCount: 8,
        category: 'transformation',
        complexity: 'medium',
        timeEstimate: '45-60 minutes',
        bestFor: ['product improvement', 'process optimization', 'iterative design'],
      },
      {
        name: 'concept_extraction',
        displayName: 'Concept Extraction',
        description: 'Abstract patterns from successful examples',
        stepCount: 4,
        category: 'abstraction',
        complexity: 'medium',
        timeEstimate: '30-40 minutes',
        bestFor: ['pattern recognition', 'best practice extraction', 'knowledge transfer'],
      },
      {
        name: 'yes_and',
        displayName: 'Yes, And...',
        description: 'Build on ideas collaboratively',
        stepCount: 4,
        category: 'collaboration',
        complexity: 'low',
        timeEstimate: '20-30 minutes',
        bestFor: ['team brainstorming', 'idea building', 'positive momentum'],
      },
      {
        name: 'design_thinking',
        displayName: 'Design Thinking',
        description: 'Human-centered design process',
        stepCount: 5,
        category: 'process',
        complexity: 'high',
        timeEstimate: '2-3 hours',
        bestFor: ['user experience', 'product design', 'service innovation'],
      },
      {
        name: 'triz',
        displayName: 'TRIZ',
        description: 'Systematic innovation methodology',
        stepCount: 4,
        category: 'systematic',
        complexity: 'high',
        timeEstimate: '45-60 minutes',
        bestFor: ['technical problems', 'contradiction resolution', 'engineering'],
      },
      {
        name: 'neural_state',
        displayName: 'Neural State Optimization',
        description: 'Optimize cognitive states for creativity',
        stepCount: 4,
        category: 'cognitive',
        complexity: 'medium',
        timeEstimate: '30-40 minutes',
        bestFor: ['mental optimization', 'creative flow', 'cognitive balance'],
      },
      {
        name: 'temporal_work',
        displayName: 'Temporal Work',
        description: 'Time-based perspective shifts',
        stepCount: 5,
        category: 'temporal',
        complexity: 'medium',
        timeEstimate: '40-50 minutes',
        bestFor: ['planning', 'timeline analysis', 'future scenarios'],
      },
      {
        name: 'cultural_integration',
        displayName: 'Cultural Integration',
        description: 'Diverse cultural perspectives synthesis',
        stepCount: 5,
        category: 'cultural',
        complexity: 'high',
        timeEstimate: '45-60 minutes',
        bestFor: ['global solutions', 'cross-cultural teams', 'diverse markets'],
      },
      {
        name: 'collective_intel',
        displayName: 'Collective Intelligence',
        description: 'Harness group wisdom',
        stepCount: 5,
        category: 'collective',
        complexity: 'high',
        timeEstimate: '60-90 minutes',
        bestFor: ['group decisions', 'crowdsourcing', 'wisdom aggregation'],
      },
      {
        name: 'disney_method',
        displayName: 'Disney Method',
        description: 'Three roles for creative planning',
        stepCount: 3,
        category: 'role-play',
        complexity: 'low',
        timeEstimate: '30-45 minutes',
        bestFor: ['creative planning', 'balanced evaluation', 'vision development'],
      },
      {
        name: 'nine_windows',
        displayName: 'Nine Windows',
        description: 'Systematic innovation matrix',
        stepCount: 9,
        category: 'systematic',
        complexity: 'high',
        timeEstimate: '60-90 minutes',
        bestFor: ['system analysis', 'comprehensive view', 'innovation mapping'],
      },
      {
        name: 'quantum_superposition',
        displayName: 'Quantum Superposition',
        description: 'Multiple contradictory states until observation',
        stepCount: 6,
        category: 'advanced',
        complexity: 'high',
        timeEstimate: '45-60 minutes',
        bestFor: ['complex decisions', 'paradox resolution', 'option preservation'],
      },
      {
        name: 'temporal_creativity',
        displayName: 'Temporal Creativity',
        description: 'Path memory with temporal analysis',
        stepCount: 6,
        category: 'temporal',
        complexity: 'high',
        timeEstimate: '60-75 minutes',
        bestFor: ['path dependency', 'historical analysis', 'future planning'],
      },
      {
        name: 'paradoxical_problem',
        displayName: 'Paradoxical Problem Solving',
        description: 'Breakthrough through contradiction embrace',
        stepCount: 5,
        category: 'paradox',
        complexity: 'high',
        timeEstimate: '45-60 minutes',
        bestFor: ['contradictions', 'paradoxes', 'impossible problems'],
      },
      {
        name: 'meta_learning',
        displayName: 'Meta-Learning',
        description: 'Self-improving pattern recognition',
        stepCount: 5,
        category: 'meta',
        complexity: 'high',
        timeEstimate: '50-60 minutes',
        bestFor: ['learning optimization', 'pattern extraction', 'knowledge synthesis'],
      },
      {
        name: 'biomimetic_path',
        displayName: 'Biomimetic Path Management',
        description: 'Biological solutions and evolution',
        stepCount: 6,
        category: 'nature',
        complexity: 'high',
        timeEstimate: '60-75 minutes',
        bestFor: ['sustainable design', 'adaptive systems', 'resilience'],
      },
      {
        name: 'first_principles',
        displayName: 'First Principles Thinking',
        description: 'Deconstruct to fundamental truths and rebuild',
        stepCount: 4,
        category: 'fundamental',
        complexity: 'medium',
        timeEstimate: '45-60 minutes',
        bestFor: ['complex problems', 'assumption breaking', 'innovation'],
      },
      {
        name: 'neuro_computational',
        displayName: 'Neuro-Computational Synthesis',
        description: 'Neural network-inspired computational creativity',
        stepCount: 6,
        category: 'computational',
        complexity: 'high',
        timeEstimate: '60-90 minutes',
        bestFor: ['AI-assisted creativity', 'pattern synthesis', 'optimization'],
      },
      {
        name: 'criteria_based_analysis',
        displayName: 'Criteria-Based Analysis',
        description: 'Systematic truth verification through established criteria',
        stepCount: 5,
        category: 'analytical',
        complexity: 'medium',
        timeEstimate: '30-45 minutes',
        bestFor: ['validity assessment', 'truth verification', 'decision confidence'],
      },
      {
        name: 'linguistic_forensics',
        displayName: 'Linguistic Forensics',
        description: 'Deep analysis of communication patterns for hidden insights',
        stepCount: 6,
        category: 'analytical',
        complexity: 'high',
        timeEstimate: '45-60 minutes',
        bestFor: ['communication analysis', 'stakeholder understanding', 'authenticity detection'],
      },
      {
        name: 'competing_hypotheses',
        displayName: 'Competing Hypotheses Analysis',
        description: 'Systematic evaluation of multiple explanations using evidence matrices',
        stepCount: 8,
        category: 'analytical',
        complexity: 'high',
        timeEstimate: '60-90 minutes',
        bestFor: ['complex decisions', 'uncertainty quantification', 'avoiding confirmation bias'],
      },
    ];

    for (const technique of techniqueList) {
      techniques.set(technique.name, technique);
    }

    return techniques;
  }

  async discoverTechniques(params: {
    problem: string;
    context?: string;
    constraints?: string[];
    domain?: string;
  }): Promise<any> {
    const { problem, context, constraints, domain } = params;

    // Analyze problem characteristics
    const analysis = this.analyzeProblem(problem, context, domain);

    // Score and rank techniques
    const recommendations = this.rankTechniques(analysis, constraints);

    return {
      problem,
      analysis,
      recommendations: recommendations.slice(0, 5), // Top 5 recommendations
      allTechniques: Array.from(this.techniques.values()).map(t => ({
        name: t.name,
        displayName: t.displayName,
        category: t.category,
      })),
    };
  }

  private analyzeProblem(problem: string, context?: string, domain?: string): any {
    const fullText = `${problem} ${context || ''} ${domain || ''}`.toLowerCase();

    return {
      hasContradiction:
        fullText.includes('but') || fullText.includes('however') || fullText.includes('conflict'),
      needsCreativity:
        fullText.includes('new') ||
        fullText.includes('innovative') ||
        fullText.includes('creative'),
      isSystemic:
        fullText.includes('system') ||
        fullText.includes('process') ||
        fullText.includes('workflow'),
      requiresCollaboration:
        fullText.includes('team') || fullText.includes('group') || fullText.includes('together'),
      isTechnical:
        fullText.includes('technical') ||
        fullText.includes('engineering') ||
        fullText.includes('code'),
      needsPerspectives:
        fullText.includes('perspective') ||
        fullText.includes('viewpoint') ||
        fullText.includes('opinion'),
      needsValidation:
        fullText.includes('verify') ||
        fullText.includes('validate') ||
        fullText.includes('truth') ||
        fullText.includes('authentic') ||
        fullText.includes('decision') ||
        fullText.includes('evidence'),
      complexity: this.assessComplexity(problem),
      domain: domain || this.detectDomain(fullText),
    };
  }

  private assessComplexity(problem: string): 'low' | 'medium' | 'high' {
    const words = problem.split(' ').length;
    const sentences = problem.split(/[.!?]/).filter(s => s.trim()).length;

    if (words < 20 && sentences <= 1) return 'low';
    if (words < 50 && sentences <= 3) return 'medium';
    return 'high';
  }

  private detectDomain(text: string): string {
    if (text.includes('software') || text.includes('code') || text.includes('app'))
      return 'technology';
    if (text.includes('business') || text.includes('market') || text.includes('customer'))
      return 'business';
    if (text.includes('design') || text.includes('user') || text.includes('experience'))
      return 'design';
    if (text.includes('team') || text.includes('people') || text.includes('culture'))
      return 'organizational';
    return 'general';
  }

  private rankTechniques(analysis: any, constraints?: string[]): any[] {
    const scores = new Map<string, number>();

    for (const [name, technique] of this.techniques) {
      let score = 0;

      // Score based on problem analysis
      if (analysis.hasContradiction && ['triz', 'paradoxical_problem'].includes(name)) score += 3;
      if (analysis.needsCreativity && ['po', 'random_entry', 'scamper'].includes(name)) score += 3;
      if (
        analysis.isSystemic &&
        ['nine_windows', 'design_thinking', 'first_principles'].includes(name)
      )
        score += 3;
      if (
        analysis.requiresCollaboration &&
        ['yes_and', 'collective_intel', 'six_hats'].includes(name)
      )
        score += 3;
      if (
        analysis.isTechnical &&
        ['triz', 'first_principles', 'neuro_computational'].includes(name)
      )
        score += 3;
      if (
        analysis.needsPerspectives &&
        ['six_hats', 'disney_method', 'cultural_integration'].includes(name)
      )
        score += 3;
      if (
        analysis.needsValidation &&
        ['criteria_based_analysis', 'linguistic_forensics', 'competing_hypotheses'].includes(name)
      )
        score += 3;

      // Adjust for complexity match
      if (technique.complexity === analysis.complexity) score += 2;

      // Check constraints
      if (constraints) {
        if (constraints.includes('quick') && technique.complexity === 'low') score += 2;
        if (constraints.includes('thorough') && technique.complexity === 'high') score += 2;
      }

      scores.set(name, score);
    }

    // Sort by score and return recommendations
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, score]) => {
        const technique = this.techniques.get(name)!;
        return {
          technique: name,
          displayName: technique.displayName,
          score,
          reason: this.generateReason(technique, analysis),
          stepCount: technique.stepCount,
          timeEstimate: technique.timeEstimate,
          complexity: technique.complexity,
        };
      });
  }

  private generateReason(technique: TechniqueInfo, analysis: any): string {
    const reasons = [];

    if (analysis.hasContradiction && ['triz', 'paradoxical_problem'].includes(technique.name)) {
      reasons.push('Excellent for resolving contradictions');
    }
    if (analysis.needsCreativity && technique.category === 'disruption') {
      reasons.push('Breaks conventional thinking patterns');
    }
    if (analysis.isSystemic && technique.category === 'systematic') {
      reasons.push('Provides systematic analysis framework');
    }
    if (analysis.requiresCollaboration && technique.category === 'collaboration') {
      reasons.push('Facilitates team collaboration');
    }

    if (reasons.length === 0) {
      reasons.push(`Well-suited for ${technique.bestFor[0]}`);
    }

    return reasons.join('; ');
  }

  getTechnique(name: string): TechniqueInfo | undefined {
    return this.techniques.get(name);
  }

  getAllTechniques(): TechniqueInfo[] {
    return Array.from(this.techniques.values());
  }
}
