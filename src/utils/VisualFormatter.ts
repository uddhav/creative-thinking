/**
 * Visual Formatter
 * Handles visual output formatting for the console
 */

import chalk from 'chalk';
import type {
  LateralTechnique,
  ThinkingOperationData,
  ScamperAction,
  DesignThinkingStage,
  DisneyRole,
  SessionData,
} from '../types/index.js';
import type { PlanThinkingSessionOutput } from '../types/planning.js';
import { SessionCompletionTracker } from '../core/session/SessionCompletionTracker.js';

export class VisualFormatter {
  private readonly maxLineLength = 80;
  private readonly disableThoughtLogging: boolean;
  private readonly showTechniqueIndicators: boolean;
  private completionTracker = new SessionCompletionTracker();

  constructor(disableThoughtLogging = false) {
    this.disableThoughtLogging = disableThoughtLogging;
    // Enable visual indicators via environment variable
    this.showTechniqueIndicators = process.env.SHOW_TECHNIQUE_INDICATORS === 'true';
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
    input: ThinkingOperationData,
    session?: SessionData,
    plan?: PlanThinkingSessionOutput
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

    // Add persona indicator if present (truncate for display)
    if (input.persona) {
      const personaLabel = ` 🎭 Thinking as: ${input.persona.slice(0, 200)} `;
      const personaPadding = Math.max(0, borderLength - personaLabel.length - 2);
      const personaPaddingLeft = Math.floor(personaPadding / 2);
      const personaPaddingRight = personaPadding - personaPaddingLeft;
      lines.push(
        chalk.blue('│') +
          ' '.repeat(personaPaddingLeft) +
          chalk.magenta(personaLabel) +
          ' '.repeat(personaPaddingRight) +
          chalk.blue('│')
      );
    }

    // Add progress bar if session and plan are available
    if (session && plan) {
      const progressDisplay = this.formatSessionProgressBar(
        session,
        plan,
        currentStep,
        totalSteps,
        !input.nextStepNeeded
      );
      if (progressDisplay) {
        lines.push(chalk.blue('│') + progressDisplay + chalk.blue('│'));
      }
    }

    // Add technique state indicator if enabled - early exit for performance
    if (this.showTechniqueIndicators) {
      const stateIndicator = this.getTechniqueStateIndicator(technique, currentStep, input);
      const riskIndicator = this.getRiskLevelIndicator(input.risks);
      const flexibilityIndicator = this.getFlexibilityIndicator(input);

      if (stateIndicator || riskIndicator || flexibilityIndicator) {
        const indicators = [stateIndicator, riskIndicator, flexibilityIndicator]
          .filter(Boolean)
          .join(' ');

        const indicatorPadding = Math.max(0, borderLength - indicators.length - 2);
        const indicatorPaddingLeft = Math.floor(indicatorPadding / 2);
        const indicatorPaddingRight = indicatorPadding - indicatorPaddingLeft;

        lines.push(
          chalk.blue('│') +
            ' '.repeat(indicatorPaddingLeft) +
            chalk.gray(indicators) +
            ' '.repeat(indicatorPaddingRight) +
            chalk.blue('│')
        );
      }
    }

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
   * Wrap text to fit within specified width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
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
      cultural_integration: '🌍',
      collective_intel: '🧬',
      disney_method: '🎬',
      nine_windows: '🪟',
      quantum_superposition: '⚛️',
      temporal_creativity: '⏳',
      paradoxical_problem: '⚖️',
      meta_learning: '🧠',
      biomimetic_path: '🦠',
      first_principles: '🔬',
      neuro_computational: '⚛️',
      criteria_based_analysis: '🔬',
      linguistic_forensics: '🔤',
      competing_hypotheses: '⚖️',
      reverse_benchmarking: '🔄',
      context_reframing: '🖼️',
      perception_optimization: '👁️',
      anecdotal_signal: '🔍',
      cognitive_bias_audit: '🪞',
      latticework: '🧰',
      keeper_test: '🛒',
      steelman_red_team: '🥊',
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
      cultural_integration: 'Cultural Integration',
      collective_intel: 'Collective Intelligence',
      disney_method: 'Disney Method',
      nine_windows: 'Nine Windows',
      quantum_superposition: 'Quantum Superposition',
      temporal_creativity: 'Temporal Creativity',
      paradoxical_problem: 'Paradoxical Problem Solving',
      meta_learning: 'Meta-Learning from Path Integration',
      biomimetic_path: 'Biomimetic Path Management',
      first_principles: 'First Principles Thinking',
      neuro_computational: 'Neuro-Computational Synthesis',
      criteria_based_analysis: 'Criteria-Based Analysis',
      linguistic_forensics: 'Linguistic Forensics',
      competing_hypotheses: 'Competing Hypotheses Analysis',
      reverse_benchmarking: 'Reverse Benchmarking',
      context_reframing: 'Context Reframing',
      perception_optimization: 'Perception Optimization',
      anecdotal_signal: 'Anecdotal Signal Detection',
      cognitive_bias_audit: 'Cognitive Bias Audit',
      latticework: 'Latticework of Mental Models',
      keeper_test: 'Keeper Test',
      steelman_red_team: 'Steelman & Red Team',
    };
    return names[technique] || technique;
  }

  /**
   * Get technique-specific state indicator
   */
  private getTechniqueStateIndicator(
    technique: LateralTechnique,
    currentStep: number,
    input: ThinkingOperationData
  ): string {
    // Already checked in formatOutput, but keep for safety
    let indicator = '';

    switch (technique) {
      case 'six_hats': {
        // Show current hat color
        const hatMapping: Record<number, { color: string; name: string }> = {
          1: { color: '🔵', name: 'Blue' },
          2: { color: '⚪', name: 'White' },
          3: { color: '🔴', name: 'Red' },
          4: { color: '🟡', name: 'Yellow' },
          5: { color: '⚫', name: 'Black' },
          6: { color: '🟢', name: 'Green' },
          7: { color: '🟣', name: 'Purple' },
        };
        const hat = hatMapping[currentStep];
        if (hat) {
          indicator = `[${hat.color} ${hat.name} Hat]`;
        }
        break;
      }

      case 'scamper': {
        // Show current SCAMPER action
        if (input.scamperAction) {
          const actionEmojis: Record<ScamperAction, string> = {
            substitute: '🔄',
            combine: '🔗',
            adapt: '🔧',
            modify: '✏️',
            put_to_other_use: '🎯',
            eliminate: '❌',
            reverse: '↩️',
            parameterize: '📊',
          };
          const emoji = actionEmojis[input.scamperAction] || '❓';
          indicator = `[${emoji} ${input.scamperAction.toUpperCase()}]`;
        }
        break;
      }

      case 'design_thinking': {
        // Show current design thinking stage
        if (input.designStage) {
          const stageEmojis: Record<DesignThinkingStage, string> = {
            empathize: '💚',
            define: '🎯',
            ideate: '💡',
            prototype: '🔨',
            test: '🧪',
          };
          const emoji = stageEmojis[input.designStage] || '❓';
          indicator = `[${emoji} ${input.designStage.charAt(0).toUpperCase() + input.designStage.slice(1)}]`;
        }
        break;
      }

      case 'disney_method': {
        // Show current Disney role
        if (input.disneyRole) {
          const roleEmojis: Record<DisneyRole, string> = {
            dreamer: '🌟',
            realist: '🔨',
            critic: '🔍',
          };
          const emoji = roleEmojis[input.disneyRole] || '❓';
          indicator = `[${emoji} ${input.disneyRole.charAt(0).toUpperCase() + input.disneyRole.slice(1)}]`;
        }
        break;
      }

      case 'neural_state': {
        // Show dominant network
        if (input.dominantNetwork) {
          const networkEmojis: Record<'dmn' | 'ecn', string> = {
            dmn: '🧘',
            ecn: '⚡',
          };
          const emoji = networkEmojis[input.dominantNetwork] || '🧠';
          indicator = `[${emoji} ${input.dominantNetwork.toUpperCase()}]`;
        }
        break;
      }

      case 'nine_windows': {
        // Show current window position
        if (input.currentCell) {
          const timeEmojis: Record<'past' | 'present' | 'future', string> = {
            past: '⏮️',
            present: '▶️',
            future: '⏭️',
          };
          const systemEmojis: Record<'sub-system' | 'system' | 'super-system', string> = {
            'sub-system': '🔧',
            system: '⚙️',
            'super-system': '🌍',
          };
          const timeEmoji = timeEmojis[input.currentCell.timeFrame] || '❓';
          const systemEmoji = systemEmojis[input.currentCell.systemLevel] || '❓';
          indicator = `[${timeEmoji}${systemEmoji}]`;
        }
        break;
      }
    }

    return indicator;
  }

  /**
   * Get risk level indicator
   */
  private getRiskLevelIndicator(risks: string[] | undefined): string {
    // Already checked in formatOutput, but keep for safety
    if (!risks) {
      return '';
    }

    const riskCount = risks.length;
    if (riskCount === 0) {
      return '[🟢 Low Risk]';
    } else if (riskCount <= 2) {
      return '[🟡 Medium Risk]';
    } else if (riskCount <= 4) {
      return '[🔴 High Risk]';
    } else {
      return '[⚫ Ruin Risk]';
    }
  }

  /**
   * Get flexibility score indicator
   */
  private getFlexibilityIndicator(input: ThinkingOperationData): string {
    const flexibility = input.flexibilityScore;

    // Already checked in formatOutput, but keep for safety
    if (flexibility === undefined || flexibility > 0.4) {
      return '';
    }

    if (flexibility < 0.2) {
      return `[⛔ Flexibility: ${(flexibility * 100).toFixed(0)}%]`;
    } else if (flexibility < 0.3) {
      return `[⚠️  Flexibility: ${(flexibility * 100).toFixed(0)}%]`;
    } else {
      return `[🔶 Flexibility: ${(flexibility * 100).toFixed(0)}%]`;
    }
  }

  /**
   * Format session summary
   */
  formatSessionSummary(
    technique: LateralTechnique,
    problem: string,
    insights: string[],
    metrics?: {
      /** 0-1 coverage of the outputs the technique asks for. */
      outputCompleteness?: number;
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

      if (metrics.outputCompleteness !== undefined) {
        lines.push(
          chalk.green('║') +
            chalk.yellow(
              // 0-1 fraction, shown as a percentage so it is not read as a rating.
              `  Output Completeness: ${(metrics.outputCompleteness * 100).toFixed(0)}%`.padEnd(
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

  /**
   * Format flexibility warning for display
   */
  formatFlexibilityWarning(flexibility: number, alternatives?: string[]): string {
    if (this.disableThoughtLogging || flexibility > 0.4) {
      return '';
    }

    const lines: string[] = [];
    const borderLength = this.maxLineLength;

    // Determine severity
    const severity = flexibility < 0.2 ? 'critical' : flexibility < 0.3 ? 'warning' : 'caution';
    const color =
      severity === 'critical' ? chalk.red : severity === 'warning' ? chalk.yellow : chalk.blue;

    // Header
    lines.push(color('┌' + '─'.repeat(borderLength - 2) + '┐'));

    // Title
    const title = ` ⚠️  Flexibility Alert: ${(flexibility * 100).toFixed(0)}% remaining `;
    const titlePadding = Math.max(0, borderLength - title.length - 2);
    lines.push(
      color('│') +
        ' '.repeat(Math.floor(titlePadding / 2)) +
        color.bold(title) +
        ' '.repeat(Math.ceil(titlePadding / 2)) +
        color('│')
    );

    lines.push(color('├' + '─'.repeat(borderLength - 2) + '┤'));

    // Message
    const message =
      severity === 'critical'
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
      lines.push(
        color('│') +
          ' ' +
          chalk.bold('Alternative Approaches:').padEnd(borderLength - 4) +
          ' ' +
          color('│')
      );
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
   * Format reflexivity warning for display
   */
  formatReflexivityWarning(warning: {
    level: 'info' | 'caution' | 'warning' | 'critical';
    message: string;
    currentConstraints: number;
    pathsForeclosed: string[];
    suggestions?: string[];
  }): string {
    if (this.disableThoughtLogging) {
      return '';
    }

    const lines: string[] = [];
    const borderLength = this.maxLineLength;

    // Determine color based on warning level
    const color =
      warning.level === 'critical'
        ? chalk.red
        : warning.level === 'warning'
          ? chalk.yellow
          : warning.level === 'caution'
            ? chalk.blue
            : chalk.gray;

    // Header
    lines.push(color('┌' + '─'.repeat(borderLength - 2) + '┐'));

    // Title
    const icon = warning.level === 'critical' ? '🔴' : warning.level === 'warning' ? '⚠️' : '⚡';
    const title = ` ${icon}  Reflexivity Alert: ${warning.currentConstraints} constraints `;
    const titlePadding = Math.max(0, borderLength - title.length - 2);
    lines.push(
      color('│') +
        ' '.repeat(Math.floor(titlePadding / 2)) +
        color.bold(title) +
        ' '.repeat(Math.ceil(titlePadding / 2)) +
        color('│')
    );

    lines.push(color('├' + '─'.repeat(borderLength - 2) + '┤'));

    // Message
    this.wrapText(warning.message, borderLength - 4).forEach(line => {
      lines.push(color('│') + ' ' + line.padEnd(borderLength - 4) + ' ' + color('│'));
    });

    // Show foreclosed paths if available
    if (warning.pathsForeclosed && warning.pathsForeclosed.length > 0) {
      lines.push(color('├' + '─'.repeat(borderLength - 2) + '┤'));
      lines.push(
        color('│') +
          ' ' +
          chalk.bold('Foreclosed Paths:').padEnd(borderLength - 4) +
          ' ' +
          color('│')
      );
      warning.pathsForeclosed.slice(0, 3).forEach(path => {
        const pathText = `• ${path}`;
        this.wrapText(pathText, borderLength - 6).forEach(line => {
          lines.push(color('│') + '  ' + line.padEnd(borderLength - 5) + ' ' + color('│'));
        });
      });
      if (warning.pathsForeclosed.length > 3) {
        const moreText = `... and ${warning.pathsForeclosed.length - 3} more`;
        lines.push(color('│') + '  ' + moreText.padEnd(borderLength - 5) + ' ' + color('│'));
      }
    }

    // Show suggestions if available
    if (warning.suggestions && warning.suggestions.length > 0) {
      lines.push(color('├' + '─'.repeat(borderLength - 2) + '┤'));
      lines.push(
        color('│') + ' ' + chalk.bold('Suggestions:').padEnd(borderLength - 4) + ' ' + color('│')
      );
      warning.suggestions.forEach((suggestion, i) => {
        const suggestionText = `${i + 1}. ${suggestion}`;
        this.wrapText(suggestionText, borderLength - 6).forEach(line => {
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
  formatEscapeRecommendations(routes: Array<{ name: string; description: string }>): string {
    if (this.disableThoughtLogging || routes.length === 0) {
      return '';
    }

    const lines: string[] = [];
    const borderLength = this.maxLineLength;

    // Header
    lines.push(chalk.cyan('┌' + '─'.repeat(borderLength - 2) + '┐'));

    // Title
    const title = ` 🚪 Escape Routes Available `;
    const titlePadding = Math.max(0, borderLength - title.length - 2);
    lines.push(
      chalk.cyan('│') +
        ' '.repeat(Math.floor(titlePadding / 2)) +
        chalk.bold.cyan(title) +
        ' '.repeat(Math.ceil(titlePadding / 2)) +
        chalk.cyan('│')
    );

    lines.push(chalk.cyan('├' + '─'.repeat(borderLength - 2) + '┤'));

    // Routes
    routes.forEach((route, i) => {
      if (i > 0) {
        lines.push(chalk.cyan('├' + '─'.repeat(borderLength - 2) + '┤'));
      }

      const routeTitle = `Option ${i + 1}: ${route.name}`;
      lines.push(
        chalk.cyan('│') +
          ' ' +
          chalk.bold(routeTitle).padEnd(borderLength - 4) +
          ' ' +
          chalk.cyan('│')
      );

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
  formatErgodicityPrompt(prompt: { promptText: string; followUp?: string }): string {
    if (this.disableThoughtLogging) {
      return '';
    }

    const lines: string[] = [];
    const borderLength = this.maxLineLength;

    // Header with warning colors
    lines.push(chalk.yellow('┌' + '─'.repeat(borderLength - 2) + '┐'));

    // Title
    const title = ' 🎲 ERGODICITY CHECK ';
    const titlePadding = Math.max(0, borderLength - title.length - 2);
    const paddingLeft = Math.floor(titlePadding / 2);
    const paddingRight = titlePadding - paddingLeft;
    lines.push(
      chalk.yellow('│') +
        ' '.repeat(paddingLeft) +
        chalk.bold.yellow(title) +
        ' '.repeat(paddingRight) +
        chalk.yellow('│')
    );

    lines.push(chalk.yellow('├' + '─'.repeat(borderLength - 2) + '┤'));

    // Prompt text
    const promptLines = this.wrapText(prompt.promptText, borderLength - 4);
    promptLines.forEach(line => {
      lines.push(
        chalk.yellow('│') + ' ' + chalk.white(line.padEnd(borderLength - 3)) + chalk.yellow('│')
      );
    });

    // Follow-up if present
    if (prompt.followUp) {
      lines.push(chalk.yellow('│') + ' '.repeat(borderLength - 2) + chalk.yellow('│'));
      const followUpLines = this.wrapText(prompt.followUp, borderLength - 4);
      followUpLines.forEach(line => {
        lines.push(
          chalk.yellow('│') +
            ' ' +
            chalk.bold.red(line.padEnd(borderLength - 3)) +
            chalk.yellow('│')
        );
      });
    }

    // Footer
    lines.push(chalk.yellow('└' + '─'.repeat(borderLength - 2) + '┘'));

    return lines.join('\n');
  }

  /**
   * Format progress bar for session completion
   */
  private formatSessionProgressBar(
    session: SessionData,
    plan: PlanThinkingSessionOutput,
    _currentStep: number,
    _totalSteps: number,
    isTerminating: boolean
  ): string {
    // Calculate completion metadata
    const metadata = this.completionTracker.calculateCompletionMetadata(
      session,
      plan,
      isTerminating
    );
    const percentage = Math.round(metadata.overallProgress * 100);

    // Create progress bar
    const barWidth = 30;
    const filled = Math.round(metadata.overallProgress * barWidth);
    const empty = barWidth - filled;
    const progressBar = '█'.repeat(filled) + '░'.repeat(empty);

    // Determine color based on progress
    let barColor = chalk.green;
    if (metadata.overallProgress < 0.3) {
      barColor = chalk.red;
    } else if (metadata.overallProgress < 0.5) {
      barColor = chalk.yellow;
    } else if (metadata.overallProgress < 0.8) {
      barColor = chalk.cyan;
    }

    // Format the progress line
    const progressText = ` Progress: ${barColor(progressBar)} ${percentage}% (${metadata.completedSteps}/${metadata.totalPlannedSteps} steps) `;

    // Add warning indicator if needed
    let warningIndicator = '';
    // Only flag gaps once the session is ending. Every technique a plan has not
    // reached yet counts as a "critical gap", so this painted the progress bar
    // red on step 1 of every multi-technique session.
    if (isTerminating && metadata.criticalGapsIdentified.length > 0) {
      warningIndicator = chalk.red(' ⚠️');
    } else if (!metadata.minimumThresholdMet) {
      warningIndicator = chalk.yellow(' ⚡');
    }

    // Center the progress text
    const totalLength = progressText.length + warningIndicator.length;
    const padding = Math.max(0, this.maxLineLength - totalLength - 2);
    const paddingLeft = Math.floor(padding / 2);
    const paddingRight = padding - paddingLeft;

    return ' '.repeat(paddingLeft) + progressText + warningIndicator + ' '.repeat(paddingRight);
  }

  /**
   * Format inline progress indicator (compact)
   */
  formatInlineProgress(progress: number): string {
    const percentage = Math.round(progress * 100);
    let color = chalk.green;

    if (progress < 0.3) {
      color = chalk.red;
    } else if (progress < 0.5) {
      color = chalk.yellow;
    } else if (progress < 0.8) {
      color = chalk.cyan;
    }

    return color(`[${percentage}%]`);
  }
}
