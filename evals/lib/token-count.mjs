// Token counts for the verbosity re-pricing instrument.
//
// Two paths, and every number carries the label of the tokenizer that made
// it. With an Anthropic API key, `count_tokens` returns what the model would
// bill (the docs call it an estimate, it is model-specific — Claude 4.7+
// tokenises ~30% higher than earlier models — and it includes the fixed
// per-request message framing, which the baseline below removes). Without a
// key, gpt-tokenizer's o200k_base BPE gives an approximation: it is OpenAI's
// vocabulary, which undercounts Claude by ~15-20% on prose and more on code
// or non-English input, so a number labelled `approx:o200k_base` is not a
// Claude token count.
//
// `fetch` is injected so the unit test needs no network.
const ENDPOINT = 'https://api.anthropic.com/v1/messages/count_tokens';
const API_VERSION = '2023-06-01';

/** Raw count_tokens call: content plus the fixed per-request framing. */
async function countRaw(text, { model, apiKey, fetch = globalThis.fetch }) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: text }] }),
  });
  if (!res.ok) throw new Error(`count_tokens returned ${res.status}`);
  const { input_tokens: inputTokens } = await res.json();
  return inputTokens;
}

let approx;
export async function countApprox(text) {
  approx ??= (await import('gpt-tokenizer/encoding/o200k_base')).countTokens;
  return approx(text);
}

/**
 * Resolve one counter. On the API path a single probe call both validates the
 * key and measures the per-request framing (the count of a one-character
 * message), which every content count then subtracts, so the reported number
 * is content tokens rather than content + envelope. Any failure falls to the
 * offline approximation, with the reason on stderr.
 */
export async function makeCounter({ apiKey, model, fetch = globalThis.fetch } = {}) {
  if (apiKey) {
    try {
      const baseline = await countRaw('.', { model, apiKey, fetch });
      return {
        mode: 'api',
        label: `api:${model}`,
        count: async text => (await countRaw(text, { model, apiKey, fetch })) - baseline,
      };
    } catch (err) {
      process.stderr.write(
        `count_tokens unavailable (${err.message}); counting with gpt-tokenizer ` +
          'o200k_base, an OpenAI-model BPE that undercounts Claude (~15-20% on prose, ' +
          'more on code or non-English)\n'
      );
    }
  } else {
    process.stderr.write(
      'ANTHROPIC_API_KEY unset; counting with gpt-tokenizer o200k_base, an OpenAI-model ' +
        'BPE that undercounts Claude (~15-20% on prose, more on code or non-English)\n'
    );
  }
  return { mode: 'approx', label: 'approx:o200k_base', count: countApprox };
}
