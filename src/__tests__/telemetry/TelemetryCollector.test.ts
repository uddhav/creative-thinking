/**
 * Tests for TelemetryCollector
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TelemetryCollector } from '../../telemetry/TelemetryCollector.js';
import { PrivacyManager } from '../../telemetry/privacy.js';
import type { TelemetryConfig } from '../../telemetry/types.js';

describe('TelemetryCollector', () => {
  let collector: TelemetryCollector;
  let config: TelemetryConfig;

  beforeEach(() => {
    // Reset environment
    delete process.env.TELEMETRY_ENABLED;

    config = {
      enabled: true,
      level: 'full',
      storage: 'memory',
      privacyMode: 'minimal',
      batchSize: 5,
      flushInterval: 1000,
    };

    collector = new TelemetryCollector(config);
  });

  afterEach(async () => {
    await collector.shutdown();
  });

  describe('Event Tracking', () => {
    it('should track technique start events', async () => {
      await collector.trackTechniqueStart('session1', 'six_hats', {
        problemLength: 100,
      });

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(1);
    });

    it('should track technique step events', async () => {
      await collector.trackTechniqueStep('session1', 'scamper', 3, 8, {
        techniqueStep: 3,
        techniqueTotalSteps: 8,
        flexibilityScore: 0.7,
      });

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(1);
    });

    it('should track insights', async () => {
      await collector.trackInsight('session1', 'po', 3);

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(1);
    });

    it('should track risks', async () => {
      await collector.trackRisk('session1', 'triz', 2);

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(1);
    });

    it('should track flexibility warnings', async () => {
      await collector.trackFlexibilityWarning('session1', 0.25, 'high');

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(1);
    });

    it('should track session completion', async () => {
      await collector.trackSessionStart('session1', 150);
      await collector.trackSessionComplete('session1', {
        insightCount: 5,
        riskCount: 2,
        effectiveness: 0.8,
      });

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(2);
    });
  });

  describe('Level Filtering', () => {
    it('should filter events based on basic level', async () => {
      const basicCollector = new TelemetryCollector({
        ...config,
        level: 'basic',
      });

      await basicCollector.trackTechniqueStart('session1', 'six_hats');
      await basicCollector.trackInsight('session1', 'six_hats', 1); // Should be filtered
      await basicCollector.trackTechniqueComplete('session1', 'six_hats', 0.8);

      const status = basicCollector.getStatus();
      expect(status.bufferedEvents).toBe(2); // Only start and complete

      await basicCollector.shutdown();
    });

    it('should filter events based on detailed level', async () => {
      const detailedCollector = new TelemetryCollector({
        ...config,
        level: 'detailed',
      });

      await detailedCollector.trackTechniqueStart('session1', 'po');
      await detailedCollector.trackInsight('session1', 'po', 2);
      await detailedCollector.trackFlexibilityWarning('session1', 0.3, 'medium');
      await detailedCollector.trackTechniqueStep('session1', 'po', 2, 4); // Should be filtered

      const status = detailedCollector.getStatus();
      expect(status.bufferedEvents).toBe(3); // All except step

      await detailedCollector.shutdown();
    });
  });

  describe('Batching and Flushing', () => {
    it('should auto-flush when batch size is reached', async () => {
      // Track events up to batch size
      for (let i = 0; i < 5; i++) {
        await collector.trackInsight('session1', 'random_entry', 1);
      }

      // Should auto-flush
      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(0);
    });

    it('should manually flush events', async () => {
      await collector.trackTechniqueStart('session1', 'scamper');
      await collector.trackTechniqueStep('session1', 'scamper', 1, 8);

      expect(collector.getStatus().bufferedEvents).toBe(2);

      await collector.flush();

      expect(collector.getStatus().bufferedEvents).toBe(0);
    });
  });

  describe('Privacy', () => {
    it('should respect disabled telemetry', async () => {
      const disabledCollector = new TelemetryCollector({
        ...config,
        enabled: false,
      });

      await disabledCollector.trackTechniqueStart('session1', 'six_hats');
      await disabledCollector.trackInsight('session1', 'six_hats', 5);

      const status = disabledCollector.getStatus();
      expect(status.bufferedEvents).toBe(0);
      expect(status.enabled).toBe(false);

      await disabledCollector.shutdown();
    });

    it('should get config from environment', () => {
      process.env.TELEMETRY_ENABLED = 'true';
      process.env.TELEMETRY_LEVEL = 'detailed';
      process.env.TELEMETRY_STORAGE = 'filesystem';
      process.env.TELEMETRY_PRIVACY_MODE = 'strict';

      const envConfig = PrivacyManager.getConfigFromEnvironment();

      expect(envConfig.enabled).toBe(true);
      expect(envConfig.level).toBe('detailed');
      expect(envConfig.storage).toBe('filesystem');
      expect(envConfig.privacyMode).toBe('strict');
    });
  });

  describe('Session Tracking', () => {
    it('should track session duration', async () => {
      await collector.trackSessionStart('session1', 200);

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));

      await collector.trackSessionComplete('session1', {
        insightCount: 3,
        effectiveness: 0.7,
      });

      await collector.flush();

      // Duration should be tracked
      const status = collector.getStatus();
      expect(status.totalSessions).toBe(1);
    });

    it('should handle workflow transitions', async () => {
      await collector.trackWorkflowTransition('session1', 'six_hats', 'scamper');

      const status = collector.getStatus();
      expect(status.bufferedEvents).toBe(1);
    });
  });

  describe('Export and Clear', () => {
    it('should export telemetry data', async () => {
      await collector.trackTechniqueStart('session1', 'disney_method');
      await collector.trackTechniqueComplete('session1', 'disney_method', 0.9);

      const exported = await collector.exportTelemetry('anonymized');

      expect(exported).toHaveProperty('version');
      expect(exported).toHaveProperty('exportDate');
      expect(exported).toHaveProperty('privacyLevel', 'anonymized');
    });

    it('should clear all telemetry data', async () => {
      await collector.trackInsight('session1', 'nine_windows', 2);
      await collector.trackRisk('session1', 'nine_windows', 1);

      expect(collector.getStatus().bufferedEvents).toBe(2);

      await collector.clearTelemetry();

      expect(collector.getStatus().bufferedEvents).toBe(0);
      expect(collector.getStatus().totalSessions).toBe(0);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TelemetryCollector.getInstance();
      const instance2 = TelemetryCollector.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('Metadata Filtering', () => {
    it('should filter metadata based on level', async () => {
      const basicCollector = new TelemetryCollector({
        ...config,
        level: 'basic',
      });

      // Use trackTechniqueComplete which is allowed in basic level
      await basicCollector.trackTechniqueComplete('session1', 'po', 0.6, {
        step: 4,
        totalSteps: 4,
        effectiveness: 0.6,
        insightCount: 3, // Should be filtered in basic level
        flexibilityScore: 0.5, // Should be filtered in basic level
      });

      // In basic level, the event should be tracked but with filtered metadata
      const status = basicCollector.getStatus();
      expect(status.bufferedEvents).toBe(1);

      await basicCollector.shutdown();
    });
  });
});
