<!-- Copied from ~/.claude/skills/lateral-thinking/references/technique-contrasts.md (dated
     7 Aug 2026) so that citations in src/layers/planning/techniqueSequenceTable.ts resolve
     inside this repository. Prettier reformatted it on commit (line wrapping, table
     alignment, emphasis markers); the words and headings are unchanged. Not a heading, so
     GitHub anchors are unchanged. -->

# Telling techniques apart

**This is evidence from one review, dated 7 Aug 2026, not a live index.** Five pairs were run end to
end on a shared problem through the `socketes` CLI and their outputs compared. Nothing here is
regenerated automatically; if the handlers change, this goes stale and the runs would have to be
redone.

Read this when you are tempted to drop a technique from discovery's recommendations because it
"overlaps" with another one. That instinct was tested five times against real output and was wrong
every time.

## The heuristic: group by the object the move operates on

Grouping techniques by subject matter produces mush, because half the catalogue is "about problems".
Grouping by _what the technique acts on_ separates them cleanly, and it is the distinction that
survived every head-to-head.

| The move acts on                | Techniques                                                                  | What only this group can produce                                                                                                                                                           |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| An existing artefact            | `scamper`                                                                   | An edit to something that exists, priced for reversibility                                                                                                                                 |
| A proposition                   | `po`, `first_principles`                                                    | A conclusion from a premise you reject, or from deleting every convention                                                                                                                  |
| A user                          | `design_thinking`                                                           | Evidence gathered from people, and a restated problem                                                                                                                                      |
| A role boundary                 | `six_hats`, `disney_method`                                                 | Output quarantined by stance — and, only from Disney, a resourced plan                                                                                                                     |
| A contradiction's ending        | `triz`, `paradoxical_problem`, `quantum_superposition`                      | Three terminal states: dissolve it, verify-while-keeping-both-paths, defer then commit-and-salvage (quantum's close was rewritten to a commitment after this review — see the pair-5 note) |
| An imported pattern, by warrant | `random_entry`, `concept_extraction`, `biomimetic_path`, `collective_intel` | Imports with different epistemic status: none, causal, biological, testimonial                                                                                                             |
| A mechanism library             | `latticework`                                                               | Causal claims deduced from named disciplinary models                                                                                                                                       |
| The decider                     | `cognitive_bias_audit`                                                      | A verdict on the judgment rather than on the merits                                                                                                                                        |
| A position that is not yours    | `steelman_red_team`                                                         | A change to the artefact, produced from the opposing chair                                                                                                                                 |
| The practitioner                | `neural_state`                                                              | An intervention on the thinker, not the problem                                                                                                                                            |
| An incumbent                    | `keeper_test`                                                               | The only output that can be "drop"                                                                                                                                                         |
| The technique set itself        | `meta_learning`                                                             | Second-order findings about which techniques combine                                                                                                                                       |
| Text as evidence                | `linguistic_forensics`                                                      | What a document's form gives away, independent of content                                                                                                                                  |
| Rival explanations              | `competing_hypotheses`, `criteria_based_analysis`                           | Which evidence discriminates; and what truth would look like here                                                                                                                          |
| An outlier as forecast          | `anecdotal_signal`                                                          | The only forward-looking evaluative move                                                                                                                                                   |
| Time                            | `temporal_work`, `temporal_creativity`, `nine_windows`                      | The calendar; foreclosed options; the super-system row nothing else asks for                                                                                                               |
| The choice's structure          | `context_reframing`                                                         | A changed environment, measured by behaviour rate                                                                                                                                          |
| The choice's experience         | `perception_optimization`                                                   | A changed feeling, measured by perceived effort                                                                                                                                            |
| The competitive set             | `reverse_benchmarking`                                                      | Where every competitor uniformly fails                                                                                                                                                     |
| Ethics of borrowing             | `cultural_integration`                                                      | Taboos, power asymmetry, attribution obligations                                                                                                                                           |
| An idea, by accretion           | `yes_and`                                                                   | Escalation under a no-veto norm                                                                                                                                                            |
| Computational search            | `neuro_computational`                                                       | Wide candidate generation with enforced interference scoring                                                                                                                               |

## The five measured pairs

### `disney_method` vs `six_hats` — distinguishable

Problem: a 40-person engineering org considering a four-day week.

Disney produced money and a calendar — 0.25 FTE as pilot owner, ~$8k for a meeting-audit workshop,
months 1–2 with two of five squads at 32 hours and three as control. Six Hats contains not one
currency figure or date, and is the only one written in the first person about feeling: "excitement,
and underneath it suspicion… the thought of announcing a reversal makes me flinch, _which itself is
information_."

**The tell: fan versus funnel.** Disney ends holding one hardened plan; six_hats ends holding six
live options, none chosen. They fail in opposite directions — Disney will cost out a bad idea to two
decimal places, six_hats will hold six good options forever without pricing one.

### `criteria_based_analysis` vs `competing_hypotheses` — distinguishable

Problem: a vendor's postmortem blames upstream DNS, not their 14:02 deploy; our graphs show onset at
13:58.

CBA defined what a truthful postmortem looks like _before_ reading this one, scored it at 30%
validity ±15, and added the precedent cost — accepting this teaches the vendor that unfalsifiable
upstream attribution closes incidents. CH built an 8×6 evidence matrix over six rival causes and
found that **the 13:58 timestamp ranks fifth by diagnosticity**, because it fits five of six
hypotheses equally.

**The tell:** CBA judges _the document_; CH judges _the outage_. CH structurally cannot produce the
precedent argument; CBA structurally cannot demote the smoking gun, because with one hypothesis
there is no variance to compute. This is the strongest overlap found anywhere in the review —
roughly two of CBA's five steps cover CH at lower resolution — and it still changes the deliverable.

### `collective_intel` vs `latticework` — distinguishable, thin margin

Problem: a six-person on-call rotation burning people out through a Q4 launch.

Collective intel mapped who believes what: engineers report dread, PagerDuty reports 60–70% of pages
resolve with no action, the literature reports an eight-responder norm — carried forward as recorded
dissent. Latticework produced causal claims from named lenses: "the rotation is a common-mode
failure — every house on one island"; "what is being selected for is stoicism, so the people who
would quieten the system are the ones who leave."

**The tell:** every collective_intel claim has an owner; every latticework claim has a mechanism.
Aggregating testimony is not applying models.

### `biomimetic_path` vs `concept_extraction` — distinguishable

Same on-call problem. The extraction example was chosen without steering toward or away from
biology: airline crew scheduling under FAA duty-and-rest rules.

Biomimetic designed the alert system — stigmergic annotation with a decaying strength score so
unacted alerts evaporate from the paging path, quorum sensing from three independent signals, a
two-strike rule. Extraction designed the labour policy — a paging cap enforced by the router, "**not
waivable by the willing**", because if it depends on the individual the most conscientious of the
six keeps absorbing it, which is how we got here.

**The tell:** even with the metaphor words scrubbed, one designs the alert system and the other
designs the labour policy. Biomimetic never mentions rest; extraction never touches alert routing.
The prior claim — that biomimetic is just extraction with the source pinned to biology — failed on
output.

### `neuro_computational` vs `quantum_superposition` — same on product

Problem: choosing a data architecture with budget for only one.

Both finals recommended Iceberg as the substrate, salvaged the same three insights **in the same
order**, and named the same revisit trigger. Shown the two finals with names stripped, a reader
could not separate them. The only tells were vocabulary — "frozen gene" versus "collapse" — and
vocabulary is a rename, not a different thought.

The full transcripts _are_ separable: only neuro decomposes before generating, and only quantum has
a time dimension. So the pair survives on process while failing on product. **Their closing guidance
has since been rewritten to differentiate the endings** — quantum's close is a commitment (stand the
alternatives down, salvage, price the collapse); neuro's reports what the search revealed (plateau,
local optimum, unexplored regions).

## Two structural findings worth carrying

- **The contradiction cluster shares a middle, not an ending.** "Name the poles, develop both, look
  for the hybrid" is written three times, across `triz`, `paradoxical_problem` and
  `quantum_superposition`. Their endings genuinely differ — dissolve, hold and pay, defer and
  salvage. The redundancy is one step wide.
- **The near-twin everyone assumes is not one.** `context_reframing` and `perception_optimization`
  share a five-step shape and a deploy-and-measure ending (context_reframing's declared
  reversibility actually spans high through very_low across its steps — the original "both low" was
  imprecise). Run on the same onboarding problem, CR never discusses how anything _feels_ and PO
  never _moves a step_. One cuts nine minutes to six; the other leaves it at nine and makes it feel
  like four. A shared template is not a shared move.

## The method, which outlasts the findings

- **Run the comparison, don't reason about it.** Every claim of distinctness checked against real
  output held or fell cleanly. Every claim argued from guidance text alone was unreliable —
  including three the reviewer had made.
- **A criterion that convicts the survivors is not a criterion.** A proposed five-technique deletion
  collapsed because every criterion used against the defendants — thin guidance, one move in N
  steps, generic close — convicted more of the techniques it kept.

## Re-measurement, 7 Sep 2026: `neuro_computational` vs `quantum_superposition`

Run because the pair-5 finding above (7 Aug) predates the closing-guidance rewrite it mentions, and
#240 was about to seed a table from it. Same method as above: both techniques run end to end on one
shared problem through `socketes` (v2.6.10 build), outputs written to each step's guidance, finals
compared with names stripped on the three things the original compared: the recommendation, the
salvaged insights and their order, and the revisit trigger.

Problem: choosing a data architecture for an analytics platform with budget for only one (a
lakehouse on Apache Iceberg, a managed warehouse, or a streaming-first design on Kafka).

**Recommendation: the same.** Both finals land on Iceberg as the hub with a semantic layer as the
published surface. Kafka survives in both as an ingestion path, not a product.

**Revisit trigger: the same.** Both name freshness, and both say the streaming case was deferred
rather than answered.

**Salvaged insights: different, and differently shaped.** neuro's final is a search report: it says
the search converged rather than plateaued, calls the result a probable local optimum and names what
shaped it (a fitness function that rewards a replaceable hub), lists the regions it never reached (a
warehouse hub with an open export contract) and traces which patterns produced the winner. Its
insights are about the search. quantum's final is a commitment: it names the state it stands behind,
names the three it stands down, and salvages one thing from each abandoned state (replayable
ingestion from the Kafka design, a committed-use plan from the warehouse design, hot/cold
partitioning from the tiering design) before pricing what closing them cost. Its insights are about
the abandoned states.

**Verdict: separable on product now.** Shown the two finals with names stripped, a reader can say
which is the search and which is the commitment. What the 7 Aug run found, two finals that could not
be told apart, does not reproduce after the rewrite the pair-5 note describes. The pair still
converges on the answer and the trigger, which is what two sound techniques applied to one problem
should do; that is agreement, not redundancy.

Consequence for #240: no measured row for this pair. `AVOID_ADJACENT` would have cited a finding the
catalogue has already fixed. The contradiction-cluster finding above is a reading of guidance text,
which this file's own method section classifies as unreliable, so it seeds nothing either. The
sequence table ships with its relations typed and no rows; a row needs a run like this one behind
it.

Caveat, as for every run in this file: one author wrote both sets of step outputs, so the
measurement is of how far each technique's guidance shapes the same writer, not of two independent
practitioners. The transcripts are kept with the repository's evaluation material.
