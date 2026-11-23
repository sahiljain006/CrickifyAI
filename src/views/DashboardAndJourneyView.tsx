import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  Bookmark,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CricketTip, NavSectionId, PitchIQState } from '../types';
import { CRICKET_LESSONS } from '../data/lessons';
import { CRICKET_EXERCISES } from '../data/exercises';
import { CRICKET_TIPS } from '../data/tipsAndQuiz';
import { CRICKIFY_IMAGES } from '../utils/assets';

interface DashboardAndJourneyViewProps {
  mode: 'dashboard' | 'journey' | 'daily-tips';
  state: PitchIQState;
  isGuest?: boolean;
  onNavigate: (section: NavSectionId) => void;
  onOpenLesson: (id: string) => void;
  onOpenExercise: (id: string) => void;
  onToggleBookmarkTip: (id: string) => void;
  onOpenOnboarding: () => void;
  onOpenAuth?: () => void;
}

function useCountUp(target: number, durationMs = 420): number {
  const [displayValue, setDisplayValue] = useState(target);
  useEffect(() => {
    const start = performance.now();
    const initial = 0;
    if (target <= 0) {
      setDisplayValue(0);
      return;
    }
    let rafId = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(Math.round(initial + (target - initial) * eased));
      if (t < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };
    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [durationMs, target]);
  return displayValue;
}

const ProgressRing: React.FC<{ value: number; total: number; label: string; color?: string }> = ({
  value,
  total,
  label,
  color = '#397B32',
}) => {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const animatedPct = useCountUp(pct);
  const animatedValue = useCountUp(value);

  return (
    <div className="flex items-center gap-3.5">
      <div className="relative w-16 h-16 shrink-0">
        <svg viewBox="0 0 68 68" className="w-16 h-16 -rotate-90" aria-hidden="true">
          <circle cx="34" cy="34" r={r} fill="none" stroke="#EDF3E8" strokeWidth="6" />
          <circle
            cx="34"
            cy="34"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-[#17251A] tabular-nums">
          {animatedPct}%
        </div>
      </div>
      <div>
        <div className="font-mono text-lg font-bold text-[#17251A] tabular-nums">
          {animatedValue} <span className="text-xs font-normal text-[#68766A]">/ {total}</span>
        </div>
        <div className="text-xs text-[#68766A] font-medium">{label}</div>
      </div>
    </div>
  );
};

export const DashboardAndJourneyView: React.FC<DashboardAndJourneyViewProps> = ({
  mode,
  state,
  isGuest = true,
  onNavigate,
  onOpenLesson,
  onOpenExercise,
  onToggleBookmarkTip,
  onOpenOnboarding,
  onOpenAuth,
}) => {
  const [tipSearch, setTipSearch] = useState('');
  const [tipCategory, setTipCategory] = useState<string>('All');
  const [tipLevel, setTipLevel] = useState<string>('All');
  const [expandedTip, setExpandedTip] = useState<CricketTip | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const playerAvatar = state.profile.avatarUrl || CRICKIFY_IMAGES.playerAvatar;

  const recommendedLessons = useMemo(() => {
    const roleMatch = CRICKET_LESSONS.filter((l) => {
      if (state.profile.role === 'Batter') return l.category === 'Batting' || l.category === 'Rules';
      if (state.profile.role === 'Fast Bowler' || state.profile.role === 'Spin Bowler') return l.category === 'Bowling';
      if (state.profile.role === 'Wicketkeeper') return l.category === 'Wicketkeeping' || l.category === 'Fielding';
      return true;
    });
    return roleMatch.slice(0, 3);
  }, [state.profile.role]);

  const continueLesson = useMemo(() => {
    return (
      recommendedLessons.find((l) => !state.completedLessonIds.includes(l.id)) ||
      CRICKET_LESSONS.find((l) => !state.completedLessonIds.includes(l.id)) ||
      CRICKET_LESSONS[0]
    );
  }, [recommendedLessons, state.completedLessonIds]);

  const dailyFeaturedTip = useMemo(() => {
    const dayIndex = new Date().getDate() % CRICKET_TIPS.length;
    return CRICKET_TIPS[dayIndex];
  }, []);

  const filteredTips = useMemo(() => {
    return CRICKET_TIPS.filter((tip) => {
      const q = tipSearch.toLowerCase().trim();
      const matchesQ =
        !q ||
        tip.title.toLowerCase().includes(q) ||
        tip.problem.toLowerCase().includes(q) ||
        tip.correctTechnique.toLowerCase().includes(q);
      const matchesCat = tipCategory === 'All' || tip.category === tipCategory;
      const matchesLvl = tipLevel === 'All' || tip.level === tipLevel;
      return matchesQ && matchesCat && matchesLvl;
    });
  }, [tipSearch, tipCategory, tipLevel]);

  const realReminders = useMemo(() => {
    const list: Array<{ title: string; detail: string; actionLabel: string; onAction: () => void }> = [];
    if (!state.profile.onboardingCompleted) {
      list.push({
        title: 'Personalise Your Player Profile',
        detail: 'Set your role, age group, and equipment for tailored lessons and routines.',
        actionLabel: 'Edit Profile',
        onAction: () => {
          setNotificationsOpen(false);
          onOpenOnboarding();
        },
      });
    }
    if (continueLesson && !state.completedLessonIds.includes(continueLesson.id)) {
      list.push({
        title: `Next Lesson: ${continueLesson.title}`,
        detail: `${continueLesson.durationMinutes} min study · ${continueLesson.category}`,
        actionLabel: 'Open Lesson',
        onAction: () => {
          setNotificationsOpen(false);
          onOpenLesson(continueLesson.id);
        },
      });
    }
    if (state.reports.length === 0) {
      list.push({
        title: 'Record or Upload First Practice Clip',
        detail: 'Get AI Cricket Technique Analysis on your batting, bowling, or fielding clip.',
        actionLabel: 'Open Studio',
        onAction: () => {
          setNotificationsOpen(false);
          onNavigate('practice-upload');
        },
      });
    }
    if (!state.activeTrainingPlan) {
      list.push({
        title: 'Build Your Weekly Training Plan',
        detail: `Generate a safe ${state.profile.dailyMinutes}-min routine matched to your schedule.`,
        actionLabel: 'Open Planner',
        onAction: () => {
          setNotificationsOpen(false);
          onNavigate('training-planner');
        },
      });
    }
    return list;
  }, [state.profile, state.completedLessonIds, state.reports.length, state.activeTrainingPlan, continueLesson, onNavigate, onOpenLesson, onOpenOnboarding]);

  const weeklyActivityData = useMemo(() => {
    const days: Array<{ label: string; minutes: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDay = d.toISOString().slice(0, 10);
      const dayMins = state.trainingHistory
        .filter((h) => h.date.slice(0, 10) === isoDay)
        .reduce((sum, h) => sum + (h.durationMinutes || 0), 0);
      days.push({
        label: d.toLocaleDateString(undefined, { weekday: 'short' }),
        minutes: dayMins,
      });
    }
    return days;
  }, [state.trainingHistory]);

  const lessonCompletionPct = Math.round(
    (state.completedLessonIds.length / Math.max(1, CRICKET_LESSONS.length)) * 100
  );

  const hasAnyActivity =
    state.completedLessonIds.length > 0 ||
    state.completedExerciseIds.length > 0 ||
    state.trainingHistory.length > 0 ||
    state.reports.length > 0;

  if (mode === 'daily-tips') {
    const categories = ['All', 'Batting', 'Bowling', 'Fielding', 'Turf Cricket', 'Fitness', 'Mental Preparation'];
    return (
      <div className="space-y-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#143622] text-white p-7 md:p-9 space-y-4 shadow-lg">
          <div className="text-xs font-bold uppercase tracking-wider text-[#A8D94E]">Daily Featured Cricket Tip</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white">{dailyFeaturedTip.title}</h1>
          <p className="text-sm text-[#E2ECE3] max-w-3xl leading-relaxed">
            <span className="font-bold text-[#FF941F]">Problem:</span> {dailyFeaturedTip.problem}{' '}
            <span className="font-bold text-[#A8D94E] ml-1">Fix:</span> {dailyFeaturedTip.correctTechnique}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => setExpandedTip(dailyFeaturedTip)}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#A8D94E] text-[#09180F] text-xs font-extrabold hover:bg-[#b8e462]"
            >
              Read Full Breakdown &amp; Drill
            </button>
            <button
              onClick={() => onOpenLesson(dailyFeaturedTip.relatedLessonId)}
              className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#DFF4E3] text-[#102419] text-xs font-bold hover:bg-[#CBEBD2]"
            >
              Open Related Lesson
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="athletic-card rounded-2xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#68766A] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={tipSearch}
                onChange={(e) => setTipSearch(e.target.value)}
                placeholder="Search tips (timing, yorker, soft hands, footwork, side-net...)"
                className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F7FAF3] text-sm focus:outline-none focus:ring-2 focus:ring-[#397B32]"
              />
            </div>
            <select
              value={tipLevel}
              onChange={(e) => setTipLevel(e.target.value)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F7FAF3] text-sm"
            >
              <option value="All">All Skill Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setTipCategory(cat)}
                className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  tipCategory === cat ? 'bg-[#397B32] text-white' : 'bg-[#EDF3E8] text-[#17251A] hover:bg-[#e1e8d8]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {filteredTips.map((tip) => {
            const bookmarked = state.bookmarkedTipIds.includes(tip.id);
            return (
              <div key={tip.id} className="athletic-card athletic-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-[#397B32]">
                      {tip.category} · {tip.level}
                    </div>
                    <button
                      onClick={() => onToggleBookmarkTip(tip.id)}
                      aria-label="Bookmark tip"
                      className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border ${
                        bookmarked
                          ? 'bg-[#A8D94E]/25 border-[#397B32] text-[#24552E]'
                          : 'border-[#17251A]/12 text-[#68766A]'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#17251A]">{tip.title}</h3>
                  <p className="text-sm text-[#68766A]">
                    <span className="font-semibold text-[#b91c1c]">Problem:</span> {tip.problem}
                  </p>
                  <p className="text-sm text-[#17251A]/85">
                    <span className="font-semibold text-[#397B32]">Technique:</span> {tip.correctTechnique}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#17251A]/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedTip(tip)}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-[#397B32] text-white text-xs font-semibold hover:bg-[#24552E]"
                  >
                    Step-by-Step Solution
                  </button>
                  {tip.relatedExerciseId && (
                    <button
                      onClick={() => onOpenExercise(tip.relatedExerciseId!)}
                      className="text-xs font-semibold text-[#397B32] hover:underline"
                    >
                      Open Drill →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {expandedTip && (
          <div className="fixed inset-0 z-50 bg-[#05140D]/70 backdrop-blur-sm overflow-y-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-gradient-to-b from-[#E1F4E5] to-[#D1ECD7] rounded-3xl border border-[#B7F34A]/45 overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-[#69A83F] via-[#397B32] to-[#24552E] text-white p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[#A8D94E] font-semibold mb-1">
                    {expandedTip.category} · {expandedTip.level}
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold">{expandedTip.title}</h3>
                </div>
                <button
                  onClick={() => setExpandedTip(null)}
                  aria-label="Close tip"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-[#17251A]">
                <div><strong>Problem:</strong> {expandedTip.problem}</div>
                <div><strong>Why It Happens:</strong> {expandedTip.whyItHappens}</div>
                <div><strong>Correct Technique:</strong> {expandedTip.correctTechnique}</div>
                <div>
                  <strong>Step-by-Step Solution:</strong>
                  <ol className="list-decimal pl-5 mt-1 space-y-1 text-[#68766A]">
                    {expandedTip.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
                <div>
                  <strong>Common Mistakes:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-[#68766A]">
                    {expandedTip.commonMistakes.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
                <div className="p-4 rounded-2xl bg-[#F7FAF3] border border-[#397B32]/15">
                  <div className="text-xs font-semibold text-[#397B32] mb-1">Practical Drill</div>
                  <p>{expandedTip.practicalDrill}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#EDF3E8] text-[#17251A]">
                  <div className="text-xs font-bold text-[#FF941F] mb-1">Coaching Advice</div>
                  <p>{expandedTip.coachingAdvice}</p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      const id = expandedTip.relatedLessonId;
                      setExpandedTip(null);
                      onOpenLesson(id);
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#397B32] text-white text-xs font-semibold"
                  >
                    Open Related Lesson
                  </button>
                  {expandedTip.relatedExerciseId && (
                    <button
                      onClick={() => {
                        const id = expandedTip.relatedExerciseId!;
                        setExpandedTip(null);
                        onOpenExercise(id);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EDF3E8] text-[#17251A] text-xs font-semibold"
                    >
                      Start Recommended Drill
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'journey') {
    const stages = [
      { title: '1. Learn Technique', done: state.completedLessonIds.length > 0, cta: 'Open Academy', nav: 'academy-batting' as NavSectionId },
      { title: '2. Watch Masterclass', done: state.savedTutorialIds.length > 0, cta: 'Watch Tutorials', nav: 'academy-masterclass' as NavSectionId },
      { title: '3. Practise Drills', done: state.completedExerciseIds.length > 0, cta: 'Training Centre', nav: 'exercises-batting' as NavSectionId },
      { title: '4. Record & Analyse', done: state.reports.length > 0, cta: 'Upload / Record Video', nav: 'practice-upload' as NavSectionId },
      { title: '5. Correct Mistakes', done: state.trainingHistory.length > 0, cta: 'Training Planner', nav: 'training-planner' as NavSectionId },
      { title: '6. Apply in Match / Turf', done: Object.keys(state.quizHighScores).length > 0, cta: 'Turf & Match IQ', nav: 'turf-academy' as NavSectionId },
    ];

    return (
      <div className="space-y-8">
        <div className="stadium-dark-panel text-white rounded-3xl p-7 md:p-9 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-[#A8D94E] mb-1">Personal Development Pathway</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">My Cricket Journey</h1>
          <p className="text-sm text-[#D7E4D8] mt-2 max-w-2xl">
            LEARN → WATCH → UNDERSTAND → PRACTISE → RECORD → ANALYSE → CORRECT → IMPROVE. Follow each stage at your pace.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {stages.map((st) => (
            <div key={st.title} className="athletic-card athletic-card-hover rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#397B32]">
                    {st.done ? 'Completed Milestone' : 'Active Step'}
                  </span>
                  <CheckCircle2 className={`w-5 h-5 ${st.done ? 'text-[#397B32]' : 'text-[#68766A]/35'}`} />
                </div>
                <h3 className="font-display text-2xl font-bold text-[#17251A]">{st.title}</h3>
              </div>
              <button
                onClick={() => onNavigate(st.nav)}
                className="w-full min-h-[44px] py-2.5 rounded-2xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E]"
              >
                {st.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default Bright Photographic Sports-App Dashboard Mode
  return (
    <div className="space-y-7">
      {/* 1. Personalised Athlete Passport Header */}
      <div className="rounded-3xl bg-[#0F2819] text-white border border-[#A8D94E]/25 p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-lg">
        <div className="flex items-center gap-4 sm:gap-5">
          <img
            src={playerAvatar}
            alt={`${state.profile.name} profile avatar`}
            referrerPolicy="no-referrer"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#A8D94E] shrink-0 bg-[#143622]"
          />
          <div className="space-y-1 min-w-0">
            <div className="text-xs font-bold text-[#A8D94E] truncate">
              {state.profile.skillLevel} · {state.profile.role} · {state.profile.battingHand}
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Hello, {state.profile.name}!
            </h1>
            <p className="text-sm font-medium text-[#D7E4D8]">
              Ready to Train Today?{' '}
              <span className="text-white">
                {state.profile.goals.slice(0, 2).join(' · ') || 'Personalise your training focus.'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            aria-label="Open training reminders"
            className="min-h-[44px] px-3.5 py-2.5 rounded-2xl bg-[#EDF3E8] text-[#24552E] text-xs font-bold hover:bg-[#dfe9d6] inline-flex items-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4 text-[#397B32]" />
            <span>Reminders ({realReminders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('practice-camera')}
            className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] transition-colors"
          >
            Record Practice
          </button>
          <button
            type="button"
            onClick={() => onNavigate('coach-chat')}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#A8D94E] text-[#17251A] text-xs font-bold hover:bg-[#b8e465] inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Coach
          </button>
          <button
            type="button"
            onClick={onOpenOnboarding}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl border border-[#B7F34A]/40 bg-[#DFF4E3] text-[#102419] text-xs font-bold hover:bg-[#CBEBD2] transition-colors"
          >
            Edit Profile
          </button>

          {notificationsOpen && (
            <div className="absolute left-0 sm:left-auto sm:right-0 top-13 z-30 w-[min(22rem,calc(100vw-3.25rem))] sm:w-96 bg-[#E1F4E5] rounded-2xl border border-[#087F55]/30 p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-[#397B32]">Training Reminders</div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close reminders"
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-[#EDF3E8] text-[#68766A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {realReminders.length === 0 ? (
                <p className="text-xs text-[#68766A]">You are right on track—keep logging sessions in your Training Planner.</p>
              ) : (
                <div className="space-y-2.5">
                  {realReminders.map((rem) => (
                    <div key={rem.title} className="p-3 rounded-xl bg-[#F7FAF3] border border-[#397B32]/12 space-y-1.5">
                      <div className="text-xs font-bold text-[#17251A]">{rem.title}</div>
                      <p className="text-[11px] text-[#68766A]">{rem.detail}</p>
                      <button
                        type="button"
                        onClick={rem.onAction}
                        className="text-[11px] font-bold text-[#397B32] hover:underline"
                      >
                        {rem.actionLabel} →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Friendly Non-Blocking Guest Account Prompt */}
      {isGuest && onOpenAuth && (
        <div className="rounded-2xl bg-[#EDF5EE] border border-[#087F55]/20 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-[#17251A]">
            <UserPlus className="w-4 h-4 text-[#087F55] shrink-0" />
            <span>Create your free CRICKIFY AI account and save your cricket journey.</span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#103B2A] hover:bg-[#087F55] text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
          >
            Sign In / Save Progress
          </button>
        </div>
      )}

      {/* CRICKIFY Improvement Loop Indicator */}
      <div className="rounded-2xl bg-gradient-to-r from-[#D5F2DF] via-[#E1F5D6] to-[#FDECCB] border border-[#087F55]/25 p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-[#087F55]">
          Your Cricket Loop
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          {[
            { label: '1. LEARN', done: state.completedLessonIds.length > 0, target: 'academy-batting' as NavSectionId },
            { label: '2. PRACTISE', done: state.completedExerciseIds.length > 0 || (state.playzoneSessions || []).length > 0, target: 'playzone-batting' as NavSectionId },
            { label: '3. ANALYSE', done: state.reports.length > 0, target: 'practice-upload' as NavSectionId },
            { label: '4. IMPROVE', done: state.coachMessages.length > 0 || !!state.activeTrainingPlan, target: 'coach-chat' as NavSectionId },
            { label: '5. TRACK PROGRESS', done: state.trainingHistory.length > 0, target: 'dev-progress' as NavSectionId },
          ].map((step) => (
            <button
              key={step.label}
              type="button"
              onClick={() => onNavigate(step.target)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                step.done
                  ? 'bg-[#B7F34A]/35 text-[#103B2A] border border-[#087F55]/30'
                  : 'bg-[#F7FAF3] text-[#5C6B5F] border border-[#17251A]/10 hover:text-[#17251A]'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Today's Practice Summary */}
      <div className="athletic-card rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#397B32]">Tracked Activity</div>
            <h2 className="font-display text-2xl font-bold text-[#17251A]">Today&apos;s Practice Summary</h2>
          </div>
          <span className="font-mono text-xs font-semibold text-[#68766A] tabular-nums">
            Daily Target: {state.profile.dailyMinutes} min
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl bg-[#F7FAF3] border border-[#397B32]/12 p-4">
            <div className="text-xs text-[#68766A] font-medium">Training Sessions</div>
            <div className="font-mono text-2xl font-bold text-[#17251A] tabular-nums mt-1">
              {state.trainingHistory.length}
            </div>
          </div>
          <div className="rounded-2xl bg-[#F7FAF3] border border-[#397B32]/12 p-4">
            <div className="text-xs text-[#68766A] font-medium">Lessons Completed</div>
            <div className="font-mono text-2xl font-bold text-[#397B32] tabular-nums mt-1">
              {state.completedLessonIds.length}
            </div>
          </div>
          <div className="rounded-2xl bg-[#F7FAF3] border border-[#397B32]/12 p-4">
            <div className="text-xs text-[#68766A] font-medium">Drills Done</div>
            <div className="font-mono text-2xl font-bold text-[#69A83F] tabular-nums mt-1">
              {state.completedExerciseIds.length}
            </div>
          </div>
          <div className="rounded-2xl bg-[#FFF7ED] border border-[#FF941F]/25 p-4">
            <div className="text-xs text-[#68766A] font-medium">Video Reports</div>
            <div className="font-mono text-2xl font-bold text-[#FF941F] tabular-nums mt-1">
              {state.reports.length}
            </div>
          </div>
        </div>

        {!hasAnyActivity && (
          <div className="rounded-2xl bg-[#EDF3E8] px-4 py-3 text-xs text-[#24552E] flex flex-wrap items-center justify-between gap-2">
            <span>New player onboarding ready — pick any Practice Mode below or run your first lesson to populate your stats.</span>
            <button
              type="button"
              onClick={() => continueLesson && onOpenLesson(continueLesson.id)}
              className="font-bold text-[#397B32] underline"
            >
              Start First Lesson →
            </button>
          </div>
        )}
      </div>

      {/* 3. Photographic Practice Modes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#102419]">Practice Modes</h2>
          <button
            type="button"
            onClick={() => onNavigate('practice-upload')}
            className="text-xs font-bold text-[#087F55] hover:underline"
          >
            Video Analysis Studio →
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Batting Practice',
              desc: 'Balance, front-foot timing & clean drives.',
              meta: '20 min · All Levels',
              img: CRICKIFY_IMAGES.battingDrive,
              nav: 'academy-batting' as NavSectionId,
            },
            {
              title: 'Bowling Accuracy',
              desc: 'Run-up rhythm, seam release & yorkers.',
              meta: '25 min · Pace & Spin',
              img: CRICKIFY_IMAGES.fastBowling,
              nav: 'academy-bowling' as NavSectionId,
            },
            {
              title: 'Fielding Drills',
              desc: 'Split-step reactions & soft-hands catching.',
              meta: '15 min · Reflexes',
              img: CRICKIFY_IMAGES.fieldingDive,
              nav: 'exercises-fielding' as NavSectionId,
            },
            {
              title: 'Fitness Training',
              desc: 'Cricket speed, stamina & joint mobility.',
              meta: '20 min · Conditioning',
              img: CRICKIFY_IMAGES.fitnessConditioning,
              nav: 'fitness-hub' as NavSectionId,
            },
          ].map((card) => (
            <div
              key={card.title}
              className="athletic-card athletic-card-hover rounded-3xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#EDF3E8] overflow-hidden">
                  <img
                    src={card.img}
                    alt={card.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 h-16"
                    style={{
                      background: 'linear-gradient(180deg, rgba(23,37,26,0) 0%, rgba(23,37,26,0.55) 100%)',
                    }}
                  />
                  <div className="absolute bottom-2.5 left-3.5 inline-flex items-center gap-1 text-[11px] font-bold text-white">
                    <Clock className="w-3 h-3 text-[#A8D94E]" />
                    <span>{card.meta}</span>
                  </div>
                </div>
                <div className="p-4 space-y-1">
                  <h3 className="font-display text-2xl font-bold text-[#17251A]">{card.title}</h3>
                  <p className="text-xs text-[#68766A] leading-relaxed">{card.desc}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <button
                  type="button"
                  onClick={() => onNavigate(card.nav)}
                  className="w-full min-h-[42px] py-2 rounded-2xl bg-[#397B32] hover:bg-[#24552E] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Continue Training + Player Progress */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 athletic-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#397B32]">Player Progress</div>
              <h2 className="font-display text-2xl font-bold text-[#17251A]">Mastery Rings &amp; Next Step</h2>
            </div>
            <span className="font-mono text-xs font-bold text-[#397B32] tabular-nums">
              {lessonCompletionPct}% Curriculum
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 pt-1">
            <ProgressRing
              value={state.completedLessonIds.length}
              total={CRICKET_LESSONS.length}
              label="Academy Lessons"
              color="#397B32"
            />
            <ProgressRing
              value={state.completedExerciseIds.length}
              total={CRICKET_EXERCISES.length}
              label="Drills Completed"
              color="#69A83F"
            />
            <ProgressRing
              value={state.reports.length}
              total={Math.max(5, state.reports.length)}
              label="Video Analyses"
              color="#FF941F"
            />
          </div>

          {/* Continue Training Panel */}
          {continueLesson && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#EDF3E8] border border-[#397B32]/15 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#397B32]">
                    Continue Training
                  </div>
                  <div className="font-display text-xl font-bold text-[#17251A]">{continueLesson.title}</div>
                  <div className="text-xs text-[#68766A]">
                    {continueLesson.category} · {continueLesson.level} · {continueLesson.durationMinutes} min
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenLesson(continueLesson.id)}
                  className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Continue Training
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-[#68766A]">
                  <span>Academy Progress</span>
                  <span className="font-mono tabular-nums text-[#24552E]">{lessonCompletionPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#C3E6CA] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#397B32] to-[#A8D94E] rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(lessonCompletionPct, 4)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real Weekly Logged Minutes Chart */}
        <div className="lg:col-span-5 athletic-card rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#397B32]">Last 7 Days</div>
              <h2 className="font-display text-2xl font-bold text-[#17251A]">Logged Training Minutes</h2>
            </div>
            <span className="font-mono text-sm font-bold text-[#397B32] tabular-nums">
              {state.trainingHistory.reduce((s, h) => s + h.durationMinutes, 0)}m total
            </span>
          </div>

          {state.trainingHistory.length === 0 ? (
            <div className="flex-1 rounded-2xl bg-[#F7FAF3] border border-[#397B32]/12 p-5 flex flex-col items-center justify-center text-center space-y-3">
              <p className="text-xs text-[#68766A] max-w-xs leading-relaxed">
                No training sessions logged yet. Start a workout in your Training Planner to chart real weekly minutes here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('training-planner')}
                className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E]"
              >
                Open Training Planner
              </button>
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8DA" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#68766A' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#68766A' }} width={28} />
                  <Tooltip />
                  <Bar dataKey="minutes" fill="#397B32" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* 5. Recommended Lessons + Photographic Training Tips Banner */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-extrabold text-[#102419]">Recommended Next Lessons</h2>
            <button onClick={() => onNavigate('academy-beginner')} className="text-xs font-bold text-[#087F55] hover:underline">
              View All Lessons →
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {recommendedLessons.map((lesson) => {
              const done = state.completedLessonIds.includes(lesson.id);
              return (
                <div key={lesson.id} className="athletic-card athletic-card-hover rounded-2xl p-5 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-[#397B32] font-semibold mb-1">
                      {lesson.category} · {lesson.level}
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#17251A] leading-snug">{lesson.title}</h3>
                  </div>
                  <button
                    onClick={() => onOpenLesson(lesson.id)}
                    className={`w-full min-h-[42px] py-2 rounded-xl text-xs font-bold transition-colors ${
                      done ? 'bg-[#EDF3E8] text-[#397B32]' : 'bg-[#397B32] text-white hover:bg-[#24552E]'
                    }`}
                  >
                    {done ? 'Review Completed' : 'Start Lesson'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Photographic Training Tips Banner */}
        <div className="lg:col-span-5 relative rounded-3xl overflow-hidden bg-[#24552E] text-white p-6 flex flex-col justify-between space-y-4 shadow-md min-h-[240px]">
          <img
            src={CRICKIFY_IMAGES.cricketPitch}
            alt="Sunlit cricket pitch grass"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(155deg, rgba(36, 85, 46, 0.90) 0%, rgba(57, 123, 50, 0.80) 60%, rgba(105, 168, 63, 0.72) 100%)',
            }}
          />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#A8D94E]">
              <Flame className="w-4 h-4 text-[#FF941F]" /> Training Tips
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
              {dailyFeaturedTip.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
              {dailyFeaturedTip.correctTechnique}
            </p>
          </div>
          <div className="relative z-10 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('daily-tips')}
              className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#B7F34A] text-[#071A11] text-xs font-extrabold hover:bg-[#c8f96b] inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              Explore Training Tips <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
