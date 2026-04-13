import type { V1SkillScoreResult } from './scoring-engine.ts';
import type { TaskAttempt } from './task-attempt.ts';

export const ANTI_SIGNAL_TYPES = [
  'confidence_gap',
  'repeat_error',
  'friction_point'
] as const;

export type AntiSignalType = (typeof ANTI_SIGNAL_TYPES)[number];

export type AntiSignalSeverity = 'normal' | 'warning' | 'critical';

export interface AntiSignal {
  id: string;
  userId: string;
  relatedSessionId: string | null;
  relatedTaskAttemptId: string | null;
  type: AntiSignalType;
  severity: AntiSignalSeverity;
  signalStrength: number;
  recommendedAction: string;
  createdAt: string;
}

export interface FlowStageSample {
  stage: string;
  completed: boolean;
}

export interface AntiSignalRepository {
  create(signal: Omit<AntiSignal, 'id' | 'createdAt'>): AntiSignal;
  listByUserId(userId: string): AntiSignal[];
}

const toSeverity = (signalStrength: number): AntiSignalSeverity => {
  if (signalStrength >= 70) {
    return 'critical';
  }
  if (signalStrength >= 35) {
    return 'warning';
  }
  return 'normal';
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const computeConfidenceGapSignal = (
  userId: string,
  relatedSessionId: string,
  declaredConfidence: number,
  scoringResult: V1SkillScoreResult
): Omit<AntiSignal, 'id' | 'createdAt'> => {
  const averageScore =
    Object.values(scoringResult.scores).reduce((sum, score) => sum + score, 0) /
    Object.keys(scoringResult.scores).length;

  const declaredAsScore = clamp(declaredConfidence, 1, 5) * 20;
  const gap = Math.abs(declaredAsScore - averageScore);
  const signalStrength = clamp(Math.round(gap), 0, 100);

  return {
    userId,
    relatedSessionId,
    relatedTaskAttemptId: null,
    type: 'confidence_gap',
    severity: toSeverity(signalStrength),
    signalStrength,
    recommendedAction: 'Compare expected vs actual score and pick one concrete adjustment for the next attempt.'
  };
};

export const computeRepeatErrorSignal = (
  userId: string,
  attempts: TaskAttempt[]
): Omit<AntiSignal, 'id' | 'createdAt'> => {
  const allGaps = attempts
    .flatMap((attempt) => attempt.feedback?.gaps ?? [])
    .map((gap) => gap.toLowerCase().trim())
    .filter((gap) => gap.length > 0);

  const frequencies = new Map<string, number>();
  allGaps.forEach((gap) => frequencies.set(gap, (frequencies.get(gap) ?? 0) + 1));
  const repeated = Math.max(0, ...frequencies.values());

  const signalStrength = clamp((repeated - 1) * 35, 0, 100);
  const latestAttempt = attempts.at(-1) ?? null;

  return {
    userId,
    relatedSessionId: null,
    relatedTaskAttemptId: latestAttempt?.id ?? null,
    type: 'repeat_error',
    severity: toSeverity(signalStrength),
    signalStrength,
    recommendedAction: 'Address one recurring gap with a single checklist item before submitting the next attempt.'
  };
};

export const computeFrictionPointSignal = (
  userId: string,
  samples: FlowStageSample[],
  relatedTaskAttemptId: string | null
): Omit<AntiSignal, 'id' | 'createdAt'> => {
  const failedByStage = new Map<string, number>();

  samples.forEach((sample) => {
    if (!sample.completed) {
      failedByStage.set(sample.stage, (failedByStage.get(sample.stage) ?? 0) + 1);
    }
  });

  const repeatedFriction = Math.max(0, ...failedByStage.values());
  const signalStrength = clamp((repeatedFriction - 1) * 40, 0, 100);

  return {
    userId,
    relatedSessionId: null,
    relatedTaskAttemptId,
    type: 'friction_point',
    severity: toSeverity(signalStrength),
    signalStrength,
    recommendedAction: 'Break the blocked stage into one smaller step and complete it before moving forward.'
  };
};

export class InMemoryAntiSignalRepository implements AntiSignalRepository {
  private readonly signals = new Map<string, AntiSignal>();

  create(signal: Omit<AntiSignal, 'id' | 'createdAt'>): AntiSignal {
    const created: AntiSignal = {
      ...signal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.signals.set(created.id, created);
    return created;
  }

  listByUserId(userId: string): AntiSignal[] {
    return [...this.signals.values()].filter((signal) => signal.userId === userId);
  }
}
