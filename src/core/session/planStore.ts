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

import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync } from 'fs';
import { homedir } from 'os';
import { join, resolve, sep } from 'path';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { SessionManager } from '../SessionManager.js';

/**
 * Plans persist when sessions are configured to. Without a gate the MCP server
 * — whose persistence is in-memory unless asked otherwise — would start writing
 * plans into `~/.creative-thinking` as a side effect of being run.
 *
 * `postgres` is included even though plans still go to the local disk under it,
 * because the CLI persisted plans unconditionally and excluding it would break
 * cross-process plan lookup for anyone running `socketes` against postgres —
 * the CLI's whole contract. See the caveat in the file header.
 *
 * The test names the two adapters rather than excluding `memory`, because
 * `getDefaultConfig` throws for `sqlite` and for anything unrecognised, and it
 * is called outside the try in `SessionPersistence.initializePersistence`. So
 * `PERSISTENCE_TYPE=Filesystem` (capital F) fails to bring up session
 * persistence at all; a "not memory" test would have written plans to disk
 * anyway, which is exactly the surprise this gate exists to stop.
 *
 * Consequence worth stating: under `PERSISTENCE_TYPE=memory` the CLI now
 * persists nothing. Previously plans were written unconditionally while
 * sessions were not, so `socketes` was already broken across invocations under
 * that setting — half-persisted in a way that failed later and less clearly.
 * This makes it uniformly non-persistent.
 */
function plansArePersisted(): boolean {
  const type = process.env.PERSISTENCE_TYPE;
  return type === 'filesystem' || type === 'postgres';
}

/**
 * Only ids this module issued are allowed to name a file.
 *
 * `planId` is caller-supplied and validated nowhere as a format — the
 * execute-step validator checks that it is a string and stops there
 * (`ValidationStrategies.ts:312`) — so without this it goes straight into a
 * path. Measured before adding it: `planId: '../outside'` loaded a JSON file
 * from outside the plans directory. That was reachable from the MCP tool
 * surface once the store stopped being CLI-only, which is what this change did.
 *
 * Two shapes are issued, and both must be allowed or this silently breaks the
 * thing it is protecting: `plan_${randomUUID()}` (`layers/planning.ts:109`) and
 * the debate ids `debate_${persona.id}_${uuid}` and `debate_synthesis_${uuid}`
 * (`personas/DebateOrchestrator.ts:76,212`). A first version of this pattern
 * accepted only `plan_` and quietly disabled debate persistence, which is the
 * one mode this change went out of its way to cover.
 *
 * `persona.id` is safe to interpolate: `PersonaResolver.resolveCustom` reduces
 * a caller's `custom:` description to `[a-z0-9_]` before it becomes an id.
 *
 * This also, deliberately, excludes *encoded* planIds. Those are standard
 * base64 (`SessionEncoder`), whose alphabet includes `/` and `+` — so they
 * would not merely be unsafe, they would silently resolve into subdirectories
 * that do not exist. They need no disk store: an encoded id carries its own
 * plan and is reconstructed by the decode path in `ExecutionValidator`.
 */
const PERSISTABLE_PLAN_ID = /^(?:plan|debate)_[A-Za-z0-9_-]{1,200}$/;

function plansDir(): string {
  const base = process.env.PERSISTENCE_PATH || join(homedir(), '.creative-thinking');
  return join(base, 'plans');
}

/** The file for a plan id, or null when the id must not name one. */
function planFile(planId: string): string | null {
  if (!PERSISTABLE_PLAN_ID.test(planId)) return null;

  // Defence in depth, mirroring `validateSessionId` in the filesystem adapter:
  // the pattern above should already make this unreachable, so if it ever
  // fires the pattern is what is wrong.
  const dir = plansDir();
  const file = join(dir, `${planId}.json`);
  if (!resolve(file).startsWith(resolve(dir) + sep)) return null;
  return file;
}

/**
 * Persist the full in-memory plan after planning succeeds.
 *
 * Reads the canonical plan from `PlanManager` rather than the tool response:
 * `ResponseBuilder` strips fields the executor needs, `techniques` among them.
 */
export function persistPlan(sessionManager: SessionManager, planId: string | undefined): void {
  if (!planId || !plansArePersisted()) return;
  const file = planFile(planId);
  if (!file) return;
  const plan = sessionManager.getPlan(planId);
  if (!plan) return;

  try {
    mkdirSync(plansDir(), { recursive: true });
    // Write to a temp file and rename, and keep the plan owner-readable only —
    // both copied from the filesystem session adapter, for the same two
    // reasons. A crash or a second process racing the same id otherwise leaves
    // a truncated file that `hydratePlan` would parse and reject, reporting a
    // plan that exists as missing; and the JSON carries the caller's problem
    // statement, objectives and constraints, which do not belong at 0644 on a
    // shared host.
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify(plan), { encoding: 'utf8', mode: 0o600 });
    renameSync(temp, file);
  } catch (err) {
    // A plan that cannot be written is not a failed step — the caller's work
    // still executes in this process. Warn and carry on.
    process.stderr.write(
      `[creative-thinking] Warning: failed to persist plan ${planId}: ${(err as Error).message}\n`
    );
  }
}

/**
 * Load a previously-persisted plan back into `PlanManager` so callers can find
 * it by id. A no-op when persistence is off or no file exists.
 *
 * Deliberately does NOT check whether the plan is already in memory, even
 * though that would be the obvious guard. `SessionManager.getPlan` calls this
 * on a miss, so asking it back would recurse. The memory check belongs to the
 * caller, which has already done it.
 */
export function hydratePlan(sessionManager: SessionManager, planId: string): void {
  if (!planId || !plansArePersisted()) return;

  const path = planFile(planId);
  if (!path || !existsSync(path)) return;

  try {
    const raw = readFileSync(path, 'utf8');
    const plan = JSON.parse(raw) as PlanThinkingSessionOutput;
    // The id has to match its filename, and the fields the executor reaches for
    // without checking have to be there. `ExecutionValidator` does
    // `plan.techniques.includes(...)` straight after this, so a file written by
    // a different build — there is no schema version — would throw a TypeError
    // out of the tool handler instead of returning a typed error. In-memory
    // plans never needed this boundary; loading from disk introduces it.
    if (
      plan &&
      plan.planId === planId &&
      Array.isArray(plan.techniques) &&
      Array.isArray(plan.workflow)
    ) {
      sessionManager.savePlan(planId, plan);
    } else {
      process.stderr.write(
        `[creative-thinking] Warning: ignoring malformed stored plan ${planId}\n`
      );
    }
  } catch (err) {
    process.stderr.write(
      `[creative-thinking] Warning: failed to load plan ${planId}: ${(err as Error).message}\n`
    );
  }
}
