/**
 * Metadata generation for execution layer responses
 * Creates structured metadata for thinking steps
 */
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import type { ErgodicityResult, ComplexitySuggestion } from './types.js';
export declare class MetadataGenerator {
    /**
     * Generate metadata for thinking step response
     */
    static generateMetadata(input: ExecuteThinkingStepInput, sessionId: string, ergodicityResult?: ErgodicityResult, complexity?: ComplexitySuggestion | null, effectiveness?: any, pathAnalysis?: any, memoryPattern?: any): Record<string, any>;
    /**
     * Generate summary metadata for completed session
     */
    static generateSummaryMetadata(sessionId: string, technique: string, totalSteps: number, insights: string[]): Record<string, any>;
}
//# sourceMappingURL=metadataGenerator.d.ts.map