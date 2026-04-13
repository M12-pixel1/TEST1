import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildGrowthPathFromScoring, type V1SkillScoreResult } from '../src/index.ts';

const scoring: V1SkillScoreResult = {
  version: 'v1',
  scores: {
    Discovery: 50,
    'Listening & Diagnosis': 55,
    'Value Articulation': 40,
    'Objection Handling': 45,
    'Follow-up Discipline': 60
  },
  topStrength: 'Follow-up Discipline',
  topFocusArea: 'Value Articulation',
  initialPriorityFocus: 'Value Articulation'
};

test('growth path engine: creates today action, 7 day plan, and 30 day focus from top focus area', () => {
  const plan = buildGrowthPathFromScoring(scoring);

  assert.equal(plan.basedOnTopFocusArea, 'Value Articulation');
  assert.equal(plan.todayAction.length > 0, true);
  assert.equal(plan.weekPlan.length >= 1, true);
  assert.equal(plan.monthFocus.length > 0, true);
});
