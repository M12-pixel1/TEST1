import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { PatternDetector } from '../src/anti/pattern-detector.ts';
import { interpretSignal } from '../src/anti/interpreter.ts';
import { getCorrectionForPattern, shouldTriggerCorrection } from '../src/anti/corrector.ts';
import { SIGNAL_VISIBILITY, toInterpretedSignal, filterForUser, filterForManager } from '../src/anti/visibility.ts';
import { VisibilityLayer } from '../src/anti/types.ts';
import type { SignalEvent, DetectedPattern } from '../src/anti/types.ts';

const makeEvent = (overrides: Partial<SignalEvent> & Pick<SignalEvent, 'eventType'>): SignalEvent => ({
  id: crypto.randomUUID(),
  userId: 'user-1',
  sessionId: null,
  taskId: null,
  rawData: {},
  createdAt: new Date().toISOString(),
  ...overrides
});

describe('PatternDetector', () => {
  const detector = new PatternDetector();

  test('detectConfidenceGap returns null when too few ratings', () => {
    const events = [
      makeEvent({ eventType: 'self_rate', rawData: { rating: 0.9 } }),
      makeEvent({ eventType: 'task_result', rawData: { score: 0.4 } })
    ];
    assert.equal(detector.detectConfidenceGap(events), null);
  });

  test('detectConfidenceGap detects gap when self-rating diverges from performance', () => {
    const events = [
      makeEvent({ eventType: 'self_rate', rawData: { rating: 0.9 } }),
      makeEvent({ eventType: 'self_rate', rawData: { rating: 0.85 } }),
      makeEvent({ eventType: 'self_rate', rawData: { rating: 0.95 } }),
      makeEvent({ eventType: 'task_result', rawData: { score: 0.3 } }),
      makeEvent({ eventType: 'task_result', rawData: { score: 0.35 } }),
      makeEvent({ eventType: 'task_result', rawData: { score: 0.4 } })
    ];
    const result = detector.detectConfidenceGap(events);
    assert.ok(result);
    assert.equal(result.type, 'confidence_gap');
    assert.ok(result.strength > 0.3);
    assert.equal(result.severity, 'critical');
  });

  test('detectRepeatErrors finds repeated error types after feedback', () => {
    const events = [
      makeEvent({ eventType: 'feedback_viewed', rawData: {} }),
      makeEvent({ eventType: 'task_error', rawData: { error_type: 'objection_missed' }, taskId: 't1' }),
      makeEvent({ eventType: 'task_error', rawData: { error_type: 'objection_missed' }, taskId: 't1' }),
      makeEvent({ eventType: 'task_error', rawData: { error_type: 'objection_missed' }, taskId: 't1' })
    ];
    const results = detector.detectRepeatErrors(events);
    assert.equal(results.length, 1);
    assert.equal(results[0].type, 'repeat_error');
  });

  test('detectFrictionPoints identifies tasks with 3+ abandon/retry', () => {
    const events = [
      makeEvent({ eventType: 'abandon', taskId: 'task-x' }),
      makeEvent({ eventType: 'retry', taskId: 'task-x' }),
      makeEvent({ eventType: 'abandon', taskId: 'task-x' })
    ];
    const results = detector.detectFrictionPoints(events);
    assert.equal(results.length, 1);
    assert.equal(results[0].type, 'friction_point');
    assert.equal(results[0].relatedTaskId, 'task-x');
  });

  test('detectFalseProgress flags when completions grow but quality stalls', () => {
    const now = Date.now();
    const events = [
      makeEvent({ eventType: 'task_result', rawData: { quality: 0.6 }, createdAt: new Date(now - 10 * 86400000).toISOString() }),
      makeEvent({ eventType: 'task_result', rawData: { quality: 0.65 }, createdAt: new Date(now - 9 * 86400000).toISOString() }),
      makeEvent({ eventType: 'task_result', rawData: { quality: 0.6 }, createdAt: new Date(now - 8 * 86400000).toISOString() }),
      makeEvent({ eventType: 'task_result', rawData: { quality: 0.62 }, createdAt: new Date(now - 2 * 86400000).toISOString() }),
      makeEvent({ eventType: 'task_result', rawData: { quality: 0.61 }, createdAt: new Date(now - 86400000).toISOString() }),
      makeEvent({ eventType: 'task_result', rawData: { quality: 0.60 }, createdAt: new Date(now).toISOString() })
    ];
    const result = detector.detectFalseProgress(events);
    assert.ok(result);
    assert.equal(result.type, 'false_progress');
  });

  test('detectScriptDependency flags when >80% use templates', () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        eventType: 'task_result',
        rawData: { used_template: i < 9 }
      })
    );
    const result = detector.detectScriptDependency(events);
    assert.ok(result);
    assert.equal(result.type, 'script_dependency');
  });

  test('detectDropRisk flags when no activity for 5+ days', () => {
    const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const events = [
      makeEvent({ eventType: 'task_result', createdAt: oldDate })
    ];
    const result = detector.detectDropRisk(events);
    assert.ok(result);
    assert.equal(result.type, 'drop_risk');
    assert.equal(result.severity, 'critical');
  });

  test('detectSystemFault flags when >30% hit same failure point', () => {
    const events = [
      makeEvent({ eventType: 'abandon', taskId: 'broken-task', userId: 'u1' }),
      makeEvent({ eventType: 'abandon', taskId: 'broken-task', userId: 'u2' }),
      makeEvent({ eventType: 'abandon', taskId: 'broken-task', userId: 'u3' }),
      makeEvent({ eventType: 'task_result', taskId: 'other', userId: 'u4' })
    ];
    const result = detector.detectSystemFault(events);
    assert.ok(result);
    assert.equal(result.type, 'system_fault');
  });
});

describe('Interpreter', () => {
  test('returns human-readable message for each signal type', () => {
    const pattern: DetectedPattern = {
      type: 'confidence_gap',
      strength: 0.6,
      severity: 'warning',
      confidence: 0.8,
      relatedSessionId: null,
      relatedTaskId: null
    };
    const msg = interpretSignal(pattern);
    assert.ok(msg.length > 10);
    assert.ok(msg.includes('praktikos') || msg.includes('duomenys'));
  });
});

describe('Corrector', () => {
  test('returns correction action for pattern', () => {
    const pattern: DetectedPattern = {
      type: 'drop_risk',
      strength: 0.8,
      severity: 'critical',
      confidence: 0.9,
      relatedSessionId: null,
      relatedTaskId: null
    };
    const correction = getCorrectionForPattern(pattern);
    assert.equal(correction.action, 'RE_ENTRY_PATH');
  });

  test('shouldTriggerCorrection respects severity threshold', () => {
    const normPattern: DetectedPattern = {
      type: 'confidence_gap',
      strength: 0.2,
      severity: 'norm',
      confidence: 0.5,
      relatedSessionId: null,
      relatedTaskId: null
    };
    assert.equal(shouldTriggerCorrection(normPattern), false);

    const warningPattern: DetectedPattern = { ...normPattern, severity: 'warning' };
    assert.equal(shouldTriggerCorrection(warningPattern), true);
  });
});

describe('Visibility', () => {
  test('confidence_gap is PUBLIC', () => {
    assert.equal(SIGNAL_VISIBILITY.confidence_gap, VisibilityLayer.PUBLIC);
  });

  test('system_fault is INTERNAL', () => {
    assert.equal(SIGNAL_VISIBILITY.system_fault, VisibilityLayer.INTERNAL);
  });

  test('filterForUser only returns PUBLIC signals', () => {
    const patterns: DetectedPattern[] = [
      { type: 'confidence_gap', strength: 0.5, severity: 'warning', confidence: 0.7, relatedSessionId: null, relatedTaskId: null },
      { type: 'system_fault', strength: 0.8, severity: 'critical', confidence: 0.9, relatedSessionId: null, relatedTaskId: null }
    ];
    const interpreted = patterns.map(toInterpretedSignal);
    const userSignals = filterForUser(interpreted);
    assert.equal(userSignals.length, 1);
    assert.equal(userSignals[0].type, 'confidence_gap');
  });

  test('filterForManager returns PUBLIC + SEMI_PUBLIC', () => {
    const patterns: DetectedPattern[] = [
      { type: 'confidence_gap', strength: 0.5, severity: 'warning', confidence: 0.7, relatedSessionId: null, relatedTaskId: null },
      { type: 'friction_point', strength: 0.6, severity: 'warning', confidence: 0.8, relatedSessionId: null, relatedTaskId: null },
      { type: 'system_fault', strength: 0.8, severity: 'critical', confidence: 0.9, relatedSessionId: null, relatedTaskId: null }
    ];
    const interpreted = patterns.map(toInterpretedSignal);
    const managerSignals = filterForManager(interpreted);
    assert.equal(managerSignals.length, 2);
  });
});
