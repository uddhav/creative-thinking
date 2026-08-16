/**
 * DesignThinkingHandler insight-extraction tests
 *
 * The type-level tests for design_thinking live in ../design-thinking.test.ts;
 * this file covers what the handler reports back from a session.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DesignThinkingHandler } from '../../techniques/DesignThinkingHandler.js';

describe('DesignThinkingHandler', () => {
  let handler: DesignThinkingHandler;

  beforeEach(() => {
    handler = new DesignThinkingHandler();
  });

  describe('extractInsights', () => {
    it('should report every stage of a session that never named a designStage', () => {
      // The whole extraction used to hang off entry.designStage, which nothing
      // requires, so a session that omitted it reported nothing from any stage.
      const history = [
        { currentStep: 1, output: 'Night-shift nurses cannot reach the terminal.' },
        { currentStep: 2, output: 'The real problem is reach, not login speed.' },
        { currentStep: 3, output: 'Six ideas, two of which need no hardware.' },
        { currentStep: 4, output: 'A cardboard mock of the wall mount.' },
        { currentStep: 5, output: 'Three of five nurses used it without instruction.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Empathize: Night-shift nurses cannot reach the terminal.',
        'Define: The real problem is reach, not login speed.',
        'Ideate: Six ideas, two of which need no hardware.',
        'Prototype: A cardboard mock of the wall mount.',
        'Test: Three of five nurses used it without instruction.',
      ]);
    });

    it('should report every element of each stage array, not just the first', () => {
      const history = [
        {
          currentStep: 1,
          designStage: 'empathize',
          empathyInsights: ['Nurses carry gloves', 'Charting happens standing up'],
        },
        {
          currentStep: 3,
          designStage: 'ideate',
          ideaList: ['Wall mount', 'Voice capture', 'Badge tap'],
          failureModesPredicted: ['Voice fails in a noisy ward', 'Badges get shared'],
        },
        {
          currentStep: 5,
          designStage: 'test',
          userFeedback: ['Loved the tap', 'Hated the beep'],
          failureInsights: ['Nobody used the voice path'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('User need: Nurses carry gloves');
      expect(insights).toContain('User need: Charting happens standing up');
      expect(insights).toContain('Idea: Wall mount');
      expect(insights).toContain('Idea: Voice capture');
      expect(insights).toContain('Idea: Badge tap');
      expect(insights).toContain('Risk identified: Voice fails in a noisy ward');
      expect(insights).toContain('Risk identified: Badges get shared');
      expect(insights).toContain('User feedback: Loved the tap');
      expect(insights).toContain('User feedback: Hated the beep');
      expect(insights).toContain('Failure insight: Nobody used the voice path');

      // The ideas replace the count that stood in for them.
      expect(insights).not.toContain('3 ideas generated');
    });

    it('should report the prototype description whole and the stress tests at all', () => {
      const longDescription =
        'A wall-mounted tablet in a wipe-clean sleeve, powered over Ethernet so there is no ' +
        'battery to change, with a badge reader glued to the underside of the bezel.';
      const history = [
        {
          currentStep: 4,
          designStage: 'prototype',
          prototypeDescription: longDescription,
          stressTestResults: ['Sleeve fogged after two wipes', 'Reader missed badges at an angle'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain(`Prototype: ${longDescription}`);
      expect(insights).toContain('Stress test: Sleeve fogged after two wipes');
      expect(insights).toContain('Stress test: Reader missed badges at an angle');

      // No silent truncation at 100 characters.
      expect(insights.some(i => i.endsWith('...'))).toBe(false);
    });

    it('should fall back to designStage when the caller sent no step number', () => {
      const history = [
        { designStage: 'define', problemStatement: 'How might we chart without hands?' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toContain('Problem defined: How might we chart without hands?');
    });

    it('should report nothing for a stage that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 2, output: '  ' }])).toEqual([]);
    });

    it('should key on currentStep so a revision supersedes what it revises', () => {
      const history = [
        { currentStep: 1, output: 'The first read of who is affected.' },
        { currentStep: 2, output: 'The problem as first framed.' },
        { currentStep: 1, output: 'The corrected read of who is affected.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Empathize: The corrected read of who is affected.',
        'Define: The problem as first framed.',
      ]);
    });
  });
});
