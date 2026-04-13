export interface GrowthPath {
  id: string;
  userId: string;
  todayAction: string;
  weekPlan: string[];
  monthFocus: string;
  basedOnTopFocusArea: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertGrowthPathInput {
  userId: string;
  todayAction: string;
  weekPlan: string[];
  monthFocus: string;
  basedOnTopFocusArea: string;
}

export interface GrowthPathRepository {
  upsert(input: UpsertGrowthPathInput): GrowthPath;
  getByUserId(userId: string): GrowthPath | null;
}

export class InMemoryGrowthPathRepository implements GrowthPathRepository {
  private readonly pathsByUser = new Map<string, GrowthPath>();

  upsert(input: UpsertGrowthPathInput): GrowthPath {
    const existing = this.pathsByUser.get(input.userId);
    const now = new Date().toISOString();

    const next: GrowthPath = {
      id: existing?.id ?? crypto.randomUUID(),
      userId: input.userId,
      todayAction: input.todayAction,
      weekPlan: [...input.weekPlan],
      monthFocus: input.monthFocus,
      basedOnTopFocusArea: input.basedOnTopFocusArea,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now
    };

    this.pathsByUser.set(input.userId, next);
    return next;
  }

  getByUserId(userId: string): GrowthPath | null {
    return this.pathsByUser.get(userId) ?? null;
  }
}
