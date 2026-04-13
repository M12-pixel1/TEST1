import type { DatabaseSync } from 'node:sqlite';
import type { SignalEvent } from './types.ts';

export class SignalCollector {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  record(event: Omit<SignalEvent, 'id' | 'createdAt'>): SignalEvent {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO signal_events (id, user_id, session_id, task_id, event_type, raw_data_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(id, event.userId, event.sessionId, event.taskId, event.eventType, JSON.stringify(event.rawData), createdAt);

    return { id, ...event, createdAt };
  }

  getRecentEvents(userId: string, days: number): SignalEvent[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const rows = this.db
      .prepare(
        `SELECT id, user_id, session_id, task_id, event_type, raw_data_json, created_at
         FROM signal_events
         WHERE user_id = ? AND created_at >= ?
         ORDER BY created_at DESC`
      )
      .all(userId, cutoff) as Array<{
      id: string;
      user_id: string;
      session_id: string | null;
      task_id: string | null;
      event_type: string;
      raw_data_json: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      taskId: row.task_id,
      eventType: row.event_type,
      rawData: JSON.parse(row.raw_data_json) as Record<string, unknown>,
      createdAt: row.created_at
    }));
  }

  getEventsByType(userId: string, eventType: string, days: number): SignalEvent[] {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const rows = this.db
      .prepare(
        `SELECT id, user_id, session_id, task_id, event_type, raw_data_json, created_at
         FROM signal_events
         WHERE user_id = ? AND event_type = ? AND created_at >= ?
         ORDER BY created_at DESC`
      )
      .all(userId, eventType, cutoff) as Array<{
      id: string;
      user_id: string;
      session_id: string | null;
      task_id: string | null;
      event_type: string;
      raw_data_json: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      taskId: row.task_id,
      eventType: row.event_type,
      rawData: JSON.parse(row.raw_data_json) as Record<string, unknown>,
      createdAt: row.created_at
    }));
  }
}
