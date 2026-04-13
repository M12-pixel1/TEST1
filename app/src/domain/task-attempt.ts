import type { AttemptFeedback } from './practice-feedback.ts';
import type { PracticeTaskRepository } from './practice-task.ts';

export interface TaskAttemptScorePlaceholder {
  status: 'pending';
}

export interface TaskAttemptFeedbackPlaceholder {
  status: 'pending';
}

export interface TaskAttempt {
  id: string;
  taskId: string;
  userId: string;
  response: string;
  scorePlaceholder: TaskAttemptScorePlaceholder;
  feedbackPlaceholder: TaskAttemptFeedbackPlaceholder;
  feedback: AttemptFeedback | null;
  createdAt: string;
}

export interface CreateTaskAttemptInput {
  taskId: string;
  userId: string;
  response: string;
}

export interface TaskAttemptRepository {
  create(input: CreateTaskAttemptInput): TaskAttempt;
  saveFeedback(attemptId: string, feedback: AttemptFeedback): TaskAttempt;
  getById(attemptId: string): TaskAttempt | null;
  listByTaskId(taskId: string): TaskAttempt[];
  listByUserId(userId: string): TaskAttempt[];
}

export class InMemoryTaskAttemptRepository implements TaskAttemptRepository {
  private readonly attempts = new Map<string, TaskAttempt>();
  private readonly tasks: PracticeTaskRepository;

  constructor(tasks: PracticeTaskRepository) {
    this.tasks = tasks;
  }

  create(input: CreateTaskAttemptInput): TaskAttempt {
    const task = this.tasks.getById(input.taskId);
    if (!task) {
      throw new Error('Practice task not found');
    }

    const attempt: TaskAttempt = {
      id: crypto.randomUUID(),
      taskId: task.id,
      userId: input.userId,
      response: input.response,
      scorePlaceholder: { status: 'pending' },
      feedbackPlaceholder: { status: 'pending' },
      feedback: null,
      createdAt: new Date().toISOString()
    };

    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  saveFeedback(attemptId: string, feedback: AttemptFeedback): TaskAttempt {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) {
      throw new Error('Task attempt not found');
    }

    const updated: TaskAttempt = {
      ...attempt,
      feedback: JSON.parse(JSON.stringify(feedback)) as AttemptFeedback
    };

    this.attempts.set(updated.id, updated);
    return updated;
  }

  getById(attemptId: string): TaskAttempt | null {
    return this.attempts.get(attemptId) ?? null;
  }

  listByTaskId(taskId: string): TaskAttempt[] {
    return [...this.attempts.values()].filter((attempt) => attempt.taskId === taskId);
  }

  listByUserId(userId: string): TaskAttempt[] {
    return [...this.attempts.values()]
      .filter((attempt) => attempt.userId === userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}
