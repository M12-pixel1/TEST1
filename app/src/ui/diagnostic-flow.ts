import type { DiagnosticSessionApi } from '../api/diagnostic-session-api.ts';
import type { RawAnswers } from '../domain/diagnostic-session.ts';

export interface DiagnosticQuestion {
  id: string;
  prompt: string;
}

export interface DiagnosticContext {
  userId: string;
  organizationId: string;
}

export type DiagnosticUiPhase = 'idle' | 'in_progress' | 'completed';

export interface DiagnosticFlowState {
  phase: DiagnosticUiPhase;
  sessionId: string | null;
  currentStepIndex: number;
  questions: DiagnosticQuestion[];
  answers: RawAnswers;
}

const DEFAULT_QUESTIONS: DiagnosticQuestion[] = [
  { id: 'focus', prompt: 'How focused do you feel today?' },
  { id: 'energy', prompt: 'How energetic do you feel today?' },
  { id: 'clarity', prompt: 'How clear are your next learning goals?' }
];

export class DiagnosticFlowController {
  private readonly api: DiagnosticSessionApi;
  private readonly context: DiagnosticContext;

  private state: DiagnosticFlowState = {
    phase: 'idle',
    sessionId: null,
    currentStepIndex: 0,
    questions: DEFAULT_QUESTIONS,
    answers: {}
  };

  constructor(api: DiagnosticSessionApi, context: DiagnosticContext) {
    this.api = api;
    this.context = context;
  }

  getState(): DiagnosticFlowState {
    return {
      ...this.state,
      answers: JSON.parse(JSON.stringify(this.state.answers)) as RawAnswers,
      questions: [...this.state.questions]
    };
  }

  start(): DiagnosticFlowState {
    if (this.state.phase !== 'idle') {
      return this.getState();
    }

    const response = this.api.start({
      userId: this.context.userId,
      organizationId: this.context.organizationId
    });

    this.state = {
      ...this.state,
      phase: 'in_progress',
      sessionId: response.sessionId,
      currentStepIndex: 0,
      answers: {}
    };

    return this.getState();
  }

  answerCurrent(answer: string): DiagnosticFlowState {
    if (this.state.phase !== 'in_progress') {
      throw new Error('Diagnostic flow is not in progress');
    }

    const question = this.state.questions[this.state.currentStepIndex];
    if (!question) {
      throw new Error('No active question');
    }

    this.state = {
      ...this.state,
      answers: {
        ...this.state.answers,
        [question.id]: answer
      }
    };

    return this.getState();
  }

  next(): DiagnosticFlowState {
    if (this.state.phase !== 'in_progress') {
      throw new Error('Diagnostic flow is not in progress');
    }

    const isLastStep = this.state.currentStepIndex >= this.state.questions.length - 1;
    if (isLastStep) {
      return this.complete();
    }

    this.state = {
      ...this.state,
      currentStepIndex: this.state.currentStepIndex + 1
    };

    return this.getState();
  }

  complete(): DiagnosticFlowState {
    if (this.state.phase !== 'in_progress' || !this.state.sessionId) {
      throw new Error('Diagnostic flow cannot be completed');
    }

    this.api.complete({
      sessionId: this.state.sessionId,
      rawAnswers: this.state.answers
    });

    this.state = {
      ...this.state,
      phase: 'completed'
    };

    return this.getState();
  }
}

export const createDiagnosticFlowController = (
  api: DiagnosticSessionApi,
  context: DiagnosticContext
): DiagnosticFlowController => new DiagnosticFlowController(api, context);
