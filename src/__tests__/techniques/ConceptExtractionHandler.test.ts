/**
 * ConceptExtractionHandler insight-extraction tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConceptExtractionHandler } from '../../techniques/ConceptExtractionHandler.js';

describe('ConceptExtractionHandler', () => {
  let handler: ConceptExtractionHandler;

  beforeEach(() => {
    handler = new ConceptExtractionHandler();
  });

  describe('extractInsights', () => {
    it('should report every concept, pattern and application, not just the first', () => {
      const history = [
        { currentStep: 1, successExample: 'Airline overbooking' },
        {
          currentStep: 2,
          extractedConcepts: ['Price the no-show risk', 'Sell the same seat twice'],
        },
        {
          currentStep: 3,
          abstractedPatterns: ['Sell perishable capacity ahead', 'Compensate the displaced'],
        },
        {
          currentStep: 4,
          applications: ['Overbook the support rota', 'Pay for the swapped shift'],
        },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Success example analyzed: Airline overbooking',
        'Key concept: Price the no-show risk',
        'Key concept: Sell the same seat twice',
        'Pattern identified: Sell perishable capacity ahead',
        'Pattern identified: Compensate the displaced',
        'Application: Overbook the support rota',
        'Application: Pay for the swapped shift',
      ]);
    });

    it("should report each step's output, which was read by no step before", () => {
      const history = [
        { currentStep: 1, output: 'Overbooking works because no-shows are predictable.' },
        { currentStep: 4, output: 'The rota can carry the same bet.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Identify Success: Overbooking works because no-shows are predictable.',
        'Apply to Problem: The rota can carry the same bet.',
      ]);
    });

    it('should report nothing for a step that recorded nothing', () => {
      expect(handler.extractInsights([])).toEqual([]);
      expect(handler.extractInsights([{ currentStep: 2, output: '   ' }])).toEqual([]);
    });

    it('should key on currentStep so a revision supersedes what it revises', () => {
      const history = [
        { currentStep: 1, output: 'The first example considered.' },
        { currentStep: 2, output: 'The concepts as first extracted.' },
        { currentStep: 1, output: 'The corrected example considered.' },
      ];

      const insights = handler.extractInsights(history);
      expect(insights).toEqual([
        'Identify Success: The corrected example considered.',
        'Extract Concepts: The concepts as first extracted.',
      ]);
    });
  });
});
