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
export declare const STDIN_FIRST_BYTE_TIMEOUT_MS = 5000;
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
export declare function readStdinJSON(stream?: NodeJS.ReadableStream & {
    isTTY?: boolean;
}, firstByteTimeoutMs?: number): Promise<Record<string, unknown> | null>;
/**
 * Merge flag-derived input with stdin-derived input. Flags win when both
 * supply the same key, on the principle that CLI flags are an explicit
 * override of any base payload piped in.
 */
export declare function mergeInput(fromFlags: Record<string, unknown>, fromStdin: Record<string, unknown> | null): Record<string, unknown>;
/**
 * Pull the inner payload out of the MCP envelope. Returns the parsed JSON
 * and an isError flag the dispatcher uses to set the exit code.
 */
export declare function unwrapResponse(envelope: LateralThinkingResponse): {
    data: unknown;
    isError: boolean;
};
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
export declare function emit(data: unknown, isError: boolean): never;
/**
 * Comma-separated flag value → string array (with trim + filter empties).
 */
export declare function parseList(value: string | undefined): string[] | undefined;
/**
 * Parse string → number, returning undefined on missing/invalid input so
 * yargs `coerce` callbacks can stay declarative.
 */
export declare function parseNumber(value: string | number | undefined): number | undefined;
//# sourceMappingURL=io.d.ts.map