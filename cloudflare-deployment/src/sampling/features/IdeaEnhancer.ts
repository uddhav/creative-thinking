/**
 * Idea Enhancer
 *
 * Uses MCP Sampling to enhance creative ideas with AI
 */

import { SamplingManager } from '../SamplingManager.js';
import { createLogger, type Logger } from '../../utils/logger.js';
import type { SamplingRequest, SamplingResult } from '../types.js';

export interface EnhancementOptions {
  style?: 'creative' | 'analytical' | 'practical' | 'innovative';
  depth?: 'shallow' | 'moderate' | 'deep';
  addExamples?: boolean;
  addMetaphors?: boolean;
  addRisks?: boolean;
}

export class IdeaEnhancer {
  private logger: Logger;

  constructor(private samplingManager: SamplingManager) {
    this.logger = createLogger({}, 'IdeaEnhancer');
  }

  /**
   * Enhance a single idea
   */
  async enhanceIdea(
    idea: string,
    context?: string,
    options: EnhancementOptions = {}
  ): Promise<string> {
    if (!this.samplingManager.isAvailable()) {
      // Fallback to basic enhancement
      return this.basicEnhancement(idea);
    }

    const { style = 'creative', depth = 'moderate', addExamples, addMetaphors, addRisks } = options;

    const systemPrompt = this.buildSystemPrompt(style, depth);
    const userPrompt = this.buildUserPrompt(idea, context, { addExamples, addMetaphors, addRisks });

    const request: SamplingRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: style === 'creative' ? 0.8 : 0.6,
      maxTokens: depth === 'deep' ? 800 : depth === 'moderate' ? 500 : 300,
      modelPreferences: {
        intelligencePriority: depth === 'deep' ? 0.9 : 0.7,
        speedPriority: depth === 'shallow' ? 0.8 : 0.5,
      },
    };

    try {
      const result = await this.samplingManager.requestSampling(request, 'idea_enhancement');
      return this.formatEnhancement(idea, result.text);
    } catch (error) {
      this.logger.error('Sampling failed', error);
      return this.basicEnhancement(idea);
    }
  }

  /**
   * Enhance multiple ideas in batch
   */
  async enhanceIdeas(
    ideas: string[],
    context?: string,
    options: EnhancementOptions = {}
  ): Promise<string[]> {
    if (!this.samplingManager.isAvailable()) {
      return ideas.map(idea => this.basicEnhancement(idea));
    }

    const systemPrompt = `You are an expert idea enhancer. Improve and expand the following ideas 
    while maintaining their core essence. Be ${options.style || 'creative'} in your approach.`;

    const userPrompt = `Context: ${context || 'General creative thinking session'}
    
    Please enhance each of these ideas:
    ${ideas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}
    
    For each idea, provide:
    - An enhanced version with more detail
    - Key strengths
    - Potential applications
    ${options.addRisks ? '- Potential risks or challenges' : ''}
    
    Format as a numbered list matching the input.`;

    const request: SamplingRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 200 * ideas.length,
      modelPreferences: {
        intelligencePriority: 0.8,
        speedPriority: 0.4,
      },
    };

    try {
      const result = await this.samplingManager.requestSampling(request, 'batch_enhancement');
      return this.parseEnhancedIdeas(result.text, ideas);
    } catch (error) {
      this.logger.error('Batch enhancement failed', error);
      return ideas.map(idea => this.basicEnhancement(idea));
    }
  }

  /**
   * Generate variations of an idea
   */
  async generateVariations(
    idea: string,
    count = 3,
    style?: 'similar' | 'diverse' | 'opposite'
  ): Promise<string[]> {
    if (!this.samplingManager.isAvailable()) {
      return this.basicVariations(idea, count);
    }

    const systemPrompt = `You are a creative variation generator. Create ${count} variations 
    of the given idea that are ${
      style === 'opposite'
        ? 'contrasting or opposite'
        : style === 'diverse'
          ? 'diverse and exploring different angles'
          : 'similar but distinct'
    }.`;

    const userPrompt = `Original idea: ${idea}
    
    Generate ${count} variations that ${
      style === 'opposite'
        ? 'challenge or oppose the original concept'
        : style === 'diverse'
          ? 'explore completely different approaches'
          : 'maintain the core concept but offer unique perspectives'
    }.
    
    Format as a numbered list.`;

    const request: SamplingRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: style === 'diverse' ? 0.9 : 0.7,
      maxTokens: 150 * count,
      modelPreferences: {
        intelligencePriority: 0.7,
        speedPriority: 0.6,
      },
    };

    try {
      const result = await this.samplingManager.requestSampling(request, 'idea_variations');
      return this.parseVariations(result.text, count);
    } catch (error) {
      this.logger.error('Variation generation failed', error);
      return this.basicVariations(idea, count);
    }
  }

  /**
   * Combine multiple ideas into a synthesis
   */
  async synthesizeIdeas(ideas: string[], goal?: string): Promise<string> {
    if (!this.samplingManager.isAvailable()) {
      return this.basicSynthesis(ideas);
    }

    const systemPrompt = `You are an expert at synthesizing multiple ideas into cohesive, 
    innovative solutions. Combine ideas creatively while maintaining practical viability.`;

    const userPrompt = `${goal ? `Goal: ${goal}\n\n` : ''}Ideas to synthesize:
    ${ideas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}
    
    Create a unified solution that:
    - Combines the best aspects of each idea
    - Resolves any contradictions creatively
    - Adds emergent properties from the combination
    - Maintains practical feasibility
    
    Provide a clear, actionable synthesis.`;

    const request: SamplingRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 600,
      modelPreferences: {
        intelligencePriority: 0.9,
        speedPriority: 0.3,
      },
    };

    try {
      const result = await this.samplingManager.requestSampling(request, 'idea_synthesis');
      return this.formatSynthesis(result.text, ideas);
    } catch (error) {
      this.logger.error('Synthesis failed', error);
      return this.basicSynthesis(ideas);
    }
  }

  /**
   * Build system prompt based on style and depth
   */
  private buildSystemPrompt(style: string, depth: string): string {
    const stylePrompts = {
      creative:
        'You are a highly creative and imaginative idea enhancer who thinks outside the box.',
      analytical:
        'You are an analytical thinker who enhances ideas through logical reasoning and data.',
      practical:
        'You are a practical problem-solver who enhances ideas for real-world application.',
      innovative: 'You are an innovation expert who transforms ideas into breakthrough concepts.',
    };

    const depthPrompts = {
      shallow: 'Provide concise, focused enhancements.',
      moderate: 'Provide balanced enhancements with good detail.',
      deep: 'Provide comprehensive, thorough enhancements with extensive analysis.',
    };

    return `${stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.creative} 
    ${depthPrompts[depth as keyof typeof depthPrompts] || depthPrompts.moderate}`;
  }

  /**
   * Build user prompt with options
   */
  private buildUserPrompt(
    idea: string,
    context: string | undefined,
    options: { addExamples?: boolean; addMetaphors?: boolean; addRisks?: boolean }
  ): string {
    let prompt = `${context ? `Context: ${context}\n\n` : ''}Enhance this idea: ${idea}\n\n`;
    prompt += 'Please provide:\n';
    prompt += '- An expanded and improved version\n';
    prompt += '- Key benefits and strengths\n';

    if (options.addExamples) {
      prompt += '- Concrete examples or use cases\n';
    }
    if (options.addMetaphors) {
      prompt += '- Helpful metaphors or analogies\n';
    }
    if (options.addRisks) {
      prompt += '- Potential risks or challenges to consider\n';
    }

    prompt += '\nBe specific and actionable.';
    return prompt;
  }

  /**
   * Format the enhancement result
   */
  private formatEnhancement(originalIdea: string, enhancement: string): string {
    return `**Original Idea:** ${originalIdea}\n\n**Enhanced Version:**\n${enhancement}`;
  }

  /**
   * Parse enhanced ideas from batch response
   */
  private parseEnhancedIdeas(response: string, originalIdeas: string[]): string[] {
    const lines = response.split('\n');
    const enhanced: string[] = [];
    let currentIdea = '';
    let ideaIndex = 0;

    for (const line of lines) {
      if (/^\d+\./.test(line) && currentIdea) {
        enhanced.push(currentIdea.trim());
        currentIdea = line;
        ideaIndex++;
      } else if (line.trim()) {
        currentIdea += '\n' + line;
      }
    }

    if (currentIdea) {
      enhanced.push(currentIdea.trim());
    }

    // Ensure we have the same number of enhanced ideas
    while (enhanced.length < originalIdeas.length) {
      enhanced.push(this.basicEnhancement(originalIdeas[enhanced.length]));
    }

    return enhanced;
  }

  /**
   * Parse variations from response
   */
  private parseVariations(response: string, count: number): string[] {
    const lines = response.split('\n');
    const variations: string[] = [];

    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)/);
      if (match) {
        variations.push(match[1].trim());
      }
    }

    // Ensure we have the requested count
    while (variations.length < count) {
      variations.push(`Variation ${variations.length + 1}`);
    }

    return variations.slice(0, count);
  }

  /**
   * Format synthesis result
   */
  private formatSynthesis(synthesis: string, originalIdeas: string[]): string {
    return `**Synthesized from ${originalIdeas.length} ideas:**\n\n${synthesis}`;
  }

  /**
   * Basic enhancement fallback (no AI)
   */
  private basicEnhancement(idea: string): string {
    return `Enhanced: ${idea} (Consider implementation details, stakeholder impact, and success metrics)`;
  }

  /**
   * Basic variations fallback (no AI)
   */
  private basicVariations(idea: string, count: number): string[] {
    const variations = [];
    const prefixes = ['Alternative:', 'Variation:', 'Modified:', 'Adapted:', 'Revised:'];

    for (let i = 0; i < count; i++) {
      variations.push(`${prefixes[i % prefixes.length]} ${idea}`);
    }

    return variations;
  }

  /**
   * Basic synthesis fallback (no AI)
   */
  private basicSynthesis(ideas: string[]): string {
    return `Combined Solution: Integrating ${ideas.length} concepts - ${ideas.join(', ')}`;
  }
}
