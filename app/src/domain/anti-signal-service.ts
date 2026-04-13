import type { V1SkillScoreResult } from './scoring-engine.ts';
import type { TaskAttempt } from './task-attempt.ts';
import {
  computeConfidenceGapSignal,
  computeFrictionPointSignal,
  computeRepeatErrorSignal,
  type FlowStageSample,
  type AntiSignalRepository,
  type AntiSignal
} from './anti-signal.ts';
import { InMemoryAntiSignalEventStore } from './anti-events.ts';

export class AntiSignalService {
  private readonly signals: AntiSignalRepository;
  private readonly events: InMemoryAntiSignalEventStore;

  constructor(signals: AntiSignalRepository, events: InMemoryAntiSignalEventStore) {
    this.signals = signals;
    this.events = events;
  }

  createConfidenceGap(
    userId: string,
    relatedSessionId: string,
    declaredConfidence: number,
    scoringResult: V1SkillScoreResult
  ): AntiSignal {
    return this.store(computeConfidenceGapSignal(userId, relatedSessionId, declaredConfidence, scoringResult));
  }

  createRepeatError(userId: string, attempts: TaskAttempt[]): AntiSignal {
    return this.store(computeRepeatErrorSignal(userId, attempts));
  }

  createFrictionPoint(
    userId: string,
    samples: FlowStageSample[],
    relatedTaskAttemptId: string | null
  ): AntiSignal {
    return this.store(computeFrictionPointSignal(userId, samples, relatedTaskAttemptId));
  }

  listByUserId(userId: string): AntiSignal[] {
    return this.signals.listByUserId(userId);
  }

  private store(signal: Omit<AntiSignal, 'id' | 'createdAt'>): AntiSignal {
    const created = this.signals.create(signal);

    this.events.append({
      type: 'anti_signal_triggered',
      signalId: created.id,
      userId: created.userId,
      signalType: created.type,
      occurredAt: new Date().toISOString()
    });

    return created;
  }
}
