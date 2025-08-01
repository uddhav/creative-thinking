/**
 * Types for the execution layer
 */
/**
 * Type guard for ErgodicityResult
 */
export function isErgodicityResult(value) {
    return (value !== null &&
        typeof value === 'object' &&
        'event' in value &&
        'metrics' in value &&
        'warnings' in value &&
        Array.isArray(value.warnings));
}
//# sourceMappingURL=types.js.map