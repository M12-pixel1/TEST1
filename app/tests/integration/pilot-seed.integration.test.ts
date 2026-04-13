import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createManagerDashboardApi,
  createV1Db,
  InMemoryManagerEventStore,
  PILOT_LEARNER_USER_IDS,
  PILOT_MANAGER_USER_ID,
  PILOT_ORGANIZATION_ID,
  seedPilotData,
  SqliteAntiSignalRepository,
  SqliteDiagnosticSessionRepository,
  SqliteWorkspaceService
} from '../../src/index.ts';

test('integration: pilot seed creates demo-ready learner and manager flows', () => {
  const db = createV1Db(':memory:');

  const summary = seedPilotData(db.database);

  assert.equal(summary.organizationId, PILOT_ORGANIZATION_ID);
  assert.equal(summary.organizationDisplayName, 'Northwind Industrial Pilot');
  assert.equal(summary.managerUserId, PILOT_MANAGER_USER_ID);
  assert.equal(summary.managerDisplayName, 'Marta Stone');
  assert.equal(summary.learnerUserIds.length, PILOT_LEARNER_USER_IDS.length);
  assert.equal(summary.learnerDisplayNames.length, PILOT_LEARNER_USER_IDS.length);
  assert.equal(summary.completedSessions >= 2, true);
  assert.equal(summary.practiceAttempts >= 2, true);
  assert.equal(summary.seededTaskCount >= 4, true);

  const workspace = new SqliteWorkspaceService(db.database);
  const sessions = new SqliteDiagnosticSessionRepository(db.database);
  const antiSignals = new SqliteAntiSignalRepository(db.database);
  const managerEvents = new InMemoryManagerEventStore();
  const managerApi = createManagerDashboardApi(workspace, sessions, antiSignals, managerEvents);

  const dashboard = managerApi.getDashboard(PILOT_ORGANIZATION_ID, PILOT_MANAGER_USER_ID);
  assert.equal(dashboard.teamMembers.length >= 1, true);

  assert.throws(
    () => managerApi.getDashboard(PILOT_ORGANIZATION_ID, PILOT_LEARNER_USER_IDS[0]),
    /Unauthorized manager dashboard access/
  );

  db.close();
});
