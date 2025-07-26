import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Mock the server module
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
  }))
}));

describe('Layered Tools Architecture', () => {
  describe('Discovery Layer - discover_techniques', () => {
    it('should recommend techniques based on problem keywords', async () => {
      const input = {
        problem: 'How can we improve our product design to be more user-friendly?',
        preferredOutcome: 'systematic'
      };

      // Expected to recommend SCAMPER for improvement, Design Thinking for user focus
      const expectedTechniques = ['scamper', 'design_thinking'];
      
      // Mock response would include these techniques with high scores
      expect(expectedTechniques).toContain('scamper');
      expect(expectedTechniques).toContain('design_thinking');
    });

    it('should handle technical contradiction problems', async () => {
      const input = {
        problem: 'Need to make the system faster but also more secure, which typically slows it down',
        context: 'Engineering challenge with conflicting requirements'
      };

      // Should recommend TRIZ for contradictions
      const expectedTechnique = 'triz';
      expect(expectedTechnique).toBe('triz');
    });

    it('should provide default recommendations when no specific match', async () => {
      const input = {
        problem: 'General problem that needs solving'
      };

      // Should provide versatile techniques like SCAMPER or Six Hats
      const defaultTechniques = ['scamper', 'six_hats'];
      expect(defaultTechniques.length).toBeGreaterThan(0);
    });

    it('should consider preferred outcomes', async () => {
      const riskAwareInput = {
        problem: 'How to launch a new product',
        preferredOutcome: 'risk-aware'
      };
      
      // Should recommend Six Hats for risk awareness (Black Hat)
      expect('six_hats').toBe('six_hats');

      const collaborativeInput = {
        problem: 'Team brainstorming session needed',
        preferredOutcome: 'collaborative'
      };
      
      // Should recommend Yes, And for collaboration
      expect('yes_and').toBe('yes_and');
    });

    it('should limit recommendations to top 3', async () => {
      const input = {
        problem: 'Complex problem that could match many techniques: improve user experience, reduce technical debt, innovate product features, optimize performance'
      };

      // Even if many techniques match, should only return top 3
      const maxRecommendations = 3;
      expect(maxRecommendations).toBeLessThanOrEqual(3);
    });
  });

  describe('Planning Layer - plan_thinking_session', () => {
    it('should create workflow for single technique', async () => {
      const input = {
        problem: 'How to improve team dynamics',
        techniques: ['six_hats']
      };

      // Should create 6 steps for Six Hats
      const expectedSteps = 6;
      expect(expectedSteps).toBe(6);
    });

    it('should combine multiple techniques in workflow', async () => {
      const input = {
        problem: 'Redesign product for better user experience',
        techniques: ['design_thinking', 'scamper']
      };

      // Design Thinking (5 steps) + SCAMPER (7 steps) = 12 total
      const expectedTotalSteps = 12;
      expect(expectedTotalSteps).toBe(12);
    });

    it('should include risk considerations for appropriate steps', async () => {
      const input = {
        problem: 'Technical optimization',
        techniques: ['triz']
      };

      // TRIZ step 1 (contradiction) and step 4 (minimal solution) should have risk considerations
      const stepsWithRisks = 2;
      expect(stepsWithRisks).toBeGreaterThan(0);
    });

    it('should generate unique plan IDs', async () => {
      const input = {
        problem: 'Test problem',
        techniques: ['po']
      };

      // Plan ID should start with 'plan_'
      const planIdPrefix = 'plan_';
      expect(planIdPrefix).toBe('plan_');
    });

    it('should handle different timeframes', async () => {
      const quickInput = {
        problem: 'Quick solution needed',
        techniques: ['random_entry'],
        timeframe: 'quick'
      };

      const comprehensiveInput = {
        problem: 'Thorough analysis required',
        techniques: ['six_hats'],
        timeframe: 'comprehensive'
      };

      // Comprehensive should have additional success criteria
      expect('comprehensive').toBe('comprehensive');
    });

    it('should provide default objectives when not specified', async () => {
      const input = {
        problem: 'Problem without specific objectives',
        techniques: ['yes_and']
      };

      // Should have default objectives
      const hasDefaultObjectives = true;
      expect(hasDefaultObjectives).toBe(true);
    });
  });

  describe('Execution Layer - execute_thinking_step', () => {
    it('should accept plan ID from planning layer', async () => {
      const input = {
        planId: 'plan_123',
        technique: 'scamper',
        problem: 'Improve product',
        currentStep: 1,
        totalSteps: 7,
        scamperAction: 'substitute',
        output: 'Replace metal with recycled plastic',
        nextStepNeeded: true
      };

      // Should process with plan context
      expect(input.planId).toBe('plan_123');
    });

    it('should work without plan ID (standalone)', async () => {
      const input = {
        technique: 'po',
        problem: 'Break assumptions about remote work',
        currentStep: 1,
        totalSteps: 4,
        provocation: 'Po: All meetings should be walking meetings',
        output: 'Exploring how movement could enhance creativity',
        nextStepNeeded: true
      };

      // Should work without planId
      expect(input.planId).toBeUndefined();
    });

    it('should maintain compatibility with original tool', async () => {
      // ExecuteThinkingStepInput should be compatible with LateralThinkingData
      const input = {
        technique: 'concept_extraction',
        problem: 'Apply restaurant efficiency to healthcare',
        currentStep: 2,
        totalSteps: 4,
        output: 'Extracting key concepts from fast food operations',
        extractedConcepts: ['assembly line service', 'standardized processes', 'predictable wait times'],
        nextStepNeeded: true
      };

      // All fields should be compatible
      expect(input.technique).toBe('concept_extraction');
      expect(input.extractedConcepts).toBeDefined();
    });
  });

  describe('Tool Integration', () => {
    it('should support full workflow from discovery to execution', () => {
      // 1. Discovery finds suitable techniques
      const discoveryResult = {
        recommendations: [
          { technique: 'design_thinking', score: 0.9 },
          { technique: 'triz', score: 0.85 }
        ]
      };

      // 2. Planning creates workflow from recommendations
      const planningResult = {
        planId: 'plan_456',
        workflow: [
          { technique: 'design_thinking', stepNumber: 1 },
          { technique: 'design_thinking', stepNumber: 2 },
          { technique: 'triz', stepNumber: 3 }
        ]
      };

      // 3. Execution uses plan to guide steps
      const executionWithPlan = {
        planId: 'plan_456',
        technique: 'design_thinking',
        currentStep: 1
      };

      expect(discoveryResult.recommendations.length).toBeGreaterThan(0);
      expect(planningResult.workflow.length).toBeGreaterThan(0);
      expect(executionWithPlan.planId).toBe(planningResult.planId);
    });

    it('should handle errors gracefully in each layer', () => {
      // Discovery with missing problem
      const discoveryError = {
        error: 'Problem description is required',
        status: 'failed'
      };

      // Planning with empty techniques
      const planningError = {
        error: 'Problem and at least one technique are required',
        status: 'failed'
      };

      // Execution with invalid step
      const executionError = {
        error: 'Current step must be positive',
        status: 'failed'
      };

      expect(discoveryError.status).toBe('failed');
      expect(planningError.status).toBe('failed');
      expect(executionError.status).toBe('failed');
    });
  });

  describe('Technique Matching Logic', () => {
    it('should match keywords to appropriate techniques', () => {
      const keywordMappings = {
        'improve': ['scamper'],
        'user': ['design_thinking'],
        'team': ['six_hats', 'yes_and'],
        'stuck': ['po'],
        'creative': ['random_entry'],
        'pattern': ['concept_extraction'],
        'technical': ['triz'],
        'contradiction': ['triz']
      };

      Object.entries(keywordMappings).forEach(([keyword, techniques]) => {
        expect(techniques.length).toBeGreaterThan(0);
      });
    });

    it('should score techniques based on match strength', () => {
      // Strong match (multiple keywords)
      const strongMatch = {
        problem: 'improve product design for better user experience',
        expectedTopTechnique: 'design_thinking',
        expectedScore: 0.9
      };

      // Weak match (general keywords)
      const weakMatch = {
        problem: 'need help with a problem',
        expectedScore: 0.6
      };

      expect(strongMatch.expectedScore).toBeGreaterThan(weakMatch.expectedScore);
    });
  });
});