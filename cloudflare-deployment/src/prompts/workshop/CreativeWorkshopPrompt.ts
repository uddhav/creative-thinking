/**
 * Creative Workshop Prompt
 *
 * Facilitates a complete creative thinking workshop
 */

import { BasePrompt } from '../BasePrompt.js';
import type {
  WorkshopArgs,
  PromptResult,
  PromptMessage,
  PromptMetadata,
  PromptCategory,
} from '../types.js';

export class CreativeWorkshopPrompt extends BasePrompt<WorkshopArgs> {
  name = 'creative_workshop';
  description = 'Facilitate a complete creative thinking workshop';
  category: PromptCategory = 'workshop' as PromptCategory;

  async generate(args: WorkshopArgs): Promise<PromptResult> {
    // Validate required arguments
    this.validateArgs(args, ['topic']);

    // Set defaults
    const duration = args.duration || 60;
    const participants = args.participants || 'individual';
    const objectives = args.objectives || [];

    // Analyze the topic to determine best techniques
    const analysis = await this.analyzeProblem(args.topic);

    // Calculate phase durations
    const phases = this.calculatePhaseDurations(duration);

    // Generate workshop messages
    const messages: PromptMessage[] = [];

    // System context
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `I'll facilitate a ${this.formatDuration(duration)} creative workshop on "${args.topic}".`,
        },
      ],
    });

    // User request
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: this.formatUserRequest(args.topic, duration, participants, objectives),
        },
      ],
    });

    // Assistant response with structured plan
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatWorkshopPlan(args.topic, phases, analysis),
        },
        // Include tool use for technique discovery
        {
          type: 'tool_use',
          toolUse: {
            toolName: 'discover_techniques',
            arguments: {
              problem: args.topic,
              context: objectives.join(', '),
            },
          },
        },
      ],
    });

    // Add interactive elements
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatInteractiveStart(analysis.recommendedTechniques),
        },
      ],
    });

    // Reference relevant resources
    if (duration > 30) {
      messages.push({
        role: 'assistant',
        content: [
          {
            type: 'resource',
            resource: {
              uri: 'docs://techniques/overview',
              text: 'View all available techniques',
            },
          },
          {
            type: 'resource',
            resource: {
              uri: 'session://current/state',
              text: 'Track workshop progress',
            },
          },
        ],
      });
    }

    return {
      description: `Creative workshop for "${args.topic}" (${this.formatDuration(duration)})`,
      messages,
    };
  }

  private formatUserRequest(
    topic: string,
    duration: number,
    participants: string,
    objectives: string[]
  ): string {
    let request = `Let's run a creative workshop!\n\n`;
    request += `Topic: ${topic}\n`;
    request += `Duration: ${this.formatDuration(duration)}\n`;
    request += `Participants: ${participants}\n`;

    if (objectives.length > 0) {
      request += `\nObjectives:\n`;
      objectives.forEach(obj => {
        request += `• ${obj}\n`;
      });
    }

    request += `\nPlease guide me through a structured creative thinking process.`;
    return request;
  }

  private formatWorkshopPlan(topic: string, phases: any, analysis: any): string {
    let plan = `## Creative Workshop Plan: "${topic}"\n\n`;

    plan += `Based on my analysis, this appears to be a ${analysis.type} challenge with ${analysis.complexity} complexity.\n\n`;

    plan += `### Workshop Structure\n\n`;

    plan += `**1. Discovery Phase** (${phases.discovery} min)\n`;
    plan += `   - Understand the challenge from multiple angles\n`;
    plan += `   - Identify constraints and opportunities\n`;
    plan += `   - Select optimal thinking techniques\n\n`;

    plan += `**2. Ideation Phase** (${phases.ideation} min)\n`;
    plan += `   - Apply ${analysis.recommendedTechniques.join(', ')}\n`;
    plan += `   - Generate diverse solution options\n`;
    plan += `   - Build on initial ideas\n\n`;

    plan += `**3. Evaluation Phase** (${phases.evaluation} min)\n`;
    plan += `   - Assess feasibility and impact\n`;
    plan += `   - Identify risks and mitigation strategies\n`;
    plan += `   - Prioritize solutions\n\n`;

    plan += `**4. Action Planning** (${phases.planning} min)\n`;
    plan += `   - Define concrete next steps\n`;
    plan += `   - Assign responsibilities (if team)\n`;
    plan += `   - Set success metrics\n\n`;

    // Add key considerations
    plan += `### Key Considerations\n`;
    analysis.keyConsiderations.forEach((consideration: string) => {
      plan += `• ${consideration}\n`;
    });

    return plan;
  }

  private formatInteractiveStart(techniques: string[]): string {
    let start = `### Ready to Begin?\n\n`;
    start += `I'll guide you through this workshop using the following techniques:\n\n`;

    techniques.forEach(technique => {
      start += `• **${this.formatTechniqueName(technique)}**: ${this.getTechniqueDescription(technique)}\n`;
    });

    start += `\nWhen you're ready, we'll start with the Discovery Phase. `;
    start += `I'll help you explore your challenge from multiple perspectives to ensure we have a complete understanding.\n\n`;
    start += `**Shall we begin with analyzing your challenge?**`;

    return start;
  }

  private formatTechniqueName(technique: string): string {
    return technique
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getTechniqueDescription(technique: string): string {
    const descriptions: Record<string, string> = {
      six_hats: 'Explore from six different thinking perspectives',
      po: 'Use provocative operations to break conventional thinking',
      random_entry: 'Generate ideas using random stimuli',
      scamper: 'Transform ideas through systematic modifications',
      first_principles: 'Break down to fundamentals and rebuild',
      triz: 'Apply inventive principles to solve contradictions',
      nine_windows: 'Analyze across time and system levels',
      temporal_creativity: 'Explore temporal dimensions of solutions',
      disney_method: 'Balance dreamer, realist, and critic perspectives',
      quantum_superposition: 'Hold multiple solution states simultaneously',
      meta_learning: 'Learn from the learning process itself',
      biomimetic_path: "Draw inspiration from nature's solutions",
    };

    return descriptions[technique] || 'Apply creative thinking technique';
  }

  getMetadata(): PromptMetadata {
    return {
      name: this.name,
      category: this.category,
      description: this.description,
      tags: ['workshop', 'facilitation', 'brainstorming', 'ideation', 'team'],
      difficulty: 'intermediate',
      estimatedTime: '30-120 minutes',
      prerequisites: ['Basic understanding of creative thinking'],
    };
  }
}
