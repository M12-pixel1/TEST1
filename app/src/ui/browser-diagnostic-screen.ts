import type { GrowthPathApi } from '../api/growth-path-api.ts';
import type { PracticeAssignmentApi } from '../api/practice-assignment-api.ts';
import type { ProgressProofApi } from '../api/progress-proof-api.ts';
import type { SkillSnapshotReadApi } from '../api/skill-snapshot-api.ts';
import type { DiagnosticFlowController } from './diagnostic-flow.ts';
import { renderNextStep, type NextStepElements } from './next-step-screen.ts';
import {
  renderAssignedTask,
  renderPracticeFeedback,
  type PracticeFlowElements
} from './practice-flow-screen.ts';
import { renderProgressProof, type ProgressProofElements } from './progress-proof-screen.ts';
import { renderSkillSnapshot, type SkillSnapshotElements } from './skill-snapshot-screen.ts';

export interface TextElement {
  textContent: string;
}

export interface InputElement {
  value: string;
}

export interface ButtonElement {
  disabled: boolean;
  onclick: (() => void) | null;
}

export interface DiagnosticScreenElements {
  questionText: TextElement;
  progressText: TextElement;
  completionText: TextElement;
  answerInput: InputElement;
  startButton: ButtonElement;
  nextButton: ButtonElement;
  showNextStepButton: ButtonElement;
  showProgressProofButton?: ButtonElement;
  startPracticeButton: ButtonElement;
  submitPracticeButton: ButtonElement;
  practiceResponseInput: InputElement;
  snapshot: SkillSnapshotElements;
  nextStep: NextStepElements;
  practice: PracticeFlowElements;
  progressProof?: ProgressProofElements;
}

export interface MountedDiagnosticScreen {
  render: () => void;
}

export const mountDiagnosticScreen = (
  flow: DiagnosticFlowController,
  userId: string,
  snapshotApi: SkillSnapshotReadApi,
  growthPathApi: GrowthPathApi,
  practiceApi: PracticeAssignmentApi,
  elements: DiagnosticScreenElements,
  progressProofApi: ProgressProofApi | null = null
): MountedDiagnosticScreen => {
  let activeTaskId: string | null = null;

  const render = (): void => {
    const state = flow.getState();

    if (state.phase === 'idle') {
      elements.questionText.textContent = 'Press start to begin diagnostic.';
      elements.progressText.textContent = 'Step 0 of 0';
      elements.completionText.textContent = '';
      elements.answerInput.value = '';
      elements.startButton.disabled = false;
      elements.nextButton.disabled = true;
      elements.showNextStepButton.disabled = true;
      if (elements.showProgressProofButton) {
        elements.showProgressProofButton.disabled = true;
      }
      elements.startPracticeButton.disabled = true;
      elements.submitPracticeButton.disabled = true;
      renderSkillSnapshot(null, elements.snapshot);
      renderNextStep(null, elements.nextStep);
      renderAssignedTask(null, elements.practice);
      renderPracticeFeedback(null, elements.practice);
      if (elements.progressProof) {
        renderProgressProof(null, elements.progressProof);
      }
      return;
    }

    if (state.phase === 'completed') {
      elements.questionText.textContent = 'Diagnostic completed.';
      elements.progressText.textContent = `Step ${state.questions.length} of ${state.questions.length}`;
      elements.completionText.textContent = 'Thank you. Your responses were submitted.';
      elements.startButton.disabled = true;
      elements.nextButton.disabled = true;
      elements.showNextStepButton.disabled = false;
      if (elements.showProgressProofButton) {
        elements.showProgressProofButton.disabled = false;
      }
      elements.startPracticeButton.disabled = false;
      elements.submitPracticeButton.disabled = false;
      elements.answerInput.value = '';
      renderSkillSnapshot(
        state.sessionId ? snapshotApi.getBySessionId(state.sessionId) : null,
        elements.snapshot
      );
      return;
    }

    const question = state.questions[state.currentStepIndex];
    elements.questionText.textContent = question?.prompt ?? 'No question available';
    elements.progressText.textContent = `Step ${state.currentStepIndex + 1} of ${state.questions.length}`;
    elements.completionText.textContent = '';
    elements.startButton.disabled = true;
    elements.nextButton.disabled = false;
    elements.showNextStepButton.disabled = true;
    if (elements.showProgressProofButton) {
      elements.showProgressProofButton.disabled = true;
    }
    elements.startPracticeButton.disabled = true;
    elements.submitPracticeButton.disabled = true;
    renderSkillSnapshot(null, elements.snapshot);
    renderNextStep(null, elements.nextStep);
    renderAssignedTask(null, elements.practice);
    renderPracticeFeedback(null, elements.practice);
    if (elements.progressProof) {
      renderProgressProof(null, elements.progressProof);
    }
  };

  elements.startButton.onclick = () => {
    flow.start();
    render();
  };

  elements.nextButton.onclick = () => {
    flow.answerCurrent(elements.answerInput.value);
    elements.answerInput.value = '';
    flow.next();
    render();
  };

  elements.showNextStepButton.onclick = () => {
    const growthPath = growthPathApi.generateForUser(userId);
    renderNextStep(growthPath, elements.nextStep);
  };

  if (elements.showProgressProofButton) {
    elements.showProgressProofButton.onclick = () => {
      if (!progressProofApi || !elements.progressProof) {
        return;
      }

      const proof = progressProofApi.getByUserId(userId);
      renderProgressProof(proof, elements.progressProof);
    };
  }

  elements.startPracticeButton.onclick = () => {
    const task = practiceApi.assignForUser(userId);
    activeTaskId = task.taskId;
    renderAssignedTask(task, elements.practice);
    renderPracticeFeedback(null, elements.practice);
  };

  elements.submitPracticeButton.onclick = () => {
    if (!activeTaskId) {
      throw new Error('No active practice task selected');
    }

    const result = practiceApi.submitPracticeResponse(
      userId,
      activeTaskId,
      elements.practiceResponseInput.value
    );
    renderPracticeFeedback(result, elements.practice);
    elements.practiceResponseInput.value = '';
  };

  render();
  return { render };
};
