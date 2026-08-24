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
 * step 1 plus a description prefix that explicitly overrides the handler's
 * own choose-your-own step-1 text (which is not assignment-aware). Shared by
 * the main planning workflow and debate persona plans — the two plan-building
 * paths must not drift.
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
    steps[0].description =
        `🎲 ${label}: "${stimulus}" — the selection this step asks for is already made; ` +
            `do not choose your own, and ignore any instruction below to do so. ` +
            `It is not re-rollable within this plan. Record it and move to working with it.\n\n` +
            steps[0].description;
}
//# sourceMappingURL=assignment.js.map