import { test } from 'node:test';
import assert from 'node:assert/strict';

import { renderSkillSnapshot, type SkillSnapshotElements } from '../../src/ui/skill-snapshot-screen.ts';

const makeElements = (): SkillSnapshotElements => ({
  titleText: { textContent: '' },
  skillBlocksText: { textContent: '' },
  topStrengthText: { textContent: '' },
  topFocusText: { textContent: '' },
  nextActionText: { textContent: '' }
});

test('skill snapshot screen: renders public snapshot content', () => {
  const elements = makeElements();

  renderSkillSnapshot(
    {
      sessionId: 'session-1',
      skillBlocks: [
        { skill: 'Discovery', score: 80 },
        { skill: 'Listening & Diagnosis', score: 60 },
        { skill: 'Value Articulation', score: 40 },
        { skill: 'Objection Handling', score: 20 },
        { skill: 'Follow-up Discipline', score: 50 }
      ],
      topStrength: 'Discovery',
      topFocusArea: 'Objection Handling',
      nextAction: 'Next action: improve Objection Handling'
    },
    elements
  );

  assert.equal(elements.titleText.textContent, 'Skill Snapshot');
  assert.ok(elements.skillBlocksText.textContent.includes('Discovery: 80'));
  assert.equal(elements.topStrengthText.textContent, 'Top strength: Discovery');
  assert.equal(elements.topFocusText.textContent, 'Top focus area: Objection Handling');
  assert.equal(elements.nextActionText.textContent, 'Next action: improve Objection Handling');
});
