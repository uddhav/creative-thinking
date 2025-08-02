/**
 * Type definitions for Compromise NLP library
 * Since the library doesn't provide complete TypeScript definitions,
 * we define what we need here.
 */

export interface CompromiseDoc {
  out(format: 'array'): string[];
  out(format: 'text'): string;
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
  terms?(): CompromiseDoc;
}

export interface CompromiseLibrary {
  (text: string): CompromiseDoc;
}
