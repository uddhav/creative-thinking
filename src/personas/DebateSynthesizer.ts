/**
 * DebateSynthesizer - Formats and structures debate outcomes
 *
 * Extracts positions from each persona's completed session,
 * structures agreements, disagreements, key arguments, and evidence,
 * and generates an actionable synthesis.
 */

import type { PersonaDefinition } from './types.js';

export interface PersonaPosition {
  personaId: string;
  personaName: string;
  keyArguments: string[];
  evidence: string[];
  proposedSolution: string;
}

export interface DebateOutcome {
  topic: string;
  positions: PersonaPosition[];
  agreements: string[];
  disagreements: string[];
  blindSpots: string[];
  actionableSynthesis: string;
}

export class DebateSynthesizer {
  /**
   * Create a structured debate outcome from persona positions
   */
  synthesize(
    topic: string,
    positions: PersonaPosition[],
    personas: PersonaDefinition[]
  ): DebateOutcome {
    const agreements = this.findAgreements(positions);
    const disagreements = this.findDisagreements(positions);
    const blindSpots = this.findBlindSpots(positions, personas);
    const actionableSynthesis = this.generateSynthesis(
      topic,
      positions,
      agreements,
      disagreements,
      blindSpots
    );

    return {
      topic,
      positions,
      agreements,
      disagreements,
      blindSpots,
      actionableSynthesis,
    };
  }

  /**
   * Find areas where multiple personas agree
   */
  private findAgreements(positions: PersonaPosition[]): string[] {
    if (positions.length < 2) return [];

    const agreements: string[] = [];

    // Compare each pair of positions for overlapping arguments
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const shared = this.findOverlappingThemes(
          positions[i].keyArguments,
          positions[j].keyArguments
        );
        for (const theme of shared) {
          const agreement = `${positions[i].personaName} and ${positions[j].personaName} agree: ${theme}`;
          if (!agreements.includes(agreement)) {
            agreements.push(agreement);
          }
        }
      }
    }

    return agreements;
  }

  /**
   * Find areas of disagreement between personas
   */
  private findDisagreements(positions: PersonaPosition[]): string[] {
    if (positions.length < 2) return [];

    const disagreements: string[] = [];

    // Compare proposed solutions for conflicts
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].proposedSolution !== positions[j].proposedSolution) {
          disagreements.push(
            `${positions[i].personaName} proposes "${positions[i].proposedSolution}" vs ${positions[j].personaName} proposes "${positions[j].proposedSolution}"`
          );
        }
      }
    }

    return disagreements;
  }

  /**
   * Identify blind spots from persona definitions
   */
  private findBlindSpots(positions: PersonaPosition[], personas: PersonaDefinition[]): string[] {
    const blindSpots: string[] = [];

    for (const persona of personas) {
      for (const spot of persona.thinkingStyle.blindSpots) {
        blindSpots.push(`${persona.name}: ${spot}`);
      }
    }

    return blindSpots;
  }

  /**
   * Generate actionable synthesis text
   */
  private generateSynthesis(
    topic: string,
    positions: PersonaPosition[],
    agreements: string[],
    disagreements: string[],
    blindSpots: string[]
  ): string {
    const lines: string[] = [];

    lines.push(`## Debate Synthesis: ${topic}`);
    lines.push('');

    if (agreements.length > 0) {
      lines.push('### Strong Signal (Agreement)');
      lines.push('When multiple perspectives converge, the signal is stronger:');
      for (const a of agreements) {
        lines.push(`- ${a}`);
      }
      lines.push('');
    }

    if (disagreements.length > 0) {
      lines.push('### Key Decision Points (Disagreement)');
      lines.push('These require explicit trade-off decisions:');
      for (const d of disagreements) {
        lines.push(`- ${d}`);
      }
      lines.push('');
    }

    if (blindSpots.length > 0) {
      lines.push('### Watch Out (Blind Spots)');
      lines.push('No persona covered these — investigate further:');
      for (const b of blindSpots) {
        lines.push(`- ${b}`);
      }
      lines.push('');
    }

    lines.push('### Recommended Action');
    if (positions.length > 0) {
      lines.push(
        `Consider the ${agreements.length} agreement(s) as starting points, ` +
          `resolve the ${disagreements.length} disagreement(s) through experimentation, ` +
          `and actively investigate the ${blindSpots.length} identified blind spot(s).`
      );
    }

    return lines.join('\n');
  }

  /** Common structural words that shouldn't count as thematic overlap */
  private static readonly STOP_WORDS = new Set([
    'should',
    'would',
    'could',
    'using',
    'about',
    'being',
    'every',
    'their',
    'these',
    'those',
    'which',
    'while',
    'through',
    'system',
    'approach',
    'process',
    'problem',
    'solution',
    'result',
    'method',
    'based',
    'level',
    'change',
    'makes',
    'needs',
    'point',
    'thing',
    'think',
    'might',
    'still',
    'going',
  ]);

  /**
   * Extract keyword set from an argument string, filtering stop words
   */
  private extractKeywords(arg: string): Set<string> {
    return new Set(
      arg
        .toLowerCase()
        .replace(/[^a-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 4 && !DebateSynthesizer.STOP_WORDS.has(w))
    );
  }

  /**
   * Find overlapping themes between two argument lists using keyword matching.
   * Pre-computes keyword sets for args2 to avoid redundant work.
   */
  private findOverlappingThemes(args1: string[], args2: string[]): string[] {
    const overlaps: string[] = [];

    // Pre-compute keyword sets for args2 once
    const args2Keywords = args2.map(arg => this.extractKeywords(arg));

    for (const arg1 of args1) {
      const words1 = this.extractKeywords(arg1);
      if (words1.size < 2) continue; // Can't match 2+ words with fewer than 2

      for (const words2 of args2Keywords) {
        let sharedCount = 0;
        for (const w of words1) {
          if (words2.has(w)) {
            sharedCount++;
            if (sharedCount >= 2) break;
          }
        }
        // If significant word overlap, they're discussing the same theme
        if (sharedCount >= 2) {
          overlaps.push(arg1);
          break;
        }
      }
    }

    return overlaps;
  }
}
