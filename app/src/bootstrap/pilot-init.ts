import { createConfiguredV1Db, type V1Db } from '../db/v1-db.ts';
import { type EnvReader } from '../config/db-config.ts';
import { seedPilotData, type PilotSeedSummary } from './pilot-seed.ts';

export interface PilotBootstrapResult {
  db: V1Db;
  summary: PilotSeedSummary;
}

export const bootstrapPilotEnvironment = (env: EnvReader): PilotBootstrapResult => {
  const db = createConfiguredV1Db(env);
  const summary = seedPilotData(db.database);
  return { db, summary };
};
