import type { ProgressProofView } from '../api/progress-proof-api.ts';

export interface ProgressProofElements {
  baselineRefText: { textContent: string };
  currentFocusText: { textContent: string };
  attemptsCountText: { textContent: string };
  latestFeedbackText: { textContent: string };
  nextActionText: { textContent: string };
  updatedAtText: { textContent: string };
}

export const renderProgressProof = (
  proof: ProgressProofView | null,
  elements: ProgressProofElements
): void => {
  if (!proof) {
    elements.baselineRefText.textContent = 'Progress proof unavailable';
    elements.currentFocusText.textContent = '';
    elements.attemptsCountText.textContent = '';
    elements.latestFeedbackText.textContent = '';
    elements.nextActionText.textContent = '';
    elements.updatedAtText.textContent = '';
    return;
  }

  elements.baselineRefText.textContent = `Baseline snapshot session: ${proof.baselineSessionId}`;
  elements.currentFocusText.textContent = `Current top focus area: ${proof.currentTopFocusArea}`;
  elements.attemptsCountText.textContent = `Completed practice attempts: ${proof.completedPracticeAttempts}`;
  elements.latestFeedbackText.textContent = proof.latestFeedbackSummary
    ? `Latest feedback: ${proof.latestFeedbackSummary}`
    : 'Latest feedback: not available yet';
  elements.nextActionText.textContent = `Current next action: ${proof.currentNextAction}`;
  elements.updatedAtText.textContent = `Updated at: ${proof.updatedAt}`;
};
