/**
 * RiskAssessmentOrchestrator - Handles risk assessment pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import { requiresRuinCheck, assessRuinRisk, generateSurvivalConstraints, } from '../../ergodicity/prompts.js';
import { adaptiveRiskAssessment } from '../../ergodicity/AdaptiveRiskAssessment.js';
import { CONFIDENCE_THRESHOLDS } from '../../ergodicity/constants.js';
import { RuinRiskDiscovery } from '../../core/RuinRiskDiscovery.js';
import { generateConstraintViolationFeedback } from '../../ergodicity/riskDiscoveryPrompts.js';
import { RiskDismissalTracker } from '../../ergodicity/riskDismissalTracker.js';
import { EscalationPromptGenerator } from '../../ergodicity/escalationPrompts.js';
export class RiskAssessmentOrchestrator {
    visualFormatter;
    dismissalTracker = new RiskDismissalTracker();
    escalationGenerator = new EscalationPromptGenerator();
    riskDiscovery = new RuinRiskDiscovery();
    constructor(visualFormatter) {
        this.visualFormatter = visualFormatter;
    }
    /**
     * Perform comprehensive risk assessment
     */
    assessRisks(input, session) {
        const result = {
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
    performRuinAssessment(input, session) {
        // Analyze context for adaptive language
        const context = adaptiveRiskAssessment.analyzeContext(input.problem, input.output);
        // Generate adaptive prompt based on context
        const ruinPrompt = adaptiveRiskAssessment.generateAdaptivePrompt(input.problem, input.output, context);
        const ruinRiskAssessment = assessRuinRisk(input.problem, input.technique, input.output);
        // Add ruin assessment to input for visibility
        const inputWithRuin = input;
        inputWithRuin.ruinAssessment = {
            required: true,
            prompt: ruinPrompt,
            assessment: ruinRiskAssessment,
            survivalConstraints: generateSurvivalConstraints(ruinRiskAssessment),
        };
        // Track the risk assessment
        const engagementMetrics = this.dismissalTracker.trackAssessment(ruinRiskAssessment, session, input.output);
        // Check for dismissal patterns
        const patterns = this.dismissalTracker.detectPatterns(session);
        // Generate escalation if needed
        const escalationPrompt = this.escalationGenerator.generatePrompt(engagementMetrics, patterns, session);
        // Handle escalation
        if (escalationPrompt) {
            // Log escalation to stderr
            if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                process.stderr.write('\n' + escalationPrompt.prompt + '\n\n');
            }
            // No longer blocking progress - just log warnings
            // The locksProgress flag has been set to false in escalation prompts
            // But we still evaluate responses to provide feedback
            if (escalationPrompt.requiresResponse) {
                // Check if the current output might be addressing the concerns
                const outputLength = input.output.split(/\s+/).length;
                if (outputLength > 50) {
                    // Evaluate if response meets quality requirements
                    const unlockEval = this.dismissalTracker.evaluateUnlockResponse(input.output, escalationPrompt.minimumConfidence || CONFIDENCE_THRESHOLDS.MODERATE, engagementMetrics);
                    if (unlockEval.isValid) {
                        // Log positive feedback
                        if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                            process.stderr.write(`\n✅ ${unlockEval.feedback}\n\n`);
                        }
                        // Continue with normal processing
                    }
                    else {
                        // Log warning but DON'T block - just provide feedback
                        if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                            process.stderr.write(`\n⚠️ Risk Assessment Warning:\n${unlockEval.feedback}\n\n`);
                            process.stderr.write(`Proceeding with caution - please consider the risks identified.\n\n`);
                        }
                        // Store warning in behavioral feedback instead of blocking
                        return {
                            ruinRiskAssessment,
                            escalationRequired: false, // Changed: no longer blocking
                            behavioralFeedback: `⚠️ Risk Warning: ${escalationPrompt.prompt}\n\nYour response quality: ${unlockEval.feedback}\n\nProceeding with execution but please address the identified risks.`,
                        };
                    }
                }
                else {
                    // Output too short to be addressing concerns - just warn
                    if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                        process.stderr.write(`\n⚠️ Risk Assessment Notice:\nYour response appears brief. Consider providing more detailed risk analysis.\n\n`);
                    }
                    return {
                        ruinRiskAssessment,
                        escalationRequired: false, // Changed: no longer blocking
                        behavioralFeedback: `⚠️ Risk Warning: ${escalationPrompt.prompt}\n\nNote: Consider providing a more detailed response (50+ words) addressing the identified risks.`,
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
        let behavioralFeedback;
        if (patterns.length > 0) {
            behavioralFeedback = this.dismissalTracker.generateBehavioralFeedback(patterns, engagementMetrics);
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
    performRiskDiscovery(input, session) {
        // Check if discovery is needed
        const outputWords = input.output.toLowerCase().split(/\s+/);
        const problemWords = input.problem.toLowerCase().split(/\s+/);
        const allWords = [...outputWords, ...problemWords];
        const needsDiscovery = requiresRuinCheck(input.technique, allWords) ||
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
        const discoveredRisks = this.riskDiscovery.processRiskDiscovery(domainAssessment.primaryDomain, discoveryResponse);
        // Store in session
        session.riskDiscoveryData.risks = discoveredRisks;
        // Phase 3: Validate against discovered risks
        let validation;
        if (discoveredRisks && session.riskDiscoveryData.ruinScenarios) {
            validation = this.riskDiscovery.validateAgainstDiscoveredRisks(input.output, discoveredRisks, session.riskDiscoveryData.ruinScenarios);
            // Handle validation failure
            if (!validation.isValid && validation.riskLevel === 'unacceptable') {
                // Log the violation
                if (process.env.DISABLE_THOUGHT_LOGGING !== 'true') {
                    process.stderr.write('\n' +
                        generateConstraintViolationFeedback(input.output, validation.violatedConstraints, {
                            domain: domainAssessment.primaryDomain,
                            risks: discoveredRisks.identifiedRisks.map(r => r.risk),
                            ruinScenarios: session.riskDiscoveryData.ruinScenarios.length,
                            worstCase: discoveredRisks.identifiedRisks.find(r => r.impactMagnitude === 'catastrophic')?.risk,
                        }) +
                        '\n');
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
                                text: JSON.stringify({
                                    error: 'Risk validation failed',
                                    message: 'Your recommendation violates discovered safety constraints',
                                    validation: validation,
                                    discoveredConstraints: validation.violatedConstraints,
                                    recommendation: 'Please revise your recommendation to respect the safety limits you discovered',
                                    educationalFeedback: validation.educationalFeedback,
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    },
                };
            }
        }
        // Add discovery data to input for visibility
        const inputWithDiscovery = input;
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
//# sourceMappingURL=RiskAssessmentOrchestrator.js.map