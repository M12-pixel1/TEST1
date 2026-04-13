import { test } from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryAuthService, InMemoryWorkspaceService } from '../src/index.ts';

test('organization membership test: user can be assigned to organization with V1 role', () => {
  const auth = new InMemoryAuthService();
  const workspace = new InMemoryWorkspaceService();

  const user = auth.register('manager@example.com', 'secret123');

  const membership = workspace.assignMembership(user.id, 'org-1', 'manager');

  assert.equal(membership.userId, user.id);
  assert.equal(membership.organizationId, 'org-1');
  assert.equal(membership.role, 'manager');
});

test('organization membership test: invalid role is rejected', () => {
  const auth = new InMemoryAuthService();
  const workspace = new InMemoryWorkspaceService();

  const user = auth.register('someone@example.com', 'secret123');

  assert.throws(() => workspace.assignMembership(user.id, 'org-1', 'owner'));
});
