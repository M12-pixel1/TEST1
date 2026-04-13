import type { SignalType, DetectedPattern } from './types.ts';

const HUMAN_MESSAGES: Record<SignalType, string> = {
  confidence_gap: 'Tu jautiesi tikras, bet duomenys rodo, kad reikia daugiau praktikos',
  repeat_error: 'Ta pati klaida kartojasi — tai nera atsitiktinumas',
  friction_point: 'Tu vis sustoji toje pacioje vietoje — keiciame priejima',
  false_progress: 'Daug veikiama, bet realus augimas mazesnis nei atrodo',
  script_dependency: 'Naudojami sablonai, bet ne savas supratimas',
  drop_risk: 'Tavo tempas leteja — laikas trumpam grizimui',
  system_fault: 'Tai nera tavo problema — mes taisom sistema'
};

export const interpretSignal = (pattern: DetectedPattern): string => {
  return HUMAN_MESSAGES[pattern.type];
};

export const interpretAllSignals = (
  patterns: DetectedPattern[]
): Array<{ type: SignalType; message: string; severity: string }> => {
  return patterns.map((p) => ({
    type: p.type,
    message: HUMAN_MESSAGES[p.type],
    severity: p.severity
  }));
};
