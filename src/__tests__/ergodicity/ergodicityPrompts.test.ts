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
    techniqueRegistry = new TechniqueRegistry();
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
        problem: 'How to restructure our company?',
        currentStep: 2,
        totalSteps: 8,
        output: 'We could eliminate the entire R&D department to cut costs',
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
      expect(responseData.ruinAssessment.prompt).toContain('RUIN RISK ASSESSMENT');
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

    it('should flag high-risk techniques automatically', () => {
      expect(requiresRuinCheck('scamper', [])).toBe(true);
      expect(requiresRuinCheck('disney_method', [])).toBe(true);
      expect(requiresRuinCheck('design_thinking', [])).toBe(true);
      expect(requiresRuinCheck('yes_and', [])).toBe(true);
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

    it('should identify domain correctly', () => {
      const financialAssessment = assessRuinRisk('Investment', 'po', 'financial decision');
      expect(financialAssessment.domain).toBe('financial');

      const healthAssessment = assessRuinRisk('Treatment', 'six_hats', 'medical procedure');
      expect(healthAssessment.domain).toBe('health');

      const careerAssessment = assessRuinRisk('Job change', 'scamper', 'career move');
      expect(careerAssessment.domain).toBe('career');
    });
  });

  describe('Survival constraints generation', () => {
    it('should generate financial survival constraints', () => {
      const constraints = generateSurvivalConstraints('financial');
      expect(constraints).toContain('Maintain minimum 6 months emergency fund');
      expect(constraints).toContain('Never risk more than 10% on a single decision');
    });

    it('should generate health survival constraints', () => {
      const constraints = generateSurvivalConstraints('health');
      expect(constraints).toContain('No irreversible procedures without second opinion');
      expect(constraints).toContain('Preserve ability to recover');
    });

    it('should provide general constraints for unknown domains', () => {
      const constraints = generateSurvivalConstraints('unknown');
      expect(constraints).toContain('Identify what cannot be lost');
      expect(constraints).toContain('Maintain optionality');
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
        problem: 'Business strategy',
        currentStep: 3,
        totalSteps: 4,
        output: 'We should permanently eliminate our retail division',
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
      expect(responseData.ruinAssessment.prompt).toContain('eliminate');
    });
  });
});
