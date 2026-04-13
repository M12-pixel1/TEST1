import type { DiagnosticSessionRepository } from '../domain/diagnostic-session.ts';
import type { GrowthPathRepository } from '../domain/growth-path.ts';
import type { TaskAttemptRepository } from '../domain/task-attempt.ts';

export interface ProgressProofView {
  userId: string;
  baselineSessionId: string;
  baselineTopFocusArea: string;
  currentTopFocusArea: string;
  completedPracticeAttempts: number;
  latestFeedbackSummary: string | null;
  currentNextAction: string;
  updatedAt: string;
}

export interface ProgressProofApi {
  getByUserId(userId: string): ProgressProofView | null;
}

const latestIso = (values: Array<string | null | undefined>): string => {
  const filtered = values.filter((value): value is string => Boolean(value));
  return filtered.sort((a, b) => a.localeCompare(b)).at(-1) ?? new Date(0).toISOString();
};

const toFeedbackSummary = (feedback: {
  strengths: string[];
  gaps: string[];
  nextAction: string;
}): string =>
  `Strengths: ${feedback.strengths.join('; ')} | Gaps: ${feedback.gaps.join('; ')} | Next action: ${feedback.nextAction}`;

export const createProgressProofApi = (
  sessions: DiagnosticSessionRepository,
  growthPaths: GrowthPathRepository,
  attempts: TaskAttemptRepository
): ProgressProofApi => ({
  getByUserId(userId) {
    const latestCompletedSession = sessions
      .listByUserId(userId)
      .filter((session) => session.status === 'completed' && Boolean(session.scoringResult))
      .at(-1);

    if (!latestCompletedSession?.scoringResult) {
      return null;
    }

    const userAttempts = attempts.listByUserId(userId);
    const latestAttemptWithFeedback = [...userAttempts].reverse().find((attempt) => Boolean(attempt.feedback));
    const growthPath = growthPaths.getByUserId(userId);

    return {
      userId,
      baselineSessionId: latestCompletedSession.id,
      baselineTopFocusArea: latestCompletedSession.scoringResult.topFocusArea,
      currentTopFocusArea:
        growthPath?.basedOnTopFocusArea ?? latestCompletedSession.scoringResult.topFocusArea,
      completedPracticeAttempts: userAttempts.length,
      latestFeedbackSummary: latestAttemptWithFeedback?.feedback
        ? toFeedbackSummary(latestAttemptWithFeedback.feedback)
        : null,
      currentNextAction:
        growthPath?.todayAction ?? `Next action: improve ${latestCompletedSession.scoringResult.initialPriorityFocus}`,
      updatedAt: latestIso([
        latestCompletedSession.completedAt,
        latestAttemptWithFeedback?.createdAt,
        growthPath?.updatedAt
      ])
    };
  }
});
