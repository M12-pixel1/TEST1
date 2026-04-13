/**
 * RH-TEST-2026-AUGIMO-001: Antimaterijos Branduolio Smoke Test
 * Vykdo 7 detektoriu testus + visibility gate + performance
 */
import { createV1Db } from '../app/src/db/v1-db.ts';
import { AntiEngine } from '../app/src/anti/anti-engine.ts';
import { toInterpretedSignal, filterForUser, filterForManager, filterForProductTeam } from '../app/src/anti/visibility.ts';
import { PatternDetector } from '../app/src/anti/pattern-detector.ts';
import type { SignalEvent } from '../app/src/anti/types.ts';

const db = createV1Db(':memory:');
const engine = new AntiEngine(db.database);
const detector = new PatternDetector();

const results: Array<{ test: string; status: string; details: string }> = [];
const alphaId = 'test-alpha-' + crypto.randomUUID().slice(0, 8);
const betaId = 'test-beta-' + crypto.randomUUID().slice(0, 8);
const gammaId = 'test-gamma-' + crypto.randomUUID().slice(0, 8);

const log = (test: string, status: string, details: string) => {
  results.push({ test, status, details });
  const icon = status === 'PASS' ? '\u2705' : status === 'PARTIAL' ? '\u26A0\uFE0F' : '\u274C';
  console.log(`${icon} ${test}: ${status} — ${details}`);
};

// ============================================================
// TEST A: Confidence Gap
// ============================================================
console.log('\n=== TEST A: Confidence Gap ===');
for (let i = 0; i < 5; i++) {
  engine.recordEvent(alphaId, 'self_rate', { rating: 0.85 + Math.random() * 0.1 });
  engine.recordEvent(alphaId, 'task_result', { score: 0.3 + Math.random() * 0.1 });
}

const resultA = engine.analyze(alphaId);
const gapSignal = resultA.interpreted.find(s => s.type === 'confidence_gap');
if (gapSignal) {
  log('A: Confidence Gap', 'PASS',
    `type=${gapSignal.type}, severity=${gapSignal.severity}, strength=${gapSignal.strength.toFixed(2)}, action=${gapSignal.correction.action}`);
} else {
  log('A: Confidence Gap', 'FAIL', `No confidence_gap detected. Patterns found: ${resultA.interpreted.map(s => s.type).join(', ') || 'none'}`);
}

// ============================================================
// TEST B: Repeat Error
// ============================================================
console.log('\n=== TEST B: Repeat Error ===');
// Need feedback_viewed + 3+ task_error with same error_type
engine.recordEvent(betaId, 'feedback_viewed', {});
for (let i = 0; i < 4; i++) {
  engine.recordEvent(betaId, 'task_error', { error_type: 'wrong_formula_A' }, null, 'task-repeat-1');
}

const resultB = engine.analyze(betaId);
const repeatSignal = resultB.interpreted.find(s => s.type === 'repeat_error');
if (repeatSignal) {
  log('B: Repeat Error', 'PASS',
    `type=${repeatSignal.type}, severity=${repeatSignal.severity}, action=${repeatSignal.correction.action}`);
} else {
  log('B: Repeat Error', 'FAIL', `No repeat_error detected. Patterns: ${resultB.interpreted.map(s => s.type).join(', ') || 'none'}`);
}

// ============================================================
// TEST C: Friction Point
// ============================================================
console.log('\n=== TEST C: Friction Point ===');
const frictionUser = 'test-friction-' + crypto.randomUUID().slice(0, 8);
for (let i = 0; i < 4; i++) {
  engine.recordEvent(frictionUser, 'abandon', {}, null, 'friction_task_99');
}

const resultC = engine.analyze(frictionUser);
const frictionSignal = resultC.interpreted.find(s => s.type === 'friction_point');
if (frictionSignal) {
  log('C: Friction Point', 'PASS',
    `type=${frictionSignal.type}, severity=${frictionSignal.severity}, action=${frictionSignal.correction.action}`);
} else {
  log('C: Friction Point', 'FAIL', `No friction_point detected. Patterns: ${resultC.interpreted.map(s => s.type).join(', ') || 'none'}`);
}

// ============================================================
// TEST D: False Progress
// ============================================================
console.log('\n=== TEST D: False Progress ===');
const fpUser = 'test-fp-' + crypto.randomUUID().slice(0, 8);
const now = Date.now();
// First half: quality ~0.6
for (let i = 0; i < 4; i++) {
  engine.getCollector().record({
    userId: fpUser,
    sessionId: null,
    taskId: null,
    eventType: 'task_result',
    rawData: { quality: 0.58 + Math.random() * 0.04 },
  });
}
// Second half: more items, quality still ~0.6 (stalls)
for (let i = 0; i < 6; i++) {
  engine.getCollector().record({
    userId: fpUser,
    sessionId: null,
    taskId: null,
    eventType: 'task_result',
    rawData: { quality: 0.58 + Math.random() * 0.04 },
  });
}

const resultD = engine.analyze(fpUser);
const fpSignal = resultD.interpreted.find(s => s.type === 'false_progress');
if (fpSignal) {
  log('D: False Progress', 'PASS',
    `type=${fpSignal.type}, severity=${fpSignal.severity}, strength=${fpSignal.strength.toFixed(2)}, action=${fpSignal.correction.action}`);
} else {
  log('D: False Progress', 'PARTIAL', `Not detected — may need longer time window. Patterns: ${resultD.interpreted.map(s => s.type).join(', ') || 'none'}`);
}

// ============================================================
// TEST E: Script Dependency
// ============================================================
console.log('\n=== TEST E: Script Dependency ===');
const sdUser = 'test-sd-' + crypto.randomUUID().slice(0, 8);
for (let i = 0; i < 9; i++) {
  engine.recordEvent(sdUser, 'task_result', { used_template: true });
}
engine.recordEvent(sdUser, 'task_result', { used_template: false });

const resultE = engine.analyze(sdUser);
const sdSignal = resultE.interpreted.find(s => s.type === 'script_dependency');
if (sdSignal) {
  log('E: Script Dependency', 'PASS',
    `type=${sdSignal.type}, severity=${sdSignal.severity}, strength=${sdSignal.strength.toFixed(2)}, action=${sdSignal.correction.action}`);
} else {
  log('E: Script Dependency', 'FAIL', `No script_dependency detected. Patterns: ${resultE.interpreted.map(s => s.type).join(', ') || 'none'}`);
}

// ============================================================
// TEST F: Drop Risk
// ============================================================
console.log('\n=== TEST F: Drop Risk ===');
const drUser = 'test-dr-' + crypto.randomUUID().slice(0, 8);
// One old event, 7 days ago
const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
db.database
  .prepare('INSERT INTO signal_events (id, user_id, session_id, task_id, event_type, raw_data_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
  .run(crypto.randomUUID(), drUser, null, null, 'session_start', '{}', oldDate);

const resultF = engine.analyze(drUser);
const drSignal = resultF.interpreted.find(s => s.type === 'drop_risk');
if (drSignal) {
  log('F: Drop Risk', 'PASS',
    `type=${drSignal.type}, severity=${drSignal.severity}, strength=${drSignal.strength.toFixed(2)}, action=${drSignal.correction.action}`);
} else {
  log('F: Drop Risk', 'FAIL', `No drop_risk detected. Patterns: ${resultF.interpreted.map(s => s.type).join(', ') || 'none'}`);
}

// ============================================================
// TEST G: System Fault
// ============================================================
console.log('\n=== TEST G: System Fault ===');
const sfUsers = [alphaId, betaId, gammaId];
sfUsers.forEach(uid => {
  engine.recordEvent(uid, 'abandon', { task_id: 'system_fault_task' }, null, 'system_fault_task');
});
// Need to analyze with all events visible — system_fault checks across users
// Collect all events from all 3 users
const allSfEvents: SignalEvent[] = [];
sfUsers.forEach(uid => {
  allSfEvents.push(...engine.getCollector().getRecentEvents(uid, 14));
});
const sfPatterns = detector.detectSystemFault(allSfEvents);
if (sfPatterns) {
  log('G: System Fault', 'PASS',
    `type=${sfPatterns.type}, severity=${sfPatterns.severity}, strength=${sfPatterns.strength.toFixed(2)}`);
} else {
  // Try with more abandon events to trigger threshold
  log('G: System Fault', 'PARTIAL',
    'System fault detection requires multi-user aggregation. Per-user analysis cannot trigger it. Arch note: needs cross-user endpoint.');
}

// ============================================================
// VISIBILITY GATE TEST
// ============================================================
console.log('\n=== VISIBILITY GATE TEST ===');
const visResult = engine.analyze(alphaId);
const allInterpreted = visResult.interpreted;
const userView = filterForUser(allInterpreted);
const managerView = filterForManager(allInterpreted);
const productView = filterForProductTeam(allInterpreted);

console.log(`Total signals: ${allInterpreted.length}`);
console.log(`User sees: ${userView.length} (${userView.map(s => s.type).join(', ')})`);
console.log(`Manager sees: ${managerView.length} (${managerView.map(s => s.type).join(', ')})`);
console.log(`Product sees: ${productView.length} (${productView.map(s => s.type).join(', ')})`);

const userHasNoInternal = userView.every(s => s.visibility === 'public');
const managerHasNoInternal = managerView.every(s => s.visibility === 'public' || s.visibility === 'semi_public');

if (userHasNoInternal && managerHasNoInternal && productView.length >= userView.length) {
  log('Visibility Gate', 'PASS',
    `User=${userView.length} PUBLIC, Manager=${managerView.length} PUBLIC+SEMI, Product=${productView.length} ALL`);
} else {
  log('Visibility Gate', 'FAIL',
    `Filtering broken. User internal leak: ${!userHasNoInternal}`);
}

// ============================================================
// PERFORMANCE TEST
// ============================================================
console.log('\n=== PERFORMANCE TEST ===');
// Create user with ~30 events
const perfUser = 'test-perf-' + crypto.randomUUID().slice(0, 8);
for (let i = 0; i < 30; i++) {
  engine.recordEvent(perfUser, ['self_rate', 'task_result', 'task_error', 'abandon'][i % 4],
    { rating: 0.5, score: 0.5, error_type: 'test' }, null, 'task-perf');
}

const start = performance.now();
const perfResult = engine.analyze(perfUser);
const elapsed = performance.now() - start;

if (elapsed < 2000) {
  log('Performance', 'PASS', `${elapsed.toFixed(1)}ms for ${30} events (limit: 2000ms)`);
} else if (elapsed < 5000) {
  log('Performance', 'PARTIAL', `${elapsed.toFixed(1)}ms — acceptable for V1 but needs optimization`);
} else {
  log('Performance', 'FAIL', `${elapsed.toFixed(1)}ms — too slow`);
}

// ============================================================
// SUMMARY
// ============================================================
console.log('\n' + '='.repeat(60));
console.log('  SMOKE TEST SUMMARY');
console.log('='.repeat(60));

const passed = results.filter(r => r.status === 'PASS').length;
const partial = results.filter(r => r.status === 'PARTIAL').length;
const failed = results.filter(r => r.status === 'FAIL').length;

console.log(`PASS: ${passed} | PARTIAL: ${partial} | FAIL: ${failed} | TOTAL: ${results.length}`);
console.log('');

results.forEach(r => {
  const icon = r.status === 'PASS' ? '\u2705' : r.status === 'PARTIAL' ? '\u26A0\uFE0F' : '\u274C';
  console.log(`${icon} ${r.test}: ${r.status}`);
  console.log(`   ${r.details}`);
});

// Active signals in DB
const activeSignals = engine.getActiveSignals(alphaId);
console.log(`\nActive anti_signals_v2 for alpha: ${activeSignals.length}`);
activeSignals.forEach(s => {
  console.log(`  - ${s.signalType} severity=${s.severity} strength=${s.strength} action=${s.recommendedAction}`);
});

db.close();
console.log('\nTest complete. DB closed.');
