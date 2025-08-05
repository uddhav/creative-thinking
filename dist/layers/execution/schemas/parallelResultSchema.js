/**
 * Schema definitions for parallel execution data validation
 */
import { z } from 'zod';
// Define the valid techniques
const LATERAL_TECHNIQUES = [
    'six_hats',
    'po',
    'random_entry',
    'scamper',
    'concept_extraction',
    'yes_and',
    'design_thinking',
    'triz',
    'neural_state',
    'temporal_work',
    'cross_cultural',
    'collective_intel',
    'disney_method',
    'nine_windows',
    'convergence',
];
/**
 * Schema for parallel execution result metrics
 */
export const ParallelMetricsSchema = z.object({
    executionTime: z.number().optional(),
    completedSteps: z.number().optional(),
    totalSteps: z.number().optional(),
    confidence: z.number().min(0).max(1).optional(),
    flexibility: z.number().min(0).max(1).optional(),
});
/**
 * Schema for a single parallel result in the parallelResults array
 */
export const ParallelResultSchema = z.object({
    planId: z.string().min(1, 'planId must be a non-empty string'),
    technique: z.enum(LATERAL_TECHNIQUES, {
        errorMap: () => ({ message: 'technique must be a valid lateral thinking technique' }),
    }),
    insights: z.array(z.string()),
    results: z.record(z.unknown()).optional(),
    metrics: ParallelMetricsSchema.optional(),
});
/**
 * Schema for the parallelResults array
 */
export const ParallelResultsArraySchema = z.array(ParallelResultSchema);
/**
 * Schema for JSON response data (when parsing response text)
 */
export const ResponseDataSchema = z.object({
    insights: z.array(z.string()).optional(),
    output: z.string().optional(),
    sessionId: z.string().optional(),
    error: z
        .object({
        message: z.string(),
        code: z.string().optional(),
    })
        .optional(),
});
/**
 * Validation helper with detailed error messages
 */
export function validateParallelResult(data) {
    const result = ParallelResultSchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    // Format error message
    const errorMessages = result.error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
    });
    return {
        success: false,
        error: `Validation failed: ${errorMessages.join('; ')}`,
        details: result.error.issues,
    };
}
/**
 * Validate array of parallel results
 */
export function validateParallelResults(data) {
    const result = ParallelResultsArraySchema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    // Format error message with array indices
    const errorMessages = result.error.issues.map(issue => {
        const path = issue.path.join('.');
        return `${path}: ${issue.message}`;
    });
    return {
        success: false,
        error: `Validation failed: ${errorMessages.join('; ')}`,
        details: result.error.issues,
    };
}
/**
 * Safe JSON parse with schema validation
 */
export function safeParseJSON(text, schema) {
    try {
        const parsed = JSON.parse(text);
        const validated = schema.safeParse(parsed);
        if (validated.success) {
            return { success: true, data: validated.data };
        }
        return {
            success: false,
            error: `Invalid JSON structure: ${validated.error.message}`,
        };
    }
    catch (e) {
        return {
            success: false,
            error: `JSON parsing failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
        };
    }
}
//# sourceMappingURL=parallelResultSchema.js.map