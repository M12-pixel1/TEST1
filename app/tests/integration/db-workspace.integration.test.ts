import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createV1Db, SqliteWorkspaceService } from '../../src/index.ts';

test('integration: db-backed workspace membership assign/get/list', () => {
  const db = createV1Db(':memory:');
  const workspace = new SqliteWorkspaceService(db.database);

  workspace.assignMembership('user-1', 'org-1', 'learner');
  workspace.assignMembership('user-2', 'org-1', 'manager');

  const member = workspace.getMembership('user-1', 'org-1');
  assert.ok(member);
  assert.equal(member?.role, 'learner');

  const orgMembers = workspace.listByOrganizationId('org-1');
  assert.equal(orgMembers.length, 2);

  db.close();
});
