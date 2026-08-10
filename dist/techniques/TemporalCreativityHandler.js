/**
 * Temporal Creativity with Path Memory Integration technique handler
 * Extends temporal thinking with deep path memory and option preservation
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class TemporalCreativityHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Archaeological Path Analysis',
            focus: 'Excavate decision history and extract patterns',
            emoji: '🏛️',
        },
        {
            name: 'Present State Synthesis',
            focus: 'Map current constraints and active options',
            emoji: '🎯',
        },
        {
            name: 'Future Path Projection',
            focus: 'Project multiple timeline scenarios',
            emoji: '🔮',
        },
        {
            name: 'Temporal Option Creation',
            focus: 'Design delay, acceleration, and parallel options',
            emoji: '⚡',
        },
        {
            name: 'Cyclical Refinement',
            focus: 'Integrate lessons and evolve strategy',
            emoji: '🔄',
        },
        {
            name: 'Path Integration',
            focus: 'Synthesize insights preserving maximum flexibility',
            emoji: '🌉',
        },
    ];
    stepsWithReflexivity = [
        {
            name: 'Archaeological Path Analysis',
            focus: 'Excavate decision history and extract patterns',
            emoji: '🏛️',
            type: 'thinking', // Analysis of past
        },
        {
            name: 'Present State Synthesis',
            focus: 'Map current constraints and active options',
            emoji: '🎯',
            type: 'thinking', // Current state mapping
        },
        {
            name: 'Future Path Projection',
            focus: 'Project multiple timeline scenarios',
            emoji: '🔮',
            type: 'thinking', // Future analysis
        },
        {
            name: 'Temporal Option Creation',
            focus: 'Design delay, acceleration, and parallel options',
            emoji: '⚡',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Creating temporal options',
                    'Establishing timelines',
                    'Setting acceleration/delay paths',
                ],
                realityChanges: [
                    'Timeline options created',
                    'Temporal commitments made',
                    'Parallel paths established',
                ],
                futureConstraints: [
                    'Must honor temporal commitments',
                    'Timeline dependencies created',
                    'Parallel paths must converge',
                ],
                reversibility: 'medium',
            },
        },
        {
            name: 'Cyclical Refinement',
            focus: 'Integrate lessons and evolve strategy',
            emoji: '🔄',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Refining strategy', 'Integrating lessons', 'Evolving approach'],
                realityChanges: ['Strategy refined', 'Lessons embedded', 'Evolution path set'],
                futureConstraints: [
                    'Must follow refined strategy',
                    'Lessons become constraints',
                    'Evolution continues',
                ],
                reversibility: 'high',
            },
        },
        {
            name: 'Path Integration',
            focus: 'Synthesize insights preserving maximum flexibility',
            emoji: '🌉',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Integrating temporal paths',
                    'Synthesizing insights',
                    'Creating unified timeline',
                ],
                realityChanges: [
                    'Paths integrated',
                    'Timeline unified',
                    'Flexibility framework established',
                ],
                futureConstraints: [
                    'Must work within integrated timeline',
                    'Synthesis defines boundaries',
                    'Flexibility has limits',
                ],
                reversibility: 'low',
            },
        },
    ];
    // Path memory system for tracking decision history
    pathMemory = [];
    getTechniqueInfo() {
        return {
            name: 'Temporal Creativity',
            emoji: '⏳',
            totalSteps: 6,
            description: 'Leverage time as a path creation mechanism with deep memory of decisions and constraints',
            focus: 'Multi-timeline thinking with path preservation',
            enhancedFocus: 'Combines archaeological analysis of past decisions with future projection to maintain maximum optionality',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build on temporal analysis requiring sequential execution',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.stepsWithReflexivity[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Temporal Creativity. Valid steps are 1-${this.stepsWithReflexivity.length}`, 'step', { providedStep: step, validRange: `1-${this.stepsWithReflexivity.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Excavate the decision history for: "${problem}". What past decisions created current constraints? What patterns emerge from historical choices? What lessons can be extracted from previous attempts?`,
            2: `Map the present state of "${problem}": What constraints currently exist? What options remain open? What is the current flexibility score? What immediate actions are possible without foreclosing future paths?`,
            3: `Project future paths for "${problem}" across multiple time horizons (1, 5, 10 units): What's the best case scenario? Most probable path? Worst case with maximum constraints? Potential black swans? How to design for antifragility?`,
            4: `Create temporal options for "${problem}": What can be delayed to buy more information? What should be accelerated to capture time-sensitive opportunities? How can we resequence for better paths? What can run in parallel timelines?`,
            5: `Perform cyclical refinement on "${problem}": Integrate historical lessons into current strategy. How does the strategy evolve based on path learning? What retrospective insights update our projections?`,
            6: `Integrate all temporal insights about "${problem}" while preserving maximum future flexibility. What synthesis maintains the most options? How do we build bridges between different timeline scenarios?`,
        };
        return guidanceMap[step] || `Complete the Temporal Creativity process for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for temporal creativity fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1: // Archaeological Path Analysis
                    if (stepData.pathHistory && !Array.isArray(stepData.pathHistory)) {
                        return false;
                    }
                    if (stepData.decisionPatterns && !Array.isArray(stepData.decisionPatterns)) {
                        return false;
                    }
                    break;
                case 2: // Present State Synthesis
                    if (stepData.currentConstraints && !Array.isArray(stepData.currentConstraints)) {
                        return false;
                    }
                    if (stepData.activeOptions && !Array.isArray(stepData.activeOptions)) {
                        return false;
                    }
                    if (stepData.flexibilityScore !== undefined &&
                        typeof stepData.flexibilityScore !== 'number') {
                        return false;
                    }
                    break;
                case 3: // Future Path Projection
                    if (stepData.timelineProjections && typeof stepData.timelineProjections !== 'object') {
                        return false;
                    }
                    if (stepData.blackSwanScenarios && !Array.isArray(stepData.blackSwanScenarios)) {
                        return false;
                    }
                    break;
                case 4: // Temporal Option Creation
                    if (stepData.delayOptions && !Array.isArray(stepData.delayOptions)) {
                        return false;
                    }
                    if (stepData.accelerationOptions && !Array.isArray(stepData.accelerationOptions)) {
                        return false;
                    }
                    if (stepData.parallelTimelines && !Array.isArray(stepData.parallelTimelines)) {
                        return false;
                    }
                    break;
                case 5: // Cyclical Refinement
                    if (stepData.lessonIntegration && !Array.isArray(stepData.lessonIntegration)) {
                        return false;
                    }
                    if (stepData.strategyEvolution !== undefined &&
                        typeof stepData.strategyEvolution !== 'string') {
                        return false;
                    }
                    break;
                case 6: // Path Integration
                    if (stepData.synthesisStrategy !== undefined &&
                        typeof stepData.synthesisStrategy !== 'string') {
                        return false;
                    }
                    if (stepData.preservedOptions && !Array.isArray(stepData.preservedOptions)) {
                        return false;
                    }
                    break;
            }
        }
        return true;
    }
    /**
     * Report what each step recorded, keyed on `entry.currentStep`.
     *
     * Every field below is validated by validateStep, so a caller that sent one
     * was told it was accepted. The previous version dropped most of them: the
     * whole of step 4, the three surviving branches of step 3's projection,
     * step 2's constraints, step 5's strategy and step 6's synthesis were
     * validated and then read by nothing. What did survive was filtered on
     * `length > 10` / `length > 5` — a test of how long a string is, not of
     * whether it is content — and the result was silently cut to twelve.
     */
    extractInsights(history) {
        const totalSteps = this.stepsWithReflexivity.length;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
            // Fall back to position only when the caller sent no step number.
            const step = entry.currentStep ?? index + 1;
            if (step >= 1 && step <= totalSteps) {
                latestByStep.set(step, entry);
            }
        });
        const insights = [];
        const pushEach = (prefix, values) => {
            if (!Array.isArray(values)) {
                return;
            }
            values.forEach(value => {
                if (typeof value === 'string' && value.trim().length > 0) {
                    insights.push(`${prefix}: ${value.trim()}`);
                }
            });
        };
        for (let step = 1; step <= totalSteps; step++) {
            const entry = latestByStep.get(step);
            if (!entry) {
                continue;
            }
            const stepName = this.stepsWithReflexivity[step - 1].name;
            const output = entry.output?.trim();
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            if (step === 1) {
                if (Array.isArray(entry.pathHistory)) {
                    entry.pathHistory.forEach(path => {
                        if (!path?.decision || !path.impact) {
                            return;
                        }
                        const consequences = [];
                        if (Array.isArray(path.constraintsCreated) && path.constraintsCreated.length > 0) {
                            consequences.push(`constraints created: ${path.constraintsCreated.join(', ')}`);
                        }
                        if (Array.isArray(path.optionsClosed) && path.optionsClosed.length > 0) {
                            consequences.push(`options closed: ${path.optionsClosed.join(', ')}`);
                        }
                        const suffix = consequences.length > 0 ? ` (${consequences.join('; ')})` : '';
                        insights.push(`Path decision: ${path.decision} → ${path.impact}${suffix}`);
                    });
                }
                pushEach('Pattern', entry.decisionPatterns);
            }
            if (step === 2) {
                pushEach('Constraint', entry.currentConstraints);
                pushEach('Active option', entry.activeOptions);
            }
            if (step === 3) {
                const projections = entry.timelineProjections;
                pushEach('Best case', projections?.bestCase);
                pushEach('Probable case', projections?.probableCase);
                pushEach('Worst case', projections?.worstCase);
                pushEach('Antifragile design', projections?.antifragileDesign);
                // The tool schema declares blackSwanScenarios both nested inside the
                // projection and at the top level; callers send either.
                pushEach('Black swan', projections?.blackSwanScenarios);
                pushEach('Black swan', entry.blackSwanScenarios);
            }
            if (step === 4) {
                pushEach('Delay option', entry.delayOptions);
                pushEach('Acceleration option', entry.accelerationOptions);
                pushEach('Parallel timeline', entry.parallelTimelines);
            }
            if (step === 5) {
                pushEach('Lesson', entry.lessonIntegration);
                if (entry.strategyEvolution?.trim()) {
                    insights.push(`Strategy evolution: ${entry.strategyEvolution.trim()}`);
                }
            }
            if (step === 6) {
                if (entry.synthesisStrategy?.trim()) {
                    insights.push(`Synthesis strategy: ${entry.synthesisStrategy.trim()}`);
                }
                pushEach('Preserved', entry.preservedOptions);
            }
        }
        // Duplicates are removed — the same option preserved twice is one insight —
        // but nothing is dropped for being the thirteenth thing the session said.
        return [...new Set(insights)];
    }
    /**
     * Track a decision in path memory
     */
    trackDecision(decision, constraintsCreated = [], optionsClosed = [], flexibilityImpact = 1.0) {
        this.pathMemory.push({
            timestamp: Date.now(),
            decision,
            constraintsCreated,
            optionsClosed,
            flexibilityImpact,
        });
    }
    /**
     * Analyze path memory for patterns
     */
    analyzePathMemory() {
        const totalDecisions = this.pathMemory.length;
        const totalConstraintsCreated = this.pathMemory.reduce((sum, entry) => sum + entry.constraintsCreated.length, 0);
        const totalOptionsClosed = this.pathMemory.reduce((sum, entry) => sum + entry.optionsClosed.length, 0);
        const currentFlexibility = this.pathMemory.reduce((flexibility, entry) => flexibility * entry.flexibilityImpact, 1.0);
        // Identify critical decisions (those that closed many options or created many constraints)
        const criticalDecisions = this.pathMemory
            .filter(entry => entry.constraintsCreated.length > 2 ||
            entry.optionsClosed.length > 2 ||
            entry.flexibilityImpact < 0.7)
            .sort((a, b) => a.flexibilityImpact - b.flexibilityImpact);
        return {
            totalDecisions,
            totalConstraintsCreated,
            totalOptionsClosed,
            currentFlexibility,
            criticalDecisions,
        };
    }
    /**
     * Project future flexibility based on current path
     */
    projectFutureFlexibility(horizons = [1, 5, 10]) {
        const currentAnalysis = this.analyzePathMemory();
        const decayRate = 0.9; // Flexibility tends to decay over time without active preservation
        const projections = {};
        horizons.forEach(horizon => {
            projections[horizon] = currentAnalysis.currentFlexibility * Math.pow(decayRate, horizon);
        });
        return projections;
    }
}
//# sourceMappingURL=TemporalCreativityHandler.js.map