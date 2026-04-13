export type PracticeEventType = 'feedback_viewed';

export interface PracticeEvent {
  type: PracticeEventType;
  attemptId: string;
  userId: string;
  occurredAt: string;
}

export class InMemoryPracticeEventStore {
  private readonly events: PracticeEvent[] = [];

  append(event: PracticeEvent): void {
    this.events.push(event);
  }

  listByAttemptId(attemptId: string): PracticeEvent[] {
    return this.events.filter((event) => event.attemptId === attemptId);
  }
}
