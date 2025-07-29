/**
 * Integration tests for session persistence
 * Tests saving, loading, and managing sessions across server instances
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import { FileSystemAdapter } from '../../persistence/FileSystemAdapter.js';
import type { ExecuteThinkingStepInput } from '../../index.js';
import fs from 'fs';
import path from 'path';

describe('Session Persistence Integration', () => {
  let server: LateralThinkingServer;
  let fileAdapter: FileSystemAdapter;
  const testBasePath = './test-sessions-integration';

  beforeEach(() => {
    // Clean up any existing test sessions
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }

    fileAdapter = new FileSystemAdapter({ basePath: testBasePath });
    server = new LateralThinkingServer({ persistenceAdapter: fileAdapter });
  });

  afterEach(() => {
    // Clean up test sessions
    if (fs.existsSync(testBasePath)) {
      fs.rmSync(testBasePath, { recursive: true, force: true });
    }
  });

  describe('Basic Save and Load', () => {
    it('should save and load sessions correctly', async () => {
      const problem = 'Test persistence problem';

      // Create a session with some progress
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['random_entry'],
      });
      const plan = JSON.parse(planResult.content[0].text);

      // Execute steps
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem,
        currentStep: 1,
        totalSteps: 3,
        randomStimulus: 'Butterfly',
        output: 'Using butterfly as random stimulus',
        nextStepNeeded: true,
      });
      const sessionId = JSON.parse(step1.content[0].text).sessionId;

      const step2 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem,
        currentStep: 2,
        totalSteps: 3,
        connections: ['Transformation', 'Delicate balance', 'Emergence'],
        output: 'Connected butterfly properties to problem',
        nextStepNeeded: true,
        sessionId,
      });

      // Save session with metadata
      await server.saveSession(sessionId, {
        name: 'Test Random Entry Session',
        tags: ['test', 'integration', 'persistence'],
      });

      // Verify file was created
      const sessionFiles = fs.readdirSync(testBasePath);
      expect(sessionFiles.length).toBeGreaterThan(0);

      // Create new server instance
      const newServer = new LateralThinkingServer({
        persistenceAdapter: new FileSystemAdapter({ basePath: testBasePath }),
      });

      // List saved sessions
      const sessions = await newServer.listSessions();
      expect(sessions.length).toBe(1);
      expect(sessions[0].name).toBe('Test Random Entry Session');
      expect(sessions[0].tags).toContain('integration');

      // Load the session
      const loadedSession = await newServer.loadSession(sessionId);
      expect(loadedSession).toBeDefined();
      expect(loadedSession.technique).toBe('random_entry');
      expect(loadedSession.problem).toBe(problem);
      expect(loadedSession.history).toHaveLength(2);
      expect(loadedSession.history[0].randomStimulus).toBe('Butterfly');

      // Continue session in new server
      const step3 = await newServer.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem,
        currentStep: 3,
        totalSteps: 3,
        output: 'Apply transformation concept to solve problem',
        nextStepNeeded: false,
        sessionId,
      });

      const finalData = JSON.parse(step3.content[0].text);
      expect(finalData.nextStepNeeded).toBe(false);
      expect(finalData.insights).toBeDefined();
    });

    it('should handle complex session state', async () => {
      // Create session with multiple techniques and complex state
      const problem = 'Complex state test';

      // Six hats with revision
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['six_hats'],
      });
      const plan = JSON.parse(planResult.content[0].text);

      // Execute and revise
      let result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Original blue hat thinking',
        nextStepNeeded: true,
      });
      const sessionId = JSON.parse(result.content[0].text).sessionId;

      // Add some risk analysis
      result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 2,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Facts and data',
        risks: ['Data accuracy concerns', 'Sample size limitations'],
        failureModes: ['Incorrect assumptions'],
        nextStepNeeded: true,
        sessionId,
      });

      // Save with complex state
      await server.saveSession(sessionId, {
        name: 'Complex Session',
        description: 'Session with risks and complex fields',
      });

      // Load in new server
      const newServer = new LateralThinkingServer({
        persistenceAdapter: new FileSystemAdapter({ basePath: testBasePath }),
      });

      const loaded = await newServer.loadSession(sessionId);
      expect(loaded.history[1].risks).toContain('Data accuracy concerns');
      expect(loaded.history[1].failureModes).toContain('Incorrect assumptions');
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save after each step when enabled', async () => {
      // Enable auto-save
      server = new LateralThinkingServer({
        persistenceAdapter: fileAdapter,
        autoSave: true,
      });

      const problem = 'Auto-save test';
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['po'],
      });
      const plan = JSON.parse(planResult.content[0].text);

      // Execute step
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'po',
        problem,
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: All work happens in reverse',
        output: 'Exploring reverse work concept',
        nextStepNeeded: true,
      });
      const sessionId = JSON.parse(step1.content[0].text).sessionId;

      // Check if auto-saved (file should exist)
      const files = fs.readdirSync(testBasePath);
      const sessionFile = files.find(f => f.includes(sessionId));
      expect(sessionFile).toBeDefined();

      // Load without explicit save
      const newServer = new LateralThinkingServer({
        persistenceAdapter: new FileSystemAdapter({ basePath: testBasePath }),
      });

      const loaded = await newServer.loadSession(sessionId);
      expect(loaded).toBeDefined();
      expect(loaded.history).toHaveLength(1);
      expect(loaded.history[0].provocation).toBe('Po: All work happens in reverse');
    });
  });

  describe('Export Functionality', () => {
    it('should export sessions in different formats', async () => {
      // Create a complete session
      const problem = 'Export test problem';
      const planResult = await server.planThinkingSession({
        problem,
        techniques: ['scamper'],
        timeframe: 'quick',
      });
      const plan = JSON.parse(planResult.content[0].text);

      // Execute a few steps
      let sessionId: string | undefined;
      const actions = ['substitute', 'combine', 'adapt'];

      for (let i = 0; i < 3; i++) {
        const result = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'scamper',
          problem,
          currentStep: i + 1,
          totalSteps: 7,
          scamperAction: actions[i] as any,
          output: `Applied ${actions[i]} to the problem`,
          nextStepNeeded: true,
          sessionId,
        });

        if (i === 0) {
          sessionId = JSON.parse(result.content[0].text).sessionId;
        }
      }

      // Export as JSON
      const jsonExport = await server.exportSession(sessionId!, 'json');
      expect(jsonExport).toBeDefined();
      const jsonData = JSON.parse(jsonExport);
      expect(jsonData.metadata.technique).toBe('scamper');
      expect(jsonData.steps).toHaveLength(3);

      // Export as Markdown
      const markdownExport = await server.exportSession(sessionId!, 'markdown');
      expect(markdownExport).toContain('# SCAMPER Session');
      expect(markdownExport).toContain('## Step 1: SUBSTITUTE');
      expect(markdownExport).toContain('Applied substitute');

      // Export as CSV
      const csvExport = await server.exportSession(sessionId!, 'csv');
      expect(csvExport).toContain('Step,Action,Output');
      expect(csvExport).toContain('1,substitute,');
    });
  });

  describe('Session Search and Filtering', () => {
    it('should search sessions by tags and metadata', async () => {
      // Create multiple sessions
      const sessions = [];

      for (let i = 0; i < 3; i++) {
        const planResult = await server.planThinkingSession({
          problem: `Problem ${i}`,
          techniques: [i === 0 ? 'six_hats' : i === 1 ? 'scamper' : 'po'],
        });
        const plan = JSON.parse(planResult.content[0].text);

        const stepResult = await server.executeThinkingStep({
          planId: plan.planId,
          technique: plan.workflow[0].technique,
          problem: `Problem ${i}`,
          currentStep: 1,
          totalSteps: plan.workflow[0].totalSteps,
          output: `Output for problem ${i}`,
          nextStepNeeded: false,
          ...(i === 0 ? { hatColor: 'blue' } : {}),
          ...(i === 1 ? { scamperAction: 'substitute' } : {}),
          ...(i === 2 ? { provocation: 'Po: Test' } : {}),
        });

        const sessionId = JSON.parse(stepResult.content[0].text).sessionId;
        sessions.push(sessionId);

        // Save with different tags
        await server.saveSession(sessionId, {
          name: `Session ${i}`,
          tags:
            i === 0
              ? ['analysis', 'strategic']
              : i === 1
                ? ['design', 'creative']
                : ['innovative', 'strategic'],
        });
      }

      // Search by tag
      const strategicSessions = await server.listSessions({ tags: ['strategic'] });
      expect(strategicSessions).toHaveLength(2);
      expect(strategicSessions.map(s => s.name)).toContain('Session 0');
      expect(strategicSessions.map(s => s.name)).toContain('Session 2');

      // Search by technique
      const scamperSessions = await server.listSessions({ technique: 'scamper' });
      expect(scamperSessions).toHaveLength(1);
      expect(scamperSessions[0].name).toBe('Session 1');
    });
  });

  describe('Concurrent Session Handling', () => {
    it('should handle multiple concurrent sessions without conflicts', async () => {
      const promises = [];

      // Create 5 concurrent sessions
      for (let i = 0; i < 5; i++) {
        const promise = (async () => {
          const planResult = await server.planThinkingSession({
            problem: `Concurrent problem ${i}`,
            techniques: ['random_entry'],
          });
          const plan = JSON.parse(planResult.content[0].text);

          const stepResult = await server.executeThinkingStep({
            planId: plan.planId,
            technique: 'random_entry',
            problem: `Concurrent problem ${i}`,
            currentStep: 1,
            totalSteps: 3,
            randomStimulus: `Stimulus ${i}`,
            output: `Output ${i}`,
            nextStepNeeded: true,
          });

          const sessionId = JSON.parse(stepResult.content[0].text).sessionId;

          // Save session
          await server.saveSession(sessionId, {
            name: `Concurrent Session ${i}`,
          });

          return sessionId;
        })();

        promises.push(promise);
      }

      const sessionIds = await Promise.all(promises);

      // Verify all sessions were saved
      const allSessions = await server.listSessions();
      expect(allSessions).toHaveLength(5);

      // Verify each session is unique
      const uniqueIds = new Set(sessionIds);
      expect(uniqueIds.size).toBe(5);

      // Load each session and verify content
      for (let i = 0; i < 5; i++) {
        const loaded = await server.loadSession(sessionIds[i]);
        expect(loaded.problem).toBe(`Concurrent problem ${i}`);
        expect(loaded.history[0].randomStimulus).toBe(`Stimulus ${i}`);
      }
    });
  });
});
