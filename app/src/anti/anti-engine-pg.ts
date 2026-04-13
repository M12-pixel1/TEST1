import type { Repository, SignalEventRow, AntiSignalRow, SystemFaultSignal } from '../db/pg/repo-types.ts';
import { PatternDetector } from './pattern-detector.ts';
import { shouldTriggerCorrection, CORRECTION_MAP } from './corrector.ts';
import { toInterpretedSignal, filterForUser, filterForManager, filterForProductTeam } from './visibility.ts';
import type { SignalEvent, InterpretedSignal } from './types.ts';

export interface AsyncAntiEngineResult {
  userId: string;
  patternsDetected: number;
  signalsPersisted: number;
  interpreted: InterpretedSignal[];
  forUser: InterpretedSignal[];
  forManager: InterpretedSignal[];
  forProductTeam: InterpretedSignal[];
}

const toSignalEvent = (row: SignalEventRow): SignalEvent => ({
  id: row.id,
  userId: row.userId,
  sessionId: row.sessionId,
  taskId: row.taskId,
  eventType: row.eventType,
  rawData: row.rawData,
  createdAt: row.createdAt,
});

export class AsyncAntiEngine {
  private readonly repo: Repository;
  private readonly detector: PatternDetector;

  constructor(repo: Repository) {
    this.repo = repo;
    this.detector = new PatternDetector();
  }

  async analyzeUser(userId: string): Promise<AsyncAntiEngineResult> {
    const rows = await this.repo.getRecentSignalEvents(userId, 14);
    const events = rows.map(toSignalEvent);
    const patterns = this.detector.detectAll(events);

    let signalsPersisted = 0;
    for (const pattern of patterns) {
      if (shouldTriggerCorrection(pattern)) {
        await this.repo.saveAntiSignal({
          userId,
          signalType: pattern.type,
          strength: pattern.strength,
          severity: pattern.severity,
          confidence: pattern.confidence,
          relatedTaskId: pattern.relatedTaskId,
          recommendedAction: CORRECTION_MAP[pattern.type].action,
        });
        signalsPersisted++;
      }
    }

    const interpreted = patterns.map(toInterpretedSignal);

    return {
      userId,
      patternsDetected: patterns.length,
      signalsPersisted,
      interpreted,
      forUser: filterForUser(interpreted),
      forManager: filterForManager(interpreted),
      forProductTeam: filterForProductTeam(interpreted),
    };
  }

  async analyzeSystemFaults(daysWindow: number = 7): Promise<SystemFaultSignal[]> {
    const allEvents = await this.repo.getAllSignalEventsInWindow(daysWindow);
    const taskGroups = new Map<string, Set<string>>();
    const taskAbandonCounts = new Map<string, number>();

    for (const event of allEvents) {
      if (event.eventType !== 'abandon' && event.eventType !== 'task_result') continue;
      const taskId = event.taskId ?? (event.rawData.task_id as string | undefined);
      if (!taskId) continue;

      if (!taskGroups.has(taskId)) {
        taskGroups.set(taskId, new Set());
        taskAbandonCounts.set(taskId, 0);
      }
      taskGroups.get(taskId)!.add(event.userId);

      if (event.eventType === 'abandon' ||
          (event.eventType === 'task_result' && (event.rawData.score as number) < 0.4)) {
        taskAbandonCounts.set(taskId, (taskAbandonCounts.get(taskId) ?? 0) + 1);
      }
    }

    const totalActiveUsers = await this.repo.getActiveUsersCount(daysWindow);
    const faults: SystemFaultSignal[] = [];

    for (const [taskId, users] of taskGroups) {
      const stuckRatio = users.size / Math.max(totalActiveUsers, 1);
      if (stuckRatio > 0.3 && users.size >= 3) {
        faults.push({
          taskId,
          affectedUsers: users.size,
          stuckRatio,
          totalAttempts: taskAbandonCounts.get(taskId) ?? 0,
          severity: stuckRatio > 0.5 ? 'critical' : 'warning',
          recommendedAction: 'FLAG_TO_PRODUCT_TEAM',
          detectedAt: new Date(),
        });
      }
    }

    return faults;
  }
}
