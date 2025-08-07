/**
 * ObjectFieldValidator - Validates object-type fields in tool inputs
 * Prevents malformed JSON strings, wrong data types, and invalid structures
 */
export interface ObjectValidationResult {
    isValid: boolean;
    error?: string;
    suggestion?: string;
    value?: Record<string, unknown>;
}
export declare class ObjectFieldValidator {
    /**
     * Validates that a field is a proper object (not string, array, null, etc.)
     */
    static validateIsObject(value: unknown, fieldName: string): ObjectValidationResult;
    /**
     * Handle string values that might be JSON
     */
    private static handleStringValue;
    /**
     * Get expected format for common fields
     */
    private static getExpectedFormat;
    /**
     * Validate currentCell structure for Nine Windows technique
     */
    static validateCurrentCell(value: unknown): ObjectValidationResult;
    /**
     * Validate nineWindowsMatrix item structure
     */
    static validateNineWindowsMatrixItem(value: unknown, index: number): ObjectValidationResult;
    /**
     * Validate parallelResults item structure
     */
    static validateParallelResultItem(value: unknown, index: number): ObjectValidationResult;
}
//# sourceMappingURL=ObjectFieldValidator.d.ts.map