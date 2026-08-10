/**
 * SCAMPER reports what each modification was.
 *
 * It was the one handler with no `extractInsights` of its own, so it fell
 * through to `BaseTechniqueHandler`: outputs under fifty characters dropped
 * entirely, the rest split on the first `[.!?]` so an abbreviation truncated
 * the finding, no step label, and a revised step reported twice because the
 * base default walks the history in call order.
 *
 * Its `pathImpact` — what the modification costs in future freedom, which is
 * the reason this technique carries path analysis at all — reached no insight
 * from anywhere.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScamperHandler } from '../../techniques/ScamperHandler.js';

describe('ScamperHandler.extractInsights', () => {
  let handler: ScamperHandler;

  beforeEach(() => {
    handler = new ScamperHandler();
  });

  it('reports a short finding the base default would have dropped', () => {
    // Twenty characters. The base class required fifty.
    const insights = handler.extractInsights([{ currentStep: 1, output: 'Bamboo, not ceramic.' }]);

    expect(insights).toEqual(['Substitute: Bamboo, not ceramic.']);
  });

  it('does not cut a finding short at an abbreviation', () => {
    const insights = handler.extractInsights([
      { currentStep: 4, output: 'Cut it by approx. 40% and keep the lid. Second sentence.' },
    ]);

    expect(insights[0]).toBe('Modify: Cut it by approx. 40% and keep the lid.');
  });

  it('labels each step with its own action, derived from the step', () => {
    // scamperAction is optional, and validateStep accepts it only when it
    // matches the step's position, so the step already determines the action.
    const insights = handler.extractInsights([
      { currentStep: 1, output: 'One.' },
      { currentStep: 2, output: 'Two.' },
      { currentStep: 6, output: 'Six.' },
      { currentStep: 8, output: 'Eight.' },
    ]);

    expect(insights).toEqual([
      'Substitute: One.',
      'Combine: Two.',
      'Eliminate: Six.',
      'Parameterize: Eight.',
    ]);
  });

  it('lets a revision supersede the step it revises', () => {
    const insights = handler.extractInsights([
      { currentStep: 2, output: 'First combine idea.' },
      { currentStep: 2, output: 'Revised combine idea.' },
    ]);

    expect(insights).toEqual(['Combine: Revised combine idea.']);
  });

  it('reports what the modification costs in future freedom', () => {
    const insights = handler.extractInsights([
      {
        currentStep: 6,
        output: 'Drop the handle.',
        pathImpact: {
          reversible: false,
          dependenciesCreated: [],
          optionsClosed: ['Restoration of the handle'],
          optionsOpened: [],
          flexibilityRetention: 0.2,
          commitmentLevel: 'irreversible',
          recoveryPath: 'complete reconstruction',
        },
      },
    ]);

    const impact = insights.find(i => i.includes('path impact'));
    expect(impact, 'pathImpact reached no insight').toBeDefined();
    expect(impact).toContain('irreversible commitment');
    expect(impact).toContain('Restoration of the handle');
    expect(impact).toContain('complete reconstruction');
  });

  it('reports the modifications a step recorded', () => {
    const insights = handler.extractInsights([
      { currentStep: 3, output: 'Adapted it.', modifications: ['thinner wall', 'wider base'] },
    ]);

    expect(insights).toContain('Adapt modifications: thinner wall; wider base');
  });

  it('says nothing for a step that recorded nothing', () => {
    expect(handler.extractInsights([{ currentStep: 1, output: '   ' }])).toEqual([]);
  });
});
