/**
 * Problem Solver Prompt
 *
 * Comprehensive problem-solving wizard that guides users through systematic problem analysis
 */

import { BasePrompt } from '../BasePrompt.js';
import type {
  ProblemSolverArgs,
  PromptResult,
  PromptMessage,
  PromptMetadata,
  PromptCategory,
} from '../types.js';

export class ProblemSolverPrompt extends BasePrompt<ProblemSolverArgs> {
  name = 'problem_solver';
  description = 'Comprehensive problem-solving wizard';
  category: PromptCategory = 'problem_solving' as PromptCategory;

  async generate(args: ProblemSolverArgs): Promise<PromptResult> {
    // Validate required arguments
    this.validateArgs(args, ['problem']);

    // Analyze the problem
    const analysis = await this.analyzeProblem(args.problem);

    // Generate problem-solving messages
    const messages: PromptMessage[] = [];

    // System context
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'I am a systematic problem-solving wizard using creative thinking techniques.',
        },
      ],
    });

    // User problem statement
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: this.formatProblemStatement(args),
        },
      ],
    });

    // Initial analysis and approach
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatInitialAnalysis(args.problem, analysis),
        },
      ],
    });

    // Discovery phase with tool use
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: '## Phase 1: Problem Discovery\n\nLet me analyze your problem from multiple dimensions to ensure we understand all aspects.',
        },
        {
          type: 'tool_use',
          toolUse: {
            toolName: 'discover_techniques',
            arguments: {
              problem: args.problem,
              context: args.context,
              domain: analysis.type,
            },
          },
        },
      ],
    });

    // Planning phase
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatPlanningPhase(analysis),
        },
        {
          type: 'tool_use',
          toolUse: {
            toolName: 'plan_thinking_session',
            arguments: {
              problem: args.problem,
              techniques: analysis.recommendedTechniques,
              objectives: args.desired_outcome ? [args.desired_outcome] : undefined,
              timeframe:
                analysis.complexity === 'simple'
                  ? 'quick'
                  : analysis.complexity === 'moderate'
                    ? 'thorough'
                    : 'comprehensive',
            },
          },
        },
      ],
    });

    // Execution guidance
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: this.formatExecutionGuidance(analysis, args.desired_outcome),
        },
      ],
    });

    // Reference resources for tracking
    messages.push({
      role: 'assistant',
      content: [
        {
          type: 'resource',
          resource: {
            uri: 'session://current/state',
            text: 'Track problem-solving progress',
          },
        },
        {
          type: 'resource',
          resource: {
            uri: 'metrics://flexibility/current',
            text: 'Monitor solution flexibility',
          },
        },
      ],
    });

    return {
      description: `Problem-solving wizard for: "${args.problem.substring(0, 50)}..."`,
      messages,
    };
  }

  private formatProblemStatement(args: ProblemSolverArgs): string {
    let statement = `Problem: ${args.problem}`;

    if (args.context) {
      statement += `\n\nContext: ${args.context}`;
    }

    if (args.desired_outcome) {
      statement += `\n\nDesired Outcome: ${args.desired_outcome}`;
    }

    return statement;
  }

  private formatInitialAnalysis(problem: string, analysis: any): string {
    let response = `## Problem Analysis\n\n`;
    response += `I'll help you solve this problem systematically.\n\n`;

    response += `### Problem Classification\n`;
    response += `- **Type**: ${this.formatType(analysis.type)} problem\n`;
    response += `- **Complexity**: ${analysis.complexity}\n`;
    response += `- **Estimated Time**: ${this.formatDuration(analysis.estimatedDuration)}\n\n`;

    response += `### Recommended Approach\n`;
    response += `Based on my analysis, this problem would benefit from:\n`;
    analysis.recommendedTechniques.forEach((technique: string) => {
      response += `- **${this.formatTechniqueName(technique)}**: ${this.getTechniqueBenefit(technique, analysis.type)}\n`;
    });

    response += `\n### Key Considerations\n`;
    analysis.keyConsiderations.forEach((consideration: string) => {
      response += `• ${consideration}\n`;
    });

    return response;
  }

  private formatPlanningPhase(analysis: any): string {
    let plan = `## Phase 2: Solution Planning\n\n`;
    plan += `Now I'll create a structured approach using the ${analysis.recommendedTechniques.join(', ')} techniques.\n\n`;

    plan += `### Solution Framework\n`;
    plan += `1. **Generate Options** - Create multiple solution paths\n`;
    plan += `2. **Evaluate Feasibility** - Assess each option's viability\n`;
    plan += `3. **Identify Risks** - Anticipate potential issues\n`;
    plan += `4. **Select Approach** - Choose the optimal solution\n`;
    plan += `5. **Plan Implementation** - Define concrete steps\n\n`;

    plan += `Let me set up a thinking session tailored to your problem:`;

    return plan;
  }

  private formatExecutionGuidance(analysis: any, desiredOutcome?: string): string {
    let guidance = `## Phase 3: Creative Execution\n\n`;
    guidance += `### Ready to Generate Solutions\n\n`;

    guidance += `We'll now work through the selected techniques to generate innovative solutions.\n\n`;

    if (desiredOutcome) {
      guidance += `**Target Outcome**: ${desiredOutcome}\n\n`;
    }

    guidance += `### Process Steps\n`;
    guidance += `1. **Divergent Thinking** - Generate many ideas without judgment\n`;
    guidance += `2. **Pattern Recognition** - Identify themes and connections\n`;
    guidance += `3. **Convergent Thinking** - Refine and combine best elements\n`;
    guidance += `4. **Solution Validation** - Test against requirements\n\n`;

    guidance += `### Interactive Guidance\n`;
    guidance += `I'll guide you through each technique step-by-step. `;
    guidance += `At each stage, I'll:\n`;
    guidance += `- Explain what we're doing and why\n`;
    guidance += `- Provide examples and prompts\n`;
    guidance += `- Track your ideas and insights\n`;
    guidance += `- Help evaluate and refine solutions\n\n`;

    guidance += `**Ready to begin the first technique?**`;

    return guidance;
  }

  private formatType(type: string): string {
    const typeNames: Record<string, string> = {
      technical: 'Technical',
      creative: 'Creative',
      strategic: 'Strategic',
      operational: 'Operational',
      interpersonal: 'Interpersonal',
    };
    return typeNames[type] || 'General';
  }

  private formatTechniqueName(technique: string): string {
    return technique
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getTechniqueBenefit(technique: string, problemType: string): string {
    const benefits: Record<string, Record<string, string>> = {
      first_principles: {
        technical: 'Break down complex systems to core components',
        default: 'Understand fundamental truths',
      },
      six_hats: {
        interpersonal: 'Consider all stakeholder perspectives',
        strategic: 'Evaluate from multiple strategic angles',
        default: 'Systematic multi-perspective analysis',
      },
      triz: {
        technical: 'Resolve technical contradictions',
        operational: 'Optimize processes systematically',
        default: 'Apply proven innovation patterns',
      },
      random_entry: {
        creative: 'Break creative blocks with unexpected connections',
        default: 'Generate fresh perspectives',
      },
      po: {
        creative: 'Challenge assumptions creatively',
        default: 'Provocative thinking for breakthroughs',
      },
      scamper: {
        creative: 'Transform ideas systematically',
        default: 'Modify and improve existing solutions',
      },
      nine_windows: {
        strategic: 'Analyze across time and scale',
        technical: 'Understand system dependencies',
        default: 'Comprehensive system view',
      },
      temporal_creativity: {
        strategic: 'Plan for future scenarios',
        default: 'Time-based solution development',
      },
      disney_method: {
        interpersonal: 'Balance different team perspectives',
        default: 'Dream, plan, and critique systematically',
      },
      cross_cultural: {
        interpersonal: 'Bridge cultural differences',
        default: 'Diverse perspective integration',
      },
      biomimetic_path: {
        operational: 'Learn from natural efficiency',
        default: 'Nature-inspired solutions',
      },
      meta_learning: {
        complex: 'Learn from the problem-solving process',
        default: 'Improve while solving',
      },
      quantum_superposition: {
        complex: 'Handle multiple solution states',
        default: 'Parallel solution exploration',
      },
    };

    const techniqueBenefits = benefits[technique] || {};
    return (
      techniqueBenefits[problemType] || techniqueBenefits['default'] || 'Apply creative thinking'
    );
  }

  getMetadata(): PromptMetadata {
    return {
      name: this.name,
      category: this.category,
      description: this.description,
      tags: ['problem-solving', 'wizard', 'systematic', 'analysis', 'solutions'],
      difficulty: 'beginner',
      estimatedTime: '15-90 minutes',
      prerequisites: [],
    };
  }
}
