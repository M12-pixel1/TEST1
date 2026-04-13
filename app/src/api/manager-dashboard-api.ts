import type { AntiSignalRepository } from '../domain/anti-signal.ts';
import type { DiagnosticSessionRepository } from '../domain/diagnostic-session.ts';
import { InMemoryManagerEventStore } from '../domain/manager-events.ts';
import type { WorkspaceService } from '../domain/workspace.ts';

export interface ManagerTeamMemberView {
  userId: string;
  currentFocusArea: string;
  riskLevel: 'normal' | 'warning' | 'critical';
}

export interface ManagerSkillHeatmapItem {
  userId: string;
  skillScores: Record<string, number>;
}

export interface ManagerCoachingPriority {
  userId: string;
  priority: string;
}

export interface ManagerDashboardView {
  teamMembers: ManagerTeamMemberView[];
  skillHeatmap: ManagerSkillHeatmapItem[];
  topRiskFlags: string[];
  topRepeatedIssuePatterns: string[];
  coachingPriorities: ManagerCoachingPriority[];
}

export interface ManagerDashboardApi {
  getDashboard(organizationId: string, managerUserId: string): ManagerDashboardView;
}

const severityWeight: Record<'normal' | 'warning' | 'critical', number> = {
  normal: 1,
  warning: 2,
  critical: 3
};

export const createManagerDashboardApi = (
  workspace: WorkspaceService,
  sessions: DiagnosticSessionRepository,
  antiSignals: AntiSignalRepository,
  managerEvents: InMemoryManagerEventStore
): ManagerDashboardApi => ({
  getDashboard(organizationId, managerUserId) {
    const managerMembership = workspace.getMembership(managerUserId, organizationId);
    if (!managerMembership || !['manager', 'admin'].includes(managerMembership.role)) {
      throw new Error('Unauthorized manager dashboard access');
    }

    const team = workspace
      .listByOrganizationId(organizationId)
      .filter((member) => member.userId !== managerUserId);

    const teamMembers: ManagerTeamMemberView[] = team.map((member) => {
      const userSignals = antiSignals.listByUserId(member.userId);
      const highestSeverity = userSignals.reduce<'normal' | 'warning' | 'critical'>(
        (current, signal) =>
          severityWeight[signal.severity] > severityWeight[current] ? signal.severity : current,
        'normal'
      );

      const latestSession = sessions.listByUserId(member.userId).at(-1) ?? null;
      return {
        userId: member.userId,
        currentFocusArea: latestSession?.scoringResult?.initialPriorityFocus ?? 'Not available',
        riskLevel: highestSeverity
      };
    });

    const skillHeatmap: ManagerSkillHeatmapItem[] = teamMembers.map((member) => {
      const latestSession = sessions.listByUserId(member.userId).at(-1) ?? null;
      return {
        userId: member.userId,
        skillScores: latestSession?.scoringResult?.scores ?? {}
      };
    });

    const topRiskFlags = teamMembers
      .filter((member) => member.riskLevel !== 'normal')
      .sort((a, b) => severityWeight[b.riskLevel] - severityWeight[a.riskLevel])
      .slice(0, 3)
      .map((member) => `${member.userId}: ${member.riskLevel} risk`);

    const repeatErrorSignals = team
      .flatMap((member) => antiSignals.listByUserId(member.userId))
      .filter((signal) => signal.type === 'repeat_error')
      .slice(0, 3)
      .map((signal) => signal.recommendedAction);

    const coachingPriorities: ManagerCoachingPriority[] = teamMembers
      .filter((member) => member.currentFocusArea !== 'Not available')
      .slice(0, 5)
      .map((member) => ({
        userId: member.userId,
        priority: `Coach on ${member.currentFocusArea}`
      }));

    managerEvents.append({
      type: 'manager_dashboard_viewed',
      managerUserId,
      organizationId,
      occurredAt: new Date().toISOString()
    });

    return {
      teamMembers,
      skillHeatmap,
      topRiskFlags,
      topRepeatedIssuePatterns: repeatErrorSignals,
      coachingPriorities
    };
  }
});
