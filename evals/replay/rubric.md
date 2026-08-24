# Replay grading rubric

You are grading a replayed thinking session for the creative-thinking MCP server's eval harness. The
CALL LOG is ground truth for what the caller sent — if your reading of the responses disagrees with
the call log, the call log wins. The MARKS name which step a human (or a different model than the
session's caller) judged decision-changing.

Grade these three questions, each 0–10, with one sentence of evidence per score citing a specific
call or response:

1. **selectionQuality** — did the server's technique recommendations line up with where the marked
   decisive work actually happened? (10 = top pick produced the decisive step; 0 = decisive
   technique absent from the set.)
2. **signalQuality** — did server-originated signals (advisory findings, assigned stimuli, warnings)
   point at real weaknesses or opportunities in the recorded steps, judged against what the steps
   actually contain? Absent signals score 0, wrong signals score low, apt signals score high.
3. **responseEconomy** — how much of each response is information the caller could act on, versus
   restatement of what the caller already sent?

Return ONLY this JSON object:

```json
{
  "selectionQuality": { "score": 0, "evidence": "" },
  "signalQuality": { "score": 0, "evidence": "" },
  "responseEconomy": { "score": 0, "evidence": "" }
}
```

Pinning: the grader model is fixed via `GRADER_MODEL` (default `claude-sonnet-5`) and must differ
from the model that authored the fixture's steps — the RFC's circularity caveat. Do not change the
pinned default and the rubric in the same commit; one variable at a time.
