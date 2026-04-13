import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  InMemoryPracticeTaskRepository,
  InMemoryTaskAttemptRepository
} from '../src/index.ts';

test('practice persistence: can read task and related attempts', () => {
  const tasks = new InMemoryPracticeTaskRepository();
  const attempts = new InMemoryTaskAttemptRepository(tasks);

  const task = tasks.create({
    type: 'follow_up_email',
    title: 'Follow-up email task',
    prompt: 'Draft a follow-up email after the discovery call.'
  });

  const createdAttempt = attempts.create({
    taskId: task.id,
    userId: 'user-2',
    response: 'Thanks for today. Here are next steps and owners.'
  });

  const storedTask = tasks.getById(task.id);
  const storedAttempt = attempts.getById(createdAttempt.id);
  const taskAttempts = attempts.listByTaskId(task.id);

  assert.ok(storedTask);
  assert.equal(storedTask.type, 'follow_up_email');
  assert.ok(storedAttempt);
  assert.equal(storedAttempt.taskId, task.id);
  assert.equal(taskAttempts.length, 1);
  assert.equal(taskAttempts[0]?.id, createdAttempt.id);
});
