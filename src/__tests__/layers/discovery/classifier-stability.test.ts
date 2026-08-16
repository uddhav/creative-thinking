/**
 * A sentence of harmless context must not change what a problem is about.
 *
 * The first-match cascade this guards against was measured before the fix:
 * six clean category exemplars, seven meaning-preserving context additions
 * each — the kind of sentence a real user appends without changing the ask
 * ("We are discussing it again next quarter", "Opinions in the company are
 * split on this"). Under the cascade, 15 of 42 additions changed the
 * category outright and 5 of the 6 exemplars misrouted before any addition
 * at all: 'undercutting' tripped the contradiction detector and rerouted a
 * strategy question to `paradoxical`; 'learn from' outranked everything in
 * the sentence before it; and `validation` claimed every "improve the X"
 * problem because 'prove' is a substring of 'improve'.
 *
 * Categorization is now evidence-scored — every category accumulates
 * weighted signals and the best-supported one wins, with the old cascade
 * order breaking exact ties. This file is the ratchet: each base must route
 * to its category, and every perturbation of it must route identically.
 *
 * If a change to the classifier reddens a row here, the question to answer
 * is not "which weight makes this pass" but "which single word is being
 * allowed to outvote the sentence".
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProblemAnalyzer } from '../../../layers/discovery/ProblemAnalyzer.js';
import { LateralThinkingServer } from '../../../index.js';

const BASES: Array<[string, string]> = [
  ['strategic', 'What should our market strategy be against the competition?'],
  ['user-centered', 'How can we improve the user experience of our checkout flow?'],
  ['technical', 'How should we fix the performance of our database layer?'],
  ['creative', 'We need fresh ideas for the product launch campaign.'],
  ['process', 'How do we streamline and optimize our release process?'],
  ['organizational', 'How should we restructure the team to collaborate better?'],
];

const PERTURBATIONS: Array<[string, string]> = [
  ['a time mention', ' We are discussing it again next quarter.'],
  ['a meeting mention', ' The board meeting is on Thursday.'],
  ['split opinions', ' Opinions in the company are split on this.'],
  ['a competitor word', ' A competitor keeps undercutting us on price.'],
  ['a system word', ' Our current system makes this harder than it should be.'],
  ['a learning word', ' We want to learn from how others handled it.'],
  ['a user word', ' Our users have been vocal about it.'],
];

let analyzer: ProblemAnalyzer;

beforeAll(() => {
  analyzer = new ProblemAnalyzer();
});

describe('the classifier reads the sentence, not one word of it', () => {
  for (const [intended, base] of BASES) {
    describe(`"${base}"`, () => {
      it(`routes to ${intended}`, () => {
        expect(analyzer.categorizeProblem(base)).toBe(intended);
      });

      for (const [name, addition] of PERTURBATIONS) {
        it(`still routes to ${intended} with ${name} appended`, () => {
          expect(analyzer.categorizeProblem(base + addition)).toBe(intended);
        });
      }
    });
  }
});

describe('the recommendation set reads the sentence, not its length', () => {
  // Category stability alone is not what a caller sees — discover_techniques
  // returns a technique list, and two further mechanisms used to change it
  // under the same category: the readability-complexity level sized the set
  // (one appended sentence bumped low→medium and grew it, any content at
  // all), and a Math.random() wildcard grew one response in five. Measured
  // before the fix: 31 of these 42 perturbations changed the returned SET.
  // The set is now sized by evidence breadth and the wildcard draw is seeded,
  // so the whole ordered list must be identical across every perturbation.
  let server: LateralThinkingServer;

  beforeAll(() => {
    server = new LateralThinkingServer();
  });

  afterAll(() => {
    server.destroy();
  });

  function recommendationList(problem: string): string[] {
    const result = server.discoverTechniques({ problem }) as {
      content: Array<{ type: string; text: string }>;
    };
    const data = JSON.parse(result.content[0].text) as {
      recommendations: Array<{ technique: string }>;
    };
    return data.recommendations.map(r => r.technique);
  }

  for (const [intended, base] of BASES) {
    it(`returns one list for "${base.slice(0, 44)}…" under every perturbation`, () => {
      const baseline = recommendationList(base);
      expect(baseline.length, `${intended}: no recommendations at all`).toBeGreaterThan(0);
      for (const [name, addition] of PERTURBATIONS) {
        expect(
          recommendationList(base + addition),
          `${intended}: the set changed under ${name}`
        ).toEqual(baseline);
      }
    });
  }

  it('returns the identical list when the same problem is asked twice', () => {
    // The Math.random() wildcard made one call in five differ with NO change
    // to the problem at all. Ask every base twice.
    for (const [, base] of BASES) {
      expect(recommendationList(base)).toEqual(recommendationList(base));
    }
  });
});
