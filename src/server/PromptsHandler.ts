/**
 * PromptsHandler - MCP prompts for guided lateral thinking sessions
 * Provides pre-configured prompts to help users effectively use the server
 */

import type { Prompt, PromptArgument } from '@modelcontextprotocol/sdk/types.js';

export class PromptsHandler {
  /**
   * Get all available prompts
   */
  getPrompts(): Prompt[] {
    return [
      {
        name: 'problem-discovery',
        description: 'Discover the best lateral thinking techniques for your specific problem',
        arguments: [
          {
            name: 'problem',
            description: 'The problem or challenge you want to solve',
            required: true,
          },
          {
            name: 'context',
            description: 'Additional context about the situation',
            required: false,
          },
          {
            name: 'constraints',
            description: 'Any limitations or constraints (comma-separated)',
            required: false,
          },
          {
            name: 'preferred_outcome',
            description:
              'Type of solution preferred: innovative, systematic, risk-aware, collaborative, analytical',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'creative-brainstorming',
        description: 'Generate creative solutions using multiple lateral thinking perspectives',
        arguments: [
          {
            name: 'problem',
            description: 'The problem requiring creative solutions',
            required: true,
          },
          {
            name: 'techniques',
            description:
              'Comma-separated list of techniques to use (or leave empty for recommendations)',
            required: false,
          },
          {
            name: 'depth',
            description: 'How thorough: quick, thorough, or comprehensive',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'risk-analysis',
        description:
          'Analyze potential risks, failure modes, and black swan events for your solution',
        arguments: [
          {
            name: 'problem',
            description: 'The problem or solution to analyze',
            required: true,
          },
          {
            name: 'solution_context',
            description: 'Description of the proposed solution',
            required: false,
          },
          {
            name: 'critical_factors',
            description: 'Critical success factors to consider',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'complete-session',
        description: 'Run a complete guided lateral thinking session from problem to solution',
        arguments: [
          {
            name: 'problem',
            description: 'The problem to solve comprehensively',
            required: true,
          },
          {
            name: 'session_type',
            description: 'Type of session: exploration, solution, implementation',
            required: false,
          },
          {
            name: 'time_available',
            description: 'Time constraint: quick (5 min), standard (15 min), extended (30+ min)',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'quantum-thinking',
        description:
          'Explore multiple contradictory solutions simultaneously using quantum superposition',
        arguments: [
          {
            name: 'problem',
            description: 'Problem with contradictory constraints or solutions',
            required: true,
          },
          {
            name: 'contradictions',
            description: 'Key contradictions to maintain in superposition',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'temporal-creativity',
        description: 'Apply temporal thinking with path memory to track decision impacts over time',
        arguments: [
          {
            name: 'problem',
            description: 'Problem requiring temporal analysis',
            required: true,
          },
          {
            name: 'time_horizon',
            description: 'Time horizon to consider: short-term, medium-term, long-term',
            required: false,
          },
          {
            name: 'flexibility_concern',
            description: 'Current flexibility score if known (0.0-1.0)',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'persona-thinking',
        description: 'Solve a problem through the lens of a specific thinking personality',
        arguments: [
          {
            name: 'problem',
            description: 'The problem or challenge to solve',
            required: true,
          },
          {
            name: 'persona',
            description:
              'Thinking personality: rory_sutherland, rich_hickey, joe_armstrong, tarantino, security_engineer, veritasium, design_thinker, nassim_taleb, or custom:description',
            required: true,
          },
          {
            name: 'depth',
            description: 'How thorough: quick, thorough, or comprehensive',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'persona-debate',
        description: 'Stage a debate between multiple thinking personalities on a problem',
        arguments: [
          {
            name: 'problem',
            description: 'The problem or topic for debate',
            required: true,
          },
          {
            name: 'personas',
            description:
              'Comma-separated list of personas (e.g., "rich_hickey,joe_armstrong,nassim_taleb")',
            required: true,
          },
          {
            name: 'format',
            description: 'Debate format: structured, adversarial, or collaborative',
            required: false,
          },
        ] as PromptArgument[],
      },
      {
        name: 'rory-mode',
        description:
          "Apply Rory Sutherland's behavioral economics lens to find counterintuitive solutions",
        arguments: [
          {
            name: 'problem',
            description: 'The problem to analyze through a behavioral economics lens',
            required: true,
          },
          {
            name: 'focus_rules',
            description:
              'Comma-separated rule numbers to focus on (1-11). Leave empty for automatic selection',
            required: false,
          },
        ] as PromptArgument[],
      },
    ];
  }

  /**
   * Get a specific prompt by name
   */
  getPrompt(name: string): {
    description: string;
    messages: Array<{
      role: 'user' | 'assistant';
      content: {
        type: 'text' | 'resource';
        text?: string;
        resource?: { uri: string; mimeType?: string };
      };
    }>;
  } | null {
    const prompts = this.getPrompts();
    const prompt = prompts.find(p => p.name === name);

    if (!prompt) {
      return null;
    }

    // Generate appropriate messages based on the prompt type
    switch (name) {
      case 'problem-discovery':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'I need help discovering the best lateral thinking techniques for my problem: {{problem}}. Context: {{context}}. Constraints: {{constraints}}. Preferred outcome: {{preferred_outcome}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll analyze your problem and recommend the most suitable lateral thinking techniques. Let me start by understanding your challenge better.",
              },
            },
          ],
        };

      case 'creative-brainstorming':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Help me brainstorm creative solutions for: {{problem}}. Use techniques: {{techniques}}. Depth: {{depth}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll guide you through a creative brainstorming session using lateral thinking techniques. We'll explore multiple perspectives to generate innovative solutions.",
              },
            },
          ],
        };

      case 'risk-analysis':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Analyze risks and potential failure modes for: {{problem}}. Solution context: {{solution_context}}. Critical factors: {{critical_factors}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll conduct a comprehensive risk analysis using lateral thinking to identify potential failure modes, black swan events, and mitigation strategies.",
              },
            },
          ],
        };

      case 'complete-session':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Guide me through a complete lateral thinking session for: {{problem}}. Session type: {{session_type}}. Time available: {{time_available}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll guide you through a complete lateral thinking session, from problem analysis to solution generation. We'll use multiple techniques systematically.",
              },
            },
          ],
        };

      case 'quantum-thinking':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Apply quantum superposition thinking to: {{problem}}. Key contradictions: {{contradictions}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll help you maintain multiple contradictory solutions in superposition, exploring how they interfere constructively and destructively before optimal collapse.",
              },
            },
          ],
        };

      case 'temporal-creativity':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Apply temporal creativity with path memory to: {{problem}}. Time horizon: {{time_horizon}}. Current flexibility: {{flexibility_concern}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll guide you through temporal creativity analysis, tracking how decisions create constraints and close options over time, while maintaining creative flexibility.",
              },
            },
          ],
        };

      case 'persona-thinking':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Solve this problem through the lens of {{persona}}: {{problem}}. Depth: {{depth}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: 'I\'ll approach this problem as {{persona}} would, applying their thinking style, principles, and challenge questions throughout the session. Let me start by discovering the right techniques for this persona.\n\nStep 1: Call `discover_techniques` with `persona: "{{persona}}"` to get persona-biased recommendations.\nStep 2: Call `plan_thinking_session` with `persona: "{{persona}}"` and the recommended techniques.\nStep 3: Execute each step with `execute_thinking_step`, setting `persona: "{{persona}}"` on each call.\n\nThe persona\'s principles and challenges will be injected into every step\'s guidance.',
              },
            },
          ],
        };

      case 'persona-debate':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: 'Stage a debate on: {{problem}}. Debaters: {{personas}}. Format: {{format}}.',
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: "I'll orchestrate a multi-persona debate on this topic. Here's the workflow:\n\nStep 1: Call `discover_techniques` with `personas: [{{personas}}]` to get each persona's recommended techniques.\nStep 2: Call `plan_thinking_session` with `personas: [{{personas}}]` and `debateFormat: \"{{format}}\"` to generate per-persona plans and a synthesis plan.\nStep 3: For each persona, execute their plan's steps with `execute_thinking_step`, setting `persona` to identify who is speaking.\nStep 4: Execute the synthesis steps using `competing_hypotheses` to integrate all positions.\nStep 5: Present the debate outcome: agreements, disagreements, blind spots, and recommendations.",
              },
            },
          ],
        };

      case 'rory-mode':
        return {
          description: prompt.description || '',
          messages: [
            {
              role: 'user' as const,
              content: {
                type: 'text' as const,
                text: "Apply Rory Sutherland's behavioral economics lens to: {{problem}}. Focus rules: {{focus_rules}}.",
              },
            },
            {
              role: 'assistant' as const,
              content: {
                type: 'text' as const,
                text: 'I\'ll analyze this through Rory Sutherland\'s 11 Rules of behavioral economics. This is "Rory Mode" — optimizing for perception, not just reality.\n\nStep 1: Call `discover_techniques` with `persona: "rory_sutherland"` to get behavioral economics-aligned techniques (perception_optimization, context_reframing, reverse_benchmarking, random_entry, anecdotal_signal).\nStep 2: Call `plan_thinking_session` with `persona: "rory_sutherland"` and the recommended techniques.\nStep 3: Execute each step. Rory\'s principles will be injected:\n- "The opposite of a good idea can also be a good idea"\n- "A flower is a weed with an advertising budget"\n- "Dare to be trivial"\n- "Solving with only rationality is playing golf with one club"\n\nKey questions at every step: What would an economist hate about this? What tiny change has disproportionate impact? Are we designing for average users?',
              },
            },
          ],
        };

      default:
        return null;
    }
  }
}
