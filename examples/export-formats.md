# Export Formats Guide

The Creative Thinking MCP Tool supports exporting your thinking sessions in three formats: **Markdown**, **JSON**, and **CSV**. Each format serves different use cases and provides varying levels of detail.

## Table of Contents
- [Export Command Usage](#export-command-usage)
- [Markdown Export](#markdown-export)
- [JSON Export](#json-export)
- [CSV Export](#csv-export)
- [Use Cases](#use-cases)

## Export Command Usage

To export a session, use the `sessionOperation: 'export'` with the following options:

```json
{
  "technique": "six_hats",
  "problem": "dummy",
  "currentStep": 1,
  "totalSteps": 1,
  "output": "",
  "nextStepNeeded": false,
  "sessionOperation": "export",
  "exportOptions": {
    "sessionId": "session_123abc",
    "format": "markdown"  // or "json" or "csv"
  }
}
```

## Markdown Export

Markdown export creates a human-readable document perfect for reports, documentation, or sharing insights with others.

### Example Output

```markdown
# How to improve team collaboration

**Date**: 2024-01-15 10:00  
**Technique**: Six Thinking Hats  
**Session ID**: session_123abc  
**Status**: Completed (6/6 steps)

## Session Overview
- **Duration**: 45 minutes
- **Steps Completed**: 6/6
- **Branches**: 2
- **Insights Generated**: 5

## Performance Metrics
- **Creativity Score**: 75
- **Risks Identified**: 8
- **Antifragile Features**: 3

## Thinking Process

### 🔵 Step 1
*January 15, 2024 at 10:00 AM*

**BLUE HAT - Process Control**

We need to analyze our collaboration challenges systematically. The goal is to identify concrete improvements that can be implemented within Q1.

### ⚪ Step 2
*January 15, 2024 at 10:05 AM*

**WHITE HAT - Facts & Information**

Current facts: 8 team members across 3 time zones, average response time 48 hours, 2 weekly meetings with 60% attendance.

#### ⚠️ Risks Identified
- Communication delays affecting project timelines
- Meeting fatigue leading to low engagement

#### ✅ Mitigations
- Implement async communication protocols
- Record all meetings for later viewing

## Key Insights
1. Asynchronous communication is critical for distributed teams
2. Time zone awareness must be built into our workflows
3. Meeting fatigue can be reduced with better agenda management
4. Documentation is key to knowledge sharing
5. Regular social interactions improve team cohesion

---
*Exported from Creative Thinking MCP Tool*
```

### Features
- Rich formatting with emojis for visual appeal
- Technique-specific sections (hat colors, SCAMPER actions, etc.)
- Risk and mitigation tracking
- Performance metrics summary
- Chronological thinking process
- Key insights highlighted

### Best For
- Sharing results with stakeholders
- Creating documentation
- Personal reflection and review
- Integration with note-taking apps (Obsidian, Notion, etc.)

## JSON Export

JSON export provides complete session data in a structured format, ideal for programmatic processing and analysis.

### Example Output

```json
{
  "exportMetadata": {
    "exportedAt": "2024-01-15T11:00:00Z",
    "exportVersion": "1.0",
    "tool": "Creative Thinking MCP Tool"
  },
  "sessionId": "session_123abc",
  "problem": "How to improve team collaboration",
  "technique": "six_hats",
  "status": "Completed (6/6 steps)",
  "progress": {
    "currentStep": 6,
    "totalSteps": 6,
    "percentComplete": 100
  },
  "metadata": {
    "name": "Team Collaboration Analysis",
    "tags": ["collaboration", "remote-work", "process-improvement"],
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T10:45:00Z",
    "duration": "45 minutes"
  },
  "history": [
    {
      "step": 1,
      "timestamp": "2024-01-15T10:00:00Z",
      "output": "We need to analyze our collaboration challenges...",
      "technique": "six_hats",
      "hatColor": "blue",
      "risks": ["Scope creep", "Analysis paralysis"],
      "mitigations": ["Time-boxed analysis", "Clear objectives"]
    }
  ],
  "insights": {
    "count": 5,
    "items": [
      "Asynchronous communication is critical",
      "Time zone awareness needed",
      "Documentation is key"
    ]
  },
  "metrics": {
    "creativityScore": 75,
    "risksCaught": 8,
    "antifragileFeatures": 3,
    "summary": {
      "overallCreativity": "Creative",
      "riskAwareness": "Good Risk Awareness",
      "robustness": "Somewhat Robust"
    }
  },
  "statistics": {
    "totalOutputLength": 3456,
    "averageOutputLength": 576,
    "uniqueConceptsCount": 24,
    "revisionCount": 2,
    "branchingPoints": 2
  }
}
```

### Features
- Complete session data preservation
- Structured metadata and statistics
- Enhanced metrics with categorization
- Technique-specific fields preserved
- Machine-readable format
- Supports partial exports via options

### Best For
- Data analysis and visualization
- Integration with other tools
- Backup and archival
- Building analytics dashboards
- API responses

## CSV Export

CSV export provides tabular data suitable for spreadsheet analysis and data visualization tools.

### Detailed History Format

When exporting with history, each thinking step becomes a row:

```csv
Step,Timestamp,Technique,Hat Color,Output,Risks,Mitigations
1,2024-01-15 10:00,Six Thinking Hats,BLUE,"Process control and planning","Scope creep; Analysis paralysis","Time-boxing; Clear objectives"
2,2024-01-15 10:05,Six Thinking Hats,WHITE,"Facts: 8 members, 3 zones","Communication delays","Async protocols"
3,2024-01-15 10:10,Six Thinking Hats,RED,"Team frustration with delays","Burnout risk","Regular check-ins"
```

### Metrics Summary Format

When exporting metrics only, each session becomes a row:

```csv
SessionID,Problem,Technique,Duration,Steps,CreativityScore,RisksIdentified,Insights
session_123,Team collaboration,Six Thinking Hats,45,6/6,75,8,5
session_456,Product innovation,SCAMPER,60,7/7,88,12,8
session_789,Cost reduction,Random Entry,30,3/3,65,4,3
```

### Features
- Dynamic column generation based on technique
- Proper CSV escaping for commas and quotes
- Array data joined with semicolons
- Support for comparative analysis
- Easy import into Excel/Google Sheets

### Best For
- Data analysis in spreadsheets
- Creating charts and graphs
- Comparative session analysis
- Performance tracking over time
- Bulk data processing

## Use Cases

### 1. Project Documentation
Export completed sessions as **Markdown** to include in project documentation, wikis, or knowledge bases.

### 2. Performance Analytics
Export multiple sessions as **CSV** to analyze trends, measure improvement, and identify patterns across thinking sessions.

### 3. Tool Integration
Export as **JSON** to integrate with other tools, build custom visualizations, or create automated workflows.

### 4. Stakeholder Reports
Export as **Markdown** with custom templates to create professional reports for management or clients.

### 5. Research and Analysis
Export as **JSON** for detailed analysis of thinking patterns, technique effectiveness, and insight generation.

## Export Options

All export formats support these options:

```typescript
{
  includeMetadata?: boolean;    // Session metadata (default: true)
  includeHistory?: boolean;     // Thinking steps (default: true)  
  includeInsights?: boolean;    // Generated insights (default: true)
  includeMetrics?: boolean;     // Performance metrics (default: true)
  includeBranches?: boolean;    // Alternative paths (default: true)
  dateFormat?: string;          // Date formatting (default: 'default')
}
```

## Tips

1. **For Reports**: Use Markdown with all options enabled
2. **For Analysis**: Use JSON for complete data or CSV for spreadsheet work
3. **For Archival**: Use JSON to preserve all session details
4. **For Sharing**: Use Markdown for readability
5. **For Dashboards**: Use CSV for easy data visualization

Remember to save your exports regularly, especially for important thinking sessions!