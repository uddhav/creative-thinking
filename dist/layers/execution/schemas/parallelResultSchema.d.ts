/**
 * Schema definitions for parallel execution data validation
 */
import { z } from 'zod';
/**
 * Schema for parallel execution result metrics
 */
export declare const ParallelMetricsSchema: z.ZodObject<{
    executionTime: z.ZodOptional<z.ZodNumber>;
    completedSteps: z.ZodOptional<z.ZodNumber>;
    totalSteps: z.ZodOptional<z.ZodNumber>;
    confidence: z.ZodOptional<z.ZodNumber>;
    flexibility: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    confidence?: number | undefined;
    totalSteps?: number | undefined;
    completedSteps?: number | undefined;
    flexibility?: number | undefined;
    executionTime?: number | undefined;
}, {
    confidence?: number | undefined;
    totalSteps?: number | undefined;
    completedSteps?: number | undefined;
    flexibility?: number | undefined;
    executionTime?: number | undefined;
}>;
/**
 * Schema for a single parallel result in the parallelResults array
 */
export declare const ParallelResultSchema: z.ZodObject<{
    planId: z.ZodString;
    technique: z.ZodEnum<["six_hats", "po", "random_entry", "scamper", "concept_extraction", "yes_and", "design_thinking", "triz", "neural_state", "temporal_work", "cross_cultural", "collective_intel", "disney_method", "nine_windows", "convergence"]>;
    insights: z.ZodArray<z.ZodString, "many">;
    results: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metrics: z.ZodOptional<z.ZodObject<{
        executionTime: z.ZodOptional<z.ZodNumber>;
        completedSteps: z.ZodOptional<z.ZodNumber>;
        totalSteps: z.ZodOptional<z.ZodNumber>;
        confidence: z.ZodOptional<z.ZodNumber>;
        flexibility: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    }, {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    technique: "six_hats" | "po" | "random_entry" | "scamper" | "concept_extraction" | "yes_and" | "design_thinking" | "triz" | "neural_state" | "temporal_work" | "cross_cultural" | "collective_intel" | "disney_method" | "nine_windows" | "convergence";
    insights: string[];
    planId: string;
    metrics?: {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    } | undefined;
    results?: Record<string, unknown> | undefined;
}, {
    technique: "six_hats" | "po" | "random_entry" | "scamper" | "concept_extraction" | "yes_and" | "design_thinking" | "triz" | "neural_state" | "temporal_work" | "cross_cultural" | "collective_intel" | "disney_method" | "nine_windows" | "convergence";
    insights: string[];
    planId: string;
    metrics?: {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    } | undefined;
    results?: Record<string, unknown> | undefined;
}>;
/**
 * Schema for the parallelResults array
 */
export declare const ParallelResultsArraySchema: z.ZodArray<z.ZodObject<{
    planId: z.ZodString;
    technique: z.ZodEnum<["six_hats", "po", "random_entry", "scamper", "concept_extraction", "yes_and", "design_thinking", "triz", "neural_state", "temporal_work", "cross_cultural", "collective_intel", "disney_method", "nine_windows", "convergence"]>;
    insights: z.ZodArray<z.ZodString, "many">;
    results: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metrics: z.ZodOptional<z.ZodObject<{
        executionTime: z.ZodOptional<z.ZodNumber>;
        completedSteps: z.ZodOptional<z.ZodNumber>;
        totalSteps: z.ZodOptional<z.ZodNumber>;
        confidence: z.ZodOptional<z.ZodNumber>;
        flexibility: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    }, {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    technique: "six_hats" | "po" | "random_entry" | "scamper" | "concept_extraction" | "yes_and" | "design_thinking" | "triz" | "neural_state" | "temporal_work" | "cross_cultural" | "collective_intel" | "disney_method" | "nine_windows" | "convergence";
    insights: string[];
    planId: string;
    metrics?: {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    } | undefined;
    results?: Record<string, unknown> | undefined;
}, {
    technique: "six_hats" | "po" | "random_entry" | "scamper" | "concept_extraction" | "yes_and" | "design_thinking" | "triz" | "neural_state" | "temporal_work" | "cross_cultural" | "collective_intel" | "disney_method" | "nine_windows" | "convergence";
    insights: string[];
    planId: string;
    metrics?: {
        confidence?: number | undefined;
        totalSteps?: number | undefined;
        completedSteps?: number | undefined;
        flexibility?: number | undefined;
        executionTime?: number | undefined;
    } | undefined;
    results?: Record<string, unknown> | undefined;
}>, "many">;
/**
 * Schema for JSON response data (when parsing response text)
 */
export declare const ResponseDataSchema: z.ZodObject<{
    insights: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    output: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodObject<{
        message: z.ZodString;
        code: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code?: string | undefined;
    }, {
        message: string;
        code?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    error?: {
        message: string;
        code?: string | undefined;
    } | undefined;
    sessionId?: string | undefined;
    insights?: string[] | undefined;
    output?: string | undefined;
}, {
    error?: {
        message: string;
        code?: string | undefined;
    } | undefined;
    sessionId?: string | undefined;
    insights?: string[] | undefined;
    output?: string | undefined;
}>;
/**
 * Type exports
 */
export type ParallelResult = z.infer<typeof ParallelResultSchema>;
export type ParallelMetrics = z.infer<typeof ParallelMetricsSchema>;
export type ResponseData = z.infer<typeof ResponseDataSchema>;
/**
 * Validation helper with detailed error messages
 */
export declare function validateParallelResult(data: unknown): {
    success: boolean;
    data?: ParallelResult;
    error?: string;
    details?: z.ZodIssue[];
};
/**
 * Validate array of parallel results
 */
export declare function validateParallelResults(data: unknown): {
    success: boolean;
    data?: ParallelResult[];
    error?: string;
    details?: z.ZodIssue[];
};
/**
 * Safe JSON parse with schema validation
 */
export declare function safeParseJSON<T>(text: string, schema: z.ZodSchema<T>): {
    success: boolean;
    data?: T;
    error?: string;
};
//# sourceMappingURL=parallelResultSchema.d.ts.map