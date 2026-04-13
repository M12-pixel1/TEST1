export type ManagerEventType = 'manager_dashboard_viewed';

export interface ManagerEvent {
  type: ManagerEventType;
  managerUserId: string;
  organizationId: string;
  occurredAt: string;
}

export class InMemoryManagerEventStore {
  private readonly events: ManagerEvent[] = [];

  append(event: ManagerEvent): void {
    this.events.push(event);
  }

  listByManager(managerUserId: string): ManagerEvent[] {
    return this.events.filter((event) => event.managerUserId === managerUserId);
  }
}
