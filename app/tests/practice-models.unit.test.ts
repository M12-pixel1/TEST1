import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  InMemoryPracticeTaskRepository,
  InMemoryTaskAttemptRepository,
  PRACTICE_TASK_TYPES
} from '../src/index.ts';

test('practice models: supports required four practice task types', () => {
  assert.deepEqual(PRACTICE_TASK_TYPES, [
    'discovery_scenario',
    'objection_scenario',
    'follow_up_email',
    'client_situation_analysis'
  ]);
});

test('practice models: task attempt stores response with score/feedback placeholders', () => {
  const tasks = new InMemoryPracticeTaskRepository();
  const attempts = new InMemoryTaskAttemptRepository(tasks);

  const task = tasks.create({
    type: 'discovery_scenario',
    title: 'Discovery call mini case',
    prompt: 'What first 3 questions would you ask?'
  });

  const attempt = attempts.create({
    taskId: task.id,
    userId: 'user-1',
    response: 'I would ask about goals, blockers, and timeline.'
  });

  assert.equal(attempt.taskId, task.id);
  assert.equal(attempt.userId, 'user-1');
  assert.equal(attempt.scorePlaceholder.status, 'pending');
  assert.equal(attempt.feedbackPlaceholder.status, 'pending');
});
