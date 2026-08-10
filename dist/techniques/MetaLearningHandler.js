/**
 * Meta-Learning from Path Integration technique handler with reflexivity
 * Improves integration capabilities by learning from path patterns across all techniques
 */
import { BaseTechniqueHandler, describeStructuredField, firstSentence, } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class MetaLearningHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Pattern Recognition',
            focus: 'Identify successful path patterns across techniques',
            emoji: '🔍',
            type: 'thinking',
        },
        {
            name: 'Learning Accumulation',
            focus: 'Store effective combinations and context mappings',
            emoji: '📊',
            type: 'thinking',
        },
        {
            name: 'Strategy Evolution',
            focus: 'Adapt technique selection and execution sequences',
            emoji: '🔄',
            type: 'thinking',
        },
        // No 'Feedback Integration' step. It asked what telemetry revealed about
        // technique effectiveness, and getStepGuidance receives only (step, problem)
        // — no telemetry, no session history, no list of techniques used. The step
        // could only ever be answered by inventing the data, and validateStep would
        // accept the invention because it checked that an array existed. Wiring it
        // is a real change (see the session-history enrichment in
        // ExecutionResponseBuilder), not a guidance edit.
        {
            name: 'Meta-Synthesis',
            focus: 'Generate improved integration strategies',
            emoji: '🧠',
            type: 'action',
            reflexiveEffects: {
                triggers: [
                    'Creating new integration strategies',
                    'Synthesizing meta-learning insights',
                    'Establishing learning frameworks',
                ],
                realityChanges: [
                    'New strategies created',
                    'Learning patterns established',
                    'Integration approach evolved',
                ],
                futureConstraints: [
                    'Must follow synthesized strategies',
                    'Learning patterns guide future decisions',
                    'Meta-framework shapes technique selection',
                ],
                reversibility: 'medium',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Meta-Learning from Path Integration',
            emoji: '🧠',
            totalSteps: 4,
            description: 'Learn from path patterns across techniques to improve integration capabilities',
            focus: 'Self-improving integration through pattern recognition and adaptive strategies',
            enhancedFocus: 'System learns how to learn from paths, recognizing successful patterns and evolving strategies based on accumulated knowledge',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build sequentially from pattern recognition to meta-synthesis',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Meta-Learning. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: `1-${this.steps.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Analyze patterns across all techniques used for: "${problem}". What successful path patterns emerge? Which techniques work well together? Identify failure modes and their causes. Look for cross-technique synergies and emergent strategies. What patterns predict success or failure?`,
            2: `Accumulate learnings from the patterns identified in "${problem}". Store effective technique combinations and their contexts. Build an affinity matrix showing which techniques complement each other. Track context-success mappings. Create a learning history that can inform future decisions.`,
            3: `Evolve your strategy for "${problem}" based on accumulated learnings. How should technique selection adapt to this problem type? What execution sequences prove most effective? How can convergence methods be improved? What option generation strategies work best? Design adaptive selection criteria.`,
            4: `Synthesize meta-learning insights from "${problem}" into improved integration strategies. Generate recommendations for: optimal technique combinations, execution sequences, context adaptations, and failure prevention. Create a self-improving framework that gets better with each use.`,
        };
        return (guidanceMap[step] ||
            `Complete the Meta-Learning from Path Integration process for: "${problem}"`);
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for meta-learning fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1:
                    // Validate pattern recognition
                    if (!stepData.patternRecognition && !stepData.patterns) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 1 (Pattern Recognition) requires identifying successful patterns across techniques. ' +
                            'Provide "patternRecognition" (array) or "patterns" (array) describing recognized patterns. ' +
                            'Example: { "patternRecognition": ["Divergent thinking works best early", "Constraints improve creativity"], "output": "..." }', 'patternRecognition', {
                            step,
                            technique: 'meta_learning',
                            acceptedFields: ['patternRecognition', 'patterns'],
                            example: {
                                patternRecognition: [
                                    'successful pattern 1',
                                    'effective strategy 2',
                                    'recurring theme 3',
                                ],
                            },
                        });
                    }
                    break;
                case 2:
                    // Validate learning accumulation
                    if (!stepData.learningHistory && !stepData.accumulatedLearning) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 2 (Learning Accumulation) requires building on previous learning experiences. ' +
                            'Provide "learningHistory" (array) or "accumulatedLearning" (array) describing accumulated insights. ' +
                            'Example: { "learningHistory": ["Technique A works for divergent problems", "Technique B excels at convergent thinking"], "output": "..." }', 'learningHistory', {
                            step,
                            technique: 'meta_learning',
                            acceptedFields: ['learningHistory', 'accumulatedLearning'],
                            example: {
                                learningHistory: [
                                    'past learning 1',
                                    'accumulated insight 2',
                                    'knowledge built 3',
                                ],
                            },
                        });
                    }
                    break;
                case 3:
                    // Validate strategy evolution
                    if (!stepData.strategyAdaptations && !stepData.strategyEvolution) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 (Strategy Evolution) requires adapting and improving technique selection. ' +
                            'Provide "strategyAdaptations" (array) or "strategyEvolution" (string) describing evolved strategies. ' +
                            'Example: { "strategyAdaptations": ["Use visual techniques for spatial problems", "Apply systematic methods for complex systems"], "output": "..." }', 'strategyAdaptations', {
                            step,
                            technique: 'meta_learning',
                            acceptedFields: ['strategyAdaptations', 'strategyEvolution'],
                            example: {
                                strategyAdaptations: [
                                    'adapted strategy 1',
                                    'evolved approach 2',
                                    'improved method 3',
                                ],
                            },
                        });
                    }
                    break;
                case 4:
                    // Validate meta-synthesis
                    if (!stepData.metaSynthesis && !stepData.synthesisStrategy) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 4 (Meta-Synthesis) requires generating self-improving integration strategies. ' +
                            'Provide "metaSynthesis" (string) or "synthesisStrategy" (string) describing the meta-level synthesis. ' +
                            'Example: { "metaSynthesis": "Combine divergent exploration with convergent refinement based on problem complexity", "output": "..." }', 'metaSynthesis', {
                            step,
                            technique: 'meta_learning',
                            acceptedFields: ['metaSynthesis', 'synthesisStrategy'],
                            example: {
                                metaSynthesis: 'Self-improving strategy that adapts based on accumulated learning',
                            },
                        });
                    }
                    break;
            }
        }
        return true;
    }
    /**
     * The first alias that actually carries content, rendered.
     *
     * `validateStep` accepts either name of each pair, so both have to report the
     * same thing — a session that sent `patterns` instead of `patternRecognition`
     * passed validation and must not then be reported as having recorded nothing.
     * `a ?? b` is not enough: an empty array is neither null nor undefined, so it
     * would win over a populated alias and silently swallow the content.
     */
    renderAlias(entry, ...names) {
        for (const name of names) {
            const rendered = describeStructuredField(entry[name]);
            if (rendered.length > 0) {
                return rendered;
            }
        }
        return '';
    }
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     *
     * `validateStep` rejects a step that omits its field, so a session that got
     * this far has all four; reporting none of them was the defect this fixes.
     */
    extractInsights(history) {
        const totalSteps = this.steps.length;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
            if (typeof entry !== 'object' || entry === null) {
                return;
            }
            const entryObj = entry;
            // Fall back to position only when the caller sent no step number.
            const step = typeof entryObj.currentStep === 'number' ? entryObj.currentStep : index + 1;
            if (step >= 1 && step <= totalSteps) {
                latestByStep.set(step, entryObj);
            }
        });
        // Each step's own required field, under either accepted name.
        const fieldsByStep = {
            1: ['patternRecognition', 'patterns'],
            2: ['learningHistory', 'accumulatedLearning'],
            3: ['strategyAdaptations', 'strategyEvolution'],
            4: ['metaSynthesis', 'synthesisStrategy'],
        };
        const insights = [];
        for (let step = 1; step <= totalSteps; step++) {
            const entryObj = latestByStep.get(step);
            if (!entryObj) {
                continue;
            }
            const stepName = this.steps[step - 1]?.name;
            if (!stepName) {
                continue;
            }
            const output = typeof entryObj.output === 'string' ? entryObj.output.trim() : '';
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            const recorded = this.renderAlias(entryObj, ...(fieldsByStep[step] ?? []));
            if (recorded.length > 0) {
                insights.push(`${stepName}: ${recorded}`);
            }
        }
        // No completion banner. Reaching step 4 is already visible from the step
        // count, and a fixed "self-improving framework established" asserts a
        // finding the session never made — it would fire on any four entries.
        return insights;
    }
    getPromptContext(step) {
        const stepInfo = this.getStepInfo(step);
        return {
            technique: 'meta_learning',
            step,
            stepName: stepInfo.name,
            focus: stepInfo.focus,
            emoji: stepInfo.emoji,
            capabilities: {
                patternRecognition: 'Identifies successful patterns across techniques',
                learningAccumulation: 'Stores and builds on effective combinations',
                strategyEvolution: 'Adapts and improves technique selection',
                feedbackIntegration: 'Incorporates telemetry and user choices',
                metaSynthesis: 'Generates self-improving integration strategies',
            },
        };
    }
}
//# sourceMappingURL=MetaLearningHandler.js.map