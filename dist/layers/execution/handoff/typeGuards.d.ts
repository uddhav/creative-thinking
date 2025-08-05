/**
 * Type guards for safe type checking in the LLM Handoff Bridge
 */
export declare function isRiskArray(data: unknown): data is Array<{
    description: string;
    severity?: string;
}>;
export declare function isStringArray(data: unknown): data is string[];
export declare function getRiskDescription(risk: unknown): string;
export declare function isResultsObject(data: unknown): data is Record<string, unknown>;
export declare function extractRisksFromResults(results: unknown): unknown[];
export declare function getRiskCount(results: unknown): number;
export declare function extractTextContent(value: unknown): string[];
//# sourceMappingURL=typeGuards.d.ts.map