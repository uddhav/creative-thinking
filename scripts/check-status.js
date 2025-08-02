#!/usr/bin/env node
/* eslint-env node */

/**
 * check-status.js - Checks the status of the last build/test/lint run
 * Provides minimal output unless there are errors
 */

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = '.build-output';
const STATUS_FILE = path.join(OUTPUT_DIR, 'last-run-status.json');

// Check if status file exists
if (!fs.existsSync(STATUS_FILE)) {
  process.stderr.write('No build status found. Run a build command first.\n');
  process.exit(0);
}

// Read status
const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));

// Format timestamp
const runTime = new Date(status.timestamp).toLocaleString();

// Print status
if (status.hasErrors) {
  process.stderr.write(`❌ ${status.command} failed\n`);
  process.stderr.write(`   Exit code: ${status.exitCode}\n`);
  process.stderr.write(`   Time: ${runTime}\n`);
  process.stderr.write('\n');

  // For lint failures, check if there are warnings or errors
  if (status.command === 'lint' && status.errorLineCount > 0) {
    // Read first few lines of error file to show summary
    const errorContent = fs.readFileSync(status.errorFile, 'utf-8');
    const lines = errorContent.split('\n').filter(line => line.trim());

    // Count warnings and errors
    let warningCount = 0;
    let errorCount = 0;

    lines.forEach(line => {
      if (line.includes('warning')) warningCount++;
      if (line.includes('error')) errorCount++;
    });

    if (warningCount > 0 || errorCount > 0) {
      process.stderr.write(`   Found: ${errorCount} errors, ${warningCount} warnings\n`);
    }
  }

  process.stderr.write(`\n📋 To see full output:\n`);
  process.stderr.write(`   cat ${status.logFile}\n`);
  process.stderr.write(`\n📋 To see errors:\n`);
  process.stderr.write(`   cat ${status.errorFile}\n`);

  process.exit(1);
} else {
  process.stderr.write(`✅ ${status.command} passed\n`);
  process.stderr.write(`   Time: ${runTime}\n`);

  // For successful runs, just show that logs are available if needed
  if (process.argv.includes('--verbose')) {
    process.stderr.write(`\n📋 Logs available at:\n`);
    process.stderr.write(`   ${status.logFile}\n`);
  }

  process.exit(0);
}
