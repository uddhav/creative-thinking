---
# Tier 1 — Core
problem:
  'The server computes steering signals (warnings, provenance, entropy) and discards them, and
  nothing can measure whether steering changes outcomes.'
decisions_deferred:
  - 'PO deck contents and the classic random-entry word deck — drafted by Claude, reviewed by Uddhav
    at PR review (curation is voice, not engineering)'
  - "Flipping any gate to severity:'blocking' — Round 2, gated on M0 resubmission-delta evidence"
decisions_made:
  - {
      decision: 'M0 captures responses driver-side (replay = capture); server unchanged',
      tradeoff: 'cross-version diffs require re-running the driver against each build',
      unmake_cost: 'cheap',
    }
  - {
      decision:
        'M0 owns a replay rewrite layer: planId/sessionId remap, UUID/timestamp normalization,
        assigned-stimulus rewrite — one mechanism, not three patches',
      tradeoff: "the harness's hardest component, named as such up front",
      unmake_cost: 'cheap',
    }
  - {
      decision:
        'M0 metrics split: replay measures EMISSION (findings fired, discovery outputs, tokens);
        EFFECT comes from fixture decisive-marks + analysis of live CT_CALL_LOG archives',
      tradeoff: "the round's headline claim is measured less directly than the RFC implied",
      unmake_cost: 'cheap',
    }
  - {
      decision: 'M0 ratchet runs as a standalone npm script + CI job, not a vitest test',
      tradeoff:
        'separate CI wiring to maintain; escapes retry:2 masking and the no-pretest-build staleness
        footgun',
      unmake_cost: 'cheap',
    }
  - {
      decision:
        "P3 assigns stimulus at plan time, seeded FNV-1a(planId:technique:techniqueIndex) — the
        instance index, not a step number, so repeated instances draw distinctly; replay determinism
        is the rewrite layer's job, not the seed's",
      tradeoff: 'stimulus visible in plan; re-planning redraws (fishable, logged)',
      unmake_cost: 'cheap',
    }
  - {
      decision:
        'P3 delivery is builder-side: plan workflow + graph carry stimulus; execute-time guidance
        names it via the temporal_work injection precedent — no 32-handler touch',
      tradeoff: 'guidance the handler did not author',
      unmake_cost: 'cheap',
    }
  - {
      decision:
        'P2 ships whole in the single PR: crux enum (candidate A, signed off) + cruxDeclared +
        server-side validation + provenance fields — the earlier provenance/crux PR split was
        superseded (log entries 12/13/15)',
      tradeoff:
        "the taxonomy commitment lands with the round instead of behind the referee's first numbers",
      unmake_cost: 'cheap',
    }
  - {
      decision:
        'crux∘persona composition = per-technique max of the two bias maps, then the single existing
        70/30 blend',
      tradeoff:
        "agreement doesn't compound (max, not sum) — chosen over multiplicative under-boosting",
      unmake_cost: 'cheap',
    }
  - {
      decision:
        "P1 emits typed advisoryFindings[] (severity:'advisory' only); every FIELD_GATES row must be
        verified against the handler's getStepGuidance + ToolDefinitions before shipping",
      tradeoff: 'table grows slowly; steelman + random_entry only at launch',
      unmake_cost: 'cheap',
    }
  - {
      decision: 'M0 fixtures are synthetic, never real session exports',
      tradeoff: 'authoring cost; less real-world messiness',
      unmake_cost: 'cheap',
    }
  - {
      decision:
        "Single PR (maintainer override of the advisor's three-PR split, log entry 12); the
        pre-change baseline lives in the first commit, captured against the unmodified dist, so
        before/after stays real inside one PR",
      tradeoff:
        'one revert path for the whole round; the referee shares a diff with its contestants',
      unmake_cost: 'cheap',
    }
strands_braided:
  - 'status-quo braids policy+place (substance judgments live and die inside validator internals)'
  - 'status-quo braids identity+value (the model is both author and entropy source of its own
    stimulus)'
seam_cut: ['info-vs-mechanism', 'time', 'place']
beliefs_updated:
  - 'assigned entropy is an execution-time feature → it is a plan-time VALUE (durable store,
    delivery point, reroll boundary)'
  - 'gates begin as rejections → gates begin as an information channel whose severity extends
    additively on evidence'
  - 'measurement requires server changes → server delta for M0 is zero; the driver captures'
  - 'replay can measure whether steering worked → replay measures emission; effect needs marks and
    live logs (vet-eng-B)'
  - 'a schema-declared field is gateable anywhere → a gate row is only valid against what the
    handler actually instructs the caller to send (vet-eng-A)'

# Tier 2 — Downstream API
artifacts_named:
  [
    'ThinkingStep.stimulus',
    'DiscoverTechniquesInput.crux',
    'cruxDeclared',
    'evidenceBreadth',
    'scoreBreakdown',
    'scoreProvenance',
    'AdvisoryFinding',
    'FIELD_GATES table',
    'poDeck',
    'evals/replay harness + rewrite layer',
    'skill update (findings relay)',
  ]
services_touched:
  ['creative-thinking (server + CLI)', '~/.claude/skills/lateral-thinking (relay update)']
retail_critical: false
one_way_doors: []
non_supports:
  - "enforcing rejections in Round 1: severity:'blocking' reserved, not implemented — M0 numbers
    gate it (Round 2)"
  - 'prose-content judging: no regex/substring reading of output anywhere — the stimulus gate
    compares the structured randomStimulus field, not prose'
  - 'free-string crux matching: rejected as the keyword pattern this design escapes'
  - 'scamper field-gates in Round 1: pathImpact is server-computed output (caller input discarded);
    no caller-sent structured field exists for eliminate — Round 2 judge-pass territory'
success_in_domain:
  "A session's caller receives at least one server-originated signal it did not author and acts on
  it; M0 measures emission on replay, and effect via decisive-marks and live call-log analysis."
futures: ['enforcing-mode-arrives', 'option-B-wins-on-M0', 'P6-keys-on-crux', 'judge-pass-lands']
spec_compatibility:
  - {
      option: 'M0-B driver-capture',
      status: active,
      breaking_change_for: [],
      additive_possible: true,
      meaning_changed: false,
      fails_under_future: [],
    }
  - {
      option: 'P3-A plan-time stimulus',
      status: active,
      breaking_change_for: [],
      additive_possible: true,
      meaning_changed: false,
      fails_under_future: ['option-B-wins-on-M0'],
    }
  - {
      option: 'P2-A crux enum + provenance (shipped whole in the single PR)',
      status: active,
      breaking_change_for: [],
      additive_possible: true,
      meaning_changed: false,
      fails_under_future: ['P6-keys-on-crux (versioned mapping if taxonomy revised)'],
    }
  - {
      option: 'P1-A advisoryFindings',
      status: active,
      breaking_change_for: [],
      additive_possible: true,
      meaning_changed: false,
      fails_under_future: [],
    }
stress_tests:
  - {
      from: 'infra',
      type: 'ASSUMPTION-CHALLENGE',
      id: 'st-1',
      resolution: 'accepted',
      conflicts_with: [],
    }
  - {
      from: 'data',
      type: 'MISSING-CRITERION',
      id: 'st-2',
      resolution: 'accepted',
      conflicts_with: [],
    }
  - {
      from: 'domain',
      type: 'ASSUMPTION-CHALLENGE',
      id: 'st-3',
      resolution: 'accepted',
      conflicts_with: [],
    }
learning_log_entries: 22
---

# Round 0+1 — surface what the server already knows; assign what the model cannot

## Learning Log (re-fire: 4-voice vetting ingested, 2026-08-23)

1. **RESOLVED-FEEDBACK** (vet-eng-A): steelman step-5 gate rewired to `failureModes`-only; the
   `earlyWarnings` clause removed — that field is anecdotal_signal-scoped
   (`ObjectFieldValidator.ts:475`; steelman `TECHNIQUE_FIELDS` row empty), so the gate as first
   written would have false-fired on essentially every steelman session.
2. **TIGHTENED-SPEC** (vet-eng-A): new table rule — every FIELD_GATES row is verified against the
   handler's `getStepGuidance` + `ToolDefinitions` before it ships. Applying the rule to this
   ledger's own table removed the scamper row (see non_supports).
3. **RESOLVED-FEEDBACK** (vet-eng-A): random_entry gate switched from prose token presence to
   structured equality on the `randomStimulus` input field (deck phrases are long; verbatim echo was
   never realistic).
4. **RESOLVED-FEEDBACK** (vet-eng-B): planning response flattener (`ResponseBuilder.ts:204-217`)
   copies only description/risks/expectedOutput — `stimulus`/`stimulusSource` would have shipped
   dark. Flattener extension added to the P3 contract; likewise the po graph mapping
   (`step.stimulus ?? step.description`) — the po case was never dead code.
5. **ADDED-CRITERION** (vet-eng-A + B): M0 gains its named hard part — the replay rewrite layer
   (planId/sessionId remap into fresh replay values, UUID/timestamp normalization, recorded-stimulus
   rewrite to the fresh draw). This is ONE mechanism resolving B's cross-measure conflict (P3's
   planId seed ↔ M0 determinism ↔ P1's stimulus gate), not three local patches.
6. **RELAXED-REQUIREMENT** (vet-eng-B): M0 no longer claims to measure finding action-rate under
   replay — subsequent fixture calls are frozen, so that metric measures the fixture author. Metrics
   split: emission (replay) vs effect (fixture decisive-marks + live CT_CALL_LOG analysis).
   `success_in_domain` narrowed to match.
7. **RESOLVED-FEEDBACK** (advisor + vet-eng-B): `lowConfidenceSelection` renamed `cruxDeclared` —
   the old name was an adoption marker wearing a confidence-measure's clothes, permanently "low
   confidence" for every non-updated caller.
8. **TIGHTENED-SPEC** (vet-eng-B): `crux` is validated server-side (validateEnum precedent,
   `ValidationStrategies.ts:215-222`) with an integration test asserting invalid crux → E1xx;
   without it a typo silently degrades while `cruxDeclared: true` lies.
9. **RESOLVED-FEEDBACK** (vet-eng-A): crux∘persona composition respecified — per-technique **max**
   of the two bias maps, then the single 70/30 blend. The original "multiplicative" spec
   under-boosted: 0.8 × 0.8 = 0.64, weaker steering than either signal alone.
10. **ADDED-CRITERION** (advisor): three-PR sequencing — the referee (M0) lands alone first and
    captures a pre-change baseline on today's server; contestants follow (P3+P1+P2-provenance); the
    round's only expensive commitment (crux taxonomy) trails in its own PR with its own revert path.
11. **Vetting claim refuted** (vet-eng-A): "fillers carry no marker" is false —
    `isQualityFiller: true` is set at `HumanisticQualityCoverage.ts:323` and typed at
    `planning.ts:74`; `scoreProvenance` derives from the existing booleans with no insertion-site
    change.
12. **RESOLVED-FEEDBACK** (Uddhav, panel vote): **single PR**, overriding the advisor's three-PR
    split. Entry 10's pre-change-baseline concern is mitigated by commit ordering: the first commit
    carries the harness + `baseline.json` captured against the pre-change `dist/`; measure commits
    follow, so before/after remains real within the one PR.
13. **ADDED-CRITERION** (Uddhav): the provisional crux taxonomy is rejected — a reworked value set +
    mapping proposal is owed to him; crux implementation (enum, `cruxDeclared`, validation, routing)
    blocks on his sign-off while all other measures proceed.
14. **RESOLVED-FEEDBACK** (Uddhav): M0 grader = `claude -p` with a pinned model and committed
    rubric; skill relay update confirmed in-round.
15. **RESOLVED-FEEDBACK** (Uddhav): crux taxonomy = candidate A, "shape of the stuckness" (framing /
    contested / generation / evaluation / risk / path); crux joins the single PR. Values provisional
    until P6 launch.
16. **ADDED-CRITERION** (implementation finding): the persona-bias seam can only RESCORE candidates
    the category switch produced — it cannot inject. A crux that cannot surface `steelman_red_team`
    on a keyword-bland problem is a no-op, so crux entries inject as candidates (reasoning marks
    them "surfaced ahead of keyword categorization") and then bias the blend via per-technique max.
    This supersedes the vetted "bias-only" wording of DM-3's contract; the injection is kill-checked
    by the integration suite.
17. **TIGHTENED-SPEC** (implementation finding): `tsc` emits on type errors (`noEmitOnError` unset),
    so a failed build can still refresh `dist/` — kill-check hygiene must read red/green from the
    test run, never from build success. Recorded so a future kill-check does not mistake a broken
    build for an unbuilt one.
18. **PRODUCTION-FEEDBACK** (PR #303, merged mid-round): the companion session's eight field-report
    fixes landed on main — including a response-verbosity system whose `MINIMAL_RESPONSE_KEEP_KEYS`
    contract would have silently stripped `advisoryFindings` from minimal-mode responses. Rebased;
    findings attach past the verbosity filter by the same sanctioned mechanism as the autoSave
    fields (steering, not echo — documented at the attach site); the gatekeeper's new
    pre-buildResponse position kept; `baseline.json` recaptured against post-#303 main so the
    before/after remains real. #303's response-verbosity and unread-response-fields suites pass
    alongside this round's steering suite.
19. **RESOLVED-FEEDBACK** (second steelman: 12-agent adversarial workflow, 52 findings, 2026-08-23)
    — confirmed defects, all fixed and kill-checked red→green: (a) duplicate-instance false mismatch
    — a technique-local step number cannot name its instance (#301), so the gate now matches the
    sent value against EVERY instance's assignment and the 🎲 guidance lists all of them, instead of
    asserting the first instance's value against a caller on the second; (b) the po executionGraph
    carried guidance prose as `provocation` on steps 2+, so executing the graph verbatim tripped the
    server's own gate — every node of a stimulus technique now carries the block's assigned value;
    (c) debate persona plans bypassed assignment — `applyAssignedStimulus`
    (techniques/decks/assignment.ts) is now shared by the main workflow, DebateOrchestrator (seeded
    per persona planId), and (d) the encoded-session recovery branch, which shipped `workflow: []`
    and silently disabled the stimulus apparatus on resume — the deterministic seed makes the
    original draw recoverable from the decoded planId alone; (e) findings now persist onto the
    session history entry (the first implementation mutated a spread-copy and was caught by its own
    new guard) and attach to gatekeeper-blocked responses too; (f) the ratchet gained emission
    floors, plan-failure-cascade warnings, errors-by-code, and stimulus normalization in the byte
    metric; grade.mjs gained structural-currency errors and a context-isolated grader subprocess; a
    po fixture joined the corpus and `--keep-recorded-stimuli` enables deviation-preserving
    live-archive replay; (g) the promised CI ratchet job now exists (ci.yml, integration job); (h)
    `--crux` and `--strictness` became CLI flags; (i) an unrecognized strictness draws a plan
    warning (open-world echo kept); (j) crux-injected candidates report `scoreProvenance: 'crux'`.
20. **TIGHTENED-SPEC** (supersession notes the audit demanded): the seed keys on the technique's
    workflow INDEX, not a step number (two instances would collide on step=1); the assignment deck
    is a NEW 64-word classic deck, with the 44 Rory stimuli moved alongside it for roryMode; DM-4's
    promised `random_entry` FIELD_GATES row shipped generalized as the source-3 stimulus gate (all
    steps, structured equality); entry 8's "invalid crux → E1xx" overclaimed — the refusal is
    message-only on the discovery validation path, and the test asserts the message; the
    effect-metric claim is narrowed — live CT_CALL_LOG analysis needs `--keep-recorded-stimuli`
    replay (the default rewrite erases caller deviation) and must tolerate batch-parallel append
    order.
21. **PRODUCTION-FEEDBACK** (pre-existing defects the audit surfaced — reported first, per "a
    finding is not permission"): debate persona plans came back EMPTY when a persona's techniqueBias
    had no overlap with the requested techniques (the fallback filtered itself to ∅); every debate
    planId the response advertised was non-executable (never saved to PlanManager; executing one
    misdiagnosed as E207 "Discovery phase skipped"); `activeRequests` double-incremented per call so
    every graceful shutdown burned the full 2s drain loop; MCP-mode session-export responses
    truncated `result.data` at the optimizer's string cap, contradicting "export returns the full
    text".
22. **RESOLVED-FEEDBACK** (Uddhav: fold entry 21's four into this PR): all four fixed. Debate
    fallback now prefers the caller's requested techniques (a voice is never scheduled with nothing
    to execute); every advertised debate planId is saved as a minimal executable plan (persona
    plans + synthesis) — which also gives debate branches working stimulus gates and guidance; the
    unbalanced outer `activeRequests++` deleted (measured shutdown after one served call: 2643ms →
    662ms); export responses bypass the optimizer — export's contract is "returns everything whole".
    Debate executability and export wholeness are kill-checked in the integration suite; the drain
    fix is timing-verified by probe only (timing tests flake).

## Vetting Outcome (2 engineers + advisor; Uddhav's vote pending)

| Measure | Advisor | Eng A (impl) | Eng B (contract/test) | Mean | Disposition                                                                                    |
| ------- | ------- | ------------ | --------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| M0      | 88      | 82           | 78                    | 82.7 | Pass; rewrite layer + metric split absorbed                                                    |
| P3      | 80      | 78           | 68                    | 75.3 | Pass after B's three contract fixes (entries 4, 5)                                             |
| P2      | 63      | 80           | 80                    | 74.3 | Redesigned, not dropped: provenance→PR-2, crux→PR-3 (entry 10; advisor's sequencing objection) |
| P1      | 76      | 72           | 82                    | 76.7 | Pass after A's gate rewires (entries 1–3)                                                      |

Engineer B's day-one verification rule adopted: the findings-arrival assertion is an integration
test through `MCPClientTestHelper` with a build-first kill-check — this repo's three prior
caller-surface defects all passed unit guards below the fault.

## Glossary

| Term              | Definition                                                                                                                                                              | Where used                            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| advisory finding  | A server-emitted, non-blocking observation about a submitted step, carried on the success response; the caller decides what to do with it                               | P1; Round 2 extends `severity`        |
| assigned stimulus | An entropy value the server chooses at plan time and delivers before the step that must use it; not re-rollable within a plan                                           | P3; random_entry + po                 |
| crux              | The caller-declared type of difficulty at the problem's center, from a closed enum; discovery scores against it instead of only surface vocabulary                      | P2 (PR-3); P6 later keys priors on it |
| rewrite layer     | The replay component that substitutes fresh runtime identities (planId, sessionId, assigned stimulus) into recorded calls and normalizes volatile values before diffing | M0; the harness's hardest part        |

## Story

**Title:** Surface what the server already knows; assign what the model cannot. **Situation:**
Validators compute warnings that are discarded (valid path never reads them; discard on the valid
path past `index.ts:200`). Discovery computes `evidenceBreadth`, complexity confidence, and score
breakdowns that never reach the caller. The model selects its own "random" stimulus while a 44-entry
deck sits uncalled. PR #296's eval methodology exists only as PR prose. **Unmet objective:** Give
callers the server's honest signals and externally-sourced entropy — measurably. **Approach:** Three
PRs: the referee first, then the surfacing measures, then the taxonomy commitment (see DMs + Vetting
Outcome).

## Watson 4Q

_Where we are:_ contracts revised under vetting; agent votes in; Uddhav's vote + three sign-offs
pending. _Where we're going:_ PR-1 (M0) implementation. _What we know:_ every touchpoint verified to
file:line, twice (exploration + independent vetting). _What we need to know:_ grader runtime; crux
value sign-off timing confirmed; PO deck curation path.

## Decomposition notes

● **Requirements** trace to one person (Uddhav, RFC author + maintainer). The RFC's "rejection
gates" requirement restated by cause: the _symptom_ is thin steps accepted; the _cause_ is that the
server's judgments never leave the validator. Round 1 fixes the cause's information half;
enforcement is deferred to evidence. ● **Time:** stimulus must exist _before_ step 1 of its
technique runs → plan time is the only delivery point that doesn't reshape step semantics. ●
**Place:** measurement lives outside the server (driver + rewrite layer); judgment lives inside
(findings); entropy lives in the plan (value, not session state). ● **Information vs mechanism:**
deck = information (data module), draw = mechanism (seeded function); crux = information (fact about
the problem), routing = mechanism (existing bias blend); finding = information about a step,
enforcement = mechanism (absent by design this round).

---

## DM-1 · M0 harness — A1: nothing can measure whether steering changes outcomes

|                    | Do-nothing              | A: server response log (new env)                        | **B: driver-side capture (chosen)**                                                               | C: responses inline in CT_CALL_LOG            |
| ------------------ | ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Record trust       | PR prose, self-reported | Both sides server-authored                              | Inputs server-authored (`CT_CALL_LOG`); responses captured as the exact bytes the caller received | Both sides server-authored, one file          |
| Prod surface added | none                    | new env var + write path in server                      | **none**                                                                                          | changes a format the call-log test documents  |
| Replay fit         | n/a                     | must correlate two logs                                 | capture _is_ replay — same driver                                                                 | replay must strip responses before re-sending |
| Strand-row (P2)    | —                       | braids **place**(server) with **resource**(observation) | unbraids: server records what arrived, harness records what returned                              | braids **what**(call) with its result         |
| Seam-row (P3)      | —                       | place                                                   | **place**                                                                                         | place                                         |
| Color              | 🔴                      | 🟡                                                      | 🟢 _(cost: cross-version diffs require re-running per build)_                                     | 🟡                                            |

**Contract (M0) — revised per entries 5, 6:**

```
evals/replay/
  client.mjs                  # standalone MCP stdio client over @modelcontextprotocol/sdk
                              # (plain .mjs, no build step — MCPClientTestHelper never
                              #  reaches dist/ because tsconfig excludes __tests__)
  rewrite.mjs                 # THE hard part: remap recorded planId/sessionId to the fresh
                              #  values the replayed server returns; rewrite recorded
                              #  randomStimulus/provocation inputs to the fresh assigned
                              #  draw; normalize UUIDs + timestamps before diffing
  fixtures/*.calls.jsonl      # synthetic CT_CALL_LOG transcripts (st-2: never real sessions)
  fixtures/*.marks.json       # decisive-step marks (human or cross-model, per fixture)
  run-replay.mjs              # drives dist/mcp-server-main.js; writes responses.jsonl
  grade.mjs                   # grader runtime [tbd]; call log is ground truth
  baseline.json               # ratchet, EMISSION metrics only: discovery outputs per
                              #  fixture, findings emitted, response tokens, byte-diffs
```

Effect metrics live outside replay: fixture decisive-marks, and offline analysis of live
`CT_CALL_LOG` archives (does a finding-bearing response change the next call?). Ratchet runs as
`npm run evals:replay` + its own CI job — not vitest (retry:2, pretest staleness).

## DM-2 · P3 stimulus — A1: the model selects its own "random" stimulus; no guaranteed perspective shift

|                    | Do-nothing                                                | **A: plan-time assignment, seeded (chosen)**                                                                  | B: execute-time assignment                                                                   |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Delivery to step 1 | model invents                                             | in plan workflow + graph before any step runs                                                                 | arrives in the step-1 _response_ — after step 1 (which _is_ "select stimulus") was submitted |
| Reroll refusal     | n/a                                                       | planId-seeded: fixed within a plan; replanning redraws (fishable — logged, not prevented)                     | needs new session state                                                                      |
| State home         | —                                                         | the plan (`PlanManager` exists)                                                                               | session (no slot)                                                                            |
| Determinism / M0   | —                                                         | stable within a plan; **cross-run determinism is the rewrite layer's job** (planId is `plan_${randomUUID()}`) | seed source unclear per retry                                                                |
| Strand-row         | braids **identity**(model) with **value**(entropy source) | separates **value**(stimulus) from **time**(execution)                                                        | braids **time** with **state**                                                               |
| Seam-row           | —                                                         | **time + info-vs-mechanism**                                                                                  | time                                                                                         |
| Color              | 🔴                                                        | 🟢 _(cost: plan-visible stimulus — pre-rationalization possible; external sourcing is still the point)_       | 🟡                                                                                           |

**Contract (P3) — revised per entries 4, 5; delivery incoherence (vet-eng-A) addressed:**

```ts
// types/planning.ts — ThinkingStep gains:
stimulus?: string;              // random_entry: assigned word · po: assigned provocation
stimulusSource?: 'assigned';    // provenance marker; absent for caller-supplied values

// planning layer: for random_entry step 1 and po step 1 (shared helper
// techniques/decks/assignment.ts, also used by debate persona plans and the
// encoded-session recovery branch):
//   stimulus = drawAssignedStimulus(planId, technique, techniqueIndex)
//            = seededDraw(deck, fnv1a(`${planId}:${technique}:${techniqueIndex}`))
//   (instance INDEX, not step number — repeated instances draw distinctly; entry 20)
// decks: src/techniques/decks/randomEntryDeck.ts — NEW 64-word classic deck for
//        assignment + the 44 Rory stimuli moved from the handler (entry 20)
//        src/techniques/decks/poDeck.ts (new; contents drafted for Uddhav's review)
// ExecutionGraphGenerator: EVERY node of a stimulus technique carries the block's
//   assigned value (a graph executed verbatim must never trip the gate; entry 19).
// ResponseBuilder buildPlanningResponse flattener (:204-217) EXTENDED to carry
//   stimulus + stimulusSource — without this the feature ships dark (vet-eng-B).
// Execute-time delivery: builder-side injection (temporal_work precedent) — step-1
//   nextStepGuidance and the step's own guidance name the assigned value read from the
//   loaded plan; RandomEntryHandler/POHandler untouched; the handler's internal
//   Math.random suggestion path (suggestRoryStimulus) is deprecated in favor of the deck.
// P1 emits an advisory finding when the step's structured randomStimulus input differs
//   from the plan's assigned value (exact equality on the field — never prose).
```

## DM-3 · P2 crux + provenance — A1: the selector cannot see the crux; confidence signals are computed then discarded

|                  | Do-nothing                                                    | **A: crux enum via persona seam + provenance (chosen; shipped whole)**     | B: free-string crux, NLP-matched | C: provenance-only                      |
| ---------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- | --------------------------------------- |
| Determinism      | keyword-stable post-#296                                      | full — closed validated enum, fixed mapping                                | the escaped pattern              | full                                    |
| Reuse            | —                                                             | rides `techniqueBias` 70/30 blend (tested)                                 | new matcher subsystem            | none needed                             |
| Moves selection? | no                                                            | yes (PR-3)                                                                 | nominally                        | no                                      |
| Spec surface     | —                                                             | one validated enum param + output fields                                   | free string over-promises        | output-only                             |
| Strand-row       | braids **what**(problem fact) into **how**(routing) invisibly | names the fact; routes it explicitly                                       | re-braids behind NLP             | leaves the braid                        |
| Seam-row         | —                                                             | **info-vs-mechanism**                                                      | info-vs-mechanism                | —                                       |
| Color            | 🔴                                                            | 🟢 _(cost: taxonomy is a P6 commitment — hence PR-3 + provisional values)_ | 🔴                               | 🟡 _(subsumed: it is PR-2's half of A)_ |

**Contract (P2) — as shipped (entries 13/15 chose taxonomy A; entries 19/20 refined):**

```ts
// Provenance:
evidenceBreadth: number;                  // already computed (ProblemAnalyzer.ts:135)
recommendations[].scoreBreakdown?: {categoryFit, complexityMatch,
  constraintCompatibility, outcomeAlignment};   // getScoreBreakdown (TechniqueScorer.ts:611), 3 decimals
recommendations[].scoreProvenance: 'fit' | 'quality-fill' | 'wildcard' | 'crux';
  // 'crux' = injected past keyword categorization by the caller's declaration
  // (entry 19); fillers/wildcards derive from the existing booleans.

// Crux (taxonomy A, "shape of the stuckness" — provisional until P6 launch):
crux?: 'framing' | 'contested' | 'generation' | 'evaluation' | 'risk' | 'path';
cruxDeclared: boolean;                          // renamed from lowConfidenceSelection (entry 7)
// Server-side enum validation (ValidationStrategies DiscoveryValidator); refusal is
//   message-only on this path — no E-code (entry 20 corrects entry 8's E1xx claim).
// Routing: CRUX_BIAS[crux] both INJECTS its techniques as candidates (the bias seam
//   alone can only rescore what the category switch produced — entry 16) and biases
//   the blend, combined with persona bias by per-technique MAX (entry 9).
// Mapping (cruxBias.ts): framing → first_principles/paradoxical_problem/context_reframing;
//   contested → steelman_red_team/competing_hypotheses/six_hats; generation →
//   scamper/po/random_entry; evaluation → criteria_based_analysis/latticework/
//   quantum_superposition; risk → anecdotal_signal/steelman_red_team/six_hats;
//   path → temporal_creativity/triz/temporal_work.
```

## DM-4 · P1-advisory — A1: the server's substance judgments are computed and discarded; enforcement lives only in an optional client skill

|                     | Do-nothing                                                      | **A: typed advisoryFindings[] (chosen)**                                      | B: append prose to existing warnings strings |
| ------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------- |
| Machine-actionable  | discarded entirely                                              | `{gate, technique, step, message, severity}`                                  | prose in a string array                      |
| Round-2 path        | —                                                               | `severity: 'blocking'` additively; same channel carries the future judge-pass | nothing to extend                            |
| Refusal-shape count | 2 inconsistent                                                  | unchanged now; Round 2 consolidates here                                      | a third inconsistent shape                   |
| Strand-row          | braids **policy**(judgment) with **place**(validator internals) | separates judgment (information) from enforcement (mechanism, deferred)       | braids **policy** with **what**(format)      |
| Seam-row            | —                                                               | **info-vs-mechanism**                                                         | —                                            |
| Color               | 🔴                                                              | 🟢 _(cost: noise unless relayed — skill update in scope, st-3)_               | 🟡                                           |

**Contract (P1) — revised per entries 1–3:**

```ts
interface AdvisoryFinding {
  gate: string; // 'validation.warning' | 'fields.<technique>.step<N>' | 'stimulus.mismatch'
  technique: LateralTechnique;
  step: number;
  message: string;
  severity: 'advisory'; // open enum; 'blocking' documented as reserved (Round 2)
}
// execute success response gains: advisoryFindings?: AdvisoryFinding[]  (cap 10/step; omitted when empty)
// Sources:
// (1) validation.warnings — computed throughout ValidationStrategies.ts (:339, :362,
//     :391-648), discarded on the VALID path (index.ts, past :200);
// (2) FIELD_GATES — declarative, launch rows verified per entry 2's rule:
const FIELD_GATES: Partial<Record<LateralTechnique, Record<number, FieldGate[]>>> = {
  steelman_red_team: { 5: [{ field: 'failureModes', min: 1 }] }, // earlyWarnings row REMOVED (entry 1)
  random_entry: {
    2: [{ structuredFieldEquals: { field: 'randomStimulus', source: 'plan.assigned' } }],
  },
  // scamper: REMOVED — no caller-sent structured field for eliminate (non_supports)
};
// TECHNIQUE_FIELDS gains a steelman_red_team row for failureModes so the gated field is
// also echoed back (today the row is [] — ExecutionResponseBuilder.ts:1144).
// Plan input gains: strictness?: 'advisory'  // sole value; unknown values accepted and
//   echoed (open-world published contract); echo requires a planning-allowlist edit (named).
// Verification (vet-eng-B, adopted): arrival asserted via integration test through
//   MCPClientTestHelper from day one, preceded by a build-first kill-check.
```

---

## Futures Ledger

| Future ← derived from                                   | M0-B                              | P3-A                                                           | P2-A                                                                              | P1-A                                       |
| ------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ |
| **enforcing-mode-arrives** ← deferred severity decision | survives (it is the judge)        | survives                                                       | survives                                                                          | survives — `severity` extends additively   |
| **option-B-wins-on-M0** ← the RFC's falsifiable bet     | survives (the harness crowned it) | **breaks** — its value _is_ the server; honest cost of the bet | maybe — crux survives as prompt-pack advice, scoring dies                         | maybe — findings die, rubric text survives |
| **P6-keys-on-crux** ← taxonomy commitment               | survives                          | survives                                                       | **maybe** — provisional-until-P6 + versioned mapping is the mitigation (entry 10) | survives                                   |
| **judge-pass-lands** ← non_supports boundary            | survives (grades it)              | survives                                                       | survives                                                                          | survives — same channel                    |

## Stress-Test Pass (inline, 3 personas)

**st-1 · infra · ASSUMPTION-CHALLENGE:** JsonOptimizer caps (`ResponseBuilder.ts:51-56`) vs response
bloat → **Accepted:** findings ≤10/step, omitted when empty; scoreBreakdown 3 decimals. **st-2 ·
data · MISSING-CRITERION:** committed fixtures must not embed user problem text → **Accepted:**
synthetic-only fixtures, marked; real sessions replayable locally, never committed. **st-3 · domain
(skill author) · ASSUMPTION-CHALLENGE:** unrelayed findings are warnings 2.0 → **Accepted:**
lateral-thinking skill update (relay advisoryFindings, surface assignedStimulus, pass crux from
framing) is in Round 1 scope; effect measured per entry 6's split.

## Crux taxonomy — reworked proposal (awaiting Uddhav's pick)

Uddhav rejected the RFC's provisional five (entry 13). Three candidates, each mapping every value
onto categories the recommender can actually route (reachable arms of the category switch); none
carries a degenerate 'other' — absence of a crux is simply an absent param, not a value:

**A — shape of the stuckness (6 values; recommended):** | value | means | routes toward |
|---|---|---| | `framing` | the problem statement itself is suspect | fundamental, paradoxical
(first_principles, paradoxical_problem) | | `contested` | named people disagree on a decision |
decision, adversarial (steelman_red_team, competing hypotheses, six_hats) | | `generation` | no
options exist yet | creative (scamper, po, random_entry) | | `evaluation` | options exist but cannot
be compared | decision, analytical (criteria_based_analysis) | | `risk` | unknown failure modes
dominate | adversarial/risk lenses (anecdotal_signal, black-hat) | | `path` | sequencing or
irreversibility constrains everything | technical/process (temporal_creativity, triz) |

**B — RFC minus 'other' (4):** contested-decision, generation-gap, unknown-unknowns,
sequencing-constraint. Slimmer; `unknown-unknowns` maps awkwardly onto any single category set.

**C — question-form (5):** which-option, what-are-we-missing, no-new-ideas, what-breaks, what-order.
Same semantics as A minus the framing/evaluation split; friendlier labels, less precise routing.

Freeze rule regardless of pick: values are provisional until P6 launch; renames after that carry a
versioned mapping.

## Close

**Decisions still yours (Uddhav):** ● Your panel vote per measure (agent tally: M0 82.7, P3 75.3, P2
74.3→redesigned, P1 76.7). ● Three-PR sequencing confirmation (M0 → P3+P1+P2-provenance → P2-crux).
● Crux approach: provisional values now, sign-off at PR-3, freeze at P6 — or rework values first. ●
M0 grader runtime `[tbd]`. ● PO deck: default is I draft ~24 provocation templates for your review
in PR-2; override if you want to author them. ● Skill relay update in-round (st-3): confirm the
scope addition.

**Beliefs updated this turn:** (see frontmatter — two added by vetting: replay measures emission,
not effect; a schema-declared field is only gateable where the handler instructs it.)

**Decisions made together:** (see frontmatter `decisions_made` — eleven, all cheap-unmake except the
crux taxonomy, which is exactly why it trails.)
