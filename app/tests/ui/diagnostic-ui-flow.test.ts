import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticFlowController,
  createDiagnosticSessionApi,
  InMemoryDiagnosticEventStore,
  InMemoryDiagnosticSessionRepository
} from '../../src/index.ts';

test('ui flow: user can start diagnostic, answer steps, and reach completion state', () => {
  const repository = new InMemoryDiagnosticSessionRepository();
  const events = new InMemoryDiagnosticEventStore();
  const api = createDiagnosticSessionApi(repository, events);

  const flow = createDiagnosticFlowController(api, {
    userId: 'learner-1',
    organizationId: 'org-1'
  });

  const started = flow.start();
  assert.equal(started.phase, 'in_progress');
  assert.equal(started.currentStepIndex, 0);

  flow.answerCurrent('high');
  flow.next();
  flow.answerCurrent('medium');
  flow.next();
  flow.answerCurrent('clear');

  const completed = flow.next();
  assert.equal(completed.phase, 'completed');
});
