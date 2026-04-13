import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('integration: pilot reset safe requires explicit confirmation token', () => {
  assert.throws(
    () =>
      execFileSync('node', ['scripts/pilot-reset-safe.mjs'], {
        cwd: process.cwd(),
        env: { ...process.env, V1_DB_PATH: ':memory:' },
        stdio: 'pipe'
      }),
    /Safe reset requested but confirmation is missing\/invalid/
  );

  const output = execFileSync(
    'node',
    [
      'scripts/pilot-reset-safe.mjs',
      '--confirm=RESET_DEMO_DB'
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, V1_DB_PATH: ':memory:' },
      stdio: 'pipe'
    }
  ).toString();

  assert.ok(output.includes('SAFE reset + reseeded'));
});
