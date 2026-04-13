import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createDiagnosticSessionApi,
  InMemoryDiagnosticEventStore,
  InMemoryDiagnosticSessionRepository
} from '../../src/index.ts';

test('integration: start -> complete diagnostic flow records events and answers', () => {
  const repository = new InMemoryDiagnosticSessionRepository();
  const eventStore = new InMemoryDiagnosticEventStore();
  const api = createDiagnosticSessionApi(repository, eventStore);

  const started = api.start({
    userId: 'user-1',
    organizationId: 'org-1'
  });

  const completeResponse = api.complete({
    sessionId: started.sessionId,
    rawAnswers: {
      questionA: 'yes',
      traits: { detailLevel: 3 },
      discovery: 'high',
      listening: 'medium',
      value: 'low',
      objection: 'high',
      followUp: 'medium'
    }
  });

  const storedSession = repository.getById(started.sessionId);
  const storedScoring = repository.getScoringResult(started.sessionId);
  const events = eventStore.listBySessionId(started.sessionId);

  assert.ok(storedSession);
  assert.equal(storedSession.status, 'completed');
  assert.deepEqual(storedSession.rawAnswers, {
    questionA: 'yes',
    traits: { detailLevel: 3 },
    discovery: 'high',
    listening: 'medium',
    value: 'low',
    objection: 'high',
    followUp: 'medium'
  });

  assert.equal(completeResponse.status, 'completed');
  assert.equal(started.skillSnapshot.version, 'v1-placeholder');
  assert.equal(completeResponse.skillSnapshot.version, 'v1');
  assert.equal(storedSession.scoringResult?.version, 'v1');
  assert.equal(storedScoring?.version, 'v1');
  assert.equal(storedScoring?.topStrength, completeResponse.skillSnapshot.topStrength);
  assert.equal(typeof completeResponse.skillSnapshot.scores.Discovery, 'number');

  assert.deepEqual(
    events.map((event) => event.type),
    ['diagnostic_started', 'diagnostic_completed']
  );
});
