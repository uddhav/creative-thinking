/**
 * Type definitions for Compromise NLP library
 * Since the library doesn't provide complete TypeScript definitions,
 * we define what we need here.
 */

export interface CompromiseTerm {
  text?: string;
  normal?: string;
  tags?: string[];
  implicit?: string;
}

export interface CompromiseSentence {
  text?: string;
}

export interface CompromiseDoc {
  out(format: 'array'): string[];
  out(format: 'text'): string;
  out(format: string): string | string[];
  has(match: string): boolean;
  match(pattern: string): CompromiseDoc;
  organizations?(): CompromiseDoc;
  people?(): CompromiseDoc;
  places?(): CompromiseDoc;
  topics?(): CompromiseDoc;
  dates?(): CompromiseDoc;
  adjectives?(): CompromiseDoc;
  nouns?(): CompromiseDoc;
  verbs?(): CompromiseDoc;
  adverbs?(): CompromiseDoc;
  terms?(): CompromiseDoc;
  sentences?(): CompromiseDoc;
  wordCount?(): number;
  json?(): CompromiseTerm[] | CompromiseSentence[];
  text?(): string;
  forEach?(fn: (doc: CompromiseDoc) => void): void;
  found?: boolean;
  length?: number;
  all?(): CompromiseDoc;
  after?(text: string): CompromiseDoc;
  format?(template: string): CompromiseDoc;
  times?(): CompromiseDoc;
  money?(): CompromiseDoc;
  percentages?(): CompromiseDoc;
  phoneNumbers?(): CompromiseDoc;
  urls?(): CompromiseDoc;
  hashtags?(): CompromiseDoc;
  contractions?(): CompromiseDoc;
  expand?(): CompromiseDoc;
  toLowerCase?(): CompromiseDoc;
}

export interface CompromiseLibrary {
  (text: string): CompromiseDoc;
}
