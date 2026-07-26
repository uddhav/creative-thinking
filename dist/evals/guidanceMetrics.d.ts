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
import type { LateralTechnique } from '../types/index.js';
import type { TechniqueRegistry } from '../techniques/TechniqueRegistry.js';
/**
 * Distinctive sentinel used as the "problem" so an interpolation check cannot
 * be satisfied by coincidental vocabulary overlap with the guidance text.
 */
export declare const PROBLEM_SENTINEL = "Zylphrex quandary tessellation";
export interface TechniqueGuidanceMetrics {
    technique: LateralTechnique;
    totalSteps: number;
    /** Steps whose guidance text contains the problem it was given. */
    stepsReferencingProblem: number;
    /** stepsReferencingProblem / totalSteps, rounded to 2dp. */
    problemInterpolationRate: number;
    meanGuidanceLength: number;
    minGuidanceLength: number;
    maxGuidanceLength: number;
    usesEmoji: boolean;
    usesMarkdownBold: boolean;
}
export interface GuidanceMetricsSummary {
    techniqueCount: number;
    totalSteps: number;
    stepsReferencingProblem: number;
    /** Fraction of ALL steps across ALL techniques that mention their problem. */
    overallProblemInterpolationRate: number;
    /** Ratio of the longest to the shortest per-technique mean guidance length. */
    meanLengthSpreadRatio: number;
    techniquesUsingEmoji: number;
    techniquesUsingMarkdownBold: number;
}
/**
 * Measure one technique's guidance across all of its valid steps.
 */
export declare function analyzeTechnique(technique: LateralTechnique, registry: TechniqueRegistry): TechniqueGuidanceMetrics;
/**
 * Measure every registered technique.
 */
export declare function analyzeAllTechniques(registry: TechniqueRegistry): TechniqueGuidanceMetrics[];
/**
 * Roll per-technique metrics up into repo-wide numbers.
 */
export declare function summarize(metrics: TechniqueGuidanceMetrics[]): GuidanceMetricsSummary;
/**
 * Format a human-readable report. Returned as a string rather than printed so
 * this module stays free of side effects; callers decide where it goes.
 */
export declare function formatReport(metrics: TechniqueGuidanceMetrics[]): string;
//# sourceMappingURL=guidanceMetrics.d.ts.map