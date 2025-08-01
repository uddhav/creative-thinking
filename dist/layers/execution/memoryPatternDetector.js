/**
 * Memory pattern detection for execution layer
 * Identifies recurring patterns and learning opportunities
 */
export class MemoryPatternDetector {
    /**
     * Detect patterns across session history
     */
    static detectPatterns(input, sessionId, sessionManager) {
        const session = sessionManager.getSession(sessionId);
        if (!session || !session.history || session.history.length < 2) {
            return null;
        }
        // Check for recurring themes
        const recurringPattern = this.detectRecurringThemes(session.history, input);
        if (recurringPattern)
            return recurringPattern;
        // Check for breakthrough moments
        const breakthroughPattern = this.detectBreakthroughs(session.history, input);
        if (breakthroughPattern)
            return breakthroughPattern;
        // Check for blockages
        const blockagePattern = this.detectBlockages(session.history, input);
        if (blockagePattern)
            return blockagePattern;
        // Check for technique synergies
        const synergyPattern = this.detectSynergies(session.history, input);
        if (synergyPattern)
            return synergyPattern;
        return null;
    }
    /**
     * Detect recurring themes in thinking
     */
    static detectRecurringThemes(history, currentInput) {
        const themes = new Map();
        // Extract key words from outputs
        const keywords = ['constraint', 'opportunity', 'risk', 'solution', 'approach', 'challenge'];
        for (const entry of history) {
            const text = (entry.output?.output || '') + (entry.input?.output || '');
            for (const keyword of keywords) {
                if (text.toLowerCase().includes(keyword)) {
                    themes.set(keyword, (themes.get(keyword) || 0) + 1);
                }
            }
        }
        // Check current input
        const currentText = currentInput.output.toLowerCase();
        for (const [theme, count] of themes) {
            if (currentText.includes(theme) && count >= 2) {
                return {
                    patternType: 'recurring',
                    description: `Recurring focus on "${theme}"`,
                    frequency: count + 1,
                    suggestion: `Consider if repeated ${theme} analysis is adding new value or circling`,
                };
            }
        }
        return null;
    }
    /**
     * Detect breakthrough moments
     */
    static detectBreakthroughs(history, currentInput) {
        // Look for sudden increase in output quality/length
        if (history.length >= 2) {
            const prevOutput = history[history.length - 1].input?.output || '';
            const currentOutput = currentInput.output;
            // Check for significant expansion
            if (currentOutput.length > prevOutput.length * 2 && currentOutput.length > 200) {
                return {
                    patternType: 'breakthrough',
                    description: 'Significant expansion in thinking depth',
                    suggestion: 'Build on this momentum with concrete applications',
                };
            }
            // Check for new connections
            if (currentInput.connections && currentInput.connections.length > 3) {
                return {
                    patternType: 'breakthrough',
                    description: 'Multiple new connections discovered',
                    relatedTechniques: [currentInput.technique],
                    suggestion: 'Explore these connections systematically',
                };
            }
        }
        return null;
    }
    /**
     * Detect thinking blockages
     */
    static detectBlockages(history, currentInput) {
        // Check for short, repetitive outputs
        if (currentInput.output.length < 50) {
            const recentShortOutputs = history.slice(-3).filter(entry => (entry.input?.output || '').length < 50).length;
            if (recentShortOutputs >= 2) {
                return {
                    patternType: 'blockage',
                    description: 'Consecutive brief outputs suggest thinking blockage',
                    suggestion: 'Try a different technique or take a different angle',
                };
            }
        }
        // Check for repeated "I don't know" patterns
        const uncertaintyPhrases = ['unclear', "don't know", 'not sure', 'maybe', 'perhaps'];
        const uncertaintyCount = uncertaintyPhrases.filter(phrase => currentInput.output.toLowerCase().includes(phrase)).length;
        if (uncertaintyCount >= 2) {
            return {
                patternType: 'blockage',
                description: 'High uncertainty blocking progress',
                suggestion: 'Break down the problem or gather more information',
            };
        }
        return null;
    }
    /**
     * Detect technique synergies
     */
    static detectSynergies(history, currentInput) {
        // Look for techniques that work well together
        const techniquesUsed = new Set();
        for (const entry of history) {
            if (entry.input?.technique) {
                techniquesUsed.add(entry.input.technique);
            }
        }
        techniquesUsed.add(currentInput.technique);
        // Known synergistic combinations
        const synergies = [
            { techniques: ['random_entry', 'scamper'], description: 'Random stimulus + transformation' },
            { techniques: ['six_hats', 'design_thinking'], description: 'Systematic thinking + user focus' },
            { techniques: ['triz', 'concept_extraction'], description: 'Contradiction resolution + pattern abstraction' },
            { techniques: ['po', 'yes_and'], description: 'Provocation + building' },
        ];
        for (const synergy of synergies) {
            const hasAll = synergy.techniques.every(t => techniquesUsed.has(t));
            if (hasAll) {
                return {
                    patternType: 'synergy',
                    description: synergy.description,
                    relatedTechniques: synergy.techniques,
                    suggestion: 'These techniques complement each other well - consider deeper integration',
                };
            }
        }
        return null;
    }
}
//# sourceMappingURL=memoryPatternDetector.js.map