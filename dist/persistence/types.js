/**
 * Core types and interfaces for session persistence
 */
/**
 * The step data of a persisted entry, whichever shape the file holds. A flat
 * entry always carries `technique` at the top level and the old wrapper never
 * did; keying on a field named `input` would misread a flat entry whose
 * caller sent a field of that name (the execute schema admits unknown
 * fields, and every one lands on the entry). The flat entry's `step` (the
 * file's own index) is dropped: a reloaded entry then has the same keys as a
 * fresh one.
 */
export function historyInput(entry) {
    if ('technique' in entry) {
        const { step: _fileIndex, ...data } = entry;
        return data;
    }
    return entry.input;
}
/**
 * Error codes for persistence operations
 */
export var PersistenceErrorCode;
(function (PersistenceErrorCode) {
    PersistenceErrorCode["NOT_FOUND"] = "NOT_FOUND";
    PersistenceErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    PersistenceErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    PersistenceErrorCode["STORAGE_FULL"] = "STORAGE_FULL";
    PersistenceErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    PersistenceErrorCode["CORRUPTION"] = "CORRUPTION";
    PersistenceErrorCode["IO_ERROR"] = "IO_ERROR";
    PersistenceErrorCode["EXPORT_FAILED"] = "EXPORT_FAILED";
})(PersistenceErrorCode || (PersistenceErrorCode = {}));
/**
 * Custom error class for persistence operations
 */
export class PersistenceError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'PersistenceError';
    }
}
//# sourceMappingURL=types.js.map