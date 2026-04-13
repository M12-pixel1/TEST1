import type { GrowthPath } from '../domain/growth-path.ts';

export interface NextStepElements {
  todayActionText: { textContent: string };
  weekPlanText: { textContent: string };
  monthFocusText: { textContent: string };
}

export const renderNextStep = (growthPath: GrowthPath | null, elements: NextStepElements): void => {
  if (!growthPath) {
    elements.todayActionText.textContent = '';
    elements.weekPlanText.textContent = '';
    elements.monthFocusText.textContent = '';
    return;
  }

  elements.todayActionText.textContent = `Today action: ${growthPath.todayAction}`;
  elements.weekPlanText.textContent = `Week plan: ${growthPath.weekPlan.join(' | ')}`;
  elements.monthFocusText.textContent = `Month focus: ${growthPath.monthFocus}`;
};
