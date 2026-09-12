import { describe, expect, it, vi } from 'vitest';
import { countApprox, makeCounter } from '../../../evals/lib/token-count.mjs';

/**
 * The token counter for the verbosity re-pricing instrument. The API path is
 * exercised with an injected fetch stub, so no network and no key are needed;
 * the offline path counts with gpt-tokenizer's o200k_base.
 */
describe('token-count', () => {
  it('countApprox returns the o200k_base count', async () => {
    // Pinned: 'hello world' is 2 tokens under o200k_base (measured once).
    expect(await countApprox('hello world')).toBe(2);
  });

  it('with a key and a working endpoint, mode is api and the envelope is subtracted', async () => {
    // The probe (".") returns the baseline; a content call returns baseline+5,
    // so the reported count is 5.
    const fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ input_tokens: 9 }) }) // baseline probe
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ input_tokens: 14 }) }); // content
    const counter = await makeCounter({ apiKey: 'sk-test', model: 'claude-opus-5', fetch });
    expect(counter.mode).toBe('api');
    expect(counter.label).toBe('api:claude-opus-5');
    expect(await counter.count('some output')).toBe(5);
    // The probe request carries the documented headers and body shape.
    const [url, init] = fetch.mock.calls[0];
    expect(url).toContain('/v1/messages/count_tokens');
    expect(init.headers['x-api-key']).toBe('sk-test');
    expect(init.headers['anthropic-version']).toBe('2023-06-01');
    expect(JSON.parse(init.body)).toMatchObject({
      model: 'claude-opus-5',
      messages: [{ role: 'user', content: '.' }],
    });
  });

  it('a key with a failing endpoint falls back to approx', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    const counter = await makeCounter({ apiKey: 'sk-bad', model: 'claude-opus-5', fetch });
    expect(counter.mode).toBe('approx');
    expect(counter.label).toBe('approx:o200k_base');
    expect(await counter.count('hello world')).toBe(2);
  });

  it('without a key it is approx and never calls fetch', async () => {
    const fetch = vi.fn();
    const counter = await makeCounter({ model: 'claude-opus-5', fetch });
    expect(counter.mode).toBe('approx');
    expect(fetch).not.toHaveBeenCalled();
  });
});
