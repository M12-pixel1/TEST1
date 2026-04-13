import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createConfiguredV1Db,
  createV1Db,
  DEFAULT_DB_PATH,
  resolveDbRuntimeConfig
} from '../../src/index.ts';

test('integration: db runtime config resolves path from env', () => {
  const fromEnv = resolveDbRuntimeConfig({ V1_DB_PATH: 'tmp/custom.sqlite' });
  assert.equal(fromEnv.dbPath, 'tmp/custom.sqlite');

  const fallback = resolveDbRuntimeConfig({});
  assert.equal(fallback.dbPath, DEFAULT_DB_PATH);
});

test('integration: migrations are tracked in schema_migrations', () => {
  const db = createV1Db(':memory:');

  const rows = db.database
    .prepare('SELECT version FROM schema_migrations ORDER BY version')
    .all() as Array<{ version: string }>;

  assert.ok(rows.some((row) => row.version === '001_init_v1'));
  assert.ok(rows.some((row) => row.version === '002_demo_metadata'));

  db.close();
});

test('integration: configured db factory opens and closes using env config', () => {
  const db = createConfiguredV1Db({ V1_DB_PATH: ':memory:' });
  const row = db.database.prepare('SELECT 1 as ok').get() as { ok: number };
  assert.equal(row.ok, 1);
  db.close();
});
