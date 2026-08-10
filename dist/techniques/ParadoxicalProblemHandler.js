/**
 * Paradoxical Problem Solving technique handler
 * Transcends contradictions by recognizing the path-dependent nature of seemingly incompatible requirements
 */
import { BaseTechniqueHandler, describeStructuredField, firstSentence, } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class ParadoxicalProblemHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Paradox Identification',
            focus: 'Surface contradictions and trace their path origins',
            emoji: '⚖️',
            type: 'thinking',
        },
        {
            name: 'Parallel Path Development',
            focus: 'Develop conflicting solutions independently on their own paths',
            emoji: '🔀',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Creating parallel solution paths', 'Building dual infrastructure'],
                realityChanges: [
                    'Multiple solution architectures now exist',
                    'Team expectations split across approaches',
                    'Resources committed to maintaining duality',
                    'Switching mechanisms established',
                ],
                futureConstraints: [
                    'Must maintain both paths going forward',
                    'Cannot abandon either approach easily',
                    'Ongoing balancing and switching costs',
                    'Stakeholders expect continued flexibility',
                ],
                reversibility: 'low',
            },
        },
        {
            name: 'Transcendent Synthesis',
            focus: 'Find meta-path encompassing both solutions',
            emoji: '🌉',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Creating meta-solution', 'Building bridges between paths'],
                realityChanges: [
                    'New meta-framework becomes organizational reality',
                    'Complexity is now institutionalized',
                    'Context-switching rules established',
                    'Paradox management becomes ongoing practice',
                ],
                futureConstraints: [
                    'Must sustain meta-framework indefinitely',
                    'Cannot simplify without losing capability',
                    'Requires sophisticated management',
                    'Organization committed to complexity',
                ],
                reversibility: 'low',
            },
        },
        {
            name: 'Non-Ergodic Validation',
            focus: 'Test resolution across multiple path contexts',
            emoji: '✨',
            type: 'thinking',
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Paradoxical Problem Solving',
            emoji: '⚖️',
            totalSteps: 4,
            description: 'PRESERVE contradictions by building infrastructure to manage both sides dynamically',
            focus: 'Embrace paradoxes as permanent tensions requiring ongoing balance',
            enhancedFocus: 'Recognizes that paradoxes often arise from assuming ergodic conditions where path-dependency actually exists',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build sequentially from paradox identification to validation',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'structural',
                overallReversibility: 'low',
                riskLevel: 'high',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Paradoxical Problem Solving. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: `1-${this.steps.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Identify the core paradox in: "${problem}". What contradictory requirements seem impossible to reconcile? Trace each requirement to its origin - what paths led to these conflicting needs? Map stakeholder journeys that created these tensions. Identify time dependencies and ergodic fallacies.`,
            2: `Develop Solution A to "${problem}" fully on its own path, optimizing for its requirements without compromise. Then develop Solution B independently on its path. Allow each to reach natural completion without forcing premature integration. What does each path look like when pursued to its logical conclusion?`,
            3: `Find the transcendent synthesis for "${problem}" - a meta-path that encompasses both solutions. Create bridges between the endpoints. Design path-switching mechanisms that allow dynamic selection based on context. Build the logic for contextual adaptation.`,
            4: `Validate the resolution of "${problem}" across multiple path contexts. Test with different starting conditions and path histories. Verify the paradox is truly resolved, not just hidden. Check for new paradox creation. Ensure all stakeholder paths remain viable.`,
        };
        return (guidanceMap[step] || `Complete the Paradoxical Problem Solving process for: "${problem}"`);
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for paradoxical problem solving fields
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            switch (step) {
                case 1:
                    // Validate paradox identification - accept multiple field variations
                    if (!stepData.paradox && !stepData.contradictions && !stepData.contradiction) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 1 (Paradox Identification) requires identifying contradictory requirements. ' +
                            'Provide "paradox" (string), "contradiction" (string), or "contradictions" (array). ' +
                            'Example: { "paradox": "Need both speed and accuracy which conflict", "output": "..." }', 'paradox', {
                            step,
                            technique: 'paradoxical_problem',
                            acceptedFields: ['paradox', 'contradiction', 'contradictions'],
                            example: { paradox: 'Conflicting requirements that seem impossible to reconcile' },
                        });
                    }
                    break;
                case 2:
                    // Validate parallel path development
                    if (!stepData.solutionA && !stepData.solutionB && !stepData.parallelPaths) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 2 (Parallel Path Development) requires developing independent solutions. ' +
                            'Provide "solutionA" (string), "solutionB" (string), or "parallelPaths" (array). ' +
                            'Example: { "solutionA": "Optimize for speed", "solutionB": "Optimize for accuracy", "output": "..." }', 'parallelPaths', {
                            step,
                            technique: 'paradoxical_problem',
                            acceptedFields: ['solutionA', 'solutionB', 'parallelPaths'],
                            example: { solutionA: 'Path A solution', solutionB: 'Path B solution' },
                        });
                    }
                    break;
                case 3:
                    // Validate transcendent synthesis
                    if (!stepData.synthesis && !stepData.metaPath && !stepData.bridge) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 (Transcendent Synthesis) requires creating a meta-solution. ' +
                            'Provide "synthesis" (string), "metaPath" (string), or "bridge" (string). ' +
                            'Example: { "synthesis": "Dynamic switching between solutions based on context", "output": "..." }', 'synthesis', {
                            step,
                            technique: 'paradoxical_problem',
                            acceptedFields: ['synthesis', 'metaPath', 'bridge'],
                            example: { synthesis: 'Transcendent solution that encompasses both paths' },
                        });
                    }
                    break;
                case 4:
                    // Validate non-ergodic validation - accept finalSynthesis as well
                    if (!stepData.validation &&
                        !stepData.pathContexts &&
                        !stepData.resolutionVerified &&
                        !stepData.finalSynthesis) {
                        throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 4 (Non-Ergodic Validation) requires validating the resolution. ' +
                            'Provide "validation" (string), "pathContexts" (array), "resolutionVerified" (boolean), or "finalSynthesis" (string). ' +
                            'Example: { "validation": "Resolution tested across multiple contexts", "output": "..." }', 'validation', {
                            step,
                            technique: 'paradoxical_problem',
                            acceptedFields: [
                                'validation',
                                'pathContexts',
                                'resolutionVerified',
                                'finalSynthesis',
                            ],
                            example: {
                                validation: 'Paradox successfully resolved through transcendent synthesis',
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
     * `validateStep` accepts any of the names listed for a step, so all of them
     * have to report the same thing — a session that sent `contradictions`
     * instead of `paradox` passed validation and must not then be reported as
     * having recorded nothing. `a ?? b` is not enough: an empty array is neither
     * null nor undefined, so it would win over a populated alias.
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
     * this far named its paradox, both paths, the synthesis and the validation;
     * reporting none of them was the defect this fixes.
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
            if (step === 1) {
                const paradox = this.renderAlias(entryObj, 'paradox', 'contradiction', 'contradictions');
                if (paradox.length > 0) {
                    insights.push(`${stepName}: ${paradox}`);
                }
            }
            if (step === 2) {
                // solutionA and solutionB are two paths, not two names for one, so
                // report each on its own; the whole point of the step is that both
                // reached completion independently. parallelPaths is the array form
                // callers may send instead.
                const pathA = describeStructuredField(entryObj.solutionA);
                if (pathA.length > 0) {
                    insights.push(`${stepName}: path A — ${pathA}`);
                }
                const pathB = describeStructuredField(entryObj.solutionB);
                if (pathB.length > 0) {
                    insights.push(`${stepName}: path B — ${pathB}`);
                }
                const paths = describeStructuredField(entryObj.parallelPaths);
                if (paths.length > 0) {
                    insights.push(`${stepName}: ${paths}`);
                }
            }
            if (step === 3) {
                const synthesis = this.renderAlias(entryObj, 'synthesis', 'metaPath', 'bridge');
                if (synthesis.length > 0) {
                    insights.push(`${stepName}: ${synthesis}`);
                }
            }
            if (step === 4) {
                const validation = this.renderAlias(entryObj, 'validation', 'finalSynthesis');
                if (validation.length > 0) {
                    insights.push(`${stepName}: ${validation}`);
                }
                const contexts = describeStructuredField(entryObj.pathContexts);
                if (contexts.length > 0) {
                    insights.push(`${stepName}: tested against ${contexts}`);
                }
                // A false verdict is the finding, so test the type rather than
                // truthiness — `if (resolutionVerified)` reports only the successes.
                if (typeof entryObj.resolutionVerified === 'boolean') {
                    insights.push(entryObj.resolutionVerified
                        ? `${stepName}: resolution verified`
                        : `${stepName}: resolution NOT verified — the paradox is hidden, not resolved`);
                }
            }
        }
        // No completion banner. Reaching step 4 is already visible from the step
        // count, and a fixed "paradox transcended" asserts a finding the session
        // never made — step 4 exists precisely to be able to say it was not.
        return insights;
    }
    getStepPrompt(step, problem) {
        const stepInfo = this.getStepInfo(step);
        const guidance = this.getStepGuidance(step, problem);
        return `${stepInfo.emoji} **${stepInfo.name}**\n\nFocus: ${stepInfo.focus}\n\n${guidance}`;
    }
    getRiskAssessmentPrompt(step) {
        const riskPrompts = {
            1: 'What if the paradox is fundamental and cannot be resolved? Are we missing deeper contradictions?',
            2: 'Could developing solutions in isolation create incompatible architectures? What dependencies might we miss?',
            3: 'Is the synthesis truly transcendent or just a compromise? Does it create new paradoxes?',
            4: 'Have we tested enough path contexts? Could edge cases break the resolution?',
        };
        return (riskPrompts[step] ||
            'What risks exist in this paradoxical resolution approach? What could go wrong?');
    }
    getPathDependencyPrompt(step) {
        const pathPrompts = {
            1: 'How did different historical paths create this paradox? What decisions led here?',
            2: 'What path commitments does each solution make? What futures do they enable or foreclose?',
            3: 'Does the synthesis preserve path flexibility or lock in certain trajectories?',
            4: 'How sensitive is the resolution to different path histories?',
        };
        return (pathPrompts[step] ||
            'What path dependencies exist in this step? How do past decisions affect current options?');
    }
}
//# sourceMappingURL=ParadoxicalProblemHandler.js.map