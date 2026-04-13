import pg from 'pg';
import type {
  Repository, User, CreateUserInput,
  SignalEventInput, SignalEventRow,
  AntiSignalInput, AntiSignalRow
} from './repo-types.ts';

const { Pool } = pg;

export class PostgresRepository implements Repository {
  private pool: InstanceType<typeof Pool>;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async createUser(data: CreateUserInput): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *`,
      [data.email, data.passwordHash, data.role]
    );
    return this.mapUser(result.rows[0]);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.mapUser(result.rows[0]) : null;
  }

  async recordSignalEvent(event: SignalEventInput): Promise<SignalEventRow> {
    const result = await this.pool.query(
      `INSERT INTO signal_events (user_id, session_id, task_id, event_type, raw_data)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5)
       RETURNING *`,
      [event.userId, event.sessionId ?? null, event.taskId ?? null,
       event.eventType, JSON.stringify(event.rawData)]
    );
    return this.mapSignalEvent(result.rows[0]);
  }

  async getRecentSignalEvents(userId: string, days: number): Promise<SignalEventRow[]> {
    const result = await this.pool.query(
      `SELECT * FROM signal_events
       WHERE user_id = $1 AND created_at > NOW() - make_interval(days => $2)
       ORDER BY created_at DESC`,
      [userId, days]
    );
    return result.rows.map((r: Record<string, unknown>) => this.mapSignalEvent(r));
  }

  async getAllSignalEventsInWindow(days: number): Promise<SignalEventRow[]> {
    const result = await this.pool.query(
      `SELECT * FROM signal_events
       WHERE created_at > NOW() - make_interval(days => $1)
       ORDER BY created_at DESC`,
      [days]
    );
    return result.rows.map((r: Record<string, unknown>) => this.mapSignalEvent(r));
  }

  async saveAntiSignal(signal: AntiSignalInput): Promise<AntiSignalRow> {
    const result = await this.pool.query(
      `INSERT INTO anti_signals_v2
       (user_id, signal_type, strength, severity, confidence, related_task_id, recommended_action)
       VALUES ($1::uuid, $2, $3, $4, $5, $6::uuid, $7)
       RETURNING *`,
      [signal.userId, signal.signalType, signal.strength, signal.severity,
       signal.confidence, signal.relatedTaskId, signal.recommendedAction]
    );
    return this.mapAntiSignal(result.rows[0]);
  }

  async getActiveAntiSignals(userId: string): Promise<AntiSignalRow[]> {
    const result = await this.pool.query(
      `SELECT * FROM anti_signals_v2
       WHERE user_id = $1 AND resolved_at IS NULL
       ORDER BY severity DESC, detected_at DESC`,
      [userId]
    );
    return result.rows.map((r: Record<string, unknown>) => this.mapAntiSignal(r));
  }

  async getAllActiveAntiSignals(): Promise<AntiSignalRow[]> {
    const result = await this.pool.query(
      `SELECT * FROM anti_signals_v2 WHERE resolved_at IS NULL ORDER BY detected_at DESC`
    );
    return result.rows.map((r: Record<string, unknown>) => this.mapAntiSignal(r));
  }

  async getActiveUsersCount(days: number): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(DISTINCT user_id) as cnt FROM signal_events
       WHERE created_at > NOW() - make_interval(days => $1)`,
      [days]
    );
    return parseInt(result.rows[0].cnt, 10);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private mapUser(row: Record<string, unknown>): User {
    return { id: row.id as string, email: row.email as string, passwordHash: row.password_hash as string, role: row.role as string, createdAt: String(row.created_at) };
  }

  private mapSignalEvent(row: Record<string, unknown>): SignalEventRow {
    const raw = row.raw_data;
    return {
      id: row.id as string, userId: row.user_id as string,
      sessionId: (row.session_id as string) ?? null, taskId: (row.task_id as string) ?? null,
      eventType: row.event_type as string,
      rawData: typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>),
      createdAt: String(row.created_at)
    };
  }

  private mapAntiSignal(row: Record<string, unknown>): AntiSignalRow {
    return {
      id: row.id as string, userId: row.user_id as string,
      signalType: row.signal_type as string, strength: parseFloat(String(row.strength)),
      severity: row.severity as string, confidence: parseFloat(String(row.confidence)),
      relatedTaskId: (row.related_task_id as string) ?? null,
      recommendedAction: row.recommended_action as string,
      detectedAt: String(row.detected_at), resolvedAt: row.resolved_at ? String(row.resolved_at) : null
    };
  }
}
