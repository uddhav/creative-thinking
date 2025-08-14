import { describe, it, expect, beforeEach } from 'vitest';
import { executeThinkingStep } from '../../layers/execution.js';
import { SessionManager } from '../../core/SessionManager.js';
import { TechniqueRegistry } from '../../techniques/TechniqueRegistry.js';
import { VisualFormatter } from '../../utils/VisualFormatter.js';
import { MetricsCollector } from '../../core/MetricsCollector.js';
import { HybridComplexityAnalyzer } from '../../complexity/analyzer.js';
import { ErgodicityManager } from '../../ergodicity/index.js';
import type { ExecuteThinkingStepInput } from '../../types/index.js';
import {
  requiresRuinCheck,
  assessRuinRisk,
  generateSurvivalConstraints,
} from '../../ergodicity/prompts.js';

describe('Ergodicity Prompts', () => {
  let sessionManager: SessionManager;
  let techniqueRegistry: TechniqueRegistry;
  let visualFormatter: VisualFormatter;
  let metricsCollector: MetricsCollector;
  let complexityAnalyzer: HybridComplexityAnalyzer;
  let ergodicityManager: ErgodicityManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
    techniqueRegistry = TechniqueRegistry.getInstance();
    visualFormatter = new VisualFormatter(true); // Disable visual output
    metricsCollector = new MetricsCollector();
    complexityAnalyzer = new HybridComplexityAnalyzer();
    ergodicityManager = new ErgodicityManager();
  });

  describe('Ergodicity prompts on first step', () => {
    it('should include ergodicity check for first step of any technique', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'six_hats',
        problem: 'Should I invest all my savings in cryptocurrency?',
        currentStep: 1,
        totalSteps: 7,
        output: 'Blue hat: Defining the thinking process...',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      expect(responseData.ergodicityCheck).toBeDefined();
      expect(responseData.ergodicityCheck.prompt).toContain('ergodic domain');
      expect(responseData.ergodicityCheck.prompt).toContain('ensemble averages');
      expect(responseData.ergodicityCheck.followUp).toContain('survival over optimization');
      expect(responseData.ergodicityCheck.ruinCheckRequired).toBe(true);
    });

    it('should trigger ruin assessment for high-risk keywords', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'scamper',
        problem: 'How to manage my personal investment portfolio?',
        currentStep: 2,
        totalSteps: 8,
        output: 'We could eliminate bonds and invest all savings in high-risk stocks',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      expect(responseData.ruinAssessment).toBeDefined();
      expect(responseData.ruinAssessment.required).toBe(true);
      // Now uses adaptive language based on context
      expect(responseData.ruinAssessment.prompt).toMatch(/ASSESSMENT|CHECK/);
      expect(responseData.ruinAssessment.survivalConstraints).toBeInstanceOf(Array);
      expect(responseData.ruinAssessment.survivalConstraints.length).toBeGreaterThan(0);
    });
  });

  describe('Technique-specific ergodicity warnings', () => {
    it('should warn about SCAMPER eliminate step', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'scamper',
        problem: 'Optimize our product line',
        currentStep: 6,
        totalSteps: 8,
        output: 'Eliminate: Remove the budget product line entirely',
        nextStepNeeded: true,
        scamperAction: 'eliminate',
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      expect(responseData.ergodicityCheck).toBeDefined();
      expect(responseData.ergodicityCheck.prompt).toContain('ELIMINATE is often irreversible');
      expect(responseData.ergodicityCheck.followUp).toContain('recovery path');
    });

    it('should include ergodicity analysis for Purple Hat', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'six_hats',
        problem: 'Launch a new startup',
        currentStep: 7,
        totalSteps: 7,
        output: 'Purple hat: Analyzing path dependencies...',
        nextStepNeeded: false,
        hatColor: 'purple',
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      expect(responseData.ergodicityCheck).toBeDefined();
      expect(responseData.ergodicityCheck.prompt).toContain('Purple Hat');
      expect(responseData.ergodicityCheck.prompt).toContain('path dependencies');
      expect(responseData.ergodicityCheck.followUp).toContain('preserve optionality');
    });
  });

  describe('Ruin risk detection', () => {
    it('should detect financial ruin keywords', () => {
      const keywords = ['invest', 'all', 'savings', 'bankruptcy', 'bet'];
      expect(requiresRuinCheck('po', keywords)).toBe(true);
    });

    it('should detect health/safety ruin keywords', () => {
      const keywords = ['health', 'surgery', 'permanent', 'irreversible'];
      expect(requiresRuinCheck('random_entry', keywords)).toBe(true);
    });

    it('should flag high-risk techniques', () => {
      // High-risk techniques always trigger ruin check
      expect(requiresRuinCheck('scamper', [])).toBe(true);
      expect(requiresRuinCheck('disney_method', [])).toBe(true);
      expect(requiresRuinCheck('design_thinking', [])).toBe(true);
      expect(requiresRuinCheck('yes_and', [])).toBe(true);

      // Non-high-risk techniques don't trigger without keywords
      expect(requiresRuinCheck('six_hats', [])).toBe(false);
      expect(requiresRuinCheck('random_entry', [])).toBe(false);

      // But they do trigger with risk keywords
      expect(requiresRuinCheck('six_hats', ['invest', 'savings'])).toBe(true);
      expect(requiresRuinCheck('random_entry', ['portfolio'])).toBe(true);
    });
  });

  describe('Ruin risk assessment', () => {
    it('should assess high survival threat', () => {
      const assessment = assessRuinRisk(
        'Investment strategy',
        'scamper',
        "This could lead to bankruptcy if it fails. It's irreversible once we commit."
      );

      expect(assessment.survivabilityThreatened).toBe(true);
      expect(assessment.isIrreversible).toBe(true);
      expect(assessment.recommendation).toContain('HIGH RISK');
      expect(assessment.recommendation).toContain('survival constraints');
    });

    it('should detect ensemble vs time average mentions', () => {
      const assessment = assessRuinRisk(
        'Trading strategy',
        'triz',
        'Works great in ensemble average but could ruin individual traders over time'
      );

      expect(assessment.ensembleVsTimeAverage).toBe('both');
      expect(assessment.recommendation).toContain('many attempts');
    });

    it('should extract risk features from context', () => {
      const financialAssessment = assessRuinRisk(
        'Investment',
        'po',
        'This is an irreversible financial decision that could lead to bankruptcy'
      );
      expect(financialAssessment.domain).toBe('general'); // We no longer pigeonhole into domains
      expect(financialAssessment.isIrreversible).toBe(true);
      expect(financialAssessment.survivabilityThreatened).toBe(true);
      expect(financialAssessment.riskFeatures?.hasUndoableActions).toBe(true);

      const timeAssessment = assessRuinRisk(
        'Project',
        'six_hats',
        'Need to decide quickly on this urgent deadline'
      );
      expect(timeAssessment.domain).toBe('general');
      expect(timeAssessment.riskFeatures?.timePressure).toBe('high');

      const expertAssessment = assessRuinRisk(
        'Procedure',
        'scamper',
        'Requires expert knowledge and professional guidance'
      );
      expect(expertAssessment.domain).toBe('general');
      expect(expertAssessment.riskFeatures?.expertiseGap).toBeGreaterThan(0.5);
    });
  });

  describe('Survival constraints generation', () => {
    it('should generate constraints based on risk features', () => {
      const assessment = assessRuinRisk(
        'Should I invest all my savings?',
        'scamper',
        'This is irreversible and could lead to bankruptcy'
      );
      const constraints = generateSurvivalConstraints(assessment);
      expect(constraints).toContain('Identify what cannot be lost');
      expect(constraints).toContain('Build in recovery mechanisms');
      expect(constraints).toContain('Ensure survival before optimization');
    });

    it('should generate constraints for high time pressure', () => {
      const assessment = assessRuinRisk(
        'Urgent career decision',
        'disney_method',
        'I need to decide quickly about this job offer with a deadline'
      );
      const constraints = generateSurvivalConstraints(assessment);
      expect(constraints).toContain('Preserve decision-making time');
      expect(constraints).toContain('Avoid rushed irreversible choices');
    });

    it('should provide base constraints for low-risk situations', () => {
      const assessment = assessRuinRisk(
        'What color to paint my room?',
        'six_hats',
        'Just considering different paint colors'
      );
      const constraints = generateSurvivalConstraints(assessment);
      expect(constraints).toContain('Identify what cannot be lost');
      expect(constraints).toContain('Set maximum acceptable loss');
    });
  });

  describe('Ergodicity tracking for all techniques', () => {
    it('should track ergodicity for non-SCAMPER techniques', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'disney_method',
        problem: 'Launch new product',
        currentStep: 2,
        totalSteps: 3,
        output: 'Realist: We need to commit $1M budget and hire 10 people',
        nextStepNeeded: true,
        disneyRole: 'realist',
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      // Check that session has ergodicity data
      const parsedResp = JSON.parse(response.content[0].text) as { sessionId: string };
      const sessionId = parsedResp.sessionId;
      const session = sessionManager.getSession(sessionId);
      expect(session?.pathMemory).toBeDefined();
      expect(session?.pathMemory?.pathHistory.length).toBeGreaterThan(0);
    });

    it('should detect high commitment words in any technique', async () => {
      const input: ExecuteThinkingStepInput = {
        technique: 'po',
        problem: 'My retirement savings strategy',
        currentStep: 3,
        totalSteps: 4,
        output: 'I should permanently invest all my savings in cryptocurrency',
        nextStepNeeded: true,
      };

      const response = await executeThinkingStep(
        input,
        sessionManager,
        techniqueRegistry,
        visualFormatter,
        metricsCollector,
        complexityAnalyzer,
        ergodicityManager
      );

      const responseData = JSON.parse(response.content[0].text) as Record<string, unknown>;
      expect(responseData.ruinAssessment).toBeDefined();
      // Personal finance framework focuses on reversibility and survival
      expect(responseData.ruinAssessment.prompt).toContain('Reversibility');
    });
  });
});
