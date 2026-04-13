import type { DiagnosticSessionRepository } from '../domain/diagnostic-session.ts';
import type { V1SkillBlock } from '../domain/scoring-engine.ts';

export interface SkillBlockSnapshot {
  skill: V1SkillBlock;
  score: number;
}

export interface PublicSkillSnapshot {
  sessionId: string;
  skillBlocks: SkillBlockSnapshot[];
  topStrength: V1SkillBlock;
  topFocusArea: V1SkillBlock;
  nextAction: string;
}

export interface SkillSnapshotReadApi {
  getBySessionId(sessionId: string): PublicSkillSnapshot | null;
}

const toNextAction = (focus: V1SkillBlock): string => `Next action: improve ${focus}`;

export const createSkillSnapshotReadApi = (
  sessionRepository: DiagnosticSessionRepository
): SkillSnapshotReadApi => ({
  getBySessionId(sessionId) {
    const persisted = sessionRepository.getScoringResult(sessionId);
    if (!persisted) {
      return null;
    }

    return {
      sessionId,
      skillBlocks: [
        { skill: 'Discovery', score: persisted.scores.Discovery },
        { skill: 'Listening & Diagnosis', score: persisted.scores['Listening & Diagnosis'] },
        { skill: 'Value Articulation', score: persisted.scores['Value Articulation'] },
        { skill: 'Objection Handling', score: persisted.scores['Objection Handling'] },
        { skill: 'Follow-up Discipline', score: persisted.scores['Follow-up Discipline'] }
      ],
      topStrength: persisted.topStrength,
      topFocusArea: persisted.topFocusArea,
      nextAction: toNextAction(persisted.initialPriorityFocus)
    };
  }
});
