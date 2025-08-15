/**
 * Temporal Work technique handler
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class TemporalWorkHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Map Temporal Landscape',
            focus: 'Identify time constraints and opportunities',
            emoji: '🗺️',
            type: 'thinking', // Analysis and mapping
        },
        {
            name: 'Circadian Alignment',
            focus: 'Align with natural rhythms',
            emoji: '🌅',
            type: 'thinking', // Analysis of patterns
        },
        {
            name: 'Pressure Transformation',
            focus: 'Convert time pressure into creative force',
            emoji: '💎',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Transforming time pressure', 'Creating deadline structures', 'Establishing temporal constraints'],
                realityChanges: ['Pressure dynamics established', 'Creative constraints in place', 'Time-boxed commitments made'],
                futureConstraints: ['Must work within pressure framework', 'Deadlines become immovable', 'Creative constraints lock in'],
                reversibility: 'medium',
            },
        },
        {
            name: 'Async-Sync Balance',
            focus: 'Design information flow patterns',
            emoji: '⚖️',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Establishing async patterns', 'Creating sync points', 'Designing flow structures'],
                realityChanges: ['Communication patterns set', 'Synchronization points fixed', 'Information flow established'],
                futureConstraints: ['Must maintain async/sync balance', 'Communication patterns persist', 'Flow structures become dependencies'],
                reversibility: 'medium',
            },
        },
        {
            name: 'Temporal Escape Routes',
            focus: 'Build flexibility and recovery options',
            emoji: '🚪',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Creating escape routes', 'Building recovery options', 'Establishing flexibility buffers'],
                realityChanges: ['Escape mechanisms in place', 'Recovery paths established', 'Flexibility buffers active'],
                futureConstraints: ['Must maintain escape routes', 'Recovery options become expectations', 'Flexibility has costs'],
                reversibility: 'high',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Temporal Work Design',
            emoji: '⏰',
            totalSteps: 5,
            description: 'Design solutions considering time dynamics and flexibility',
            focus: 'Work with time as a design material',
            parallelSteps: {
                canParallelize: false,
                description: 'Temporal analysis builds progressively through time landscapes',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Temporal Work technique. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: [1, this.steps.length] });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        // Handle out of bounds gracefully
        if (step < 1 || step > 5) {
            return `Complete the Temporal Work Design process for "${problem}"`;
        }
        switch (step) {
            case 1:
                return `🗺️ Map the temporal landscape of "${problem}". What are fixed deadlines vs flexible windows?`;
            case 2:
                return `🌅 Analyze circadian rhythms and natural patterns. How can the solution align with natural rhythms? When is the best time for different activities?`;
            case 3:
                return `💎 Transform time pressure into creative force. How can constraints enhance rather than limit?`;
            case 4:
                return `⚖️ Balance async and sync work. What needs real-time coordination vs independent progress?`;
            case 5:
                return `🚪 Design temporal escape routes. How can we build in flexibility and recovery time?`;
            default:
                return `Complete the Temporal Work Design process for "${problem}"`;
        }
    }
    extractInsights(history) {
        const insights = [];
        history.forEach(entry => {
            if (entry.currentStep === 1 && entry.temporalLandscape) {
                if (entry.temporalLandscape.fixedDeadlines &&
                    entry.temporalLandscape.fixedDeadlines.length > 0) {
                    insights.push(`Fixed deadline: ${entry.temporalLandscape.fixedDeadlines[0]}`);
                }
                if (entry.temporalLandscape.kairosOpportunities &&
                    entry.temporalLandscape.kairosOpportunities.length > 0) {
                    insights.push(`Opportunity window: ${entry.temporalLandscape.kairosOpportunities[0]}`);
                }
            }
            if (entry.currentStep === 5 &&
                entry.temporalEscapeRoutes &&
                entry.temporalEscapeRoutes.length > 0) {
                insights.push(`Escape route: ${entry.temporalEscapeRoutes[0]}`);
            }
            // Add completion insight when all 5 steps are done
            if (entry.currentStep === 5 && !entry.nextStepNeeded) {
                insights.push('Temporal Work Design completed for optimized creative scheduling');
            }
        });
        return insights;
    }
}
//# sourceMappingURL=TemporalWorkHandler.js.map