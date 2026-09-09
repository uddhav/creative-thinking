/**
 * Server-assigned stimulus derivation — one deterministic function shared by
 * every plan-building path (main workflow, debate persona plans) and by the
 * encoded-session recovery branch.
 *
 * The seed is `${planId}:${technique}:${techniqueIndex}`, which makes the
 * assignment a pure function of the plan: fixed within it (no rerolls),
 * distinct per repeated instance, and — the property the encoded-session
 * path depends on — RECOVERABLE from the planId alone after a server
 * restart, without the original workflow object.
 */
import { RANDOM_ENTRY_DECK, seededDraw } from './randomEntryDeck.js';
import { PO_DECK } from './poDeck.js';
const STIMULUS_TECHNIQUES = ['random_entry', 'po'];
/** The plan's assigned stimulus for a technique instance; undefined for non-stimulus techniques. */
function drawAssignedStimulus(planId, technique, techniqueIndex) {
    if (!STIMULUS_TECHNIQUES.includes(technique))
        return undefined;
    const deck = technique === 'po' ? PO_DECK : RANDOM_ENTRY_DECK;
    return seededDraw(deck, `${planId}:${technique}:${techniqueIndex}`);
}
/**
 * Apply an assignment to a technique's generated steps: structured fields on
 * step 1 plus a step-1 description that REPLACES the handler's own
 * choose-your-own text. It used to be prefixed as a notice ("ignore any
 * instruction below") on top of the handler's "Select from a book, dictionary,
 * or random generator", so the step contradicted itself (#417). The text is
 * self-sufficient: one apply site builds the step with an empty description.
 * Shared by the main planning workflow and debate persona plans — the two
 * plan-building paths must not drift.
 */
export function applyAssignedStimulus(technique, techniqueIndex, planId, steps) {
    if (steps.length === 0)
        return;
    const stimulus = drawAssignedStimulus(planId, technique, techniqueIndex);
    if (stimulus === undefined)
        return;
    const label = technique === 'po' ? 'Assigned provocation' : 'Assigned stimulus';
    steps[0].stimulus = stimulus;
    steps[0].stimulusSource = 'assigned';
    const next = technique === 'po'
        ? 'Step 2 extracts movement from it: what the provocation could lead to, without judging it.'
        : 'Step 2 draws connections from it to the problem; step 3 turns those into ideas.';
    // A persona plan injects its header block ("**[Thinking as …]**", principle,
    // challenge) above the handler text; the replacement keeps that block and
    // replaces only the guidance below it.
    const personaHeader = steps[0].description.startsWith('**[Thinking as')
        ? `${steps[0].description.split('\n\n')[0]}\n\n`
        : '';
    steps[0].description =
        personaHeader +
            `🎲 ${label}: "${stimulus}" — the selection this step asks for is already made and is not ` +
            `re-rollable within this plan; do not choose your own. Record it as this step's output, note ` +
            `your first unfiltered associations with it, and do not connect it to the problem yet. ${next}`;
}
//# sourceMappingURL=assignment.js.map