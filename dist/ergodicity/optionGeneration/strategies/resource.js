/**
 * Resource Strategy - Create options through resource reallocation
 */
import { BaseOptionStrategy } from './base.js';
export class ResourceStrategy extends BaseOptionStrategy {
    strategyName = 'resource';
    description = 'Generate flexibility by reallocating, sharing, or reimagining resources';
    typicalFlexibilityGain = { min: 0.15, max: 0.35 };
    applicableCategories = ['resource', 'process'];
    isApplicable(context) {
        // Look for resource-related constraints
        const hasResourceConstraints = context.pathMemory.constraints.some(c => c.type === 'resource' ||
            c.description.toLowerCase().includes('resource') ||
            c.description.toLowerCase().includes('budget') ||
            c.description.toLowerCase().includes('capacity') ||
            c.description.toLowerCase().includes('bandwidth'));
        const hasResourcePressure = context.currentFlexibility.flexibilityScore < 0.4 &&
            context.pathMemory.constraints.length > 3;
        return hasResourceConstraints || hasResourcePressure;
    }
    generate(context) {
        const options = [];
        const resources = this.analyzeResourceAllocation(context);
        // Generate reallocation option
        const reallocationOption = this.createReallocationOption(resources, context);
        if (reallocationOption && this.isCategoryAllowed(reallocationOption.category, context)) {
            options.push(reallocationOption);
        }
        // Generate resource sharing option
        const sharingOption = this.createResourceSharingOption(resources, context);
        if (sharingOption && this.isCategoryAllowed(sharingOption.category, context)) {
            options.push(sharingOption);
        }
        // Generate resource substitution option
        const substitutionOption = this.createSubstitutionOption(resources, context);
        if (substitutionOption && this.isCategoryAllowed(substitutionOption.category, context)) {
            options.push(substitutionOption);
        }
        // Generate resource multiplication option
        const multiplicationOption = this.createMultiplicationOption(resources, context);
        if (multiplicationOption && this.isCategoryAllowed(multiplicationOption.category, context)) {
            options.push(multiplicationOption);
        }
        return options;
    }
    estimateEffort(option) {
        if (option.name.includes('Reallocate'))
            return 'low';
        if (option.name.includes('Share') || option.name.includes('Substitute'))
            return 'medium';
        return 'high'; // Multiplication strategies require more setup
    }
    analyzeResourceAllocation(context) {
        const analysis = {
            overAllocated: [],
            underUtilized: [],
            bottlenecks: [],
            substitutable: [],
            sharable: [],
        };
        // Analyze constraints for resource patterns
        context.pathMemory.constraints.forEach(c => {
            if (c.type === 'resource' || c.description.includes('resource')) {
                if (c.strength > 0.7) {
                    analysis.bottlenecks.push(this.extractResourceType(c.description));
                }
            }
        });
        // Analyze path history for resource usage patterns
        const recentDecisions = context.pathMemory.pathHistory.slice(-10);
        const resourceMentions = new Map();
        recentDecisions.forEach(event => {
            const resources = this.extractResourceMentions(event.decision);
            resources.forEach(r => {
                const count = resourceMentions.get(r) || 0;
                resourceMentions.set(r, count + 1);
            });
        });
        // Categorize resources
        resourceMentions.forEach((count, resource) => {
            if (count > 3) {
                analysis.overAllocated.push(resource);
            }
            else if (count === 1) {
                analysis.underUtilized.push(resource);
            }
        });
        // Identify substitutable and sharable resources
        analysis.substitutable = ['time', 'attention', 'expertise', 'tools'];
        analysis.sharable = ['knowledge', 'infrastructure', 'tools', 'data'];
        return analysis;
    }
    createReallocationOption(resources, context) {
        if (resources.overAllocated.length === 0 || resources.underUtilized.length === 0) {
            return this.createGeneralReallocationOption();
        }
        const fromResource = resources.overAllocated[0];
        const toResource = resources.underUtilized[0] || 'emerging priorities';
        // Check urgency and past reallocation attempts
        const isUrgent = context.currentFlexibility.flexibilityScore < 0.3;
        const pastReallocations = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('reallocate') ||
            e.decision.toLowerCase().includes('shift')).length;
        // Adjust reallocation percentage based on urgency and history
        const reallocationPercent = isUrgent ? '30-40%' : pastReallocations > 2 ? '10-15%' : '20-30%';
        const approach = isUrgent ? 'immediate' : 'phased';
        const actions = [
            `Audit current ${fromResource} allocation`,
            `Identify ${isUrgent ? 'immediate' : 'low-value'} ${fromResource} uses`,
            `Calculate potential impact of reallocation`,
            `${approach === 'immediate' ? 'Immediately shift' : 'Gradually shift'} ${reallocationPercent} of ${fromResource} to ${toResource}`,
            `Monitor impact and ${pastReallocations > 2 ? 'fine-tune' : 'adjust'}`,
        ];
        const prerequisites = isUrgent
            ? ['Quick stakeholder notification', 'Immediate execution plan']
            : ['Stakeholder agreement on priorities', 'Clear success metrics', 'Phased transition plan'];
        const urgencyNote = isUrgent
            ? ' Act quickly to restore flexibility.'
            : pastReallocations > 2
                ? ' Fine-tune previous reallocations.'
                : ' Systematic rebalancing for sustained impact.';
        return this.createOption(`Reallocate ${this.formatResourceName(fromResource)}`, `Shift ${fromResource} from over-allocated areas to ${toResource}. Current allocation shows imbalance that limits flexibility. Rebalancing creates room for new initiatives.${urgencyNote}`, 'resource', actions, prerequisites);
    }
    createResourceSharingOption(resources, context) {
        const sharableResource = resources.sharable.find(r => resources.bottlenecks.includes(r)) || resources.sharable[0];
        // Check for collaboration constraints and past sharing experiences
        const hasCollaborationConstraints = context.pathMemory.constraints.some(c => c.type === 'relational' || c.description.toLowerCase().includes('partner'));
        const pastSharingAttempts = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('share') || e.decision.toLowerCase().includes('pool')).length;
        // Adjust sharing model based on context
        const sharingModel = hasCollaborationConstraints
            ? 'lightweight'
            : pastSharingAttempts > 1
                ? 'mature'
                : 'structured';
        const actions = [
            `Identify ${sharableResource} that could be shared`,
            `Find ${sharingModel === 'lightweight' ? 'trusted' : 'potential'} sharing partners`,
            `Design ${sharingModel} sharing protocol/agreement`,
            `Implement ${sharingModel === 'mature' ? 'advanced' : 'basic'} sharing infrastructure`,
            'Track usage and benefits',
            pastSharingAttempts > 1 ? 'Optimize based on past learnings' : 'Iterate and improve',
        ];
        const prerequisites = sharingModel === 'lightweight'
            ? ['Trust-based relationships', 'Simple tracking system']
            : sharingModel === 'mature'
                ? ['Proven sharing framework', 'Automated tracking', 'Clear governance']
                : ['Partner alignment', 'Sharing infrastructure setup', 'Usage policies'];
        const modelNote = sharingModel === 'lightweight'
            ? ' Start with trusted partners and minimal overhead.'
            : sharingModel === 'mature'
                ? ' Build on proven sharing success with advanced features.'
                : ' Create structured framework for sustainable sharing.';
        return this.createOption(`Create ${this.formatResourceName(sharableResource)} Sharing Pool`, `Transform individual ${sharableResource} ownership into shared pool. This multiplies effective capacity without additional investment and creates collaborative benefits.${modelNote}`, 'resource', actions, prerequisites);
    }
    createSubstitutionOption(resources, context) {
        const bottleneckResource = resources.bottlenecks[0] || 'constrained resources';
        const substitute = this.findSubstitute(bottleneckResource);
        // Check past substitution attempts and flexibility level
        const pastSubstitutions = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('substitute') ||
            e.decision.toLowerCase().includes('replace')).length;
        const isHighPressure = context.currentFlexibility.flexibilityScore < 0.3;
        // Adjust substitution approach based on context
        const approach = pastSubstitutions > 2 ? 'innovative' : isHighPressure ? 'pragmatic' : 'systematic';
        const actions = [
            `Analyze ${bottleneckResource} usage patterns`,
            `Research ${approach === 'innovative' ? 'unconventional' : ''} ${substitute} as alternative`,
            `Pilot substitution in ${isHighPressure ? 'critical' : 'low-risk'} area`,
            'Document learnings and refine approach',
            `${approach === 'pragmatic' ? 'Rapidly scale' : 'Scale'} successful substitutions`,
        ];
        const prerequisites = approach === 'innovative'
            ? ['Creative thinking session', 'Risk tolerance', 'Innovation budget']
            : approach === 'pragmatic'
                ? ['Quick validation method', 'Immediate implementation path']
                : ['Technical feasibility validated', 'Change management plan', 'Pilot environment'];
        const approachNote = approach === 'innovative'
            ? ' Previous substitutions worked - try bold alternatives.'
            : approach === 'pragmatic'
                ? ' Focus on proven substitutes for quick impact.'
                : ' Systematic approach ensures sustainable change.';
        return this.createOption(`Substitute ${this.formatResourceName(bottleneckResource)} with ${substitute}`, `Replace scarce ${bottleneckResource} with abundant ${substitute}. This breaks dependency on constrained resources and opens new possibilities.${approachNote}`, 'resource', actions, prerequisites);
    }
    createMultiplicationOption(resources, context) {
        // Identify the most constrained resource to target for multiplication
        const targetResource = resources.bottlenecks[0] || resources.overAllocated[0] || 'key resources';
        // Check for technical capabilities and past automation attempts
        const hasTechnicalConstraints = context.pathMemory.constraints.some(c => c.type === 'technical' || c.description.toLowerCase().includes('technical'));
        const pastAutomationAttempts = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('automate') ||
            e.decision.toLowerCase().includes('template')).length;
        // Adjust multiplication strategy based on context
        const multiplicationStrategy = hasTechnicalConstraints
            ? 'manual'
            : pastAutomationAttempts > 1
                ? 'advanced'
                : 'balanced';
        const actions = [
            `Identify high-leverage ${targetResource} uses`,
            `Design ${multiplicationStrategy === 'manual' ? 'process-based' : 'automated'} amplification mechanisms`,
            `Create reusable ${multiplicationStrategy === 'advanced' ? 'smart' : ''} templates/frameworks`,
            multiplicationStrategy !== 'manual'
                ? 'Implement automation where possible'
                : 'Document repeatable processes',
            'Build network effects into resource use',
            `Measure multiplication factor achieved`,
        ];
        const prerequisites = multiplicationStrategy === 'manual'
            ? ['Process documentation capability', 'Team training time']
            : multiplicationStrategy === 'advanced'
                ? ['Technical infrastructure', 'Automation expertise', 'Measurement systems']
                : [
                    'Initial investment capacity',
                    'Long-term thinking alignment',
                    'Basic technical skills',
                ];
        const strategyNote = multiplicationStrategy === 'manual'
            ? ' Focus on process and knowledge multiplication.'
            : multiplicationStrategy === 'advanced'
                ? ' Leverage existing automation success for exponential impact.'
                : ' Balance automation with practical process improvements.';
        return this.createOption('Multiply Resource Impact', `Transform one-time ${targetResource} use into reusable assets. Create templates, ${multiplicationStrategy === 'manual' ? 'processes' : 'automation'}, and network effects that multiply the impact of every resource unit invested.${strategyNote}`, 'resource', actions, prerequisites);
    }
    extractResourceType(description) {
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('time'))
            return 'time';
        if (lowerDesc.includes('budget') || lowerDesc.includes('money'))
            return 'budget';
        if (lowerDesc.includes('people') || lowerDesc.includes('team'))
            return 'people';
        if (lowerDesc.includes('attention') || lowerDesc.includes('focus'))
            return 'attention';
        if (lowerDesc.includes('expertise') || lowerDesc.includes('skill'))
            return 'expertise';
        if (lowerDesc.includes('tool') || lowerDesc.includes('system'))
            return 'tools';
        return 'resources';
    }
    extractResourceMentions(text) {
        const resources = [];
        const lowerText = text.toLowerCase();
        const resourceTypes = [
            'time',
            'budget',
            'people',
            'team',
            'attention',
            'focus',
            'expertise',
            'tools',
            'infrastructure',
            'data',
            'knowledge',
            'capacity',
            'bandwidth',
        ];
        resourceTypes.forEach(resource => {
            if (lowerText.includes(resource)) {
                resources.push(resource);
            }
        });
        return resources;
    }
    formatResourceName(resource) {
        // Capitalize first letter
        return resource.charAt(0).toUpperCase() + resource.slice(1);
    }
    findSubstitute(resource) {
        const substitutionMap = {
            time: 'automation',
            budget: 'creativity',
            people: 'processes',
            expertise: 'learning systems',
            attention: 'prioritization',
            tools: 'open-source alternatives',
            infrastructure: 'cloud services',
        };
        return substitutionMap[resource] || 'alternative approaches';
    }
    createGeneralReallocationOption() {
        return this.createOption('Optimize Resource Allocation', 'Conduct comprehensive resource audit to identify misallocations. Even small shifts from low-value to high-value activities can significantly increase flexibility.', 'resource', [
            'Map current resource allocation',
            'Identify value generated per resource unit',
            'Find bottom 20% value activities',
            'Reallocate to top opportunities',
            'Track impact metrics',
        ], ['Leadership support for audit', 'Clear value metrics']);
    }
}
//# sourceMappingURL=resource.js.map