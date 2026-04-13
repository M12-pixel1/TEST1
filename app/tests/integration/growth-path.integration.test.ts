import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createGrowthPathApi,
  InMemoryDiagnosticSessionRepository,
  InMemoryGrowthPathRepository,
  type V1SkillScoreResult
} from '../../src/index.ts';

const scoring: V1SkillScoreResult = {
  version: 'v1',
  scores: {
    Discovery: 55,
    'Listening & Diagnosis': 60,
    'Value Articulation': 40,
    'Objection Handling': 45,
    'Follow-up Discipline': 50
  },
  topStrength: 'Listening & Diagnosis',
  topFocusArea: 'Value Articulation',
  initialPriorityFocus: 'Value Articulation'
};

test('integration: growth path generation persists and is readable for user next-step usage', () => {
  const sessions = new InMemoryDiagnosticSessionRepository();
  const growthPaths = new InMemoryGrowthPathRepository();
  const api = createGrowthPathApi(sessions, growthPaths);

  const session = sessions.create({ userId: 'user-growth-1', organizationId: 'org-1' });
  sessions.complete({
    sessionId: session.id,
    rawAnswers: { confidence: 3 },
    scoringResult: scoring
  });

  const created = api.generateForUser('user-growth-1');
  const fetched = api.getByUserId('user-growth-1');

  assert.equal(created.userId, 'user-growth-1');
  assert.equal(created.basedOnTopFocusArea, 'Value Articulation');
  assert.equal(created.todayAction.length > 0, true);
  assert.equal(created.weekPlan.length >= 1, true);
  assert.equal(created.monthFocus.length > 0, true);

  assert.ok(fetched);
  assert.equal(fetched.id, created.id);
  assert.equal(fetched.updatedAt.length > 0, true);
});
