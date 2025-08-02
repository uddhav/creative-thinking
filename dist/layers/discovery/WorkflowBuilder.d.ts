/**
 * WorkflowBuilder - Handles workflow creation and integration suggestions
 * Extracted from discoverTechniques to improve maintainability
 */
import type { LateralTechnique } from '../../types/index.js';
import type { DiscoverTechniquesOutput } from '../../types/planning.js';
export declare class WorkflowBuilder {
    /**
     * Build integration suggestions for multiple techniques
     */
    buildIntegrationSuggestions(techniques: LateralTechnique[], complexity: 'low' | 'medium' | 'high'): DiscoverTechniquesOutput['integrationSuggestions'];
    /**
     * Create a phased workflow for multiple techniques
     */
    createWorkflow(techniques: LateralTechnique[], problemCategory: string): DiscoverTechniquesOutput['workflow'];
}
//# sourceMappingURL=WorkflowBuilder.d.ts.map