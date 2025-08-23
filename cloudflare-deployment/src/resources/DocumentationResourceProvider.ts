/**
 * Documentation Resource Provider - Exposes technique documentation as MCP resources
 */

import { BaseResourceProvider } from './ResourceProvider.js';
import type { ResourceContent, ResourceTemplate } from './types.js';

// Technique documentation extracted from SPECIFICATIONS.md
const TECHNIQUE_DOCS: Record<string, { title: string; guide: string; examples: string }> = {
  six_hats: {
    title: 'Six Thinking Hats with Path Consciousness',
    guide: `# Six Thinking Hats Plus

Multi-perspective analysis with meta-uncertainty awareness and ergodicity monitoring.

## Overview
The Six Thinking Hats technique enhanced with path-dependence awareness helps you explore problems from multiple perspectives while tracking how each perspective creates path dependencies.

## The Six Hats

### 🔵 Blue Hat - Process Control
- Manages thinking process
- Monitors path dependencies
- Tracks ergodicity metrics

### ⚪ White Hat - Facts and Data
- Objective information
- Verifiable data
- Statistical analysis

### 🔴 Red Hat - Emotions and Intuition
- Feelings and hunches
- Emotional responses
- Gut reactions

### ⚫ Black Hat - Critical Judgment
- Risk assessment
- Potential problems
- Worst-case scenarios

### 🟡 Yellow Hat - Positive Assessment
- Benefits and opportunities
- Best-case scenarios
- Optimistic view

### 🟢 Green Hat - Creative Alternatives
- New ideas
- Creative solutions
- Alternative approaches`,
    examples: `## Examples

### Business Strategy
- Blue: Define the strategic planning process
- White: Analyze market data and financials
- Red: Consider team morale and customer sentiment
- Black: Identify risks and competitive threats
- Yellow: Explore growth opportunities
- Green: Generate innovative business models

### Product Design
- Blue: Outline design methodology
- White: Review user research data
- Red: Understand user emotions
- Black: Find usability issues
- Yellow: Highlight features users love
- Green: Brainstorm new features`,
  },

  po: {
    title: 'Provocative Operation (PO)',
    guide: `# Provocative Operation (PO)

Creative disruption through provocative statements with flexibility preservation.

## Overview
PO is a lateral thinking tool that uses provocative statements to break conventional thinking patterns and generate new ideas.

## How It Works
1. Create a provocative statement (PO)
2. Suspend judgment
3. Extract useful concepts
4. Develop practical ideas

## Types of Provocations
- **Reversal**: Reverse normal assumptions
- **Exaggeration**: Take things to extremes
- **Distortion**: Change relationships
- **Wishful Thinking**: Imagine ideal scenarios`,
    examples: `## Examples

### PO: Cars have square wheels
- Leads to: Adjustable suspension systems
- Leads to: Roads that adapt to vehicles
- Leads to: Modular wheel systems

### PO: Employees pay to work
- Leads to: Investment in personal development
- Leads to: Equity-based compensation
- Leads to: Skills marketplace platforms`,
  },

  random_entry: {
    title: 'Random Entry Technique',
    guide: `# Random Entry

Using random stimuli to trigger new associations and ideas.

## Overview
Random Entry introduces unrelated concepts to stimulate creative thinking and break fixation on existing solutions.

## Process
1. Select a random word/image
2. List its attributes
3. Force connections to your problem
4. Develop practical applications

## Sources of Random Stimuli
- Dictionary random word
- Random images
- Objects in environment
- Random Wikipedia articles`,
    examples: `## Examples

### Problem: Improve customer service
Random Word: "Telescope"
- Distance viewing → Remote service monitoring
- Magnification → Focus on detail importance
- Astronomy → 24/7 availability like stars
- Lenses → Multiple service perspectives`,
  },

  scamper: {
    title: 'SCAMPER Technique',
    guide: `# SCAMPER

Systematic creative thinking through transformation operations.

## The SCAMPER Checklist

### S - Substitute
What can be substituted?

### C - Combine
What can be combined?

### A - Adapt
What can be adapted?

### M - Modify/Magnify
What can be modified or magnified?

### P - Put to Other Uses
What else can this be used for?

### E - Eliminate
What can be eliminated?

### R - Reverse/Rearrange
What can be reversed or rearranged?`,
    examples: `## Examples

### Product Innovation: Water Bottle
- **Substitute**: Replace plastic with biodegradable materials
- **Combine**: Integrate water filter
- **Adapt**: Add collapsible design
- **Modify**: Include temperature display
- **Put to other uses**: Emergency whistle in cap
- **Eliminate**: Remove unnecessary packaging
- **Reverse**: Bottle that fills from bottom`,
  },
};

// Concept documentation
const CONCEPT_DOCS: Record<string, string> = {
  ergodicity: `# Ergodicity in Creative Thinking

## Overview
Ergodicity refers to whether the average outcome of a group equals the average outcome over time for an individual. In creative thinking, non-ergodic situations mean that path matters.

## Key Concepts
- **Path Dependence**: Earlier decisions constrain later options
- **Absorbing Barriers**: Points of no return in creative processes
- **Time vs Ensemble Averages**: Individual journey vs group statistics

## Implications
- Some creative paths cannot be reversed
- Success strategies may not be repeatable
- Individual experience differs from statistical average`,

  path_dependency: `# Path Dependency

## Overview
Path dependency means that history matters - the sequence of decisions and events shapes available options.

## In Creative Thinking
- Early creative choices limit later possibilities
- Some innovations open new paths, others close them
- Timing and sequence are crucial

## Managing Path Dependencies
1. Track decision points
2. Preserve optionality when possible
3. Recognize irreversible commitments
4. Plan for path-dependent scenarios`,

  option_generation: `# Option Generation

## Overview
Creating multiple alternatives before committing to a solution.

## Techniques
1. Systematic variation
2. Morphological analysis
3. Concept extraction
4. Analogical thinking

## Benefits
- Increased flexibility
- Better decision quality
- Reduced path dependence
- Enhanced creativity`,
};

export class DocumentationResourceProvider extends BaseResourceProvider {
  constructor() {
    super('docs://');
    // Cache documentation for longer since it's static
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * List all available documentation resources
   */
  async listResources(): Promise<Array<{ uri: string; name: string; mimeType: string }>> {
    const resources = [
      {
        uri: 'docs://techniques/overview',
        name: 'All Techniques Overview',
        mimeType: 'text/markdown',
      },
    ];

    // Add resources for each technique
    for (const technique of Object.keys(TECHNIQUE_DOCS)) {
      resources.push(
        {
          uri: `docs://techniques/${technique}/guide`,
          name: `${TECHNIQUE_DOCS[technique].title} - Guide`,
          mimeType: 'text/markdown',
        },
        {
          uri: `docs://techniques/${technique}/examples`,
          name: `${TECHNIQUE_DOCS[technique].title} - Examples`,
          mimeType: 'text/markdown',
        }
      );
    }

    // Add concept documentation
    for (const concept of Object.keys(CONCEPT_DOCS)) {
      resources.push({
        uri: `docs://concepts/${concept}`,
        name: `Concept: ${concept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        mimeType: 'text/markdown',
      });
    }

    return resources;
  }

  /**
   * Generate content for a documentation resource
   */
  protected async generateContent(uri: string): Promise<ResourceContent | null> {
    const parts = this.parseUri(uri);

    if (parts.length === 0) {
      return null;
    }

    const [category, ...rest] = parts;

    switch (category) {
      case 'techniques':
        return this.getTechniqueResource(rest);

      case 'concepts':
        return this.getConceptResource(rest[0]);

      default:
        return null;
    }
  }

  /**
   * Get technique documentation resource
   */
  private getTechniqueResource(parts: string[]): ResourceContent | null {
    if (parts.length === 1 && parts[0] === 'overview') {
      return this.getTechniquesOverview();
    }

    if (parts.length !== 2) {
      return null;
    }

    const [technique, type] = parts;
    const doc = TECHNIQUE_DOCS[technique];

    if (!doc) {
      return null;
    }

    switch (type) {
      case 'guide':
        return {
          uri: `docs://techniques/${technique}/guide`,
          name: `${doc.title} - Guide`,
          mimeType: 'text/markdown',
          text: doc.guide,
        };

      case 'examples':
        return {
          uri: `docs://techniques/${technique}/examples`,
          name: `${doc.title} - Examples`,
          mimeType: 'text/markdown',
          text: doc.examples,
        };

      default:
        return null;
    }
  }

  /**
   * Get techniques overview
   */
  private getTechniquesOverview(): ResourceContent {
    let overview = `# Creative Thinking Techniques Overview\n\n`;
    overview += `This server provides ${Object.keys(TECHNIQUE_DOCS).length} creative thinking techniques enhanced with path-dependence awareness.\n\n`;

    overview += `## Available Techniques\n\n`;
    for (const [key, doc] of Object.entries(TECHNIQUE_DOCS)) {
      overview += `### ${doc.title}\n`;
      overview += `- **URI**: docs://techniques/${key}/guide\n`;
      overview += `- **Examples**: docs://techniques/${key}/examples\n\n`;
    }

    overview += `## Core Concepts\n\n`;
    for (const concept of Object.keys(CONCEPT_DOCS)) {
      const title = concept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      overview += `- **${title}**: docs://concepts/${concept}\n`;
    }

    return {
      uri: 'docs://techniques/overview',
      name: 'All Techniques Overview',
      mimeType: 'text/markdown',
      text: overview,
    };
  }

  /**
   * Get concept documentation resource
   */
  private getConceptResource(concept: string): ResourceContent | null {
    const doc = CONCEPT_DOCS[concept];

    if (!doc) {
      return null;
    }

    return {
      uri: `docs://concepts/${concept}`,
      name: `Concept: ${concept.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      mimeType: 'text/markdown',
      text: doc,
    };
  }
}
