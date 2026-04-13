import type { DiagnosticSessionRepository } from '../domain/diagnostic-session.ts';
import { buildGrowthPathFromScoring } from '../domain/growth-path-engine.ts';
import { type GrowthPathRepository, type GrowthPath } from '../domain/growth-path.ts';

export interface GrowthPathApi {
  generateForUser(userId: string): GrowthPath;
  getByUserId(userId: string): GrowthPath | null;
}

export const createGrowthPathApi = (
  sessions: DiagnosticSessionRepository,
  growthPaths: GrowthPathRepository
): GrowthPathApi => ({
  generateForUser(userId) {
    const latestSession = sessions.listByUserId(userId).at(-1) ?? null;
    if (!latestSession?.scoringResult) {
      throw new Error('Scoring result not found for user');
    }

    const plan = buildGrowthPathFromScoring(latestSession.scoringResult);

    return growthPaths.upsert({
      userId,
      todayAction: plan.todayAction,
      weekPlan: plan.weekPlan,
      monthFocus: plan.monthFocus,
      basedOnTopFocusArea: plan.basedOnTopFocusArea
    });
  },

  getByUserId(userId) {
    return growthPaths.getByUserId(userId);
  }
});
