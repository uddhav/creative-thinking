/**
 * Crux → technique bias (P2). The caller names the shape of its stuckness;
 * the selector uses that declaration to beat surface vocabulary.
 *
 * Taxonomy: "shape of the stuckness" — six values, no 'other' (an absent crux
 * is an absent param, not a value). Values are PROVISIONAL until P6 launches;
 * a rename after that carries a versioned mapping, because cross-session
 * priors will be keyed on these strings.
 *
 * Mechanism note: the bias map both INJECTS its techniques as candidates and
 * rescales them in scoring. Injection is load-bearing — the persona-bias seam
 * this rides on can only rescore candidates the category switch already
 * produced, and the whole point of a declared crux is to surface techniques
 * the keyword categorization missed (in both observed sessions the
 * decision-changing technique entered the set as a filler or wildcard, not a
 * top pick).
 */
import type { LateralTechnique } from '../../types/index.js';
import { type CruxType } from '../../types/planning.js';
export declare function isCruxType(value: unknown): value is CruxType;
/**
 * Per-crux technique bias, expressed on the TECHNIQUE_FIT ordinal scale so a
 * crux-injected candidate competes on the same footing as a category pick.
 */
export declare const CRUX_BIAS: Record<CruxType, Partial<Record<LateralTechnique, number>>>;
//# sourceMappingURL=cruxBias.d.ts.map