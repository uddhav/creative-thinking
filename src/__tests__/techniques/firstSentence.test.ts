/**
 * Insight summaries must not be cut inside an abbreviation.
 *
 * A bare `split(/(?<=[.!?])\s+/)` takes the first period as a sentence end, which
 * turns "Throughput is 3.2 vs. 4.1 req/s. The real fact is p99 doubled." into
 * "Throughput is 3.2 vs." — four words, none of them the finding. The handlers
 * report insights this way, so a truncated summary is a lost finding.
 */

import { describe, it, expect } from 'vitest';
import { firstSentence } from '../../techniques/types.js';

describe('firstSentence', () => {
  it('reads past a trailing abbreviation instead of cutting at it', () => {
    expect(firstSentence('Throughput is 3.2 vs. 4.1 req/s. The real fact is p99 doubled.')).toBe(
      'Throughput is 3.2 vs. 4.1 req/s.'
    );
    expect(firstSentence('e.g. cut the form fields. That is the whole idea.')).toBe(
      'e.g. cut the form fields.'
    );
    expect(firstSentence('Dr. Smith says onboarding is broken. We should fix it.')).toBe(
      'Dr. Smith says onboarding is broken.'
    );
    expect(firstSentence('Costs rose approx. 12% last quarter. We cut scope.')).toBe(
      'Costs rose approx. 12% last quarter.'
    );
  });

  it('keeps a decimal inside a sentence', () => {
    expect(firstSentence('Latency is 12.5ms at p99. Everything else is fine.')).toBe(
      'Latency is 12.5ms at p99.'
    );
  });

  it('stops at a genuine sentence end', () => {
    expect(firstSentence('Onboarding that finishes itself. Second sentence dropped.')).toBe(
      'Onboarding that finishes itself.'
    );
  });

  it('returns unpunctuated output whole, but bounded', () => {
    const short = 'No terminal punctuation at all and this just keeps going';
    expect(firstSentence(short)).toBe(short);

    const long = 'x'.repeat(500);
    const summary = firstSentence(long);
    expect(summary.length).toBeLessThanOrEqual(301);
    expect(summary.endsWith('…')).toBe(true);
  });

  it('returns empty for empty or whitespace input', () => {
    expect(firstSentence('')).toBe('');
    expect(firstSentence('   ')).toBe('');
  });
});
