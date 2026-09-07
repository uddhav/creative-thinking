/**
 * Plan persistence, shared by both binaries, through the persistence adapter.
 *
 * `PlanManager` keeps plans in an in-memory Map, which is enough for a
 * long-running server that issues and executes a plan in one process, and
 * useless for anything that crosses a process boundary. This mirrors plans to
 * the configured adapter so a plan made in one process, or on one instance,
 * can be executed in another.
 *
 * This began life as `src/cli/planStore.ts`, where it existed because every
 * `socketes` invocation is a fresh process. The MCP server needed the same
 * thing for a different reason — surviving its own restart — and had no
 * equivalent, so the two binaries disagreed about whether a planId outlives the
 * process that issued it (#316). It is shared rather than duplicated so they
 * cannot drift apart again.
 *
 * It was a synchronous side store on the local disk until #358: plans went to
 * `plans/<planId>.json` under every backend, including postgres, so a
 * multi-instance server still lost them, and nothing ever deleted a plan file
 * (#357). Both functions are now async wrappers over `SessionManager`'s
 * persistence, which is the adapter. The filesystem adapter keeps the same
 * bare-JSON `plans/<planId>.json` layout, so directories written before this
 * change load unchanged; postgres gets a `creative_plans` table; retention for
 * both record kinds is `PERSISTENCE_TTL_DAYS`.
 *
 * Persisted iff an adapter came up. That is the predicate sessions already
 * used, and it replaces an env-name gate that had to admit `postgres` by name
 * even though plans did not go there. Under `PERSISTENCE_TYPE=memory` the CLI
 * persists nothing, plans included, as before.
 */
/**
 * Only ids this module issued are allowed to name a record.
 *
 * `planId` is caller-supplied and validated nowhere as a format — the
 * execute-step validator checks that it is a string and stops there — so
 * without this it would go straight into a path or a query. Measured before
 * adding it: `planId: '../outside'` loaded a JSON file from outside the plans
 * directory. The adapter checks the path again as defence in depth; this
 * regex is what decides.
 *
 * Two shapes are issued, and both must be allowed or this silently breaks the
 * thing it is protecting: `plan_${randomUUID()}` (`layers/planning.ts`) and
 * the debate ids `debate_${persona.id}_${uuid}` and `debate_synthesis_${uuid}`
 * (`personas/DebateOrchestrator.ts`). A first version accepted only `plan_`
 * and quietly disabled debate persistence.
 *
 * `persona.id` is safe to interpolate: `PersonaResolver.resolveCustom` reduces
 * a caller's `custom:` description to `[a-z0-9_]` before it becomes an id.
 *
 * This also, deliberately, excludes *encoded* planIds. Those are standard
 * base64 (`SessionEncoder`), whose alphabet includes `/` and `+`. They need no
 * store: an encoded id carries its own plan and is reconstructed by the decode
 * path in `ExecutionValidator`.
 */
const PERSISTABLE_PLAN_ID = /^(?:plan|debate)_[A-Za-z0-9_-]{1,200}$/;
/**
 * Persist the full in-memory plan after planning succeeds.
 *
 * Reads the canonical plan from `PlanManager` through the SYNC accessor:
 * `ResponseBuilder` strips fields the executor needs, `techniques` among them,
 * so the tool response is not the thing to write; and the async `getPlan`
 * would hand `JSON.stringify` a Promise, which serialises as `{}` and would be
 * rejected as malformed on every load.
 */
export async function persistPlan(sessionManager, planId) {
    if (!planId || !PERSISTABLE_PLAN_ID.test(planId))
        return;
    const plan = sessionManager.getInMemoryPlan(planId);
    if (!plan)
        return;
    try {
        await sessionManager.savePlanToPersistence(planId, plan);
    }
    catch (err) {
        // A plan that cannot be written is not a failed step — the caller's work
        // still executes in this process. Warn and carry on.
        process.stderr.write(`[creative-thinking] Warning: failed to persist plan ${planId}: ${err.message}\n`);
    }
}
/**
 * Load a previously persisted plan back into `PlanManager` so callers can find
 * it by id. A no-op without an adapter or without a record.
 *
 * Deliberately does NOT check whether the plan is already in memory, even
 * though that would be the obvious guard. `SessionManager.getPlan` calls this
 * on a miss, so asking it back would recurse. The memory check belongs to the
 * caller, which has already done it.
 */
export async function hydratePlan(sessionManager, planId) {
    if (!planId || !PERSISTABLE_PLAN_ID.test(planId))
        return;
    try {
        const plan = await sessionManager.loadPlanFromPersistence(planId);
        if (!plan)
            return;
        // The id has to match its record, and the fields the executor reaches for
        // without checking have to be there. `ExecutionValidator` does
        // `plan.techniques.includes(...)` straight after this, so a record written
        // by a different build — there is no schema version — would throw a
        // TypeError out of the tool handler instead of returning a typed error.
        // Adapters store and return; this boundary is the store's, not theirs.
        if (plan.planId === planId && Array.isArray(plan.techniques) && Array.isArray(plan.workflow)) {
            sessionManager.savePlan(planId, plan);
        }
        else {
            process.stderr.write(`[creative-thinking] Warning: ignoring malformed stored plan ${planId}\n`);
        }
    }
    catch (err) {
        process.stderr.write(`[creative-thinking] Warning: failed to load plan ${planId}: ${err.message}\n`);
    }
}
//# sourceMappingURL=planStore.js.map