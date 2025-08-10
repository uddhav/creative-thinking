/**
 * IdeaEnhancer
 * Uses MCP Sampling to enhance creative ideas with AI
 */

import type { SamplingManager } from '../SamplingManager.js';
import type { EnhancedIdea, SamplingError } from '../types.js';

export class IdeaEnhancer {
  constructor(private samplingManager: SamplingManager) {}

  /**
   * Enhance an idea using AI
   */
  async enhance(idea: string, technique: string, context?: string): Promise<EnhancedIdea> {
    try {
      // Check if sampling is available
      if (!this.samplingManager.isAvailable()) {
        return this.fallbackEnhancement(idea);
      }

      const result = await this.samplingManager.requestSampling(
        {
          messages: [
            {
              role: 'system',
              content: this.buildSystemPrompt(technique),
            },
            {
              role: 'user',
              content: this.buildUserPrompt(idea, context),
            },
          ],
          modelPreferences: {
            hints: ['creative', 'practical', 'innovative'],
            intelligencePriority: 0.8,
            speedPriority: 0.5,
          },
          temperature: 0.7,
          maxTokens: 800,
        },
        'idea_enhancement'
      );

      return this.parseEnhancement(idea, result.content);
    } catch (error) {
      console.error('[IdeaEnhancer] Enhancement failed:', error);
      return this.handleError(idea, error as SamplingError);
    }
  }

  /**
   * Enhance multiple ideas in batch
   */
  async enhanceBatch(
    ideas: Array<{ idea: string; technique: string }>,
    context?: string
  ): Promise<EnhancedIdea[]> {
    const enhancements = await Promise.allSettled(
      ideas.map(({ idea, technique }) => this.enhance(idea, technique, context))
    );

    return enhancements.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`[IdeaEnhancer] Failed to enhance idea ${index}:`, result.reason);
        return this.fallbackEnhancement(ideas[index].idea);
      }
    });
  }

  /**
   * Build system prompt for enhancement
   */
  private buildSystemPrompt(technique: string): string {
    return `You are an expert creative consultant specializing in idea enhancement. 
You are enhancing ideas generated through the ${technique} lateral thinking technique.

Your enhancements should:
1. Maintain the core creative essence of the original idea
2. Add practical implementation details
3. Identify unique value propositions
4. Suggest innovative features that amplify the idea's potential
5. Consider feasibility without limiting creativity

Format your response as a structured enhancement with clear sections.`;
  }

  /**
   * Build user prompt for enhancement
   */
  private buildUserPrompt(idea: string, context?: string): string {
    let prompt = `Please enhance the following creative idea:

Original Idea: ${idea}`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `

Provide an enhanced version that includes:
1. ENHANCED IDEA: An expanded and refined version of the original idea
2. ADDITIONAL FEATURES: 3-5 innovative features that could be added
3. IMPLEMENTATION CONSIDERATIONS: Key technical or practical considerations
4. UNIQUE VALUE PROPOSITIONS: 2-3 unique benefits or differentiators
5. POTENTIAL CHALLENGES: Brief mention of potential obstacles and solutions

Keep the enhancement creative yet actionable.`;

    return prompt;
  }

  /**
   * Parse AI response into structured enhancement
   */
  private parseEnhancement(originalIdea: string, aiResponse: string): EnhancedIdea {
    const enhancement: EnhancedIdea = {
      original: originalIdea,
      enhanced: '',
      features: [],
      implementation: [],
      valueProps: [],
    };

    try {
      // Parse sections from AI response
      const sections = this.parseSections(aiResponse);

      // Extract enhanced idea
      enhancement.enhanced = sections['ENHANCED IDEA'] || this.extractFirstParagraph(aiResponse);

      // Extract features
      if (sections['ADDITIONAL FEATURES']) {
        enhancement.features = this.extractBulletPoints(sections['ADDITIONAL FEATURES']);
      }

      // Extract implementation considerations
      if (sections['IMPLEMENTATION CONSIDERATIONS']) {
        enhancement.implementation = this.extractBulletPoints(
          sections['IMPLEMENTATION CONSIDERATIONS']
        );
      }

      // Extract value propositions
      if (sections['UNIQUE VALUE PROPOSITIONS']) {
        enhancement.valueProps = this.extractBulletPoints(sections['UNIQUE VALUE PROPOSITIONS']);
      }

      // If enhanced idea is still empty, use the full response
      if (!enhancement.enhanced) {
        enhancement.enhanced = aiResponse.substring(0, 500);
      }
    } catch (error) {
      console.error('[IdeaEnhancer] Failed to parse AI response:', error);
      enhancement.enhanced = aiResponse.substring(0, 500);
    }

    return enhancement;
  }

  /**
   * Parse sections from AI response
   */
  private parseSections(text: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check if line is a section header (contains a colon and is in caps or numbered)
      if (/^[A-Z\s]+:|^\d+\.\s+[A-Z\s]+:/i.test(line)) {
        // Save previous section
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        // Start new section
        currentSection = line.replace(/^(\d+\.\s+)?([^:]+):.*/, '$2').trim();
        currentContent = [line.substring(line.indexOf(':') + 1).trim()];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  /**
   * Extract bullet points from text
   */
  private extractBulletPoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Match various bullet point formats
      if (/^[-•*]\s+/.test(trimmed)) {
        points.push(trimmed.replace(/^[-•*]\s+/, '').trim());
      } else if (/^\d+[.)]\s+/.test(trimmed)) {
        points.push(trimmed.replace(/^\d+[.)]\s+/, '').trim());
      } else if (trimmed && !points.length) {
        // If no bullets found, split by sentence
        const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim());
        points.push(...sentences.map(s => s.trim()));
      }
    }

    return points.filter(p => p.length > 10); // Filter out very short items
  }

  /**
   * Extract first meaningful paragraph
   */
  private extractFirstParagraph(text: string): string {
    const paragraphs = text.split('\n\n').filter(p => p.trim());
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed.length > 50 && !trimmed.startsWith('#')) {
        return trimmed;
      }
    }
    return text.substring(0, 500);
  }

  /**
   * Fallback enhancement when AI is not available
   */
  private fallbackEnhancement(idea: string): EnhancedIdea {
    return {
      original: idea,
      enhanced: `${idea} (Consider adding user feedback mechanisms, scalability features, and integration capabilities)`,
      features: [
        'User feedback and rating system',
        'Analytics and reporting dashboard',
        'API for third-party integrations',
        'Mobile-responsive design',
        'Automated testing and quality assurance',
      ],
      implementation: [
        'Start with MVP to validate core concept',
        'Use agile development methodology',
        'Implement continuous integration/deployment',
        'Consider cloud-native architecture',
      ],
      valueProps: [
        'Solves a specific user pain point',
        'Offers unique approach compared to alternatives',
        'Scalable and adaptable to different contexts',
      ],
    };
  }

  /**
   * Handle enhancement errors
   */
  private handleError(idea: string, error: SamplingError): EnhancedIdea {
    console.error('[IdeaEnhancer] Error:', error.code, error.message);

    switch (error.code) {
      case 'rate_limit_exceeded':
        // Return basic enhancement with rate limit notice
        return {
          original: idea,
          enhanced: `${idea} (Enhancement temporarily limited due to rate limits)`,
          features: ['Contact support for enhanced features'],
        };

      case 'timeout':
        // Return partial enhancement
        return {
          original: idea,
          enhanced: `${idea} (Quick enhancement: Focus on user value and scalability)`,
          features: ['User-centric design', 'Scalable architecture'],
        };

      default:
        // Return fallback enhancement
        return this.fallbackEnhancement(idea);
    }
  }

  /**
   * Generate enhancement prompt for specific technique
   */
  getTechniqueSpecificPrompt(technique: string): string {
    const prompts: Record<string, string> = {
      six_hats: 'Focus on balancing logical, creative, and critical perspectives',
      scamper: 'Emphasize the transformative aspects and combinations',
      po: 'Maintain the provocative element while adding practicality',
      random_entry: 'Preserve the unexpected connections while adding structure',
      concept_extraction: 'Build on the abstracted concepts with concrete applications',
      yes_and: 'Continue the collaborative building approach',
      design_thinking: 'Emphasize user empathy and iterative refinement',
      triz: 'Apply systematic innovation principles',
      quantum_superposition: 'Explore multiple simultaneous solution states',
      temporal_creativity: 'Consider past patterns and future implications',
      paradoxical_problem: 'Embrace contradictions as features',
    };

    return prompts[technique] || 'Enhance with creativity and practicality';
  }
}
