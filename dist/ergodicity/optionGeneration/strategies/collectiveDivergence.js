/**
 * Collective Divergence Strategy - Create options through group-based expansion and diverse perspectives
 */
import { BaseOptionStrategy } from './base.js';
export class CollectiveDivergenceStrategy extends BaseOptionStrategy {
    strategyName = 'collective_divergence';
    description = 'Create flexibility by leveraging collective intelligence and encouraging productive divergence';
    typicalFlexibilityGain = { min: 0.3, max: 0.5 };
    applicableCategories = ['relational', 'process', 'capability'];
    isApplicable(context) {
        // Look for situations where individual thinking is limited
        const hasIndividualLimitations = context.pathMemory.constraints.some(c => c.description.toLowerCase().includes('limited perspective') ||
            c.description.toLowerCase().includes('blind spot') ||
            c.description.toLowerCase().includes('expertise gap'));
        const hasGroupPotential = context.pathMemory.pathHistory.some(event => event.decision.toLowerCase().includes('team') ||
            event.decision.toLowerCase().includes('collective') ||
            event.decision.toLowerCase().includes('collaborate'));
        const needsDiversePerspectives = context.currentFlexibility.flexibilityScore < 0.35 ||
            context.pathMemory.pathHistory.filter(e => e.commitmentLevel > 0.8).length > 0;
        return hasIndividualLimitations || hasGroupPotential || needsDiversePerspectives;
    }
    generate(context) {
        const options = [];
        // Generate divergent brainstorming option
        const brainstormOption = this.createDivergentBrainstorming(context);
        if (brainstormOption && this.isCategoryAllowed(brainstormOption.category, context)) {
            options.push(brainstormOption);
        }
        // Generate perspective multiplication option
        const perspectiveOption = this.createPerspectiveMultiplication(context);
        if (perspectiveOption && this.isCategoryAllowed(perspectiveOption.category, context)) {
            options.push(perspectiveOption);
        }
        // Generate collective sensing option
        if (this.needsCollectiveSensing(context)) {
            const sensingOption = this.createCollectiveSensing(context);
            if (sensingOption && this.isCategoryAllowed(sensingOption.category, context)) {
                options.push(sensingOption);
            }
        }
        // Generate wisdom aggregation option
        const wisdomOption = this.createWisdomAggregation(context);
        if (wisdomOption && this.isCategoryAllowed(wisdomOption.category, context)) {
            options.push(wisdomOption);
        }
        return options;
    }
    estimateEffort(option) {
        if (option.name.includes('Brainstorming'))
            return 'medium';
        if (option.name.includes('Multiplication'))
            return 'low';
        if (option.name.includes('Sensing') || option.name.includes('Aggregation'))
            return 'high';
        return 'medium';
    }
    needsCollectiveSensing(context) {
        // Check if there are weak signals or emerging patterns
        const hasUncertainty = context.pathMemory.constraints.some(c => c.description.toLowerCase().includes('uncertain') ||
            c.description.toLowerCase().includes('emerging') ||
            c.description.toLowerCase().includes('unclear'));
        const hasComplexEnvironment = context.pathMemory.pathHistory.length > 15 &&
            context.pathMemory.flexibilityOverTime.some((f, i, arr) => i > 0 && Math.abs(f.score - arr[i - 1].score) > 0.2);
        return hasUncertainty || hasComplexEnvironment;
    }
    identifyDivergenceAreas(context) {
        const areas = [];
        // Look for areas where divergence would be valuable
        if (context.currentFlexibility.flexibilityScore < 0.3) {
            areas.push('Solution approaches');
        }
        if (context.pathMemory.constraints.length > 5) {
            areas.push('Constraint interpretations');
        }
        if (context.pathMemory.pathHistory.some(e => e.commitmentLevel > 0.7)) {
            areas.push('Alternative pathways');
        }
        areas.push('Hidden assumptions'); // Always valuable
        return areas;
    }
    createDivergentBrainstorming(context) {
        const divergenceAreas = this.identifyDivergenceAreas(context);
        return this.createOption('Structured Divergent Brainstorming', 'Organize collective ideation sessions that deliberately push beyond conventional boundaries. Use techniques that maximize idea diversity.', 'process', [
            'Set explicit divergence targets (e.g., 100 ideas minimum)',
            'Use provocative prompts and "what if" scenarios',
            'Employ nominal group technique to avoid convergence',
            'Rotate facilitators to bring different energy',
            `Focus on: ${divergenceAreas.join(', ')}`,
        ], ['Group availability', 'Facilitation skills', 'Psychological safety']);
    }
    createPerspectiveMultiplication(context) {
        // Use context to determine scope of perspective multiplication
        const hasLimitedPerspectives = context.pathMemory.constraints.some(c => c.description.toLowerCase().includes('limited perspective'));
        const scopeNote = hasLimitedPerspectives
            ? 'Focus especially on perspectives from outside the immediate domain'
            : 'Gather perspectives from both internal and external stakeholders';
        return this.createOption('Perspective Multiplication Protocol', 'Systematically gather and amplify diverse viewpoints by engaging unlikely stakeholders and perspectives.', 'relational', [
            'Identify "unusual suspects" - those typically not consulted',
            'Create perspective personas (novice, expert, outsider, critic)',
            'Use role rotation to force different viewpoints',
            'Document contrarian and edge-case perspectives',
            'Build perspective map showing idea landscape',
            scopeNote,
        ], ['Access to diverse stakeholders', 'Time for perspective gathering']);
    }
    createCollectiveSensing(context) {
        // Use context to determine sensing priorities
        const uncertaintyLevel = context.pathMemory.constraints.filter(c => c.description.toLowerCase().includes('uncertain')).length;
        const sensingPriority = uncertaintyLevel > 2
            ? 'Prioritize early warning signals and emerging risks'
            : 'Balance between current state monitoring and future signals';
        return this.createOption('Collective Sensing Network', 'Establish a distributed sensing system where multiple observers track weak signals and emerging patterns.', 'capability', [
            'Deploy observers across different contexts and levels',
            'Create shared sensing protocols and templates',
            'Establish regular pattern-sharing sessions',
            'Use collective sensemaking to identify trends',
            'Build early warning system from weak signals',
            sensingPriority,
        ], ['Network of willing observers', 'Communication infrastructure', 'Pattern recognition tools']);
    }
    createWisdomAggregation(context) {
        const currentConstraints = context.pathMemory.constraints.length;
        const aggregationScale = currentConstraints > 5
            ? 'Large-scale aggregation needed due to high constraint complexity'
            : 'Focused aggregation from key stakeholder groups';
        return this.createOption('Crowd Wisdom Aggregation', 'Harness collective intelligence through structured aggregation of diverse insights, predictions, and solutions.', 'process', [
            'Design prediction markets for key decisions',
            'Use Delphi method for expert consensus building',
            'Create idea tournaments with evolutionary selection',
            'Implement wisdom-of-crowds averaging for estimates',
            'Build synthesis protocols for qualitative insights',
            aggregationScale,
        ], ['Diverse participant pool', 'Aggregation mechanisms', 'Incentive structures']);
    }
}
//# sourceMappingURL=collectiveDivergence.js.map