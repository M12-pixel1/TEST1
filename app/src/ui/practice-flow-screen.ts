import type { AssignedPracticeTask, PracticeSubmissionResult } from '../api/practice-assignment-api.ts';

export interface PracticeFlowElements {
  taskTitleText: { textContent: string };
  taskPromptText: { textContent: string };
  feedbackText: { textContent: string };
}

export const renderAssignedTask = (
  task: AssignedPracticeTask | null,
  elements: PracticeFlowElements
): void => {
  if (!task) {
    elements.taskTitleText.textContent = '';
    elements.taskPromptText.textContent = '';
    return;
  }

  elements.taskTitleText.textContent = task.title;
  elements.taskPromptText.textContent = task.prompt;
};

export const renderPracticeFeedback = (
  result: PracticeSubmissionResult | null,
  elements: PracticeFlowElements
): void => {
  if (!result) {
    elements.feedbackText.textContent = '';
    return;
  }

  elements.feedbackText.textContent = [
    `Strengths: ${result.strengths.join('; ')}`,
    `Gaps: ${result.gaps.join('; ')}`,
    `Next action: ${result.nextAction}`
  ].join(' | ');
};
