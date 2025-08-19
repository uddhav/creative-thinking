/**
 * Base Prompt Class
 *
 * Abstract base class for all prompt implementations
 */

import type {
  IPrompt,
  PromptResult,
  PromptMessage,
  PromptContent,
  ProblemAnalysis,
  PromptMetadata,
  PromptCategory,
} from './types.js';

export abstract class BasePrompt<TArgs = any> implements IPrompt<TArgs> {
  abstract name: string;
  abstract description: string;
  abstract category: PromptCategory;

  /**
   * Generate the prompt messages
   */
  abstract generate(args: TArgs): Promise<PromptResult>;

  /**
   * Get prompt metadata for discovery
   */
  abstract getMetadata(): PromptMetadata;

  /**
   * Helper to create a text message
   */
  protected createTextMessage(role: 'user' | 'assistant', text: string): PromptMessage {
    return {
      role,
      content: { type: 'text', text },
    };
  }

  /**
   * Helper to create a message with multiple content blocks
   */
  protected createMessage(role: 'user' | 'assistant', content: PromptContent[]): PromptMessage {
    return {
      role,
      content,
    };
  }

  /**
   * Helper to create a tool use content block
   */
  protected createToolUse(toolName: string, args: Record<string, any>): PromptContent {
    return {
      type: 'tool_use',
      toolUse: {
        toolName,
        arguments: args,
      },
    };
  }

  /**
   * Helper to create a resource reference
   */
  protected createResourceReference(uri: string, text?: string): PromptContent {
    return {
      type: 'resource',
      resource: {
        uri,
        text,
      },
    };
  }

  /**
   * Analyze a problem to determine its characteristics
   */
  protected async analyzeProblem(problem: string): Promise<ProblemAnalysis> {
    // Simple heuristic analysis - could be enhanced with AI
    const problemLower = problem.toLowerCase();

    // Determine problem type
    let type: ProblemAnalysis['type'] = 'creative';
    if (
      problemLower.includes('code') ||
      problemLower.includes('bug') ||
      problemLower.includes('error')
    ) {
      type = 'technical';
    } else if (
      problemLower.includes('strategy') ||
      problemLower.includes('plan') ||
      problemLower.includes('roadmap')
    ) {
      type = 'strategic';
    } else if (
      problemLower.includes('process') ||
      problemLower.includes('efficiency') ||
      problemLower.includes('workflow')
    ) {
      type = 'operational';
    } else if (
      problemLower.includes('team') ||
      problemLower.includes('communication') ||
      problemLower.includes('conflict')
    ) {
      type = 'interpersonal';
    }

    // Determine complexity
    const wordCount = problem.split(' ').length;
    let complexity: ProblemAnalysis['complexity'] = 'simple';
    if (wordCount > 50) complexity = 'complex';
    else if (wordCount > 20) complexity = 'moderate';

    // Recommend techniques based on type
    const recommendedTechniques = this.getRecommendedTechniques(type, complexity);

    return {
      type,
      complexity,
      recommendedTechniques,
      estimatedDuration: complexity === 'simple' ? 30 : complexity === 'moderate' ? 60 : 90,
      keyConsiderations: this.getKeyConsiderations(type),
    };
  }

  /**
   * Get recommended techniques based on problem type and complexity
   */
  private getRecommendedTechniques(
    type: ProblemAnalysis['type'],
    complexity: ProblemAnalysis['complexity']
  ): string[] {
    const techniques: string[] = [];

    switch (type) {
      case 'technical':
        techniques.push('first_principles', 'triz', 'nine_windows');
        break;
      case 'creative':
        techniques.push('random_entry', 'po', 'scamper');
        break;
      case 'strategic':
        techniques.push('six_hats', 'nine_windows', 'temporal_creativity');
        break;
      case 'operational':
        techniques.push('triz', 'first_principles', 'biomimetic_path');
        break;
      case 'interpersonal':
        techniques.push('six_hats', 'disney_method', 'cross_cultural');
        break;
    }

    // Add complexity-based techniques
    if (complexity === 'complex') {
      techniques.push('meta_learning', 'quantum_superposition');
    }

    return techniques.slice(0, 3); // Return top 3 techniques
  }

  /**
   * Get key considerations based on problem type
   */
  private getKeyConsiderations(type: ProblemAnalysis['type']): string[] {
    switch (type) {
      case 'technical':
        return ['System constraints', 'Performance requirements', 'Technical debt'];
      case 'creative':
        return ['Originality', 'Feasibility', 'User appeal'];
      case 'strategic':
        return ['Long-term impact', 'Resource allocation', 'Risk assessment'];
      case 'operational':
        return ['Efficiency gains', 'Process disruption', 'Training needs'];
      case 'interpersonal':
        return ['Stakeholder buy-in', 'Cultural sensitivity', 'Communication clarity'];
    }
  }

  /**
   * Format duration for display
   */
  protected formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  }

  /**
   * Calculate phase durations for a workshop
   */
  protected calculatePhaseDurations(totalMinutes: number): {
    discovery: number;
    ideation: number;
    evaluation: number;
    planning: number;
  } {
    return {
      discovery: Math.floor(totalMinutes * 0.2),
      ideation: Math.floor(totalMinutes * 0.5),
      evaluation: Math.floor(totalMinutes * 0.2),
      planning: Math.floor(totalMinutes * 0.1),
    };
  }

  /**
   * Validate required arguments
   */
  protected validateArgs(args: any, required: string[]): void {
    for (const field of required) {
      if (!args[field]) {
        throw new Error(`Missing required argument: ${field}`);
      }
    }
  }
}
