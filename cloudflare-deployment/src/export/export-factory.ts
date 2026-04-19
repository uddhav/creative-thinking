/**
 * Factory for creating exporters
 */

import type { ExportFormat, Exporter, ExportOptions, ExportResult } from './types.js';
import type { SessionState } from '../persistence/types.js';
import { MarkdownExporter } from './markdown-exporter.js';
import { JSONExporter } from './json-exporter.js';
import { CSVExporter } from './csv-exporter.js';

export class ExportFactory {
  private static exporters: Map<ExportFormat, Exporter> = new Map();

  static {
    // Register default exporters
    this.registerExporter(new MarkdownExporter());
    this.registerExporter(new JSONExporter());
    this.registerExporter(new CSVExporter());
  }

  /**
   * Register a new exporter
   */
  static registerExporter(exporter: Exporter): void {
    this.exporters.set(exporter.format, exporter);
  }

  /**
   * Get an exporter for the specified format
   */
  static getExporter(format: ExportFormat): Exporter {
    const exporter = this.exporters.get(format);

    if (!exporter) {
      throw new Error(`No exporter registered for format: ${format}`);
    }

    return exporter;
  }

  /**
   * Export a session in the specified format
   */
  static async export(
    session: SessionState,
    format: ExportFormat,
    options?: Partial<ExportOptions>
  ): Promise<ExportResult> {
    const exporter = this.getExporter(format);

    // Merge with default options
    const fullOptions: ExportOptions = {
      format,
      includeMetadata: true,
      includeHistory: true,
      includeInsights: true,
      includeMetrics: true,
      includeBranches: true,
      dateFormat: 'default',
      ...options,
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
  static getSupportedFormats(): ExportFormat[] {
    return Array.from(this.exporters.keys());
  }

  /**
   * Check if a format is supported
   */
  static isFormatSupported(format: string): format is ExportFormat {
    return this.exporters.has(format as ExportFormat);
  }
}
