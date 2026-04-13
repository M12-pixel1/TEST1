import { existsSync, rmSync } from 'node:fs';
import { resolveDbRuntimeConfig } from '../app/src/config/db-config.ts';
import { bootstrapPilotEnvironment } from '../app/src/bootstrap/pilot-init.ts';

const CONFIRM_TOKEN = 'RESET_DEMO_DB';
const confirmationArg = process.argv.find((arg) => arg.startsWith('--confirm='));
const confirmationValue = confirmationArg?.slice('--confirm='.length) ?? '';

if (confirmationValue !== CONFIRM_TOKEN) {
  console.error('⚠️ Safe reset requested but confirmation is missing/invalid.');
  console.error(`Run again with: --confirm=${CONFIRM_TOKEN}`);
  process.exit(1);
}

const config = resolveDbRuntimeConfig(process.env);

if (config.dbPath !== ':memory:' && existsSync(config.dbPath)) {
  rmSync(config.dbPath);
  console.log(`Removed existing DB: ${config.dbPath}`);
}

const { db, summary } = bootstrapPilotEnvironment(process.env);
console.log('Pilot environment SAFE reset + reseeded.');
console.log(JSON.stringify(summary, null, 2));

db.close();
