import {
  createDiagnosticFlowController,
  createConfiguredV1Db,
  createDiagnosticSessionApi,
  createGrowthPathApi,
  createPracticeAssignmentApi,
  createPracticeFeedbackApi,
  createProgressProofApi,
  createSkillSnapshotReadApi,
  InMemoryDiagnosticEventStore,
  InMemoryPracticeEventStore,
  SqliteDiagnosticSessionRepository,
  SqliteGrowthPathRepository,
  SqlitePracticeTaskRepository,
  SqliteTaskAttemptRepository
} from '../src/index.ts';
import { mountDiagnosticScreen, type DiagnosticScreenElements } from '../src/ui/browser-diagnostic-screen.ts';

const byId = <T>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing element: ${id}`);
  }
  return element as T;
};

const elements: DiagnosticScreenElements = {
  questionText: byId<HTMLElement>('question-text'),
  progressText: byId<HTMLElement>('progress-text'),
  completionText: byId<HTMLElement>('completion-text'),
  answerInput: byId<HTMLInputElement>('answer-input'),
  startButton: byId<HTMLButtonElement>('start-button'),
  nextButton: byId<HTMLButtonElement>('next-button'),
  showNextStepButton: byId<HTMLButtonElement>('show-next-step-button'),
  showProgressProofButton: byId<HTMLButtonElement>('show-progress-proof-button'),
  startPracticeButton: byId<HTMLButtonElement>('start-practice-button'),
  submitPracticeButton: byId<HTMLButtonElement>('submit-practice-button'),
  practiceResponseInput: byId<HTMLInputElement>('practice-response-input'),
  snapshot: {
    titleText: byId<HTMLElement>('snapshot-title'),
    skillBlocksText: byId<HTMLElement>('snapshot-skills'),
    topStrengthText: byId<HTMLElement>('snapshot-strength'),
    topFocusText: byId<HTMLElement>('snapshot-focus'),
    nextActionText: byId<HTMLElement>('snapshot-next-action')
  },
  nextStep: {
    todayActionText: byId<HTMLElement>('next-step-today-action'),
    weekPlanText: byId<HTMLElement>('next-step-week-plan'),
    monthFocusText: byId<HTMLElement>('next-step-month-focus')
  },
  practice: {
    taskTitleText: byId<HTMLElement>('practice-task-title'),
    taskPromptText: byId<HTMLElement>('practice-task-prompt'),
    feedbackText: byId<HTMLElement>('practice-feedback')
  },
  progressProof: {
    baselineRefText: byId<HTMLElement>('progress-baseline-ref'),
    currentFocusText: byId<HTMLElement>('progress-current-focus'),
    attemptsCountText: byId<HTMLElement>('progress-attempts-count'),
    latestFeedbackText: byId<HTMLElement>('progress-latest-feedback'),
    nextActionText: byId<HTMLElement>('progress-next-action'),
    updatedAtText: byId<HTMLElement>('progress-updated-at')
  }
};

const runtimeEnv = (globalThis as {
  __V1_ENV__?: {
    V1_DB_PATH?: string;
    PILOT_ACTIVE_USER_ID?: string;
    PILOT_ORGANIZATION_ID?: string;
  };
}).__V1_ENV__ ?? {};
const db = createConfiguredV1Db(runtimeEnv);
const repository = new SqliteDiagnosticSessionRepository(db.database);
const eventStore = new InMemoryDiagnosticEventStore();
const sessionApi = createDiagnosticSessionApi(repository, eventStore);
const snapshotApi = createSkillSnapshotReadApi(repository);
const growthPathRepo = new SqliteGrowthPathRepository(db.database);
const growthPathApi = createGrowthPathApi(repository, growthPathRepo);

const taskRepo = new SqlitePracticeTaskRepository(db.database);
const attemptRepo = new SqliteTaskAttemptRepository(db.database, taskRepo);
const practiceEvents = new InMemoryPracticeEventStore();
const practiceFeedbackApi = createPracticeFeedbackApi(taskRepo, attemptRepo, practiceEvents);
const practiceAssignmentApi = createPracticeAssignmentApi(growthPathApi, taskRepo, practiceFeedbackApi);
const progressProofApi = createProgressProofApi(repository, growthPathRepo, attemptRepo);

const userId = runtimeEnv.PILOT_ACTIVE_USER_ID ?? 'demo-learner-1';
const organizationId = runtimeEnv.PILOT_ORGANIZATION_ID ?? 'demo-org-1';
const flow = createDiagnosticFlowController(sessionApi, {
  userId,
  organizationId
});

mountDiagnosticScreen(
  flow,
  userId,
  snapshotApi,
  growthPathApi,
  practiceAssignmentApi,
  elements,
  progressProofApi
);
