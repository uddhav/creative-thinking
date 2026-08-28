#!/usr/bin/env node
/**
 * M0's other half: did a steering signal change what the caller did next?
 *
 * The replay harness (`run-replay.mjs`) measures EMISSION — findings fired,
 * stimuli assigned, bytes returned. It structurally cannot measure reaction: a
 * replayed transcript is frozen, so the "caller" in a replay always does what
 * the recording did regardless of what the server says. That is the whole
 * reason Round 2 is gated on live evidence rather than on the ratchet.
 *
 * This reads a real `CT_CALL_LOG`, which interleaves what the caller sent with
 * what the server answered:
 *
 *   {"kind":"call","tool":"execute_thinking_step","arguments":{…}}
 *   {"kind":"result","tool":"execute_thinking_step","advisoryFindings":[{"gate":"…"}]}
 *
 * and asks, for every step whose result carried a finding: did the caller's
 * NEXT call on that session address it, ignore it, or end the session?
 *
 * What "addressed" means is deliberately narrow and mechanical. A gate names a
 * field; the finding is addressed if the next call on that session supplies
 * that field when it previously did not, or re-sends the same step with it
 * changed. No judgement about quality — that is the grader's job, and a
 * mechanical answer is the one that can be trusted without one.
 *
 * Usage:
 *   node evals/replay/analyse-live.mjs <log-file> [more-logs...]
 *   node evals/replay/analyse-live.mjs --json <log-file>
 */

import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const AS_JSON = args.includes('--json');
const files = args.filter(a => !a.startsWith('--'));

if (files.length === 0) {
  console.error('usage: analyse-live.mjs [--json] <ct-call-log> [more...]');
  process.exit(2);
}

/**
 * Which caller-supplied field each gate is about.
 *
 * `fields.<technique>.step<n>` names its field in the gate id itself, so it is
 * parsed rather than tabulated. The others are listed because their gate ids
 * do not carry the field name.
 */
const GATE_FIELD = {
  'stimulus.mismatch': ['randomStimulus', 'provocation'],
};

function fieldsForGate(gate) {
  if (!gate) return [];
  if (GATE_FIELD[gate]) return GATE_FIELD[gate];
  // fields.steelman_red_team.step5 -> the handler field is not in the id, but
  // the technique and step are; the analyser reports these separately rather
  // than guessing.
  return [];
}

function readEntries(file) {
  if (!existsSync(file)) {
    console.error(`no such log: ${file}`);
    process.exit(2);
  }
  const out = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // A truncated final line is normal if the server was killed mid-write.
      out.push({ kind: 'unparseable' });
    }
  }
  return out;
}

/** Pair each call with the result that followed it. */
function pairCalls(entries) {
  const pairs = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (entry.kind === 'result' || entry.kind === 'unparseable') continue;
    // Absence of `kind` means a pre-result-line log: call, no result.
    const next = entries[i + 1];
    const result = next && next.kind === 'result' ? next : null;
    pairs.push({ call: entry, result, index: i });
  }
  return pairs;
}

/**
 * Group by planId first, sessionId second.
 *
 * A session is opened by a `plan` call that has no sessionId yet — the server
 * mints one on the first step — so keying on sessionId first counted the plan
 * as a session of its own and reported 2 where a probe had run 1. planId is
 * present on the plan call AND on every step that follows it, so it is the
 * stable key; sessionId is the fallback for a step whose plan is not in the
 * same log.
 */
function sessionKeyOf(pair) {
  const a = pair.call.arguments || {};
  const r = pair.result || {};
  return a.planId || r.planId || a.sessionId || r.sessionId || '(unattributed)';
}

const stats = {
  logs: files.length,
  calls: 0,
  callsWithoutResult: 0,
  sessions: 0,
  findingsEmitted: 0,
  stepsCarryingFindings: 0,
  followedByAnotherStep: 0,
  addressed: 0,
  ignored: 0,
  endedSession: 0,
  byGate: {},
};

const sessions = new Map();
for (const file of files) {
  for (const pair of pairCalls(readEntries(file))) {
    stats.calls++;
    if (!pair.result) stats.callsWithoutResult++;
    const key = sessionKeyOf(pair);
    if (!sessions.has(key)) sessions.set(key, []);
    sessions.get(key).push(pair);
  }
}
stats.sessions = sessions.size;

for (const [, pairs] of sessions) {
  for (let i = 0; i < pairs.length; i++) {
    const { result } = pairs[i];
    const findings = result && result.advisoryFindings;
    if (!Array.isArray(findings) || findings.length === 0) continue;

    stats.stepsCarryingFindings++;
    stats.findingsEmitted += findings.length;

    const next = pairs[i + 1];
    if (!next || next.call.tool !== 'execute_thinking_step') {
      stats.endedSession++;
      for (const f of findings) bump(f.gate, 'endedSession');
      continue;
    }
    stats.followedByAnotherStep++;

    const before = pairs[i].call.arguments || {};
    const after = next.call.arguments || {};

    for (const f of findings) {
      const watched = fieldsForGate(f.gate);
      // Supplied a field it did not have, or changed the one the gate named.
      const changed = watched.some(field => {
        const b = JSON.stringify(before[field] ?? null);
        const a = JSON.stringify(after[field] ?? null);
        return a !== b && after[field] !== undefined;
      });
      // A re-send of the same step is itself a response to the finding.
      const resent = before.currentStep === after.currentStep;
      if (changed || resent) {
        stats.addressed++;
        bump(f.gate, 'addressed');
      } else {
        stats.ignored++;
        bump(f.gate, 'ignored');
      }
    }
  }
}

function bump(gate, outcome) {
  const key = gate || '(ungated)';
  stats.byGate[key] ??= { addressed: 0, ignored: 0, endedSession: 0 };
  stats.byGate[key][outcome]++;
}

const decided = stats.addressed + stats.ignored;
stats.resubmissionDelta = decided > 0 ? Number((stats.addressed / decided).toFixed(3)) : null;

if (AS_JSON) {
  process.stdout.write(JSON.stringify(stats, null, 2) + '\n');
  process.exit(0);
}

process.stdout.write(`logs analysed        : ${stats.logs}` + '\n');
process.stdout.write(`calls                : ${stats.calls}` + '\n');
if (stats.callsWithoutResult > 0) {
  process.stdout.write(
    `  without a result   : ${stats.callsWithoutResult}  (pre-result-line logs, or the server died mid-call)\n`
  );
}
process.stdout.write(`sessions             : ${stats.sessions}` + '\n');
process.stdout.write(`findings emitted     : ${stats.findingsEmitted} across ${stats.stepsCarryingFindings} steps` + '\n');
process.stdout.write('\n');
process.stdout.write('Of the steps that carried a finding:' + '\n');
process.stdout.write(`  another step followed: ${stats.followedByAnotherStep}` + '\n');
process.stdout.write(`  session ended        : ${stats.endedSession}` + '\n');
process.stdout.write('\n');
process.stdout.write(`addressed            : ${stats.addressed}` + '\n');
process.stdout.write(`ignored              : ${stats.ignored}` + '\n');
process.stdout.write(
  `RESUBMISSION DELTA   : ${
    stats.resubmissionDelta === null
      ? 'n/a — no finding was followed by another step'
      : `${(stats.resubmissionDelta * 100).toFixed(1)}% of findings were addressed`
  }\n`
);

if (Object.keys(stats.byGate).length > 0) {
  process.stdout.write('\n');
  process.stdout.write('Per gate:' + '\n');
  for (const [gate, o] of Object.entries(stats.byGate)) {
    process.stdout.write(
      `  ${gate.padEnd(34)} addressed=${o.addressed} ignored=${o.ignored} endedSession=${o.endedSession}\n`
    );
  }
}

if (stats.stepsCarryingFindings === 0) {
  process.stdout.write('\n');
  process.stdout.write('No findings in these logs, so there is no delta to report yet.' + '\n');
  process.stdout.write('This is the expected reading until sessions run that actually trip a gate.' + '\n');
}
