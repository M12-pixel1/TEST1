export const PRACTICE_TASK_TYPES = [
  'discovery_scenario',
  'objection_scenario',
  'follow_up_email',
  'client_situation_analysis'
] as const;

export type PracticeTaskType = (typeof PRACTICE_TASK_TYPES)[number];

export interface PracticeTask {
  id: string;
  type: PracticeTaskType;
  title: string;
  prompt: string;
  createdAt: string;
}

export interface CreatePracticeTaskInput {
  type: PracticeTaskType;
  title: string;
  prompt: string;
}

export interface PracticeTaskRepository {
  create(input: CreatePracticeTaskInput): PracticeTask;
  getById(taskId: string): PracticeTask | null;
  list(): PracticeTask[];
}

export class InMemoryPracticeTaskRepository implements PracticeTaskRepository {
  private readonly tasks = new Map<string, PracticeTask>();

  create(input: CreatePracticeTaskInput): PracticeTask {
    const task: PracticeTask = {
      id: crypto.randomUUID(),
      type: input.type,
      title: input.title,
      prompt: input.prompt,
      createdAt: new Date().toISOString()
    };

    this.tasks.set(task.id, task);
    return task;
  }

  getById(taskId: string): PracticeTask | null {
    return this.tasks.get(taskId) ?? null;
  }

  list(): PracticeTask[] {
    return [...this.tasks.values()];
  }
}
