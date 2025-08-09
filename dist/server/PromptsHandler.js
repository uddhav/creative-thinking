/**
 * PromptsHandler - MCP prompts for guided lateral thinking sessions
 * Provides pre-configured prompts to help users effectively use the server
 */
export class PromptsHandler {
    /**
     * Get all available prompts
     */
    getPrompts() {
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
                        description: 'Type of solution preferred: innovative, systematic, risk-aware, collaborative, analytical',
                        required: false,
                    },
                ],
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
                        description: 'Comma-separated list of techniques to use (or leave empty for recommendations)',
                        required: false,
                    },
                    {
                        name: 'depth',
                        description: 'How thorough: quick, thorough, or comprehensive',
                        required: false,
                    },
                ],
            },
            {
                name: 'risk-analysis',
                description: 'Analyze potential risks, failure modes, and black swan events for your solution',
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
                ],
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
                ],
            },
            {
                name: 'quantum-thinking',
                description: 'Explore multiple contradictory solutions simultaneously using quantum superposition',
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
                ],
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
                ],
            },
        ];
    }
    /**
     * Get a specific prompt by name
     */
    getPrompt(name) {
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
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'I need help discovering the best lateral thinking techniques for my problem: {{problem}}. Context: {{context}}. Constraints: {{constraints}}. Preferred outcome: {{preferred_outcome}}.',
                            },
                        },
                        {
                            role: 'assistant',
                            content: {
                                type: 'text',
                                text: 'I\'ll analyze your problem and recommend the most suitable lateral thinking techniques. Let me start by understanding your challenge better.',
                            },
                        },
                    ],
                };
            case 'creative-brainstorming':
                return {
                    description: prompt.description || '',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'Help me brainstorm creative solutions for: {{problem}}. Use techniques: {{techniques}}. Depth: {{depth}}.',
                            },
                        },
                        {
                            role: 'assistant',
                            content: {
                                type: 'text',
                                text: 'I\'ll guide you through a creative brainstorming session using lateral thinking techniques. We\'ll explore multiple perspectives to generate innovative solutions.',
                            },
                        },
                    ],
                };
            case 'risk-analysis':
                return {
                    description: prompt.description || '',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'Analyze risks and potential failure modes for: {{problem}}. Solution context: {{solution_context}}. Critical factors: {{critical_factors}}.',
                            },
                        },
                        {
                            role: 'assistant',
                            content: {
                                type: 'text',
                                text: 'I\'ll conduct a comprehensive risk analysis using lateral thinking to identify potential failure modes, black swan events, and mitigation strategies.',
                            },
                        },
                    ],
                };
            case 'complete-session':
                return {
                    description: prompt.description || '',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'Guide me through a complete lateral thinking session for: {{problem}}. Session type: {{session_type}}. Time available: {{time_available}}.',
                            },
                        },
                        {
                            role: 'assistant',
                            content: {
                                type: 'text',
                                text: 'I\'ll guide you through a complete lateral thinking session, from problem analysis to solution generation. We\'ll use multiple techniques systematically.',
                            },
                        },
                    ],
                };
            case 'quantum-thinking':
                return {
                    description: prompt.description || '',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'Apply quantum superposition thinking to: {{problem}}. Key contradictions: {{contradictions}}.',
                            },
                        },
                        {
                            role: 'assistant',
                            content: {
                                type: 'text',
                                text: 'I\'ll help you maintain multiple contradictory solutions in superposition, exploring how they interfere constructively and destructively before optimal collapse.',
                            },
                        },
                    ],
                };
            case 'temporal-creativity':
                return {
                    description: prompt.description || '',
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: 'Apply temporal creativity with path memory to: {{problem}}. Time horizon: {{time_horizon}}. Current flexibility: {{flexibility_concern}}.',
                            },
                        },
                        {
                            role: 'assistant',
                            content: {
                                type: 'text',
                                text: 'I\'ll guide you through temporal creativity analysis, tracking how decisions create constraints and close options over time, while maintaining creative flexibility.',
                            },
                        },
                    ],
                };
            default:
                return null;
        }
    }
}
//# sourceMappingURL=PromptsHandler.js.map