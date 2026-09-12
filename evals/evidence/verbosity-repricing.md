# Verbosity re-pricing: bytes and tokens

**Evidence from a run on 2026-09-12, not a live index.** Regenerate with `npm run evals:verbosity`
(see the caveats below before quoting the token figures).

v3.0.0 (#311) flipped the `execute_thinking_step` response default from `full` to `minimal`.
`evals/measure-verbosity.mjs` runs three techniques through the built `socketes` CLI under each
`RESPONSE_VERBOSITY` and reports stdout size per step, in bytes and in tokens.

## Measured

Bytes are exact. Tokens here are `approx:o200k_base` — this machine has no `ANTHROPIC_API_KEY`, so
the counts come from gpt-tokenizer's OpenAI o200k_base BPE (see the caveat).

| technique | steps | full bytes | minimal bytes | byte Δ | full tokens | minimal tokens | token Δ |
| --------- | ----- | ---------- | ------------- | ------ | ----------- | -------------- | ------- |
| scamper   | 8     | 68,127     | 27,292        | −59.9% | 16,619      | 7,076          | −57.4%  |
| six_hats  | 7     | 14,108     | 9,489         | −32.7% | 4,194       | 2,945          | −29.8%  |
| triz      | 4     | 9,076      | 5,772         | −36.4% | 2,635       | 1,739          | −34.0%  |

The byte figures match commit `e14fc927`'s (the v3.0.0 flip); the token columns are what this
instrument adds. The replay fixtures' aggregate moved −18.8% in bytes at the flip (no fixture runs
scamper or triz, which is why that figure is smaller); the replay harness does not count tokens.

## Caveats on the token figures

- **`approx:o200k_base` is not a Claude token count.** o200k_base is OpenAI's vocabulary; the
  Anthropic claude-api skill's token-counting note says such estimates undercount Claude by ~15-20%
  on typical text and more on code or non-English input. These step responses are dense JSON, which
  is code-shaped, so expect the true Claude counts to run higher than the table.
- **`tokenDelta` is robust; per-step absolutes are not.** The ratio `minimal/full` cancels both the
  tokenizer skew (a roughly constant factor) and, on the API path, the fixed per-request message
  envelope; the absolute per-step counts carry both. Read the delta, not the absolute, across
  tokenizers.
- **The API path is model-specific.** With `ANTHROPIC_API_KEY` set, the instrument calls
  `count_tokens` for `TOKEN_MODEL` (default `claude-opus-5`) and the `tokenMode` column reads
  `api:<model>`; Claude 4.7+ tokenises about 30% higher than earlier models, so a number is only
  comparable within one model. The API count is itself an estimate (the docs say so), and the
  instrument subtracts a one-character baseline to remove the message envelope.

## Regenerate

```bash
npm run build            # the instrument drives dist/cli.js
npm run evals:verbosity  # approx:o200k_base without a key
ANTHROPIC_API_KEY=sk-... TOKEN_MODEL=claude-opus-5 npm run evals:verbosity  # exact-ish, api:<model>
```
