import { test } from 'node:test';
import assert from 'node:assert/strict';

import { V1_ROLES } from '../src/index.ts';

test('v1 roles are available', () => {
  assert.deepEqual(V1_ROLES, ['admin', 'manager', 'learner']);
});
