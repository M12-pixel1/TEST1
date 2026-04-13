import { isRole, type Role } from './roles.ts';

export interface OrganizationMembership {
  organizationId: string;
  userId: string;
  role: Role;
}

export interface WorkspaceService {
  assignMembership(userId: string, organizationId: string, role: string): OrganizationMembership;
  getMembership(userId: string, organizationId: string): OrganizationMembership | null;
  listByOrganizationId(organizationId: string): OrganizationMembership[];
}

export class InMemoryWorkspaceService implements WorkspaceService {
  private readonly memberships = new Map<string, OrganizationMembership>();

  assignMembership(userId: string, organizationId: string, role: string): OrganizationMembership {
    if (!isRole(role)) {
      throw new Error('Invalid role');
    }

    const membership: OrganizationMembership = {
      userId,
      organizationId,
      role
    };

    this.memberships.set(this.buildKey(userId, organizationId), membership);
    return membership;
  }

  getMembership(userId: string, organizationId: string): OrganizationMembership | null {
    return this.memberships.get(this.buildKey(userId, organizationId)) ?? null;
  }


  listByOrganizationId(organizationId: string): OrganizationMembership[] {
    return [...this.memberships.values()].filter((m) => m.organizationId === organizationId);
  }

  private buildKey(userId: string, organizationId: string): string {
    return `${organizationId}:${userId}`;
  }
}
