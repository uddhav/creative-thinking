/**
 * Core types and interfaces for session persistence
 */
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