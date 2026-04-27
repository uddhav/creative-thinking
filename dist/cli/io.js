/**
 * CLI I/O helpers — input parsing (flags + stdin JSON) and output unwrapping.
 *
 * Each LateralThinkingServer handler returns an MCP envelope of the form
 *   { content: [{ type: 'text', text: '<inner-json-string>' }], isError?: boolean }
 * The CLI prints the inner JSON directly so the calling skill/script never
 * sees the envelope.
 */
/**
 * Read all of stdin and parse as JSON.
 * Returns null when stdin is a TTY (interactive use) so callers can fall back
 * to flags only.
 */
export async function readStdinJSON() {
    if (process.stdin.isTTY)
        return null;
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const raw = Buffer.concat(chunks).toString('utf8').trim();
    if (!raw)
        return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error('stdin JSON must be an object');
        }
        return parsed;
    }
    catch (err) {
        throw new Error(`Failed to parse stdin JSON: ${err.message}`);
    }
}
/**
 * Merge flag-derived input with stdin-derived input. Flags win when both
 * supply the same key, on the principle that CLI flags are an explicit
 * override of any base payload piped in.
 */
export function mergeInput(fromFlags, fromStdin) {
    // Drop undefined-valued flag keys *first* so they don't overwrite stdin
    // fields. yargs returns `undefined` for unspecified options, and we want
    // those to behave as "not set" rather than "explicitly clear".
    const flags = stripUndefined(fromFlags);
    if (!fromStdin)
        return flags;
    return stripUndefined({ ...fromStdin, ...flags });
}
function stripUndefined(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined)
            out[k] = v;
    }
    return out;
}
/**
 * Pull the inner payload out of the MCP envelope. Returns the parsed JSON
 * and an isError flag the dispatcher uses to set the exit code.
 */
export function unwrapResponse(envelope) {
    const isError = envelope.isError === true;
    const text = envelope.content?.[0]?.text ?? '';
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    }
    catch {
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
export function emit(data, isError) {
    const stream = isError ? process.stderr : process.stdout;
    const code = isError ? 1 : 0;
    stream.write(`${JSON.stringify(data, null, 2)}\n`, () => process.exit(code));
    // The write callback is what actually exits. Returning never keeps
    // callers honest about not doing further work after emit().
    return undefined;
}
/**
 * Comma-separated flag value → string array (with trim + filter empties).
 */
export function parseList(value) {
    if (!value)
        return undefined;
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
export function parseNumber(value) {
    if (value === undefined || value === '')
        return undefined;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : undefined;
}
//# sourceMappingURL=io.js.map