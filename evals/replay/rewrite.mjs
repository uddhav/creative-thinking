/**
 * The rewrite layer — the harness's hardest part, named as such in the design
 * ledger (design/round-0-1-steering.md, Learning Log entry 5).
 *
 * A fixture records what a past session SENT. Replayed verbatim, its planId
 * and sessionId name objects that do not exist in the fresh server, so every
 * execute call would exercise the plan-not-found error path while appearing to
 * "replay". This layer substitutes fresh runtime identities into recorded
 * calls, and rewrites recorded stimulus inputs to the fresh plan's assigned
 * values so the stimulus-mismatch gate stays coherent across runs.
 *
 * Mapping rules (deliberately simple; fixtures are synthetic and authored to
 * respect them):
 *  - planId: fresh planIds are queued in plan-call order; each distinct
 *    recorded planId is bound, in order of first appearance, to the next
 *    queued fresh id.
 *  - sessionId: a recorded sessionId with no binding yet is DROPPED from the
 *    outgoing call (the server creates a session) and bound to the sessionId
 *    the response returns; later calls substitute the binding.
 *  - assigned stimulus: when a fresh plan response carries steps with
 *    stimulusSource === 'assigned', recorded randomStimulus/provocation
 *    inputs for that plan+technique are overwritten with the fresh value.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const ISO_TS_RE = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g;
const VOLATILE_NUMERIC_KEYS = new Set([
  'timestamp',
  'executionTime',
  'duration',
  'memoryUsage',
  'heapUsed',
  'elapsedMs',
]);

export function createRewriter({ keepRecordedStimuli = false, warn = defaultWarn } = {}) {
  const freshPlanIds = [];
  const planMap = new Map();
  /** Debate planIds bind by NAME prefix, not queue order: one plan call yields
   * N+1 fresh ids (main + persona plans + synthesis) whose correspondence to
   * the recorded ids FIFO cannot express. `debate_rory_sutherland_<uuid>` →
   * prefix `debate_rory_sutherland`, which is stable across runs. */
  const debatePlanMap = new Map();
  const sessionMap = new Map();
  /** key: `${freshPlanId}:${technique}` → { field, values: [], byRecorded: Map } */
  const assignments = new Map();
  let pendingSessionBinding = null;

  return {
    /** Rewrite a recorded call's arguments before sending. */
    rewriteArgs(tool, recordedArgs) {
      const args = structuredClone(recordedArgs ?? {});
      pendingSessionBinding = null;

      if (tool === 'execute_thinking_step') {
        if (typeof args.planId === 'string') {
          if (args.planId.startsWith('debate_')) {
            const fresh = debatePlanMap.get(debatePrefix(args.planId));
            if (fresh) {
              args.planId = fresh;
            } else {
              warn(
                `recorded debate planId ${args.planId} has no fresh counterpart — the replayed plan produced no matching persona/synthesis plan`
              );
            }
          } else {
            if (!planMap.has(args.planId) && freshPlanIds.length > 0) {
              planMap.set(args.planId, freshPlanIds.shift());
            }
            if (planMap.has(args.planId)) args.planId = planMap.get(args.planId);
          }
        }
        if (typeof args.sessionId === 'string') {
          if (sessionMap.has(args.sessionId)) {
            args.sessionId = sessionMap.get(args.sessionId);
          } else {
            // Unbound: the session-creating call errored (no sessionId on an
            // error payload) or this transcript never had one. Stripping is
            // correct — the server creates a fresh session — but silent
            // stripping hides a fork, so name it.
            warn(
              `recorded sessionId ${args.sessionId} is unbound (its creating call did not return one) — sending without it; the server will create a session`
            );
            pendingSessionBinding = args.sessionId;
            delete args.sessionId;
          }
        }
        // Skipped in live-archive mode (--keep-recorded-stimuli): rewriting
        // erases caller deviation, which effect analysis must observe.
        const entry = assignments.get(`${args.planId}:${args.technique}`);
        if (entry && !keepRecordedStimuli) {
          const recorded = args[entry.field];
          if (typeof recorded === 'string' && recorded.length > 0) {
            // Distinct recorded values map to distinct fresh assignments in
            // first-sight order, so a plan repeating a technique keeps its
            // instances apart. Keying one value per (plan, technique) let
            // instance 2's draw overwrite instance 1's and rewrote both
            // recorded values to the same word.
            if (!entry.byRecorded.has(recorded)) {
              const next = entry.values[Math.min(entry.byRecorded.size, entry.values.length - 1)];
              entry.byRecorded.set(recorded, next);
            }
            args[entry.field] = entry.byRecorded.get(recorded);
          }
        }
      }
      return args;
    },

    /** Every assigned stimulus value observed this run (all plans, all instances). */
    assignedValues() {
      return [...assignments.values()].flatMap(a => a.values);
    },

    /** Learn fresh identities from a parsed response. */
    observeResponse(tool, parsed) {
      if (!parsed || typeof parsed !== 'object') return;
      if (tool === 'plan_thinking_session' && typeof parsed.planId === 'string') {
        freshPlanIds.push(parsed.planId);
        collectAssignments(parsed, assignments);
        // Debate mode: persona and synthesis plans are executable plans of
        // their own, each with its own planId and assigned stimuli.
        for (const parallel of Array.isArray(parsed.parallelPlans) ? parsed.parallelPlans : []) {
          if (typeof parallel?.planId !== 'string') continue;
          if (parallel.planId.startsWith('debate_')) {
            debatePlanMap.set(debatePrefix(parallel.planId), parallel.planId);
          }
          collectAssignments(parallel, assignments);
        }
      }
      if (tool === 'execute_thinking_step' && typeof parsed.sessionId === 'string') {
        if (pendingSessionBinding && !sessionMap.has(pendingSessionBinding)) {
          sessionMap.set(pendingSessionBinding, parsed.sessionId);
        }
        pendingSessionBinding = null;
      }
    },
  };
}

function defaultWarn(message) {
  process.stderr.write(`  WARNING rewrite: ${message}\n`);
}

/** `debate_rory_sutherland_91f532a8-8f3` → `debate_rory_sutherland`. */
function debatePrefix(planId) {
  return planId.slice(0, planId.lastIndexOf('_'));
}

function collectAssignments(planResponse, assignments) {
  // The plan RESPONSE workflow is FLAT: one row per step, technique on each
  // row (ResponseBuilder.buildPlanningResponse flattens the nested internal
  // shape). Debate parallelPlans keep the NESTED shape, so both are walked.
  const workflow = Array.isArray(planResponse.workflow) ? planResponse.workflow : [];
  for (const entry of workflow) {
    const rows = Array.isArray(entry?.steps) ? entry.steps : [entry];
    const technique = entry?.technique;
    for (const step of rows) {
      if (step?.stimulusSource !== 'assigned' || typeof step.stimulus !== 'string') continue;
      const t = step.technique ?? technique;
      const key = `${planResponse.planId}:${t}`;
      if (!assignments.has(key)) {
        assignments.set(key, {
          field: t === 'po' ? 'provocation' : 'randomStimulus',
          values: [],
          byRecorded: new Map(),
        });
      }
      // Append, never replace: repeated instances of one technique each carry
      // their own draw, and every one must reach the volatile-value scrub or
      // the byte metric moves between runs of the same build.
      assignments.get(key).values.push(step.stimulus);
    }
  }
}

/**
 * Canonicalize a response for diffing and byte metrics: volatile identities
 * and clocks become stable placeholders; keys are sorted so ordering noise
 * never reads as change. `volatileStrings` (the run's assigned stimuli, which
 * are fresh draws seeded on the fresh planId) are scrubbed to «stimulus» so
 * the byte metric is identical across runs of one build.
 */
export function normalizeForDiff(value, volatileStrings = []) {
  return JSON.stringify(sortKeys(scrub(value, undefined, volatileStrings)));
}

function scrub(node, keyName, volatileStrings) {
  if (typeof node === 'string') {
    let out = node;
    for (const v of volatileStrings) {
      if (v) out = out.split(v).join('«stimulus»');
    }
    return out
      .replace(/plan_[0-9a-f-]{36}/gi, '«planId»')
      .replace(/session_[0-9a-zA-Z-]{6,}/g, '«sessionId»')
      .replace(UUID_RE, '«uuid»')
      .replace(ISO_TS_RE, '«timestamp»');
  }
  if (typeof node === 'number' && keyName && VOLATILE_NUMERIC_KEYS.has(keyName)) return 0;
  if (Array.isArray(node)) return node.map(item => scrub(item, undefined, volatileStrings));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = scrub(v, k, volatileStrings);
    return out;
  }
  return node;
}

function sortKeys(node) {
  if (Array.isArray(node)) return node.map(sortKeys);
  if (node && typeof node === 'object') {
    const out = {};
    for (const k of Object.keys(node).sort()) out[k] = sortKeys(node[k]);
    return out;
  }
  return node;
}
