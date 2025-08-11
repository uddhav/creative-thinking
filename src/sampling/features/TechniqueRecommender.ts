/**
 * TechniqueRecommender
 * Uses MCP Sampling to recommend next best techniques
 */

import type { SamplingManager } from '../SamplingManager.js';
import type { TechniqueRecommendation, SamplingError } from '../types.js';
import type { LateralTechnique } from '../../types/index.js';

export interface SessionState {
  problem: string;
  techniquesUsed: LateralTechnique[];
  ideasGenerated: number;
  flexibilityScore?: number;
  duration: number; // in minutes
  currentMomentum?: 'high' | 'medium' | 'low';
  userPreference?: 'creative' | 'analytical' | 'systematic' | 'rapid';
  domain?: string;
}

export class TechniqueRecommender {
  private readonly allTechniques: LateralTechnique[] = [
    'six_hats',
    'scamper',
    'po',
    'random_entry',
    'concept_extraction',
    'yes_and',
    'design_thinking',
    'triz',
    'neural_state',
    'temporal_work',
    'cross_cultural',
    'collective_intel',
    'disney_method',
    'nine_windows',
    'quantum_superposition',
    'temporal_creativity',
    'paradoxical_problem',
  ];

  constructor(private samplingManager: SamplingManager) {}

  /**
   * Recommend next technique based on session state
   */
  async recommendNextTechnique(state: SessionState): Promise<TechniqueRecommendation> {
    try {
      // Check if sampling is available
      if (!this.samplingManager.isAvailable()) {
        return this.fallbackRecommendation(state);
      }

      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(),
            },
            {
              role: 'user',
              content: this.buildUserPrompt(state),
            },
          ],
          modelPreferences: {
            hints: ['analytical', 'strategic'],
            intelligencePriority: 0.7,
            speedPriority: 0.7,
          },
          temperature: 0.5,
          maxTokens: 600,
        },
        'technique_recommendation'
      );

      return this.parseRecommendation(result.content, state);
    } catch (error) {
      console.error('[TechniqueRecommender] Recommendation failed:', error);
      return this.handleError(state, error as SamplingError);
    }
  }

  /**
   * Get multiple technique recommendations
   */
  async recommendMultipleTechniques(
    state: SessionState,
    count: number = 3
  ): Promise<TechniqueRecommendation[]> {
    try {
      const primary = await this.recommendNextTechnique(state);

      if (!primary.alternatives || primary.alternatives.length < count - 1) {
        // Generate additional alternatives
        const alternatives = this.generateAlternatives(state, count - 1, primary.technique);
        primary.alternatives = alternatives;
      }

      return [
        primary,
        ...(primary.alternatives?.slice(0, count - 1).map(alt => ({
          technique: alt.technique,
          reasoning: alt.reasoning,
          expectedBenefits: this.getExpectedBenefits(alt.technique as LateralTechnique),
          confidence: 0.7,
        })) || []),
      ];
    } catch (error) {
      console.error('[TechniqueRecommender] Multiple recommendations failed:', error);
      return [this.fallbackRecommendation(state)];
    }
  }

  /**
   * Build system prompt for recommendations
   */
  private buildSystemPrompt(): string {
    return `You are an expert in creative thinking methodologies and lateral thinking techniques.
Your role is to recommend the most appropriate next technique based on the current session state.

Consider:
1. Which techniques have already been used (avoid repetition unless beneficial)
2. The current momentum and energy level
3. The type of problem being solved
4. The user's preferred thinking style
5. Time constraints and session duration
6. The need for diverse perspectives

Your recommendations should:
- Build on previous insights
- Introduce complementary perspectives
- Maintain or boost momentum
- Be practical given time constraints
- Maximize creative output

Available techniques and their strengths:
- six_hats: Systematic exploration of different perspectives
- scamper: Transformation and modification of existing ideas
- po: Provocative thinking to break patterns
- random_entry: Unexpected connections and associations
- concept_extraction: Abstract thinking and pattern recognition
- yes_and: Collaborative building and expansion
- design_thinking: User-centered problem solving
- triz: Systematic innovation and contradiction resolution
- neural_state: Cognitive state optimization
- temporal_work: Time-based analysis and futures thinking
- cross_cultural: Diverse cultural perspectives
- collective_intel: Crowd wisdom and emergence
- disney_method: Dreamer-realist-critic cycle
- nine_windows: System-level thinking across time
- quantum_superposition: Multiple simultaneous solutions
- temporal_creativity: Past-present-future integration
- paradoxical_problem: Embracing contradictions`;
  }

  /**
   * Build user prompt for recommendation
   */
  private buildUserPrompt(state: SessionState): string {
    const usedTechniques = state.techniquesUsed.join(', ') || 'none';
    const momentum = state.currentMomentum || 'medium';
    const preference = state.userPreference || 'balanced';

    return `Recommend the next best creative thinking technique for this session:

PROBLEM: ${state.problem}
TECHNIQUES ALREADY USED: ${usedTechniques}
IDEAS GENERATED SO FAR: ${state.ideasGenerated}
SESSION DURATION: ${state.duration} minutes
CURRENT MOMENTUM: ${momentum}
USER PREFERENCE: ${preference} thinking
${state.domain ? `DOMAIN: ${state.domain}` : ''}
${state.flexibilityScore ? `FLEXIBILITY SCORE: ${state.flexibilityScore}/10` : ''}

Please provide:

1. RECOMMENDED TECHNIQUE: [technique_name]

2. REASONING: Why this technique is best next (2-3 sentences)

3. EXPECTED BENEFITS: 3 specific benefits of using this technique now

4. ALTERNATIVE TECHNIQUES: 2 other good options with brief reasoning

5. CONFIDENCE: Your confidence in this recommendation (0.0-1.0)

Focus on maximizing creative output and maintaining session flow.`;
  }

  /**
   * Parse AI response into recommendation
   */
  private parseRecommendation(aiResponse: string, state: SessionState): TechniqueRecommendation {
    const recommendation: TechniqueRecommendation = {
      technique: '',
      reasoning: '',
      expectedBenefits: [],
      alternatives: [],
      confidence: 0.7,
    };

    try {
      // Extract recommended technique
      const techniqueMatch = aiResponse.match(/RECOMMENDED TECHNIQUE[:\s]*\[?([^\]\n]+)\]?/i);
      if (techniqueMatch) {
        const suggested = this.normalizedTechniqueName(techniqueMatch[1]);
        if (this.isValidTechnique(suggested)) {
          recommendation.technique = suggested;
        }
      }

      // Extract reasoning
      const reasoningMatch = aiResponse.match(/REASONING[:\s]*([^\n]+(?:\n[^\n]+)?)/i);
      if (reasoningMatch) {
        recommendation.reasoning = reasoningMatch[1].trim();
      }

      // Extract expected benefits
      const benefitsSection = this.extractSection(aiResponse, 'EXPECTED BENEFITS');
      if (benefitsSection) {
        recommendation.expectedBenefits = this.extractBulletPoints(benefitsSection).slice(0, 3);
      }

      // Extract alternatives
      const alternativesSection = this.extractSection(aiResponse, 'ALTERNATIVE');
      if (alternativesSection) {
        recommendation.alternatives = this.extractAlternatives(alternativesSection);
      }

      // Extract confidence
      const confidenceMatch = aiResponse.match(/CONFIDENCE[:\s]*([0-9.]+)/i);
      if (confidenceMatch) {
        recommendation.confidence = Math.min(1, Math.max(0, parseFloat(confidenceMatch[1])));
      }

      // Fallback if no technique extracted
      if (!recommendation.technique) {
        recommendation.technique = this.selectFallbackTechnique(state);
        recommendation.reasoning = 'Selected based on session analysis';
        recommendation.confidence = 0.6;
      }

      // Ensure we have benefits
      if (recommendation.expectedBenefits.length === 0) {
        recommendation.expectedBenefits = this.getExpectedBenefits(
          recommendation.technique as LateralTechnique
        );
      }
    } catch (error) {
      console.error('[TechniqueRecommender] Failed to parse AI response:', error);
      return this.fallbackRecommendation(state);
    }

    return recommendation;
  }

  /**
   * Extract section from response
   */
  private extractSection(text: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}[^:]*:([^\\n]+(?:\\n(?![A-Z]+:)[^\\n]+)*)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract bullet points
   */
  private extractBulletPoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^[-•*]\s+/.test(trimmed)) {
        points.push(trimmed.replace(/^[-•*]\s+/, '').trim());
      } else if (/^\d+[.)]\s+/.test(trimmed)) {
        points.push(trimmed.replace(/^\d+[.)]\s+/, '').trim());
      } else if (trimmed.length > 20) {
        points.push(trimmed);
      }
    }

    return points.filter(p => p.length > 10);
  }

  /**
   * Extract alternative techniques
   */
  private extractAlternatives(text: string): TechniqueRecommendation['alternatives'] {
    const alternatives: NonNullable<TechniqueRecommendation['alternatives']> = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Look for technique names in the line
      for (const technique of this.allTechniques) {
        if (trimmed.toLowerCase().includes(technique.replace('_', ' '))) {
          // Extract reasoning after dash or colon
          const reasonMatch = trimmed.match(/[-:]\s*(.+)/);
          alternatives.push({
            technique,
            reasoning: reasonMatch ? reasonMatch[1].trim() : 'Alternative technique option',
          });
          break;
        }
      }

      if (alternatives.length >= 2) break;
    }

    return alternatives;
  }

  /**
   * Normalize technique name
   */
  private normalizedTechniqueName(name: string): string {
    const normalized = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]/g, '');

    // Map common variations
    const mappings: Record<string, LateralTechnique> = {
      six_thinking_hats: 'six_hats',
      '6_hats': 'six_hats',
      provocative_operation: 'po',
      random_input: 'random_entry',
      yes_and_thinking: 'yes_and',
      dt: 'design_thinking',
      neural: 'neural_state',
      temporal: 'temporal_work',
      cross_cultural_work: 'cross_cultural',
      collective: 'collective_intel',
      disney: 'disney_method',
      '9_windows': 'nine_windows',
      quantum: 'quantum_superposition',
      paradox: 'paradoxical_problem',
    };

    return mappings[normalized] || normalized;
  }

  /**
   * Check if technique is valid
   */
  private isValidTechnique(technique: string): boolean {
    return this.allTechniques.includes(technique as LateralTechnique);
  }

  /**
   * Select fallback technique based on state
   */
  private selectFallbackTechnique(state: SessionState): string {
    const unused = this.allTechniques.filter(t => !state.techniquesUsed.includes(t));

    if (unused.length === 0) {
      // All techniques used, recommend based on performance
      if (state.ideasGenerated < 5) return 'random_entry';
      if (state.flexibilityScore && state.flexibilityScore < 5) return 'po';
      return 'six_hats'; // Good for comprehensive review
    }

    // Select based on preferences and state
    if (state.userPreference === 'creative' && unused.includes('random_entry')) {
      return 'random_entry';
    }
    if (state.userPreference === 'analytical' && unused.includes('triz')) {
      return 'triz';
    }
    if (state.userPreference === 'systematic' && unused.includes('six_hats')) {
      return 'six_hats';
    }
    if (state.userPreference === 'rapid' && unused.includes('yes_and')) {
      return 'yes_and';
    }

    // Select based on momentum
    if (state.currentMomentum === 'low' && unused.includes('po')) {
      return 'po'; // Provocative to boost energy
    }
    if (state.currentMomentum === 'high' && unused.includes('scamper')) {
      return 'scamper'; // Build on high energy
    }

    // Default to first unused
    return unused[0];
  }

  /**
   * Get expected benefits for a technique
   */
  private getExpectedBenefits(technique: LateralTechnique): string[] {
    const benefits: Record<LateralTechnique, string[]> = {
      six_hats: [
        'Systematic coverage of all perspectives',
        'Reduced conflict through structured thinking',
        'Balanced decision-making',
      ],
      scamper: [
        'Transform existing ideas into new variations',
        'Systematic modification approach',
        'Discover hidden potential in current solutions',
      ],
      po: [
        'Break free from conventional thinking',
        'Generate provocative new directions',
        'Challenge assumptions effectively',
      ],
      random_entry: [
        'Create unexpected connections',
        'Stimulate fresh perspectives',
        'Bypass mental blocks',
      ],
      concept_extraction: [
        'Identify underlying patterns',
        'Abstract thinking for broader applications',
        'Transfer solutions across domains',
      ],
      yes_and: [
        'Build on ideas collaboratively',
        'Maintain positive momentum',
        'Expand possibilities rapidly',
      ],
      design_thinking: [
        'User-centered solutions',
        'Iterative refinement',
        'Practical prototyping focus',
      ],
      triz: [
        'Systematic innovation methodology',
        'Resolve contradictions effectively',
        'Apply proven innovation patterns',
      ],
      neural_state: [
        'Optimize cognitive performance',
        'Balance focused and diffuse thinking',
        'Enhance creative flow',
      ],
      temporal_work: [
        'Explore time-based perspectives',
        'Identify temporal patterns',
        'Future-proof solutions',
      ],
      cross_cultural: [
        'Diverse cultural insights',
        'Broaden solution space',
        'Inclusive innovation',
      ],
      collective_intel: [
        'Harness collective wisdom',
        'Emergent solution discovery',
        'Distributed problem-solving',
      ],
      disney_method: [
        'Balance dreams with reality',
        'Structured creative process',
        'Critical evaluation integration',
      ],
      nine_windows: ['System-level thinking', 'Temporal-spatial analysis', 'Holistic problem view'],
      quantum_superposition: [
        'Explore multiple solutions simultaneously',
        'Embrace contradictory states',
        'Context-dependent optimization',
      ],
      temporal_creativity: [
        'Integrate past wisdom with future vision',
        'Time-based innovation',
        'Historical pattern application',
      ],
      paradoxical_problem: [
        'Transcend contradictions',
        'Find synthesis in opposition',
        'Innovative paradox resolution',
      ],
      meta_learning: [
        'Learn from patterns across techniques',
        'Self-improving integration strategies',
        'Adaptive technique selection',
      ],
    };

    return (
      benefits[technique] || [
        'Explore new perspectives',
        'Generate additional ideas',
        'Enhance creativity',
      ]
    );
  }

  /**
   * Generate alternative recommendations
   */
  private generateAlternatives(
    state: SessionState,
    count: number,
    exclude: string
  ): Array<{ technique: string; reasoning: string }> {
    const alternatives: Array<{ technique: string; reasoning: string }> = [];
    const unused = this.allTechniques.filter(
      t => !state.techniquesUsed.includes(t) && t !== exclude
    );

    // Prioritize by different criteria
    const priorities = [
      { technique: 'six_hats', reasoning: 'Comprehensive systematic exploration' },
      { technique: 'scamper', reasoning: 'Transform and build on existing ideas' },
      { technique: 'random_entry', reasoning: 'Inject fresh unexpected perspectives' },
      { technique: 'design_thinking', reasoning: 'Focus on user-centered solutions' },
      { technique: 'triz', reasoning: 'Apply systematic innovation principles' },
    ];

    for (const priority of priorities) {
      if (unused.includes(priority.technique as LateralTechnique) && alternatives.length < count) {
        alternatives.push(priority);
      }
    }

    // Fill remaining with unused techniques
    for (const technique of unused) {
      if (alternatives.length >= count) break;
      if (!alternatives.find(a => a.technique === technique)) {
        alternatives.push({
          technique,
          reasoning: `Explore ${technique.replace('_', ' ')} perspective`,
        });
      }
    }

    return alternatives;
  }

  /**
   * Fallback recommendation when AI is not available
   */
  private fallbackRecommendation(state: SessionState): TechniqueRecommendation {
    const technique = this.selectFallbackTechnique(state);

    return {
      technique,
      reasoning: `Based on ${state.ideasGenerated} ideas generated and ${state.duration} minutes elapsed, ${technique} can provide fresh perspectives`,
      expectedBenefits: this.getExpectedBenefits(technique as LateralTechnique),
      alternatives: this.generateAlternatives(state, 2, technique),
      confidence: 0.7,
    };
  }

  /**
   * Handle recommendation errors
   */
  private handleError(state: SessionState, error: SamplingError): TechniqueRecommendation {
    console.error('[TechniqueRecommender] Error:', error.code, error.message);
    return this.fallbackRecommendation(state);
  }
}
