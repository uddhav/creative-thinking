/**
 * Prompt Registry
 *
 * Central registry for managing all MCP prompts
 */

import type { IPrompt, PromptMetadata, PromptCategory } from './types.js';
import { BasePrompt } from './BasePrompt.js';

export class PromptRegistry {
  private prompts: Map<string, BasePrompt> = new Map();
  private metadata: Map<string, PromptMetadata> = new Map();

  /**
   * Register a prompt
   */
  register(prompt: BasePrompt): void {
    if (this.prompts.has(prompt.name)) {
      throw new Error(`Prompt '${prompt.name}' is already registered`);
    }

    this.prompts.set(prompt.name, prompt);
    this.metadata.set(prompt.name, prompt.getMetadata());
  }

  /**
   * Get a prompt by name
   */
  get(name: string): BasePrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * Check if a prompt exists
   */
  has(name: string): boolean {
    return this.prompts.has(name);
  }

  /**
   * List all prompts
   */
  list(): Array<{ name: string; description: string; category: PromptCategory }> {
    return Array.from(this.prompts.values()).map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      category: prompt.category,
    }));
  }

  /**
   * List prompts by category
   */
  listByCategory(category: PromptCategory): BasePrompt[] {
    return Array.from(this.prompts.values()).filter(prompt => prompt.category === category);
  }

  /**
   * Get prompt metadata
   */
  getMetadata(name: string): PromptMetadata | undefined {
    return this.metadata.get(name);
  }

  /**
   * Search prompts by tags
   */
  searchByTags(tags: string[]): BasePrompt[] {
    const results: BasePrompt[] = [];

    for (const [name, meta] of this.metadata.entries()) {
      const hasTag = tags.some(tag => meta.tags.includes(tag));
      if (hasTag) {
        const prompt = this.prompts.get(name);
        if (prompt) results.push(prompt);
      }
    }

    return results;
  }

  /**
   * Get prompts by difficulty level
   */
  getByDifficulty(level: 'beginner' | 'intermediate' | 'advanced'): BasePrompt[] {
    const results: BasePrompt[] = [];

    for (const [name, meta] of this.metadata.entries()) {
      if (meta.difficulty === level) {
        const prompt = this.prompts.get(name);
        if (prompt) results.push(prompt);
      }
    }

    return results;
  }

  /**
   * Get prompt recommendations based on problem description
   */
  recommend(problemDescription: string): BasePrompt[] {
    const keywords = this.extractKeywords(problemDescription);
    const scores = new Map<string, number>();

    // Score each prompt based on keyword matches
    for (const [name, meta] of this.metadata.entries()) {
      let score = 0;

      // Check description matches
      for (const keyword of keywords) {
        if (meta.description.toLowerCase().includes(keyword)) {
          score += 2;
        }
        if (meta.tags.some(tag => tag.toLowerCase().includes(keyword))) {
          score += 1;
        }
      }

      if (score > 0) {
        scores.set(name, score);
      }
    }

    // Sort by score and return top prompts
    const sorted = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return sorted
      .map(([name]) => this.prompts.get(name))
      .filter((prompt): prompt is BasePrompt => prompt !== undefined);
  }

  /**
   * Extract keywords from text for matching
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'as',
      'is',
      'was',
      'are',
      'were',
      'been',
      'be',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'should',
      'could',
      'may',
      'might',
      'must',
      'can',
      'cannot',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'what',
      'which',
      'who',
      'when',
      'where',
      'why',
      'how',
      'this',
      'that',
      'these',
      'those',
      'my',
      'your',
      'his',
      'her',
    ]);

    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Clear all registered prompts
   */
  clear(): void {
    this.prompts.clear();
    this.metadata.clear();
  }

  /**
   * Get statistics about registered prompts
   */
  getStats(): {
    total: number;
    byCategory: Record<PromptCategory, number>;
    byDifficulty: Record<string, number>;
  } {
    const stats = {
      total: this.prompts.size,
      byCategory: {} as Record<PromptCategory, number>,
      byDifficulty: {
        beginner: 0,
        intermediate: 0,
        advanced: 0,
      },
    };

    for (const meta of this.metadata.values()) {
      // Count by category
      stats.byCategory[meta.category] = (stats.byCategory[meta.category] || 0) + 1;

      // Count by difficulty
      stats.byDifficulty[meta.difficulty]++;
    }

    return stats;
  }
}
