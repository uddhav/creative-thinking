/**
 * Enhanced Markdown exporter with rich formatting
 */
import type { SessionState } from '../persistence/types.js';
import type { ExportOptions, ExportResult } from './types.js';
import { BaseExporter } from './base-exporter.js';
export declare class MarkdownExporter extends BaseExporter {
    constructor();
    export(session: SessionState, options: ExportOptions): Promise<ExportResult>;
    private generateMarkdown;
    private processConditionals;
    private formatHistory;
    private formatHistoryEntry;
    private formatArraySection;
    private getStepEmoji;
    private getTechniqueDetails;
    private formatInsights;
    private formatBranches;
}
//# sourceMappingURL=markdown-exporter.d.ts.map