import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AntiSignalService,
  createDiagnosticSessionApi,
  createGrowthPathApi,
  createPracticeAssignmentApi,
  createPracticeFeedbackApi,
  createProgressProofApi,
  createSkillSnapshotReadApi,
  createV1Db,
  InMemoryAntiSignalEventStore,
  InMemoryDiagnosticEventStore,
  InMemoryPracticeEventStore,
  SqliteAntiSignalRepository,
  SqliteDiagnosticSessionRepository,
  SqliteGrowthPathRepository,
  SqlitePracticeTaskRepository,
  SqliteTaskAttemptRepository
} from '../../src/index.ts';

test('integration: db-backed core flow works end-to-end', () => {
  const db = createV1Db(':memory:');

  const diagnosticRepo = new SqliteDiagnosticSessionRepository(db.database);
  const growthRepo = new SqliteGrowthPathRepository(db.database);
  const taskRepo = new SqlitePracticeTaskRepository(db.database);
  const attemptRepo = new SqliteTaskAttemptRepository(db.database, taskRepo);
  const antiRepo = new SqliteAntiSignalRepository(db.database);

  const diagnosticEvents = new InMemoryDiagnosticEventStore();
  const practiceEvents = new InMemoryPracticeEventStore();
  const antiEvents = new InMemoryAntiSignalEventStore();

  const sessionApi = createDiagnosticSessionApi(diagnosticRepo, diagnosticEvents);
  const snapshotApi = createSkillSnapshotReadApi(diagnosticRepo);
  const growthApi = createGrowthPathApi(diagnosticRepo, growthRepo);
  const feedbackApi = createPracticeFeedbackApi(taskRepo, attemptRepo, practiceEvents);
  const assignmentApi = createPracticeAssignmentApi(growthApi, taskRepo, feedbackApi);
  const progressApi = createProgressProofApi(diagnosticRepo, growthRepo, attemptRepo);
  const antiService = new AntiSignalService(antiRepo, antiEvents);

  const start = sessionApi.start({ userId: 'db-user-1', organizationId: 'db-org-1' });
  const completed = sessionApi.complete({
    sessionId: start.sessionId,
    rawAnswers: {
      discovery_confidence: '2',
      listening_confidence: '3',
      value_confidence: '2',
      objection_confidence: '1',
      followup_confidence: '2'
    }
  });

  const snapshot = snapshotApi.getBySessionId(start.sessionId);
  assert.ok(snapshot);

  const growth = growthApi.generateForUser('db-user-1');
  assert.ok(growth);

  const task = assignmentApi.assignForUser('db-user-1');
  const submission = assignmentApi.submitPracticeResponse(
    'db-user-1',
    task.taskId,
    'I will ask intent, summarize pain, and confirm the next step.'
  );
  assert.ok(submission.attemptId.length > 0);

  const anti = antiService.createConfidenceGap('db-user-1', start.sessionId, 5, completed.skillSnapshot);
  assert.equal(anti.userId, 'db-user-1');

  const progress = progressApi.getByUserId('db-user-1');
  assert.ok(progress);
  assert.equal(progress?.baselineSessionId, start.sessionId);
  assert.equal(progress?.completedPracticeAttempts, 1);
  assert.ok(progress?.latestFeedbackSummary?.includes('Strengths:'));

  db.close();
});
