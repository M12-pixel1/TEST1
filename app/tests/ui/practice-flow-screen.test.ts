import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  renderAssignedTask,
  renderPracticeFeedback,
  type AssignedPracticeTask,
  type PracticeFlowElements,
  type PracticeSubmissionResult
} from '../../src/index.ts';

const elements: PracticeFlowElements = {
  taskTitleText: { textContent: '' },
  taskPromptText: { textContent: '' },
  feedbackText: { textContent: '' }
};

const task: AssignedPracticeTask = {
  taskId: 'task-1',
  type: 'objection_scenario',
  title: 'Objection handling drill',
  prompt: 'Respond to objection with value bridge.',
  basedOnFocusArea: 'Objection Handling'
};

const feedback: PracticeSubmissionResult = {
  attemptId: 'attempt-1',
  strengths: ['Clear framing'],
  gaps: ['Missing owner'],
  nextAction: 'Add owner and timeline'
};

test('practice flow render: task and feedback are shown in user flow', () => {
  renderAssignedTask(task, elements);
  renderPracticeFeedback(feedback, elements);

  assert.equal(elements.taskTitleText.textContent, 'Objection handling drill');
  assert.ok(elements.taskPromptText.textContent.length > 0);
  assert.ok(elements.feedbackText.textContent.includes('Strengths:'));
  assert.ok(elements.feedbackText.textContent.includes('Next action:'));
});
