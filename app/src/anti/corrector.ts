import type { SignalType, CorrectionAction, DetectedPattern } from './types.ts';

export const CORRECTION_MAP: Record<SignalType, CorrectionAction> = {
  confidence_gap: {
    action: 'CALIBRATION_TASK',
    description: 'Duoti kalibravimo uzduoti, kuri parodo objektyvu skirtuma',
    severityThreshold: 'warning'
  },
  repeat_error: {
    action: 'TARGETED_CORRECTION',
    description: 'Vienos klaidos taisymo uzduotis, ne platus turinys',
    severityThreshold: 'warning'
  },
  friction_point: {
    action: 'REDUCE_STEP',
    description: 'Sumazinti zingsni arba pakeisti formata',
    severityThreshold: 'warning'
  },
  false_progress: {
    action: 'QUALITY_GATE',
    description: 'Mazinti kieki, kelti kokybes slenksci',
    severityThreshold: 'warning'
  },
  script_dependency: {
    action: 'SITUATIONAL_TASK',
    description: 'Duoti situacine uzduoti, kuri neleidzia naudoti sablono',
    severityThreshold: 'warning'
  },
  drop_risk: {
    action: 'RE_ENTRY_PATH',
    description: 'Trumpas grizimo kelias, vienas mazas veiksmas',
    severityThreshold: 'critical'
  },
  system_fault: {
    action: 'FLAG_TO_PRODUCT_TEAM',
    description: 'Sistema kalta, ne vartotojas. Pazymeti produkto komandai.',
    severityThreshold: 'critical'
  }
};

export const getCorrectionForPattern = (pattern: DetectedPattern): CorrectionAction => {
  return CORRECTION_MAP[pattern.type];
};

export const shouldTriggerCorrection = (pattern: DetectedPattern): boolean => {
  const correction = CORRECTION_MAP[pattern.type];
  const severityOrder: Record<string, number> = { norm: 0, warning: 1, critical: 2 };
  const patternLevel = severityOrder[pattern.severity] ?? 0;
  const thresholdLevel = severityOrder[correction.severityThreshold] ?? 0;
  return patternLevel >= thresholdLevel;
};
