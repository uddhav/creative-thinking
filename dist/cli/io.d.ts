/**
 * CLI I/O helpers — input parsing (flags + stdin JSON) and output unwrapping.
 *
 * Each LateralThinkingServer handler returns an MCP envelope of the form
 *   { content: [{ type: 'text', text: '<inner-json-string>' }], isError?: boolean }
 * The CLI prints the inner JSON directly so the calling skill/script never
 * sees the envelope.
 */
import type { LateralThinkingResponse } from '../types/index.js';
/**
 * Read all of stdin and parse as JSON.
 * Returns null when stdin is a TTY (interactive use) so callers can fall back
 * to flags only.
 */
export declare function readStdinJSON(): Promise<Record<string, unknown> | null>;
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