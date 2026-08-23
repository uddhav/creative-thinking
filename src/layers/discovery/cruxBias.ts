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
import { CRUX_VALUES, type CruxType } from '../../types/planning.js';
import { TECHNIQUE_FIT } from './TechniqueRecommender.js';

export function isCruxType(value: unknown): value is CruxType {
  return typeof value === 'string' && (CRUX_VALUES as readonly string[]).includes(value);
}

/**
 * Per-crux technique bias, expressed on the TECHNIQUE_FIT ordinal scale so a
 * crux-injected candidate competes on the same footing as a category pick.
 */
export const CRUX_BIAS: Record<CruxType, Partial<Record<LateralTechnique, number>>> = {
  // The problem statement itself is suspect.
  framing: {
    first_principles: TECHNIQUE_FIT.PRIMARY,
    paradoxical_problem: TECHNIQUE_FIT.STRONG,
    context_reframing: TECHNIQUE_FIT.SOLID,
  },
  // Named people disagree on a decision.
  contested: {
    steelman_red_team: TECHNIQUE_FIT.PRIMARY,
    competing_hypotheses: TECHNIQUE_FIT.STRONG,
    six_hats: TECHNIQUE_FIT.SOLID,
  },
  // No options exist yet.
  generation: {
    scamper: TECHNIQUE_FIT.PRIMARY,
    po: TECHNIQUE_FIT.STRONG,
    random_entry: TECHNIQUE_FIT.STRONG,
  },
  // Options exist but cannot be compared.
  evaluation: {
    criteria_based_analysis: TECHNIQUE_FIT.PRIMARY,
    latticework: TECHNIQUE_FIT.STRONG,
    quantum_superposition: TECHNIQUE_FIT.SOLID,
  },
  // Unknown failure modes dominate.
  risk: {
    anecdotal_signal: TECHNIQUE_FIT.PRIMARY,
    steelman_red_team: TECHNIQUE_FIT.STRONG,
    six_hats: TECHNIQUE_FIT.SOLID,
  },
  // Sequencing or irreversibility constrains everything.
  path: {
    temporal_creativity: TECHNIQUE_FIT.PRIMARY,
    triz: TECHNIQUE_FIT.STRONG,
    temporal_work: TECHNIQUE_FIT.SOLID,
  },
};

// Bias combination lives in TechniqueRecommender (combineBiasMaps) — putting
// it here would import the recommender's TECHNIQUE_FIT while the recommender
// imports this map's consumer surface, i.e. a cycle.
