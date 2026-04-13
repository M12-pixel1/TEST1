export type AntiSignalEventType = 'anti_signal_triggered';

export interface AntiSignalEvent {
  type: AntiSignalEventType;
  signalId: string;
  userId: string;
  signalType: string;
  occurredAt: string;
}

export class InMemoryAntiSignalEventStore {
  private readonly events: AntiSignalEvent[] = [];

  append(event: AntiSignalEvent): void {
    this.events.push(event);
  }

  listByUserId(userId: string): AntiSignalEvent[] {
    return this.events.filter((event) => event.userId === userId);
  }
}
