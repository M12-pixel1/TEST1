import { existsSync, rmSync } from 'node:fs';
import { resolveDbRuntimeConfig } from '../app/src/config/db-config.ts';
import { bootstrapPilotEnvironment } from '../app/src/bootstrap/pilot-init.ts';

const config = resolveDbRuntimeConfig(process.env);
const force = process.argv.includes('--force') || process.env.PILOT_RESET_CONFIRM === 'YES';

if (!force) {
  console.error('⚠️ Hard reset will delete the existing pilot DB file.');
  console.error('Run with --force or set PILOT_RESET_CONFIRM=YES to continue.');
  process.exit(1);
}

if (config.dbPath !== ':memory:' && existsSync(config.dbPath)) {
  rmSync(config.dbPath);
  console.log(`Removed existing DB: ${config.dbPath}`);
}

const { db, summary } = bootstrapPilotEnvironment(process.env);
console.log('Pilot environment reset + reseeded.');
console.log(JSON.stringify(summary, null, 2));

db.close();
