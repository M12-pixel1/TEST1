import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AntiSignalService,
  createManagerDashboardApi,
  InMemoryAntiSignalEventStore,
  InMemoryAntiSignalRepository,
  InMemoryDiagnosticSessionRepository,
  InMemoryManagerEventStore,
  InMemoryWorkspaceService,
  type V1SkillScoreResult
} from '../../src/index.ts';

const sampleScore = (focus: V1SkillScoreResult['initialPriorityFocus']): V1SkillScoreResult => ({
  version: 'v1',
  scores: {
    Discovery: 60,
    'Listening & Diagnosis': 55,
    'Value Articulation': 50,
    'Objection Handling': 45,
    'Follow-up Discipline': 40
  },
  topStrength: 'Discovery',
  topFocusArea: focus,
  initialPriorityFocus: focus
});

test('integration: manager dashboard aggregates team focus and risks and records viewed event', () => {
  const workspace = new InMemoryWorkspaceService();
  const sessions = new InMemoryDiagnosticSessionRepository();
  const antiRepo = new InMemoryAntiSignalRepository();
  const antiEvents = new InMemoryAntiSignalEventStore();
  const managerEvents = new InMemoryManagerEventStore();
  const antiService = new AntiSignalService(antiRepo, antiEvents);
  const dashboardApi = createManagerDashboardApi(workspace, sessions, antiRepo, managerEvents);

  workspace.assignMembership('manager-1', 'org-1', 'manager');
  workspace.assignMembership('u1', 'org-1', 'learner');
  workspace.assignMembership('u2', 'org-1', 'learner');

  const s1 = sessions.create({ userId: 'u1', organizationId: 'org-1' });
  sessions.complete({
    sessionId: s1.id,
    rawAnswers: { confidence: 4 },
    scoringResult: sampleScore('Value Articulation')
  });

  const s2 = sessions.create({ userId: 'u2', organizationId: 'org-1' });
  sessions.complete({
    sessionId: s2.id,
    rawAnswers: { confidence: 5 },
    scoringResult: sampleScore('Objection Handling')
  });

  antiService.createConfidenceGap('u2', s2.id, 5, sampleScore('Objection Handling'));

  const dashboard = dashboardApi.getDashboard('org-1', 'manager-1');

  assert.equal(dashboard.teamMembers.length, 2);
  assert.equal(dashboard.skillHeatmap.length, 2);
  assert.equal(dashboard.coachingPriorities.length > 0, true);
  assert.equal(dashboard.topRiskFlags.length > 0, true);

  const viewedEvents = managerEvents.listByManager('manager-1');
  assert.deepEqual(viewedEvents.map((event) => event.type), ['manager_dashboard_viewed']);
});

test('integration: manager dashboard rejects non-manager role', () => {
  const workspace = new InMemoryWorkspaceService();
  const sessions = new InMemoryDiagnosticSessionRepository();
  const antiRepo = new InMemoryAntiSignalRepository();
  const managerEvents = new InMemoryManagerEventStore();
  const dashboardApi = createManagerDashboardApi(workspace, sessions, antiRepo, managerEvents);

  workspace.assignMembership('learner-1', 'org-1', 'learner');

  assert.throws(
    () => dashboardApi.getDashboard('org-1', 'learner-1'),
    /Unauthorized manager dashboard access/
  );
});
