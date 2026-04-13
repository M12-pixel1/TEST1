import { VisibilityLayer, type SignalType, type InterpretedSignal, type DetectedPattern } from './types.ts';
import { interpretSignal } from './interpreter.ts';
import { getCorrectionForPattern } from './corrector.ts';

export const SIGNAL_VISIBILITY: Record<SignalType, VisibilityLayer> = {
  confidence_gap: VisibilityLayer.PUBLIC,
  repeat_error: VisibilityLayer.PUBLIC,
  friction_point: VisibilityLayer.SEMI_PUBLIC,
  false_progress: VisibilityLayer.SEMI_PUBLIC,
  script_dependency: VisibilityLayer.INTERNAL,
  drop_risk: VisibilityLayer.SEMI_PUBLIC,
  system_fault: VisibilityLayer.INTERNAL
};

export const toInterpretedSignal = (pattern: DetectedPattern): InterpretedSignal => ({
  type: pattern.type,
  humanMessage: interpretSignal(pattern),
  severity: pattern.severity,
  strength: pattern.strength,
  correction: getCorrectionForPattern(pattern),
  visibility: SIGNAL_VISIBILITY[pattern.type]
});

export const filterForUser = (signals: InterpretedSignal[]): InterpretedSignal[] =>
  signals.filter((s) => s.visibility === VisibilityLayer.PUBLIC);

export const filterForManager = (signals: InterpretedSignal[]): InterpretedSignal[] =>
  signals.filter(
    (s) => s.visibility === VisibilityLayer.PUBLIC || s.visibility === VisibilityLayer.SEMI_PUBLIC
  );

export const filterForProductTeam = (signals: InterpretedSignal[]): InterpretedSignal[] =>
  signals;
