/**
 * CSV exporter for data analysis and spreadsheet import
 */
import { SessionState } from '../persistence/types.js';
import { ExportOptions, ExportResult } from './types.js';
import { BaseExporter } from './base-exporter.js';
export declare class CSVExporter extends BaseExporter {
    constructor();
    export(session: SessionState, options: ExportOptions): Promise<ExportResult>;
    private generateCSV;
    private generateDetailedCSV;
    private determineHeaders;
    private createDetailedRow;
    private generateMetricsCSV;
    /**
     * Special method to export multiple sessions as a comparative CSV
     */
    exportMultiple(sessions: SessionState[], options: ExportOptions): Promise<ExportResult>;
}
//# sourceMappingURL=csv-exporter.d.ts.map