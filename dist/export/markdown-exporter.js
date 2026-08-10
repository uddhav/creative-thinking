/**
 * Enhanced Markdown exporter with rich formatting
 */
import { DEFAULT_MARKDOWN_TEMPLATE } from './types.js';
import { BaseExporter } from './base-exporter.js';
export class MarkdownExporter extends BaseExporter {
    constructor() {
        super('markdown');
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async export(session, options) {
        const content = this.generateMarkdown(session, options);
        return {
            content,
            filename: this.generateFilename(session, 'md'),
            mimeType: 'text/markdown',
            metadata: {
                exportedAt: new Date(),
                sessionId: session.id,
                techniqueUsed: session.technique,
                totalSteps: session.totalSteps,
                completedSteps: session.currentStep,
            },
        };
    }
    generateMarkdown(session, options) {
        const template = options.template || DEFAULT_MARKDOWN_TEMPLATE;
        // Prepare template data
        const data = {
            problem: session.problem,
            date: this.formatDate(session.startTime, options.dateFormat),
            technique: this.getTechniqueDisplayName(session.technique),
            sessionId: session.id,
            status: this.getSessionStatus(session),
            duration: this.calculateDuration(session.startTime, session.endTime),
            currentStep: session.currentStep,
            totalSteps: session.totalSteps,
            branchCount: Object.keys(session.branches).length,
            insightCount: session.insights.length,
            history: options.includeHistory !== false ? this.formatHistory(session) : null,
            insights: options.includeInsights !== false && session.insights.length > 0
                ? this.formatInsights(session.insights)
                : '',
            branches: options.includeBranches !== false && Object.keys(session.branches).length > 0
                ? this.formatBranches(session.branches)
                : '',
        };
        // Store metrics separately to handle properly
        const metrics = options.includeMetrics !== false ? session.metrics : null;
        // Simple template replacement (in production, use a proper template engine)
        let result = template;
        // Handle conditionals
        result = this.processConditionals(result, { ...data, metrics });
        // Replace variables
        Object.entries(data).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            const valueStr = value !== null && value !== undefined ? String(value) : '';
            result = result.replace(regex, valueStr);
        });
        // Handle nested properties (e.g., metrics.outputCompleteness)
        if (metrics && typeof metrics === 'object') {
            Object.entries(metrics).forEach(([key, value]) => {
                const regex = new RegExp(`{{metrics\\.${key}}}`, 'g');
                result = result.replace(regex, String(value ?? 0));
            });
        }
        return result.trim();
    }
    processConditionals(template, data) {
        // Simple conditional processing
        const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
        return template.replace(conditionalRegex, (match, condition, content) => {
            // Log the match for debugging if needed
            void match;
            if (data[condition]) {
                return content;
            }
            return '';
        });
    }
    formatHistory(session) {
        const sections = [];
        session.history.forEach((entry, index) => {
            const section = this.formatHistoryEntry(entry.input, entry.timestamp, index + 1, session.technique);
            sections.push(section);
        });
        return sections.join('\n\n');
    }
    formatHistoryEntry(entry, timestamp, stepNumber, technique) {
        const lines = [];
        // Step header with emoji based on technique
        const emoji = this.getStepEmoji(technique, entry);
        lines.push(`### ${emoji} Step ${stepNumber}`);
        // Timestamp
        lines.push(`*${this.formatDate(new Date(timestamp), 'locale')}*`);
        lines.push('');
        // Technique-specific details
        const details = this.getTechniqueDetails(technique, entry);
        if (details) {
            lines.push(`**${details}**`);
            lines.push('');
        }
        // Main output
        lines.push(entry.output);
        // Risks and mitigations (if present)
        if (entry.risks && entry.risks.length > 0) {
            lines.push('');
            lines.push('#### ⚠️ Risks Identified');
            entry.risks.forEach(risk => lines.push(`- ${risk}`));
        }
        if (entry.mitigations && entry.mitigations.length > 0) {
            lines.push('');
            lines.push('#### ✅ Mitigations');
            entry.mitigations.forEach(mitigation => lines.push(`- ${mitigation}`));
        }
        // Other arrays (connections, principles, etc.)
        this.formatArraySection(lines, entry.connections, '🔗 Connections');
        this.formatArraySection(lines, entry.principles, '💡 Principles');
        this.formatArraySection(lines, entry.extractedConcepts, '🔍 Extracted Concepts');
        this.formatArraySection(lines, entry.applications, '🎯 Applications');
        this.formatArraySection(lines, entry.antifragileProperties, '💪 Antifragile Properties');
        return lines.join('\n');
    }
    formatArraySection(lines, items, title) {
        if (items && items.length > 0) {
            lines.push('');
            lines.push(`#### ${title}`);
            items.forEach(item => lines.push(`- ${item}`));
        }
    }
    getStepEmoji(technique, entry) {
        switch (technique) {
            case 'six_hats': {
                const hatEmojis = {
                    blue: '🔵',
                    white: '⚪',
                    red: '🔴',
                    yellow: '🟡',
                    black: '⚫',
                    green: '🟢',
                };
                return hatEmojis[entry.hatColor || 'blue'] || '🎩';
            }
            case 'po':
                return '💡';
            case 'random_entry':
                return '🎲';
            case 'scamper': {
                const actionEmojis = {
                    substitute: '🔄',
                    combine: '🔗',
                    adapt: '🔧',
                    modify: '🔍',
                    put_to_other_use: '🎯',
                    eliminate: '✂️',
                    reverse: '🔃',
                };
                return actionEmojis[entry.scamperAction || ''] || '🔄';
            }
            case 'concept_extraction':
                return '🔍';
            case 'yes_and':
                return '🤝';
            default:
                return '🧠';
        }
    }
    getTechniqueDetails(technique, entry) {
        switch (technique) {
            case 'six_hats':
                if (entry.hatColor) {
                    const hatNames = {
                        blue: 'Process Control',
                        white: 'Facts & Information',
                        red: 'Emotions & Intuition',
                        yellow: 'Optimism & Benefits',
                        black: 'Critical Judgment',
                        green: 'Creativity & Alternatives',
                        purple: 'Path Dependency & Ruin Risk',
                    };
                    // Fall back to the bare colour rather than interpolating undefined. This
                    // map went five years with six entries for a seven-hat technique; it only
                    // stayed correct because purple was unreachable.
                    const hatName = hatNames[entry.hatColor];
                    return hatName
                        ? `${entry.hatColor.toUpperCase()} HAT - ${hatName}`
                        : `${entry.hatColor.toUpperCase()} HAT`;
                }
                break;
            case 'po':
                if (entry.provocation) {
                    return `Provocation: "${entry.provocation}"`;
                }
                break;
            case 'random_entry':
                if (entry.randomStimulus) {
                    return `Random Stimulus: "${entry.randomStimulus}"`;
                }
                break;
            case 'scamper':
                if (entry.scamperAction) {
                    return `Action: ${entry.scamperAction.toUpperCase()}`;
                }
                break;
            case 'concept_extraction':
                if (entry.successExample) {
                    return `Success Example: "${entry.successExample}"`;
                }
                break;
            case 'yes_and':
                if (entry.initialIdea) {
                    return `Initial Idea: "${entry.initialIdea}"`;
                }
                break;
        }
        return null;
    }
    formatInsights(insights) {
        const lines = [];
        insights.forEach((insight, index) => {
            lines.push(`${index + 1}. ${insight}`);
        });
        return lines.join('\n');
    }
    formatBranches(branches) {
        const lines = [];
        Object.entries(branches).forEach(([branchId, branchData]) => {
            lines.push(`### Branch: ${branchId}`);
            lines.push(`*${branchData.length} alternative path(s) explored*`);
            lines.push('');
        });
        return lines.join('\n');
    }
}
//# sourceMappingURL=markdown-exporter.js.map