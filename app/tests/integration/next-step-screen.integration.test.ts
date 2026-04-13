import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticFlowController,
  createDiagnosticSessionApi,
  createGrowthPathApi,
  createPracticeAssignmentApi,
  createSkillSnapshotReadApi,
  InMemoryDiagnosticEventStore,
  InMemoryDiagnosticSessionRepository,
  InMemoryGrowthPathRepository,
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
  startPracticeButton: { disabled: true, onclick: null },
  submitPracticeButton: { disabled: true, onclick: null },
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

test('integration: completion path can open next-step view from persisted GrowthPath', () => {
  const sessionRepo = new InMemoryDiagnosticSessionRepository();
  const growthRepo = new InMemoryGrowthPathRepository();
  const events = new InMemoryDiagnosticEventStore();
  const sessionApi = createDiagnosticSessionApi(sessionRepo, events);
  const snapshotApi = createSkillSnapshotReadApi(sessionRepo);
  const growthApi = createGrowthPathApi(sessionRepo, growthRepo);
  const practiceApi = createPracticeAssignmentApi(
    growthRepo,
    new InMemoryPracticeTaskRepository(),
    new InMemoryTaskAttemptRepository(),
    events
  );

  const userId = 'user-next-1';
  const flow = createDiagnosticFlowController(sessionApi, {
    userId,
    organizationId: 'org-1'
  });

  const elements = makeElements();
  mountDiagnosticScreen(flow, userId, snapshotApi, growthApi, practiceApi, elements);

  elements.startButton.onclick?.();
  elements.answerInput.value = 'high';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'medium';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'low';
  elements.nextButton.onclick?.();

  elements.showNextStepButton.onclick?.();

  assert.ok(elements.nextStep.todayActionText.textContent.includes('Today action:'));
  assert.ok(elements.nextStep.weekPlanText.textContent.includes('Week plan:'));
  assert.ok(elements.nextStep.monthFocusText.textContent.includes('Month focus:'));

  const storedGrowthPath = growthApi.getByUserId(userId);
  assert.ok(storedGrowthPath);
  assert.equal(storedGrowthPath.userId, userId);
});
