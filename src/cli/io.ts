/**
 * CLI I/O helpers — input parsing (flags + stdin JSON) and output unwrapping.
 *
 * Each LateralThinkingServer handler returns an MCP envelope of the form
 *   { content: [{ type: 'text', text: '<inner-json-string>' }], isError?: boolean }
 * The CLI prints the inner JSON directly so the calling skill/script never
 * sees the envelope.
 */

import type { LateralThinkingResponse } from '../types/index.js';

/** How long to wait for the first byte before deciding nothing is coming. */
export const STDIN_FIRST_BYTE_TIMEOUT_MS = 5000;

/**
 * Read all of stdin and parse as JSON.
 * Returns null when stdin is a TTY (interactive use) so callers can fall back
 * to flags only.
 *
 * The wait for the *first* byte is bounded, because a stdin that is neither a
 * TTY nor ever closed made this wait forever. That is the ordinary shape of
 *
 *     PLAN=$(socketes plan --problem "…" | head -1)
 *
 * in a script: inside `$( )` stdin is inherited from the parent shell, so it is
 * open, is not a TTY, and never delivers EOF. The command hangs with no output
 * and no indication of what it is waiting for. One did, here, for 84 minutes.
 *
 * Once a first byte arrives the read runs to EOF with no bound — a slow or
 * large payload must not be truncated. The choice on timeout is to fail rather
 * than to carry on with flags alone: proceeding would silently discard a
 * payload that arrived a moment late, and the technique-specific fields are
 * exactly what travels on stdin.
 */
export async function readStdinJSON(
  stream: NodeJS.ReadableStream & { isTTY?: boolean } = process.stdin,
  firstByteTimeoutMs: number = STDIN_FIRST_BYTE_TIMEOUT_MS
): Promise<Record<string, unknown> | null> {
  if (stream.isTTY) return null;

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    let sawFirstChunk = false;

    const cleanup = () => {
      clearTimeout(timer);
      stream.off('data', onData);
      stream.off('end', onEnd);
      stream.off('error', onError);
    };
    const onData = (chunk: Buffer | string) => {
      if (!sawFirstChunk) {
        sawFirstChunk = true;
        clearTimeout(timer);
      }
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    };
    const onEnd = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const timer = setTimeout(() => {
      if (sawFirstChunk) return;
      cleanup();
      reject(
        new Error(
          `stdin stayed open and sent nothing for ${firstByteTimeoutMs}ms. ` +
            'If you are not piping input, close it — `socketes … < /dev/null` — ' +
            'which is also what a script needs inside $( ).'
        )
      );
    }, firstByteTimeoutMs);

    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
  });

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('stdin JSON must be an object');
    }
    return parsed as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Failed to parse stdin JSON: ${(err as Error).message}`);
  }
}

/**
 * Merge flag-derived input with stdin-derived input. Flags win when both
 * supply the same key, on the principle that CLI flags are an explicit
 * override of any base payload piped in.
 */
export function mergeInput(
  fromFlags: Record<string, unknown>,
  fromStdin: Record<string, unknown> | null
): Record<string, unknown> {
  // Drop undefined-valued flag keys *first* so they don't overwrite stdin
  // fields. yargs returns `undefined` for unspecified options, and we want
  // those to behave as "not set" rather than "explicitly clear".
  const flags = stripUndefined(fromFlags);
  if (!fromStdin) return flags;
  return stripUndefined({ ...fromStdin, ...flags });
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Pull the inner payload out of the MCP envelope. Returns the parsed JSON
 * and an isError flag the dispatcher uses to set the exit code.
 */
export function unwrapResponse(envelope: LateralThinkingResponse): {
  data: unknown;
  isError: boolean;
} {
  const isError = envelope.isError === true;
  const text = envelope.content?.[0]?.text ?? '';

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Handler didn't emit JSON (some error responses are plain prose).
    // Wrap as an object so stdout output is always JSON-shaped.
    data = { error: text };
  }

  return { data, isError };
}

/**
 * Print a JSON document and exit with the right code.
 *
 * Successes go to stdout, errors to stderr — keeps stdout a single
 * parseable JSON value for skill consumers.
 *
 * Critical: we wait for the write callback before calling process.exit(),
 * otherwise large payloads get truncated when the pipe buffer hasn't
 * drained yet. Empirically this happens at ~8KB on macOS pipes.
 */
export function emit(data: unknown, isError: boolean): never {
  const stream = isError ? process.stderr : process.stdout;
  const code = isError ? 1 : 0;
  stream.write(`${JSON.stringify(data, null, 2)}\n`, () => process.exit(code));
  // The write callback is what actually exits. Returning never keeps
  // callers honest about not doing further work after emit().
  return undefined as never;
}

/**
 * Comma-separated flag value → string array (with trim + filter empties).
 */
export function parseList(value: string | undefined): string[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return parts.length ? parts : undefined;
}

/**
 * Parse string → number, returning undefined on missing/invalid input so
 * yargs `coerce` callbacks can stay declarative.
 */
export function parseNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}
