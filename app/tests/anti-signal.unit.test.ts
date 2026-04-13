import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeConfidenceGapSignal,
  computeFrictionPointSignal,
  computeRepeatErrorSignal,
  type TaskAttempt,
  type V1SkillScoreResult
} from '../src/index.ts';

const scoring: V1SkillScoreResult = {
  version: 'v1',
  scores: {
    Discovery: 20,
    'Listening & Diagnosis': 20,
    'Value Articulation': 20,
    'Objection Handling': 20,
    'Follow-up Discipline': 20
  },
  topStrength: 'Discovery',
  topFocusArea: 'Value Articulation',
  initialPriorityFocus: 'Value Articulation'
};

test('anti signal: confidence gap calculates severity and recommended action', () => {
  const signal = computeConfidenceGapSignal('user-1', 'session-1', 5, scoring);

  assert.equal(signal.type, 'confidence_gap');
  assert.equal(signal.severity, 'critical');
  assert.equal(signal.recommendedAction.length > 0, true);
});

test('anti signal: repeat error increases with repeated gaps', () => {
  const attempts: TaskAttempt[] = [
    {
      id: 'a1',
      taskId: 't1',
      userId: 'user-1',
      response: 'x',
      scorePlaceholder: { status: 'pending' },
      feedbackPlaceholder: { status: 'pending' },
      feedback: {
        strengths: ['good start'],
        gaps: ['missing clear structure'],
        nextAction: 'use simple structure',
        generatedAt: '2026-01-01T00:00:00.000Z'
      },
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'a2',
      taskId: 't1',
      userId: 'user-1',
      response: 'y',
      scorePlaceholder: { status: 'pending' },
      feedbackPlaceholder: { status: 'pending' },
      feedback: {
        strengths: ['good tone'],
        gaps: ['missing clear structure'],
        nextAction: 'add structure',
        generatedAt: '2026-01-02T00:00:00.000Z'
      },
      createdAt: '2026-01-02T00:00:00.000Z'
    }
  ];

  const signal = computeRepeatErrorSignal('user-1', attempts);
  assert.equal(signal.type, 'repeat_error');
  assert.equal(signal.severity, 'warning');
  assert.equal(signal.relatedTaskAttemptId, 'a2');
});

test('anti signal: friction point reacts to repeated unfinished stage', () => {
  const signal = computeFrictionPointSignal(
    'user-1',
    [
      { stage: 'response_draft', completed: false },
      { stage: 'response_draft', completed: false },
      { stage: 'response_draft', completed: false }
    ],
    'attempt-1'
  );

  assert.equal(signal.type, 'friction_point');
  assert.equal(signal.severity, 'critical');
  assert.equal(signal.relatedTaskAttemptId, 'attempt-1');
  assert.equal(signal.recommendedAction.length > 0, true);
});
