/**
 * Unit tests for CLI I/O helpers.
 * In-process — no subprocess spawning, fast.
 */

import { describe, it, expect } from 'vitest';
import { PassThrough } from 'node:stream';
import { mergeInput, parseList, parseNumber, readStdinJSON, unwrapResponse } from '../../cli/io.js';
import type { LateralThinkingResponse } from '../../types/index.js';

describe('cli/io.readStdinJSON', () => {
  it('reads a piped object', async () => {
    const stream = new PassThrough();
    const reading = readStdinJSON(stream, 50);
    stream.end(JSON.stringify({ hatColor: 'purple' }));

    await expect(reading).resolves.toEqual({ hatColor: 'purple' });
  });

  it('returns null for an interactive terminal', async () => {
    const stream = Object.assign(new PassThrough(), { isTTY: true });
    await expect(readStdinJSON(stream, 50)).resolves.toBeNull();
  });

  it('returns null when stdin closes with nothing in it', async () => {
    const stream = new PassThrough();
    const reading = readStdinJSON(stream, 50);
    stream.end();

    await expect(reading).resolves.toBeNull();
  });

  it('gives up on a stdin that is open and silent, rather than waiting forever', async () => {
    // `PLAN=$(socketes plan …)` inherits the parent shell's stdin inside $( ):
    // open, not a TTY, never any EOF. This waited on it indefinitely. One such
    // invocation sat unnoticed for 84 minutes.
    const stream = new PassThrough(); // never written to, never ended

    await expect(readStdinJSON(stream, 30)).rejects.toThrow(/stayed open and sent nothing/);
  });

  it('does not cut off a payload that arrives slowly once it has begun', async () => {
    // The bound is on the first byte only. A producer that has started must be
    // allowed to finish, or the timeout becomes a new way to lose input.
    const stream = new PassThrough();
    const reading = readStdinJSON(stream, 40);

    stream.write('{"problem":');
    await new Promise(resolve => setTimeout(resolve, 90));
    stream.end('"still here"}');

    await expect(reading).resolves.toEqual({ problem: 'still here' });
  });
});

describe('cli/io.mergeInput', () => {
  it('returns flag-form when no stdin', () => {
    const out = mergeInput({ a: 1, b: 'x' }, null);
    expect(out).toEqual({ a: 1, b: 'x' });
  });

  it('strips undefined keys from flag-form', () => {
    const out = mergeInput({ a: 1, b: undefined }, null);
    expect(out).toEqual({ a: 1 });
  });

  it('flags override stdin on key collision', () => {
    const out = mergeInput({ problem: 'flag-wins' }, { problem: 'stdin-loses', extra: 'kept' });
    expect(out).toEqual({ problem: 'flag-wins', extra: 'kept' });
  });

  it('treats undefined flag as not-set so stdin survives', () => {
    const out = mergeInput({ problem: undefined }, { problem: 'stdin-wins' });
    expect(out).toEqual({ problem: 'stdin-wins' });
  });
});

describe('cli/io.parseList', () => {
  it('splits comma-separated and trims', () => {
    expect(parseList('a, b ,c')).toEqual(['a', 'b', 'c']);
  });

  it('returns undefined for empty/blank input', () => {
    expect(parseList(undefined)).toBeUndefined();
    expect(parseList('')).toBeUndefined();
    expect(parseList('  ,  ,  ')).toBeUndefined();
  });
});

describe('cli/io.parseNumber', () => {
  it('parses string numbers', () => {
    expect(parseNumber('7')).toBe(7);
    expect(parseNumber('1.5')).toBe(1.5);
  });

  it('passes through valid numbers', () => {
    expect(parseNumber(7)).toBe(7);
  });

  it('returns undefined for missing/invalid', () => {
    expect(parseNumber(undefined)).toBeUndefined();
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('not-a-number')).toBeUndefined();
  });
});

describe('cli/io.unwrapResponse', () => {
  it('parses inner JSON text from a success envelope', () => {
    const env: LateralThinkingResponse = {
      content: [{ type: 'text', text: '{"planId":"p1"}' }],
    };
    const { data, isError } = unwrapResponse(env);
    expect(isError).toBe(false);
    expect(data).toEqual({ planId: 'p1' });
  });

  it('marks isError when envelope.isError is true', () => {
    const env: LateralThinkingResponse = {
      content: [{ type: 'text', text: '{"error":"oops"}' }],
      isError: true,
    };
    const { isError } = unwrapResponse(env);
    expect(isError).toBe(true);
  });

  it('wraps non-JSON error text into an object so stdout shape stays JSON', () => {
    const env: LateralThinkingResponse = {
      content: [{ type: 'text', text: 'plain prose error' }],
      isError: true,
    };
    const { data } = unwrapResponse(env);
    expect(data).toEqual({ error: 'plain prose error' });
  });

  it('handles empty content gracefully', () => {
    const env: LateralThinkingResponse = { content: [] };
    const { data, isError } = unwrapResponse(env);
    expect(data).toBeNull();
    expect(isError).toBe(false);
  });
});
