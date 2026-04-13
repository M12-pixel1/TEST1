import type { GrowthPathApi } from './growth-path-api.ts';
import type { PracticeFeedbackApi } from './practice-feedback-api.ts';
import { type PracticeTaskRepository, type PracticeTask, type PracticeTaskType } from '../domain/practice-task.ts';

export interface AssignedPracticeTask {
  taskId: string;
  type: PracticeTaskType;
  title: string;
  prompt: string;
  basedOnFocusArea: string;
}

export interface PracticeSubmissionResult {
  attemptId: string;
  strengths: string[];
  gaps: string[];
  nextAction: string;
}

export interface PracticeAssignmentApi {
  assignForUser(userId: string): AssignedPracticeTask;
  submitPracticeResponse(userId: string, taskId: string, response: string): PracticeSubmissionResult;
}

const focusToTaskType: Record<string, PracticeTaskType> = {
  Discovery: 'discovery_scenario',
  'Listening & Diagnosis': 'client_situation_analysis',
  'Value Articulation': 'discovery_scenario',
  'Objection Handling': 'objection_scenario',
  'Follow-up Discipline': 'follow_up_email'
};

const seedCatalog = (tasks: PracticeTaskRepository): void => {
  if (tasks.list().length > 0) {
    return;
  }

  tasks.create({
    type: 'discovery_scenario',
    title: 'Discovery prompt practice',
    prompt: 'Write your first 3 discovery questions for a new prospect conversation.'
  });
  tasks.create({
    type: 'objection_scenario',
    title: 'Objection handling drill',
    prompt: 'Respond to: “This is too expensive.” with value + next step.'
  });
  tasks.create({
    type: 'follow_up_email',
    title: 'Follow-up email drill',
    prompt: 'Draft a concise follow-up email with owner, date, and next action.'
  });
  tasks.create({
    type: 'client_situation_analysis',
    title: 'Client situation analysis',
    prompt: 'Analyze the client situation and list top 2 risks + next step.'
  });
};

const pickTask = (tasks: PracticeTask[], type: PracticeTaskType): PracticeTask | null =>
  tasks.find((task) => task.type === type) ?? null;

export const createPracticeAssignmentApi = (
  growthPathApi: GrowthPathApi,
  tasks: PracticeTaskRepository,
  feedbackApi: PracticeFeedbackApi
): PracticeAssignmentApi => {
  seedCatalog(tasks);

  return {
    assignForUser(userId) {
      const growthPath = growthPathApi.getByUserId(userId);
      if (!growthPath) {
        throw new Error('GrowthPath not found for user');
      }

      const preferredType =
        focusToTaskType[growthPath.basedOnTopFocusArea] ?? 'client_situation_analysis';
      const task = pickTask(tasks.list(), preferredType);

      if (!task) {
        throw new Error('Practice task not found for focus area');
      }

      return {
        taskId: task.id,
        type: task.type,
        title: task.title,
        prompt: task.prompt,
        basedOnFocusArea: growthPath.basedOnTopFocusArea
      };
    },

    submitPracticeResponse(userId, taskId, response) {
      const submitted = feedbackApi.submitAttempt({
        taskId,
        userId,
        response
      });

      return {
        attemptId: submitted.attemptId,
        strengths: submitted.feedback.strengths,
        gaps: submitted.feedback.gaps,
        nextAction: submitted.feedback.nextAction
      };
    }
  };
};
