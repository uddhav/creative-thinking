/**
 * Disk-backed plan store, shared by both binaries.
 *
 * `PlanManager` keeps plans in an in-memory Map, which is enough for a
 * long-running server that issues and executes a plan in one process, and
 * useless for anything that crosses a process boundary. This mirrors plans to
 * `PERSISTENCE_PATH/plans/<planId>.json` so a plan made in one process can be
 * executed in a later one.
 *
 * This began life as `src/cli/planStore.ts`, where it existed because every
 * `socketes` invocation is a fresh process. The MCP server needed the same
 * thing for a different reason — surviving its own restart — and had no
 * equivalent, so the two binaries disagreed about whether a planId outlives the
 * process that issued it (#316). It is shared rather than duplicated so they
 * cannot drift apart again.
 *
 * Deliberately synchronous. `getPlan` is synchronous and has call sites in
 * `ExecutionValidator`, `WorkflowGuard` and `index.ts`; routing plans through
 * the async `PersistenceAdapter` instead would have turned all three async for
 * a read that is one small local file.
 *
 * Consequence of that choice: plans always go to the local filesystem, even
 * under `PERSISTENCE_TYPE=postgres`, where sessions go to the database. For a
 * single machine that is merely inconsistent. For the multi-instance
 * deployment postgres exists to serve it means #316 is not fixed at all —
 * instance A writes the plan to its own disk and instance B cannot see it.
 * Recorded rather than solved here: putting plans in the adapter is the async
 * change this deliberately avoided.
 */
import type { SessionManager } from '../SessionManager.js';
/**
 * Persist the full in-memory plan after planning succeeds.
 *
 * Reads the canonical plan from `PlanManager` rather than the tool response:
 * `ResponseBuilder` strips fields the executor needs, `techniques` among them.
 */
export declare function persistPlan(sessionManager: SessionManager, planId: string | undefined): void;
/**
 * Load a previously-persisted plan back into `PlanManager` so callers can find
 * it by id. A no-op when persistence is off or no file exists.
 *
 * Deliberately does NOT check whether the plan is already in memory, even
 * though that would be the obvious guard. `SessionManager.getPlan` calls this
 * on a miss, so asking it back would recurse. The memory check belongs to the
 * caller, which has already done it.
 */
export declare function hydratePlan(sessionManager: SessionManager, planId: string): void;
//# sourceMappingURL=planStore.d.ts.map