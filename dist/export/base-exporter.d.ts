/**
 * Base exporter class with common functionality
 */
import { SessionState } from '../persistence/types.js';
import { ExportOptions, ExportResult, Exporter, ExportFormat } from './types.js';
export declare abstract class BaseExporter implements Exporter {
    readonly format: ExportFormat;
    constructor(format: ExportFormat);
    abstract export(session: SessionState, options: ExportOptions): Promise<ExportResult>;
    /**
     * Generate a default filename for the export
     */
    protected generateFilename(session: SessionState, extension: string): string;
    /**
     * Format a date according to options
     */
    protected formatDate(date: Date | number | undefined, format?: string): string;
    /**
     * Calculate session duration in human-readable format
     */
    protected calculateDuration(startTime?: number, endTime?: number): string;
    /**
     * Get a human-readable status for the session
     */
    protected getSessionStatus(session: SessionState): string;
    /**
     * Get technique display name
     */
    protected getTechniqueDisplayName(technique: string): string;
    /**
     * Escape special characters for CSV
     */
    protected escapeCSV(value: string): string;
}
//# sourceMappingURL=base-exporter.d.ts.map