export type SignalType =
  | 'confidence_gap'
  | 'repeat_error'
  | 'friction_point'
  | 'false_progress'
  | 'script_dependency'
  | 'drop_risk'
  | 'system_fault';

export const SIGNAL_TYPES: readonly SignalType[] = [
  'confidence_gap',
  'repeat_error',
  'friction_point',
  'false_progress',
  'script_dependency',
  'drop_risk',
  'system_fault'
] as const;

export type SignalSeverity = 'norm' | 'warning' | 'critical';

export interface SignalEvent {
  id: string;
  userId: string;
  sessionId: string | null;
  taskId: string | null;
  eventType: string;
  rawData: Record<string, unknown>;
  createdAt: string;
}

export interface DetectedPattern {
  type: SignalType;
  strength: number;
  severity: SignalSeverity;
  confidence: number;
  relatedSessionId: string | null;
  relatedTaskId: string | null;
}

export interface AntiSignalRecord {
  id: string;
  userId: string;
  signalType: SignalType;
  strength: number;
  severity: SignalSeverity;
  confidence: number;
  relatedSessionId: string | null;
  relatedTaskId: string | null;
  recommendedAction: string;
  detectedAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
}

export interface CorrectionAction {
  action: string;
  description: string;
  severityThreshold: SignalSeverity;
}

export const VisibilityLayer = {
  PUBLIC: 'public',
  SEMI_PUBLIC: 'semi_public',
  INTERNAL: 'internal'
} as const;

export type VisibilityLayer = (typeof VisibilityLayer)[keyof typeof VisibilityLayer];

export interface InterpretedSignal {
  type: SignalType;
  humanMessage: string;
  severity: SignalSeverity;
  strength: number;
  correction: CorrectionAction;
  visibility: VisibilityLayer;
}

export interface SuccessSignal {
  completion: number;
  quality: number;
  speed: number;
  demonstratedSkills: string[];
}

export interface AntiSignalData {
  errors: Array<{ type: string; count: number }>;
  frictionPoints: string[];
  confidenceDelta: number;
  abandonmentCount: number;
}
