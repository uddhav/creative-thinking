/**
 * Session Resource Provider - Exposes session data as MCP resources
 */

import { BaseResourceProvider } from './ResourceProvider.js';
import type { ResourceContent, ResourceTemplate, ExportFormat } from './types.js';
import type { SessionAdapter } from '../adapters/SessionAdapter.js';
import type { CreativeThinkingState } from '../CreativeThinkingMcpAgent.js';

export class SessionResourceProvider extends BaseResourceProvider {
  constructor(
    private sessionAdapter: SessionAdapter,
    private getState: () => CreativeThinkingState
  ) {
    super('session://');
  }

  /**
   * List all available session resources
   */
  async listResources(): Promise<Array<{ uri: string; name: string; mimeType: string }>> {
    const resources = [
      {
        uri: 'session://current/state',
        name: 'Current Session State',
        mimeType: 'application/json',
      },
      {
        uri: 'session://current/history',
        name: 'Current Session History',
        mimeType: 'application/json',
      },
      {
        uri: 'session://current/metrics',
        name: 'Current Session Metrics',
        mimeType: 'application/json',
      },
      {
        uri: 'session://current/insights',
        name: 'Current Session Insights',
        mimeType: 'application/json',
      },
      {
        uri: 'session://all/list',
        name: 'All Sessions List',
        mimeType: 'application/json',
      },
      {
        uri: 'session://all/summaries',
        name: 'All Sessions Summaries',
        mimeType: 'application/json',
      },
    ];

    // Add specific session resources
    const sessions = await this.sessionAdapter.listSessions();
    for (const session of sessions) {
      resources.push({
        uri: `session://${session.id}/data`,
        name: `Session ${session.id} Data`,
        mimeType: 'application/json',
      });
    }

    return resources;
  }

  /**
   * List resource templates for dynamic session resources
   */
  async listTemplates(): Promise<ResourceTemplate[]> {
    return [
      {
        uriTemplate: 'session://{sessionId}/export/{format}',
        name: 'Session Export',
        description: 'Export session in various formats (json, markdown, csv)',
        mimeType: 'application/octet-stream',
      },
      {
        uriTemplate: 'session://{sessionId}/data',
        name: 'Session Data',
        description: 'Get full session data by ID',
        mimeType: 'application/json',
      },
    ];
  }

  /**
   * Generate content for a session resource
   */
  protected async generateContent(uri: string): Promise<ResourceContent | null> {
    const parts = this.parseUri(uri);

    if (parts.length === 0) {
      return null;
    }

    const [scope, ...rest] = parts;

    switch (scope) {
      case 'current':
        return this.getCurrentSessionResource(rest[0]);

      case 'all':
        return this.getAllSessionsResource(rest[0]);

      default:
        // Handle specific session ID
        if (rest.length === 1 && rest[0] === 'data') {
          return this.getSessionDataResource(scope);
        }
        if (rest.length === 2 && rest[0] === 'export') {
          return this.exportSessionResource(scope, rest[1] as ExportFormat);
        }
        return null;
    }
  }

  /**
   * Get current session resources
   */
  private async getCurrentSessionResource(type: string): Promise<ResourceContent | null> {
    const state = this.getState();
    const currentSessionId = state.currentSessionId;

    if (!currentSessionId) {
      return {
        uri: `session://current/${type}`,
        name: `Current Session ${type}`,
        mimeType: 'application/json',
        text: JSON.stringify({ error: 'No active session' }, null, 2),
      };
    }

    const session = await this.sessionAdapter.getSession(currentSessionId);
    if (!session) {
      return null;
    }

    switch (type) {
      case 'state':
        return {
          uri: 'session://current/state',
          name: 'Current Session State',
          mimeType: 'application/json',
          text: JSON.stringify(session, null, 2),
        };

      case 'history':
        return {
          uri: 'session://current/history',
          name: 'Current Session History',
          mimeType: 'application/json',
          text: JSON.stringify(session.history || [], null, 2),
        };

      case 'metrics':
        const metrics = this.calculateMetrics(session);
        return {
          uri: 'session://current/metrics',
          name: 'Current Session Metrics',
          mimeType: 'application/json',
          text: JSON.stringify(metrics, null, 2),
        };

      case 'insights':
        const insights = this.generateInsights(session);
        return {
          uri: 'session://current/insights',
          name: 'Current Session Insights',
          mimeType: 'application/json',
          text: JSON.stringify(insights, null, 2),
        };

      default:
        return null;
    }
  }

  /**
   * Get all sessions resources
   */
  private async getAllSessionsResource(type: string): Promise<ResourceContent | null> {
    switch (type) {
      case 'list':
        const sessions = await this.sessionAdapter.listSessions();
        const sessionList = sessions.map((s: any) => ({
          id: s.id,
          technique: s.technique,
          problem: s.problem,
          createdAt: s.createdAt,
          lastActivityTime: s.lastActivityTime,
        }));

        return {
          uri: 'session://all/list',
          name: 'All Sessions List',
          mimeType: 'application/json',
          text: JSON.stringify(sessionList, null, 2),
        };

      case 'summaries':
        const allSessions = await this.sessionAdapter.listSessions();
        const summaries = allSessions.map((s: any) => ({
          id: s.id,
          technique: s.technique,
          problem: s.problem,
          stepCount: s.currentStep,
          completed: s.completed,
          metrics: this.calculateMetrics(s),
        }));

        return {
          uri: 'session://all/summaries',
          name: 'All Sessions Summaries',
          mimeType: 'application/json',
          text: JSON.stringify(summaries, null, 2),
        };

      default:
        return null;
    }
  }

  /**
   * Get specific session data
   */
  private async getSessionDataResource(sessionId: string): Promise<ResourceContent | null> {
    const session = await this.sessionAdapter.getSession(sessionId);
    if (!session) {
      return null;
    }

    return {
      uri: `session://${sessionId}/data`,
      name: `Session ${sessionId} Data`,
      mimeType: 'application/json',
      text: JSON.stringify(session, null, 2),
    };
  }

  /**
   * Export session in different formats
   */
  private async exportSessionResource(
    sessionId: string,
    format: ExportFormat
  ): Promise<ResourceContent | null> {
    const session = await this.sessionAdapter.getSession(sessionId);
    if (!session) {
      return null;
    }

    let content: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(session, null, 2);
        mimeType = 'application/json';
        break;

      case 'markdown':
        content = this.exportAsMarkdown(session);
        mimeType = 'text/markdown';
        break;

      case 'csv':
        content = this.exportAsCSV(session);
        mimeType = 'text/csv';
        break;

      default:
        return null;
    }

    return {
      uri: `session://${sessionId}/export/${format}`,
      name: `Session ${sessionId} Export (${format})`,
      mimeType,
      text: content,
    };
  }

  /**
   * Calculate metrics for a session
   */
  private calculateMetrics(session: any): any {
    return {
      duration: session.lastActivityTime - session.createdAt,
      stepCount: session.currentStep || 0,
      completed: session.completed || false,
      techniqueUsed: session.technique,
      flexibilityScore: session.flexibilityScore || 1.0,
      optionsGenerated: session.optionsGenerated || 0,
      pathDependencies: session.pathDependencies?.length || 0,
    };
  }

  /**
   * Generate insights for a session
   */
  private generateInsights(session: any): any {
    const insights = [];

    if (session.flexibilityScore < 0.3) {
      insights.push({
        type: 'warning',
        message: 'Low flexibility detected - consider using PO or Random Entry techniques',
      });
    }

    if (session.optionsGenerated < 3) {
      insights.push({
        type: 'suggestion',
        message: 'Limited options generated - try SCAMPER or concept extraction',
      });
    }

    if (session.pathDependencies?.length > 5) {
      insights.push({
        type: 'info',
        message: 'High path dependencies - decisions are constraining future options',
      });
    }

    return {
      insights,
      summary: `Session ${session.completed ? 'completed' : 'in progress'} with ${session.currentStep || 0} steps`,
      recommendations: this.getRecommendations(session),
    };
  }

  /**
   * Get recommendations based on session state
   */
  private getRecommendations(session: any): string[] {
    const recommendations = [];

    if (!session.completed) {
      recommendations.push('Complete the remaining steps in the technique');
    }

    if (session.technique === 'six_hats' && session.currentStep < 6) {
      recommendations.push('Ensure all six perspectives are explored');
    }

    return recommendations;
  }

  /**
   * Export session as Markdown
   */
  private exportAsMarkdown(session: any): string {
    let markdown = `# Creative Thinking Session\n\n`;
    markdown += `**ID**: ${session.id}\n`;
    markdown += `**Technique**: ${session.technique}\n`;
    markdown += `**Problem**: ${session.problem}\n\n`;

    markdown += `## Progress\n`;
    markdown += `- Current Step: ${session.currentStep || 0}\n`;
    markdown += `- Completed: ${session.completed ? 'Yes' : 'No'}\n\n`;

    if (session.history && session.history.length > 0) {
      markdown += `## History\n\n`;
      session.history.forEach((entry: any, index: number) => {
        markdown += `### Step ${index + 1}\n`;
        markdown += `${entry.output || entry}\n\n`;
      });
    }

    const metrics = this.calculateMetrics(session);
    markdown += `## Metrics\n`;
    markdown += `- Duration: ${metrics.duration}ms\n`;
    markdown += `- Flexibility Score: ${metrics.flexibilityScore}\n`;
    markdown += `- Options Generated: ${metrics.optionsGenerated}\n`;

    return markdown;
  }

  /**
   * Export session as CSV
   */
  private exportAsCSV(session: any): string {
    const headers = ['Step', 'Type', 'Content', 'Timestamp'];
    const rows = [headers.join(',')];

    if (session.history) {
      session.history.forEach((entry: any, index: number) => {
        rows.push(
          [
            index + 1,
            entry.type || 'output',
            `"${(entry.output || entry).replace(/"/g, '""')}"`,
            entry.timestamp || '',
          ].join(',')
        );
      });
    }

    return rows.join('\n');
  }
}
