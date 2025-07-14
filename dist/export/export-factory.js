/**
 * Factory for creating exporters
 */
import { MarkdownExporter } from './markdown-exporter.js';
import { JSONExporter } from './json-exporter.js';
import { CSVExporter } from './csv-exporter.js';
export class ExportFactory {
    static exporters = new Map();
    static {
        // Register default exporters
        this.registerExporter(new MarkdownExporter());
        this.registerExporter(new JSONExporter());
        this.registerExporter(new CSVExporter());
    }
    /**
     * Register a new exporter
     */
    static registerExporter(exporter) {
        this.exporters.set(exporter.format, exporter);
    }
    /**
     * Get an exporter for the specified format
     */
    static getExporter(format) {
        const exporter = this.exporters.get(format);
        if (!exporter) {
            throw new Error(`No exporter registered for format: ${format}`);
        }
        return exporter;
    }
    /**
     * Export a session in the specified format
     */
    static async export(session, format, options) {
        const exporter = this.getExporter(format);
        // Merge with default options
        const fullOptions = {
            format,
            includeMetadata: true,
            includeHistory: true,
            includeInsights: true,
            includeMetrics: true,
            includeBranches: true,
            dateFormat: 'default',
            ...options
        };
        // Validate options if the exporter supports it
        if ('validateOptions' in exporter && typeof exporter.validateOptions === 'function') {
            exporter.validateOptions(fullOptions);
        }
        return exporter.export(session, fullOptions);
    }
    /**
     * Get all supported export formats
     */
    static getSupportedFormats() {
        return Array.from(this.exporters.keys());
    }
    /**
     * Check if a format is supported
     */
    static isFormatSupported(format) {
        return this.exporters.has(format);
    }
}
//# sourceMappingURL=export-factory.js.map