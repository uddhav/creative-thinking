#!/usr/bin/env node

/**
 * Export telemetry data for analysis
 */

import { TelemetryAnalyzer } from '../dist/telemetry/TelemetryAnalyzer.js';
import { PrivacyManager } from '../dist/telemetry/privacy.js';
import fs from 'fs/promises';
import path from 'path';

async function exportTelemetry() {
  // Get config from environment
  const config = PrivacyManager.getConfigFromEnvironment();

  // Create analyzer
  const analyzer = new TelemetryAnalyzer(config);

  // Get various analytics
  console.error('📊 Fetching telemetry data...\n');

  try {
    // Technique usage (starts, completions, averages of what was recorded)
    const usage = await analyzer.getTechniqueUsage();
    console.error('✅ Technique Usage:');
    for (const u of usage) {
      console.error(
        `- ${u.technique}: ${u.sessionsUsed} session(s), completion ${(u.completionRate * 100).toFixed(0)}%, ` +
          `avg output completeness ${u.averageEffectiveness.toFixed(2)}`
      );
    }

    // Session analytics: an ARRAY, one entry per session. This used to read
    // .totalSessions and friends off the array and print undefined and NaN.
    const sessions = await analyzer.getSessionAnalytics();
    const completed = sessions.filter(s => !s.abandoned).length;
    const averageDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
        : 0;
    const totalInsights = sessions.reduce((sum, s) => sum + (s.insightsGenerated || 0), 0);
    const totalRisks = sessions.reduce((sum, s) => sum + (s.risksIdentified || 0), 0);
    console.error('\n📈 Session Analytics:');
    console.error(`- Total Sessions: ${sessions.length}`);
    console.error(`- Completed Sessions: ${completed}`);
    console.error(`- Average Duration: ${(averageDuration / 1000 / 60).toFixed(2)} minutes`);
    console.error(`- Total Insights: ${totalInsights}`);
    console.error(`- Total Risks Identified: ${totalRisks}`);

    // Export raw data
    const exportPath = process.argv[2] || './telemetry-export.json';
    const exportData = {
      exportDate: new Date().toISOString(),
      usage,
      sessions,
      rawEvents: await analyzer.getAnalytics({
        timeRange: 'all_time',
        limit: 10000,
      }),
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf8');

    console.error(`\n💾 Data exported to: ${path.resolve(exportPath)}`);
    console.error('\n📊 You can now:');
    console.error('1. Import into Excel/Google Sheets for charts');
    console.error('2. Use with Python/Jupyter for analysis');
    console.error('3. Upload to visualization tools like Tableau');
  } catch (error) {
    console.error('❌ Error exporting telemetry:', error.message);
  }
}

// Run export
exportTelemetry().catch(console.error);
