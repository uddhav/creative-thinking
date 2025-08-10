/**
 * Validation Strategies
 * Handles input validation for different operation types
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
    workflow?: string;
}
export interface ValidationStrategy {
    validate(input: unknown): ValidationResult;
}
/**
 * Base validator with common validation methods
 */
declare abstract class BaseValidator implements ValidationStrategy {
    private static readonly techniqueRegistry;
    private static readonly cachedTechniques;
    private static readonly techniqueSet;
    abstract validate(input: unknown): ValidationResult;
    protected validateString(value: unknown, fieldName: string, errors: string[]): boolean;
    protected validateNumber(value: unknown, fieldName: string, errors: string[], min?: number, max?: number): value is number;
    protected validateBoolean(value: unknown, fieldName: string, errors: string[]): boolean;
    protected validateEnum<T>(value: unknown, validValues: readonly T[], fieldName: string, errors: string[]): value is T;
    protected validateArray<T>(value: unknown, fieldName: string, errors: string[], itemValidator?: (item: unknown, index: number) => boolean): value is T[];
    protected getValidTechniques(): readonly string[];
    protected isValidTechnique(value: unknown): boolean;
}
/**
 * Validator for discovery operations
 */
export declare class DiscoveryValidator extends BaseValidator {
    validate(input: unknown): ValidationResult;
}
/**
 * Validator for planning operations
 */
export declare class PlanningValidator extends BaseValidator {
    validate(input: unknown): ValidationResult;
}
/**
 * Validator for thinking step execution
 */
export declare class ExecutionValidator extends BaseValidator {
    validate(input: unknown): ValidationResult;
    private validateTechniqueSpecificFields;
}
/**
 * Validator for session operations
 */
export declare class SessionOperationValidator extends BaseValidator {
    validate(input: unknown): ValidationResult;
    private validateSaveOptions;
    private validateListOptions;
}
/**
 * Validation strategy factory
 */
export declare class ValidationStrategyFactory {
    static createValidator(operationType: string): ValidationStrategy;
}
export {};
//# sourceMappingURL=ValidationStrategies.d.ts.map