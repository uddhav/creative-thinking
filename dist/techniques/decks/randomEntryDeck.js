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
export const RANDOM_ENTRY_DECK = [
    'lighthouse',
    'compost',
    'orchestra',
    'scaffolding',
    'tide pool',
    'passport',
    'beehive',
    'thermostat',
    'mycology',
    'drawbridge',
    'sourdough',
    'satellite',
    'greenhouse',
    'anvil',
    'coral reef',
    'metronome',
    'quarry',
    'switchboard',
    'glacier',
    'loom',
    'periscope',
    'vending machine',
    'root cellar',
    'kite',
    'foundry',
    'archipelago',
    'turnstile',
    'observatory',
    'chalk',
    'estuary',
    'flywheel',
    'apiary',
    'ballast',
    'carousel',
    'darkroom',
    'embankment',
    'fermentation',
    'gargoyle',
    'hourglass',
    'irrigation',
    'jukebox',
    'keel',
    'lichen',
    'monsoon',
    'nectar',
    'origami',
    'pendulum',
    'quill',
    'relay race',
    'sediment',
    'tuning fork',
    'undertow',
    'varnish',
    'watermill',
    'x-ray',
    'yeast',
    'zipline',
    'campfire',
    'ledger stone',
    'prism',
    'trellis',
    'compass rose',
    'kelp forest',
    'signal flare',
];
/**
 * Rory Mode wildcards inspired by behavioral economics — moved verbatim from
 * RandomEntryHandler so the deck is data the planner can draw from, not a
 * private field buried in a mechanism.
 */
export const RORY_STIMULI = {
    psychological: [
        'status anxiety',
        'loss aversion',
        'social proof',
        'placebo effect',
        'commitment device',
        'framing effect',
        'anchoring bias',
        'endowment effect',
        'availability heuristic',
        'confirmation bias',
        'rationality blindspot - what are we missing by being logical?',
    ],
    contextual: [
        'expensive wine in cheap bottle',
        'same product different context',
        'changing the comparison set',
        'reframing the reference point',
        'making invisible visible',
        'adding meaningful friction',
        'removing wrong friction',
        'changing when decision happens',
        'changing where decision happens',
        'changing who is present',
    ],
    perceptual: [
        'progress illusion',
        'control theater',
        'competence signaling',
        'authenticity paradox',
        'effort justification',
        'peak-end optimization',
        'duration neglect',
        'contrast amplification',
        'attention misdirection',
        'expectation management',
        'costly signaling - spending visibly to prove trustworthiness',
    ],
    counterintuitive: [
        'make it harder to increase value',
        'reduce features to improve satisfaction',
        'increase price to boost demand',
        'add steps to enhance experience',
        'create scarcity from abundance',
        'solve different problem entirely',
        'make weakness the strength',
        'embrace the constraint',
        'celebrate the flaw',
        'reverse the assumption',
        'design for your most extreme user, not your average one',
        'dare to be trivial - what tiny change creates disproportionate value?',
    ],
};
/**
 * FNV-1a seeded draw — repeatable, not cryptographic. Same fold as the
 * discovery wildcard's seededUnit: a plan's draw must be a fact about the
 * plan, or replaying it becomes a diff against luck.
 */
export function seededDraw(deck, seed) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return deck[(hash >>> 0) % deck.length];
}
//# sourceMappingURL=randomEntryDeck.js.map