/**
 * SmartSummaryGenerator
 * Uses MCP Sampling to generate intelligent session summaries
 */
export class SmartSummaryGenerator {
    samplingManager;
    constructor(samplingManager) {
        this.samplingManager = samplingManager;
    }
    /**
     * Generate smart summary for a session
     */
    async generateSummary(session) {
        try {
            // Check if sampling is available
            if (!this.samplingManager.isAvailable()) {
                return this.fallbackSummary(session);
            }
            const result = await this.samplingManager.requestSampling({
                messages: [
                    {
                        role: 'system',
                        content: this.buildSystemPrompt(),
                    },
                    {
                        role: 'user',
                        content: this.buildUserPrompt(session),
                    },
                ],
                modelPreferences: {
                    hints: ['analytical', 'concise', 'actionable'],
                    intelligencePriority: 0.8,
                    speedPriority: 0.4,
                },
                temperature: 0.4, // Lower temperature for structured summaries
                maxTokens: 1200,
            }, 'smart_summary');
            return this.parseSummary(result.content, session);
        }
        catch (error) {
            console.error('[SmartSummaryGenerator] Summary generation failed:', error);
            return this.handleError(session, error);
        }
    }
    /**
     * Build system prompt for summary generation
     */
    buildSystemPrompt() {
        return `You are an expert at creating actionable summaries of creative thinking sessions.
Your summaries help users understand what was accomplished and what to do next.

Your summaries should:
1. Extract the most valuable insights and ideas
2. Identify patterns across different thinking techniques
3. Recognize risks and provide mitigation strategies
4. Suggest concrete next steps
5. Highlight action items with priorities
6. Be concise yet comprehensive

Focus on actionability and value extraction rather than just recapping what happened.`;
    }
    /**
     * Build user prompt for summary
     */
    buildUserPrompt(session) {
        const history = this.formatSessionHistory(session);
        const techniques = session.techniques.join(', ');
        const stepCount = session.steps.length;
        const duration = session.duration
            ? `${Math.round(session.duration / 60)} minutes`
            : 'unknown duration';
        return `Summarize the following creative thinking session:

PROBLEM: ${session.problem}
TECHNIQUES USED: ${techniques}
STEPS COMPLETED: ${stepCount}
DURATION: ${duration}
STATUS: ${session.completionStatus || 'completed'}

SESSION HISTORY:
${history}

Please provide a structured summary with:

1. KEY INSIGHTS (3-5 bullet points)
   - Most valuable discoveries or realizations

2. BEST IDEAS
   - Top 3 ideas with their technique and brief explanation

3. RISKS & MITIGATIONS
   - Major risks identified and how to address them

4. PATTERNS OBSERVED
   - Recurring themes or connections across techniques

5. RECOMMENDED NEXT STEPS (3-5 items)
   - Concrete actions to move forward

6. ACTION ITEMS
   - Specific tasks with priority levels (high/medium/low)

Keep the summary actionable and focused on value.`;
    }
    /**
     * Format session history for AI consumption
     */
    formatSessionHistory(session) {
        const historyLines = [];
        for (const step of session.steps.slice(0, 50)) {
            // Limit to 50 steps
            const technique = step.technique || 'unknown';
            const stepNum = step.currentStep || 0;
            const output = step.output || '';
            // Include key fields based on technique
            let summary = `[${technique} - Step ${stepNum}]: ${output.substring(0, 200)}`;
            // Add technique-specific details
            if (step.hatColor) {
                summary = `[Six Hats - ${step.hatColor}]: ${output.substring(0, 200)}`;
            }
            else if (step.scamperAction) {
                summary = `[SCAMPER - ${step.scamperAction}]: ${output.substring(0, 200)}`;
            }
            else if (step.designStage) {
                summary = `[Design Thinking - ${step.designStage}]: ${output.substring(0, 200)}`;
            }
            // Add risks if present
            if (step.risks && step.risks.length > 0) {
                summary += ` | Risks: ${step.risks.slice(0, 2).join(', ')}`;
            }
            historyLines.push(summary);
        }
        return historyLines.join('\n');
    }
    /**
     * Parse AI response into structured summary
     */
    parseSummary(aiResponse, session) {
        const summary = {
            insights: [],
            bestIdeas: [],
            nextSteps: [],
            patterns: [],
            actionItems: [],
        };
        try {
            const sections = this.parseSections(aiResponse);
            // Extract insights
            if (sections['KEY INSIGHTS']) {
                summary.insights = this.extractBulletPoints(sections['KEY INSIGHTS']).slice(0, 5);
            }
            // Extract best ideas
            if (sections['BEST IDEAS']) {
                summary.bestIdeas = this.extractIdeas(sections['BEST IDEAS'], session.techniques);
            }
            // Extract risks
            if (sections['RISKS']) {
                summary.risks = this.extractRisks(sections['RISKS']);
            }
            // Extract patterns
            if (sections['PATTERNS']) {
                summary.patterns = this.extractBulletPoints(sections['PATTERNS']).slice(0, 5);
            }
            // Extract next steps
            if (sections['NEXT STEPS'] || sections['RECOMMENDED NEXT STEPS']) {
                summary.nextSteps = this.extractBulletPoints(sections['NEXT STEPS'] || sections['RECOMMENDED NEXT STEPS']).slice(0, 5);
            }
            // Extract action items
            if (sections['ACTION ITEMS']) {
                summary.actionItems = this.extractActionItems(sections['ACTION ITEMS']);
            }
            // Ensure we have at least some content
            if (summary.insights.length === 0) {
                summary.insights = this.extractFirstSentences(aiResponse, 3);
            }
        }
        catch (error) {
            console.error('[SmartSummaryGenerator] Failed to parse AI response:', error);
            return this.fallbackSummary(session);
        }
        return summary;
    }
    /**
     * Parse sections from AI response
     */
    parseSections(text) {
        const sections = {};
        const lines = text.split('\n');
        let currentSection = '';
        let currentContent = [];
        for (const line of lines) {
            // Check for section headers
            if (/^\d+\.\s+[A-Z][A-Z\s&]+/i.test(line)) {
                if (currentSection) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                currentSection = line
                    .replace(/^\d+\.\s+([A-Z\s&]+).*/, '$1')
                    .trim()
                    .toUpperCase();
                currentContent = [];
            }
            else if (/^[A-Z][A-Z\s&]+:/i.test(line)) {
                if (currentSection) {
                    sections[currentSection] = currentContent.join('\n').trim();
                }
                currentSection = line
                    .replace(/^([A-Z\s&]+):.*/, '$1')
                    .trim()
                    .toUpperCase();
                currentContent = [];
            }
            else if (currentSection) {
                currentContent.push(line);
            }
        }
        if (currentSection) {
            sections[currentSection] = currentContent.join('\n').trim();
        }
        return sections;
    }
    /**
     * Extract bullet points
     */
    extractBulletPoints(text) {
        const points = [];
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (/^[-•*]\s+/.test(trimmed)) {
                points.push(trimmed.replace(/^[-•*]\s+/, '').trim());
            }
            else if (/^\d+[.)]\s+/.test(trimmed)) {
                points.push(trimmed.replace(/^\d+[.)]\s+/, '').trim());
            }
            else if (trimmed.length > 20 && !trimmed.includes(':')) {
                points.push(trimmed);
            }
        }
        return points.filter(p => p.length > 10);
    }
    /**
     * Extract ideas from text
     */
    extractIdeas(text, techniques) {
        const ideas = [];
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 20) {
                // Try to extract technique from line
                let technique = 'general';
                for (const tech of techniques) {
                    if (trimmed.toLowerCase().includes(tech.toLowerCase())) {
                        technique = tech;
                        break;
                    }
                }
                // Extract idea text
                const ideaText = trimmed
                    .replace(/^[-•*\d.)]\s+/, '')
                    .replace(/\([^)]*\)/g, '')
                    .trim();
                if (ideaText.length > 10) {
                    ideas.push({
                        idea: ideaText,
                        technique,
                        score: 0.8 - ideas.length * 0.1, // Decreasing score by position
                    });
                }
            }
            if (ideas.length >= 3)
                break;
        }
        // Fallback if no ideas extracted
        if (ideas.length === 0) {
            ideas.push({
                idea: 'Review session output for detailed ideas',
                technique: techniques[0] || 'general',
            });
        }
        return ideas;
    }
    /**
     * Extract risks from text
     */
    extractRisks(text) {
        const risks = {
            risks: [],
            overallRisk: 'medium',
        };
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 20) {
                const riskText = trimmed.replace(/^[-•*\d.)]\s+/, '');
                // Look for mitigation after dash or colon
                const parts = riskText.split(/[-:]/);
                const description = parts[0].trim();
                const mitigation = parts[1]?.trim();
                if (description.length > 10) {
                    risks.risks.push({
                        description: description.substring(0, 200),
                        severity: 3,
                        likelihood: 3,
                        mitigations: mitigation ? [mitigation] : [],
                    });
                }
            }
            if (risks.risks.length >= 5)
                break;
        }
        return risks;
    }
    /**
     * Extract action items
     */
    extractActionItems(text) {
        const items = [];
        const lines = text.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 10) {
                // Detect priority
                let priority = 'medium';
                if (/high|critical|urgent/i.test(trimmed)) {
                    priority = 'high';
                }
                else if (/low|minor|optional/i.test(trimmed)) {
                    priority = 'low';
                }
                // Clean task text
                const task = trimmed
                    .replace(/^[-•*\d.)]\s+/, '')
                    .replace(/\(.*?\)/g, '')
                    .replace(/high|medium|low|priority[:\s]*/gi, '')
                    .trim();
                if (task.length > 10) {
                    items.push({
                        task: task.substring(0, 200),
                        priority,
                    });
                }
            }
            if (items.length >= 10)
                break;
        }
        return items;
    }
    /**
     * Extract first sentences as fallback
     */
    extractFirstSentences(text, count) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        return sentences
            .slice(0, count)
            .map(s => s.trim())
            .filter(s => s.length > 20);
    }
    /**
     * Fallback summary when AI is not available
     */
    fallbackSummary(session) {
        const techniques = session.techniques.join(', ');
        const stepCount = session.steps.length;
        // Extract ideas from steps
        const bestIdeas = session.steps
            .filter(s => s.output && s.output.length > 50)
            .slice(0, 3)
            .map(s => ({
            idea: s.output ? s.output.substring(0, 100) : '',
            technique: s.technique || 'unknown',
        }));
        // Extract risks from steps
        const risksFromSteps = session.steps
            .filter(s => s.risks && s.risks.length > 0)
            .flatMap(s => s.risks || [])
            .slice(0, 3);
        return {
            insights: [
                `Explored ${stepCount} creative steps using ${techniques}`,
                `Generated multiple solution approaches to: ${session.problem}`,
                'Identified key risks and mitigation strategies',
            ],
            bestIdeas: bestIdeas.length > 0
                ? bestIdeas
                : [
                    {
                        idea: 'Review session details for specific ideas',
                        technique: session.techniques[0] || 'general',
                    },
                ],
            risks: risksFromSteps.length > 0
                ? {
                    risks: risksFromSteps.map(r => ({
                        description: r,
                        severity: 3,
                        likelihood: 3,
                        mitigations: [],
                    })),
                    overallRisk: 'medium',
                }
                : undefined,
            nextSteps: [
                'Review and prioritize generated ideas',
                'Validate assumptions with stakeholders',
                'Create implementation plan for top ideas',
                'Conduct risk assessment workshop',
            ],
            patterns: [
                'Multiple perspectives enhanced solution quality',
                'Iterative refinement improved idea clarity',
            ],
            actionItems: [
                {
                    task: 'Document top 3 ideas in detail',
                    priority: 'high',
                },
                {
                    task: 'Share session insights with team',
                    priority: 'medium',
                },
                {
                    task: 'Schedule follow-up session if needed',
                    priority: 'low',
                },
            ],
        };
    }
    /**
     * Handle summary generation errors
     */
    handleError(session, error) {
        console.error('[SmartSummaryGenerator] Error:', error.code, error.message);
        switch (error.code) {
            case 'rate_limit_exceeded':
                return {
                    ...this.fallbackSummary(session),
                    insights: ['Summary generation rate-limited, showing basic summary'],
                };
            case 'timeout':
                return {
                    ...this.fallbackSummary(session),
                    insights: ['Summary generation timed out, showing basic summary'],
                };
            default:
                return this.fallbackSummary(session);
        }
    }
}
//# sourceMappingURL=SmartSummaryGenerator.js.map