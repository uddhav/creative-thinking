/**
 * RiskAssessmentOrchestrator - Handles risk assessment pipeline
 * Extracted from executeThinkingStep to improve maintainability
 */
import { requiresRuinCheck, generateRuinAssessmentPrompt, assessRuinRisk, generateSurvivalConstraints, } from '../../ergodicity/prompts.js';
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
        // Perform ruin risk assessment
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
        const ruinPrompt = generateRuinAssessmentPrompt(input.problem, input.technique, input.output);
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
            // If progress is locked, return intervention
            if (escalationPrompt.locksProgress) {
                return {
                    ruinRiskAssessment,
                    escalationRequired: true,
                    interventionResponse: {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
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
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    },
                    escalationPrompt,
                };
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
        // Phase 1: Domain assessment
        let domainAssessment;
        const cachedDomain = session.riskDiscoveryData.domainAssessment?.primaryDomain;
        if (!cachedDomain) {
            const domainResponse = `This problem involves ${input.problem}. The user is considering: ${input.output}`;
            domainAssessment = this.riskDiscovery.processDomainAssessment(domainResponse);
            session.riskDiscoveryData.domainAssessment = domainAssessment;
        }
        // Phase 2: Get cached discovery
        const domain = session.riskDiscoveryData.domainAssessment?.primaryDomain || 'general';
        const discoveredRisks = this.riskDiscovery.getCachedDiscovery(domain);
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
                            domain,
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