/**
 * Stimulus decks for the random_entry technique.
 *
 * Decks are information; drawing is mechanism. The server assigns a stimulus
 * at plan time (seeded by planId, so it is fixed within a plan and not
 * re-rollable) — externally-sourced entropy is the one perspective shift a
 * model cannot give itself, since it is its own sampling distribution.
 */
/**
 * Classic random-entry stimuli: concrete, unrelated nouns. The technique's
 * step 1 asks for a random word; these are deliberately plain — the value is
 * in the distance from the problem, not in the word's cleverness.
 */
export declare const RANDOM_ENTRY_DECK: readonly string[];
/**
 * Rory Mode wildcards inspired by behavioral economics — moved verbatim from
 * RandomEntryHandler so the deck is data the planner can draw from, not a
 * private field buried in a mechanism.
 */
export declare const RORY_STIMULI: {
    readonly psychological: readonly ["status anxiety", "loss aversion", "social proof", "placebo effect", "commitment device", "framing effect", "anchoring bias", "endowment effect", "availability heuristic", "confirmation bias", "rationality blindspot - what are we missing by being logical?"];
    readonly contextual: readonly ["expensive wine in cheap bottle", "same product different context", "changing the comparison set", "reframing the reference point", "making invisible visible", "adding meaningful friction", "removing wrong friction", "changing when decision happens", "changing where decision happens", "changing who is present"];
    readonly perceptual: readonly ["progress illusion", "control theater", "competence signaling", "authenticity paradox", "effort justification", "peak-end optimization", "duration neglect", "contrast amplification", "attention misdirection", "expectation management", "costly signaling - spending visibly to prove trustworthiness"];
    readonly counterintuitive: readonly ["make it harder to increase value", "reduce features to improve satisfaction", "increase price to boost demand", "add steps to enhance experience", "create scarcity from abundance", "solve different problem entirely", "make weakness the strength", "embrace the constraint", "celebrate the flaw", "reverse the assumption", "design for your most extreme user, not your average one", "dare to be trivial - what tiny change creates disproportionate value?"];
};
/**
 * FNV-1a seeded draw — repeatable, not cryptographic. Same fold as the
 * discovery wildcard's seededUnit: a plan's draw must be a fact about the
 * plan, or replaying it becomes a diff against luck.
 */
export declare function seededDraw<T>(deck: readonly T[], seed: string): T;
//# sourceMappingURL=randomEntryDeck.d.ts.map