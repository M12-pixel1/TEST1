import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createV1Db } from '../../src/db/v1-db.ts';
import { AntiEngine } from '../../src/anti/anti-engine.ts';

describe('AntiEngine integration', () => {
  test('full pipeline: record events, analyze, persist signals', () => {
    const db = createV1Db(':memory:');
    const engine = new AntiEngine(db.database);

    const userId = 'test-user-1';

    engine.recordEvent(userId, 'self_rate', { rating: 0.9 });
    engine.recordEvent(userId, 'self_rate', { rating: 0.85 });
    engine.recordEvent(userId, 'self_rate', { rating: 0.95 });
    engine.recordEvent(userId, 'task_result', { score: 0.3 });
    engine.recordEvent(userId, 'task_result', { score: 0.35 });
    engine.recordEvent(userId, 'task_result', { score: 0.4 });

    const result = engine.analyze(userId);

    assert.ok(result.patternsDetected > 0, 'should detect at least one pattern');
    assert.ok(result.interpreted.length > 0, 'should have interpreted signals');
    assert.equal(result.userId, userId);

    const confidenceGap = result.interpreted.find((s) => s.type === 'confidence_gap');
    assert.ok(confidenceGap, 'should detect confidence gap');
    assert.ok(confidenceGap.humanMessage.length > 0);

    const active = engine.getActiveSignals(userId);
    assert.ok(active.length > 0, 'should have persisted active signals');

    engine.resolveSignal(active[0].id, 'Calibration task assigned');
    const afterResolve = engine.getActiveSignals(userId);
    assert.equal(afterResolve.length, active.length - 1);

    db.close();
  });

  test('signal_events migration creates table correctly', () => {
    const db = createV1Db(':memory:');
    const engine = new AntiEngine(db.database);

    engine.recordEvent('u1', 'answer', { value: 'test' }, 'session-1', 'task-1');

    const events = engine.getCollector().getRecentEvents('u1', 1);
    assert.equal(events.length, 1);
    assert.equal(events[0].eventType, 'answer');
    assert.equal(events[0].sessionId, 'session-1');

    db.close();
  });

  test('visibility filtering works end-to-end', () => {
    const db = createV1Db(':memory:');
    const engine = new AntiEngine(db.database);

    const userId = 'test-user-2';

    for (let i = 0; i < 5; i++) {
      engine.recordEvent(userId, 'self_rate', { rating: 0.9 });
      engine.recordEvent(userId, 'task_result', { score: 0.3 });
    }

    const result = engine.analyze(userId);

    assert.ok(result.forUser.length <= result.forManager.length);
    assert.ok(result.forManager.length <= result.forProductTeam.length);

    for (const signal of result.forUser) {
      assert.equal(signal.visibility, 'public');
    }

    db.close();
  });
});
