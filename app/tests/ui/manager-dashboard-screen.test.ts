import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  renderManagerDashboard,
  type ManagerDashboardElements,
  type ManagerDashboardView
} from '../../src/index.ts';

const elements: ManagerDashboardElements = {
  teamText: { textContent: '' },
  heatmapText: { textContent: '' },
  risksText: { textContent: '' },
  repeatedIssuesText: { textContent: '' },
  prioritiesText: { textContent: '' }
};

const view: ManagerDashboardView = {
  teamMembers: [
    { userId: 'u1', currentFocusArea: 'Discovery', riskLevel: 'warning' },
    { userId: 'u2', currentFocusArea: 'Objection Handling', riskLevel: 'critical' }
  ],
  skillHeatmap: [
    { userId: 'u1', skillScores: { Discovery: 60 } },
    { userId: 'u2', skillScores: { Discovery: 40 } }
  ],
  topRiskFlags: ['u2: critical risk'],
  topRepeatedIssuePatterns: ['Address one recurring gap with a single checklist item before submitting the next attempt.'],
  coachingPriorities: [{ userId: 'u1', priority: 'Coach on Discovery' }]
};

test('manager dashboard render: renders key manager slices', () => {
  renderManagerDashboard(view, elements);

  assert.ok(elements.teamText.textContent.includes('u1'));
  assert.ok(elements.heatmapText.textContent.includes('skills'));
  assert.ok(elements.risksText.textContent.includes('critical'));
  assert.ok(elements.repeatedIssuesText.textContent.length > 0);
  assert.ok(elements.prioritiesText.textContent.includes('Coach on'));
});
