import type { V1SkillScoreResult } from './scoring-engine.ts';

export type DiagnosticStatus = 'started' | 'completed';

export type RawAnswers = Record<string, unknown>;

export interface SkillSnapshotPlaceholder {
  version: 'v1-placeholder';
  generatedAt: string;
  summary: 'pending_scoring';
}

export interface DiagnosticSession {
  id: string;
  userId: string;
  organizationId: string;
  status: DiagnosticStatus;
  startedAt: string;
  completedAt: string | null;
  rawAnswers: RawAnswers | null;
  scoringResult: V1SkillScoreResult | null;
}

export interface StartDiagnosticInput {
  userId: string;
  organizationId: string;
}

export interface CompleteDiagnosticInput {
  sessionId: string;
  rawAnswers: RawAnswers;
  scoringResult: V1SkillScoreResult;
}

export interface DiagnosticSessionRepository {
  create(input: StartDiagnosticInput): DiagnosticSession;
  complete(input: CompleteDiagnosticInput): DiagnosticSession;
  getById(sessionId: string): DiagnosticSession | null;
  listByUserId(userId: string): DiagnosticSession[];
  getScoringResult(sessionId: string): V1SkillScoreResult | null;
}

const cloneRawAnswers = (rawAnswers: RawAnswers): RawAnswers =>
  JSON.parse(JSON.stringify(rawAnswers)) as RawAnswers;

const cloneScoringResult = (scoringResult: V1SkillScoreResult): V1SkillScoreResult =>
  JSON.parse(JSON.stringify(scoringResult)) as V1SkillScoreResult;

export class InMemoryDiagnosticSessionRepository implements DiagnosticSessionRepository {
  private readonly sessions = new Map<string, DiagnosticSession>();

  create(input: StartDiagnosticInput): DiagnosticSession {
    const session: DiagnosticSession = {
      id: crypto.randomUUID(),
      userId: input.userId,
      organizationId: input.organizationId,
      status: 'started',
      startedAt: new Date().toISOString(),
      completedAt: null,
      rawAnswers: null,
      scoringResult: null
    };

    this.sessions.set(session.id, session);
    return session;
  }

  complete(input: CompleteDiagnosticInput): DiagnosticSession {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error('Diagnostic session not found');
    }

    if (session.status === 'completed') {
      throw new Error('Diagnostic session already completed');
    }

    const completedSession: DiagnosticSession = {
      ...session,
      status: 'completed',
      completedAt: new Date().toISOString(),
      rawAnswers: cloneRawAnswers(input.rawAnswers),
      scoringResult: cloneScoringResult(input.scoringResult)
    };

    this.sessions.set(completedSession.id, completedSession);
    return completedSession;
  }

  getById(sessionId: string): DiagnosticSession | null {
    return this.sessions.get(sessionId) ?? null;
  }


  listByUserId(userId: string): DiagnosticSession[] {
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }

  getScoringResult(sessionId: string): V1SkillScoreResult | null {
    return this.sessions.get(sessionId)?.scoringResult ?? null;
  }
}

export const buildSkillSnapshotPlaceholder = (): SkillSnapshotPlaceholder => ({
  version: 'v1-placeholder',
  generatedAt: new Date().toISOString(),
  summary: 'pending_scoring'
});
