/**
 * Enhanced JSON exporter with flexible output options
 */
import { SessionState } from '../persistence/types.js';
import { ExportOptions, ExportResult } from './types.js';
import { BaseExporter } from './base-exporter.js';
export declare class JSONExporter extends BaseExporter {
    constructor();
    export(session: SessionState, options: ExportOptions): Promise<ExportResult>;
    private prepareData;
    private enhanceHistoryEntry;
    private generateMetricsSummary;
    private categorizeScore;
    private generateStatistics;
}
//# sourceMappingURL=json-exporter.d.ts.map