# Telemetry and Analytics

This document describes the telemetry and analytics system for tracking technique effectiveness in
the Creative Thinking Server.

## Overview

The telemetry system collects anonymous usage data to help improve the effectiveness of creative
thinking techniques. All data collection is:

- **Opt-in by default** - Telemetry is disabled unless explicitly enabled
- **Privacy-preserving** - No personal information is collected
- **Local by default** - Data is stored locally unless configured otherwise
- **Transparent** - You can see exactly what data is collected

## Enabling Telemetry

Telemetry is disabled by default. To enable it, set the environment variable:

```bash
export TELEMETRY_ENABLED=true
```

## Configuration

Configure telemetry behavior using environment variables:

```bash
# Master switch (required to enable telemetry)
TELEMETRY_ENABLED=true

# Data collection level
TELEMETRY_LEVEL=detailed  # Options: basic, detailed, full

# Storage backend
TELEMETRY_STORAGE=filesystem  # Options: memory, filesystem, external

# Storage location (for filesystem storage)
TELEMETRY_PATH=.creative-thinking/telemetry

# Privacy mode
TELEMETRY_PRIVACY_MODE=balanced  # Options: strict, balanced, minimal

# Batch size for event collection
TELEMETRY_BATCH_SIZE=100

# Flush interval in milliseconds
TELEMETRY_FLUSH_INTERVAL=60000

# Exclude specific patterns
TELEMETRY_EXCLUDE=test,debug
```

## Privacy Levels

### Strict Mode

- Maximum privacy protection
- Only aggregate metrics collected
- Timestamps rounded to nearest hour
- No session-specific data

### Balanced Mode (Default)

- Reasonable privacy with useful analytics
- Timestamps rounded to 5 minutes
- Anonymous session IDs
- Core metrics only

### Minimal Mode

- Full telemetry for detailed insights
- Precise timestamps
- All available metrics
- Best for personal use

## What Data is Collected

### Basic Level

- Technique start/complete events
- Session start/complete events
- Basic effectiveness scores
- Duration metrics

### Detailed Level (includes Basic)

- Insight generation counts
- Risk identification counts
- Flexibility warnings
- Creativity scores
- Revision counts

### Full Level (includes Detailed)

- Step-by-step progress
- Option generation events
- Workflow transitions
- Detailed metadata

## Data Structure

### Events Collected

1. **technique_start** - When a technique begins
2. **technique_step** - Progress through technique steps
3. **technique_complete** - Technique completion with effectiveness
4. **insight_generated** - When insights are created
5. **risk_identified** - When risks are identified
6. **option_generated** - When options are generated
7. **flexibility_warning** - When flexibility drops below thresholds
8. **session_start** - Beginning of a creative thinking session
9. **session_complete** - End of session with summary metrics
10. **workflow_transition** - Transitions between techniques

### Metrics Tracked

- **Effectiveness Score** (0-1) - How well the technique performed
- **Insight Density** - Insights per step
- **Risk Identification Rate** - Risks found per session
- **Flexibility Preservation** - How well options were maintained
- **Completion Rate** - Percentage of sessions completed
- **Average Duration** - Time spent on techniques
- **User Satisfaction** - Optional rating (1-5)

## Analytics API

### Get Analytics

```typescript
const telemetry = TelemetryCollector.getInstance();
const analyzer = new TelemetryAnalyzer(config);

// Get analytics for last 30 days
const analytics = await analyzer.getAnalytics({
  timeRange: 'last_30_days',
  groupBy: 'technique',
  metrics: ['effectiveness', 'completion_rate', 'insight_density'],
});

// Get technique effectiveness
const effectiveness = await analyzer.getTechniqueEffectiveness('six_hats');

// Get session analytics
const sessions = await analyzer.getSessionAnalytics();
```

### Export Data

```typescript
// Export telemetry data
const exportData = await telemetry.exportTelemetry('anonymized');

// Clear telemetry data
await telemetry.clearTelemetry();

// Get telemetry status
const status = telemetry.getStatus();
console.log(`Telemetry enabled: ${status.enabled}`);
console.log(`Events buffered: ${status.bufferedEvents}`);
```

## Privacy Features

### Session ID Anonymization

- Real session IDs are hashed with a random salt
- Consistent within a telemetry instance
- Cannot be reversed to original IDs

### Event Filtering

- Exclude specific event types or techniques
- Use TELEMETRY_EXCLUDE environment variable
- Patterns are matched against event types and technique names

### Data Retention

- Automatic cleanup of old events (30 days by default)
- Memory limits prevent excessive storage
- Filesystem storage includes rotation

### No Content Collection

- Problem statements are never collected
- Output content is never collected
- Only metadata and metrics are tracked

## Storage Options

### Memory Storage (Default)

- Events stored in memory only
- Lost when server restarts
- Good for testing and development
- Limited to 10,000 events

### Filesystem Storage

- Events stored in JSONL files
- Organized by date
- Automatic rotation at 10MB
- Persists across restarts

### External Storage

- Placeholder for future API integration
- Would allow centralized analytics
- Not currently implemented

## Example Insights

With telemetry enabled, you can discover:

- Which techniques are most effective for different problem types
- Average time to complete different techniques
- Which technique combinations work well together
- When users tend to abandon sessions
- How flexibility changes throughout sessions
- Patterns in insight generation

## Viewing Analytics

The telemetry system provides programmatic access to analytics. Future updates may include:

- Visual dashboard for analytics
- Command-line analytics viewer
- Export to visualization tools
- Integration with MCP tools

## Disabling Telemetry

To disable telemetry:

1. Set `TELEMETRY_ENABLED=false` or remove the environment variable
2. Optionally clear existing data:
   ```bash
   rm -rf .creative-thinking/telemetry
   ```

## Data Control

You have full control over your telemetry data:

- **View**: Use the analytics API to see collected data
- **Export**: Export data in JSON format for analysis
- **Delete**: Clear all telemetry data at any time
- **Configure**: Adjust privacy levels and collection settings

## Contributing to Analytics

The aggregated, anonymized insights from telemetry help improve:

- Technique effectiveness algorithms
- Workflow recommendations
- Default technique parameters
- Documentation and examples

## Security Considerations

- All data is stored locally by default
- No network requests unless external storage is configured
- No authentication tokens or credentials collected
- File permissions restrict access to telemetry data

## Future Enhancements

Planned improvements to the telemetry system:

1. **Visual Analytics Dashboard** - Web-based visualization
2. **Comparative Analysis** - Compare your metrics to aggregated benchmarks
3. **Custom Metrics** - Define your own tracking metrics
4. **Integration APIs** - Connect to external analytics platforms
5. **Real-time Monitoring** - Live view of technique performance

## Questions and Support

If you have questions about telemetry:

- Review the privacy policy in the code
- Check the implementation in `src/telemetry/`
- Open an issue for clarification
- Telemetry is completely optional
