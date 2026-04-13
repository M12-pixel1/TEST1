export const V1_ROLES = ['admin', 'manager', 'learner'] as const;

export type Role = (typeof V1_ROLES)[number];

export const isRole = (value: string): value is Role =>
  V1_ROLES.includes(value as Role);
