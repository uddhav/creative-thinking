#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import chalk from 'chalk';
class LateralThinkingServer {
    sessions = new Map();
    currentSessionId = null;
    disableThoughtLogging;
    constructor() {
        this.disableThoughtLogging = (process.env.DISABLE_THOUGHT_LOGGING || "").toLowerCase() === "true";
    }
    getSixHatsInfo(color) {
        const hatsInfo = {
            blue: { name: 'Blue Hat', focus: 'Process control and overview', emoji: '🔵' },
            white: { name: 'White Hat', focus: 'Facts and information', emoji: '⚪' },
            red: { name: 'Red Hat', focus: 'Emotions and intuition', emoji: '🔴' },
            yellow: { name: 'Yellow Hat', focus: 'Optimism and benefits', emoji: '🟡' },
            black: { name: 'Black Hat', focus: 'Critical judgment and caution', emoji: '⚫' },
            green: { name: 'Green Hat', focus: 'Creativity and alternatives', emoji: '🟢' }
        };
        return hatsInfo[color];
    }
    getScamperInfo(action) {
        const scamperInfo = {
            substitute: { description: 'Replace parts with alternatives', emoji: '🔄' },
            combine: { description: 'Merge with other ideas or functions', emoji: '🔗' },
            adapt: { description: 'Adjust for different contexts', emoji: '🔧' },
            modify: { description: 'Magnify, minimize, or modify attributes', emoji: '🔍' },
            put_to_other_use: { description: 'Find new applications', emoji: '🎯' },
            eliminate: { description: 'Remove unnecessary elements', emoji: '✂️' },
            reverse: { description: 'Invert or rearrange components', emoji: '🔃' }
        };
        return scamperInfo[action];
    }
    validateInput(input) {
        const data = input;
        if (!data.technique || !['six_hats', 'po', 'random_entry', 'scamper', 'concept_extraction'].includes(data.technique)) {
            throw new Error('Invalid technique: must be one of six_hats, po, random_entry, scamper, or concept_extraction');
        }
        if (!data.problem || typeof data.problem !== 'string') {
            throw new Error('Invalid problem: must be a string');
        }
        if (!data.currentStep || typeof data.currentStep !== 'number') {
            throw new Error('Invalid currentStep: must be a number');
        }
        if (!data.totalSteps || typeof data.totalSteps !== 'number') {
            throw new Error('Invalid totalSteps: must be a number');
        }
        if (!data.output || typeof data.output !== 'string') {
            throw new Error('Invalid output: must be a string');
        }
        if (typeof data.nextStepNeeded !== 'boolean') {
            throw new Error('Invalid nextStepNeeded: must be a boolean');
        }
        // Validate technique-specific fields
        const technique = data.technique;
        if (technique === 'six_hats' && data.hatColor &&
            !['blue', 'white', 'red', 'yellow', 'black', 'green'].includes(data.hatColor)) {
            throw new Error('Invalid hatColor for six_hats technique');
        }
        if (technique === 'scamper' && data.scamperAction &&
            !['substitute', 'combine', 'adapt', 'modify', 'put_to_other_use', 'eliminate', 'reverse'].includes(data.scamperAction)) {
            throw new Error('Invalid scamperAction for scamper technique');
        }
        // Validate concept extraction specific fields
        if (technique === 'concept_extraction') {
            if (data.extractedConcepts && !Array.isArray(data.extractedConcepts)) {
                throw new Error('extractedConcepts must be an array for concept_extraction technique');
            }
            if (data.abstractedPatterns && !Array.isArray(data.abstractedPatterns)) {
                throw new Error('abstractedPatterns must be an array for concept_extraction technique');
            }
            if (data.applications && !Array.isArray(data.applications)) {
                throw new Error('applications must be an array for concept_extraction technique');
            }
        }
        return {
            technique: data.technique,
            problem: data.problem,
            currentStep: data.currentStep,
            totalSteps: data.totalSteps,
            output: data.output,
            nextStepNeeded: data.nextStepNeeded,
            hatColor: data.hatColor,
            provocation: data.provocation,
            principles: data.principles,
            randomStimulus: data.randomStimulus,
            connections: data.connections,
            scamperAction: data.scamperAction,
            successExample: data.successExample,
            extractedConcepts: data.extractedConcepts,
            abstractedPatterns: data.abstractedPatterns,
            applications: data.applications,
            isRevision: data.isRevision,
            revisesStep: data.revisesStep,
            branchFromStep: data.branchFromStep,
            branchId: data.branchId,
        };
    }
    formatOutput(data) {
        const { technique, currentStep, totalSteps, output, hatColor, scamperAction, randomStimulus, provocation, successExample } = data;
        let header = '';
        let techniqueInfo = '';
        let emoji = '🧠';
        switch (technique) {
            case 'six_hats':
                if (hatColor) {
                    const hatInfo = this.getSixHatsInfo(hatColor);
                    emoji = hatInfo.emoji;
                    techniqueInfo = `${hatInfo.name}: ${hatInfo.focus}`;
                }
                break;
            case 'po':
                emoji = '💡';
                if (provocation) {
                    techniqueInfo = `Provocation: ${provocation}`;
                }
                break;
            case 'random_entry':
                emoji = '🎲';
                if (randomStimulus) {
                    techniqueInfo = `Random Stimulus: ${randomStimulus}`;
                }
                break;
            case 'scamper':
                if (scamperAction) {
                    const actionInfo = this.getScamperInfo(scamperAction);
                    emoji = actionInfo.emoji;
                    techniqueInfo = `${scamperAction.toUpperCase()}: ${actionInfo.description}`;
                }
                break;
            case 'concept_extraction':
                emoji = '🔍';
                const stepNames = ['Identify Success', 'Extract Concepts', 'Abstract Patterns', 'Apply to Problem'];
                techniqueInfo = stepNames[currentStep - 1];
                if (successExample && currentStep === 1) {
                    techniqueInfo += `: ${successExample}`;
                }
                break;
        }
        if (data.isRevision) {
            header = chalk.yellow(`🔄 Revision of Step ${data.revisesStep}`);
        }
        else if (data.branchFromStep) {
            header = chalk.green(`🌿 Branch from Step ${data.branchFromStep} (ID: ${data.branchId})`);
        }
        else {
            header = chalk.blue(`${emoji} ${technique.replace('_', ' ').toUpperCase()} - Step ${currentStep}/${totalSteps}`);
        }
        const maxLength = Math.max(header.length, techniqueInfo.length, output.length) + 4;
        const border = '─'.repeat(maxLength);
        let result = `\n┌${border}┐\n`;
        result += `│ ${header.padEnd(maxLength - 2)} │\n`;
        if (techniqueInfo) {
            result += `│ ${chalk.gray(techniqueInfo.padEnd(maxLength - 2))} │\n`;
            result += `├${border}┤\n`;
        }
        // Wrap output text
        const words = output.split(' ');
        let line = '';
        for (const word of words) {
            if (line.length + word.length + 1 > maxLength - 4) {
                result += `│ ${line.padEnd(maxLength - 2)} │\n`;
                line = word;
            }
            else {
                line += (line ? ' ' : '') + word;
            }
        }
        if (line) {
            result += `│ ${line.padEnd(maxLength - 2)} │\n`;
        }
        result += `└${border}┘`;
        return result;
    }
    initializeSession(technique, problem) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.sessions.set(sessionId, {
            technique,
            problem,
            history: [],
            branches: {},
            insights: []
        });
        this.currentSessionId = sessionId;
        return sessionId;
    }
    getTechniqueSteps(technique) {
        switch (technique) {
            case 'six_hats': return 6;
            case 'po': return 4; // Create provocation, suspend judgment, extract principles, develop ideas
            case 'random_entry': return 3; // Random stimulus, generate connections, develop solutions
            case 'scamper': return 7;
            case 'concept_extraction': return 4; // Identify success, extract concepts, abstract patterns, apply to problem
            default: return 5;
        }
    }
    extractInsights(session) {
        const insights = [];
        // Extract technique-specific insights
        switch (session.technique) {
            case 'six_hats':
                insights.push('Comprehensive analysis from multiple perspectives completed');
                break;
            case 'po':
                const principles = session.history.filter(h => h.principles).flatMap(h => h.principles || []);
                if (principles.length > 0) {
                    insights.push(`Extracted principles: ${principles.join(', ')}`);
                }
                break;
            case 'random_entry':
                const connections = session.history.filter(h => h.connections).flatMap(h => h.connections || []);
                if (connections.length > 0) {
                    insights.push(`Creative connections discovered: ${connections.length}`);
                }
                break;
            case 'scamper':
                insights.push('Systematic transformation completed across all dimensions');
                break;
            case 'concept_extraction':
                const concepts = session.history.filter(h => h.extractedConcepts).flatMap(h => h.extractedConcepts || []);
                const patterns = session.history.filter(h => h.abstractedPatterns).flatMap(h => h.abstractedPatterns || []);
                const applications = session.history.filter(h => h.applications).flatMap(h => h.applications || []);
                if (concepts.length > 0) {
                    insights.push(`Core concepts identified: ${concepts.join(', ')}`);
                }
                if (patterns.length > 0) {
                    insights.push(`Abstracted patterns: ${patterns.join(', ')}`);
                }
                if (applications.length > 0) {
                    insights.push(`${applications.length} new applications generated for your problem`);
                }
                break;
        }
        return insights;
    }
    processLateralThinking(input) {
        try {
            const validatedInput = this.validateInput(input);
            // Initialize session if this is the first step
            if (validatedInput.currentStep === 1 && !validatedInput.isRevision) {
                const sessionId = this.initializeSession(validatedInput.technique, validatedInput.problem);
                validatedInput.totalSteps = this.getTechniqueSteps(validatedInput.technique);
            }
            // Get current session
            const session = this.currentSessionId ? this.sessions.get(this.currentSessionId) : null;
            if (!session) {
                throw new Error('No active session. Start with step 1.');
            }
            // Add to history
            session.history.push(validatedInput);
            // Handle branches
            if (validatedInput.branchFromStep && validatedInput.branchId) {
                if (!session.branches[validatedInput.branchId]) {
                    session.branches[validatedInput.branchId] = [];
                }
                session.branches[validatedInput.branchId].push(validatedInput);
            }
            // Log formatted output
            if (!this.disableThoughtLogging) {
                const formattedOutput = this.formatOutput(validatedInput);
                console.error(formattedOutput);
            }
            // Generate response
            const response = {
                sessionId: this.currentSessionId,
                technique: validatedInput.technique,
                currentStep: validatedInput.currentStep,
                totalSteps: validatedInput.totalSteps,
                nextStepNeeded: validatedInput.nextStepNeeded,
                historyLength: session.history.length,
                branches: Object.keys(session.branches)
            };
            // Add completion summary if done
            if (!validatedInput.nextStepNeeded) {
                response.completed = true;
                response.insights = this.extractInsights(session);
                response.summary = `Lateral thinking session completed using ${validatedInput.technique} technique`;
            }
            // Add technique-specific guidance for next step
            if (validatedInput.nextStepNeeded) {
                response.nextStepGuidance = this.getNextStepGuidance(validatedInput);
            }
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(response, null, 2)
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            error: error instanceof Error ? error.message : String(error),
                            status: 'failed'
                        }, null, 2)
                    }],
                isError: true
            };
        }
    }
    getNextStepGuidance(data) {
        const nextStep = data.currentStep + 1;
        switch (data.technique) {
            case 'six_hats':
                const hatOrder = ['blue', 'white', 'red', 'yellow', 'black', 'green'];
                if (nextStep <= 6) {
                    const nextHat = hatOrder[nextStep - 1];
                    const hatInfo = this.getSixHatsInfo(nextHat);
                    return `Next: ${hatInfo.name} - Focus on ${hatInfo.focus}`;
                }
                break;
            case 'po':
                const poSteps = [
                    'Create a provocative statement (Po:)',
                    'Suspend judgment and explore the provocation',
                    'Extract useful principles from the provocation',
                    'Develop practical ideas from the principles'
                ];
                return poSteps[nextStep - 1] || 'Complete the process';
            case 'random_entry':
                const randomSteps = [
                    'Introduce a random stimulus word/concept',
                    'Generate connections between the stimulus and problem',
                    'Develop solutions from the connections'
                ];
                return randomSteps[nextStep - 1] || 'Complete the process';
            case 'scamper':
                const scamperOrder = [
                    'substitute', 'combine', 'adapt', 'modify',
                    'put_to_other_use', 'eliminate', 'reverse'
                ];
                if (nextStep <= 7) {
                    const nextAction = scamperOrder[nextStep - 1];
                    const actionInfo = this.getScamperInfo(nextAction);
                    return `Next: ${nextAction.toUpperCase()} - ${actionInfo.description}`;
                }
                break;
            case 'concept_extraction':
                const conceptSteps = [
                    'Identify a successful solution/example from any domain',
                    'Extract the key concepts that make it successful',
                    'Abstract these concepts into transferable patterns',
                    'Apply the abstracted patterns to your problem'
                ];
                return conceptSteps[nextStep - 1] || 'Complete the process';
        }
        return 'Continue with the next step';
    }
}
const LATERAL_THINKING_TOOL = {
    name: "lateralthinking",
    description: `A structured tool for lateral and creative thinking using proven creativity techniques.
This tool guides you through systematic creative problem-solving methods that break conventional thinking patterns.

Supported techniques:
1. **six_hats**: Edward de Bono's Six Thinking Hats for comprehensive perspective analysis
   - Blue Hat: Process control and overview
   - White Hat: Facts and information
   - Red Hat: Emotions and intuition  
   - Yellow Hat: Optimism and benefits
   - Black Hat: Critical judgment and caution
   - Green Hat: Creativity and alternatives

2. **po**: Provocative Operation technique for escaping thinking patterns
   - Create provocative statements
   - Suspend judgment
   - Extract principles
   - Develop practical ideas

3. **random_entry**: Random stimulus technique for unexpected connections
   - Introduce random element
   - Generate associations
   - Develop solutions from connections

4. **scamper**: Systematic idea generation through transformations
   - Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse

5. **concept_extraction**: Transfer successful principles across domains
   - Identify successful examples
   - Extract core concepts
   - Abstract into patterns
   - Apply to new problems

When to use this tool:
- Breaking out of conventional thinking patterns
- Generating novel solutions to stubborn problems
- Exploring problems from multiple perspectives
- Systematic creative ideation
- When analytical approaches have reached their limits

Features:
- Step-by-step guidance through each technique
- Support for revisions and branching
- Technique-specific parameters and outputs
- Visual progress tracking
- Insights extraction upon completion`,
    inputSchema: {
        type: "object",
        properties: {
            technique: {
                type: "string",
                enum: ["six_hats", "po", "random_entry", "scamper", "concept_extraction"],
                description: "The lateral thinking technique to use"
            },
            problem: {
                type: "string",
                description: "The problem or challenge to address"
            },
            currentStep: {
                type: "integer",
                description: "Current step number in the technique",
                minimum: 1
            },
            totalSteps: {
                type: "integer",
                description: "Total steps for this technique",
                minimum: 1
            },
            output: {
                type: "string",
                description: "Your creative output for this step"
            },
            nextStepNeeded: {
                type: "boolean",
                description: "Whether another step is needed"
            },
            hatColor: {
                type: "string",
                enum: ["blue", "white", "red", "yellow", "black", "green"],
                description: "Current hat color (for six_hats technique)"
            },
            provocation: {
                type: "string",
                description: "The provocative statement (for po technique)"
            },
            principles: {
                type: "array",
                items: { type: "string" },
                description: "Extracted principles (for po technique)"
            },
            randomStimulus: {
                type: "string",
                description: "The random word/concept (for random_entry technique)"
            },
            connections: {
                type: "array",
                items: { type: "string" },
                description: "Generated connections (for random_entry technique)"
            },
            scamperAction: {
                type: "string",
                enum: ["substitute", "combine", "adapt", "modify", "put_to_other_use", "eliminate", "reverse"],
                description: "Current SCAMPER action"
            },
            successExample: {
                type: "string",
                description: "A successful solution/example to analyze (for concept_extraction technique)"
            },
            extractedConcepts: {
                type: "array",
                items: { type: "string" },
                description: "Key concepts extracted from the success example (for concept_extraction technique)"
            },
            abstractedPatterns: {
                type: "array",
                items: { type: "string" },
                description: "Abstracted patterns from the concepts (for concept_extraction technique)"
            },
            applications: {
                type: "array",
                items: { type: "string" },
                description: "Applications of patterns to the problem (for concept_extraction technique)"
            },
            isRevision: {
                type: "boolean",
                description: "Whether this revises a previous step"
            },
            revisesStep: {
                type: "integer",
                description: "Which step is being revised",
                minimum: 1
            },
            branchFromStep: {
                type: "integer",
                description: "Step number to branch from",
                minimum: 1
            },
            branchId: {
                type: "string",
                description: "Identifier for the branch"
            }
        },
        required: ["technique", "problem", "currentStep", "totalSteps", "output", "nextStepNeeded"]
    }
};
const server = new Server({
    name: "creative-thinking-server",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
const lateralServer = new LateralThinkingServer();
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [LATERAL_THINKING_TOOL],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "lateralthinking") {
        return lateralServer.processLateralThinking(request.params.arguments);
    }
    return {
        content: [{
                type: "text",
                text: `Unknown tool: ${request.params.name}`
            }],
        isError: true
    };
});
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Creative Thinking MCP Server running on stdio");
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map