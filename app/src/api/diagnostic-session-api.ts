import {
  buildSkillSnapshotPlaceholder,
  type DiagnosticSessionRepository,
  type RawAnswers,
} from '../domain/diagnostic-session.ts';
import { InMemoryDiagnosticEventStore } from '../domain/events.ts';
import { computeV1SkillScores, type V1SkillScoreResult } from '../domain/scoring-engine.ts';

export interface StartDiagnosticRequest {
  userId: string;
  organizationId: string;
}

export interface StartDiagnosticResponse {
  sessionId: string;
  skillSnapshot: {
    version: 'v1-placeholder';
    generatedAt: string;
    summary: 'pending_scoring';
  };
}

export interface CompleteDiagnosticRequest {
  sessionId: string;
  rawAnswers: RawAnswers;
}

export interface CompleteDiagnosticResponse {
  sessionId: string;
  status: 'completed';
  skillSnapshot: V1SkillScoreResult;
}

export interface DiagnosticSessionApi {
  start(request: StartDiagnosticRequest): StartDiagnosticResponse;
  complete(request: CompleteDiagnosticRequest): CompleteDiagnosticResponse;
}

export const createDiagnosticSessionApi = (
  sessionRepository: DiagnosticSessionRepository,
  eventStore: InMemoryDiagnosticEventStore
): DiagnosticSessionApi => ({
  start(request) {
    const session = sessionRepository.create({
      userId: request.userId,
      organizationId: request.organizationId
    });

    eventStore.append({
      type: 'diagnostic_started',
      sessionId: session.id,
      userId: session.userId,
      organizationId: session.organizationId,
      occurredAt: new Date().toISOString()
    });

    return {
      sessionId: session.id,
      skillSnapshot: buildSkillSnapshotPlaceholder()
    };
  },

  complete(request) {
    const scoringResult = computeV1SkillScores(request.rawAnswers);

    const session = sessionRepository.complete({
      sessionId: request.sessionId,
      rawAnswers: request.rawAnswers,
      scoringResult
    });

    eventStore.append({
      type: 'diagnostic_completed',
      sessionId: session.id,
      userId: session.userId,
      organizationId: session.organizationId,
      occurredAt: new Date().toISOString()
    });

    return {
      sessionId: session.id,
      status: 'completed',
      skillSnapshot: scoringResult
    };
  }
});
