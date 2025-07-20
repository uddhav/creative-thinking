/**
 * Export format types and interfaces
 */

import type { SessionState, LateralTechnique } from '../persistence/types.js';

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

// Template constants for Markdown export
export const DEFAULT_MARKDOWN_TEMPLATE = `# {{problem}}

**Date**: {{date}}  
**Technique**: {{technique}}  
**Session ID**: {{sessionId}}  
**Status**: {{status}}

## Session Overview
- **Duration**: {{duration}}
- **Steps Completed**: {{currentStep}}/{{totalSteps}}
- **Branches**: {{branchCount}}
- **Insights Generated**: {{insightCount}}

{{#if metrics}}
## Performance Metrics
- **Creativity Score**: {{metrics.creativityScore}}
- **Risks Identified**: {{metrics.risksCaught}}
- **Antifragile Features**: {{metrics.antifragileFeatures}}
{{/if}}

{{#if history}}
## Thinking Process

{{history}}
{{/if}}

{{#if insights}}
## Key Insights
{{insights}}
{{/if}}

{{#if branches}}
## Alternative Paths Explored
{{branches}}
{{/if}}

---
*Exported from Creative Thinking MCP Tool*`;

// CSV headers for different export types
export const CSV_HEADERS = {
  basic: ['Step', 'Timestamp', 'Technique', 'Output'],
  detailed: [
    'Step',
    'Timestamp',
    'Technique',
    'HatColor',
    'Action',
    'Output',
    'Risks',
    'Mitigations',
  ],
  metrics: [
    'SessionID',
    'Problem',
    'Technique',
    'Duration',
    'Steps',
    'CreativityScore',
    'RisksIdentified',
    'Insights',
  ],
};
