/**
 * Common types and interfaces for technique handlers
 */

// Removed unused import

/**
 * Step types for reflexivity tracking
 */
export type StepType = 'thinking' | 'action';

/**
 * The first sentence of a step's output, for use as its insight summary.
 *
 * A bare `split(/(?<=[.!?])\s+/)` cuts at the first period, which lands inside
 * an abbreviation and throws the finding away: "Throughput is 3.2 vs. 4.1 req/s.
 * The real fact is p99 doubled." reduces to "Throughput is 3.2 vs." — four words,
 * none of them the point. Sentence-ending punctuation is ambiguous in English and
 * a regex cannot resolve it, so this keeps reading past a known abbreviation and
 * past a fragment too short to be a finding on its own.
 *
 * Unpunctuated output is returned whole up to a cap, rather than growing without
 * bound.
 */
const TRAILING_ABBREVIATION =
  /\b(?:vs|etc|approx|est|no|al|cf|eg|ie|e\.g|i\.e|dr|mr|mrs|ms|prof|sr|jr|st|fig|inc|ltd|co|dept|vol|pp)\.$/i;

const MIN_SUMMARY_LENGTH = 20;
const MAX_SUMMARY_LENGTH = 300;

export function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '';
  }

  const parts = trimmed.split(/(?<=[.!?])\s+/);
  let summary = '';

  for (const part of parts) {
    summary = summary.length > 0 ? `${summary} ${part}` : part;
    if (TRAILING_ABBREVIATION.test(summary) || summary.length < MIN_SUMMARY_LENGTH) {
      continue;
    }
    break;
  }

  return summary.length > MAX_SUMMARY_LENGTH
    ? `${summary.slice(0, MAX_SUMMARY_LENGTH).trimEnd()}…`
    : summary;
}

/**
 * A readable rendering of a structured field a step recorded.
 *
 * An insight keyed to a field's mere presence — "Strategic response formulated
 * based on weak signal analysis" — reports nothing the session produced: it
 * says only that the field was non-empty. These fields arrive as a string, an
 * array or a free-form object depending on the caller, so render whichever
 * shape turned up rather than throwing the content away.
 *
 * Returns '' when there is no content to show, so callers can skip it.
 */
export function describeStructuredField(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map(item => describeStructuredField(item))
      .filter(part => part.length > 0)
      .join(', ');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .map(([key, inner]) => {
        const rendered = describeStructuredField(inner);
        return rendered.length > 0 ? `${key}: ${rendered}` : '';
      })
      .filter(part => part.length > 0)
      .join('; ');
  }
  return '';
}

/**
 * Reflexive effects that occur after action steps
 */
export interface ReflexiveEffects {
  triggers: string[]; // What actions trigger reflexivity
  realityChanges: string[]; // How reality changes post-action
  futureConstraints: string[]; // What must be considered going forward
  reversibility: 'high' | 'medium' | 'low' | 'very_low'; // How easily can this be undone
}

/**
 * Enhanced step information with reflexivity awareness
 */
export interface StepInfo {
  name: string;
  focus: string;
  emoji: string;
  type?: StepType; // Whether this is thinking or action step
  /**
   * How hard this step is to undo once taken.
   *
   * A thinking step declares it here, because it has no `reflexiveEffects` to
   * carry it: an empty `realityChanges`/`futureConstraints` block would assert
   * the step changes reality when analysing something does not. An action step
   * may instead declare it inside `reflexiveEffects`, where it sits next to the
   * changes that make it hard to undo.
   *
   * So a reader wanting one answer per step takes
   * `reversibility ?? reflexiveEffects?.reversibility` — this field first,
   * because a step that states it directly means the statement to stand.
   */
  reversibility?: 'low' | 'medium' | 'high';
  reflexiveEffects?: ReflexiveEffects; // Effects if this is an action step
}

export interface TechniqueInfo {
  name: string;
  emoji: string;
  totalSteps: number;
  description: string;
  focus?: string;
  enhancedFocus?: string;
  parallelSteps?: {
    canParallelize: boolean;
    dependencies?: Array<[number, number]>; // [from, to] step dependencies
    description?: string; // Explanation of parallelization capability
  };
  reflexivityProfile?: {
    // Overall reflexivity characteristics of the technique
    primaryCommitmentType:
      | 'relationship'
      | 'path'
      | 'structural'
      | 'behavioral'
      | 'technical'
      | 'strategic'
      | 'environmental'
      | 'perceptual'
      | 'exploratory'
      | 'observational';
    overallReversibility: 'high' | 'medium' | 'low' | 'very_low';
    riskLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * What the session has already established, for handlers whose guidance depends
 * on it. Optional throughout: a handler that ignores it — which is all but one —
 * needs no change, and a caller that omits it gets the guidance it got before.
 *
 * It exists because `random_entry` carried some ninety lines of Rory Mode
 * guidance behind a third parameter that no call site passed. The branch was
 * unreachable while `roryMode` stayed a documented, strictly-validated input
 * and its own insight extraction read the flag.
 */
export interface StepGuidanceContext {
  roryMode?: boolean;
}

/**
 * One recorded step, as a handler sees it.
 *
 * Declared as `{ output?: string }` until now, which understated the contract
 * badly enough that passing a step number was a type error — while all
 * thirty-two handlers read `currentStep` to let a revision supersede the entry
 * it revises, and most read fields of their own besides. The narrow shape was
 * invisible because tests are not typechecked.
 *
 * Handlers declare their own narrower shapes naming the fields they actually
 * read; method parameter bivariance is what lets them. The index signature
 * carries the technique-specific fields — `hatColor`, `connections`,
 * `coherenceScore` and the rest — which are exactly what a handler is reading
 * when it does more than echo the output back.
 */
export interface HistoryEntry {
  output?: string;
  /** The step within its own technique — see `techniqueLocalStep`. */
  currentStep?: number;
  technique?: string;
  timestamp?: string;
  isRevision?: boolean;
  /** Whatever else the technique recorded for this step. */
  [field: string]: unknown;
}

export interface TechniqueHandler {
  getTechniqueInfo(): TechniqueInfo;
  getStepInfo(step: number): StepInfo;
  getStepGuidance(step: number, problem: string, context?: StepGuidanceContext): string;
  validateStep(step: number, data: unknown): boolean;
  extractInsights(history: HistoryEntry[]): string[];
}

export abstract class BaseTechniqueHandler implements TechniqueHandler {
  abstract getTechniqueInfo(): TechniqueInfo;
  abstract getStepInfo(step: number): StepInfo;
  abstract getStepGuidance(step: number, problem: string, context?: StepGuidanceContext): string;

  validateStep(step: number, _data: unknown): boolean {
    const info = this.getTechniqueInfo();
    return step >= 1 && step <= info.totalSteps;
  }

  extractInsights(history: Array<{ output?: string }>): string[] {
    const insights: string[] = [];

    // Generic insight extraction - can be overridden by specific handlers
    history.forEach(entry => {
      if (entry.output && entry.output.length > 50) {
        // Extract key phrases or patterns
        const sentences = entry.output.split(/[.!?]+/);
        if (sentences.length > 0) {
          const firstSentence = sentences[0]?.trim();
          if (firstSentence) {
            insights.push(firstSentence);
          }
        }
      }
    });

    return insights;
  }
}
