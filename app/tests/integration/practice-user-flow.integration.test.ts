import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticFlowController,
  createDiagnosticSessionApi,
  createGrowthPathApi,
  createPracticeAssignmentApi,
  createPracticeFeedbackApi,
  createSkillSnapshotReadApi,
  InMemoryDiagnosticEventStore,
  InMemoryDiagnosticSessionRepository,
  InMemoryGrowthPathRepository,
  InMemoryPracticeEventStore,
  InMemoryPracticeTaskRepository,
  InMemoryTaskAttemptRepository,
  mountDiagnosticScreen,
  type DiagnosticScreenElements
} from '../../src/index.ts';

const makeElements = (): DiagnosticScreenElements => ({
  questionText: { textContent: '' },
  progressText: { textContent: '' },
  completionText: { textContent: '' },
  answerInput: { value: '' },
  startButton: { disabled: false, onclick: null },
  nextButton: { disabled: false, onclick: null },
  showNextStepButton: { disabled: false, onclick: null },
  startPracticeButton: { disabled: false, onclick: null },
  submitPracticeButton: { disabled: false, onclick: null },
  practiceResponseInput: { value: '' },
  snapshot: {
    titleText: { textContent: '' },
    skillBlocksText: { textContent: '' },
    topStrengthText: { textContent: '' },
    topFocusText: { textContent: '' },
    nextActionText: { textContent: '' }
  },
  nextStep: {
    todayActionText: { textContent: '' },
    weekPlanText: { textContent: '' },
    monthFocusText: { textContent: '' }
  },
  practice: {
    taskTitleText: { textContent: '' },
    taskPromptText: { textContent: '' },
    feedbackText: { textContent: '' }
  }
});

test('integration: GrowthPath -> PracticeTask -> TaskAttempt -> Feedback flow works end-to-end', () => {
  const sessionRepo = new InMemoryDiagnosticSessionRepository();
  const growthRepo = new InMemoryGrowthPathRepository();
  const diagnosticEvents = new InMemoryDiagnosticEventStore();
  const taskRepo = new InMemoryPracticeTaskRepository();
  const attemptRepo = new InMemoryTaskAttemptRepository(taskRepo);
  const practiceEvents = new InMemoryPracticeEventStore();

  const sessionApi = createDiagnosticSessionApi(sessionRepo, diagnosticEvents);
  const snapshotApi = createSkillSnapshotReadApi(sessionRepo);
  const growthApi = createGrowthPathApi(sessionRepo, growthRepo);
  const practiceFeedbackApi = createPracticeFeedbackApi(taskRepo, attemptRepo, practiceEvents);
  const practiceAssignmentApi = createPracticeAssignmentApi(growthApi, taskRepo, practiceFeedbackApi);

  const userId = 'user-practice-1';
  const flow = createDiagnosticFlowController(sessionApi, {
    userId,
    organizationId: 'org-1'
  });

  const elements = makeElements();
  mountDiagnosticScreen(flow, userId, snapshotApi, growthApi, practiceAssignmentApi, elements);

  elements.startButton.onclick?.();
  elements.answerInput.value = 'high';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'medium';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'low';
  elements.nextButton.onclick?.();

  elements.showNextStepButton.onclick?.();
  elements.startPracticeButton.onclick?.();
  assert.ok(elements.practice.taskPromptText.textContent.length > 0);

  elements.practiceResponseInput.value = 'I would handle the objection with value and clear next step.';
  elements.submitPracticeButton.onclick?.();

  assert.ok(elements.practice.feedbackText.textContent.includes('Strengths:'));
  assert.ok(elements.practice.feedbackText.textContent.includes('Gaps:'));
  assert.ok(elements.practice.feedbackText.textContent.includes('Next action:'));

  const attempts = attemptRepo.listByTaskId(taskRepo.list()[0]?.id ?? 'missing');
  assert.equal(attemptRepo.getById(attempts[0]?.id ?? '')?.feedback !== null, true);
});
