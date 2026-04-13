import type { PublicSkillSnapshot } from '../api/skill-snapshot-api.ts';

export interface SkillSnapshotElements {
  titleText: { textContent: string };
  skillBlocksText: { textContent: string };
  topStrengthText: { textContent: string };
  topFocusText: { textContent: string };
  nextActionText: { textContent: string };
}

export const renderSkillSnapshot = (
  snapshot: PublicSkillSnapshot | null,
  elements: SkillSnapshotElements
): void => {
  if (!snapshot) {
    elements.titleText.textContent = 'Skill snapshot unavailable';
    elements.skillBlocksText.textContent = '';
    elements.topStrengthText.textContent = '';
    elements.topFocusText.textContent = '';
    elements.nextActionText.textContent = '';
    return;
  }

  elements.titleText.textContent = 'Skill Snapshot';
  elements.skillBlocksText.textContent = snapshot.skillBlocks
    .map((block) => `${block.skill}: ${block.score}`)
    .join(' | ');
  elements.topStrengthText.textContent = `Top strength: ${snapshot.topStrength}`;
  elements.topFocusText.textContent = `Top focus area: ${snapshot.topFocusArea}`;
  elements.nextActionText.textContent = snapshot.nextAction;
};
