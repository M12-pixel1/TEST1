export interface DbRuntimeConfig {
  dbPath: string;
}

export interface EnvReader {
  V1_DB_PATH?: string;
}

export const DEFAULT_DB_PATH = 'app/data/v1.sqlite';

export const resolveDbRuntimeConfig = (env: EnvReader = {}): DbRuntimeConfig => ({
  dbPath: env.V1_DB_PATH?.trim() || DEFAULT_DB_PATH
});
