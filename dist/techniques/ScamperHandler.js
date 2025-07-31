/**
 * SCAMPER technique handler with Path Dependency Analysis
 */
import { BaseTechniqueHandler } from './types.js';
// Constants for path degradation factors
const HIGH_COMMITMENT_DEGRADATION_FACTOR = 0.7; // Flexibility loss per high commitment action
const STEP_DEGRADATION_FACTOR = 0.95; // Gradual flexibility loss per step
const MINIMUM_FLEXIBILITY_THRESHOLD = 0.01; // Minimum flexibility to maintain tracking
export class ScamperHandler extends BaseTechniqueHandler {
    actions = {
        substitute: {
            description: 'Replace components or elements',
            emoji: '🔄',
            riskQuestion: 'What dependencies will the substitution create?',
            pathIndicator: '⚠️ Medium commitment',
            commitmentLevel: 'medium',
            typicalReversibilityCost: 0.25,
        },
        combine: {
            description: 'Merge elements or ideas',
            emoji: '🔗',
            riskQuestion: 'Will combining make future separation difficult?',
            pathIndicator: '🔒 High commitment',
            commitmentLevel: 'high',
            typicalReversibilityCost: 0.8,
        },
        adapt: {
            description: 'Adjust for different context',
            emoji: '🔧',
            riskQuestion: 'What flexibility do we lose through adaptation?',
            pathIndicator: '⚠️ Medium commitment',
            commitmentLevel: 'medium',
            typicalReversibilityCost: 0.4,
        },
        modify: {
            description: 'Change attributes or qualities',
            emoji: '✏️',
            riskQuestion: 'Can modifications be easily reverted?',
            pathIndicator: '🔄 Low commitment',
            commitmentLevel: 'low',
            typicalReversibilityCost: 0.2,
        },
        put_to_other_use: {
            description: 'Find new applications',
            emoji: '🎯',
            riskQuestion: 'Does repurposing close off original uses?',
            pathIndicator: '🔄 Low commitment',
            commitmentLevel: 'low',
            typicalReversibilityCost: 0.1,
        },
        eliminate: {
            description: 'Remove elements',
            emoji: '❌',
            riskQuestion: 'What is permanently lost through elimination?',
            pathIndicator: '🔒 Irreversible',
            commitmentLevel: 'irreversible',
            typicalReversibilityCost: 0.85,
        },
        reverse: {
            description: 'Invert or rearrange',
            emoji: '🔀',
            riskQuestion: 'What assumptions does reversal challenge?',
            pathIndicator: '🔄 Low commitment',
            commitmentLevel: 'low',
            typicalReversibilityCost: 0.3,
        },
        parameterize: {
            description: 'Identify and vary key parameters systematically',
            emoji: '🔢',
            riskQuestion: 'Which parameters create path dependencies when changed?',
            pathIndicator: '⚠️ Variable commitment',
            commitmentLevel: 'medium',
            typicalReversibilityCost: 0.35,
        },
    };
    actionOrder = [
        'substitute',
        'combine',
        'adapt',
        'modify',
        'put_to_other_use',
        'eliminate',
        'reverse',
        'parameterize',
    ];
    getTechniqueInfo() {
        return {
            name: 'SCAMPER+P',
            emoji: '🔧',
            totalSteps: 8,
            description: 'Systematic creative modification with path dependency awareness',
            focus: 'Transform through structured modifications',
            enhancedFocus: 'Now includes Parameterize and PDA (Path Dependency Analysis) for each action',
        };
    }
    getStepInfo(step) {
        const action = this.actionOrder[step - 1];
        if (!action) {
            throw new Error(`Invalid step ${step} for SCAMPER`);
        }
        const info = this.actions[action];
        return {
            name: action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' '),
            focus: `${info.description} ${info.pathIndicator}`,
            emoji: info.emoji,
        };
    }
    getStepGuidance(step, problem) {
        const action = this.actionOrder[step - 1];
        const info = this.actions[action];
        return `${info.emoji} ${action.toUpperCase()}: ${info.description} for "${problem}". ${info.riskQuestion}`;
    }
    analyzePathImpact(action, modification, history) {
        const actionInfo = this.actions[action];
        if (!actionInfo) {
            throw new Error(`Invalid SCAMPER action: ${action}`);
        }
        // Base impact from action type
        const baseImpact = {
            reversible: actionInfo.commitmentLevel === 'low' || actionInfo.commitmentLevel === 'medium',
            dependenciesCreated: this.identifyDependencies(action, modification),
            optionsClosed: this.identifyClosedOptions(action, modification),
            optionsOpened: this.identifyOpenedOptions(action, modification),
            flexibilityRetention: 1 - actionInfo.typicalReversibilityCost,
            commitmentLevel: actionInfo.commitmentLevel,
        };
        // Adjust based on history
        if (history.length > 0) {
            const cumulativeCommitment = this.calculateCumulativeCommitment(history);
            // More aggressive degradation for cumulative effects
            const degradationFactor = Math.max(0.1, 1 - cumulativeCommitment * 0.5);
            baseImpact.flexibilityRetention *= degradationFactor;
            // Further reduce based on number of high-commitment actions
            const highCommitmentCount = history.filter(h => {
                const action = this.actions[h.scamperAction];
                return (action && (action.commitmentLevel === 'high' || action.commitmentLevel === 'irreversible'));
            }).length;
            if (highCommitmentCount > 0) {
                baseImpact.flexibilityRetention *= Math.pow(HIGH_COMMITMENT_DEGRADATION_FACTOR, highCommitmentCount);
            }
            // Additional degradation based on step count to ensure monotonic decrease
            baseImpact.flexibilityRetention *= Math.pow(STEP_DEGRADATION_FACTOR, history.length);
            // Ensure minimum flexibility for tracking purposes
            baseImpact.flexibilityRetention = Math.max(MINIMUM_FLEXIBILITY_THRESHOLD, baseImpact.flexibilityRetention);
        }
        // Add recovery path for all actions
        baseImpact.recoveryPath = this.generateRecoveryPath(action);
        return baseImpact;
    }
    identifyDependencies(action, _modification) {
        const dependencies = [];
        switch (action) {
            case 'substitute':
                dependencies.push('New component compatibility');
                dependencies.push('Integration requirements');
                break;
            case 'combine':
                dependencies.push('Coupled functionality');
                dependencies.push('Shared resources');
                break;
            case 'adapt':
                dependencies.push('Context-specific adjustments');
                dependencies.push('Environmental constraints');
                break;
            case 'eliminate':
                dependencies.push('Removed functionality dependencies');
                dependencies.push('Downstream process impacts');
                break;
            case 'parameterize':
                dependencies.push('Parameter range constraints');
                dependencies.push('Variable interdependencies');
                dependencies.push('Configuration management');
                break;
        }
        return dependencies;
    }
    identifyClosedOptions(action, _modification) {
        const closed = [];
        switch (action) {
            case 'eliminate':
                closed.push('Restoration of removed elements');
                closed.push('Features dependent on eliminated elements');
                break;
            case 'combine':
                closed.push('Independent operation of elements');
                closed.push('Separate scaling strategies');
                break;
            case 'substitute':
                closed.push('Using original component');
                closed.push('Hybrid approaches with old element');
                break;
            case 'parameterize':
                closed.push('Fixed value approaches');
                closed.push('Non-configurable implementations');
                break;
        }
        return closed;
    }
    identifyOpenedOptions(action, _modification) {
        const opened = [];
        switch (action) {
            case 'substitute':
                opened.push('New material properties to exploit');
                opened.push('Different optimization paths');
                break;
            case 'combine':
                opened.push('Synergistic enhancements');
                opened.push('Unified interface opportunities');
                break;
            case 'put_to_other_use':
                opened.push('New market segments');
                opened.push('Cross-domain solutions');
                break;
            case 'reverse':
                opened.push('Counter-intuitive approaches');
                opened.push('Paradigm shift opportunities');
                break;
            case 'parameterize':
                opened.push('Configuration optimization space');
                opened.push('Dynamic adaptation capabilities');
                opened.push('A/B testing opportunities');
                break;
        }
        return opened;
    }
    calculateCumulativeCommitment(history) {
        let commitment = 0;
        history.forEach(entry => {
            if (entry.scamperAction) {
                const actionInfo = this.actions[entry.scamperAction];
                if (actionInfo) {
                    commitment += actionInfo.typicalReversibilityCost;
                }
            }
        });
        return Math.min(commitment, 1);
    }
    generateRecoveryPath(action) {
        switch (action) {
            case 'eliminate':
                return 'Requires complete reconstruction from scratch';
            case 'combine':
                return 'Maintain modular interfaces to enable future separation if needed';
            case 'reverse':
                return 'Reverse again to restore original arrangement';
            case 'adapt':
                return 'Remove adaptations to restore original design';
            case 'substitute':
                return 'Revert to original component with documentation';
            case 'modify':
                return 'Undo modifications to restore previous state';
            case 'put_to_other_use':
                return 'Return to original use case';
            case 'parameterize':
                return 'Lock parameters to stable values or implement versioning';
            default:
                return 'Create rollback plan before implementing modification';
        }
    }
    generateAlternatives(action, currentFlexibility) {
        if (currentFlexibility > 0.4) {
            return []; // No alternatives needed if flexibility is adequate
        }
        const alternatives = [];
        const actionInfo = this.actions[action];
        // Add critical warning if flexibility is very low
        if (currentFlexibility < 0.3) {
            alternatives.push('⚠️ Critical flexibility warning! Consider:');
            alternatives.push('Try "Modify" instead - it preserves more options');
        }
        // Suggest lower commitment alternatives
        if (actionInfo.commitmentLevel === 'irreversible' || actionInfo.commitmentLevel === 'high') {
            alternatives.push('Consider a reversible pilot/prototype first');
            alternatives.push('Implement in phases with checkpoints');
            alternatives.push('Create a simulation before full implementation');
        }
        // Action-specific alternatives
        switch (action) {
            case 'eliminate':
                alternatives.push('Archive instead of delete');
                alternatives.push('Deprecate gradually');
                alternatives.push('Move to optional/plugin architecture');
                break;
            case 'combine':
                alternatives.push('Loose coupling with interfaces');
                alternatives.push('Federation instead of fusion');
                alternatives.push('Temporary partnership first');
                break;
            case 'substitute':
                alternatives.push('A/B testing both options');
                alternatives.push('Gradual migration strategy');
                alternatives.push('Maintain compatibility layer');
                break;
        }
        return alternatives;
    }
    getAction(step) {
        return this.actionOrder[step - 1];
    }
    getAllActions() {
        return { ...this.actions };
    }
}
//# sourceMappingURL=ScamperHandler.js.map