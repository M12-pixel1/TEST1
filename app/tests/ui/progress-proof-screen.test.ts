import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderProgressProof, type ProgressProofElements } from '../../src/ui/progress-proof-screen.ts';

const makeElements = (): ProgressProofElements => ({
  baselineRefText: { textContent: '' },
  currentFocusText: { textContent: '' },
  attemptsCountText: { textContent: '' },
  latestFeedbackText: { textContent: '' },
  nextActionText: { textContent: '' },
  updatedAtText: { textContent: '' }
});

test('progress proof render: shows baseline, activity and movement fields', () => {
  const elements = makeElements();

  renderProgressProof(
    {
      userId: 'u1',
      baselineSessionId: 'session-1',
      baselineTopFocusArea: 'Objection Handling',
      currentTopFocusArea: 'Objection Handling',
      completedPracticeAttempts: 2,
      latestFeedbackSummary: 'Strengths: x | Gaps: y | Next action: z',
      currentNextAction: 'Complete one focused practice attempt and review feedback.',
      updatedAt: '2026-04-13T00:00:00.000Z'
    },
    elements
  );

  assert.equal(elements.baselineRefText.textContent, 'Baseline snapshot session: session-1');
  assert.equal(elements.currentFocusText.textContent, 'Current top focus area: Objection Handling');
  assert.equal(elements.attemptsCountText.textContent, 'Completed practice attempts: 2');
  assert.ok(elements.latestFeedbackText.textContent.includes('Latest feedback:'));
  assert.ok(elements.nextActionText.textContent.startsWith('Current next action:'));
  assert.ok(elements.updatedAtText.textContent.startsWith('Updated at:'));
});
