/**
 * RiskAssessmentOrchestrator - Handles risk assessment pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */

import type {
  ExecuteThinkingStepInput,
  SessionData,
  LateralThinkingResponse,
} from '../../types/index.js';
import type { VisualFormatter } from '../../utils/VisualFormatter.js';
import {
  requiresRuinCheck,
  assessRuinRisk,
  generateSurvivalConstraints,
} from '../../ergodicity/prompts.js';
import { adaptiveRiskAssessment } from '../../ergodicity/AdaptiveRiskAssessment.js';
import type { RuinRiskAssessment } from '../../ergodicity/prompts.js';
import { RuinRiskDiscovery } from '../../core/RuinRiskDiscovery.js';
import type {
  DomainAssessment,
  RiskDiscovery,
  ValidationResult,
} from '../../core/RuinRiskDiscovery.js';
import { generateConstraintViolationFeedback } from '../../ergodicity/riskDiscoveryPrompts.js';
import { RiskDismissalTracker } from '../../ergodicity/riskDismissalTracker.js';
import { EscalationPromptGenerator } from '../../ergodicity/escalationPrompts.js';
import type { EscalationPrompt } from '../../ergodicity/escalationPrompts.js';

export interface RiskAssessmentResult {
  requiresIntervention: boolean;
  interventionResponse?: LateralThinkingResponse;
  ruinRiskAssessment?: RuinRiskAssessment;
  domainAssessment?: DomainAssessment;
  discoveredRisks?: RiskDiscovery;
  validation?: ValidationResult;
  escalationPrompt?: EscalationPrompt;
  behavioralFeedback?: string;
}

export class RiskAssessmentOrchestrator {
  private dismissalTracker = new RiskDismissalTracker();
  private escalationGenerator = new EscalationPromptGenerator();
  private riskDiscovery = new RuinRiskDiscovery();

  constructor(private visualFormatter: VisualFormatter) {}

  /**
   * Perform comprehensive risk assessment
   */
  assessRisks(input: ExecuteThinkingStepInput, session: SessionData): RiskAssessmentResult {
    const result: RiskAssessmentResult = {
      requiresIntervention: false,
    };

    // Check if output or problem requires ruin assessment
    const outputWords = input.output.toLowerCase().split(/\s+/);
    const problemWords = input.problem.toLowerCase().split(/\s+/);
    const allWords = [...outputWords, ...problemWords];

    // Perform ruin risk assessment with adaptive language
    if (requiresRuinCheck(input.technique, allWords)) {
      const ruinAssessment = this.performRuinAssessment(input, session);
      result.ruinRiskAssessment = ruinAssessment.ruinRiskAssessment;

      if (ruinAssessment.escalationRequired) {
        result.requiresIntervention = true;
        result.interventionResponse = ruinAssessment.interventionResponse;
        result.escalationPrompt = ruinAssessment.escalationPrompt;
        return result;
      }

      result.behavioralFeedback = ruinAssessment.behavioralFeedback;
    }

    // Perform dynamic risk discovery
    const discoveryResult = this.performRiskDiscovery(input, session);

    if (discoveryResult) {
      result.domainAssessment = discoveryResult.domainAssessment;
      result.discoveredRisks = discoveryResult.discoveredRisks;
      result.validation = discoveryResult.validation;

      if (discoveryResult.requiresIntervention) {
        result.requiresIntervention = true;
        result.interventionResponse = discoveryResult.interventionResponse;
        return result;
      }
    }

    return result;
  }

  /**
   * Perform ruin risk assessment with escalation handling
   */
  private performRuinAssessment(
    input: ExecuteThinkingStepInput,
    session: SessionData
  ): {
    ruinRiskAssessment?: RuinRiskAssessment;
    escalationRequired: boolean;
    interventionResponse?: LateralThinkingResponse;
    escalationPrompt?: EscalationPrompt;
    behavioralFeedback?: string;
  } {
    // Analyze context for adaptive language
    const context = adaptiveRiskAssessment.analyzeContext(input.problem, input.output);

    // Generate adaptive prompt based on context
    const ruinPrompt = adaptiveRiskAssessment.generateAdaptivePrompt(
      input.problem,
      input.output,
      context
    );
    const ruinRiskAssessment = assessRuinRisk(input.problem, input.technique, input.output);

    // Add ruin assessment to input for visibility
    const inputWithRuin = input as ExecuteThinkingStepInput & {
      ruinAssessment: {
        required: boolean;
        prompt: string;
        assessment: unknown;
        survivalConstraints: string[];
      };
    };
    inputWithRuin.ruinAssessment = {
      required: true,
      prompt: ruinPrompt,
      assessment: ruinRiskAssessment,
      survivalConstraints: generateSurvivalConstraints(ruinRiskAssessment),
    };

    // Track the risk assessment
    const engagementMetrics = this.dismissalTracker.trackAssessment(
      ruinRiskAssessment,
      session,
      input.output
    );

    // Check for dismissal patterns
    const patterns = this.dismissalTracker.detectPatterns(session);

    // Generate escalation if needed
    const escalationPrompt = this.escalationGenerator.generatePrompt(
      engagementMetrics,
      patterns,
      session
    );

    // Handle escalation
    if (escalationPrompt) {
      // Log escalation to stderr
      if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
        process.stderr.write('\n' + escalationPrompt.prompt + '\n\n');
      }

      // If progress is locked, check if user is providing an unlock response
      if (escalationPrompt.locksProgress) {
        // Check if the current output might be an unlock attempt
        const outputLength = input.output.split(/\s+/).length;
        if (outputLength > 50) {
          // Evaluate if response meets unlock requirements
          const unlockEval = this.dismissalTracker.evaluateUnlockResponse(
            input.output,
            escalationPrompt.minimumConfidence || 0.5,
            engagementMetrics
          );

          if (unlockEval.isValid) {
            // Log successful unlock
            if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
              process.stderr.write(`\n✅ ${unlockEval.feedback}\n\n`);
            }
            // Continue with normal processing
          } else {
            // Still locked, provide feedback
            return {
              ruinRiskAssessment,
              escalationRequired: true,
              interventionResponse: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(
                      {
                        error: 'Behavioral lock remains active',
                        escalationLevel: escalationPrompt.level,
                        message: escalationPrompt.prompt,
                        unlockAttemptFeedback: unlockEval.feedback,
                        requirements: {
                          minimumConfidence: escalationPrompt.minimumConfidence,
                          mustAddress: engagementMetrics.discoveredRiskIndicators,
                        },
                        behaviorPattern: {
                          consecutiveDismissals: engagementMetrics.consecutiveLowConfidence,
                          averageConfidence: engagementMetrics.averageConfidence,
                          totalDismissals: engagementMetrics.dismissalCount,
                        },
                      },
                      null,
                      2
                    ),
                  },
                ],
                isError: true,
              },
              escalationPrompt,
            };
          }
        } else {
          // Output too short to be an unlock attempt
          return {
            ruinRiskAssessment,
            escalationRequired: true,
            interventionResponse: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      error: 'Behavioral lock activated',
                      escalationLevel: escalationPrompt.level,
                      message: escalationPrompt.prompt,
                      requirements: {
                        minimumConfidence: escalationPrompt.minimumConfidence,
                        mustAddress: engagementMetrics.discoveredRiskIndicators,
                      },
                      behaviorPattern: {
                        consecutiveDismissals: engagementMetrics.consecutiveLowConfidence,
                        averageConfidence: engagementMetrics.averageConfidence,
                        totalDismissals: engagementMetrics.dismissalCount,
                      },
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            },
            escalationPrompt,
          };
        }
      }

      // Add escalation to ruin assessment for visibility
      if (inputWithRuin.ruinAssessment && typeof inputWithRuin.ruinAssessment === 'object') {
        Object.assign(inputWithRuin.ruinAssessment, {
          escalation: {
            level: escalationPrompt.level,
            requiresResponse: escalationPrompt.requiresResponse,
            minimumConfidence: escalationPrompt.minimumConfidence,
          },
        });
      }
    }

    // Generate behavioral feedback if patterns detected
    let behavioralFeedback: string | undefined;
    if (patterns.length > 0) {
      behavioralFeedback = this.dismissalTracker.generateBehavioralFeedback(
        patterns,
        engagementMetrics
      );
      if (behavioralFeedback && process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
        process.stderr.write('\n' + behavioralFeedback + '\n');
      }
    }

    return {
      ruinRiskAssessment,
      escalationRequired: false,
      escalationPrompt: escalationPrompt || undefined,
      behavioralFeedback,
    };
  }

  /**
   * Perform dynamic risk discovery
   */
  private performRiskDiscovery(
    input: ExecuteThinkingStepInput,
    session: SessionData
  ): {
    domainAssessment?: DomainAssessment;
    discoveredRisks?: RiskDiscovery;
    validation?: ValidationResult;
    requiresIntervention: boolean;
    interventionResponse?: LateralThinkingResponse;
  } | null {
    // Check if discovery is needed
    const outputWords = input.output.toLowerCase().split(/\s+/);
    const problemWords = input.problem.toLowerCase().split(/\s+/);
    const allWords = [...outputWords, ...problemWords];

    const needsDiscovery =
      requiresRuinCheck(input.technique, allWords) ||
      input.output.toLowerCase().includes('invest') ||
      input.output.toLowerCase().includes('all') ||
      input.output.toLowerCase().includes('commit') ||
      input.output.toLowerCase().includes('permanent');

    if (!needsDiscovery) {
      return null;
    }

    // Initialize risk discovery data in session
    if (!session.riskDiscoveryData) {
      session.riskDiscoveryData = {
        domainAssessment: undefined,
        risks: undefined,
        ruinScenarios: [],
        constraints: [],
        validations: [],
      };
    }

    // Phase 1: Context assessment (fresh each time)
    const contextResponse = `This problem involves ${input.problem}. The user is considering: ${input.output}`;
    const domainAssessment = this.riskDiscovery.processDomainAssessment(contextResponse);

    // Store in session for this specific context
    session.riskDiscoveryData.domainAssessment = domainAssessment;

    // Phase 2: Risk discovery (fresh for this context)
    // Don't use cached discovery - let the LLM discover risks fresh each time
    const discoveryResponse = `For the context: ${domainAssessment.primaryDomain}, the action is: ${input.output}`;
    const discoveredRisks = this.riskDiscovery.processRiskDiscovery(
      domainAssessment.primaryDomain,
      discoveryResponse
    );

    // Store in session
    session.riskDiscoveryData.risks = discoveredRisks;

    // Phase 3: Validate against discovered risks
    let validation: ValidationResult | undefined;
    if (discoveredRisks && session.riskDiscoveryData.ruinScenarios) {
      validation = this.riskDiscovery.validateAgainstDiscoveredRisks(
        input.output,
        discoveredRisks,
        session.riskDiscoveryData.ruinScenarios
      );

      // Handle validation failure
      if (!validation.isValid && validation.riskLevel === 'unacceptable') {
        // Log the violation
        if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
          process.stderr.write(
            '\n' +
              generateConstraintViolationFeedback(input.output, validation.violatedConstraints, {
                domain: domainAssessment.primaryDomain,
                risks: discoveredRisks.identifiedRisks.map(r => r.risk),
                ruinScenarios: session.riskDiscoveryData.ruinScenarios.length,
                worstCase: discoveredRisks.identifiedRisks.find(
                  r => r.impactMagnitude === 'catastrophic'
                )?.risk,
              }) +
              '\n'
          );
        }

        // Return intervention response
        return {
          domainAssessment,
          discoveredRisks,
          validation,
          requiresIntervention: true,
          interventionResponse: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    error: 'Risk validation failed',
                    message: 'Your recommendation violates discovered safety constraints',
                    validation: validation,
                    discoveredConstraints: validation.violatedConstraints,
                    recommendation:
                      'Please revise your recommendation to respect the safety limits you discovered',
                    educationalFeedback: validation.educationalFeedback,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          },
        };
      }
    }

    // Add discovery data to input for visibility
    const inputWithDiscovery = input as ExecuteThinkingStepInput & {
      riskDiscoveryData?: {
        domainAssessment?: DomainAssessment;
        discoveredRisks?: RiskDiscovery;
        validation?: ValidationResult;
        forcedCalculations?: Record<string, string>;
      };
    };

    // Get forced calculations
    const currentDomainAssessment = session.riskDiscoveryData.domainAssessment || domainAssessment;
    const forcedCalculations = currentDomainAssessment
      ? this.riskDiscovery.getForcedCalculations(currentDomainAssessment, input.output)
      : {};

    inputWithDiscovery.riskDiscoveryData = {
      domainAssessment,
      discoveredRisks,
      validation,
      forcedCalculations,
    };

    return {
      domainAssessment,
      discoveredRisks,
      validation,
      requiresIntervention: false,
    };
  }
}
