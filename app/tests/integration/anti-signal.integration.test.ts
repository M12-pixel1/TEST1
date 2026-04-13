import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AntiSignalService,
  InMemoryAntiSignalEventStore,
  InMemoryAntiSignalRepository,
  type TaskAttempt,
  type V1SkillScoreResult
} from '../../src/index.ts';

const scoring: V1SkillScoreResult = {
  version: 'v1',
  scores: {
    Discovery: 60,
    'Listening & Diagnosis': 55,
    'Value Articulation': 50,
    'Objection Handling': 45,
    'Follow-up Discipline': 40
  },
  topStrength: 'Discovery',
  topFocusArea: 'Follow-up Discipline',
  initialPriorityFocus: 'Follow-up Discipline'
};

test('integration: persists and retrieves first 3 anti signals with trigger events', () => {
  const repository = new InMemoryAntiSignalRepository();
  const events = new InMemoryAntiSignalEventStore();
  const service = new AntiSignalService(repository, events);

  const repeatAttempts: TaskAttempt[] = [
    {
      id: 'attempt-1',
      taskId: 'task-1',
      userId: 'user-1',
      response: 'first',
      scorePlaceholder: { status: 'pending' },
      feedbackPlaceholder: { status: 'pending' },
      feedback: {
        strengths: ['x'],
        gaps: ['missing ownership detail'],
        nextAction: 'add owner',
        generatedAt: '2026-01-01T00:00:00.000Z'
      },
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'attempt-2',
      taskId: 'task-1',
      userId: 'user-1',
      response: 'second',
      scorePlaceholder: { status: 'pending' },
      feedbackPlaceholder: { status: 'pending' },
      feedback: {
        strengths: ['y'],
        gaps: ['missing ownership detail'],
        nextAction: 'add owner',
        generatedAt: '2026-01-02T00:00:00.000Z'
      },
      createdAt: '2026-01-02T00:00:00.000Z'
    }
  ];

  const signal1 = service.createConfidenceGap('user-1', 'session-1', 4, scoring);
  const signal2 = service.createRepeatError('user-1', repeatAttempts);
  const signal3 = service.createFrictionPoint(
    'user-1',
    [
      { stage: 'final_submit', completed: false },
      { stage: 'final_submit', completed: false }
    ],
    'attempt-2'
  );

  const signals = service.listByUserId('user-1');
  const triggered = events.listByUserId('user-1');

  assert.equal(signals.length, 3);
  assert.deepEqual(
    signals.map((signal) => signal.type),
    ['confidence_gap', 'repeat_error', 'friction_point']
  );
  assert.equal(signal1.recommendedAction.length > 0, true);
  assert.equal(signal2.recommendedAction.length > 0, true);
  assert.equal(signal3.recommendedAction.length > 0, true);

  assert.equal(triggered.length, 3);
  assert.deepEqual(
    triggered.map((event) => event.type),
    ['anti_signal_triggered', 'anti_signal_triggered', 'anti_signal_triggered']
  );
});
