import type { DatabaseSync } from 'node:sqlite';
import type { DetectedPattern, AntiSignalRecord } from './types.ts';

export class SignalScorer {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  persist(userId: string, pattern: DetectedPattern): AntiSignalRecord {
    const id = crypto.randomUUID();
    const detectedAt = new Date().toISOString();
    const recommendedAction = this.recommendAction(pattern);

    this.db
      .prepare(
        `INSERT INTO anti_signals_v2
         (id, user_id, signal_type, strength, severity, confidence, related_session_id, related_task_id, recommended_action, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        userId,
        pattern.type,
        pattern.strength,
        pattern.severity,
        pattern.confidence,
        pattern.relatedSessionId,
        pattern.relatedTaskId,
        recommendedAction,
        detectedAt
      );

    return {
      id,
      userId,
      signalType: pattern.type,
      strength: pattern.strength,
      severity: pattern.severity,
      confidence: pattern.confidence,
      relatedSessionId: pattern.relatedSessionId,
      relatedTaskId: pattern.relatedTaskId,
      recommendedAction,
      detectedAt,
      resolvedAt: null,
      resolutionNotes: null
    };
  }

  getActiveSignals(userId: string): AntiSignalRecord[] {
    const rows = this.db
      .prepare(
        `SELECT id, user_id, signal_type, strength, severity, confidence,
                related_session_id, related_task_id, recommended_action,
                detected_at, resolved_at, resolution_notes
         FROM anti_signals_v2
         WHERE user_id = ? AND resolved_at IS NULL
         ORDER BY detected_at DESC`
      )
      .all(userId) as Array<{
      id: string;
      user_id: string;
      signal_type: string;
      strength: number;
      severity: string;
      confidence: number;
      related_session_id: string | null;
      related_task_id: string | null;
      recommended_action: string;
      detected_at: string;
      resolved_at: string | null;
      resolution_notes: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      signalType: row.signal_type as AntiSignalRecord['signalType'],
      strength: row.strength,
      severity: row.severity as AntiSignalRecord['severity'],
      confidence: row.confidence,
      relatedSessionId: row.related_session_id,
      relatedTaskId: row.related_task_id,
      recommendedAction: row.recommended_action,
      detectedAt: row.detected_at,
      resolvedAt: row.resolved_at,
      resolutionNotes: row.resolution_notes
    }));
  }

  resolve(signalId: string, notes: string): void {
    this.db
      .prepare(
        `UPDATE anti_signals_v2 SET resolved_at = ?, resolution_notes = ? WHERE id = ?`
      )
      .run(new Date().toISOString(), notes, signalId);
  }

  private recommendAction(pattern: DetectedPattern): string {
    switch (pattern.type) {
      case 'confidence_gap':
        return 'CALIBRATION_TASK';
      case 'repeat_error':
        return 'TARGETED_CORRECTION';
      case 'friction_point':
        return 'REDUCE_STEP';
      case 'false_progress':
        return 'QUALITY_GATE';
      case 'script_dependency':
        return 'SITUATIONAL_TASK';
      case 'drop_risk':
        return 'RE_ENTRY_PATH';
      case 'system_fault':
        return 'FLAG_TO_PRODUCT_TEAM';
    }
  }
}
