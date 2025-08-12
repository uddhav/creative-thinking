/**
 * Cultural Creativity Orchestration Framework technique handler
 *
 * Enables multi-cultural synthesis without appropriation through respectful integration protocols.
 * Creates new combinations that honor source cultures while generating novel solutions.
 *
 * Different from existing techniques:
 * - cross_cultural: Integrates diverse cultural perspectives respectfully into solutions
 * - cultural_path: Navigates through cultural contexts to find viable solution pathways
 * - cultural_creativity: Orchestrates multi-cultural synthesis without appropriation
 *
 * This technique implements a 4-step respectful integration protocol that ensures
 * authentic collaboration and proper attribution while creating innovative combinations.
 */
import { BaseTechniqueHandler } from './types.js';
import { ValidationError, ErrorCode } from '../errors/types.js';
export class CulturalCreativityHandler extends BaseTechniqueHandler {
    steps = [
        {
            name: 'Cultural Mapping',
            focus: 'Map cultural contexts and frameworks',
            emoji: '🗺️',
            description: 'Understand historical contexts, recognize power dynamics, map cognitive frameworks, and document cultural constraints or taboos',
        },
        {
            name: 'Touchpoint Identification',
            focus: 'Find respectful connection points',
            emoji: '🤝',
            description: 'Discover natural connections, shared experiences, complementary strengths, and potential friction zones between cultures',
        },
        {
            name: 'Bridge Building',
            focus: 'Create respectful connections',
            emoji: '🌉',
            description: 'Develop translation protocols, design bidirectional exchange mechanisms, and build trust through authentic engagement',
        },
        {
            name: 'Authentic Synthesis',
            focus: 'Create new combinations with attribution',
            emoji: '🎨',
            description: 'Synthesize innovations that acknowledge all sources, avoid superficial adoption, and maintain cultural authenticity',
        },
    ];
    getTechniqueInfo() {
        return {
            name: 'Cultural Creativity Orchestration',
            emoji: '🌐',
            totalSteps: 4,
            description: 'Orchestrate multi-cultural creative synthesis without appropriation through respectful integration and proper attribution',
            focus: 'Respectful multi-cultural innovation synthesis',
            enhancedFocus: 'Creates culturally-aware innovations through mapping, touchpoint identification, bridge building, and authentic synthesis with full attribution',
            parallelSteps: {
                canParallelize: false,
                description: 'Steps build sequentially to ensure respectful integration',
            },
        };
    }
    getStepInfo(step) {
        const stepInfo = this.steps[step - 1];
        if (!stepInfo) {
            throw new ValidationError(ErrorCode.INVALID_STEP, `Invalid step ${step} for Cultural Creativity Orchestration. Valid steps are 1-${this.steps.length}`, 'step', { providedStep: step, validRange: `1-${this.steps.length}` });
        }
        return stepInfo;
    }
    getStepGuidance(step, problem) {
        const guidanceMap = {
            1: `Map cultural contexts for: "${problem}". Identify relevant cultural frameworks, historical contexts, and power dynamics. Document cognitive patterns from different cultures. Note any constraints, taboos, or sensitivities. Which cultural perspectives offer unique insights? What historical contexts must be considered? How do power dynamics affect this problem space?`,
            2: `Identify touchpoints for: "${problem}". Find natural connections between cultural approaches. Discover shared human experiences across cultures. Map complementary strengths from different traditions. Identify potential friction zones. Where do cultures naturally connect on this issue? What universal experiences unite different perspectives? Which strengths complement each other?`,
            3: `Build respectful bridges for: "${problem}". Create translation protocols between cultural concepts. Design bidirectional exchange mechanisms. Build trust through authentic engagement. Develop inclusive communication patterns. How can different cultural concepts be translated respectfully? What exchange mechanisms honor all participants? How do we ensure authentic rather than extractive engagement?`,
            4: `Synthesize with attribution for: "${problem}". Create new combinations that acknowledge all sources. Avoid superficial adoption of cultural elements. Maintain authenticity while innovating. Document cultural contributions clearly. Generate solutions that represent true collaboration. How do we properly attribute all cultural contributions? What new synthesis honors all sources while creating innovation?`,
        };
        return guidanceMap[step] || `Continue cultural creativity orchestration for: "${problem}"`;
    }
    validateStep(step, data) {
        if (!super.validateStep(step, data)) {
            return false;
        }
        // Add specific validation for cultural creativity fields
        if (!this.isValidStepData(data)) {
            return true; // No additional validation needed if no data object
        }
        const stepData = data;
        switch (step) {
            case 1:
                this.validateCulturalMapping(stepData);
                break;
            case 2:
                this.validateTouchpointIdentification(stepData);
                break;
            case 3:
                this.validateBridgeBuilding(stepData);
                break;
            case 4:
                this.validateAuthenticSynthesis(stepData);
                break;
        }
        return true;
    }
    /**
     * Type guard to check if data is a valid step data object
     */
    isValidStepData(data) {
        return typeof data === 'object' && data !== null;
    }
    /**
     * Validate cultural mapping step data
     * Expected format: { culturalContexts: string[], powerDynamics: { [key: string]: string } }
     */
    validateCulturalMapping(stepData) {
        if (!stepData.culturalContexts || !stepData.powerDynamics) {
            throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 1 requires both cultural contexts AND power dynamics analysis. ' +
                'Expected format: { culturalContexts: string[], powerDynamics: { [culture: string]: string } }', 'culturalMapping', {
                step: 1,
                technique: 'cultural_creativity',
                expectedFields: ['culturalContexts', 'powerDynamics'],
                example: {
                    culturalContexts: ['Western analytical', 'Eastern holistic'],
                    powerDynamics: { dominant: 'tech culture', marginalized: 'indigenous knowledge' },
                },
            });
        }
    }
    /**
     * Validate touchpoint identification step data
     * Expected format: { naturalConnections: string[], frictionZones: string[] }
     */
    validateTouchpointIdentification(stepData) {
        if (!stepData.naturalConnections || !stepData.frictionZones) {
            throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 2 requires both natural connections AND friction zones identification. ' +
                'Expected format: { naturalConnections: string[], frictionZones: string[] }', 'touchpointIdentification', {
                step: 2,
                technique: 'cultural_creativity',
                expectedFields: ['naturalConnections', 'frictionZones'],
                example: {
                    naturalConnections: ['shared value of innovation', 'common sustainability goals'],
                    frictionZones: ['different time orientations', 'conflicting decision-making styles'],
                },
            });
        }
    }
    /**
     * Validate bridge building step data
     * Expected format: { translationProtocols: object, trustMechanisms: string[] }
     */
    validateBridgeBuilding(stepData) {
        if (!stepData.translationProtocols || !stepData.trustMechanisms) {
            throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 3 requires both translation protocols AND trust mechanisms. ' +
                'Expected format: { translationProtocols: object, trustMechanisms: string[] }', 'bridgeBuilding', {
                step: 3,
                technique: 'cultural_creativity',
                expectedFields: ['translationProtocols', 'trustMechanisms'],
                example: {
                    translationProtocols: {
                        concept1: 'translated meaning',
                        concept2: 'cultural equivalent',
                    },
                    trustMechanisms: [
                        'reciprocal sharing',
                        'transparent attribution',
                        'continuous feedback',
                    ],
                },
            });
        }
    }
    /**
     * Validate authentic synthesis step data
     * Expected format: { attributionMap: object, authenticityMeasures: string[] }
     */
    validateAuthenticSynthesis(stepData) {
        if (!stepData.attributionMap || !stepData.authenticityMeasures) {
            throw new ValidationError(ErrorCode.MISSING_REQUIRED_FIELD, 'Step 4 requires both attribution map AND authenticity measures. ' +
                'Expected format: { attributionMap: object, authenticityMeasures: string[] }', 'synthesis', {
                step: 4,
                technique: 'cultural_creativity',
                expectedFields: ['attributionMap', 'authenticityMeasures'],
                example: {
                    attributionMap: { element1: 'source culture A', element2: 'source culture B' },
                    authenticityMeasures: [
                        'community validation',
                        'cultural expert review',
                        'source acknowledgment',
                    ],
                },
            });
        }
    }
    getPromptContext(step) {
        const stepInfo = this.getStepInfo(step);
        return {
            technique: 'cultural_creativity',
            step,
            stepName: stepInfo.name,
            focus: stepInfo.focus,
            emoji: stepInfo.emoji,
            principles: {
                attribution: 'Attribution over appropriation',
                depth: 'Depth over surface features',
                collaboration: 'Collaboration over extraction',
                evolution: 'Evolution over preservation',
                inclusion: 'Inclusion over universalization',
            },
            capabilities: {
                culturalMapping: 'Map contexts, power dynamics, and frameworks',
                touchpointIdentification: 'Find connections and complementary strengths',
                bridgeBuilding: 'Create respectful translation and exchange',
                synthesis: 'Generate attributed innovations with authenticity',
            },
        };
    }
}
//# sourceMappingURL=CulturalCreativityHandler.js.map