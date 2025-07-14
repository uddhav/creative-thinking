/**
 * Export format types and interfaces
 */
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

## Thinking Process

{{history}}

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
    detailed: ['Step', 'Timestamp', 'Technique', 'HatColor', 'Action', 'Output', 'Risks', 'Mitigations'],
    metrics: ['SessionID', 'Problem', 'Technique', 'Duration', 'Steps', 'CreativityScore', 'RisksIdentified', 'Insights']
};
//# sourceMappingURL=types.js.map