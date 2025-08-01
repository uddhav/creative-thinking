/**
 * Visual Formatter
 * Handles visual output formatting for the console
 */

import chalk from 'chalk';
import type { LateralTechnique, ThinkingOperationData } from '../types/index.js';

export class VisualFormatter {
  private readonly maxLineLength = 80;
  private readonly disableThoughtLogging: boolean;

  constructor(disableThoughtLogging = false) {
    this.disableThoughtLogging = disableThoughtLogging;
  }

  /**
   * Format the main output display
   */
  formatOutput(
    technique: LateralTechnique,
    problem: string,
    currentStep: number,
    totalSteps: number,
    stepInfo: { name: string; focus: string; emoji: string } | null,
    modeIndicator: { color: typeof chalk; symbol: string },
    input: ThinkingOperationData
  ): string {
    if (this.disableThoughtLogging) {
      return '';
    }

    // Handle invalid steps
    if (!stepInfo || currentStep < 1 || currentStep > totalSteps) {
      console.error(`Unknown ${technique} step ${currentStep}`);
      return '';
    }

    const lines: string[] = [];
    const borderLength = this.maxLineLength;

    // Header
    lines.push(chalk.blue('┌' + '─'.repeat(borderLength - 2) + '┐'));

    // Title with mode indicator
    const title = ` ${modeIndicator.symbol} ${this.getTechniqueEmoji(technique)} ${this.getTechniqueName(technique)} - Step ${currentStep}/${totalSteps} `;
    const titlePadding = Math.max(0, borderLength - title.length - 2);
    const paddingLeft = Math.floor(titlePadding / 2);
    const paddingRight = titlePadding - paddingLeft;
    lines.push(
      chalk.blue('│') +
        ' '.repeat(paddingLeft) +
        modeIndicator.color(title) +
        ' '.repeat(paddingRight) +
        chalk.blue('│')
    );

    // Problem
    lines.push(chalk.blue('├' + '─'.repeat(borderLength - 2) + '┤'));
    this.addWrappedLine(lines, `Problem: ${problem}`, chalk.white, borderLength);

    // Step info
    lines.push(chalk.blue('├' + '─'.repeat(borderLength - 2) + '┤'));
    lines.push(
      chalk.blue('│') +
        chalk.bold(` ${stepInfo.emoji} ${stepInfo.name}: `) +
        chalk.cyan(stepInfo.focus.slice(0, borderLength - stepInfo.name.length - 8)) +
        ' '.repeat(Math.max(0, borderLength - stepInfo.name.length - stepInfo.focus.length - 7)) +
        chalk.blue('│')
    );

    // Progress bar
    lines.push(chalk.blue('├' + '─'.repeat(borderLength - 2) + '┤'));
    lines.push(
      chalk.blue('│') +
        ' Progress: ' +
        this.formatProgressBar(currentStep, totalSteps, borderLength - 14) +
        ' ' +
        chalk.blue('│')
    );

    // Risk section if present
    if (input.risks && input.risks.length > 0) {
      lines.push(...this.formatRiskSection(input.risks, borderLength));
    }

    // Mitigation section if present
    if (input.mitigations && input.mitigations.length > 0) {
      lines.push(
        ...this.formatMitigationSection(
          input.mitigations,
          borderLength,
          !!(input.risks && input.risks.length > 0)
        )
      );
    }

    // Footer
    lines.push(chalk.blue('└' + '─'.repeat(borderLength - 2) + '┘'));

    return lines.join('\n');
  }

  /**
   * Format progress bar
   */
  private formatProgressBar(current: number, total: number, width: number): string {
    const filled = Math.floor((current / total) * width);
    const empty = width - filled;
    const percentage = Math.round((current / total) * 100);

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    return `${bar} ${chalk.yellow(`${percentage}%`)}`;
  }

  /**
   * Add wrapped line to output
   */
  private addWrappedLine(
    lines: string[],
    text: string,
    color: typeof chalk,
    maxLength: number
  ): void {
    const words = text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const truncatedWord = this.truncateWord(word, maxLength - 4);
      if (currentLine.length + truncatedWord.length + 1 > maxLength - 4) {
        lines.push(chalk.blue('│ ') + color(currentLine.padEnd(maxLength - 4)) + chalk.blue(' │'));
        currentLine = truncatedWord;
      } else {
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
  private truncateWord(word: string, maxLength: number): string {
    if (word.length <= maxLength) return word;
    return word.slice(0, maxLength - 3) + '...';
  }

  /**
   * Format risk section
   */
  private formatRiskSection(risks: string[], maxLength: number): string[] {
    const lines: string[] = [];
    lines.push(chalk.blue('├' + '─'.repeat(maxLength - 2) + '┤'));
    lines.push(
      chalk.blue('│') +
        chalk.yellow(' ⚠️  Risks Identified:') +
        ' '.repeat(maxLength - 23) +
        chalk.blue('│')
    );

    risks.forEach((risk, index) => {
      const riskText = ` ${index + 1}. ${risk}`;
      this.addWrappedLine(lines, riskText, chalk.yellow, maxLength);
    });

    return lines;
  }

  /**
   * Format mitigation section
   */
  private formatMitigationSection(
    mitigations: string[],
    maxLength: number,
    hasRisks: boolean
  ): string[] {
    const lines: string[] = [];

    if (!hasRisks) {
      lines.push(chalk.blue('├' + '─'.repeat(maxLength - 2) + '┤'));
    }

    lines.push(
      chalk.blue('│') +
        chalk.green(' ✅ Mitigations:') +
        ' '.repeat(maxLength - 18) +
        chalk.blue('│')
    );

    mitigations.forEach((mitigation, index) => {
      const mitigationText = ` ${index + 1}. ${mitigation}`;
      this.addWrappedLine(lines, mitigationText, chalk.green, maxLength);
    });

    return lines;
  }

  /**
   * Get technique emoji
   */
  private getTechniqueEmoji(technique: LateralTechnique): string {
    const emojis: Record<LateralTechnique, string> = {
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
  private getTechniqueName(technique: LateralTechnique): string {
    const names: Record<LateralTechnique, string> = {
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
  formatSessionSummary(
    technique: LateralTechnique,
    problem: string,
    insights: string[],
    metrics?: {
      creativityScore?: number;
      risksCaught?: number;
      antifragileFeatures?: number;
    }
  ): string {
    if (this.disableThoughtLogging) {
      return '';
    }

    const lines: string[] = [];
    const borderLength = this.maxLineLength;

    // Header
    lines.push(chalk.green('╔' + '═'.repeat(borderLength - 2) + '╗'));
    lines.push(
      chalk.green('║') +
        chalk.bold.white(' 🎉 Session Complete! '.padEnd(borderLength - 2)) +
        chalk.green('║')
    );

    // Summary
    lines.push(chalk.green('╠' + '═'.repeat(borderLength - 2) + '╣'));
    lines.push(
      chalk.green('║') +
        chalk.white(
          ` Technique: ${this.getTechniqueEmoji(technique)} ${this.getTechniqueName(technique)}`.padEnd(
            borderLength - 2
          )
        ) +
        chalk.green('║')
    );
    this.addWrappedLine(lines, `Problem: ${problem}`, chalk.white, borderLength);

    // Insights
    if (insights.length > 0) {
      lines.push(chalk.green('╠' + '═'.repeat(borderLength - 2) + '╣'));
      lines.push(
        chalk.green('║') +
          chalk.bold.cyan(' 💡 Key Insights:'.padEnd(borderLength - 2)) +
          chalk.green('║')
      );
      insights.forEach((insight, index) => {
        this.addWrappedLine(lines, ` ${index + 1}. ${insight}`, chalk.cyan, borderLength);
      });
    }

    // Metrics
    if (metrics) {
      lines.push(chalk.green('╠' + '═'.repeat(borderLength - 2) + '╣'));
      lines.push(
        chalk.green('║') +
          chalk.bold.yellow(' 📊 Metrics:'.padEnd(borderLength - 2)) +
          chalk.green('║')
      );

      if (metrics.creativityScore !== undefined) {
        lines.push(
          chalk.green('║') +
            chalk.yellow(
              `  Creativity Score: ${metrics.creativityScore.toFixed(1)}/10`.padEnd(
                borderLength - 2
              )
            ) +
            chalk.green('║')
        );
      }
      if (metrics.risksCaught !== undefined && metrics.risksCaught > 0) {
        lines.push(
          chalk.green('║') +
            chalk.yellow(`  Risks Identified: ${metrics.risksCaught}`.padEnd(borderLength - 2)) +
            chalk.green('║')
        );
      }
      if (metrics.antifragileFeatures !== undefined && metrics.antifragileFeatures > 0) {
        lines.push(
          chalk.green('║') +
            chalk.yellow(
              `  Antifragile Features: ${metrics.antifragileFeatures}`.padEnd(borderLength - 2)
            ) +
            chalk.green('║')
        );
      }
    }

    // Footer
    lines.push(chalk.green('╚' + '═'.repeat(borderLength - 2) + '╝'));

    return lines.join('\n');
  }

  /**
   * Get mode indicator for current thinking mode
   */
  getModeIndicator(
    technique: LateralTechnique,
    currentStep: number
  ): { color: typeof chalk; symbol: string } {
    // Determine if current step is creative or critical
    const criticalSteps = this.getCriticalSteps(technique);
    const isCritical = criticalSteps.includes(currentStep);

    return isCritical ? { color: chalk.red, symbol: '⚠️' } : { color: chalk.green, symbol: '✨' };
  }

  /**
   * Get critical thinking steps for a technique
   */
  private getCriticalSteps(technique: LateralTechnique): number[] {
    const criticalStepMap: Partial<Record<LateralTechnique, number[]>> = {
      six_hats: [5], // Black hat step
      design_thinking: [2, 5], // Define and Test steps
      po: [4], // Practical solutions step
      scamper: [6], // Eliminate step
      triz: [1, 4], // Identify contradiction and minimize
    };

    return criticalStepMap[technique] || [];
  }
}
