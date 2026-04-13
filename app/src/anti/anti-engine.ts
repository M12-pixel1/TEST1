import type { DatabaseSync } from 'node:sqlite';
import type { AntiSignalRecord, InterpretedSignal } from './types.ts';
import { SignalCollector } from './signal-collector.ts';
import { PatternDetector } from './pattern-detector.ts';
import { SignalScorer } from './signal-scorer.ts';
import { shouldTriggerCorrection } from './corrector.ts';
import { toInterpretedSignal, filterForUser, filterForManager, filterForProductTeam } from './visibility.ts';

export interface AntiEngineResult {
  userId: string;
  patternsDetected: number;
  signalsPersisted: number;
  interpreted: InterpretedSignal[];
  forUser: InterpretedSignal[];
  forManager: InterpretedSignal[];
  forProductTeam: InterpretedSignal[];
}

export class AntiEngine {
  private readonly collector: SignalCollector;
  private readonly detector: PatternDetector;
  private readonly scorer: SignalScorer;

  constructor(db: DatabaseSync) {
    this.collector = new SignalCollector(db);
    this.detector = new PatternDetector();
    this.scorer = new SignalScorer(db);
  }

  analyze(userId: string): AntiEngineResult {
    const events = this.collector.getRecentEvents(userId, 14);
    const patterns = this.detector.detectAll(events);

    const persisted: AntiSignalRecord[] = [];
    for (const pattern of patterns) {
      if (shouldTriggerCorrection(pattern)) {
        persisted.push(this.scorer.persist(userId, pattern));
      }
    }

    const interpreted = patterns.map(toInterpretedSignal);

    return {
      userId,
      patternsDetected: patterns.length,
      signalsPersisted: persisted.length,
      interpreted,
      forUser: filterForUser(interpreted),
      forManager: filterForManager(interpreted),
      forProductTeam: filterForProductTeam(interpreted)
    };
  }

  recordEvent(
    userId: string,
    eventType: string,
    rawData: Record<string, unknown>,
    sessionId: string | null = null,
    taskId: string | null = null
  ): void {
    this.collector.record({ userId, sessionId, taskId, eventType, rawData });
  }

  getActiveSignals(userId: string): AntiSignalRecord[] {
    return this.scorer.getActiveSignals(userId);
  }

  resolveSignal(signalId: string, notes: string): void {
    this.scorer.resolve(signalId, notes);
  }

  getCollector(): SignalCollector {
    return this.collector;
  }
}
