/**
 * Visualization Generator
 * Creates visual representations of parallel results for LLM understanding
 */
import { getRiskCount } from './typeGuards.js';
import { MAX_VISUALIZATION_SIZE } from './constants.js';
export class VisualizationGenerator {
    // Helper to truncate visualization content
    truncateContent(content) {
        if (content.length <= MAX_VISUALIZATION_SIZE) {
            return content;
        }
        // Truncate with a note
        return content.substring(0, MAX_VISUALIZATION_SIZE - 50) + '\n\n[Truncated for size limits]';
    }
    generateVisualizations(results) {
        const visualizations = [];
        // Always include technique comparison
        visualizations.push(this.createTechniqueComparisonChart(results));
        // Add idea distribution if there are many ideas
        if (this.getTotalIdeaCount(results) > 10) {
            visualizations.push(this.createIdeaDistributionMap(results));
        }
        // Add risk matrix if risks are present
        if (this.hasRisks(results)) {
            visualizations.push(this.createRiskInnovationMatrix(results));
        }
        // Add synergy network if multiple techniques
        if (results.length > 2) {
            visualizations.push(this.createSynergyNetwork(results));
        }
        // Add timeline if temporal elements exist
        if (this.hasTemporalElements(results)) {
            visualizations.push(this.createTimelineVisualization(results));
        }
        return visualizations;
    }
    createTechniqueComparisonChart(results) {
        const data = results.map(r => ({
            technique: r.technique,
            ideaCount: this.countIdeas(r),
            insightCount: r.insights?.length || 0,
            riskCount: getRiskCount(r.results),
            completeness: this.calculateCompleteness(r),
            confidence: r.metrics?.confidence || 0,
        }));
        // Create markdown table
        const header = '| Technique | Ideas | Insights | Risks | Completeness | Confidence |';
        const separator = '|-----------|-------|----------|-------|--------------|------------|';
        const rows = data.map(d => `| ${d.technique} | ${d.ideaCount} | ${d.insightCount} | ${d.riskCount} | ${(d.completeness * 100).toFixed(0)}% | ${(d.confidence * 100).toFixed(0)}% |`);
        const content = [header, separator, ...rows].join('\n');
        return {
            type: 'comparison_chart',
            title: 'Technique Output Comparison',
            description: 'Comparative metrics across all parallel techniques',
            data,
            format: 'markdown_table',
            content: this.truncateContent(content),
        };
    }
    createIdeaDistributionMap(results) {
        const distribution = {};
        // Count ideas by category/technique
        results.forEach(result => {
            const ideas = this.extractAllIdeas(result);
            ideas.forEach(idea => {
                const category = this.categorizeIdea(idea);
                distribution[category] = (distribution[category] || 0) + 1;
            });
        });
        // Create ASCII bar chart
        const maxCount = Math.max(...Object.values(distribution));
        const scale = 40 / maxCount; // Max bar width of 40 chars
        const bars = Object.entries(distribution)
            .sort(([, a], [, b]) => b - a)
            .map(([category, count]) => {
            const barLength = Math.round(count * scale);
            const bar = '█'.repeat(barLength);
            return `${category.padEnd(15)} ${bar} ${count}`;
        });
        const content = ['Idea Distribution by Category', '─'.repeat(50), ...bars].join('\n');
        return {
            type: 'comparison_chart',
            title: 'Idea Distribution Map',
            description: 'Distribution of ideas across categories',
            data: distribution,
            format: 'ascii_art',
            content,
        };
    }
    createRiskInnovationMatrix(results) {
        // Create 2x2 matrix: Innovation (x) vs Risk (y)
        const matrix = [];
        results.forEach(result => {
            const innovation = this.assessInnovationLevel(result);
            const risk = this.assessRiskLevel(result);
            const quadrant = this.determineQuadrant(innovation, risk);
            matrix.push({
                technique: result.technique,
                innovation,
                risk,
                quadrant,
            });
        });
        // Create visual matrix
        const content = [
            'Risk vs Innovation Matrix',
            '',
            '    High Risk │ Caution Zone    │ High Risk/',
            '              │                 │ High Innovation',
            '    ──────────┼─────────────────┼──────────────',
            '              │                 │',
            '    Low Risk  │ Safe/           │ Sweet Spot:',
            '              │ Incremental     │ Low Risk/',
            '              │                 │ High Innovation',
            '              └─────────────────┴──────────────',
            '               Low Innovation    High Innovation',
            '',
            'Technique Positions:',
            ...matrix.map(m => `- ${m.technique}: ${m.quadrant} (Innovation: ${m.innovation.toFixed(1)}, Risk: ${m.risk.toFixed(1)})`),
        ].join('\n');
        return {
            type: 'matrix',
            title: 'Risk vs Innovation Matrix',
            description: 'Positioning techniques by risk level and innovation potential',
            data: matrix,
            format: 'ascii_art',
            content,
        };
    }
    createSynergyNetwork(results) {
        const nodes = results.map(r => ({
            id: r.technique,
            label: r.technique,
            ideaCount: this.countIdeas(r),
        }));
        const edges = this.findSynergyEdges(results);
        // Create Mermaid diagram
        const mermaidNodes = nodes.map((n, i) => `    ${String.fromCharCode(65 + i)}[${n.label}]`);
        const mermaidEdges = edges.map(e => `    ${e.from} ---|${e.strength}| ${e.to}`);
        const content = ['```mermaid', 'graph TD', ...mermaidNodes, ...mermaidEdges, '```'].join('\n');
        return {
            type: 'network_diagram',
            title: 'Technique Synergy Network',
            description: 'Potential synergies between different techniques',
            data: { nodes, edges },
            format: 'mermaid',
            content,
        };
    }
    createTimelineVisualization(results) {
        // Extract temporal elements from results
        const timelineEvents = [
            {
                phase: 'Immediate (0-2 weeks)',
                techniques: this.getTechniquesForTimeframe(results, 'immediate'),
                focus: 'Quick wins and foundation',
            },
            {
                phase: 'Short-term (2-8 weeks)',
                techniques: this.getTechniquesForTimeframe(results, 'short'),
                focus: 'Core implementation',
            },
            {
                phase: 'Long-term (2+ months)',
                techniques: this.getTechniquesForTimeframe(results, 'long'),
                focus: 'Optimization and scaling',
            },
        ];
        const content = [
            'Implementation Timeline',
            '═'.repeat(50),
            ...timelineEvents.map(event => [
                '',
                `▶ ${event.phase}`,
                `  Focus: ${event.focus}`,
                `  Techniques: ${event.techniques.join(', ') || 'All applicable'}`,
                '  ' + '─'.repeat(45),
            ].join('\n')),
        ].join('\n');
        return {
            type: 'timeline',
            title: 'Implementation Timeline',
            description: 'Suggested timeline for implementing ideas from different techniques',
            data: timelineEvents,
            format: 'ascii_art',
            content,
        };
    }
    // Helper methods
    getTotalIdeaCount(results) {
        return results.reduce((sum, r) => sum + this.countIdeas(r), 0);
    }
    countIdeas(result) {
        let count = result.insights?.length || 0;
        if (result.results && typeof result.results === 'object') {
            count += Object.keys(result.results).length;
        }
        return count;
    }
    hasRisks(results) {
        return results.some(r => {
            const resultData = r.results;
            const risks = resultData?.risks;
            return risks && risks.length > 0;
        });
    }
    hasTemporalElements(results) {
        // Check if any technique has temporal aspects
        return results.some(r => r.technique === 'temporal_work' ||
            r.insights?.some((i) => i.toLowerCase().includes('time') || i.toLowerCase().includes('phase')));
    }
    calculateCompleteness(result) {
        if (result.metrics?.completedSteps && result.metrics.totalSteps) {
            return result.metrics.completedSteps / result.metrics.totalSteps;
        }
        return 0.5; // Default to 50% if unknown
    }
    extractAllIdeas(result) {
        const ideas = [];
        if (result.insights) {
            ideas.push(...result.insights);
        }
        if (result.results && typeof result.results === 'object') {
            Object.values(result.results).forEach(value => {
                if (typeof value === 'string') {
                    ideas.push(value);
                }
            });
        }
        return ideas;
    }
    categorizeIdea(idea) {
        const categories = [
            { keywords: ['user', 'customer', 'experience'], category: 'User-focused' },
            { keywords: ['technical', 'system', 'architecture'], category: 'Technical' },
            { keywords: ['business', 'revenue', 'cost'], category: 'Business' },
            { keywords: ['process', 'workflow', 'efficiency'], category: 'Process' },
            { keywords: ['innovation', 'creative', 'novel'], category: 'Innovation' },
        ];
        const ideaLower = idea.toLowerCase();
        for (const { keywords, category } of categories) {
            if (keywords.some(keyword => ideaLower.includes(keyword))) {
                return category;
            }
        }
        return 'Other';
    }
    assessInnovationLevel(result) {
        let score = 0;
        const innovationKeywords = [
            'innovative',
            'novel',
            'creative',
            'breakthrough',
            'unique',
            'revolutionary',
        ];
        const text = JSON.stringify(result.insights || []) + JSON.stringify(result.results || {});
        const textLower = text.toLowerCase();
        innovationKeywords.forEach(keyword => {
            if (textLower.includes(keyword)) {
                score += 0.2;
            }
        });
        // Bonus for certain techniques known for innovation
        if (['po', 'random_entry', 'scamper'].includes(result.technique)) {
            score += 0.3;
        }
        return Math.min(score, 1.0);
    }
    assessRiskLevel(result) {
        let score = 0;
        // Base risk from identified risks
        const resultData = result.results;
        const risks = resultData?.risks;
        if (risks) {
            score += Math.min(risks.length * 0.15, 0.5);
        }
        // Risk keywords in insights
        const riskKeywords = ['risk', 'danger', 'concern', 'challenge', 'difficult', 'complex'];
        const text = JSON.stringify(result.insights || []);
        const textLower = text.toLowerCase();
        riskKeywords.forEach(keyword => {
            if (textLower.includes(keyword)) {
                score += 0.1;
            }
        });
        return Math.min(score, 1.0);
    }
    determineQuadrant(innovation, risk) {
        if (innovation >= 0.5 && risk < 0.5) {
            return 'Sweet Spot (Low Risk/High Innovation)';
        }
        else if (innovation >= 0.5 && risk >= 0.5) {
            return 'High Risk/High Innovation';
        }
        else if (innovation < 0.5 && risk >= 0.5) {
            return 'Caution Zone (High Risk/Low Innovation)';
        }
        else {
            return 'Safe/Incremental (Low Risk/Low Innovation)';
        }
    }
    findSynergyEdges(results) {
        const edges = [];
        // Simple synergy detection based on shared themes
        for (let i = 0; i < results.length; i++) {
            for (let j = i + 1; j < results.length; j++) {
                const synergy = this.calculateSynergy(results[i], results[j]);
                if (synergy > 0) {
                    // Map node IDs (A, B, C, etc.)
                    const fromId = String.fromCharCode(65 + i);
                    const toId = String.fromCharCode(65 + j);
                    const strength = synergy > 0.5 ? 'Strong' : 'Moderate';
                    edges.push({
                        from: fromId,
                        to: toId,
                        strength,
                    });
                }
            }
        }
        return edges;
    }
    calculateSynergy(result1, result2) {
        // Simple synergy calculation based on shared keywords
        const keywords1 = this.extractKeywords(result1);
        const keywords2 = this.extractKeywords(result2);
        const intersection = keywords1.filter(k => keywords2.includes(k));
        const union = [...new Set([...keywords1, ...keywords2])];
        return union.length > 0 ? intersection.length / union.length : 0;
    }
    extractKeywords(result) {
        const keywords = [];
        const text = JSON.stringify(result.insights || []) + JSON.stringify(result.results || {});
        // Simple keyword extraction
        const importantWords = [
            'innovation',
            'efficiency',
            'user',
            'quality',
            'cost',
            'scalability',
            'automation',
            'design',
            'implementation',
            'optimization',
            'integration',
            'collaboration',
        ];
        importantWords.forEach(word => {
            if (text.toLowerCase().includes(word)) {
                keywords.push(word);
            }
        });
        return keywords;
    }
    getTechniquesForTimeframe(results, timeframe) {
        // Map techniques to typical implementation timeframes
        const timeframeMap = {
            immediate: ['six_hats', 'po', 'random_entry'],
            short: ['scamper', 'yes_and', 'concept_extraction'],
            long: ['design_thinking', 'triz', 'collective_intel'],
        };
        return results
            .filter(r => timeframeMap[timeframe]?.includes(r.technique))
            .map(r => r.technique);
    }
}
//# sourceMappingURL=VisualizationGenerator.js.map