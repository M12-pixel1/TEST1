import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSkillSnapshotPlaceholder,
  InMemoryDiagnosticSessionRepository
} from '../src/index.ts';

test('unit: diagnostic repository creates started session', () => {
  const repository = new InMemoryDiagnosticSessionRepository();

  const created = repository.create({
    userId: 'user-1',
    organizationId: 'org-1'
  });

  assert.equal(created.status, 'started');
  assert.equal(created.completedAt, null);
  assert.equal(created.rawAnswers, null);
  assert.equal(created.scoringResult, null);
});

test('unit: diagnostic repository stores raw answers and scoring result on complete', () => {
  const repository = new InMemoryDiagnosticSessionRepository();
  const created = repository.create({ userId: 'user-1', organizationId: 'org-1' });

  const rawAnswers = {
    q1: 'A',
    nested: { confidence: 0.8 }
  };

  const scoringResult = {
    version: 'v1' as const,
    scores: {
      Discovery: 80,
      'Listening & Diagnosis': 60,
      'Value Articulation': 40,
      'Objection Handling': 50,
      'Follow-up Discipline': 70
    },
    topStrength: 'Discovery' as const,
    topFocusArea: 'Value Articulation' as const,
    initialPriorityFocus: 'Value Articulation' as const
  };

  const completed = repository.complete({
    sessionId: created.id,
    rawAnswers,
    scoringResult
  });

  rawAnswers.nested.confidence = 0.1;
  scoringResult.scores.Discovery = 10;

  assert.equal(completed.status, 'completed');
  assert.equal(completed.rawAnswers?.q1, 'A');
  assert.deepEqual(completed.rawAnswers?.nested, { confidence: 0.8 });
  assert.equal(completed.scoringResult?.scores.Discovery, 80);
});

test('unit: skill snapshot placeholder payload is returned', () => {
  const snapshot = buildSkillSnapshotPlaceholder();

  assert.equal(snapshot.version, 'v1-placeholder');
  assert.equal(snapshot.summary, 'pending_scoring');
  assert.equal(typeof snapshot.generatedAt, 'string');
});
