/**
 * The one-rung clamp, pinned cell by cell.
 *
 * clampReversibilityClaim is the entire trust model of stepReversibility: a
 * claim moves the applied rung at most one step from the handler-static
 * prior. The integration suite pins two cells through the MCP surface; this
 * table pins all twelve, so a future "widen the clamp a little" cannot slip
 * through as a one-line change with green tests.
 *
 * retry is disabled: kill-checked guard; the global retry: 2 would let a
 * flaky pass mask exactly the regression this file exists to catch.
 */
import { describe, expect, it } from 'vitest';
import {
  clampReversibilityClaim,
  REVERSIBILITY_COSTS,
} from '../../layers/execution/ErgodicityOrchestrator.js';

describe('clampReversibilityClaim', { retry: 0 }, () => {
  it('matches the shipped clamp table on all twelve cells', () => {
    // prior -> claim -> applied (ladder: high 0.10, medium 0.50, low 0.90,
    // very_low 0.95; claims cannot express very_low)
    const table: Array<
      ['high' | 'medium' | 'low' | 'very_low', 'high' | 'medium' | 'low', string]
    > = [
      ['high', 'high', 'high'],
      ['high', 'medium', 'medium'],
      ['high', 'low', 'medium'], // clamped: wanted two rungs down
      ['medium', 'high', 'high'],
      ['medium', 'medium', 'medium'],
      ['medium', 'low', 'low'],
      ['low', 'high', 'medium'], // clamped: wanted two rungs up
      ['low', 'medium', 'medium'],
      ['low', 'low', 'low'],
      ['very_low', 'high', 'low'], // clamped: wanted three rungs up
      ['very_low', 'medium', 'low'], // clamped: wanted two rungs up
      ['very_low', 'low', 'low'],
    ];

    for (const [prior, claim, applied] of table) {
      expect(clampReversibilityClaim(prior, claim), `prior=${prior} claim=${claim}`).toBe(applied);
    }
  });

  it('the cost ladder is ordered most- to least-reversible', () => {
    expect(REVERSIBILITY_COSTS.high).toBeLessThan(REVERSIBILITY_COSTS.medium);
    expect(REVERSIBILITY_COSTS.medium).toBeLessThan(REVERSIBILITY_COSTS.low);
    expect(REVERSIBILITY_COSTS.low).toBeLessThan(REVERSIBILITY_COSTS.very_low);
  });
});
