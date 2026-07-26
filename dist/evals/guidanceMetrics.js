/**
 * Guidance quality metrics.
 *
 * The step guidance returned by each technique handler IS the product — it is
 * what an LLM actually consumes. Until now nothing measured it: guidance prose
 * could be replaced wholesale with filler and the entire test suite still
 * passed, because assertions only pin a handful of substrings.
 *
 * These are deterministic, API-free measurements that can genuinely fail:
 *
 * - problemInterpolationRate — does a step's guidance actually mention the
 *   problem it was handed? A step that ignores its input returns identical
 *   text for "reduce churn" and "design a bridge", which is boilerplate
 *   wearing the costume of analysis.
 * - guidance length spread — surfaces the drift between terse early handlers
 *   and verbose later ones, which tracks authoring date rather than technique
 *   complexity.
 * - format flags — emoji/markdown usage differs across handlers with no
 *   policy deciding it.
 *
 * Pure functions only: no side effects, no I/O, safe to import anywhere.
 */
/**
 * Distinctive sentinel used as the "problem" so an interpolation check cannot
 * be satisfied by coincidental vocabulary overlap with the guidance text.
 */
export const PROBLEM_SENTINEL = 'Zylphrex quandary tessellation';
const EMOJI_PATTERN = /\p{Extended_Pictographic}/u;
const MARKDOWN_BOLD_PATTERN = /\*\*[^*]+\*\*/;
function roundTo(value, places) {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
}
/**
 * Measure one technique's guidance across all of its valid steps.
 */
export function analyzeTechnique(technique, registry) {
    const handler = registry.getHandler(technique);
    const { totalSteps } = handler.getTechniqueInfo();
    let stepsReferencingProblem = 0;
    let usesEmoji = false;
    let usesMarkdownBold = false;
    const lengths = [];
    for (let step = 1; step <= totalSteps; step++) {
        const guidance = handler.getStepGuidance(step, PROBLEM_SENTINEL);
        lengths.push(guidance.length);
        if (guidance.includes(PROBLEM_SENTINEL)) {
            stepsReferencingProblem++;
        }
        if (EMOJI_PATTERN.test(guidance)) {
            usesEmoji = true;
        }
        if (MARKDOWN_BOLD_PATTERN.test(guidance)) {
            usesMarkdownBold = true;
        }
    }
    const total = lengths.reduce((sum, length) => sum + length, 0);
    return {
        technique,
        totalSteps,
        stepsReferencingProblem,
        problemInterpolationRate: totalSteps === 0 ? 0 : roundTo(stepsReferencingProblem / totalSteps, 2),
        meanGuidanceLength: lengths.length === 0 ? 0 : Math.round(total / lengths.length),
        minGuidanceLength: lengths.length === 0 ? 0 : Math.min(...lengths),
        maxGuidanceLength: lengths.length === 0 ? 0 : Math.max(...lengths),
        usesEmoji,
        usesMarkdownBold,
    };
}
/**
 * Measure every registered technique.
 */
export function analyzeAllTechniques(registry) {
    return registry
        .getAllTechniques()
        .map(technique => analyzeTechnique(technique, registry))
        .sort((a, b) => a.technique.localeCompare(b.technique));
}
/**
 * Roll per-technique metrics up into repo-wide numbers.
 */
export function summarize(metrics) {
    const totalSteps = metrics.reduce((sum, m) => sum + m.totalSteps, 0);
    const stepsReferencingProblem = metrics.reduce((sum, m) => sum + m.stepsReferencingProblem, 0);
    const means = metrics.map(m => m.meanGuidanceLength).filter(mean => mean > 0);
    return {
        techniqueCount: metrics.length,
        totalSteps,
        stepsReferencingProblem,
        overallProblemInterpolationRate: totalSteps === 0 ? 0 : roundTo(stepsReferencingProblem / totalSteps, 2),
        meanLengthSpreadRatio: means.length === 0 ? 0 : roundTo(Math.max(...means) / Math.min(...means), 1),
        techniquesUsingEmoji: metrics.filter(m => m.usesEmoji).length,
        techniquesUsingMarkdownBold: metrics.filter(m => m.usesMarkdownBold).length,
    };
}
/**
 * Format a human-readable report. Returned as a string rather than printed so
 * this module stays free of side effects; callers decide where it goes.
 */
export function formatReport(metrics) {
    const summary = summarize(metrics);
    const rows = metrics
        .slice()
        .sort((a, b) => a.problemInterpolationRate - b.problemInterpolationRate)
        .map(m => `  ${m.technique.padEnd(26)} ${String(m.stepsReferencingProblem).padStart(2)}/${String(m.totalSteps).padEnd(2)} steps  (${(m.problemInterpolationRate * 100).toFixed(0).padStart(3)}%)  mean ${String(m.meanGuidanceLength).padStart(5)} chars`)
        .join('\n');
    return [
        'Guidance quality metrics',
        `  techniques: ${summary.techniqueCount}   steps: ${summary.totalSteps}`,
        `  steps referencing their problem: ${summary.stepsReferencingProblem}/${summary.totalSteps} (${(summary.overallProblemInterpolationRate * 100).toFixed(0)}%)`,
        `  mean-length spread (max/min): ${summary.meanLengthSpreadRatio}x`,
        `  using emoji: ${summary.techniquesUsingEmoji}/${summary.techniqueCount}   using markdown bold: ${summary.techniquesUsingMarkdownBold}/${summary.techniqueCount}`,
        '',
        'Per technique (worst interpolation first):',
        rows,
    ].join('\n');
}
//# sourceMappingURL=guidanceMetrics.js.map