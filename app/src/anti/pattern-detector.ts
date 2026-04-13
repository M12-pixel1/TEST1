import type { SignalEvent, DetectedPattern } from './types.ts';

const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const clampStrength = (value: number): number => Math.min(Math.max(value, 0), 1);

export class PatternDetector {
  detectAll(events: SignalEvent[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    const confidenceGap = this.detectConfidenceGap(events);
    if (confidenceGap) patterns.push(confidenceGap);

    const repeatErrors = this.detectRepeatErrors(events);
    patterns.push(...repeatErrors);

    const frictionPoints = this.detectFrictionPoints(events);
    patterns.push(...frictionPoints);

    const falseProgress = this.detectFalseProgress(events);
    if (falseProgress) patterns.push(falseProgress);

    const scriptDep = this.detectScriptDependency(events);
    if (scriptDep) patterns.push(scriptDep);

    const dropRisk = this.detectDropRisk(events);
    if (dropRisk) patterns.push(dropRisk);

    const systemFault = this.detectSystemFault(events);
    if (systemFault) patterns.push(systemFault);

    return patterns;
  }

  detectConfidenceGap(events: SignalEvent[]): DetectedPattern | null {
    const ratings = events.filter((e) => e.eventType === 'self_rate');
    const performances = events.filter((e) => e.eventType === 'task_result');

    if (ratings.length < 3 || performances.length < 3) return null;

    const avgSelfRating = mean(ratings.map((r) => Number(r.rawData.rating ?? 0)));
    const avgPerformance = mean(performances.map((p) => Number(p.rawData.score ?? 0)));
    const gap = Math.abs(avgSelfRating - avgPerformance);

    if (gap <= 0.3) return null;

    return {
      type: 'confidence_gap',
      strength: clampStrength(gap),
      severity: gap > 0.5 ? 'critical' : 'warning',
      confidence: clampStrength(ratings.length / 10),
      relatedSessionId: null,
      relatedTaskId: null
    };
  }

  detectRepeatErrors(events: SignalEvent[]): DetectedPattern[] {
    const feedbackEvents = events.filter((e) => e.eventType === 'feedback_viewed');
    const errorEvents = events.filter((e) => e.eventType === 'task_error');

    if (errorEvents.length < 3) return [];

    const errorCountByType = new Map<string, { count: number; taskId: string | null }>();
    for (const event of errorEvents) {
      const errorType = String(event.rawData.error_type ?? 'unknown');
      const existing = errorCountByType.get(errorType);
      if (existing) {
        existing.count++;
      } else {
        errorCountByType.set(errorType, { count: 1, taskId: event.taskId });
      }
    }

    const patterns: DetectedPattern[] = [];
    for (const [, data] of errorCountByType) {
      if (data.count >= 3 && feedbackEvents.length > 0) {
        patterns.push({
          type: 'repeat_error',
          strength: clampStrength(data.count / 10),
          severity: data.count >= 5 ? 'critical' : 'warning',
          confidence: clampStrength(data.count / 8),
          relatedSessionId: null,
          relatedTaskId: data.taskId
        });
      }
    }

    return patterns;
  }

  detectFrictionPoints(events: SignalEvent[]): DetectedPattern[] {
    const frictionEvents = events.filter(
      (e) => e.eventType === 'abandon' || e.eventType === 'retry'
    );

    if (frictionEvents.length < 3) return [];

    const countByTarget = new Map<string, { count: number; taskId: string | null }>();
    for (const event of frictionEvents) {
      const target = event.taskId ?? String(event.rawData.step_id ?? 'unknown');
      const existing = countByTarget.get(target);
      if (existing) {
        existing.count++;
      } else {
        countByTarget.set(target, { count: 1, taskId: event.taskId });
      }
    }

    const patterns: DetectedPattern[] = [];
    for (const [, data] of countByTarget) {
      if (data.count >= 3) {
        patterns.push({
          type: 'friction_point',
          strength: clampStrength(data.count / 8),
          severity: data.count >= 5 ? 'critical' : 'warning',
          confidence: clampStrength(data.count / 6),
          relatedSessionId: null,
          relatedTaskId: data.taskId
        });
      }
    }

    return patterns;
  }

  detectFalseProgress(events: SignalEvent[]): DetectedPattern | null {
    const results = events.filter((e) => e.eventType === 'task_result');

    if (results.length < 5) return null;

    const sorted = [...results].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    const firstQuality = mean(firstHalf.map((e) => Number(e.rawData.quality ?? e.rawData.score ?? 0)));
    const secondQuality = mean(secondHalf.map((e) => Number(e.rawData.quality ?? e.rawData.score ?? 0)));

    const completionGrows = secondHalf.length > firstHalf.length;
    const qualityStalls = secondQuality <= firstQuality * 1.05;

    if (completionGrows && qualityStalls) {
      const delta = firstQuality - secondQuality;
      return {
        type: 'false_progress',
        strength: clampStrength(Math.max(0.3, Math.abs(delta))),
        severity: delta > 0.1 ? 'critical' : 'warning',
        confidence: clampStrength(results.length / 15),
        relatedSessionId: null,
        relatedTaskId: null
      };
    }

    return null;
  }

  detectScriptDependency(events: SignalEvent[]): DetectedPattern | null {
    const responses = events.filter((e) => e.eventType === 'task_result');
    if (responses.length < 5) return null;

    const templated = responses.filter((e) => e.rawData.used_template === true);
    const ratio = templated.length / responses.length;

    if (ratio <= 0.8) return null;

    return {
      type: 'script_dependency',
      strength: clampStrength(ratio),
      severity: ratio > 0.9 ? 'critical' : 'warning',
      confidence: clampStrength(responses.length / 15),
      relatedSessionId: null,
      relatedTaskId: null
    };
  }

  detectDropRisk(events: SignalEvent[]): DetectedPattern | null {
    if (events.length === 0) return null;

    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;

    const lastEvent = events.reduce((latest, e) => {
      const t = new Date(e.createdAt).getTime();
      return t > latest ? t : latest;
    }, 0);

    const daysSinceLastActivity = (now - lastEvent) / (24 * 60 * 60 * 1000);

    if (daysSinceLastActivity < 5) return null;

    const thisWeek = events.filter(
      (e) => now - new Date(e.createdAt).getTime() < oneWeekMs
    ).length;

    const lastWeek = events.filter((e) => {
      const age = now - new Date(e.createdAt).getTime();
      return age >= oneWeekMs && age < twoWeeksMs;
    }).length;

    const declining = thisWeek < lastWeek;

    if (declining || daysSinceLastActivity >= 5) {
      return {
        type: 'drop_risk',
        strength: clampStrength(daysSinceLastActivity / 14),
        severity: 'critical',
        confidence: clampStrength(Math.min(daysSinceLastActivity / 7, 1)),
        relatedSessionId: null,
        relatedTaskId: null
      };
    }

    return null;
  }

  detectSystemFault(events: SignalEvent[]): DetectedPattern | null {
    const errorEvents = events.filter((e) => e.eventType === 'system_error' || e.eventType === 'abandon');

    if (errorEvents.length < 3) return null;

    const countByTarget = new Map<string, number>();
    const totalUsers = new Set(events.map((e) => e.userId)).size;

    for (const event of errorEvents) {
      const target = event.taskId ?? String(event.rawData.step_id ?? 'unknown');
      countByTarget.set(target, (countByTarget.get(target) ?? 0) + 1);
    }

    for (const [, count] of countByTarget) {
      const affectedRatio = count / Math.max(totalUsers, 1);
      if (affectedRatio > 0.3) {
        return {
          type: 'system_fault',
          strength: clampStrength(affectedRatio),
          severity: 'critical',
          confidence: clampStrength(count / 10),
          relatedSessionId: null,
          relatedTaskId: null
        };
      }
    }

    return null;
  }
}
