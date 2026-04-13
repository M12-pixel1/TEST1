import { test } from 'node:test';
import assert from 'node:assert/strict';

import { InMemoryAuthService, hashPassword, verifyPassword } from '../src/index.ts';

test('auth smoke test: user can log in with valid credentials', () => {
  const auth = new InMemoryAuthService();
  auth.register('learner@example.com', 'secret123');

  const session = auth.login('learner@example.com', 'secret123');

  assert.ok(session);
  assert.equal(typeof session.token, 'string');
  assert.equal(typeof session.userId, 'string');
});

test('auth smoke test: invalid credentials are rejected', () => {
  const auth = new InMemoryAuthService();
  auth.register('learner@example.com', 'secret123');

  const session = auth.login('learner@example.com', 'bad-password');
  assert.equal(session, null);
});

test('bcrypt: hashPassword produces verifiable hash', () => {
  const hash = hashPassword('test-password');
  assert.ok(hash.startsWith('$2b$'));
  assert.ok(verifyPassword('test-password', hash));
  assert.ok(!verifyPassword('wrong-password', hash));
});

test('bcrypt: passwords are not stored in plain text', () => {
  const auth = new InMemoryAuthService();
  const user = auth.register('secure@example.com', 'my-secret');
  assert.notEqual(user.passwordHash, 'my-secret');
  assert.ok(user.passwordHash.startsWith('$2b$'));
});
