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

test('integration: browser-facing adapter renders persisted skill snapshot after complete', () => {
  const repository = new InMemoryDiagnosticSessionRepository();
  const eventStore = new InMemoryDiagnosticEventStore();
  const growthRepo = new InMemoryGrowthPathRepository();
  const taskRepo = new InMemoryPracticeTaskRepository();
  const attemptRepo = new InMemoryTaskAttemptRepository(taskRepo);
  const practiceEvents = new InMemoryPracticeEventStore();

  const api = createDiagnosticSessionApi(repository, eventStore);
  const snapshotApi = createSkillSnapshotReadApi(repository);
  const growthApi = createGrowthPathApi(repository, growthRepo);
  const practiceFeedbackApi = createPracticeFeedbackApi(taskRepo, attemptRepo, practiceEvents);
  const practiceAssignmentApi = createPracticeAssignmentApi(growthApi, taskRepo, practiceFeedbackApi);

  const userId = 'browser-user';
  const flow = createDiagnosticFlowController(api, {
    userId,
    organizationId: 'browser-org'
  });

  const elements = makeElements();
  mountDiagnosticScreen(flow, userId, snapshotApi, growthApi, practiceAssignmentApi, elements);

  elements.startButton.onclick?.();
  const sessionId = flow.getState().sessionId;
  assert.ok(sessionId);

  elements.answerInput.value = 'a1';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'a2';
  elements.nextButton.onclick?.();
  elements.answerInput.value = 'a3';
  elements.nextButton.onclick?.();

  const snapshot = snapshotApi.getBySessionId(sessionId as string);
  assert.ok(snapshot);
  assert.equal(snapshot.skillBlocks.length, 5);
  assert.equal(elements.snapshot.titleText.textContent, 'Skill Snapshot');
  assert.ok(elements.snapshot.topStrengthText.textContent.startsWith('Top strength:'));
  assert.ok(elements.snapshot.topFocusText.textContent.startsWith('Top focus area:'));
  assert.ok(elements.snapshot.nextActionText.textContent.startsWith('Next action:'));

  assert.deepEqual(
    eventStore.listBySessionId(sessionId as string).map((event) => event.type),
    ['diagnostic_started', 'diagnostic_completed']
  );
});
