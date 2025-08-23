/**
 * SessionAdapter - Bridges Cloudflare KV storage with existing SessionManager logic
 */

import * as crypto from 'node:crypto';
import {
  isValidTechnique,
  getStepCountForTechnique,
  ValidTechnique,
  VALID_TECHNIQUES,
} from '../constants/techniques';

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

    // Batch fetch all sessions in parallel with error resilience
    const sessionPromises = list.keys.map(key =>
      this.kv
        .get(key.name, { type: 'json' })
        .then(data => ({ status: 'fulfilled', value: data as SessionData | null }))
        .catch(error => ({ status: 'rejected', reason: error }))
    );

    const sessionResults = await Promise.allSettled(sessionPromises);

    // Log any failed fetches for monitoring
    const failures = sessionResults.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`Failed to fetch ${failures.length} sessions:`, failures);
    }

    // Extract successful sessions
    const sessions = sessionResults
      .filter(
        (result): result is PromiseFulfilledResult<{ status: string; value: SessionData | null }> =>
          result.status === 'fulfilled' && (result as any).value?.value !== null
      )
      .map(result => result.value.value as SessionData);

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
    // Validate all techniques before creating the plan
    const invalidTechniques = techniques.filter(t => !isValidTechnique(t));
    if (invalidTechniques.length > 0) {
      throw new Error(`Invalid techniques: ${invalidTechniques.join(', ')}`);
    }

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
    // Use crypto.randomUUID() for cryptographically secure random generation
    const uuid = crypto.randomUUID();
    // Take first 8 characters of UUID for compact ID
    const random = uuid.replace(/-/g, '').substring(0, 8);
    return `plan_${timestamp}_${random}`;
  }

  private generateSteps(techniques: string[]): any[] {
    // Generate execution steps based on techniques
    const steps: any[] = [];
    let stepNumber = 1;

    for (const technique of techniques) {
      // Use validated step count function
      const stepCount = getStepCountForTechnique(technique);
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
}
