import { getDomainHealth } from '../domain/health.ts';

export const buildHealthLabel = (): string => `Domain health: ${getDomainHealth()}`;
