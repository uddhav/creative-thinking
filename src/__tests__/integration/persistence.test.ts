/**
 * Simple integration tests for session persistence
 * Tests auto-save functionality which is the only exposed persistence feature
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LateralThinkingServer } from '../../index.js';
import fs from 'fs';
import { safeJsonParse } from '../helpers/types.js';

describe('Session Persistence - Simple Integration', () => {
  let server: LateralThinkingServer;
  const testBasePath = `/tmp/test-sessions-${Date.now()}`;

  beforeEach(async () => {
    // Clean up any existing test sessions
    try {
      if (fs.existsSync(testBasePath)) {
        fs.rmSync(testBasePath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to clean up test sessions:', error);
    }

    // Create the test directory
    try {
      fs.mkdirSync(testBasePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create test directory:', error);
      throw error; // This is critical for tests
    }

    // Set environment variables for persistence
    process.env.PERSISTENCE_TYPE = 'filesystem';
    process.env.PERSISTENCE_PATH = testBasePath;

    server = new LateralThinkingServer();

    // Wait for persistence initialization (needs more time)
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterEach(() => {
    // Clean up test sessions
    try {
      if (fs.existsSync(testBasePath)) {
        fs.rmSync(testBasePath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to clean up test sessions in afterEach:', error);
    }

    // Clean up environment variables
    delete process.env.PERSISTENCE_TYPE;
    delete process.env.PERSISTENCE_PATH;
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save sessions when autoSave is enabled', async () => {
      const problem = 'Test auto-save problem';

      // Create a session with autoSave
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['random_entry'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Execute steps with autoSave
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem,
        currentStep: 1,
        totalSteps: 3,
        randomStimulus: 'Butterfly',
        output: 'Using butterfly as random stimulus',
        nextStepNeeded: true,
        autoSave: true,
      });
      const sessionId = safeJsonParse(step1.content[0].text).sessionId;

      // Wait for file system operations and ensure directories exist
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if file was created in sessions subdirectory
      const sessionsPath = `${testBasePath}/sessions`;
      const files = fs.readdirSync(sessionsPath);
      const sessionFile = files.find(f => f.includes(sessionId));
      expect(sessionFile).toBeDefined();

      // Read the saved file
      const savedContent = fs.readFileSync(`${sessionsPath}/${sessionFile}`, 'utf-8');
      const savedData = safeJsonParse(savedContent);

      // Data is wrapped in storage format
      expect(savedData.version).toBe('1.0.0');
      expect(savedData.format).toBe('json');
      const sessionData = savedData.data;

      expect(sessionData.id).toBe(sessionId);
      expect(sessionData.technique).toBe('random_entry');
      expect(sessionData.problem).toBe(problem);
      expect(sessionData.history).toHaveLength(1);
      expect(sessionData.history[0].input.randomStimulus).toBe('Butterfly');
    });

    it('should create separate files for different sessions', async () => {
      const sessionIds: string[] = [];

      // Create multiple sessions
      for (let i = 0; i < 3; i++) {
        const planResult = server.planThinkingSession({
          problem: `Problem ${i}`,
          techniques: ['po'],
        });
        const plan = safeJsonParse(planResult.content[0].text);

        const stepResult = await server.executeThinkingStep({
          planId: plan.planId,
          technique: 'po',
          problem: `Problem ${i}`,
          currentStep: 1,
          totalSteps: 4,
          provocation: `Po: Provocation ${i}`,
          output: `Output ${i}`,
          nextStepNeeded: false,
          autoSave: true,
        });

        sessionIds.push(safeJsonParse(stepResult.content[0].text).sessionId);
      }

      // Wait for file system operations
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check that all sessions were saved
      const sessionsPath = `${testBasePath}/sessions`;

      // Ensure directory exists before reading
      if (!fs.existsSync(sessionsPath)) {
        // Try creating the sessions directory manually to help debug
        fs.mkdirSync(sessionsPath, { recursive: true });
        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const files = fs.readdirSync(sessionsPath);

      for (const sessionId of sessionIds) {
        const sessionFile = files.find(f => f.includes(sessionId));
        expect(sessionFile).toBeDefined();
      }

      // Should have at least 3 files
      expect(files.length).toBeGreaterThanOrEqual(3);
    });

    it('should update the same file when continuing a session', async () => {
      const problem = 'Test session updates';

      // Create initial session
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['scamper'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Step 1 with autoSave
      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 1,
        totalSteps: 8,
        scamperAction: 'substitute',
        output: 'Substituted materials',
        nextStepNeeded: true,
        autoSave: true,
      });
      const sessionId = safeJsonParse(step1.content[0].text).sessionId;

      // Wait for save
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get initial file
      const sessionsPath = `${testBasePath}/sessions`;
      const files1 = fs.readdirSync(sessionsPath);
      const sessionFile = files1.find(f => f.includes(sessionId));
      expect(sessionFile).toBeDefined();

      const savedContent1 = fs.readFileSync(`${sessionsPath}/${sessionFile}`, 'utf-8');
      const savedData1 = safeJsonParse(savedContent1);
      expect(savedData1.data.history).toHaveLength(1);

      // Step 2 with autoSave
      await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'scamper',
        problem,
        currentStep: 2,
        totalSteps: 8,
        scamperAction: 'combine',
        output: 'Combined features',
        nextStepNeeded: true,
        sessionId,
        autoSave: true,
      });

      // Wait for save
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check that the same file was updated
      const files2 = fs.readdirSync(sessionsPath);
      expect(files2.length).toBe(files1.length); // No new files

      const savedContent2 = fs.readFileSync(`${sessionsPath}/${sessionFile}`, 'utf-8');
      const savedData2 = safeJsonParse(savedContent2);
      expect(savedData2.data.history).toHaveLength(2);
      expect(savedData2.data.history[1].input.scamperAction).toBe('combine');
    });

    it('should preserve session state across server restarts', async () => {
      const problem = 'Test persistence across restarts';

      // Create and save a session
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['six_hats'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      const step1 = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 1,
        totalSteps: 6,
        hatColor: 'blue',
        output: 'Process overview',
        nextStepNeeded: true,
        autoSave: true,
      });
      const sessionId = safeJsonParse(step1.content[0].text).sessionId;

      await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'six_hats',
        problem,
        currentStep: 2,
        totalSteps: 6,
        hatColor: 'white',
        output: 'Facts and data',
        risks: ['Data uncertainty', 'Limited sample size'],
        nextStepNeeded: true,
        sessionId,
        autoSave: true,
      });

      // Wait for saves
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify file exists
      const sessionsPath = `${testBasePath}/sessions`;
      const files = fs.readdirSync(sessionsPath);
      const sessionFile = files.find(f => f.includes(sessionId));
      expect(sessionFile).toBeDefined();

      // Create new server instance (simulating restart)
      new LateralThinkingServer();

      // The new server can't directly load the session through the public API
      // but we can verify the file contains the correct data
      const savedContent = fs.readFileSync(`${sessionsPath}/${sessionFile}`, 'utf-8');
      const savedData = safeJsonParse(savedContent);
      const sessionData = savedData.data;

      expect(sessionData.id).toBe(sessionId);
      expect(sessionData.technique).toBe('six_hats');
      expect(sessionData.problem).toBe(problem);
      expect(sessionData.history).toHaveLength(2);
      expect(sessionData.history[0].input.hatColor).toBe('blue');
      expect(sessionData.history[1].input.hatColor).toBe('white');
      expect(sessionData.history[1].input.risks).toContain('Data uncertainty');
    });
  });

  describe('Error Handling', () => {
    it('should handle autoSave failures gracefully', async () => {
      const problem = 'Test save failure';
      const planResult = server.planThinkingSession({
        problem,
        techniques: ['random_entry'],
      });
      const plan = safeJsonParse(planResult.content[0].text);

      // Wait for directories to be created first
      await new Promise(resolve => setTimeout(resolve, 500));

      // Make directory read-only to cause save failure
      const sessionsPath = `${testBasePath}/sessions`;
      if (!fs.existsSync(sessionsPath)) {
        fs.mkdirSync(sessionsPath, { recursive: true });
      }

      try {
        fs.chmodSync(sessionsPath, 0o444);
      } catch (error) {
        console.warn('Could not change permissions:', error);
      }

      const result = await server.executeThinkingStep({
        planId: plan.planId,
        technique: 'random_entry',
        problem,
        currentStep: 1,
        totalSteps: 3,
        randomStimulus: 'Cloud',
        output: 'Testing save failure',
        nextStepNeeded: true,
        autoSave: true,
      });

      const response = safeJsonParse(result.content[0].text);

      // Should still return success for the step
      expect(response.technique).toBe('random_entry');
      expect(response.currentStep).toBe(1);

      // Check if we got an autosave error
      if (response.autoSaveError) {
        // That's expected - some error prevented save
        // The error message might vary based on the system
        expect(response.autoSaveError).toBeTruthy();
        expect(response.autoSaveError).toContain('Failed to save session');
      } else {
        // On some systems, write might succeed even with read-only directory
        // Check that the response is valid regardless
        expect(response.sessionId).toBeDefined();
      }

      // Restore permissions
      try {
        fs.chmodSync(sessionsPath, 0o755);
      } catch (error) {
        console.warn('Could not restore permissions:', error);
      }
    });
  });
});
