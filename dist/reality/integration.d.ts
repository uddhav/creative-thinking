/**
 * Reality Assessment Integration
 *
 * Integrates the Reality Gradient System into existing thinking techniques
 * to enhance rather than restrict creativity.
 */
import type { RealityAssessment, LateralTechnique, ExecuteThinkingStepInput } from '../index.js';
export declare class RealityIntegration {
    /**
     * Detect domain from problem and context with caching for performance
     */
    static detectDomain(problem: string, context?: string): string | undefined;
    /**
     * Update cache with size limit management
     */
    private static updateCache;
    /**
     * Enhance technique output with reality assessment
     */
    static enhanceWithReality(input: ExecuteThinkingStepInput, output: string): {
        enhancedOutput: string;
        realityAssessment?: RealityAssessment;
    };
    /**
     * Get technique-specific reality checks
     */
    static getTechniqueChecks(technique: LateralTechnique): string[];
    /**
     * Analyze multiple outputs for reality patterns
     */
    static analyzeSessionReality(outputs: Array<{
        output: string;
        assessment?: RealityAssessment;
    }>): {
        feasibilityTrend: 'improving' | 'declining' | 'stable';
        breakthroughsNeeded: Set<string>;
        commonBarriers: Map<string, number>;
    };
    /**
     * Generate breakthrough strategy based on assessments
     */
    static generateBreakthroughStrategy(analysis: ReturnType<typeof RealityIntegration.analyzeSessionReality>): string;
}
//# sourceMappingURL=integration.d.ts.map