import type { ManagerDashboardView } from '../api/manager-dashboard-api.ts';

export interface ManagerDashboardElements {
  teamText: { textContent: string };
  heatmapText: { textContent: string };
  risksText: { textContent: string };
  repeatedIssuesText: { textContent: string };
  prioritiesText: { textContent: string };
}

export const renderManagerDashboard = (
  view: ManagerDashboardView,
  elements: ManagerDashboardElements
): void => {
  elements.teamText.textContent = view.teamMembers
    .map((member) => `${member.userId} (${member.riskLevel})`)
    .join(' | ');

  elements.heatmapText.textContent = view.skillHeatmap
    .map((item) => `${item.userId}: ${Object.keys(item.skillScores).length} skills`)
    .join(' | ');

  elements.risksText.textContent = view.topRiskFlags.join(' | ');
  elements.repeatedIssuesText.textContent = view.topRepeatedIssuePatterns.join(' | ');
  elements.prioritiesText.textContent = view.coachingPriorities
    .map((item) => `${item.userId}: ${item.priority}`)
    .join(' | ');
};
