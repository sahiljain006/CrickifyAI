import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  Camera,
  ChevronDown,
  Dumbbell,
  Flame,
  Gamepad2,
  Home,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  Target,
  Trophy,
  User,
  Video,
  X,
} from 'lucide-react';
import {
  CoachMessage,
  CoachSquadPlayer,
  NavSectionId,
  PitchIQState,
  PlayerProfile,
  PlayZoneSession,
  SavedVideoRecord,
  TrainingPlan,
  TurfRulesConfig,
  VideoAnalysisReport,
} from './types';
import { DEFAULT_PITCHIQ_STATE } from './data/tipsAndQuiz';
import { CRICKET_LESSONS } from './data/lessons';
import { CRICKET_EXERCISES } from './data/exercises';
import { LandingHomeView } from './views/LandingHomeView';
import { DashboardAndJourneyView } from './views/DashboardAndJourneyView';
import { CricketAcademyView } from './views/CricketAcademyView';
import { AICoachView } from './views/AICoachView';
import { VideoAnalysisStudioView } from './views/VideoAnalysisStudioView';
import { TrainingCentreView } from './views/TrainingCentreView';
import { TurfIQView } from './views/TurfIQView';
import { MatchIQView } from './views/MatchIQView';
import { DevelopmentAndCoachView } from './views/DevelopmentAndCoachView';
import { PlayZoneView } from './views/PlayZoneView';
import { LessonDetailModal } from './components/LessonDetailModal';
import { ExerciseDetailModal } from './components/ExerciseDetailModal';
import { OnboardingModal } from './components/OnboardingModal';
import { HelpModal } from './components/HelpModal';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthModal } from './components/AuthModal';
import {
  auth,
  AuthUserSummary,
  extractAuthUserSummary,
  signOutAccount,
  testFirestoreConnection,
} from './lib/firebase';
import {
  deleteVideoReportFromFirestore,
  loadOrCreateUserWorkspace,
  saveCoachMessagesToFirestore,
  savePlayZoneSessionToFirestore,
  saveSquadPlayerToFirestore,
  saveTrainingHistoryEntryToFirestore,
  saveTrainingPlanToFirestore,
  saveVideoReportToFirestore,
  saveWorkspaceProfileToFirestore,
  saveWorkspaceProgressToFirestore,
  toggleCoachMessageSavedInFirestore,
} from './lib/firestoreRepo';
import { CRICKIFY_IMAGES } from './utils/assets';

const STORAGE_KEY = 'crickify_state_v1';
const LEGACY_STORAGE_KEY = 'pitchiq_state_v1';

interface NavGroup {
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ id: NavSectionId; label: string }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    group: 'HOME',
    icon: Home,
    items: [
      { id: 'home-landing', label: 'CRICKIFY Home' },
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'journey', label: 'My Cricket Journey' },
      { id: 'daily-tips', label: 'Daily Cricket Tip' },
    ],
  },
  {
    group: 'CRICKET ACADEMY',
    icon: BookOpen,
    items: [
      { id: 'academy-beginner', label: 'Beginner Academy' },
      { id: 'academy-intermediate', label: 'Intermediate Academy' },
      { id: 'academy-advanced', label: 'Advanced Academy' },
      { id: 'academy-masterclass', label: 'Professional Masterclass' },
      { id: 'academy-batting', label: 'Batting Academy' },
      { id: 'academy-bowling', label: 'Bowling Academy' },
      { id: 'academy-fielding', label: 'Fielding Academy' },
      { id: 'academy-wicketkeeping', label: 'Wicketkeeping' },
      { id: 'academy-rules', label: 'Cricket Rules' },
    ],
  },
  {
    group: 'AI COACH',
    icon: MessageSquare,
    items: [
      { id: 'coach-chat', label: 'AI Cricket Coach' },
      { id: 'coach-voice', label: 'Voice Coach' },
      { id: 'coach-no-video', label: 'Ask Without Video' },
      { id: 'coach-history', label: 'Coaching History' },
    ],
  },
  {
    group: 'PRACTICE AND ANALYSIS',
    icon: Camera,
    items: [
      { id: 'practice-camera', label: 'Quick Camera Capture' },
      { id: 'practice-upload', label: 'Upload Video' },
      { id: 'analysis-batting', label: 'Batting Analysis' },
      { id: 'analysis-bowling', label: 'Bowling Analysis' },
      { id: 'analysis-fielding', label: 'Fielding Analysis' },
      { id: 'correction-studio', label: 'Technique Correction Studio' },
      { id: 'why-got-out', label: 'Why Did I Get Out?' },
    ],
  },
  {
    group: 'TRAINING CENTRE',
    icon: Dumbbell,
    items: [
      { id: 'exercises-batting', label: 'Batting Exercises' },
      { id: 'exercises-bowling', label: 'Bowling Exercises' },
      { id: 'exercises-fielding', label: 'Fielding Exercises' },
      { id: 'fitness-hub', label: 'Cricket Fitness' },
      { id: 'fitness-strength', label: 'Strength Training' },
      { id: 'fitness-stamina', label: 'Stamina Training' },
      { id: 'fitness-speed', label: 'Speed and Agility' },
      { id: 'fitness-mobility', label: 'Mobility and Flexibility' },
      { id: 'fitness-recovery', label: 'Recovery and Rest' },
      { id: 'training-planner', label: 'My Training Planner' },
    ],
  },
  {
    group: 'TURF IQ',
    icon: Target,
    items: [
      { id: 'turf-academy', label: 'Turf Cricket Academy' },
      { id: 'turf-batting', label: 'Turf Batting' },
      { id: 'turf-bowling', label: 'Turf Bowling' },
      { id: 'turf-fielding', label: 'Turf Fielding' },
      { id: 'turf-practice', label: 'Turf Practice' },
      { id: 'turf-strategy', label: 'Turf Match Strategy' },
      { id: 'turf-rules', label: 'Custom Turf Rules' },
    ],
  },
  {
    group: 'MATCH IQ',
    icon: BarChart3,
    items: [
      { id: 'match-scorecard', label: 'Scorecard Analysis' },
      { id: 'match-stats', label: 'Player Statistics' },
      { id: 'match-team', label: 'Team Performance' },
      { id: 'match-opponent', label: 'Opponent Analysis' },
      { id: 'match-tactics', label: 'Tactical Planning' },
    ],
  },
  {
    group: 'MY DEVELOPMENT',
    icon: Trophy,
    items: [
      { id: 'dev-progress', label: 'Learning Progress' },
      { id: 'dev-history', label: 'Training History' },
      { id: 'dev-videos', label: 'Saved Videos' },
      { id: 'dev-reports', label: 'Saved Reports' },
      { id: 'dev-quiz', label: 'Cricket Quiz' },
      { id: 'dev-challenges', label: 'Challenges' },
      { id: 'dev-achievements', label: 'Achievements' },
      { id: 'dev-profile', label: 'Player Profile' },
      { id: 'coach-academy-mode', label: 'Coach & Academy Mode' },
    ],
  },
  {
    group: 'PLAYZONE',
    icon: Gamepad2,
    items: [
      { id: 'playzone-batting', label: 'PlayZone Batting Challenge' },
    ],
  },
];

export default function App() {
  const [state, setState] = useState<PitchIQState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) return { ...DEFAULT_PITCHIQ_STATE, ...JSON.parse(saved) };
    } catch {
      // fallback to default
    }
    return DEFAULT_PITCHIQ_STATE;
  });

  const [activeSection, setActiveSection] = useState<NavSectionId>('home-landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMoreOpen, setDesktopMoreOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [authUser, setAuthUser] = useState<AuthUserSummary | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [guestSaveBannerVisible, setGuestSaveBannerVisible] = useState(false);
  const [playZoneActiveGameplay, setPlayZoneActiveGameplay] = useState(false);

  // Verify Firestore connectivity on boot & sync Firebase Auth session (persisted in local browser storage)
  useEffect(() => {
    testFirestoreConnection();

    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      const summary = extractAuthUserSummary(fbUser);
      setAuthUser(summary);

      if (!summary) {
        return;
      }

      setGuestSaveBannerVisible(false);
      setAuthModalOpen(false);
      setAuthPromptMessage(null);

      try {
        let localSeed: PitchIQState | undefined;
        try {
          const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
          if (saved) localSeed = { ...DEFAULT_PITCHIQ_STATE, ...JSON.parse(saved) };
        } catch {
          // ignore local parse errors
        }

        const loadedState = await loadOrCreateUserWorkspace(summary, localSeed);
        if (!active) return;
        setState(loadedState);
      } catch (err) {
        console.error('[Firestore Workspace Load Error]:', err);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const updateLocalState = (updater: (prev: PitchIQState) => PitchIQState): PitchIQState | null => {
    let nextSnapshot: PitchIQState | null = null;
    setState((prev) => {
      const next = updater(prev);
      nextSnapshot = next;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota limits if large frames exceed localStorage
      }
      return next;
    });
    return nextSnapshot;
  };

  const openAuthPrompt = (message?: string) => {
    setAuthPromptMessage(
      message || 'Sign in with Google to save your cricket journey, video reports, and training plans.'
    );
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    setDesktopMoreOpen(false);
  };

  const requireLoginForSave = (reason: string): boolean => {
    if (!authUser) {
      openAuthPrompt(`Sign in with Google to ${reason}. Guest browsing and live AI coaching remain free without an account.`);
      return false;
    }
    return true;
  };

  const navigate = (sec: NavSectionId) => {
    setDesktopMoreOpen(false);
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    if (sec !== 'playzone-batting') {
      setPlayZoneActiveGameplay(false);
    }
    if (sec === 'dev-profile') {
      setOnboardingOpen(true);
      return;
    }
    setActiveSection(sec);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProfile = (updated: PlayerProfile) => {
    if (!requireLoginForSave('save your personal player profile')) return;
    const next = { ...state, profile: updated };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProfileToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
    setOnboardingOpen(false);
    if (activeSection === 'home-landing') {
      setActiveSection('dashboard');
    }
  };

  const toggleLessonComplete = (id: string) => {
    if (!requireLoginForSave('save completed academy lessons')) return;
    const next: PitchIQState = {
      ...state,
      completedLessonIds: state.completedLessonIds.includes(id)
        ? state.completedLessonIds.filter((i) => i !== id)
        : [...state.completedLessonIds, id],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const toggleExerciseComplete = (id: string) => {
    if (!requireLoginForSave('save completed exercises')) return;
    const next: PitchIQState = {
      ...state,
      completedExerciseIds: state.completedExerciseIds.includes(id)
        ? state.completedExerciseIds.filter((i) => i !== id)
        : [...state.completedExerciseIds, id],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const toggleSaveExercise = (id: string) => {
    if (!requireLoginForSave('bookmark exercises to your account')) return;
    const next: PitchIQState = {
      ...state,
      savedExerciseIds: state.savedExerciseIds.includes(id)
        ? state.savedExerciseIds.filter((i) => i !== id)
        : [...state.savedExerciseIds, id],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const saveExerciseNote = (id: string, note: string) => {
    if (!requireLoginForSave('save personal training notes')) return;
    const next: PitchIQState = {
      ...state,
      exerciseNotes: { ...state.exerciseNotes, [id]: note },
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const toggleSaveTutorial = (id: string) => {
    if (!requireLoginForSave('bookmark coaching tutorials')) return;
    const next: PitchIQState = {
      ...state,
      savedTutorialIds: state.savedTutorialIds.includes(id)
        ? state.savedTutorialIds.filter((i) => i !== id)
        : [...state.savedTutorialIds, id],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const toggleBookmarkTip = (id: string) => {
    if (!requireLoginForSave('bookmark daily cricket tips')) return;
    const next: PitchIQState = {
      ...state,
      bookmarkedTipIds: state.bookmarkedTipIds.includes(id)
        ? state.bookmarkedTipIds.filter((i) => i !== id)
        : [...state.bookmarkedTipIds, id],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const addCoachMessages = (userMsg: CoachMessage, assistantMsg: CoachMessage) => {
    const next: PitchIQState = {
      ...state,
      coachMessages: [...state.coachMessages, userMsg, assistantMsg],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveCoachMessagesToFirestore(authUser.id, authUser.email, next, [userMsg, assistantMsg]).catch(() => {});
    } else {
      setGuestSaveBannerVisible(true);
    }
  };

  const toggleSaveCoachMessage = (id: string) => {
    if (!requireLoginForSave('save AI Coach advice to your history')) return;
    const updatedMessages = state.coachMessages.map((m) => (m.id === id ? { ...m, saved: !m.saved } : m));
    const targetMsg = updatedMessages.find((m) => m.id === id);
    updateLocalState((prev) => ({
      ...prev,
      coachMessages: updatedMessages,
    }));
    if (authUser && targetMsg) {
      toggleCoachMessageSavedInFirestore(authUser.id, targetMsg).catch(() => {});
    }
  };

  const saveVideoReport = (report: VideoAnalysisReport, videoRecord?: SavedVideoRecord) => {
    const next: PitchIQState = {
      ...state,
      reports: [report, ...state.reports],
      savedVideos: videoRecord ? [videoRecord, ...state.savedVideos] : state.savedVideos,
    };
    updateLocalState(() => next);
    if (authUser) {
      saveVideoReportToFirestore(authUser.id, authUser.email, next, report, videoRecord).catch(() => {});
    } else {
      setGuestSaveBannerVisible(true);
    }
  };

  const deleteVideoReport = (id: string) => {
    if (!requireLoginForSave('manage saved video reports')) return;
    const linkedVideoIds = state.savedVideos.filter((v) => v.reportId === id).map((v) => v.id);
    updateLocalState((prev) => ({
      ...prev,
      reports: prev.reports.filter((r) => r.id !== id),
      savedVideos: prev.savedVideos.filter((v) => v.reportId !== id),
    }));
    if (authUser) {
      deleteVideoReportFromFirestore(authUser.id, id, linkedVideoIds).catch(() => {});
    }
  };

  const saveTrainingPlan = (plan: TrainingPlan) => {
    const next: PitchIQState = { ...state, activeTrainingPlan: plan };
    updateLocalState(() => next);
    if (authUser) {
      saveTrainingPlanToFirestore(authUser.id, authUser.email, next, plan).catch(() => {});
    } else {
      setGuestSaveBannerVisible(true);
    }
  };

  const logTrainingSession = (title: string, durationMinutes: number, exerciseIds: string[], notes: string) => {
    if (!requireLoginForSave('log completed workout sessions')) return;
    const newEntry = {
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
      title,
      durationMinutes,
      exercisesCompleted: exerciseIds,
      notes,
    };
    const next: PitchIQState = {
      ...state,
      completedExerciseIds: Array.from(new Set([...state.completedExerciseIds, ...exerciseIds])),
      trainingHistory: [newEntry, ...state.trainingHistory],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
      saveTrainingHistoryEntryToFirestore(authUser.id, authUser.email, next, newEntry).catch(() => {});
    }
  };

  const saveTurfRules = (turfRules: TurfRulesConfig) => {
    if (!requireLoginForSave('save your custom Turf IQ arena rules')) return;
    const next: PitchIQState = { ...state, turfRules };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const saveQuizScore = (topic: string, pct: number) => {
    if (!requireLoginForSave('save your cricket quiz high score')) return;
    const next: PitchIQState = {
      ...state,
      quizHighScores: {
        ...state.quizHighScores,
        [topic]: Math.max(state.quizHighScores[topic] || 0, pct),
      },
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const toggleChallenge = (id: string) => {
    if (!requireLoginForSave('save completed cricket challenges')) return;
    const next: PitchIQState = {
      ...state,
      completedChallenges: state.completedChallenges.includes(id)
        ? state.completedChallenges.filter((c) => c !== id)
        : [...state.completedChallenges, id],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveWorkspaceProgressToFirestore(authUser.id, authUser.email, next).catch(() => {});
    }
  };

  const updateSquadPlayer = (updated: CoachSquadPlayer) => {
    if (!requireLoginForSave('update Coach & Academy squad records')) return;
    const next: PitchIQState = {
      ...state,
      squadPlayers: state.squadPlayers.map((p) => (p.id === updated.id ? updated : p)),
    };
    updateLocalState(() => next);
    if (authUser) {
      saveSquadPlayerToFirestore(authUser.id, authUser.email, next, updated).catch(() => {});
    }
  };

  const addSquadPlayer = (created: CoachSquadPlayer) => {
    if (!requireLoginForSave('add players to your Coach & Academy squad')) return;
    const next: PitchIQState = {
      ...state,
      squadPlayers: [...state.squadPlayers, created],
    };
    updateLocalState(() => next);
    if (authUser) {
      saveSquadPlayerToFirestore(authUser.id, authUser.email, next, created).catch(() => {});
    }
  };

  const savePlayZoneSession = (session: PlayZoneSession) => {
    const next: PitchIQState = {
      ...state,
      playzoneSessions: [session, ...(state.playzoneSessions || [])].slice(0, 30),
    };
    updateLocalState(() => next);
    if (authUser) {
      savePlayZoneSessionToFirestore(authUser.id, authUser.email, next, session).catch(() => {});
    } else {
      setGuestSaveBannerVisible(true);
    }
  };

  const handleSignOut = async () => {
    await signOutAccount();
    setAuthUser(null);
    setState(DEFAULT_PITCHIQ_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const activeLesson = activeLessonId ? CRICKET_LESSONS.find((l) => l.id === activeLessonId) || null : null;
  const activeExercise = activeExerciseId ? CRICKET_EXERCISES.find((e) => e.id === activeExerciseId) || null : null;
  const avatarSrc = authUser?.avatarUrl || state.profile.avatarUrl || CRICKIFY_IMAGES.playerAvatar;

  const isHomeFamily =
    activeSection === 'home-landing' ||
    activeSection === 'dashboard' ||
    activeSection === 'journey' ||
    activeSection === 'daily-tips';
  const isAcademyFamily = activeSection.startsWith('academy-');
  const isAnalyseFamily =
    activeSection.startsWith('practice-') ||
    activeSection.startsWith('analysis-') ||
    activeSection === 'correction-studio' ||
    activeSection === 'why-got-out';
  const isCoachFamily = activeSection.startsWith('coach-');
  const isTrainingFamily =
    activeSection.startsWith('exercises-') ||
    activeSection.startsWith('fitness-') ||
    activeSection === 'training-planner';

  const renderMainContent = () => {
    if (activeSection === 'playzone-batting') {
      return (
        <PlayZoneView
          onNavigate={navigate}
          onSaveSession={savePlayZoneSession}
          onActiveGameplayChange={setPlayZoneActiveGameplay}
        />
      );
    }

    if (activeSection === 'home-landing') {
      return (
        <LandingHomeView
          state={state}
          isGuest={!authUser}
          onNavigate={navigate}
          onOpenOnboarding={() => setOnboardingOpen(true)}
          onOpenAuth={() => openAuthPrompt()}
        />
      );
    }

    if (activeSection === 'dashboard' || activeSection === 'journey' || activeSection === 'daily-tips') {
      return (
        <DashboardAndJourneyView
          mode={activeSection === 'journey' ? 'journey' : activeSection === 'daily-tips' ? 'daily-tips' : 'dashboard'}
          state={state}
          isGuest={!authUser}
          onNavigate={navigate}
          onOpenLesson={setActiveLessonId}
          onOpenExercise={setActiveExerciseId}
          onToggleBookmarkTip={toggleBookmarkTip}
          onOpenOnboarding={() => setOnboardingOpen(true)}
          onOpenAuth={() => openAuthPrompt()}
        />
      );
    }

    if (activeSection.startsWith('academy-')) {
      return (
        <CricketAcademyView
          section={activeSection}
          state={state}
          onNavigate={navigate}
          onOpenLesson={setActiveLessonId}
          onOpenExercise={setActiveExerciseId}
          onToggleSaveTutorial={toggleSaveTutorial}
        />
      );
    }

    if (
      activeSection.startsWith('coach-chat') ||
      activeSection === 'coach-voice' ||
      activeSection === 'coach-no-video' ||
      activeSection === 'coach-history'
    ) {
      const coachMode =
        activeSection === 'coach-voice'
          ? 'voice'
          : activeSection === 'coach-no-video'
            ? 'no-video'
            : activeSection === 'coach-history'
              ? 'history'
              : 'chat';
      return (
        <AICoachView
          mode={coachMode}
          state={state}
          onAddMessages={addCoachMessages}
          onToggleSaveMessage={toggleSaveCoachMessage}
          onOpenLesson={setActiveLessonId}
          onOpenExercise={setActiveExerciseId}
          onNavigate={navigate}
        />
      );
    }

    if (
      activeSection === 'practice-camera' ||
      activeSection === 'practice-upload' ||
      activeSection === 'analysis-batting' ||
      activeSection === 'analysis-bowling' ||
      activeSection === 'analysis-fielding' ||
      activeSection === 'correction-studio' ||
      activeSection === 'why-got-out'
    ) {
      const vMode =
        activeSection === 'practice-camera'
          ? 'camera'
          : activeSection === 'analysis-batting'
            ? 'batting'
            : activeSection === 'analysis-bowling'
              ? 'bowling'
              : activeSection === 'analysis-fielding'
                ? 'fielding'
                : activeSection === 'correction-studio'
                  ? 'studio'
                  : activeSection === 'why-got-out'
                    ? 'dismissal'
                    : 'upload';
      return (
        <VideoAnalysisStudioView
          mode={vMode}
          state={state}
          onSaveReport={saveVideoReport}
          onDeleteReport={deleteVideoReport}
          onOpenExercise={setActiveExerciseId}
          onNavigate={navigate}
        />
      );
    }

    if (
      activeSection.startsWith('exercises-') ||
      activeSection.startsWith('fitness-') ||
      activeSection === 'training-planner'
    ) {
      return (
        <TrainingCentreView
          section={activeSection}
          state={state}
          onOpenExercise={setActiveExerciseId}
          onSaveTrainingPlan={saveTrainingPlan}
          onLogSession={logTrainingSession}
        />
      );
    }

    if (activeSection.startsWith('turf-')) {
      return (
        <TurfIQView
          section={activeSection}
          state={state}
          onSaveTurfRules={saveTurfRules}
          onOpenExercise={setActiveExerciseId}
        />
      );
    }

    if (activeSection.startsWith('match-')) {
      return (
        <MatchIQView
          section={activeSection}
          authUserId={authUser?.id || null}
          authUserEmail={authUser?.email || ''}
          state={state}
          onRequireAuth={openAuthPrompt}
        />
      );
    }

    return (
      <DevelopmentAndCoachView
        section={activeSection}
        state={state}
        onOpenLesson={setActiveLessonId}
        onOpenExercise={setActiveExerciseId}
        onOpenOnboarding={() => setOnboardingOpen(true)}
        onToggleSaveTutorial={toggleSaveTutorial}
        onDeleteReport={deleteVideoReport}
        onSaveQuizScore={saveQuizScore}
        onToggleChallenge={toggleChallenge}
        onUpdateSquadPlayer={updateSquadPlayer}
        onAddSquadPlayer={addSquadPlayer}
        onNavigate={navigate}
      />
    );
  };

  return (
    <div className="min-h-screen cricket-turf-canvas text-[#17251A] flex flex-col relative overflow-x-hidden">
      {/* Subtle Sunlit Natural Outfield Atmosphere at Top of Viewport */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 h-96 overflow-hidden z-0">
        <img
          src={CRICKIFY_IMAGES.sunlitOutfieldBg}
          alt=""
          className="w-full h-full object-cover opacity-18"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(244, 247, 239, 0.3) 0%, rgba(244, 247, 239, 0.85) 65%, #F4F7EF 100%)',
          }}
        />
      </div>

      {/* Warm White Translucent Sports Top Bar (Single Row) */}
      <header className="sticky top-0 z-40 h-14 lg:h-16 bg-white/94 backdrop-blur-md border-b border-[#087F55]/14 px-3 sm:px-4 xl:px-6 flex items-center justify-between gap-2 xl:gap-3 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Open navigation menu"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#17251A] hover:bg-[#EDF5EE] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('home-landing')}
            className="flex items-center gap-2 whitespace-nowrap shrink-0 focus:outline-none min-h-[44px]"
          >
            <svg viewBox="0 0 36 36" className="w-8 h-8 shrink-0" aria-hidden="true">
              <rect width="36" height="36" rx="10" fill="#103B2A" />
              <line x1="13" y1="9" x2="13" y2="27" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="18" y1="9" x2="18" y2="27" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="23" y1="9" x2="23" y2="27" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="12" y1="9" x2="24" y2="9" stroke="#FF941F" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M7 22 Q18 11 29 18" fill="none" stroke="#B7F34A" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-2xl font-bold tracking-wider text-[#17251A]">CRICKIFY</span>
          </button>
        </div>

        {/* Clean Desktop Horizontal Navigation */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-sm font-semibold">
          {(
            [
              { id: 'home-landing', label: 'Home', active: activeSection === 'home-landing' },
              { id: 'dashboard', label: 'Dashboard', active: activeSection === 'dashboard' || activeSection === 'journey' || activeSection === 'daily-tips' },
              { id: 'academy-batting', label: 'Academy', active: isAcademyFamily },
              { id: 'playzone-batting', label: 'PlayZone', active: activeSection === 'playzone-batting' },
              { id: 'coach-chat', label: 'AI Coach', active: isCoachFamily },
              { id: 'practice-upload', label: 'Video Analysis', active: isAnalyseFamily },
              { id: 'training-planner', label: 'Training', active: isTrainingFamily },
            ] as const
          ).map((navItem) => (
            <button
              key={navItem.id}
              type="button"
              onClick={() => navigate(navItem.id)}
              className={`px-2 xl:px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                navItem.active
                  ? 'bg-[#EDF3E8] text-[#397B32]'
                  : 'text-[#68766A] hover:text-[#17251A] hover:bg-[#F7FAF3]'
              }`}
            >
              {navItem.label}
            </button>
          ))}

          {/* More Modules Menu Dropdown (Turf IQ, Match IQ, Wicketkeeping, Rules, Coaching History, Settings) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setDesktopMoreOpen((o) => !o);
                setAccountMenuOpen(false);
              }}
              className={`px-2 xl:px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                desktopMoreOpen || activeSection.startsWith('turf-') || activeSection.startsWith('match-') || activeSection.startsWith('dev-')
                  ? 'bg-[#EDF3E8] text-[#397B32]'
                  : 'text-[#68766A] hover:text-[#17251A] hover:bg-[#F7FAF3]'
              }`}
            >
              <span>All Modules</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {desktopMoreOpen && (
              <div className="absolute right-0 xl:left-1/2 xl:-translate-x-1/2 top-12 z-50 w-[640px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto bg-white rounded-3xl border border-[#397B32]/15 shadow-2xl p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
                {NAV_GROUPS.map((grp) => {
                  const Icon = grp.icon;
                  return (
                    <div key={grp.group} className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[#397B32]">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{grp.group}</span>
                      </div>
                      <div className="space-y-0.5">
                        {grp.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate(item.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${
                              activeSection === item.id
                                ? 'bg-[#397B32] text-white font-semibold'
                                : 'text-[#17251A] hover:bg-[#EDF3E8]'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Right Controls: Analyse CTA + Google/Account Trigger */}
        <div className="flex items-center gap-1.5 xl:gap-2 shrink-0 relative">
          <button
            type="button"
            onClick={() => navigate('practice-upload')}
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3 xl:px-4 py-2 rounded-xl bg-[#A8D94E] hover:bg-[#b8e465] text-[#17251A] text-xs font-bold transition-colors whitespace-nowrap shrink-0"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Analyse</span>
          </button>

          {authUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen((o) => !o);
                  setDesktopMoreOpen(false);
                }}
                className="min-h-[42px] pl-1.5 pr-3 py-1 rounded-2xl bg-[#EDF3E8] hover:bg-[#dfe9d6] flex items-center gap-2 transition-colors"
              >
                <img
                  src={avatarSrc}
                  alt={authUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-xl object-cover"
                />
                <span className="hidden sm:inline text-xs font-bold text-[#17251A] max-w-[110px] truncate">
                  {state.profile.name || authUser.displayName}
                </span>
              </button>

              {accountMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-60 bg-white rounded-2xl border border-[#397B32]/15 shadow-xl p-3 space-y-1.5">
                  <div className="px-2.5 py-1.5 border-b border-[#17251A]/10">
                    <div className="text-xs font-bold text-[#17251A] truncate">{state.profile.name}</div>
                    <div className="text-[11px] text-[#68766A] truncate">{authUser.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('dev-profile')}
                    className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-[#17251A] hover:bg-[#EDF3E8] flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-[#397B32]" /> Player Profile &amp; Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('dev-progress')}
                    className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-[#17251A] hover:bg-[#EDF3E8] flex items-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-[#FF941F]" /> Learning Progress
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full min-h-[40px] px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthPrompt()}
              className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#397B32] hover:bg-[#24552E] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Clean, Uncluttered 4-Group Mobile Hamburger Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            aria-hidden="true"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#0A1610]/55 backdrop-blur-xs"
          />
          <aside
            aria-label="Mobile navigation drawer"
            className="relative z-10 w-[86%] max-w-[340px] h-full bg-[#F7FAF3] text-[#17251A] shadow-2xl overflow-y-auto p-4 pb-10 space-y-4 animate-drawer-in"
          >
            {/* Drawer Header with Close Button */}
            <div className="flex items-center justify-between border-b border-[#087F55]/12 pb-3">
              <span className="font-display text-xl font-bold tracking-wider text-[#103B2A]">CRICKIFY MENU</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="min-h-[42px] min-w-[42px] rounded-xl bg-white border border-[#087F55]/15 flex items-center justify-center text-[#17251A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Compact Player Card */}
            <div className="bg-white rounded-2xl border border-[#087F55]/15 p-3.5 flex items-center gap-3">
              <img
                src={avatarSrc}
                alt={state.profile.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover border border-[#087F55]/30 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-[#17251A] truncate">{state.profile.name}</div>
                <div className="text-[11px] text-[#5C6B5F] truncate">
                  {authUser ? authUser.email : 'Guest Mode · Free Access'}
                </div>
              </div>
            </div>

            {/* 4 Clean Groups Without Duplicates */}
            {[
              {
                heading: 'MY CRICKET',
                items: [
                  { id: 'home-landing' as NavSectionId, label: 'Home' },
                  { id: 'academy-batting' as NavSectionId, label: 'Academy' },
                  { id: 'coach-chat' as NavSectionId, label: 'AI Coach' },
                  { id: 'practice-upload' as NavSectionId, label: 'Video Analysis' },
                ],
              },
              {
                heading: 'MY TRAINING',
                items: [
                  { id: 'training-planner' as NavSectionId, label: 'Training Planner' },
                  { id: 'dashboard' as NavSectionId, label: 'My Progress' },
                  { id: 'dev-challenges' as NavSectionId, label: 'Challenges' },
                ],
              },
              {
                heading: 'EXPLORE',
                items: [
                  { id: 'playzone-batting' as NavSectionId, label: 'PlayZone' },
                  { id: 'turf-academy' as NavSectionId, label: 'Turf IQ' },
                  { id: 'match-scorecard' as NavSectionId, label: 'Match IQ' },
                ],
              },
            ].map((section) => (
              <div key={section.heading} className="bg-white rounded-2xl border border-[#087F55]/12 p-3.5 space-y-2">
                <div className="text-[11px] font-extrabold tracking-wider text-[#087F55] px-1">
                  {section.heading}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigate(item.id)}
                        className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors ${
                          isActive
                            ? 'bg-[#103B2A] text-white'
                            : 'text-[#17251A] hover:bg-[#EDF5EE]'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && <span className="w-2 h-2 rounded-full bg-[#B7F34A]" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* 4th Group: ACCOUNT */}
            <div className="bg-white rounded-2xl border border-[#087F55]/12 p-3.5 space-y-1">
              <div className="text-[11px] font-extrabold tracking-wider text-[#087F55] px-1 pb-1">
                ACCOUNT
              </div>
              <button
                type="button"
                onClick={() => navigate('dev-profile')}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#17251A] hover:bg-[#EDF5EE]"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setOnboardingOpen(true);
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#17251A] hover:bg-[#EDF5EE]"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setHelpOpen(true);
                }}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#17251A] hover:bg-[#EDF5EE]"
              >
                Help
              </button>
              {authUser ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Sign Out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthPrompt()}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold text-[#087F55] hover:bg-[#EDF5EE]"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Viewport */}
      <main
        className={`relative z-10 flex-1 min-w-0 ${
          activeSection === 'playzone-batting' && playZoneActiveGameplay
            ? 'p-2 sm:px-4 sm:py-2 lg:p-6 pb-2 lg:pb-10'
            : 'p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-12'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          {guestSaveBannerVisible && !authUser && !(activeSection === 'playzone-batting' && playZoneActiveGameplay) && (
            <div className="mb-5 bg-white rounded-2xl border border-[#087F55]/25 px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs sm:text-sm font-semibold text-[#17251A]">
                Create your free CRICKIFY account and save your cricket journey.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openAuthPrompt()}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E]"
                >
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => setGuestSaveBannerVisible(false)}
                  aria-label="Dismiss save prompt"
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#68766A] hover:bg-[#EDF3E8]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {renderMainContent()}
        </div>
      </main>

      {/* Fixed Mobile Bottom Navigation: Hidden during active PlayZone match gameplay */}
      {!(activeSection === 'playzone-batting' && playZoneActiveGameplay) && (
        <nav
          aria-label="Mobile primary navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-14 bg-white/95 backdrop-blur-lg border-t border-[#397B32]/15 flex items-center justify-around px-1 shadow-[0_-6px_20px_-8px_rgba(23,37,26,0.12)]"
        >
          {(
            [
              { id: 'home-landing' as NavSectionId, label: 'Home', icon: Home, active: isHomeFamily },
              { id: 'academy-batting' as NavSectionId, label: 'Academy', icon: BookOpen, active: isAcademyFamily },
              { id: 'practice-upload' as NavSectionId, label: 'Analyse', icon: Video, active: isAnalyseFamily },
              { id: 'coach-chat' as NavSectionId, label: 'AI Coach', icon: Flame, active: isCoachFamily },
              { id: 'training-planner' as NavSectionId, label: 'Training', icon: Activity, active: isTrainingFamily },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => navigate(tab.id)}
                className={`min-h-[44px] flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl mx-0.5 transition-colors ${
                  tab.active ? 'text-[#397B32] bg-[#EDF3E8]/80 font-bold' : 'text-[#68766A] font-medium'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[11px] leading-none">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Modals */}
      {activeLesson && (
        <LessonDetailModal
          lesson={activeLesson}
          isCompleted={state.completedLessonIds.includes(activeLesson.id)}
          onToggleComplete={toggleLessonComplete}
          onSelectLesson={(id) => setActiveLessonId(id)}
          onClose={() => setActiveLessonId(null)}
        />
      )}

      {activeExercise && (
        <ExerciseDetailModal
          exercise={activeExercise}
          isCompleted={state.completedExerciseIds.includes(activeExercise.id)}
          isSaved={state.savedExerciseIds.includes(activeExercise.id)}
          note={state.exerciseNotes[activeExercise.id] || ''}
          onToggleComplete={toggleExerciseComplete}
          onToggleSave={toggleSaveExercise}
          onSaveNote={saveExerciseNote}
          onClose={() => setActiveExerciseId(null)}
        />
      )}

      {onboardingOpen && (
        <OnboardingModal
          profile={state.profile}
          authEmail={authUser?.email}
          onSave={handleSaveProfile}
          onClose={() => setOnboardingOpen(false)}
        />
      )}

      {authModalOpen && (
        <AuthModal
          promptMessage={authPromptMessage}
          onContinueAsGuest={() => {
            setAuthModalOpen(false);
            setAuthPromptMessage(null);
          }}
          onAuthSuccess={() => {
            setAuthModalOpen(false);
            setAuthPromptMessage(null);
          }}
          onClose={() => setAuthModalOpen(false)}
        />
      )}

      {helpOpen && (
        <HelpModal
          onClose={() => setHelpOpen(false)}
          onNavigate={navigate}
        />
      )}
    </div>
  );
}
