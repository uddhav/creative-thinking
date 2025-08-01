/**
 * Metadata generation for execution layer responses
 * Creates structured metadata for thinking steps
 */
export class MetadataGenerator {
    /**
     * Generate metadata for thinking step response
     */
    static generateMetadata(input, sessionId, ergodicityResult, complexity, effectiveness, pathAnalysis, memoryPattern) {
        const metadata = {
            sessionId,
            technique: input.technique,
            step: `${input.currentStep}/${input.totalSteps}`,
            timestamp: new Date().toISOString(),
        };
        // Add complexity if available
        if (complexity) {
            metadata.complexity = complexity;
        }
        // Add ergodicity data if available
        if (ergodicityResult) {
            if (ergodicityResult.warnings.length > 0) {
                metadata.ergodicityWarnings = ergodicityResult.warnings;
            }
            if (ergodicityResult.earlyWarningState) {
                metadata.earlyWarningState = ergodicityResult.earlyWarningState;
            }
            if (ergodicityResult.escapeRecommendation) {
                metadata.escapeRecommendation = ergodicityResult.escapeRecommendation;
            }
            if (ergodicityResult.escapeVelocityNeeded) {
                metadata.escapeVelocityNeeded = true;
            }
        }
        // Add effectiveness if available
        if (effectiveness) {
            metadata.effectiveness = effectiveness;
        }
        // Add path analysis if available
        if (pathAnalysis) {
            metadata.pathAnalysis = pathAnalysis;
        }
        // Add memory pattern if available
        if (memoryPattern) {
            metadata.memoryPattern = memoryPattern;
        }
        // Add revision metadata if applicable
        if (input.isRevision) {
            metadata.revision = {
                isRevision: true,
                revisesStep: input.revisesStep,
            };
        }
        // Add branch metadata if applicable
        if (input.branchFromStep && input.branchId) {
            metadata.branch = {
                fromStep: input.branchFromStep,
                branchId: input.branchId,
            };
        }
        return metadata;
    }
    /**
     * Generate summary metadata for completed session
     */
    static generateSummaryMetadata(sessionId, technique, totalSteps, insights) {
        return {
            sessionId,
            technique,
            status: 'completed',
            totalSteps,
            insightCount: insights.length,
            completedAt: new Date().toISOString(),
        };
    }
}
//# sourceMappingURL=metadataGenerator.js.map