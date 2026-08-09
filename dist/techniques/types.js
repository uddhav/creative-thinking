/**
 * Common types and interfaces for technique handlers
 */
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
const TRAILING_ABBREVIATION = /\b(?:vs|etc|approx|est|no|al|cf|eg|ie|e\.g|i\.e|dr|mr|mrs|ms|prof|sr|jr|st|fig|inc|ltd|co|dept|vol|pp)\.$/i;
const MIN_SUMMARY_LENGTH = 20;
const MAX_SUMMARY_LENGTH = 300;
export function firstSentence(text) {
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
export class BaseTechniqueHandler {
    validateStep(step, _data) {
        const info = this.getTechniqueInfo();
        return step >= 1 && step <= info.totalSteps;
    }
    extractInsights(history) {
        const insights = [];
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
//# sourceMappingURL=types.js.map