/**
 * Design Thinking technique handler
 */
import { BaseTechniqueHandler } from './types.js';
export class DesignThinkingHandler extends BaseTechniqueHandler {
    stages = {
        empathize: {
            name: 'Empathize',
            focus: 'Understand user needs and context',
            emoji: '❤️',
            criticalLens: 'Challenge assumptions about user needs',
        },
        define: {
            name: 'Define',
            focus: 'Frame the problem clearly',
            emoji: '📍',
            criticalLens: "Question if you're solving the right problem",
        },
        ideate: {
            name: 'Ideate',
            focus: 'Generate diverse solutions',
            emoji: '💡',
            criticalLens: 'Identify failure modes in each idea',
        },
        prototype: {
            name: 'Prototype',
            focus: 'Build quick, testable versions',
            emoji: '🔨',
            criticalLens: 'Stress-test assumptions early',
        },
        test: {
            name: 'Test',
            focus: 'Validate with real users',
            emoji: '🧪',
            criticalLens: 'Look for unexpected failures and edge cases',
        },
    };
    stageOrder = [
        'empathize',
        'define',
        'ideate',
        'prototype',
        'test',
    ];
    getTechniqueInfo() {
        return {
            name: 'Design Thinking',
            emoji: '🎨',
            totalSteps: 5,
            description: 'Human-centered problem solving with embedded risk management',
            focus: 'Iterate through empathy, definition, ideation, prototyping, and testing',
        };
    }
    getStepInfo(step) {
        const stage = this.stageOrder[step - 1];
        if (!stage) {
            throw new Error(`Invalid step ${step} for Design Thinking`);
        }
        const info = this.stages[stage];
        return {
            name: info.name,
            focus: `${info.focus} | ${info.criticalLens}`,
            emoji: info.emoji,
        };
    }
    getStepGuidance(step, problem) {
        const stage = this.stageOrder[step - 1];
        const info = this.stages[stage];
        switch (stage) {
            case 'empathize':
                return `❤️ EMPATHIZE: Who is affected by "${problem}"? What are their real needs, fears, and contexts?`;
            case 'define':
                return `📍 DEFINE: Based on empathy insights, what is the core problem? Frame it as: "How might we..."`;
            case 'ideate':
                return `💡 IDEATE: Generate multiple solutions. For each idea, also identify: What could go wrong?`;
            case 'prototype':
                return `🔨 PROTOTYPE: Create a simple version to test assumptions. Include failure scenarios in the prototype`;
            case 'test':
                return `🧪 TEST: Validate with users. Specifically look for: edge cases, unexpected uses, and failure modes`;
            default:
                return `Apply ${info.name} to "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            switch (entry.designStage) {
                case 'empathize':
                    if (entry.empathyInsights && entry.empathyInsights.length > 0) {
                        insights.push(`User need: ${entry.empathyInsights[0]}`);
                    }
                    break;
                case 'define':
                    if (entry.problemStatement) {
                        insights.push(`Problem defined: ${entry.problemStatement}`);
                    }
                    break;
                case 'ideate':
                    if (entry.ideaList && entry.ideaList.length > 0) {
                        insights.push(`${entry.ideaList.length} ideas generated`);
                    }
                    if (entry.failureModesPredicted && entry.failureModesPredicted.length > 0) {
                        insights.push(`Risk identified: ${entry.failureModesPredicted[0]}`);
                    }
                    break;
                case 'prototype':
                    if (entry.prototypeDescription) {
                        insights.push(`Prototype: ${entry.prototypeDescription.slice(0, 100)}...`);
                    }
                    break;
                case 'test':
                    if (entry.userFeedback && entry.userFeedback.length > 0) {
                        insights.push(`User feedback: ${entry.userFeedback[0]}`);
                    }
                    if (entry.failureInsights && entry.failureInsights.length > 0) {
                        insights.push(`Failure insight: ${entry.failureInsights[0]}`);
                    }
                    break;
            }
        });
        return insights;
    }
    getStage(step) {
        return this.stageOrder[step - 1];
    }
}
//# sourceMappingURL=DesignThinkingHandler.js.map