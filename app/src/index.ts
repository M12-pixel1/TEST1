export {
  createPracticeAssignmentApi,
  type AssignedPracticeTask,
  type PracticeAssignmentApi,
  type PracticeSubmissionResult
} from './api/practice-assignment-api.ts';
export {
  createProgressProofApi,
  type ProgressProofApi,
  type ProgressProofView
} from './api/progress-proof-api.ts';
export { createGrowthPathApi, type GrowthPathApi } from './api/growth-path-api.ts';
export {
  createManagerDashboardApi,
  type ManagerCoachingPriority,
  type ManagerDashboardApi,
  type ManagerDashboardView,
  type ManagerSkillHeatmapItem,
  type ManagerTeamMemberView
} from './api/manager-dashboard-api.ts';
export { createPracticeFeedbackApi, type PracticeFeedbackApi } from './api/practice-feedback-api.ts';
export {
  createSkillSnapshotReadApi,
  type PublicSkillSnapshot,
  type SkillBlockSnapshot,
  type SkillSnapshotReadApi
} from './api/skill-snapshot-api.ts';
export { createDiagnosticSessionApi, type DiagnosticSessionApi } from './api/diagnostic-session-api.ts';
export {
  mountDiagnosticScreen,
  type ButtonElement,
  type DiagnosticScreenElements,
  type InputElement,
  type MountedDiagnosticScreen,
  type TextElement
} from './ui/browser-diagnostic-screen.ts';
export {
  renderAssignedTask,
  renderPracticeFeedback,
  type PracticeFlowElements
} from './ui/practice-flow-screen.ts';
export {
  renderProgressProof,
  type ProgressProofElements
} from './ui/progress-proof-screen.ts';
export {
  renderManagerDashboard,
  type ManagerDashboardElements
} from './ui/manager-dashboard-screen.ts';
export {
  renderNextStep,
  type NextStepElements
} from './ui/next-step-screen.ts';
export {
  renderSkillSnapshot,
  type SkillSnapshotElements
} from './ui/skill-snapshot-screen.ts';
export {
  createDiagnosticFlowController,
  DiagnosticFlowController,
  type DiagnosticContext,
  type DiagnosticFlowState,
  type DiagnosticQuestion,
  type DiagnosticUiPhase
} from './ui/diagnostic-flow.ts';
export {
  buildGrowthPathFromScoring,
  type GrowthPathPlanDraft
} from './domain/growth-path-engine.ts';
export {
  InMemoryGrowthPathRepository,
  type GrowthPath
} from './domain/growth-path.ts';
export {
  computeConfidenceGapSignal,
  computeFrictionPointSignal,
  computeRepeatErrorSignal,
  InMemoryAntiSignalRepository,
  type AntiSignal,
  type AntiSignalSeverity,
  type AntiSignalType,
  type FlowStageSample
} from './domain/anti-signal.ts';
export {
  InMemoryAntiSignalEventStore,
  type AntiSignalEvent,
  type AntiSignalEventType
} from './domain/anti-events.ts';
export { AntiSignalService } from './domain/anti-signal-service.ts';
export {
  InMemoryManagerEventStore,
  type ManagerEvent,
  type ManagerEventType
} from './domain/manager-events.ts';
export {
  computeV1SkillScores,
  type V1SkillBlock,
  type V1SkillScoreResult,
  V1_SKILL_BLOCKS
} from './domain/scoring-engine.ts';
export {
  generateAttemptFeedback,
  type AttemptFeedback
} from './domain/practice-feedback.ts';
export {
  InMemoryPracticeEventStore,
  type PracticeEvent,
  type PracticeEventType
} from './domain/practice-events.ts';
export {
  InMemoryPracticeTaskRepository,
  PRACTICE_TASK_TYPES,
  type PracticeTask,
  type PracticeTaskType
} from './domain/practice-task.ts';
export {
  InMemoryTaskAttemptRepository,
  type TaskAttempt,
  type TaskAttemptFeedbackPlaceholder,
  type TaskAttemptScorePlaceholder
} from './domain/task-attempt.ts';
export {
  buildSkillSnapshotPlaceholder,
  type DiagnosticSession,
  type RawAnswers,
  InMemoryDiagnosticSessionRepository
} from './domain/diagnostic-session.ts';
export { InMemoryDiagnosticEventStore, type DiagnosticEvent } from './domain/events.ts';
export { InMemoryAuthService, hashPassword, verifyPassword, type Session, type User } from './domain/auth.ts';
export {
  InMemoryWorkspaceService,
  type WorkspaceService,
  type OrganizationMembership
} from './domain/workspace.ts';
export { isRole, type Role, V1_ROLES } from './domain/roles.ts';
export {
  createConfiguredV1Db,
  createV1Db,
  runV1Migrations,
  type V1Db
} from './db/v1-db.ts';
export {
  DEFAULT_DB_PATH,
  resolveDbRuntimeConfig,
  type DbRuntimeConfig,
  type EnvReader
} from './config/db-config.ts';
export {
  SqliteAntiSignalRepository,
  SqliteDiagnosticSessionRepository,
  SqliteGrowthPathRepository,
  SqlitePracticeTaskRepository,
  SqliteTaskAttemptRepository,
  SqliteWorkspaceService
} from './db/repositories.ts';
export {
  bootstrapPilotEnvironment,
  type PilotBootstrapResult
} from './bootstrap/pilot-init.ts';
export { AntiEngine, type AntiEngineResult } from './anti/anti-engine.ts';
export { SignalCollector } from './anti/signal-collector.ts';
export { PatternDetector } from './anti/pattern-detector.ts';
export { SignalScorer } from './anti/signal-scorer.ts';
export { interpretSignal, interpretAllSignals } from './anti/interpreter.ts';
export { CORRECTION_MAP, getCorrectionForPattern, shouldTriggerCorrection } from './anti/corrector.ts';
export {
  SIGNAL_VISIBILITY,
  toInterpretedSignal,
  filterForUser,
  filterForManager,
  filterForProductTeam
} from './anti/visibility.ts';
export {
  VisibilityLayer,
  SIGNAL_TYPES,
  type SignalType,
  type SignalSeverity,
  type SignalEvent,
  type DetectedPattern,
  type AntiSignalRecord,
  type CorrectionAction,
  type InterpretedSignal,
  type SuccessSignal,
  type AntiSignalData
} from './anti/types.ts';
export {
  PILOT_DEMO_ORGANIZATION_PROFILE,
  PILOT_DEMO_USER_PROFILES,
  PILOT_LEARNER_USER_IDS,
  PILOT_MANAGER_USER_ID,
  PILOT_ORGANIZATION_ID,
  type PilotDemoUserProfile,
  seedPilotData,
  type PilotSeedSummary
} from './bootstrap/pilot-seed.ts';
