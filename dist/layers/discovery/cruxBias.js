import { CRUX_VALUES } from '../../types/planning.js';
import { TECHNIQUE_FIT } from './TechniqueRecommender.js';
export function isCruxType(value) {
    return typeof value === 'string' && CRUX_VALUES.includes(value);
}
/**
 * Per-crux technique bias, expressed on the TECHNIQUE_FIT ordinal scale so a
 * crux-injected candidate competes on the same footing as a category pick.
 */
export const CRUX_BIAS = {
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
//# sourceMappingURL=cruxBias.js.map