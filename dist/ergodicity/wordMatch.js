/**
 * Word-boundary matching for scans over caller text.
 *
 * A bare `text.includes()` matches fragments inside unrelated words, and the
 * risk scans are full of short keywords where that is not a hypothetical:
 * 'all' matches "small" and "finally", 'bet' matches "between", 'invest'
 * matches "investigation", and 'certain' matches "uncertain" — which inverts
 * the check that used it.
 *
 * This is `AdaptiveRiskAssessment.matchesIndicator`, lifted out unchanged so
 * the rest of `src/ergodicity/` can use the same matcher rather than growing
 * its own. That class had already fixed this bug class for its own indicators;
 * the escalation, dismissal and stakes scans downstream never got the fix
 * (#309), so the same text was matched two different ways depending on which
 * file read it.
 */
// Compiled per pattern once, shared across every caller.
const patterns = new Map();
/**
 * True when `keyword` appears in `text` as a whole word (or its simple plural).
 *
 * Multi-word keywords match as phrases. Matching is case-insensitive.
 *
 * Lookarounds rather than `\b`: a `\b` after a non-word final character — a
 * keyword ending in '%' or ')' — can never hold, which silently disables the
 * keyword instead of failing loudly. Lookarounds assert "not glued to a word
 * character" on either side regardless of what the keyword's edges are.
 */
export function matchesWord(text, keyword) {
    let pattern = patterns.get(keyword);
    if (!pattern) {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`(?<!\\w)${escaped}(?:e?s)?(?!\\w)`, 'i');
        patterns.set(keyword, pattern);
    }
    return pattern.test(text);
}
/** True when any keyword matches as a whole word. */
export function matchesAnyWord(text, keywords) {
    return keywords.some(keyword => matchesWord(text, keyword));
}
//# sourceMappingURL=wordMatch.js.map