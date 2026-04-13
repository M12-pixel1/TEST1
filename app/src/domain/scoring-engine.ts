import type { RawAnswers } from './diagnostic-session.ts';

export const V1_SKILL_BLOCKS = [
  'Discovery',
  'Listening & Diagnosis',
  'Value Articulation',
  'Objection Handling',
  'Follow-up Discipline'
] as const;

export type V1SkillBlock = (typeof V1_SKILL_BLOCKS)[number];

export interface V1SkillScoreResult {
  version: 'v1';
  scores: Record<V1SkillBlock, number>;
  topStrength: V1SkillBlock;
  topFocusArea: V1SkillBlock;
  initialPriorityFocus: V1SkillBlock;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toSignal = (value: unknown): number => {
  if (typeof value === 'number') {
    return clamp(Math.round(value), 1, 5);
  }

  if (typeof value !== 'string') {
    return 3;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'very low', 'low', 'poor', 'weak'].includes(normalized)) {
    return 1;
  }
  if (['2', 'below average'].includes(normalized)) {
    return 2;
  }
  if (['3', 'medium', 'average', 'ok'].includes(normalized)) {
    return 3;
  }
  if (['4', 'good', 'high', 'strong'].includes(normalized)) {
    return 4;
  }
  if (['5', 'very high', 'excellent'].includes(normalized)) {
    return 5;
  }

  return 3;
};

const signalToScore = (signal: number): number => signal * 20;

const selectTop = (
  scores: Record<V1SkillBlock, number>,
  mode: 'max' | 'min'
): V1SkillBlock => {
  const initial = V1_SKILL_BLOCKS[0];
  if (!initial) {
    throw new Error('No skill blocks configured');
  }

  return V1_SKILL_BLOCKS.reduce((current, skill) => {
    if (mode === 'max') {
      return scores[skill] > scores[current] ? skill : current;
    }
    return scores[skill] < scores[current] ? skill : current;
  }, initial);
};

export const computeV1SkillScores = (rawAnswers: RawAnswers): V1SkillScoreResult => {
  const discoverySignal = toSignal(rawAnswers.discovery ?? rawAnswers.focus);
  const listeningSignal = toSignal(rawAnswers.listening ?? rawAnswers.diagnosis);
  const valueSignal = toSignal(rawAnswers.value ?? rawAnswers.clarity);
  const objectionSignal = toSignal(rawAnswers.objection ?? rawAnswers.resistance);
  const followUpSignal = toSignal(rawAnswers.followUp ?? rawAnswers.energy);

  const scores: Record<V1SkillBlock, number> = {
    Discovery: signalToScore(discoverySignal),
    'Listening & Diagnosis': signalToScore(listeningSignal),
    'Value Articulation': signalToScore(valueSignal),
    'Objection Handling': signalToScore(objectionSignal),
    'Follow-up Discipline': signalToScore(followUpSignal)
  };

  const topStrength = selectTop(scores, 'max');
  const topFocusArea = selectTop(scores, 'min');

  return {
    version: 'v1',
    scores,
    topStrength,
    topFocusArea,
    initialPriorityFocus: topFocusArea
  };
};
