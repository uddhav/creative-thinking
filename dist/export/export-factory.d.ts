/**
 * Factory for creating exporters
 */
import { ExportFormat, Exporter, ExportOptions, ExportResult } from './types.js';
import { SessionState } from '../persistence/types.js';
export declare class ExportFactory {
    private static exporters;
    /**
     * Register a new exporter
     */
    static registerExporter(exporter: Exporter): void;
    /**
     * Get an exporter for the specified format
     */
    static getExporter(format: ExportFormat): Exporter;
    /**
     * Export a session in the specified format
     */
    static export(session: SessionState, format: ExportFormat, options?: Partial<ExportOptions>): Promise<ExportResult>;
    /**
     * Get all supported export formats
     */
    static getSupportedFormats(): ExportFormat[];
    /**
     * Check if a format is supported
     */
    static isFormatSupported(format: string): format is ExportFormat;
}
//# sourceMappingURL=export-factory.d.ts.map