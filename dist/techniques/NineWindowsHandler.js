/**
 * Nine Windows (System Operator) technique handler with reflexivity for future projections
 */
import { BaseTechniqueHandler, firstSentence } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class NineWindowsHandler extends BaseTechniqueHandler {
    getTechniqueInfo() {
        return {
            name: 'Nine Windows',
            emoji: '🪟',
            totalSteps: 9,
            description: 'Explore problems across time and system levels',
            focus: 'Systematic analysis through space-time matrix',
            parallelSteps: {
                canParallelize: true,
                description: 'All nine windows can be viewed simultaneously for holistic system understanding',
            },
        };
    }
    getStepInfo(step) {
        const cells = [
            // Row 1: Past (thinking - analyzing history)
            { name: 'Past Sub-system', focus: 'Component history', emoji: '🔧', type: 'thinking' },
            { name: 'Past System', focus: 'System evolution', emoji: '⚙️', type: 'thinking' },
            { name: 'Past Super-system', focus: 'Environmental history', emoji: '🌍', type: 'thinking' },
            // Row 2: Present (thinking - analyzing current state)
            { name: 'Present Sub-system', focus: 'Current components', emoji: '🔩', type: 'thinking' },
            { name: 'Present System', focus: 'Current state', emoji: '🎯', type: 'thinking' },
            { name: 'Present Super-system', focus: 'Current environment', emoji: '🏞️', type: 'thinking' },
            // Row 3: Future (action - creating projections and path dependencies)
            {
                name: 'Future Sub-system',
                focus: 'Component evolution',
                emoji: '🚀',
                type: 'action',
                reflexiveEffects: {
                    triggers: [
                        'Projecting component evolution',
                        'Defining future dependencies',
                        'Setting component trajectories',
                    ],
                    realityChanges: [
                        'Component evolution path defined',
                        'Future dependencies established',
                        'Development trajectory set',
                    ],
                    futureConstraints: [
                        'Components must evolve along projected paths',
                        'Path dependencies created',
                        'Some evolution paths may be irreversible',
                    ],
                    reversibility: 'medium',
                },
            },
            {
                name: 'Future System',
                focus: 'System possibilities',
                emoji: '🎪',
                type: 'action',
                reflexiveEffects: {
                    triggers: [
                        'Defining system futures',
                        'Creating possibility space',
                        'Establishing system trajectory',
                    ],
                    realityChanges: [
                        'Future possibilities defined',
                        'System trajectory established',
                        'Irreversible paths identified',
                    ],
                    futureConstraints: [
                        'System locked into certain futures',
                        'Some possibilities become unreachable',
                        'Path-dependent evolution initiated',
                    ],
                    reversibility: 'low',
                },
            },
            {
                name: 'Future Super-system',
                focus: 'Environmental changes',
                emoji: '🌅',
                type: 'action',
                reflexiveEffects: {
                    triggers: [
                        'Projecting environmental evolution',
                        'Setting context boundaries',
                        'Defining external constraints',
                    ],
                    realityChanges: [
                        'Environmental trajectory defined',
                        'External constraints established',
                        'Context evolution initiated',
                    ],
                    futureConstraints: [
                        'Must work within projected environment',
                        'External factors shape possibilities',
                        'Environmental path dependencies created',
                    ],
                    reversibility: 'low',
                },
            },
        ];
        if (step < 1 || step > cells.length) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Nine Windows. Valid steps are 1-${cells.length}`, 'step', { providedStep: step, validRange: [1, cells.length] });
        }
        return cells[step - 1];
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 9) {
            return `Complete the Nine Windows process for: "${problem}"`;
        }
        const guidanceMap = {
            // Past
            1: `🔧 Past Sub-system: What component decisions and developments led to the current "${problem}"?`,
            2: `⚙️ Past System: How did the overall system evolve to create "${problem}" as it stands today?`,
            3: `🌍 Past Super-system: What environmental/contextual factors around "${problem}" shaped the development?`,
            // Present
            4: `🔩 Present Sub-system: What are the current components of "${problem}" and their states?`,
            5: `🎯 Present System: What is the current system state regarding "${problem}"?`,
            6: `🏞️ Present Super-system: What is the current environment and context surrounding "${problem}"?`,
            // Future
            7: `🚀 Future Sub-system: How might the components of "${problem}" evolve? What path dependencies exist?`,
            8: `🎪 Future System: What system futures are possible for "${problem}"? Which paths are irreversible?`,
            9: `🌅 Future Super-system: As "${problem}" plays out, how might the environment change? What constraints will emerge?`,
        };
        return guidanceMap[step] || `Complete the Nine Windows process for: "${problem}"`;
    }
    /**
     * Report every window, labelled by the cell it belongs to.
     *
     * Only steps 2, 5 and 8 — the middle column — were read before, so the six
     * sub-system and super-system cells produced nothing however much was written
     * in them. That is most of the grid: the technique's whole claim is that the
     * system reads differently at three scales, and two of the three scales were
     * discarded on the way out.
     */
    extractInsights(history) {
        const totalSteps = this.getTechniqueInfo().totalSteps;
        const latestByStep = new Map();
        history.forEach((entry, index) => {
            // `currentCell` names the same window as `currentStep`; use it when the
            // caller sent coordinates instead of a step, and position only if neither.
            const step = entry.currentStep ??
                (entry.currentCell
                    ? this.getCellByCoordinates(entry.currentCell.timeFrame, entry.currentCell.systemLevel)
                    : index + 1);
            if (step >= 1 && step <= totalSteps) {
                latestByStep.set(step, entry);
            }
        });
        const insights = [];
        for (let step = 1; step <= totalSteps; step++) {
            const entry = latestByStep.get(step);
            if (!entry) {
                continue;
            }
            const stepName = this.getStepInfo(step).name;
            const output = entry.output?.trim();
            if (output) {
                const summary = firstSentence(output);
                if (summary.length > 0) {
                    insights.push(`${stepName}: ${summary}`);
                }
            }
            // Every dependency the caller listed, not just the first.
            if (Array.isArray(entry.interdependencies)) {
                entry.interdependencies.forEach(dependency => {
                    if (typeof dependency === 'string' && dependency.trim().length > 0) {
                        insights.push(`${stepName}: Key dependency: ${dependency.trim()}`);
                    }
                });
            }
            // The matrix is declared by the tool schema, validated cell by cell by
            // ObjectFieldValidator, and was then read by nothing.
            if (Array.isArray(entry.nineWindowsMatrix)) {
                entry.nineWindowsMatrix.forEach(cell => {
                    if (!cell || typeof cell.content !== 'string' || cell.content.trim().length === 0) {
                        return;
                    }
                    const notes = [];
                    if (Array.isArray(cell.pathDependencies) && cell.pathDependencies.length > 0) {
                        notes.push(`path dependencies: ${cell.pathDependencies.join(', ')}`);
                    }
                    if (cell.irreversible) {
                        notes.push('irreversible');
                    }
                    const suffix = notes.length > 0 ? ` (${notes.join('; ')})` : '';
                    insights.push(`Matrix ${cell.timeFrame} ${cell.systemLevel}: ${cell.content.trim()}${suffix}`);
                });
            }
        }
        // No completion banner. "Systemic understanding achieved across time and
        // scale" was appended whenever the last step ran, asserting a finding the
        // session never made; reaching step 9 is already visible from the step count.
        // A caller that repeats the whole matrix on every step should not have it
        // reported nine times.
        return [...new Set(insights)];
    }
    /**
     * Helper method to get cell info by coordinates
     */
    getCellByCoordinates(timeFrame, systemLevel) {
        const timeIndex = { past: 0, present: 1, future: 2 }[timeFrame];
        const levelIndex = { 'sub-system': 0, system: 1, 'super-system': 2 }[systemLevel];
        return timeIndex * 3 + levelIndex + 1;
    }
}
//# sourceMappingURL=NineWindowsHandler.js.map