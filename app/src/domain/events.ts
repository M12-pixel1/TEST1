export type DiagnosticEventType = 'diagnostic_started' | 'diagnostic_completed';

export interface DiagnosticEvent {
  type: DiagnosticEventType;
  sessionId: string;
  userId: string;
  organizationId: string;
  occurredAt: string;
}

export class InMemoryDiagnosticEventStore {
  private readonly events: DiagnosticEvent[] = [];

  append(event: DiagnosticEvent): void {
    this.events.push(event);
  }

  listBySessionId(sessionId: string): DiagnosticEvent[] {
    return this.events.filter((event) => event.sessionId === sessionId);
  }
}
