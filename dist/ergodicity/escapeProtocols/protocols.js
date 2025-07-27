/**
 * Five-level escape protocol implementations
 */
import { EscapeLevel } from './types.js';
/**
 * Level 1: Pattern Interruption
 * Quick, low-cost interventions to break thinking patterns
 */
export class PatternInterruptionProtocol {
    level = EscapeLevel.PATTERN_INTERRUPTION;
    name = 'Pattern Interruption';
    description = 'Break current thinking patterns to create mental flexibility';
    requiredFlexibility = 0.1;
    estimatedFlexibilityGain = 0.3;
    successProbability = 0.8;
    executionTime = '5-15 minutes';
    automaticTrigger = false;
    steps = [
        'Stop current approach immediately',
        'Apply random stimulus or constraint',
        'Invert all current assumptions',
        'Change evaluation criteria drastically',
        'Seek opposite perspective',
        'Question fundamental purpose',
    ];
    risks = [
        'May feel disorienting initially',
        'Temporary loss of progress',
        'Stakeholder confusion',
        'Need to rebuild momentum',
    ];
    execute(context) {
        const startFlexibility = context.currentFlexibility.flexibilityScore;
        const executionNotes = [];
        const newOptions = [];
        // Random interruption selection
        const interruptions = [
            'What if we did the exact opposite?',
            'How would a 5-year-old solve this?',
            'What if money/time were no constraint?',
            'How would this work on Mars?',
            'What if we had to solve this in 5 minutes?',
            'How would nature solve this problem?',
        ];
        const selectedInterruption = interruptions[Math.floor(Math.random() * interruptions.length)];
        executionNotes.push(`Applied interruption: ${selectedInterruption}`);
        // Generate new options based on interruption
        newOptions.push('Simplified approach ignoring current constraints', 'Radical rethinking of problem definition', 'Unconventional resource utilization', 'Time-shifted solution strategy');
        // Calculate flexibility gain
        const flexibilityGain = 0.2 + Math.random() * 0.2; // 0.2-0.4 gain
        return {
            protocol: this,
            success: true,
            flexibilityBefore: startFlexibility,
            flexibilityAfter: Math.min(1, startFlexibility + flexibilityGain),
            flexibilityGained: flexibilityGain,
            constraintsRemoved: ['Mental fixation', 'Assumption lock-in'],
            newOptionsCreated: newOptions,
            executionNotes,
            timestamp: new Date().toISOString(),
            duration: 10 * 60 * 1000, // 10 minutes
        };
    }
}
/**
 * Level 2: Resource Reallocation
 * Shift resources to create new paths
 */
export class ResourceReallocationProtocol {
    level = EscapeLevel.RESOURCE_REALLOCATION;
    name = 'Resource Reallocation';
    description = 'Strategically shift resources to open new possibilities';
    requiredFlexibility = 0.2;
    estimatedFlexibilityGain = 0.25;
    successProbability = 0.7;
    executionTime = '1-2 hours';
    automaticTrigger = false;
    steps = [
        'Inventory all current resource commitments',
        'Identify non-critical resource uses',
        'Calculate reallocation potential',
        'Free up 20-30% of resources',
        'Invest in exploration activities',
        'Create option buffer for future flexibility',
    ];
    risks = [
        'May slow current progress',
        'Stakeholder resistance to changes',
        'Short-term efficiency loss',
        'Coordination overhead',
    ];
    execute(context) {
        const startFlexibility = context.currentFlexibility.flexibilityScore;
        const executionNotes = [];
        const constraintsRemoved = [];
        // Identify reallocatable resources
        executionNotes.push('Analyzing resource allocation...');
        // Simulate resource freeing
        constraintsRemoved.push('Over-committed time resources', 'Locked budget allocations', 'Fixed team assignments');
        const newOptions = [
            'Exploration sprint allocation',
            'Innovation time budget',
            'Flexible resource pool',
            'Cross-functional collaboration',
        ];
        const flexibilityGain = 0.15 + Math.random() * 0.15; // 0.15-0.3 gain
        return {
            protocol: this,
            success: true,
            flexibilityBefore: startFlexibility,
            flexibilityAfter: Math.min(1, startFlexibility + flexibilityGain),
            flexibilityGained: flexibilityGain,
            constraintsRemoved,
            newOptionsCreated: newOptions,
            executionNotes,
            timestamp: new Date().toISOString(),
            duration: 90 * 60 * 1000, // 90 minutes
        };
    }
}
/**
 * Level 3: Stakeholder Reset
 * Renegotiate commitments and expectations
 */
export class StakeholderResetProtocol {
    level = EscapeLevel.STAKEHOLDER_RESET;
    name = 'Stakeholder Reset';
    description = 'Renegotiate commitments and reset expectations with stakeholders';
    requiredFlexibility = 0.3;
    estimatedFlexibilityGain = 0.35;
    successProbability = 0.6;
    executionTime = '1-2 days';
    automaticTrigger = false;
    steps = [
        'Map all stakeholder commitments',
        'Identify flexibility constraints from each',
        'Prepare reset communication strategy',
        'Conduct stakeholder conversations',
        'Renegotiate success criteria',
        'Document new agreements',
        'Communicate updated direction',
    ];
    risks = [
        'Potential trust impact',
        'Stakeholder disappointment',
        'Political capital cost',
        'Timeline extensions',
        'Scope creep risk',
    ];
    execute(context) {
        const startFlexibility = context.currentFlexibility.flexibilityScore;
        const executionNotes = [];
        executionNotes.push('Initiating stakeholder reset protocol...');
        executionNotes.push('Identifying key stakeholder constraints...');
        executionNotes.push('Preparing communication strategy...');
        const constraintsRemoved = [
            'Rigid success criteria',
            'Unrealistic timeline expectations',
            'Over-specified solution requirements',
            'Political commitments',
        ];
        const newOptions = [
            'Phased delivery approach',
            'MVP-first strategy',
            'Collaborative problem redefinition',
            'Flexible success metrics',
            'Iterative stakeholder engagement',
        ];
        const flexibilityGain = 0.25 + Math.random() * 0.2; // 0.25-0.45 gain
        return {
            protocol: this,
            success: true,
            flexibilityBefore: startFlexibility,
            flexibilityAfter: Math.min(1, startFlexibility + flexibilityGain),
            flexibilityGained: flexibilityGain,
            constraintsRemoved,
            newOptionsCreated: newOptions,
            executionNotes,
            timestamp: new Date().toISOString(),
            duration: 24 * 60 * 60 * 1000, // 1 day
        };
    }
}
/**
 * Level 4: Technical Refactoring
 * Deep architectural changes to restore flexibility
 */
export class TechnicalRefactoringProtocol {
    level = EscapeLevel.TECHNICAL_REFACTORING;
    name = 'Technical Refactoring';
    description = 'Deep architectural renewal to eliminate technical constraints';
    requiredFlexibility = 0.4;
    estimatedFlexibilityGain = 0.4;
    successProbability = 0.7;
    executionTime = '1-2 weeks';
    automaticTrigger = false;
    steps = [
        'Conduct technical debt assessment',
        'Identify architectural bottlenecks',
        'Design modular architecture',
        'Plan incremental refactoring',
        'Execute debt elimination sprint',
        'Implement interface liberation',
        'Create extension points',
        'Document new architecture',
    ];
    risks = [
        'Temporary feature freeze',
        'Regression risk',
        'Team bandwidth consumption',
        'Stakeholder impatience',
        'Integration challenges',
    ];
    execute(context) {
        const startFlexibility = context.currentFlexibility.flexibilityScore;
        const executionNotes = [];
        executionNotes.push('Analyzing technical debt landscape...');
        executionNotes.push('Identifying modularization opportunities...');
        executionNotes.push('Planning refactoring sequence...');
        const constraintsRemoved = [
            'Monolithic architecture',
            'Tight coupling between components',
            'Technical debt accumulation',
            'Legacy system dependencies',
            'Inflexible interfaces',
        ];
        const newOptions = [
            'Microservices architecture',
            'Plugin-based extensibility',
            'API-first design',
            'Continuous refactoring process',
            'Technical flexibility reserve',
        ];
        const flexibilityGain = 0.3 + Math.random() * 0.2; // 0.3-0.5 gain
        return {
            protocol: this,
            success: true,
            flexibilityBefore: startFlexibility,
            flexibilityAfter: Math.min(1, startFlexibility + flexibilityGain),
            flexibilityGained: flexibilityGain,
            constraintsRemoved,
            newOptionsCreated: newOptions,
            executionNotes,
            timestamp: new Date().toISOString(),
            duration: 7 * 24 * 60 * 60 * 1000, // 1 week
        };
    }
}
/**
 * Level 5: Strategic Pivot
 * Fundamental direction change
 */
export class StrategicPivotProtocol {
    level = EscapeLevel.STRATEGIC_PIVOT;
    name = 'Strategic Pivot';
    description = 'Fundamental strategic direction change to escape current constraints';
    requiredFlexibility = 0.5;
    estimatedFlexibilityGain = 0.6;
    successProbability = 0.5;
    executionTime = '2-4 weeks';
    automaticTrigger = false;
    steps = [
        'Acknowledge current strategy failure',
        'Conduct clean-slate analysis',
        'Explore alternative markets/approaches',
        'Design pivot strategy',
        'Secure stakeholder buy-in',
        'Plan transition roadmap',
        'Execute pivot with monitoring',
        'Establish new success metrics',
    ];
    risks = [
        'Major stakeholder resistance',
        'Team morale impact',
        'Market credibility questions',
        'Financial implications',
        'Execution complexity',
        'Identity crisis',
    ];
    execute(context) {
        const startFlexibility = context.currentFlexibility.flexibilityScore;
        const executionNotes = [];
        executionNotes.push('Initiating strategic pivot analysis...');
        executionNotes.push('Evaluating alternative strategic directions...');
        executionNotes.push('Designing pivot execution plan...');
        const constraintsRemoved = [
            'Market positioning lock-in',
            'Business model constraints',
            'Strategic commitments',
            'Identity limitations',
            'Historical path dependencies',
        ];
        const newOptions = [
            'New market opportunities',
            'Alternative business models',
            'Different value propositions',
            'Fresh strategic alliances',
            'Innovative go-to-market strategies',
            'Reimagined product vision',
        ];
        const flexibilityGain = 0.4 + Math.random() * 0.3; // 0.4-0.7 gain
        return {
            protocol: this,
            success: true,
            flexibilityBefore: startFlexibility,
            flexibilityAfter: Math.min(1, startFlexibility + flexibilityGain),
            flexibilityGained: flexibilityGain,
            constraintsRemoved,
            newOptionsCreated: newOptions,
            executionNotes,
            timestamp: new Date().toISOString(),
            duration: 14 * 24 * 60 * 60 * 1000, // 2 weeks
        };
    }
}
/**
 * Factory for creating escape protocols
 */
export class EscapeProtocolFactory {
    protocols = new Map();
    constructor() {
        this.protocols.set(EscapeLevel.PATTERN_INTERRUPTION, new PatternInterruptionProtocol());
        this.protocols.set(EscapeLevel.RESOURCE_REALLOCATION, new ResourceReallocationProtocol());
        this.protocols.set(EscapeLevel.STAKEHOLDER_RESET, new StakeholderResetProtocol());
        this.protocols.set(EscapeLevel.TECHNICAL_REFACTORING, new TechnicalRefactoringProtocol());
        this.protocols.set(EscapeLevel.STRATEGIC_PIVOT, new StrategicPivotProtocol());
    }
    getProtocol(level) {
        return this.protocols.get(level);
    }
    getAllProtocols() {
        return Array.from(this.protocols.values());
    }
    getAvailableProtocols(currentFlexibility) {
        return this.getAllProtocols().filter(p => p.requiredFlexibility <= currentFlexibility);
    }
    recommendProtocol(currentFlexibility, constraintStrength) {
        const available = this.getAvailableProtocols(currentFlexibility);
        if (available.length === 0) {
            return null;
        }
        // Choose protocol based on constraint strength
        if (constraintStrength > 0.8) {
            // Very high constraints - need aggressive protocol
            return available[available.length - 1]; // Highest level available
        }
        else if (constraintStrength > 0.5) {
            // Moderate constraints - middle ground
            const midIndex = Math.floor(available.length / 2);
            return available[midIndex];
        }
        else {
            // Low constraints - start with simple protocol
            return available[0];
        }
    }
}
//# sourceMappingURL=protocols.js.map