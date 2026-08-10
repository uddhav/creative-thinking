/**
 * Cultural Integration technique handler
 *
 * Consolidates CrossCultural and CulturalCreativity techniques into a unified approach
 * that combines bridge-building with creative synthesis for culturally-aware solutions.
 *
 * This technique merges:
 * - CrossCultural: Integration of diverse cultural perspectives
 * - CulturalCreativity: Multi-cultural synthesis without appropriation
 *
 * The unified approach provides comprehensive cultural integration through:
 * 1. Mapping cultural landscapes and power dynamics
 * 2. Identifying authentic connection points
 * 3. Building respectful bridges between cultures
 * 4. Weaving perspectives creatively
 * 5. Synthesizing solutions that honor all sources
 */
import { BaseTechniqueHandler, describeStructuredField, firstSentence, } from './types.js';
export class CulturalIntegrationHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Cultural Landscape Mapping',
            focus: 'Map cultural contexts, frameworks, and power dynamics',
            emoji: '🗺️',
            type: 'thinking',
        },
        {
            name: 'Touchpoint Discovery',
            focus: 'Find authentic connection opportunities',
            emoji: '🔍',
            type: 'thinking',
        },
        {
            name: 'Bridge Building',
            focus: 'Create respectful bidirectional connections',
            emoji: '🌉',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Building cultural bridges', 'Establishing connections'],
                realityChanges: [
                    'New relationships formed between cultural groups',
                    'Shared expectations and understanding created',
                    'Cultural boundaries become more permeable',
                    'Trust networks established',
                ],
                futureConstraints: [
                    'Must maintain established bridges',
                    'Cannot ignore connected communities',
                    'Bridge commitments require ongoing maintenance',
                    'Trust must be preserved through actions',
                ],
                reversibility: 'low',
            },
        },
        {
            name: 'Perspective Weaving',
            focus: 'Integrate diverse viewpoints creatively',
            emoji: '🎨',
            type: 'thinking',
        },
        {
            name: 'Respectful Synthesis',
            focus: 'Create culturally-aware adaptive solutions',
            emoji: '🤝',
            type: 'action',
            reflexiveEffects: {
                triggers: ['Implementing synthesis', 'Deploying solutions'],
                realityChanges: [
                    'New cultural combinations become reality',
                    'Attribution patterns established',
                    'Cultural creative landscape changed',
                    'Stakeholder expectations shift',
                ],
                futureConstraints: [
                    'Must honor attribution commitments',
                    'Solutions create precedents',
                    'Cultural groups expect continued respect',
                    'Innovation changes perception permanently',
                ],
                reversibility: 'medium',
            },
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Cultural Integration',
            emoji: '🌍',
            totalSteps: 5,
            description: 'Integrate diverse cultural perspectives through bridge-building and creative synthesis',
            focus: 'Create culturally-aware solutions that honor all sources',
            parallelSteps: {
                canParallelize: false,
                description: 'Cultural integration requires sequential respect to avoid appropriation',
            },
            reflexivityProfile: {
                primaryCommitmentType: 'relationship',
                overallReversibility: 'medium',
                riskLevel: 'medium',
            },
        };
    }
    getStepInfo(step) {
        return (this.steps[step - 1] || {
            name: 'Unknown Step',
            focus: 'Continue with Cultural Integration',
            emoji: '🌍',
        });
    }
    getStepGuidance(step, problem) {
        // Handle out-of-bounds steps as per test expectations
        if (step < 1 || step > this.steps.length) {
            return `Complete the Cultural Integration process for: "${problem}"`;
        }
        const guidanceMap = {
            1: `For "${problem}": What cultural frameworks are at play? What historical contexts matter? What power dynamics exist? What constraints or taboos should be respected?`,
            2: `For "${problem}": Where do cultures naturally connect? What shared experiences exist? What complementary strengths can be leveraged? Where might friction occur?`,
            3: `For "${problem}": How can you create authentic bridges? What translation is needed? How can trust be established? Remember: This step creates lasting relationships.`,
            4: `For "${problem}": How can perspectives combine creatively? How do you ensure proper attribution? What novel combinations honor all sources?`,
            5: `For "${problem}": How can insights become solutions? How do you maintain authenticity? How can solutions adapt to different contexts? Remember: This creates precedents.`,
        };
        return guidanceMap[step] || `Complete the Cultural Integration process for: "${problem}"`;
    }
    validateStep(step, data) {
        if (step < 1 || step > this.steps.length) {
            return false;
        }
        // Check for required output field
        if (typeof data === 'object' && data !== null) {
            const stepData = data;
            return stepData.output !== undefined && stepData.output !== null && stepData.output !== '';
        }
        return false;
    }
    /**
     * Report what each step actually recorded, labelled by the step.
     *
     * Keyed on `entry.currentStep`, not on position in the array: `execute`
     * appends a history entry for every call including revisions, so one revision
     * shifts every later entry. Keying on the step also means a revision
     * supersedes the entry it revises rather than reporting twice.
     *
     * The four cultural fields are reported wherever they arrive rather than
     * pinned to a step, unlike every other technique here. Two reasons: this
     * handler's `validateStep` requires no field on any step, so nothing in the
     * technique says which step a field belongs to; and the one place that does
     * assert a mapping — CrossCulturalInsightStrategy — disagrees with the step
     * names, reading `bridgeBuilding` at step 2 while the step named Bridge
     * Building is step 3. Binding to a step would encode one of those two
     * orderings as fact. Naming the field alongside the step keeps the report
     * true either way.
     *
     * They are reported by content, not by count. "3 cultural perspectives
     * identified" says a field had three entries and nothing about which three,
     * which is exactly the information a synthesis needs.
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
        const culturalFields = [
            ['culturalFrameworks', 'frameworks in play'],
            ['bridgeBuilding', 'bridges built'],
            ['respectfulSynthesis', 'synthesized approaches'],
            ['parallelPaths', 'parallel paths'],
        ];
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
            for (const [field, label] of culturalFields) {
                const recorded = describeStructuredField(entryObj[field]);
                if (recorded.length > 0) {
                    insights.push(`${stepName}: ${label} — ${recorded}`);
                }
            }
        }
        // No completion banner. Reaching step 5 is already visible from the step
        // count, and a fixed "culturally respectful solution achieved" asserts the
        // one finding this technique must never assert on the caller's behalf.
        return insights;
    }
}
//# sourceMappingURL=CulturalIntegrationHandler.js.map