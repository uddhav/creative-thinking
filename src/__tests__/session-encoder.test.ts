/**
 * Tests for SessionEncoder - base64 session encoding/decoding
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionEncoder, type EncodedSessionData } from '../core/session/SessionEncoder.js';

describe('SessionEncoder', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('encode/decode', () => {
    it('should encode session data to base64', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      const encoded = SessionEncoder.encode(sessionData);

      expect(encoded).toBeTypeOf('string');
      expect(encoded.length).toBeGreaterThan(0);
      // Should be valid base64
      expect(() => Buffer.from(encoded, 'base64')).not.toThrow();
    });

    it('should decode base64 back to session data', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 7,
        timestamp: Date.now(),
        techniques: ['six_hats', 'scamper'] as any,
        objectives: ['improve', 'innovate'],
        constraints: ['time', 'budget'],
      };

      const encoded = SessionEncoder.encode(sessionData);
      const decoded = SessionEncoder.decode(encoded);

      expect(decoded).toEqual(sessionData);
    });

    it('should return null for invalid base64', () => {
      const decoded = SessionEncoder.decode('not-base64!@#$');
      expect(decoded).toBeNull();
    });

    it('should return null for base64 that is not valid JSON', () => {
      const invalidJson = Buffer.from('not json', 'utf-8').toString('base64');
      const decoded = SessionEncoder.decode(invalidJson);
      expect(decoded).toBeNull();
    });
  });

  describe('validation', () => {
    it('should validate non-expired sessions as valid', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      const encoded = SessionEncoder.encode(sessionData);
      expect(SessionEncoder.isValid(encoded)).toBe(true);
    });

    it('should validate expired sessions as invalid', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 3,
        totalSteps: 7,
        timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      const encoded = SessionEncoder.encode(sessionData);
      expect(SessionEncoder.isValid(encoded)).toBe(false);
    });

    it('should validate sessions with invalid step numbers as invalid', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 8,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      const encoded = SessionEncoder.encode(sessionData);
      expect(SessionEncoder.isValid(encoded)).toBe(false);
    });
  });

  describe('isEncodedSession', () => {
    it('should identify regular planIds', () => {
      expect(SessionEncoder.isEncodedSession('plan_12345')).toBe(false);
      expect(SessionEncoder.isEncodedSession('plan_abcdef')).toBe(false);
    });

    it('should identify base64 encoded sessions', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      const encoded = SessionEncoder.encode(sessionData);
      expect(SessionEncoder.isEncodedSession(encoded)).toBe(true);
    });
  });

  describe('extractPlanId', () => {
    it('should extract planId from encoded session', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'Test problem',
        technique: 'six_hats',
        currentStep: 1,
        totalSteps: 7,
        timestamp: Date.now(),
      };

      const encoded = SessionEncoder.encode(sessionData);
      expect(SessionEncoder.extractPlanId(encoded)).toBe('plan_12345');
    });

    it('should return regular planId as-is', () => {
      expect(SessionEncoder.extractPlanId('plan_67890')).toBe('plan_67890');
    });
  });

  describe('createEncodedSession', () => {
    it('should create encoded session with all parameters', () => {
      const encoded = SessionEncoder.createEncodedSession(
        'plan_12345',
        'Test problem',
        'scamper',
        2,
        8,
        {
          techniques: ['scamper', 'six_hats'] as any,
          objectives: ['innovate'],
          constraints: ['budget'],
        }
      );

      expect(encoded).toBeTypeOf('string');

      const decoded = SessionEncoder.decode(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded?.planId).toBe('plan_12345');
      expect(decoded?.problem).toBe('Test problem');
      expect(decoded?.technique).toBe('scamper');
      expect(decoded?.currentStep).toBe(2);
      expect(decoded?.totalSteps).toBe(8);
      expect(decoded?.techniques).toEqual(['scamper', 'six_hats']);
      expect(decoded?.objectives).toEqual(['innovate']);
      expect(decoded?.constraints).toEqual(['budget']);
    });
  });

  describe('mergeWithPlan', () => {
    it('should merge decoded session with existing plan data', () => {
      const sessionData: EncodedSessionData = {
        planId: 'plan_12345',
        problem: 'New problem',
        technique: 'six_hats',
        currentStep: 4,
        totalSteps: 7,
        timestamp: Date.now(),
        objectives: ['new objective'],
      };

      const encoded = SessionEncoder.encode(sessionData);
      const existingPlan = {
        planId: 'old_plan',
        problem: 'Old problem',
        techniques: ['scamper'],
        workflow: [],
        constraints: ['existing constraint'],
      };

      const merged = SessionEncoder.mergeWithPlan(encoded, existingPlan);

      expect(merged.planId).toBe('plan_12345');
      expect(merged.problem).toBe('New problem');
      expect(merged.currentStep).toBe(4);
      expect(merged.totalSteps).toBe(7);
      expect(merged.objectives).toEqual(['new objective']);
      expect(merged.constraints).toEqual(['existing constraint']); // Keeps existing if not in encoded
    });

    it('should return original plan if decoding fails', () => {
      const existingPlan = {
        planId: 'plan_12345',
        problem: 'Original problem',
      };

      const merged = SessionEncoder.mergeWithPlan('invalid-base64', existingPlan);
      expect(merged).toEqual(existingPlan);
    });
  });
});
