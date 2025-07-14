/**
 * Export format types and interfaces
 */
import { SessionState, LateralTechnique } from '../persistence/types.js';
export type ExportFormat = 'json' | 'markdown' | 'csv';
export interface ExportOptions {
    format: ExportFormat;
    includeMetadata?: boolean;
    includeHistory?: boolean;
    includeInsights?: boolean;
    includeMetrics?: boolean;
    includeBranches?: boolean;
    template?: string;
    dateFormat?: string;
}
export interface ExportResult {
    content: string | Buffer;
    filename: string;
    mimeType: string;
    metadata?: Record<string, any>;
}
export interface Exporter {
    format: ExportFormat;
    export(session: SessionState, options: ExportOptions): Promise<ExportResult>;
    validateOptions?(options: ExportOptions): void;
}
export interface ExportMetadata {
    exportedAt: Date;
    exportFormat: ExportFormat;
    sessionId: string;
    techniqueUsed: LateralTechnique;
    totalSteps: number;
    completedSteps: number;
    duration?: number;
}
export declare const DEFAULT_MARKDOWN_TEMPLATE = "# {{problem}}\n\n**Date**: {{date}}  \n**Technique**: {{technique}}  \n**Session ID**: {{sessionId}}  \n**Status**: {{status}}\n\n## Session Overview\n- **Duration**: {{duration}}\n- **Steps Completed**: {{currentStep}}/{{totalSteps}}\n- **Branches**: {{branchCount}}\n- **Insights Generated**: {{insightCount}}\n\n{{#if metrics}}\n## Performance Metrics\n- **Creativity Score**: {{metrics.creativityScore}}\n- **Risks Identified**: {{metrics.risksCaught}}\n- **Antifragile Features**: {{metrics.antifragileFeatures}}\n{{/if}}\n\n## Thinking Process\n\n{{history}}\n\n{{#if insights}}\n## Key Insights\n{{insights}}\n{{/if}}\n\n{{#if branches}}\n## Alternative Paths Explored\n{{branches}}\n{{/if}}\n\n---\n*Exported from Creative Thinking MCP Tool*";
export declare const CSV_HEADERS: {
    basic: string[];
    detailed: string[];
    metrics: string[];
};
//# sourceMappingURL=types.d.ts.map