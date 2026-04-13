import { test } from 'node:test';
import assert from 'node:assert/strict';

import { generateAttemptFeedback } from '../src/index.ts';

test('practice feedback: generates strengths, gaps and next action', () => {
  const feedback = generateAttemptFeedback(
    'objection_scenario',
    'I acknowledged the concern and clarified the value proposition.'
  );

  assert.equal(feedback.strengths.length > 0, true);
  assert.equal(feedback.gaps.length > 0, true);
  assert.equal(feedback.nextAction.length > 0, true);
  assert.equal(typeof feedback.generatedAt, 'string');
});
