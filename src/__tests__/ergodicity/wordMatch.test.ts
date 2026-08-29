/**
 * The false positives that made the risk scans wrong.
 *
 * Every case below is a real keyword from `escalationPrompts`,
 * `riskDismissalTracker` or `stakesDiscovery` against text those scans actually
 * receive. Under `String.includes` each one matched, so ordinary prose scored as
 * total commitment, gambling language or financial stakes and drove escalation
 * severity (#309).
 */

import { describe, it, expect } from 'vitest';
import { matchesWord, matchesAnyWord } from '../../ergodicity/wordMatch.js';

describe('word matching in the risk scans', () => {
  it('does not match a keyword buried inside another word', () => {
    // 'all' — the original report's example, and the most common keyword in
    // these scans.
    expect(matchesWord('a small change to the schema', 'all')).toBe(false);
    expect(matchesWord('finally shipped it', 'all')).toBe(false);
    expect(matchesWord('the challenge is scope', 'all')).toBe(false);

    // 'bet' drives the gambling-language indicator.
    expect(matchesWord('the gap between the two services', 'bet')).toBe(false);
    expect(matchesWord('a better approach', 'bet')).toBe(false);

    // 'certain' inverted its own check: the contradiction test fired on the
    // action that acknowledged uncertainty rather than one claiming certainty.
    expect(matchesWord('this is uncertain', 'certain')).toBe(false);

    // 'invest' reached "investigation", scoring an inquiry as financial stakes.
    expect(matchesWord('after some investigation', 'invest')).toBe(false);

    // 'team' reached "steam".
    expect(matchesWord('running out of steam', 'team')).toBe(false);

    // 'time' reached "timeline" and "estimate".
    expect(matchesWord('the timeline slipped', 'time')).toBe(false);
    expect(matchesWord('a rough estimate', 'time')).toBe(false);
  });

  it('still matches the words it is meant to', () => {
    expect(matchesWord('bet all of it on one release', 'all')).toBe(true);
    expect(matchesWord('we will bet the quarter on this', 'bet')).toBe(true);
    expect(matchesWord('I am certain this works', 'certain')).toBe(true);
    expect(matchesWord('we invest in the rewrite', 'invest')).toBe(true);
    expect(matchesWord('the team agreed', 'team')).toBe(true);

    // Case-insensitive, and simple plurals come free.
    expect(matchesWord('The Teams agreed', 'team')).toBe(true);
    expect(matchesWord('several customers complained', 'customer')).toBe(true);
  });

  it('matches multi-word keywords as phrases', () => {
    expect(matchesWord('we will exit if it slips again', 'will exit if')).toBe(true);
    expect(matchesWord('there is real time pressure here', 'time pressure')).toBe(true);
    expect(matchesWord('exit is not planned', 'will exit if')).toBe(false);
  });

  it('does NOT match a bare symbol glued to a number, which is why those stay substring checks', () => {
    // Lookarounds ask that neither side be glued to a word character. For real
    // money and percentages one side always is: '0' precedes the '%' in "40%",
    // '2' follows the '$' in "$2m". So this matcher cannot be used for bare
    // symbols, and `riskDismissalTracker` keeps `includes` for '%' and '$'.
    //
    // This is pinned rather than left implicit because converting them looked
    // obviously correct and silently disabled the calculation-specificity
    // check — it failed open, with no error.
    expect(matchesWord('about 40% of revenue', '%')).toBe(false);
    expect(matchesWord('roughly $2m at stake', '$')).toBe(false);

    // What the lookarounds DO buy over \b: a multi-character keyword whose
    // final character is punctuation still matches, where \b could never hold.
    expect(matchesWord('we lost 50% of them', '50%')).toBe(true);
  });

  it('matchesAnyWord is an or across keywords', () => {
    expect(matchesAnyWord('a small refactor', ['all', 'everything', 'bet'])).toBe(false);
    expect(matchesAnyWord('bet everything on it', ['all', 'everything', 'bet'])).toBe(true);
  });
});
