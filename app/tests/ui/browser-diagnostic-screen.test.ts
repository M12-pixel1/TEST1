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
  InMemoryTaskAttemptRepository
} from '../../src/index.ts';
import { mountDiagnosticScreen, type DiagnosticScreenElements } from '../../src/ui/browser-diagnostic-screen.ts';

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

test('ui diagnostic screen: completion shows snapshot, next-step, and practice feedback loop', () => {
  const repository = new InMemoryDiagnosticSessionRepository();
  const events = new InMemoryDiagnosticEventStore();
  const growthRepo = new InMemoryGrowthPathRepository();
  const taskRepo = new InMemoryPracticeTaskRepository();
  const attemptRepo = new InMemoryTaskAttemptRepository(taskRepo);
  const practiceEvents = new InMemoryPracticeEventStore();

  const api = createDiagnosticSessionApi(repository, events);
  const snapshotApi = createSkillSnapshotReadApi(repository);
  const growthApi = createGrowthPathApi(repository, growthRepo);
  const practiceFeedbackApi = createPracticeFeedbackApi(taskRepo, attemptRepo, practiceEvents);
  const practiceAssignmentApi = createPracticeAssignmentApi(growthApi, taskRepo, practiceFeedbackApi);
  const userId = 'user-1';

  const flow = createDiagnosticFlowController(api, {
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
  assert.ok(elements.nextStep.todayActionText.textContent.startsWith('Today action:'));

  elements.startPracticeButton.onclick?.();
  assert.ok(elements.practice.taskTitleText.textContent.length > 0);

  elements.practiceResponseInput.value = 'I will answer with value and clear next step.';
  elements.submitPracticeButton.onclick?.();
  assert.ok(elements.practice.feedbackText.textContent.includes('Strengths:'));
  assert.ok(elements.practice.feedbackText.textContent.includes('Next action:'));
});
