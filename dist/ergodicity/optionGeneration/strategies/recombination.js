/**
 * Recombination Strategy - Create options by mixing existing elements
 */
import { BaseOptionStrategy } from './base.js';
export class RecombinationStrategy extends BaseOptionStrategy {
    strategyName = 'recombination';
    description = 'Generate new options by recombining existing elements in novel ways';
    typicalFlexibilityGain = { min: 0.15, max: 0.3 };
    applicableCategories = ['structural', 'process', 'technical'];
    isApplicable(context) {
        // Recombination works when there are multiple elements to mix
        const hasMultipleComponents = context.pathMemory.pathHistory.length > 5;
        const hasVariedDecisions = new Set(context.pathMemory.pathHistory.map(e => e.technique)).size > 2;
        return hasMultipleComponents && hasVariedDecisions;
    }
    generate(context) {
        const options = [];
        const elements = this.extractRecombinableElements(context);
        // Generate cross-pollination option
        const crossOption = this.createCrossPollinationOption(elements, context);
        if (crossOption && this.isCategoryAllowed(crossOption.category, context)) {
            options.push(crossOption);
        }
        // Generate hybrid solution option
        const hybridOption = this.createHybridOption(elements, context);
        if (hybridOption && this.isCategoryAllowed(hybridOption.category, context)) {
            options.push(hybridOption);
        }
        // Generate feature migration option
        const migrationOption = this.createFeatureMigrationOption(elements, context);
        if (migrationOption && this.isCategoryAllowed(migrationOption.category, context)) {
            options.push(migrationOption);
        }
        // Generate synthesis option
        const synthesisOption = this.createSynthesisOption(elements, context);
        if (synthesisOption && this.isCategoryAllowed(synthesisOption.category, context)) {
            options.push(synthesisOption);
        }
        return options;
    }
    estimateEffort(option) {
        if (option.name.includes('Feature'))
            return 'low';
        if (option.name.includes('Cross') || option.name.includes('Hybrid'))
            return 'medium';
        return 'high'; // Synthesis requires more integration work
    }
    extractRecombinableElements(context) {
        const analysis = {
            successfulPatterns: [],
            availableComponents: [],
            complementaryPairs: [],
            unusedCombinations: [],
        };
        // Extract successful patterns from low-commitment, high-option decisions
        const successfulDecisions = context.pathMemory.pathHistory
            .filter(e => e.commitmentLevel < 0.4 && e.optionsOpened.length > 1)
            .slice(-10);
        successfulDecisions.forEach(decision => {
            const pattern = this.extractPattern(decision.decision);
            if (pattern) {
                analysis.successfulPatterns.push(pattern);
            }
        });
        // Extract available components from all decisions
        context.pathMemory.pathHistory.forEach(event => {
            const components = this.extractComponents(event.decision);
            analysis.availableComponents.push(...components);
        });
        // Identify complementary pairs
        const techniques = Array.from(new Set(context.pathMemory.pathHistory.map(e => e.technique)));
        for (let i = 0; i < techniques.length - 1; i++) {
            for (let j = i + 1; j < techniques.length; j++) {
                if (this.areComplementary(techniques[i], techniques[j])) {
                    analysis.complementaryPairs.push([techniques[i], techniques[j]]);
                }
            }
        }
        // Identify unused combinations
        analysis.unusedCombinations = this.findUnusedCombinations(analysis.availableComponents);
        return analysis;
    }
    createCrossPollinationOption(elements, context) {
        if (elements.complementaryPairs.length === 0)
            return null;
        const [technique1, technique2] = elements.complementaryPairs[0];
        // Check if this combination has been tried before
        const previousAttempts = context.pathMemory.pathHistory.filter(e => e.decision.includes(technique1) && e.decision.includes(technique2)).length;
        // Adjust approach based on urgency and previous attempts
        const isUrgent = context.currentFlexibility.flexibilityScore < 0.35;
        const approach = previousAttempts > 0 ? 'alternative' : isUrgent ? 'rapid' : 'comprehensive';
        const actions = [
            `Review insights from ${technique1} approach`,
            `Review insights from ${technique2} approach`,
            'Identify complementary strengths',
            `Design ${approach} hybrid approach combining both`,
            `Test combined approach on ${context.sessionState?.problem || 'current challenge'}`,
        ];
        const noveltyNote = previousAttempts > 0
            ? ' Try a different integration angle this time.'
            : ' This fresh combination could unlock new insights.';
        return this.createOption(`Cross-Pollinate ${this.formatTechniqueName(technique1)} with ${this.formatTechniqueName(technique2)}`, `Combine insights from ${technique1} and ${technique2} approaches. Their complementary strengths can create solutions neither could achieve alone.${noveltyNote}`, 'process', actions, ['Review of both technique outputs', 'Open mindset for integration']);
    }
    createHybridOption(elements, context) {
        const pattern1 = elements.successfulPatterns[0] || 'incremental approach';
        const pattern2 = elements.successfulPatterns[1] || 'systematic analysis';
        // Check team constraints to adjust complexity
        const hasTeamConstraints = context.pathMemory.constraints.some(c => c.type === 'relational' || c.description.toLowerCase().includes('team'));
        const complexity = hasTeamConstraints ? 'simple' : 'comprehensive';
        const actions = [
            `Identify core strengths of ${pattern1}`,
            `Identify core strengths of ${pattern2}`,
            `Design ${complexity} integration points`,
            `Create ${complexity === 'simple' ? 'lightweight' : 'full'} hybrid framework`,
            `Apply to ${context.sessionState?.problem || 'specific use case'}`,
        ];
        const teamNote = hasTeamConstraints
            ? ' Keep it simple for easier team adoption.'
            : ' Build comprehensive framework for maximum impact.';
        return this.createOption('Create Hybrid Solution', `Merge ${pattern1} with ${pattern2} to create a hybrid approach. This combines proven elements in new ways to address current constraints.${teamNote}`, 'structural', actions, hasTeamConstraints
            ? ['Basic pattern documentation', 'Quick test setup']
            : ['Clear understanding of both patterns', 'Integration testing plan']);
    }
    createFeatureMigrationOption(elements, context) {
        const components = [...new Set(elements.availableComponents)];
        if (components.length < 2)
            return null;
        const sourceComponent = components[0];
        const targetComponent = components[1];
        // Check migration history to avoid repeated attempts
        const previousMigrations = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('migrate') ||
            e.decision.toLowerCase().includes('transfer')).length;
        // Adjust approach based on flexibility and previous attempts
        const isLowFlexibility = context.currentFlexibility.flexibilityScore < 0.35;
        const migrationStrategy = previousMigrations > 1 ? 'selective' : isLowFlexibility ? 'essential' : 'comprehensive';
        const actions = [
            `Analyze successful features in ${sourceComponent}`,
            `Assess compatibility with ${targetComponent}`,
            `Select ${migrationStrategy === 'selective' ? 'most critical' : migrationStrategy === 'essential' ? 'high-impact' : 'all valuable'} features`,
            `Adapt features for new context`,
            'Implement adapted features',
            `Measure impact on ${context.sessionState?.problem || 'current challenge'}`,
        ];
        const prerequisites = isLowFlexibility
            ? ['Quick feature analysis', 'Minimal adaptation plan']
            : ['Feature documentation', 'Adaptation guidelines', 'Testing environment'];
        const strategyNote = migrationStrategy === 'selective'
            ? ' Focus on features not yet tried.'
            : migrationStrategy === 'essential'
                ? ' Prioritize quick wins.'
                : ' Build complete feature transfer.';
        return this.createOption('Migrate Successful Features', `Transfer successful patterns from ${sourceComponent} to ${targetComponent}. Proven solutions in one area often work in others with adaptation.${strategyNote}`, 'technical', actions, prerequisites);
    }
    createSynthesisOption(elements, context) {
        const unusedCombo = elements.unusedCombinations[0] || 'structure + flexibility';
        // Check innovation appetite based on flexibility and past synthesis attempts
        const pastSynthesisAttempts = context.pathMemory.pathHistory.filter(e => e.decision.toLowerCase().includes('synthesize') ||
            e.decision.toLowerCase().includes('novel')).length;
        const isHighFlexibility = context.currentFlexibility.flexibilityScore > 0.6;
        const innovationLevel = pastSynthesisAttempts > 2 ? 'radical' : isHighFlexibility ? 'bold' : 'measured';
        const actions = [
            'Map all available elements and patterns',
            `Explore ${unusedCombo} combination potential`,
            `Design ${innovationLevel} synthesis framework`,
            `Create ${innovationLevel === 'measured' ? 'minimal' : 'comprehensive'} proof of concept`,
            'Refine based on results',
            `Scale to ${context.sessionState?.problem || 'full challenge'}`,
        ];
        // Adjust prerequisites based on risk tolerance
        const prerequisites = innovationLevel === 'radical'
            ? ['High risk tolerance', 'Innovation budget', 'Failure recovery plan']
            : innovationLevel === 'bold'
                ? ['Creative thinking time', 'Safe space for experimentation']
                : ['Clear success criteria', 'Limited test scope'];
        const innovationNote = innovationLevel === 'radical'
            ? ' Push boundaries with unconventional combinations.'
            : innovationLevel === 'bold'
                ? ' Explore creative possibilities with confidence.'
                : ' Start with safe experiments to build confidence.';
        return this.createOption('Synthesize New Approach', `Create novel solution by synthesizing ${unusedCombo}. Unexplored combinations often yield breakthrough insights.${innovationNote}`, 'structural', actions, prerequisites);
    }
    extractPattern(decision) {
        const patterns = [
            'incremental',
            'iterative',
            'parallel',
            'sequential',
            'modular',
            'integrated',
            'distributed',
            'centralized',
            'top-down',
            'bottom-up',
            'emergent',
            'planned',
        ];
        const lowerDecision = decision.toLowerCase();
        const found = patterns.find(p => lowerDecision.includes(p));
        if (found)
            return found + ' approach';
        // Extract action patterns
        if (lowerDecision.includes('test'))
            return 'test-driven approach';
        if (lowerDecision.includes('prototype'))
            return 'prototyping approach';
        if (lowerDecision.includes('analyze'))
            return 'analytical approach';
        return null;
    }
    extractComponents(decision) {
        const components = [];
        const words = decision.toLowerCase().split(/\s+/);
        // Look for component-like words
        const componentIndicators = [
            'system',
            'module',
            'component',
            'feature',
            'service',
            'layer',
            'interface',
            'process',
            'workflow',
            'tool',
        ];
        words.forEach((word, index) => {
            if (componentIndicators.some(indicator => word.includes(indicator))) {
                // Try to get the preceding word as qualifier
                if (index > 0 && words[index - 1].length > 2) {
                    components.push(`${words[index - 1]} ${word}`);
                }
                else {
                    components.push(word);
                }
            }
        });
        return components;
    }
    areComplementary(technique1, technique2) {
        const complementaryPairs = [
            ['six_hats', 'po'], // Systematic + creative
            ['scamper', 'concept_extraction'], // Modification + abstraction
            ['design_thinking', 'triz'], // User-focus + technical
            ['yes_and', 'random_entry'], // Building + exploring
        ];
        return complementaryPairs.some(([a, b]) => (technique1 === a && technique2 === b) || (technique1 === b && technique2 === a));
    }
    findUnusedCombinations(components) {
        const uniqueComponents = [...new Set(components)].slice(0, 5);
        // Generate simple binary combinations
        const binaryCombos = [
            'speed + quality',
            'flexibility + stability',
            'simplicity + power',
            'automation + control',
            'individual + collective',
        ];
        // Filter to unused based on component names
        const unused = binaryCombos.filter(combo => {
            const [part1, part2] = combo.split(' + ');
            return !uniqueComponents.some(c => c.includes(part1) && c.includes(part2));
        });
        return unused.slice(0, 3);
    }
    formatTechniqueName(technique) {
        const nameMap = {
            six_hats: 'Six Hats',
            po: 'PO',
            random_entry: 'Random Entry',
            scamper: 'SCAMPER',
            concept_extraction: 'Concept Extraction',
            yes_and: 'Yes, And',
            design_thinking: 'Design Thinking',
            triz: 'TRIZ',
        };
        return nameMap[technique] || technique;
    }
}
//# sourceMappingURL=recombination.js.map