/**
 * Visual Formatter
 * Handles visual output formatting for the console
 */
import chalk from 'chalk';
export class VisualFormatter {
    maxLineLength = 80;
    disableThoughtLogging;
    constructor(disableThoughtLogging = false) {
        this.disableThoughtLogging = disableThoughtLogging;
    }
    /**
     * Format the main output display
     */
    formatOutput(technique, problem, currentStep, totalSteps, stepInfo, modeIndicator, input) {
        if (this.disableThoughtLogging) {
            return '';
        }
        // Handle invalid steps
        if (!stepInfo || currentStep < 1 || currentStep > totalSteps) {
            console.error(`Unknown ${technique} step ${currentStep}`);
            return '';
        }
        const lines = [];
        const borderLength = this.maxLineLength;
        // Header
        lines.push(chalk.blue('┌' + '─'.repeat(borderLength - 2) + '┐'));
        // Title with mode indicator
        const title = ` ${modeIndicator.symbol} ${this.getTechniqueEmoji(technique)} ${this.getTechniqueName(technique)} - Step ${currentStep}/${totalSteps} `;
        const titlePadding = Math.max(0, borderLength - title.length - 2);
        const paddingLeft = Math.floor(titlePadding / 2);
        const paddingRight = titlePadding - paddingLeft;
        lines.push(chalk.blue('│') +
            ' '.repeat(paddingLeft) +
            modeIndicator.color(title) +
            ' '.repeat(paddingRight) +
            chalk.blue('│'));
        // Problem
        lines.push(chalk.blue('├' + '─'.repeat(borderLength - 2) + '┤'));
        this.addWrappedLine(lines, `Problem: ${problem}`, chalk.white, borderLength);
        // Step info
        lines.push(chalk.blue('├' + '─'.repeat(borderLength - 2) + '┤'));
        lines.push(chalk.blue('│') +
            chalk.bold(` ${stepInfo.emoji} ${stepInfo.name}: `) +
            chalk.cyan(stepInfo.focus.slice(0, borderLength - stepInfo.name.length - 8)) +
            ' '.repeat(Math.max(0, borderLength - stepInfo.name.length - stepInfo.focus.length - 7)) +
            chalk.blue('│'));
        // Progress bar
        lines.push(chalk.blue('├' + '─'.repeat(borderLength - 2) + '┤'));
        lines.push(chalk.blue('│') +
            ' Progress: ' +
            this.formatProgressBar(currentStep, totalSteps, borderLength - 14) +
            ' ' +
            chalk.blue('│'));
        // Risk section if present
        if (input.risks && input.risks.length > 0) {
            lines.push(...this.formatRiskSection(input.risks, borderLength));
        }
        // Mitigation section if present
        if (input.mitigations && input.mitigations.length > 0) {
            lines.push(...this.formatMitigationSection(input.mitigations, borderLength, !!(input.risks && input.risks.length > 0)));
        }
        // Footer
        lines.push(chalk.blue('└' + '─'.repeat(borderLength - 2) + '┘'));
        return lines.join('\n');
    }
    /**
     * Format progress bar
     */
    formatProgressBar(current, total, width) {
        const filled = Math.floor((current / total) * width);
        const empty = width - filled;
        const percentage = Math.round((current / total) * 100);
        const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
        return `${bar} ${chalk.yellow(`${percentage}%`)}`;
    }
    /**
     * Add wrapped line to output
     */
    addWrappedLine(lines, text, color, maxLength) {
        const words = text.split(' ');
        let currentLine = '';
        for (const word of words) {
            const truncatedWord = this.truncateWord(word, maxLength - 4);
            if (currentLine.length + truncatedWord.length + 1 > maxLength - 4) {
                lines.push(chalk.blue('│ ') + color(currentLine.padEnd(maxLength - 4)) + chalk.blue(' │'));
                currentLine = truncatedWord;
            }
            else {
                currentLine += (currentLine ? ' ' : '') + truncatedWord;
            }
        }
        if (currentLine) {
            lines.push(chalk.blue('│ ') + color(currentLine.padEnd(maxLength - 4)) + chalk.blue(' │'));
        }
    }
    /**
     * Truncate word if too long
     */
    truncateWord(word, maxLength) {
        if (word.length <= maxLength)
            return word;
        return word.slice(0, maxLength - 3) + '...';
    }
    /**
     * Wrap text to fit within specified width
     */
    wrapText(text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            if (currentLine.length + word.length + 1 <= maxWidth) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
            else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    }
    /**
     * Format risk section
     */
    formatRiskSection(risks, maxLength) {
        const lines = [];
        lines.push(chalk.blue('├' + '─'.repeat(maxLength - 2) + '┤'));
        lines.push(chalk.blue('│') +
            chalk.yellow(' ⚠️  Risks Identified:') +
            ' '.repeat(maxLength - 23) +
            chalk.blue('│'));
        risks.forEach((risk, index) => {
            const riskText = ` ${index + 1}. ${risk}`;
            this.addWrappedLine(lines, riskText, chalk.yellow, maxLength);
        });
        return lines;
    }
    /**
     * Format mitigation section
     */
    formatMitigationSection(mitigations, maxLength, hasRisks) {
        const lines = [];
        if (!hasRisks) {
            lines.push(chalk.blue('├' + '─'.repeat(maxLength - 2) + '┤'));
        }
        lines.push(chalk.blue('│') +
            chalk.green(' ✅ Mitigations:') +
            ' '.repeat(maxLength - 18) +
            chalk.blue('│'));
        mitigations.forEach((mitigation, index) => {
            const mitigationText = ` ${index + 1}. ${mitigation}`;
            this.addWrappedLine(lines, mitigationText, chalk.green, maxLength);
        });
        return lines;
    }
    /**
     * Get technique emoji
     */
    getTechniqueEmoji(technique) {
        const emojis = {
            six_hats: '🎩',
            po: '💭',
            random_entry: '🎲',
            scamper: '🔧',
            concept_extraction: '🔍',
            yes_and: '➕',
            design_thinking: '🎨',
            triz: '⚡',
            neural_state: '🧠',
            temporal_work: '⏰',
            cross_cultural: '🌍',
            collective_intel: '🧬',
            disney_method: '🎬',
            nine_windows: '🪟',
        };
        return emojis[technique] || '❓';
    }
    /**
     * Get technique name
     */
    getTechniqueName(technique) {
        const names = {
            six_hats: 'Six Thinking Hats',
            po: 'PO - Provocative Operation',
            random_entry: 'Random Entry',
            scamper: 'SCAMPER',
            concept_extraction: 'Concept Extraction',
            yes_and: 'Yes, And...',
            design_thinking: 'Design Thinking',
            triz: 'TRIZ',
            neural_state: 'Neural State Optimization',
            temporal_work: 'Temporal Work Design',
            cross_cultural: 'Cross-Cultural Integration',
            collective_intel: 'Collective Intelligence',
            disney_method: 'Disney Method',
            nine_windows: 'Nine Windows',
        };
        return names[technique] || technique;
    }
    /**
     * Format session summary
     */
    formatSessionSummary(technique, problem, insights, metrics) {
        if (this.disableThoughtLogging) {
            return '';
        }
        const lines = [];
        const borderLength = this.maxLineLength;
        // Header
        lines.push(chalk.green('╔' + '═'.repeat(borderLength - 2) + '╗'));
        lines.push(chalk.green('║') +
            chalk.bold.white(' 🎉 Session Complete! '.padEnd(borderLength - 2)) +
            chalk.green('║'));
        // Summary
        lines.push(chalk.green('╠' + '═'.repeat(borderLength - 2) + '╣'));
        lines.push(chalk.green('║') +
            chalk.white(` Technique: ${this.getTechniqueEmoji(technique)} ${this.getTechniqueName(technique)}`.padEnd(borderLength - 2)) +
            chalk.green('║'));
        this.addWrappedLine(lines, `Problem: ${problem}`, chalk.white, borderLength);
        // Insights
        if (insights.length > 0) {
            lines.push(chalk.green('╠' + '═'.repeat(borderLength - 2) + '╣'));
            lines.push(chalk.green('║') +
                chalk.bold.cyan(' 💡 Key Insights:'.padEnd(borderLength - 2)) +
                chalk.green('║'));
            insights.forEach((insight, index) => {
                this.addWrappedLine(lines, ` ${index + 1}. ${insight}`, chalk.cyan, borderLength);
            });
        }
        // Metrics
        if (metrics) {
            lines.push(chalk.green('╠' + '═'.repeat(borderLength - 2) + '╣'));
            lines.push(chalk.green('║') +
                chalk.bold.yellow(' 📊 Metrics:'.padEnd(borderLength - 2)) +
                chalk.green('║'));
            if (metrics.creativityScore !== undefined) {
                lines.push(chalk.green('║') +
                    chalk.yellow(`  Creativity Score: ${metrics.creativityScore.toFixed(1)}/10`.padEnd(borderLength - 2)) +
                    chalk.green('║'));
            }
            if (metrics.risksCaught !== undefined && metrics.risksCaught > 0) {
                lines.push(chalk.green('║') +
                    chalk.yellow(`  Risks Identified: ${metrics.risksCaught}`.padEnd(borderLength - 2)) +
                    chalk.green('║'));
            }
            if (metrics.antifragileFeatures !== undefined && metrics.antifragileFeatures > 0) {
                lines.push(chalk.green('║') +
                    chalk.yellow(`  Antifragile Features: ${metrics.antifragileFeatures}`.padEnd(borderLength - 2)) +
                    chalk.green('║'));
            }
        }
        // Footer
        lines.push(chalk.green('╚' + '═'.repeat(borderLength - 2) + '╝'));
        return lines.join('\n');
    }
    /**
     * Get mode indicator for current thinking mode
     */
    getModeIndicator(technique, currentStep) {
        // Determine if current step is creative or critical
        const criticalSteps = this.getCriticalSteps(technique);
        const isCritical = criticalSteps.includes(currentStep);
        return isCritical ? { color: chalk.red, symbol: '⚠️' } : { color: chalk.green, symbol: '✨' };
    }
    /**
     * Get critical thinking steps for a technique
     */
    getCriticalSteps(technique) {
        const criticalStepMap = {
            six_hats: [5], // Black hat step
            design_thinking: [2, 5], // Define and Test steps
            po: [4], // Practical solutions step
            scamper: [6], // Eliminate step
            triz: [1, 4], // Identify contradiction and minimize
        };
        return criticalStepMap[technique] || [];
    }
    /**
     * Format flexibility warning for display
     */
    formatFlexibilityWarning(flexibility, alternatives) {
        if (this.disableThoughtLogging || flexibility > 0.4) {
            return '';
        }
        const lines = [];
        const borderLength = this.maxLineLength;
        // Determine severity
        const severity = flexibility < 0.2 ? 'critical' : flexibility < 0.3 ? 'warning' : 'caution';
        const color = severity === 'critical' ? chalk.red : severity === 'warning' ? chalk.yellow : chalk.blue;
        // Header
        lines.push(color('┌' + '─'.repeat(borderLength - 2) + '┐'));
        // Title
        const title = ` ⚠️  Flexibility Alert: ${(flexibility * 100).toFixed(0)}% remaining `;
        const titlePadding = Math.max(0, borderLength - title.length - 2);
        lines.push(color('│') +
            ' '.repeat(Math.floor(titlePadding / 2)) +
            color.bold(title) +
            ' '.repeat(Math.ceil(titlePadding / 2)) +
            color('│'));
        lines.push(color('├' + '─'.repeat(borderLength - 2) + '┤'));
        // Message
        const message = severity === 'critical'
            ? 'Critical: Very few options remain. Consider escape protocols.'
            : severity === 'warning'
                ? 'Warning: Options are becoming limited. Generate alternatives now.'
                : 'Caution: Flexibility decreasing. Monitor path dependencies.';
        this.wrapText(message, borderLength - 4).forEach(line => {
            lines.push(color('│') + ' ' + line.padEnd(borderLength - 4) + ' ' + color('│'));
        });
        // Show alternatives if available
        if (alternatives && alternatives.length > 0) {
            lines.push(color('├' + '─'.repeat(borderLength - 2) + '┤'));
            lines.push(color('│') +
                ' ' +
                chalk.bold('Alternative Approaches:').padEnd(borderLength - 4) +
                ' ' +
                color('│'));
            alternatives.slice(0, 3).forEach((alt, i) => {
                const altText = `${i + 1}. ${alt}`;
                this.wrapText(altText, borderLength - 6).forEach(line => {
                    lines.push(color('│') + '  ' + line.padEnd(borderLength - 5) + ' ' + color('│'));
                });
            });
        }
        lines.push(color('└' + '─'.repeat(borderLength - 2) + '┘'));
        return lines.join('\n');
    }
    /**
     * Format escape recommendations for display
     */
    formatEscapeRecommendations(routes) {
        if (this.disableThoughtLogging || routes.length === 0) {
            return '';
        }
        const lines = [];
        const borderLength = this.maxLineLength;
        // Header
        lines.push(chalk.cyan('┌' + '─'.repeat(borderLength - 2) + '┐'));
        // Title
        const title = ` 🚪 Escape Routes Available `;
        const titlePadding = Math.max(0, borderLength - title.length - 2);
        lines.push(chalk.cyan('│') +
            ' '.repeat(Math.floor(titlePadding / 2)) +
            chalk.bold.cyan(title) +
            ' '.repeat(Math.ceil(titlePadding / 2)) +
            chalk.cyan('│'));
        lines.push(chalk.cyan('├' + '─'.repeat(borderLength - 2) + '┤'));
        // Routes
        routes.forEach((route, i) => {
            if (i > 0) {
                lines.push(chalk.cyan('├' + '─'.repeat(borderLength - 2) + '┤'));
            }
            const routeTitle = `Option ${i + 1}: ${route.name}`;
            lines.push(chalk.cyan('│') +
                ' ' +
                chalk.bold(routeTitle).padEnd(borderLength - 4) +
                ' ' +
                chalk.cyan('│'));
            this.wrapText(route.description, borderLength - 6).forEach(line => {
                lines.push(chalk.cyan('│') + '  ' + line.padEnd(borderLength - 5) + ' ' + chalk.cyan('│'));
            });
        });
        lines.push(chalk.cyan('└' + '─'.repeat(borderLength - 2) + '┘'));
        return lines.join('\n');
    }
    /**
     * Format ergodicity prompt for display
     */
    formatErgodicityPrompt(prompt) {
        if (this.disableThoughtLogging) {
            return '';
        }
        const lines = [];
        const borderLength = this.maxLineLength;
        // Header with warning colors
        lines.push(chalk.yellow('┌' + '─'.repeat(borderLength - 2) + '┐'));
        // Title
        const title = ' 🎲 ERGODICITY CHECK ';
        const titlePadding = Math.max(0, borderLength - title.length - 2);
        const paddingLeft = Math.floor(titlePadding / 2);
        const paddingRight = titlePadding - paddingLeft;
        lines.push(chalk.yellow('│') +
            ' '.repeat(paddingLeft) +
            chalk.bold.yellow(title) +
            ' '.repeat(paddingRight) +
            chalk.yellow('│'));
        lines.push(chalk.yellow('├' + '─'.repeat(borderLength - 2) + '┤'));
        // Prompt text
        const promptLines = this.wrapText(prompt.promptText, borderLength - 4);
        promptLines.forEach(line => {
            lines.push(chalk.yellow('│') + ' ' + chalk.white(line.padEnd(borderLength - 3)) + chalk.yellow('│'));
        });
        // Follow-up if present
        if (prompt.followUp) {
            lines.push(chalk.yellow('│') + ' '.repeat(borderLength - 2) + chalk.yellow('│'));
            const followUpLines = this.wrapText(prompt.followUp, borderLength - 4);
            followUpLines.forEach(line => {
                lines.push(chalk.yellow('│') +
                    ' ' +
                    chalk.bold.red(line.padEnd(borderLength - 3)) +
                    chalk.yellow('│'));
            });
        }
        // Footer
        lines.push(chalk.yellow('└' + '─'.repeat(borderLength - 2) + '┘'));
        return lines.join('\n');
    }
}
//# sourceMappingURL=VisualFormatter.js.map