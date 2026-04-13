import type { DatabaseSync } from 'node:sqlite';
import { isRole, type Role } from '../domain/roles.ts';
import type {
  CompleteDiagnosticInput,
  DiagnosticSession,
  DiagnosticSessionRepository,
  RawAnswers,
  StartDiagnosticInput
} from '../domain/diagnostic-session.ts';
import type { V1SkillScoreResult } from '../domain/scoring-engine.ts';
import type { GrowthPath, GrowthPathRepository, UpsertGrowthPathInput } from '../domain/growth-path.ts';
import type {
  CreatePracticeTaskInput,
  PracticeTask,
  PracticeTaskRepository
} from '../domain/practice-task.ts';
import type {
  CreateTaskAttemptInput,
  TaskAttempt,
  TaskAttemptRepository
} from '../domain/task-attempt.ts';
import type { AttemptFeedback } from '../domain/practice-feedback.ts';
import type { AntiSignal, AntiSignalRepository } from '../domain/anti-signal.ts';
import type { OrganizationMembership, WorkspaceService } from '../domain/workspace.ts';

const parseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  return JSON.parse(value) as T;
};

export class SqliteDiagnosticSessionRepository implements DiagnosticSessionRepository {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  create(input: StartDiagnosticInput): DiagnosticSession {
    const id = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    this.db
      .prepare(
        `INSERT INTO diagnostic_sessions (
          id, user_id, organization_id, status, started_at, completed_at, raw_answers_json, scoring_result_json
        ) VALUES (?, ?, ?, 'started', ?, NULL, NULL, NULL)`
      )
      .run(id, input.userId, input.organizationId, startedAt);

    return {
      id,
      userId: input.userId,
      organizationId: input.organizationId,
      status: 'started',
      startedAt,
      completedAt: null,
      rawAnswers: null,
      scoringResult: null
    };
  }

  complete(input: CompleteDiagnosticInput): DiagnosticSession {
    const existing = this.getById(input.sessionId);
    if (!existing) {
      throw new Error('Diagnostic session not found');
    }
    if (existing.status === 'completed') {
      throw new Error('Diagnostic session already completed');
    }

    const completedAt = new Date().toISOString();
    this.db
      .prepare(
        'UPDATE diagnostic_sessions SET status = ?, completed_at = ?, raw_answers_json = ?, scoring_result_json = ? WHERE id = ?'
      )
      .run(
        'completed',
        completedAt,
        JSON.stringify(input.rawAnswers),
        JSON.stringify(input.scoringResult),
        input.sessionId
      );

    return {
      ...existing,
      status: 'completed',
      completedAt,
      rawAnswers: JSON.parse(JSON.stringify(input.rawAnswers)) as RawAnswers,
      scoringResult: JSON.parse(JSON.stringify(input.scoringResult)) as V1SkillScoreResult
    };
  }

  getById(sessionId: string): DiagnosticSession | null {
    const row = this.db
      .prepare(
        'SELECT id, user_id, organization_id, status, started_at, completed_at, raw_answers_json, scoring_result_json FROM diagnostic_sessions WHERE id = ?'
      )
      .get(sessionId) as
      | {
          id: string;
          user_id: string;
          organization_id: string;
          status: 'started' | 'completed';
          started_at: string;
          completed_at: string | null;
          raw_answers_json: string | null;
          scoring_result_json: string | null;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      rawAnswers: parseJson<RawAnswers>(row.raw_answers_json),
      scoringResult: parseJson<V1SkillScoreResult>(row.scoring_result_json)
    };
  }

  listByUserId(userId: string): DiagnosticSession[] {
    const rows = this.db
      .prepare(
        'SELECT id, user_id, organization_id, status, started_at, completed_at, raw_answers_json, scoring_result_json FROM diagnostic_sessions WHERE user_id = ? ORDER BY started_at'
      )
      .all(userId) as Array<{
      id: string;
      user_id: string;
      organization_id: string;
      status: 'started' | 'completed';
      started_at: string;
      completed_at: string | null;
      raw_answers_json: string | null;
      scoring_result_json: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      rawAnswers: parseJson<RawAnswers>(row.raw_answers_json),
      scoringResult: parseJson<V1SkillScoreResult>(row.scoring_result_json)
    }));
  }

  getScoringResult(sessionId: string): V1SkillScoreResult | null {
    const row = this.db
      .prepare('SELECT scoring_result_json FROM diagnostic_sessions WHERE id = ?')
      .get(sessionId) as { scoring_result_json: string | null } | undefined;

    return parseJson<V1SkillScoreResult>(row?.scoring_result_json ?? null);
  }
}

export class SqliteGrowthPathRepository implements GrowthPathRepository {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  upsert(input: UpsertGrowthPathInput): GrowthPath {
    const existing = this.getByUserId(input.userId);
    const now = new Date().toISOString();
    const id = existing?.id ?? crypto.randomUUID();
    const createdAt = existing?.createdAt ?? now;

    this.db
      .prepare(
        `INSERT INTO growth_paths (
          id, user_id, today_action, week_plan_json, month_focus, based_on_top_focus_area, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          today_action = excluded.today_action,
          week_plan_json = excluded.week_plan_json,
          month_focus = excluded.month_focus,
          based_on_top_focus_area = excluded.based_on_top_focus_area,
          updated_at = excluded.updated_at`
      )
      .run(
        id,
        input.userId,
        input.todayAction,
        JSON.stringify(input.weekPlan),
        input.monthFocus,
        input.basedOnTopFocusArea,
        createdAt,
        now
      );

    return {
      id,
      userId: input.userId,
      todayAction: input.todayAction,
      weekPlan: [...input.weekPlan],
      monthFocus: input.monthFocus,
      basedOnTopFocusArea: input.basedOnTopFocusArea,
      createdAt,
      updatedAt: now
    };
  }

  getByUserId(userId: string): GrowthPath | null {
    const row = this.db
      .prepare(
        'SELECT id, user_id, today_action, week_plan_json, month_focus, based_on_top_focus_area, created_at, updated_at FROM growth_paths WHERE user_id = ?'
      )
      .get(userId) as
      | {
          id: string;
          user_id: string;
          today_action: string;
          week_plan_json: string;
          month_focus: string;
          based_on_top_focus_area: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId: row.user_id,
      todayAction: row.today_action,
      weekPlan: parseJson<string[]>(row.week_plan_json) ?? [],
      monthFocus: row.month_focus,
      basedOnTopFocusArea: row.based_on_top_focus_area,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export class SqlitePracticeTaskRepository implements PracticeTaskRepository {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  create(input: CreatePracticeTaskInput): PracticeTask {
    const task: PracticeTask = {
      id: crypto.randomUUID(),
      type: input.type,
      title: input.title,
      prompt: input.prompt,
      createdAt: new Date().toISOString()
    };

    this.db
      .prepare('INSERT INTO practice_tasks (id, type, title, prompt, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(task.id, task.type, task.title, task.prompt, task.createdAt);

    return task;
  }

  getById(taskId: string): PracticeTask | null {
    const row = this.db
      .prepare('SELECT id, type, title, prompt, created_at FROM practice_tasks WHERE id = ?')
      .get(taskId) as
      | { id: string; type: PracticeTask['type']; title: string; prompt: string; created_at: string }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      prompt: row.prompt,
      createdAt: row.created_at
    };
  }

  list(): PracticeTask[] {
    const rows = this.db
      .prepare('SELECT id, type, title, prompt, created_at FROM practice_tasks ORDER BY created_at')
      .all() as Array<{ id: string; type: PracticeTask['type']; title: string; prompt: string; created_at: string }>;

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      prompt: row.prompt,
      createdAt: row.created_at
    }));
  }
}

export class SqliteTaskAttemptRepository implements TaskAttemptRepository {
  private readonly db: DatabaseSync;
  private readonly tasks: PracticeTaskRepository;

  constructor(db: DatabaseSync, tasks: PracticeTaskRepository) {
    this.db = db;
    this.tasks = tasks;
  }

  create(input: CreateTaskAttemptInput): TaskAttempt {
    const task = this.tasks.getById(input.taskId);
    if (!task) {
      throw new Error('Practice task not found');
    }

    const attempt: TaskAttempt = {
      id: crypto.randomUUID(),
      taskId: input.taskId,
      userId: input.userId,
      response: input.response,
      scorePlaceholder: { status: 'pending' },
      feedbackPlaceholder: { status: 'pending' },
      feedback: null,
      createdAt: new Date().toISOString()
    };

    this.db
      .prepare(
        `INSERT INTO task_attempts (
          id, task_id, user_id, response, score_placeholder_json, feedback_placeholder_json, feedback_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        attempt.id,
        attempt.taskId,
        attempt.userId,
        attempt.response,
        JSON.stringify(attempt.scorePlaceholder),
        JSON.stringify(attempt.feedbackPlaceholder),
        null,
        attempt.createdAt
      );

    return attempt;
  }

  saveFeedback(attemptId: string, feedback: AttemptFeedback): TaskAttempt {
    const current = this.getById(attemptId);
    if (!current) {
      throw new Error('Task attempt not found');
    }

    this.db.prepare('UPDATE task_attempts SET feedback_json = ? WHERE id = ?').run(JSON.stringify(feedback), attemptId);

    return {
      ...current,
      feedback: JSON.parse(JSON.stringify(feedback)) as AttemptFeedback
    };
  }

  getById(attemptId: string): TaskAttempt | null {
    const row = this.db
      .prepare(
        `SELECT id, task_id, user_id, response, score_placeholder_json, feedback_placeholder_json, feedback_json, created_at
         FROM task_attempts WHERE id = ?`
      )
      .get(attemptId) as
      | {
          id: string;
          task_id: string;
          user_id: string;
          response: string;
          score_placeholder_json: string;
          feedback_placeholder_json: string;
          feedback_json: string | null;
          created_at: string;
        }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      response: row.response,
      scorePlaceholder: parseJson<{ status: 'pending' }>(row.score_placeholder_json) ?? { status: 'pending' },
      feedbackPlaceholder: parseJson<{ status: 'pending' }>(row.feedback_placeholder_json) ?? {
        status: 'pending'
      },
      feedback: parseJson<AttemptFeedback>(row.feedback_json),
      createdAt: row.created_at
    };
  }

  listByTaskId(taskId: string): TaskAttempt[] {
    const rows = this.db
      .prepare(
        `SELECT id, task_id, user_id, response, score_placeholder_json, feedback_placeholder_json, feedback_json, created_at
         FROM task_attempts WHERE task_id = ? ORDER BY created_at`
      )
      .all(taskId) as Array<{
      id: string;
      task_id: string;
      user_id: string;
      response: string;
      score_placeholder_json: string;
      feedback_placeholder_json: string;
      feedback_json: string | null;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      response: row.response,
      scorePlaceholder: parseJson<{ status: 'pending' }>(row.score_placeholder_json) ?? { status: 'pending' },
      feedbackPlaceholder: parseJson<{ status: 'pending' }>(row.feedback_placeholder_json) ?? {
        status: 'pending'
      },
      feedback: parseJson<AttemptFeedback>(row.feedback_json),
      createdAt: row.created_at
    }));
  }

  listByUserId(userId: string): TaskAttempt[] {
    const rows = this.db
      .prepare(
        `SELECT id, task_id, user_id, response, score_placeholder_json, feedback_placeholder_json, feedback_json, created_at
         FROM task_attempts WHERE user_id = ? ORDER BY created_at`
      )
      .all(userId) as Array<{
      id: string;
      task_id: string;
      user_id: string;
      response: string;
      score_placeholder_json: string;
      feedback_placeholder_json: string;
      feedback_json: string | null;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      response: row.response,
      scorePlaceholder: parseJson<{ status: 'pending' }>(row.score_placeholder_json) ?? { status: 'pending' },
      feedbackPlaceholder: parseJson<{ status: 'pending' }>(row.feedback_placeholder_json) ?? {
        status: 'pending'
      },
      feedback: parseJson<AttemptFeedback>(row.feedback_json),
      createdAt: row.created_at
    }));
  }
}

export class SqliteAntiSignalRepository implements AntiSignalRepository {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  create(signal: Omit<AntiSignal, 'id' | 'createdAt'>): AntiSignal {
    const created: AntiSignal = {
      ...signal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    this.db
      .prepare(
        `INSERT INTO anti_signals (
          id, user_id, related_session_id, related_task_attempt_id, type, severity, signal_strength, recommended_action, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        created.id,
        created.userId,
        created.relatedSessionId,
        created.relatedTaskAttemptId,
        created.type,
        created.severity,
        created.signalStrength,
        created.recommendedAction,
        created.createdAt
      );

    return created;
  }

  listByUserId(userId: string): AntiSignal[] {
    const rows = this.db
      .prepare(
        `SELECT id, user_id, related_session_id, related_task_attempt_id, type, severity, signal_strength, recommended_action, created_at
         FROM anti_signals WHERE user_id = ? ORDER BY created_at`
      )
      .all(userId) as Array<{
      id: string;
      user_id: string;
      related_session_id: string | null;
      related_task_attempt_id: string | null;
      type: AntiSignal['type'];
      severity: AntiSignal['severity'];
      signal_strength: number;
      recommended_action: string;
      created_at: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      relatedSessionId: row.related_session_id,
      relatedTaskAttemptId: row.related_task_attempt_id,
      type: row.type,
      severity: row.severity,
      signalStrength: row.signal_strength,
      recommendedAction: row.recommended_action,
      createdAt: row.created_at
    }));
  }
}

export class SqliteWorkspaceService implements WorkspaceService {
  private readonly db: DatabaseSync;

  constructor(db: DatabaseSync) {
    this.db = db;
  }

  assignMembership(userId: string, organizationId: string, role: string): OrganizationMembership {
    if (!isRole(role)) {
      throw new Error('Invalid role');
    }

    const createdAt = new Date().toISOString();
    this.db
      .prepare(
        'INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING'
      )
      .run(organizationId, organizationId, createdAt);

    this.db
      .prepare(
        `INSERT INTO organization_memberships (organization_id, user_id, role, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(organization_id, user_id) DO UPDATE SET role = excluded.role`
      )
      .run(organizationId, userId, role, createdAt);

    return { userId, organizationId, role };
  }

  getMembership(userId: string, organizationId: string): OrganizationMembership | null {
    const row = this.db
      .prepare('SELECT organization_id, user_id, role FROM organization_memberships WHERE organization_id = ? AND user_id = ?')
      .get(organizationId, userId) as
      | { organization_id: string; user_id: string; role: Role }
      | undefined;

    if (!row) {
      return null;
    }

    return {
      userId: row.user_id,
      organizationId: row.organization_id,
      role: row.role
    };
  }

  listByOrganizationId(organizationId: string): OrganizationMembership[] {
    const rows = this.db
      .prepare('SELECT organization_id, user_id, role FROM organization_memberships WHERE organization_id = ? ORDER BY user_id')
      .all(organizationId) as Array<{ organization_id: string; user_id: string; role: Role }>;

    return rows.map((row) => ({
      userId: row.user_id,
      organizationId: row.organization_id,
      role: row.role
    }));
  }
}
