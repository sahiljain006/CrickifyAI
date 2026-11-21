export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive';
export type CricketRole = 'Batter' | 'Fast Bowler' | 'Spin Bowler' | 'All-Rounder' | 'Wicketkeeper';
export type Handedness = 'Right-handed' | 'Left-handed';
export type BowlingStyle = 'Fast' | 'Medium Pace' | 'Off-Spin' | 'Leg-Spin' | 'None';
export type BallType = 'Leather Ball' | 'Tennis Ball' | 'Both';
export type EnvironmentType = 'Regular Cricket' | 'Turf / Box Cricket' | 'Both';
export type LanguageChoice = 'English' | 'Tamil' | 'Hindi';

export type NavSectionId =
  | 'home-landing'
  | 'dashboard'
  | 'journey'
  | 'daily-tips'
  | 'academy-beginner'
  | 'academy-intermediate'
  | 'academy-advanced'
  | 'academy-masterclass'
  | 'academy-batting'
  | 'academy-bowling'
  | 'academy-fielding'
  | 'academy-wicketkeeping'
  | 'academy-rules'
  | 'coach-chat'
  | 'coach-voice'
  | 'coach-no-video'
  | 'coach-history'
  | 'practice-camera'
  | 'practice-upload'
  | 'analysis-batting'
  | 'analysis-bowling'
  | 'analysis-fielding'
  | 'correction-studio'
  | 'why-got-out'
  | 'exercises-batting'
  | 'exercises-bowling'
  | 'exercises-fielding'
  | 'fitness-hub'
  | 'fitness-strength'
  | 'fitness-stamina'
  | 'fitness-speed'
  | 'fitness-mobility'
  | 'fitness-recovery'
  | 'training-planner'
  | 'turf-academy'
  | 'turf-batting'
  | 'turf-bowling'
  | 'turf-fielding'
  | 'turf-practice'
  | 'turf-strategy'
  | 'turf-rules'
  | 'match-scorecard'
  | 'match-stats'
  | 'match-team'
  | 'match-opponent'
  | 'match-tactics'
  | 'dev-progress'
  | 'dev-history'
  | 'dev-videos'
  | 'dev-reports'
  | 'dev-quiz'
  | 'dev-challenges'
  | 'dev-achievements'
  | 'dev-profile'
  | 'coach-academy-mode'
  | 'playzone-batting';

export interface PlayerProfile {
  name: string;
  avatarUrl?: string;
  ageGroup: 'Under-14' | '14-18' | '19-25' | '26-35' | '35+';
  experience: string;
  skillLevel: SkillLevel;
  role: CricketRole;
  battingHand: Handedness;
  bowlingStyle: BowlingStyle;
  ballType: BallType;
  environment: EnvironmentType;
  goals: string[];
  dailyMinutes: number;
  trainingDaysPerWeek: number;
  language: LanguageChoice;
  equipment: string[];
  onboardingCompleted: boolean;
}

export interface LessonQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CricketLesson {
  id: string;
  title: string;
  category: 'Batting' | 'Bowling' | 'Fielding' | 'Wicketkeeping' | 'Rules' | 'Masterclass';
  tier: 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional Masterclass';
  level: SkillLevel;
  durationMinutes: number;
  objectives: string[];
  whyItMatters: string;
  equipment: string[];
  detailedExplanation: string;
  bodyPositioning: string[];
  steps: string[];
  diagramType: 'grip' | 'stance' | 'drive' | 'pull' | 'bowling-action' | 'yorker' | 'spin' | 'catching' | 'fielding' | 'pitch' | 'wicketkeeping';
  commonMistakes: string[];
  corrections: string[];
  proTips: string[];
  drills: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  tutorialId: string;
  quiz: LessonQuizQuestion[];
  practicalChecklist: string[];
  nextLessonId: string;
}

export interface CricketTip {
  id: string;
  title: string;
  category: 'Batting' | 'Bowling' | 'Fielding' | 'Wicketkeeping' | 'Fitness' | 'Match Tactics' | 'Mental Preparation' | 'Turf Cricket';
  level: SkillLevel;
  problem: string;
  whyItHappens: string;
  correctTechnique: string;
  steps: string[];
  commonMistakes: string[];
  practicalDrill: string;
  coachingAdvice: string;
  relatedLessonId: string;
  relatedExerciseId?: string;
}

export interface YouTubeTutorial {
  id: string;
  videoId: string;
  title: string;
  channel: string;
  category: 'Batting' | 'Bowling' | 'Fielding' | 'Fitness';
  level: SkillLevel;
  duration: string;
  summary: string;
  tags: string[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  category: 'Batting' | 'Bowling' | 'Fielding' | 'Strength' | 'Stamina' | 'Speed & Agility' | 'Mobility & Flexibility' | 'Core Stability' | 'Recovery';
  subCategory: string;
  whatIsIt: string;
  whyDoIt: string;
  skillImproved: string;
  musclesOrQualities: string[];
  equipment: string[];
  startingPosition: string;
  steps: string[];
  correctPosture: string;
  sets: string;
  repsOrDuration: string;
  restTime: string;
  weeklyFrequency: string;
  difficulty: SkillLevel;
  versions: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  commonMistakes: string[];
  corrections: string[];
  easierVariation: string;
  harderVariation: string;
  relatedTutorialId: string;
  safetyNote?: string;
}

export interface PoseFrameTelemetry {
  frameIndex: number;
  timestampSec: number;
  imageDataUrl: string;
  annotatedDataUrl: string;
  poseDetected: boolean;
  avgVisibility: number;
  metrics: {
    headTiltDeg: number | null;
    shoulderTiltDeg: number | null;
    frontKneeAngleDeg: number | null;
    leadElbowAngleDeg: number | null;
    stanceWidthRatio: number | null;
    centerOfMassOffset: number | null;
  };
}

export interface PoseAggregateSummary {
  framesAnalyzed: number;
  framesWithPose: number;
  avgVisibility: number;
  headStabilityDeltaDeg: number | null;
  avgFrontKneeAngleDeg: number | null;
  avgShoulderTiltDeg: number | null;
  avgLeadElbowAngleDeg: number | null;
  balanceSymmetryNote: string;
}

export interface AnalysisObservation {
  title: string;
  timestampSec: number;
  frameIndex: number;
  confidence: 'High' | 'Medium' | 'Low';
  evidence: string;
  whyItMatters: string;
  correctionSteps: string[];
}

export interface VideoAnalysisReport {
  id: string;
  createdAt: string;
  title: string;
  skillCategory: 'Batting' | 'Bowling' | 'Fielding';
  technique: string;
  skillLevel: SkillLevel;
  handedness: Handedness;
  cameraAngle: string;
  playerNotes: string;
  insufficientEvidence: boolean;
  summary: string;
  cameraAngleNotes?: string;
  observedStrengths: string[];
  areasToImprove: string[];
  observations: AnalysisObservation[];
  recommendedExerciseIds: string[];
  recommendedTutorialIds: string[];
  personalImprovementPlan: string[];
  limitationsNotice: string;
  frames: PoseFrameTelemetry[];
  poseSummary: PoseAggregateSummary;
  coachFeedback?: string;
}

export interface TrainingSessionBlock {
  order: number;
  title: string;
  durationMinutes: number;
  focus: string;
  exerciseId?: string;
  instructions: string;
}

export interface WeeklyPlanDay {
  day: string;
  theme: string;
  durationMinutes: number;
  isRecovery: boolean;
  blocks: TrainingSessionBlock[];
}

export interface TrainingPlan {
  id: string;
  createdAt: string;
  goal: string;
  dailyMinutes: number;
  daysPerWeek: number;
  workloadNote: string;
  dailyRoutine: TrainingSessionBlock[];
  weeklySchedule: WeeklyPlanDay[];
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: LanguageChoice;
  linkedReportId?: string;
  recommendedExerciseIds?: string[];
  recommendedLessonIds?: string[];
  recommendedTutorialIds?: string[];
  saved?: boolean;
}

export interface TurfRulesConfig {
  playersPerSide: number;
  pitchLengthYards: number;
  oversPerInnings: number;
  ballType: 'Hard Tennis' | 'Soft Tennis' | 'Synthetic Turf Ball';
  boundaryShape: string;
  sideWallRule: '1 Run' | '2 Runs' | 'Dead Ball' | 'Out on Direct Catch';
  backNetRule: '4 Runs' | '6 Runs' | '2 Runs' | 'Out';
  roofNetRule: 'Dead Ball' | 'Out' | '1 Run';
  widePenaltyRuns: number;
  noBallFreeHit: boolean;
  bonusOverRule: string;
  dismissalRules: string[];
}

export interface ScorecardBattingRow {
  id: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissal: string;
}

export interface ScorecardBowlingRow {
  id: string;
  bowlerName: string;
  overs: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
}

export interface SavedVideoRecord {
  id: string;
  createdAt: string;
  title: string;
  skillCategory: 'Batting' | 'Bowling' | 'Fielding';
  technique: string;
  durationSec: number;
  thumbnailDataUrl: string;
  reportId?: string;
}

export interface TrainingHistoryEntry {
  id: string;
  date: string;
  title: string;
  durationMinutes: number;
  exercisesCompleted: string[];
  notes: string;
}

export interface QuizQuestion {
  id: string;
  topic: 'Cricket Rules' | 'Batting' | 'Bowling' | 'Fielding' | 'Match Situations' | 'Tactical Decisions' | 'Turf Cricket';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CoachSquadPlayer {
  id: string;
  name: string;
  role: CricketRole;
  level: SkillLevel;
  group: string;
  consentGranted: boolean;
  assignedLessonIds: string[];
  assignedExerciseIds: string[];
  notes: string;
}

export interface PlayZoneSession {
  id: string;
  createdAt: string;
  gameType: 'batting_challenge';
  challengeBalls: 6 | 12;
  difficulty: 'Beginner' | 'Intermediate' | 'Pro';
  totalRuns: number;
  ballsFaced: number;
  successfulShots: number;
  missedDeliveries: number;
  wickets: number;
  timingScore: number;
  suggestedDrillId?: string;
}

export interface PitchIQState {
  profile: PlayerProfile;
  completedLessonIds: string[];
  completedExerciseIds: string[];
  savedExerciseIds: string[];
  savedTutorialIds: string[];
  bookmarkedTipIds: string[];
  exerciseNotes: Record<string, string>;
  reports: VideoAnalysisReport[];
  savedVideos: SavedVideoRecord[];
  activeTrainingPlan: TrainingPlan | null;
  trainingHistory: TrainingHistoryEntry[];
  coachMessages: CoachMessage[];
  turfRules: TurfRulesConfig;
  quizHighScores: Record<string, number>;
  completedChallenges: string[];
  squadPlayers: CoachSquadPlayer[];
  playzoneSessions: PlayZoneSession[];
}

export type CrickifyState = PitchIQState;
