import { InMemoryPracticeEventStore } from '../domain/practice-events.ts';
import { generateAttemptFeedback, type AttemptFeedback } from '../domain/practice-feedback.ts';
import type { PracticeTaskRepository } from '../domain/practice-task.ts';
import type { TaskAttemptRepository } from '../domain/task-attempt.ts';

export interface SubmitAttemptRequest {
  taskId: string;
  userId: string;
  response: string;
}

export interface SubmitAttemptResponse {
  attemptId: string;
  feedback: AttemptFeedback;
}

export interface ViewFeedbackResponse {
  attemptId: string;
  feedback: AttemptFeedback;
}

export interface PracticeFeedbackApi {
  submitAttempt(request: SubmitAttemptRequest): SubmitAttemptResponse;
  viewFeedback(attemptId: string): ViewFeedbackResponse;
}

export const createPracticeFeedbackApi = (
  tasks: PracticeTaskRepository,
  attempts: TaskAttemptRepository,
  events: InMemoryPracticeEventStore
): PracticeFeedbackApi => ({
  submitAttempt(request) {
    const task = tasks.getById(request.taskId);
    if (!task) {
      throw new Error('Practice task not found');
    }

    const attempt = attempts.create({
      taskId: request.taskId,
      userId: request.userId,
      response: request.response
    });

    const feedback = generateAttemptFeedback(task.type, request.response);
    const updatedAttempt = attempts.saveFeedback(attempt.id, feedback);

    if (!updatedAttempt.feedback) {
      throw new Error('Feedback was not stored');
    }

    return {
      attemptId: updatedAttempt.id,
      feedback: updatedAttempt.feedback
    };
  },

  viewFeedback(attemptId) {
    const attempt = attempts.getById(attemptId);
    if (!attempt || !attempt.feedback) {
      throw new Error('Feedback not found');
    }

    events.append({
      type: 'feedback_viewed',
      attemptId,
      userId: attempt.userId,
      occurredAt: new Date().toISOString()
    });

    return {
      attemptId,
      feedback: attempt.feedback
    };
  }
});
