import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticFlowController,
  createDiagnosticSessionApi,
  createGrowthPathApi,
  createPracticeAssignmentApi,
  createPracticeFeedbackApi,
  createProgressProofApi,
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
  showProgressProofButton: { disabled: false, onclick: null },
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
  },
  progressProof: {
    baselineRefText: { textContent: '' },
    currentFocusText: { textContent: '' },
    attemptsCountText: { textContent: '' },
    latestFeedbackText: { textContent: '' },
    nextActionText: { textContent: '' },
    updatedAtText: { textContent: '' }
  }
});

test('integration: diagnostic baseline + practice activity produce progress proof view', () => {
  const sessionRepo = new InMemoryDiagnosticSessionRepository();
  const diagnosticEvents = new InMemoryDiagnosticEventStore();
  const growthRepo = new InMemoryGrowthPathRepository();
  const practiceTasks = new InMemoryPracticeTaskRepository();
  const attempts = new InMemoryTaskAttemptRepository(practiceTasks);
  const practiceEvents = new InMemoryPracticeEventStore();

  const sessionApi = createDiagnosticSessionApi(sessionRepo, diagnosticEvents);
  const snapshotApi = createSkillSnapshotReadApi(sessionRepo);
  const growthApi = createGrowthPathApi(sessionRepo, growthRepo);
  const feedbackApi = createPracticeFeedbackApi(practiceTasks, attempts, practiceEvents);
  const assignmentApi = createPracticeAssignmentApi(growthApi, practiceTasks, feedbackApi);
  const progressProofApi = createProgressProofApi(sessionRepo, growthRepo, attempts);

  const userId = 'user-progress-1';
  const flow = createDiagnosticFlowController(sessionApi, {
    userId,
    organizationId: 'org-1'
  });

  const elements = makeElements();

  mountDiagnosticScreen(flow, userId, snapshotApi, growthApi, assignmentApi, elements, progressProofApi);

  elements.startButton.onclick?.();
  elements.answerInput.value = 'high';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'medium';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'low';
  elements.nextButton.onclick?.();

  elements.showNextStepButton.onclick?.();
  elements.startPracticeButton.onclick?.();
  elements.practiceResponseInput.value = 'I will confirm priority, reflect value, and set the next step.';
  elements.submitPracticeButton.onclick?.();

  elements.showProgressProofButton?.onclick?.();

  assert.ok(elements.progressProof?.baselineRefText.textContent.includes('Baseline snapshot session:'));
  assert.ok(elements.progressProof?.currentFocusText.textContent.includes('Current top focus area:'));
  assert.equal(elements.progressProof?.attemptsCountText.textContent, 'Completed practice attempts: 1');
  assert.ok(elements.progressProof?.latestFeedbackText.textContent.includes('Latest feedback:'));
  assert.ok(elements.progressProof?.nextActionText.textContent.includes('Current next action:'));
  assert.ok(elements.progressProof?.updatedAtText.textContent.includes('Updated at:'));
});
