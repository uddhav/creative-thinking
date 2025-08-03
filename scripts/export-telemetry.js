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
    // Get technique effectiveness
    const effectiveness = await analyzer.getTechniqueEffectiveness();
    console.error('✅ Technique Effectiveness:');
    console.error(effectiveness);

    // Get session analytics
    const sessions = await analyzer.getSessionAnalytics();
    console.error('\n📈 Session Analytics:');
    console.error(`- Total Sessions: ${sessions.totalSessions}`);
    console.error(`- Completed Sessions: ${sessions.completedSessions}`);
    console.error(
      `- Average Duration: ${(sessions.averageDuration / 1000 / 60).toFixed(2)} minutes`
    );
    console.error(`- Total Insights: ${sessions.totalInsights}`);
    console.error(`- Total Risks Identified: ${sessions.totalRisks}`);

    // Export raw data
    const exportPath = process.argv[2] || './telemetry-export.json';
    const exportData = {
      exportDate: new Date().toISOString(),
      effectiveness,
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
