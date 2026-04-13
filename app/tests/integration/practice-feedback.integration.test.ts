import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createPracticeFeedbackApi,
  InMemoryPracticeEventStore,
  InMemoryPracticeTaskRepository,
  InMemoryTaskAttemptRepository
} from '../../src/index.ts';

test('integration: attempt -> feedback pipeline stores feedback and emits feedback_viewed', () => {
  const tasks = new InMemoryPracticeTaskRepository();
  const attempts = new InMemoryTaskAttemptRepository(tasks);
  const events = new InMemoryPracticeEventStore();
  const api = createPracticeFeedbackApi(tasks, attempts, events);

  const task = tasks.create({
    type: 'client_situation_analysis',
    title: 'Client analysis task',
    prompt: 'Analyze the account status and propose next step.'
  });

  const submitted = api.submitAttempt({
    taskId: task.id,
    userId: 'user-42',
    response: 'I would prioritize renewal risk and create a stakeholder plan.'
  });

  const storedAttempt = attempts.getById(submitted.attemptId);
  assert.ok(storedAttempt);
  assert.ok(storedAttempt.feedback);
  assert.equal(storedAttempt.feedback?.nextAction.length > 0, true);

  const viewed = api.viewFeedback(submitted.attemptId);
  assert.equal(viewed.attemptId, submitted.attemptId);
  assert.equal(viewed.feedback.nextAction.length > 0, true);

  const practiceEvents = events.listByAttemptId(submitted.attemptId);
  assert.deepEqual(practiceEvents.map((event) => event.type), ['feedback_viewed']);
});
