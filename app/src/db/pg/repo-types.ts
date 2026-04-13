import type { SignalType } from '../../anti/types.ts';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: string;
}

export interface SignalEventInput {
  userId: string;
  sessionId?: string | null;
  taskId?: string | null;
  eventType: string;
  rawData: Record<string, unknown>;
}

export interface SignalEventRow {
  id: string;
  userId: string;
  sessionId: string | null;
  taskId: string | null;
  eventType: string;
  rawData: Record<string, unknown>;
  createdAt: string;
}

export interface AntiSignalInput {
  userId: string;
  signalType: SignalType;
  strength: number;
  severity: string;
  confidence: number;
  relatedTaskId: string | null;
  recommendedAction: string;
}

export interface AntiSignalRow {
  id: string;
  userId: string;
  signalType: string;
  strength: number;
  severity: string;
  confidence: number;
  relatedTaskId: string | null;
  recommendedAction: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export interface TaskResultInput {
  userId: string;
  taskId: string;
  score: number;
  errorType?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskResultRow {
  id: string;
  userId: string;
  taskId: string;
  score: number;
  errorType: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SystemFaultSignal {
  taskId: string;
  affectedUsers: number;
  stuckRatio: number;
  totalAttempts: number;
  severity: string;
  recommendedAction: string;
  detectedAt: Date;
}

export interface Repository {
  createUser(data: CreateUserInput): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  recordSignalEvent(event: SignalEventInput): Promise<SignalEventRow>;
  getRecentSignalEvents(userId: string, days: number): Promise<SignalEventRow[]>;
  getAllSignalEventsInWindow(days: number): Promise<SignalEventRow[]>;
  saveAntiSignal(signal: AntiSignalInput): Promise<AntiSignalRow>;
  getActiveAntiSignals(userId: string): Promise<AntiSignalRow[]>;
  getAllActiveAntiSignals(): Promise<AntiSignalRow[]>;
  getActiveUsersCount(days: number): Promise<number>;
  close(): Promise<void>;
}
