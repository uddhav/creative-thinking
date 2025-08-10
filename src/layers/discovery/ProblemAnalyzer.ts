/**
 * ProblemAnalyzer - Handles problem categorization and analysis
 * Extracted from discoverTechniques to improve maintainability
 */

import { NLPService } from '../../nlp/NLPService.js';

export class ProblemAnalyzer {
  private nlpService: NLPService;

  constructor() {
    this.nlpService = NLPService.getInstance();
  }

  /**
   * Categorize the problem based on NLP analysis and patterns
   */
  categorizeProblem(problem: string, context?: string): string {
    const fullText = `${problem} ${context || ''}`;

    // Check for paradoxes and contradictions using proper NLP
    if (this.detectParadoxicalPattern(fullText)) {
      return 'paradoxical';
    }

    // Check for temporal since it's specific
    if (
      fullText.includes('time') ||
      fullText.includes('deadline') ||
      fullText.includes('schedule') ||
      fullText.includes('temporal') ||
      fullText.includes('timing') ||
      fullText.includes('calendar')
    ) {
      return 'temporal';
    }
    // Check for cognitive/focus problems
    if (
      fullText.includes('focus') ||
      fullText.includes('cognitive') ||
      fullText.includes('attention') ||
      fullText.includes('mental') ||
      fullText.includes('brain') ||
      fullText.includes('productivity')
    ) {
      return 'cognitive';
    }
    // Check for implementation/execution problems
    if (
      fullText.includes('implement') ||
      fullText.includes('execute') ||
      fullText.includes('deploy') ||
      fullText.includes('launch') ||
      fullText.includes('realize') ||
      fullText.includes('make it happen') ||
      fullText.includes('put into practice')
    ) {
      return 'implementation';
    }

    // Check for system-level analysis problems
    if (
      fullText.includes('system') ||
      fullText.includes('ecosystem') ||
      fullText.includes('holistic') ||
      fullText.includes('comprehensive') ||
      fullText.includes('multi-level') ||
      fullText.includes('scale') ||
      fullText.includes('component')
    ) {
      return 'systems';
    }

    // Check for organizational/cultural keywords before user-centered (to prioritize cross-cultural work)
    if (
      fullText.includes('team') ||
      fullText.includes('collaboration') ||
      fullText.includes('communication') ||
      fullText.includes('stakeholder') ||
      fullText.includes('collective') ||
      fullText.includes('consensus') ||
      fullText.includes('crowd') ||
      fullText.includes('together') ||
      fullText.includes('perspectives') ||
      fullText.includes('synthesize') ||
      fullText.includes('wisdom') ||
      fullText.includes('swarm') ||
      fullText.includes('bring') ||
      fullText.includes('multiple') ||
      fullText.includes('emergent') ||
      fullText.includes('global') ||
      fullText.includes('culture') ||
      fullText.includes('diverse') ||
      fullText.includes('inclusive') ||
      fullText.includes('multicultural')
    ) {
      return 'organizational';
    }
    if (
      fullText.includes('user') ||
      fullText.includes('customer') ||
      fullText.includes('experience')
    ) {
      return 'user-centered';
    }
    if (
      fullText.includes('technical') ||
      fullText.includes('system') ||
      fullText.includes('architecture') ||
      fullText.includes('energy') ||
      fullText.includes('machine') ||
      fullText.includes('motion') ||
      fullText.includes('physics') ||
      fullText.includes('engineering')
    ) {
      return 'technical';
    }
    if (
      fullText.includes('creative') ||
      fullText.includes('innovative') ||
      fullText.includes('new')
    ) {
      return 'creative';
    }
    if (
      fullText.includes('process') ||
      fullText.includes('workflow') ||
      fullText.includes('efficiency')
    ) {
      return 'process';
    }
    if (
      fullText.includes('strategy') ||
      fullText.includes('business') ||
      fullText.includes('market')
    ) {
      return 'strategic';
    }

    return 'general';
  }

  /**
   * Detect paradoxical patterns using proper NLP semantic analysis
   */
  private detectParadoxicalPattern(text: string): boolean {
    // Use the NLP service for proper paradox detection
    const paradoxResult = this.nlpService.detectParadox(text);

    // Also check for specific time-exclusions
    const lowerText = text.toLowerCase();

    // Skip if it's purely about time conflicts (not true paradoxes)
    if (paradoxResult.hasParadox) {
      const isTimeConflict =
        (lowerText.includes('conflicting') && lowerText.includes('deadline')) ||
        (lowerText.includes('conflicting') && lowerText.includes('schedule')) ||
        (lowerText.includes('conflicting') && lowerText.includes('requirements'));

      if (isTimeConflict) {
        // Only consider it paradoxical if there are other strong patterns
        return paradoxResult.patterns.filter(p => p.confidence > 0.7).length > 1;
      }
    }

    return paradoxResult.hasParadox;
  }

  /**
   * Check if the problem has time constraints
   */
  hasTimeConstraint(problem: string, constraints?: string[]): boolean {
    const timeWords = ['deadline', 'urgent', 'asap', 'quickly', 'time-sensitive'];
    const problemHasTime = timeWords.some(word => problem.toLowerCase().includes(word));
    const constraintsHaveTime =
      constraints?.some(c => timeWords.some(word => c.toLowerCase().includes(word))) || false;

    return problemHasTime || constraintsHaveTime;
  }

  /**
   * Check if the problem needs collaboration
   */
  needsCollaboration(problem: string, context?: string): boolean {
    const collabWords = ['team', 'stakeholder', 'collaboration', 'together', 'group'];
    const fullText = `${problem} ${context || ''}`.toLowerCase();
    return collabWords.some(word => fullText.includes(word));
  }
}
