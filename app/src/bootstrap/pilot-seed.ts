import type { DatabaseSync } from 'node:sqlite';
import { createDiagnosticSessionApi } from '../api/diagnostic-session-api.ts';
import { createGrowthPathApi } from '../api/growth-path-api.ts';
import { createPracticeAssignmentApi } from '../api/practice-assignment-api.ts';
import { createPracticeFeedbackApi } from '../api/practice-feedback-api.ts';
import { createProgressProofApi } from '../api/progress-proof-api.ts';
import { createManagerDashboardApi } from '../api/manager-dashboard-api.ts';
import { AntiSignalService } from '../domain/anti-signal-service.ts';
import { InMemoryAntiSignalEventStore } from '../domain/anti-events.ts';
import { InMemoryDiagnosticEventStore } from '../domain/events.ts';
import { InMemoryManagerEventStore } from '../domain/manager-events.ts';
import { InMemoryPracticeEventStore } from '../domain/practice-events.ts';
import {
  SqliteAntiSignalRepository,
  SqliteDiagnosticSessionRepository,
  SqliteGrowthPathRepository,
  SqlitePracticeTaskRepository,
  SqliteTaskAttemptRepository,
  SqliteWorkspaceService
} from '../db/repositories.ts';

export const PILOT_ORGANIZATION_ID = 'demo-org-1';
export const PILOT_MANAGER_USER_ID = 'demo-manager-1';
export const PILOT_LEARNER_USER_IDS = ['demo-learner-1', 'demo-learner-2'] as const;

export interface PilotDemoUserProfile {
  userId: string;
  role: 'manager' | 'learner';
  displayName: string;
  title: string;
  email: string;
}

export const PILOT_DEMO_ORGANIZATION_PROFILE = {
  organizationId: PILOT_ORGANIZATION_ID,
  displayName: 'Northwind Industrial Pilot',
  segment: 'Industrial SaaS'
} as const;

export const PILOT_DEMO_USER_PROFILES: readonly PilotDemoUserProfile[] = [
  {
    userId: PILOT_MANAGER_USER_ID,
    role: 'manager',
    displayName: 'Marta Stone',
    title: 'Sales Manager',
    email: 'marta.stone@northwind.demo'
  },
  {
    userId: PILOT_LEARNER_USER_IDS[0],
    role: 'learner',
    displayName: 'Liam Brooks',
    title: 'Account Executive',
    email: 'liam.brooks@northwind.demo'
  },
  {
    userId: PILOT_LEARNER_USER_IDS[1],
    role: 'learner',
    displayName: 'Nora Kim',
    title: 'Account Executive',
    email: 'nora.kim@northwind.demo'
  }
] as const;

export interface PilotSeedSummary {
  organizationId: string;
  organizationDisplayName: string;
  managerUserId: string;
  managerDisplayName: string;
  learnerUserIds: string[];
  learnerDisplayNames: string[];
  completedSessions: number;
  practiceAttempts: number;
  seededTaskCount: number;
}

const learnerAnswers: Array<Record<string, string>> = [
  {
    discovery_confidence: '2',
    listening_confidence: '3',
    value_confidence: '2',
    objection_confidence: '2',
    followup_confidence: '2'
  },
  {
    discovery_confidence: '3',
    listening_confidence: '2',
    value_confidence: '2',
    objection_confidence: '1',
    followup_confidence: '2'
  }
];

export const seedPilotData = (database: DatabaseSync): PilotSeedSummary => {
  const workspace = new SqliteWorkspaceService(database);
  const sessions = new SqliteDiagnosticSessionRepository(database);
  const growthPaths = new SqliteGrowthPathRepository(database);
  const tasks = new SqlitePracticeTaskRepository(database);
  const attempts = new SqliteTaskAttemptRepository(database, tasks);
  const antiSignals = new SqliteAntiSignalRepository(database);

  const diagnosticEvents = new InMemoryDiagnosticEventStore();
  const practiceEvents = new InMemoryPracticeEventStore();
  const antiEvents = new InMemoryAntiSignalEventStore();
  const managerEvents = new InMemoryManagerEventStore();

  const diagnosticApi = createDiagnosticSessionApi(sessions, diagnosticEvents);
  const growthPathApi = createGrowthPathApi(sessions, growthPaths);
  const feedbackApi = createPracticeFeedbackApi(tasks, attempts, practiceEvents);
  const assignmentApi = createPracticeAssignmentApi(growthPathApi, tasks, feedbackApi);
  const progressApi = createProgressProofApi(sessions, growthPaths, attempts);
  const antiService = new AntiSignalService(antiSignals, antiEvents);
  const managerDashboardApi = createManagerDashboardApi(workspace, sessions, antiSignals, managerEvents);

  const createdAt = new Date().toISOString();
  database
    .prepare('INSERT INTO organizations (id, name, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING')
    .run(
      PILOT_DEMO_ORGANIZATION_PROFILE.organizationId,
      PILOT_DEMO_ORGANIZATION_PROFILE.displayName,
      createdAt
    );
  database
    .prepare(
      `INSERT INTO demo_organizations (organization_id, display_name, segment, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(organization_id) DO UPDATE SET
         display_name = excluded.display_name,
         segment = excluded.segment`
    )
    .run(
      PILOT_DEMO_ORGANIZATION_PROFILE.organizationId,
      PILOT_DEMO_ORGANIZATION_PROFILE.displayName,
      PILOT_DEMO_ORGANIZATION_PROFILE.segment,
      createdAt
    );

  PILOT_DEMO_USER_PROFILES.forEach((profile) => {
    database
      .prepare(
        `INSERT INTO demo_users (user_id, organization_id, role, display_name, title, email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           role = excluded.role,
           display_name = excluded.display_name,
           title = excluded.title,
           email = excluded.email`
      )
      .run(
        profile.userId,
        PILOT_DEMO_ORGANIZATION_PROFILE.organizationId,
        profile.role,
        profile.displayName,
        profile.title,
        profile.email,
        createdAt
      );
  });

  workspace.assignMembership(PILOT_MANAGER_USER_ID, PILOT_ORGANIZATION_ID, 'manager');
  PILOT_LEARNER_USER_IDS.forEach((learnerId) => {
    workspace.assignMembership(learnerId, PILOT_ORGANIZATION_ID, 'learner');
  });

  PILOT_LEARNER_USER_IDS.forEach((learnerId, index) => {
    const userSessions = sessions
      .listByUserId(learnerId)
      .filter((session) => session.status === 'completed' && Boolean(session.scoringResult));

    if (userSessions.length === 0) {
      const started = diagnosticApi.start({
        userId: learnerId,
        organizationId: PILOT_ORGANIZATION_ID
      });

      const completed = diagnosticApi.complete({
        sessionId: started.sessionId,
        rawAnswers: learnerAnswers[index] ?? learnerAnswers[0]
      });

      antiService.createConfidenceGap(learnerId, started.sessionId, 5, completed.skillSnapshot);
    }

    growthPathApi.generateForUser(learnerId);

    const userAttempts = attempts.listByUserId(learnerId);
    if (userAttempts.length === 0) {
      const task = assignmentApi.assignForUser(learnerId);
      assignmentApi.submitPracticeResponse(
        learnerId,
        task.taskId,
        'Demo response: summarize need, map value, confirm a concrete next step.'
      );
    }

    progressApi.getByUserId(learnerId);
  });

  managerDashboardApi.getDashboard(PILOT_ORGANIZATION_ID, PILOT_MANAGER_USER_ID);

  const completedSessions = PILOT_LEARNER_USER_IDS.reduce(
    (total, learnerId) =>
      total +
      sessions
        .listByUserId(learnerId)
        .filter((session) => session.status === 'completed' && Boolean(session.scoringResult)).length,
    0
  );

  const practiceAttempts = PILOT_LEARNER_USER_IDS.reduce(
    (total, learnerId) => total + attempts.listByUserId(learnerId).length,
    0
  );

  return {
    organizationId: PILOT_ORGANIZATION_ID,
    organizationDisplayName: PILOT_DEMO_ORGANIZATION_PROFILE.displayName,
    managerUserId: PILOT_MANAGER_USER_ID,
    managerDisplayName:
      PILOT_DEMO_USER_PROFILES.find((profile) => profile.userId === PILOT_MANAGER_USER_ID)
        ?.displayName ?? PILOT_MANAGER_USER_ID,
    learnerUserIds: [...PILOT_LEARNER_USER_IDS],
    learnerDisplayNames: PILOT_DEMO_USER_PROFILES.filter((profile) => profile.role === 'learner').map(
      (profile) => profile.displayName
    ),
    completedSessions,
    practiceAttempts,
    seededTaskCount: tasks.list().length
  };
};
