/**
 * SessionAdapter - Bridges Cloudflare KV storage with existing SessionManager logic
 */

import * as crypto from 'crypto';

export interface SessionData {
  id: string;
  planId?: string;
  technique?: string;
  problem: string;
  history: any[];
  startTime: number;
  lastActivityTime: number;
  state?: any;
}

export class SessionAdapter {
  constructor(private kv: KVNamespace) {}

  async createSession(problem: string, technique?: string): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const session: SessionData = {
      id: sessionId,
      problem,
      technique,
      history: [],
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      state: {},
    };

    await this.saveSession(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const data = await this.kv.get(`session:${sessionId}`, { type: 'json' });
    return data as SessionData | null;
  }

  async saveSession(sessionId: string, session: SessionData): Promise<void> {
    await this.kv.put(`session:${sessionId}`, JSON.stringify(session), {
      expirationTtl: 86400 * 7, // 7 days
    });
  }

  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<SessionData | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    const updated = {
      ...session,
      ...updates,
      lastActivityTime: Date.now(),
    };

    await this.saveSession(sessionId, updated);
    return updated;
  }

  async addToHistory(sessionId: string, entry: any): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    session.history.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    await this.saveSession(sessionId, session);
  }

  async listSessions(limit: number = 20): Promise<SessionData[]> {
    const list = await this.kv.list({ prefix: 'session:', limit });

    // Batch fetch all sessions in parallel for better performance
    const sessionPromises = list.keys.map(key =>
      this.kv.get(key.name, { type: 'json' }).then(data => data as SessionData | null)
    );

    const sessionResults = await Promise.all(sessionPromises);
    const sessions = sessionResults.filter((session): session is SessionData => session !== null);

    return sessions.sort((a, b) => b.lastActivityTime - a.lastActivityTime);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;

    await this.kv.delete(`session:${sessionId}`);
    return true;
  }

  async cleanupOldSessions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const sessions = await this.listSessions(100);
    const now = Date.now();
    let deleted = 0;

    for (const session of sessions) {
      if (now - session.lastActivityTime > maxAgeMs) {
        await this.deleteSession(session.id);
        deleted++;
      }
    }

    return deleted;
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('base64url');
    return `session_${timestamp}_${random}`;
  }

  // Plan management
  async createPlan(problem: string, techniques: string[], options: any = {}): Promise<string> {
    const planId = this.generatePlanId();
    const plan = {
      id: planId,
      problem,
      techniques,
      options,
      createdAt: Date.now(),
      steps: this.generateSteps(techniques),
    };

    await this.kv.put(`plan:${planId}`, JSON.stringify(plan), {
      expirationTtl: 86400, // 24 hours
    });

    return planId;
  }

  async getPlan(planId: string): Promise<any> {
    return await this.kv.get(`plan:${planId}`, { type: 'json' });
  }

  private generatePlanId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `plan_${timestamp}_${random}`;
  }

  private generateSteps(techniques: string[]): any[] {
    // Generate execution steps based on techniques
    const steps: any[] = [];
    let stepNumber = 1;

    for (const technique of techniques) {
      const stepCount = this.getStepCountForTechnique(technique);
      for (let i = 1; i <= stepCount; i++) {
        steps.push({
          stepNumber,
          technique,
          techniqueStep: i,
          totalTechniqueSteps: stepCount,
          status: 'pending',
        });
        stepNumber++;
      }
    }

    return steps;
  }

  private getStepCountForTechnique(technique: string): number {
    // Map technique names to their step counts
    const stepCounts: Record<string, number> = {
      six_hats: 6,
      po: 4,
      random_entry: 3,
      scamper: 8,
      concept_extraction: 4,
      yes_and: 4,
      design_thinking: 5,
      triz: 4,
      neural_state: 4,
      temporal_work: 5,
      cross_cultural: 5,
      collective_intel: 5,
      disney_method: 3,
      nine_windows: 9,
      quantum_superposition: 6,
      temporal_creativity: 6,
      paradoxical_problem: 5,
      meta_learning: 5,
      biomimetic_path: 6,
      first_principles: 4,
      cultural_integration: 5,
      neuro_computational: 6,
    };

    return stepCounts[technique] || 3;
  }
}
