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
 * Consequence of that choice: this is filesystem-only. A server configured with
 * `PERSISTENCE_TYPE=postgres` persists its sessions and not its plans.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { PlanThinkingSessionOutput } from '../../types/planning.js';
import type { SessionManager } from '../SessionManager.js';

/**
 * Plans persist exactly when sessions do, read off the same signal
 * `SessionPersistence` uses: `PERSISTENCE_TYPE` set to anything but `memory`.
 * Without a gate the MCP server — whose persistence is in-memory unless asked
 * otherwise — would start writing plans into `~/.creative-thinking` as a side
 * effect of being run.
 *
 * The test is deliberately "not memory" rather than "is filesystem". Plans are
 * written to disk even under `PERSISTENCE_TYPE=postgres`, where sessions go to
 * the database: that is what the CLI already did unconditionally, and narrowing
 * it to filesystem would break cross-process plan lookup for anyone running
 * `socketes` against postgres — the CLI's whole contract.
 */
function plansArePersisted(): boolean {
  const type = process.env.PERSISTENCE_TYPE;
  return Boolean(type) && type !== 'memory';
}

function plansDir(): string {
  const base = process.env.PERSISTENCE_PATH || join(homedir(), '.creative-thinking');
  return join(base, 'plans');
}

function planFile(planId: string): string {
  return join(plansDir(), `${planId}.json`);
}

/**
 * Persist the full in-memory plan after planning succeeds.
 *
 * Reads the canonical plan from `PlanManager` rather than the tool response:
 * `ResponseBuilder` strips fields the executor needs, `techniques` among them.
 */
export function persistPlan(sessionManager: SessionManager, planId: string | undefined): void {
  if (!planId || !plansArePersisted()) return;
  const plan = sessionManager.getPlan(planId);
  if (!plan) return;

  try {
    mkdirSync(plansDir(), { recursive: true });
    writeFileSync(planFile(planId), JSON.stringify(plan), 'utf8');
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
  if (!existsSync(path)) return;

  try {
    const raw = readFileSync(path, 'utf8');
    const plan = JSON.parse(raw) as PlanThinkingSessionOutput;
    // Guard against a file whose contents disagree with its name.
    if (plan && plan.planId === planId) {
      sessionManager.savePlan(planId, plan);
    }
  } catch (err) {
    process.stderr.write(
      `[creative-thinking] Warning: failed to load plan ${planId}: ${(err as Error).message}\n`
    );
  }
}
