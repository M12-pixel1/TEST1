import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticFlowController,
  createDiagnosticSessionApi,
  InMemoryDiagnosticEventStore,
  InMemoryDiagnosticSessionRepository
} from '../../src/index.ts';

test('integration: UI -> start session -> answer questions -> complete session', () => {
  const repository = new InMemoryDiagnosticSessionRepository();
  const events = new InMemoryDiagnosticEventStore();
  const api = createDiagnosticSessionApi(repository, events);

  const flow = createDiagnosticFlowController(api, {
    userId: 'learner-42',
    organizationId: 'org-main'
  });

  const startState = flow.start();
  const sessionId = startState.sessionId;

  assert.ok(sessionId);

  flow.answerCurrent('focused');
  flow.next();
  flow.answerCurrent('energized');
  flow.next();
  flow.answerCurrent('very clear');
  const finalState = flow.next();

  assert.equal(finalState.phase, 'completed');

  const stored = repository.getById(sessionId as string);
  assert.ok(stored);
  assert.equal(stored.status, 'completed');
  assert.deepEqual(stored.rawAnswers, {
    focus: 'focused',
    energy: 'energized',
    clarity: 'very clear'
  });

  assert.deepEqual(
    events.listBySessionId(sessionId as string).map((entry) => entry.type),
    ['diagnostic_started', 'diagnostic_completed']
  );
});
