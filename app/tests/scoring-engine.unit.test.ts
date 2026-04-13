import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeV1SkillScores } from '../src/index.ts';

test('scoring engine: returns five typed skill block scores', () => {
  const result = computeV1SkillScores({
    discovery: 'high',
    listening: 'medium',
    value: 'low',
    objection: 4,
    followUp: 2
  });

  assert.equal(result.version, 'v1');
  assert.deepEqual(Object.keys(result.scores), [
    'Discovery',
    'Listening & Diagnosis',
    'Value Articulation',
    'Objection Handling',
    'Follow-up Discipline'
  ]);
  assert.equal(result.scores.Discovery, 80);
  assert.equal(result.scores['Listening & Diagnosis'], 60);
  assert.equal(result.scores['Value Articulation'], 20);
  assert.equal(result.scores['Objection Handling'], 80);
  assert.equal(result.scores['Follow-up Discipline'], 40);
});

test('scoring engine: sets top strength, top focus area and initial priority focus', () => {
  const result = computeV1SkillScores({
    discovery: 'very high',
    listening: 'excellent',
    value: 'low',
    objection: 'very low',
    followUp: 'medium'
  });

  assert.equal(result.topStrength, 'Discovery');
  assert.equal(result.topFocusArea, 'Value Articulation');
  assert.equal(result.initialPriorityFocus, 'Value Articulation');
});

test('scoring engine: supports fallback keys from current diagnostic flow answers', () => {
  const result = computeV1SkillScores({
    focus: 'high',
    clarity: 'good',
    energy: 'medium'
  });

  assert.equal(result.scores.Discovery, 80);
  assert.equal(result.scores['Value Articulation'], 80);
  assert.equal(result.scores['Follow-up Discipline'], 60);
});
