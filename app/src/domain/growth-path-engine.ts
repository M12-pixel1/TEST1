import type { V1SkillScoreResult } from './scoring-engine.ts';

export interface GrowthPathPlanDraft {
  todayAction: string;
  weekPlan: string[];
  monthFocus: string;
  basedOnTopFocusArea: string;
}

const actionByFocus: Record<string, { today: string; week: string[]; month: string }> = {
  Discovery: {
    today: 'Write and practice 3 discovery questions for your next conversation.',
    week: [
      'Day 1-2: Practice discovery opening and first 3 questions.',
      'Day 3-4: Run one discovery simulation and note what worked.',
      'Day 5-7: Repeat simulation and refine question sequence.'
    ],
    month: 'Build consistency in discovery questioning and context mapping.'
  },
  'Listening & Diagnosis': {
    today: 'Run one conversation recap and identify 2 client pain signals.',
    week: [
      'Day 1-2: Practice active listening prompts.',
      'Day 3-4: Summarize client pain points after each simulation.',
      'Day 5-7: Validate diagnosis quality with a peer review.'
    ],
    month: 'Improve quality and consistency of diagnosis summaries.'
  },
  'Value Articulation': {
    today: 'Rewrite one value statement to link problem, impact, and outcome.',
    week: [
      'Day 1-2: Draft 3 value statements for common scenarios.',
      'Day 3-4: Practice saying value statements in short format.',
      'Day 5-7: Use one statement in a live or simulated conversation.'
    ],
    month: 'Strengthen clear value messaging in sales conversations.'
  },
  'Objection Handling': {
    today: 'Prepare one objection-response script with value bridge and next step.',
    week: [
      'Day 1-2: Document top 3 recurring objections.',
      'Day 3-4: Practice concise responses with a value bridge.',
      'Day 5-7: Run two objection handling simulations.'
    ],
    month: 'Increase confidence and structure in objection handling.'
  },
  'Follow-up Discipline': {
    today: 'Send one structured follow-up using owner, date, and next step format.',
    week: [
      'Day 1-2: Build a simple follow-up template library.',
      'Day 3-4: Apply template to all active opportunities.',
      'Day 5-7: Review follow-up quality and improve clarity.'
    ],
    month: 'Build reliable follow-up habits and predictable execution.'
  }
};

export const buildGrowthPathFromScoring = (scoring: V1SkillScoreResult): GrowthPathPlanDraft => {
  const focus = scoring.initialPriorityFocus;
  const template = actionByFocus[focus];

  if (!template) {
    return {
      todayAction: 'Complete one focused practice attempt and review feedback.',
      weekPlan: ['Run 3 practice attempts and review recurring gaps.'],
      monthFocus: 'Build consistency in core selling execution.',
      basedOnTopFocusArea: focus
    };
  }

  return {
    todayAction: template.today,
    weekPlan: template.week,
    monthFocus: template.month,
    basedOnTopFocusArea: focus
  };
};
