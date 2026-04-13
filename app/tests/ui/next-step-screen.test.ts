import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderNextStep, type GrowthPath, type NextStepElements } from '../../src/index.ts';

const elements: NextStepElements = {
  todayActionText: { textContent: '' },
  weekPlanText: { textContent: '' },
  monthFocusText: { textContent: '' }
};

const sample: GrowthPath = {
  id: 'gp-1',
  userId: 'user-1',
  todayAction: 'Write one value statement and practice it.',
  weekPlan: ['Day 1: Draft', 'Day 2: Practice', 'Day 3: Apply'],
  monthFocus: 'Improve value articulation consistency.',
  basedOnTopFocusArea: 'Value Articulation',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

test('next step render: shows todayAction, weekPlan and monthFocus', () => {
  renderNextStep(sample, elements);

  assert.ok(elements.todayActionText.textContent.includes('Today action:'));
  assert.ok(elements.weekPlanText.textContent.includes('Week plan:'));
  assert.ok(elements.monthFocusText.textContent.includes('Month focus:'));
});
