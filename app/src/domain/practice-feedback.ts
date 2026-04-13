import type { PracticeTaskType } from './practice-task.ts';

export interface AttemptFeedback {
  strengths: string[];
  gaps: string[];
  nextAction: string;
  generatedAt: string;
}

const feedbackTemplates: Record<
  PracticeTaskType,
  { strength: string; gap: string; action: string }
> = {
  discovery_scenario: {
    strength: 'You included discovery intent in your response.',
    gap: 'Questions can be sequenced more clearly from context to pain.',
    action: 'Rewrite your first 3 discovery questions with a clear order.'
  },
  objection_scenario: {
    strength: 'You acknowledged the objection and stayed on topic.',
    gap: 'Response can better connect to business value before closing.',
    action: 'Add one value-based sentence before your final ask.'
  },
  follow_up_email: {
    strength: 'Your response contains a concrete follow-up direction.',
    gap: 'The next step owner and timeline are not explicit enough.',
    action: 'Add owner + date for each next step in one short list.'
  },
  client_situation_analysis: {
    strength: 'You identified relevant signals from the client situation.',
    gap: 'Prioritization of risks and opportunities can be sharper.',
    action: 'Rank top 2 risks and top 2 opportunities before proposing action.'
  }
};

const summarizeStrength = (response: string, baseStrength: string): string => {
  if (response.length > 120) {
    return `${baseStrength} You provided sufficient detail to review.`;
  }
  if (response.length < 40) {
    return `${baseStrength} Keep concise style while adding one more concrete detail.`;
  }
  return baseStrength;
};

export const generateAttemptFeedback = (
  taskType: PracticeTaskType,
  response: string
): AttemptFeedback => {
  const template = feedbackTemplates[taskType];
  return {
    strengths: [summarizeStrength(response, template.strength)],
    gaps: [template.gap],
    nextAction: template.action,
    generatedAt: new Date().toISOString()
  };
};
