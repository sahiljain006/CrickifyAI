import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  Camera,
  Compass,
  Gamepad2,
  Mic,
  Play,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { NavSectionId, PitchIQState } from '../types';
import { HomepageHero } from '../components/HomepageHero';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { CRICKET_LESSONS } from '../data/lessons';
import { CRICKET_EXERCISES } from '../data/exercises';

interface LandingHomeViewProps {
  state: PitchIQState;
  isGuest?: boolean;
  onNavigate: (section: NavSectionId) => void;
  onOpenOnboarding: () => void;
  onOpenAuth?: () => void;
}

const SMART_ENTRY_PATHS: Array<{
  title: string;
  desc: string;
  cta: string;
  target: NavSectionId;
  accent: 'green' | 'amber';
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: 'Start with Foundations',
    desc: 'Learn batting grip, pitch basics, and rules step by step.',
    cta: 'Start Track',
    target: 'academy-beginner',
    accent: 'green',
    icon: Compass,
  },
  {
    title: 'Explore Academy',
    desc: 'Sharpen drives, bowling release, and sharp fielding.',
    cta: 'Browse Lessons',
    target: 'academy-batting',
    accent: 'amber',
    icon: BookOpen,
  },
  {
    title: 'Ask the AI Coach',
    desc: 'Get instant cricket guidance on shots, bowling, and tactics.',
    cta: 'Open Coach',
    target: 'coach-chat',
    accent: 'green',
    icon: Bot,
  },
  {
    title: 'Analyse Practice Video',
    desc: 'Upload a net clip for clear AI movement feedback.',
    cta: 'Upload Clip',
    target: 'practice-upload',
    accent: 'amber',
    icon: Camera,
  },
  {
    title: 'Enter PlayZone',
    desc: 'Step up to the crease and smash boundaries in timing mode.',
    cta: 'Play Now',
    target: 'playzone-batting',
    accent: 'green',
    icon: Gamepad2,
  },
];

export const LandingHomeView: React.FC<LandingHomeViewProps> = ({
  state,
  isGuest = true,
  onNavigate,
  onOpenOnboarding,
  onOpenAuth,
}) => {
  const academyPaths = useMemo(() => {
    const countLabel = (cats: string[]) => {
      const items = CRICKET_LESSONS.filter((l) => cats.includes(l.category));
      return items.length ? `${items.length} lessons` : 'Guided track';
    };
    const fitnessCount = CRICKET_EXERCISES.filter(
      (e) => !['Batting', 'Bowling', 'Fielding'].includes(e.category)
    ).length;

    return [
      {
        title: 'Batting',
        desc: 'Stance, footwork, cover drives, and playing spin.',
        meta: countLabel(['Batting']),
        img: CRICKIFY_IMAGES.battingDrive,
        target: 'academy-batting' as NavSectionId,
      },
      {
        title: 'Bowling',
        desc: 'Run-up rhythm, seam presentation, swing, and spin.',
        meta: countLabel(['Bowling']),
        img: CRICKIFY_IMAGES.fastBowling,
        target: 'academy-bowling' as NavSectionId,
      },
      {
        title: 'Fielding',
        desc: 'Split-step agility, clean catching, and direct throws.',
        meta: countLabel(['Fielding']),
        img: CRICKIFY_IMAGES.fieldingDive,
        target: 'academy-fielding' as NavSectionId,
      },
      {
        title: 'Wicketkeeping',
        desc: 'Crouched stance, glovework, and sharp stumpings.',
        meta: countLabel(['Wicketkeeping']),
        img: CRICKIFY_IMAGES.wicketkeeping,
        target: 'academy-wicketkeeping' as NavSectionId,
      },
      {
        title: 'Cricket Rules',
        desc: 'Creases, LBW, umpire signals, and match formats.',
        meta: countLabel(['Rules', 'Masterclass']),
        img: CRICKIFY_IMAGES.cricketPitch,
        target: 'academy-rules' as NavSectionId,
      },
      {
        title: 'Fitness & Training',
        desc: 'Cricket strength, sprint speed, mobility, and recovery.',
        meta: `${fitnessCount} drills`,
        img: CRICKIFY_IMAGES.fitnessStrengthMobility,
        target: 'fitness-hub' as NavSectionId,
      },
    ];
  }, []);

  const lessonPct = Math.min(
    100,
    Math.round((state.completedLessonIds.length / Math.max(1, CRICKET_LESSONS.length)) * 100)
  );
  const drillPct = Math.min(
    100,
    Math.round((state.completedExerciseIds.length / Math.max(1, CRICKET_EXERCISES.length)) * 100)
  );

  const entryCardPalettes = [
    { card: 'from-[#F6FCF5] to-[#E6F6E7] border-[#087F55]/25', iconBox: 'bg-[#087F55] text-white', cta: 'text-[#075E3F]' },
    { card: 'from-[#FAFCF6] to-[#EFF7E4] border-[#65A30D]/25', iconBox: 'bg-[#FF941F] text-[#101714]', cta: 'text-[#9A4200]' },
    { card: 'from-[#F4FBF9] to-[#E3F5EE] border-[#0D9488]/25', iconBox: 'bg-[#0D9488] text-white', cta: 'text-[#0F766E]' },
    { card: 'from-[#FAFDF6] to-[#EDF8EA] border-[#087F55]/25', iconBox: 'bg-[#EA580C] text-white', cta: 'text-[#9A3412]' },
    { card: 'from-[#F7FCF4] to-[#E9F7DF] border-[#4D7C0F]/25', iconBox: 'bg-[#3F6212] text-[#ECFCCB]', cta: 'text-[#365314]' },
  ];

  return (
    <div className="space-y-7 md:space-y-10 pb-10 text-[#102419]">
      {/* 1. Cinematic Floodlit Stadium Hero */}
      <HomepageHero onNavigate={onNavigate} onOpenOnboarding={onOpenOnboarding} />

      {/* Compact Guest Sign-In Bar */}
      {isGuest && onOpenAuth && (
        <section className="athletic-card rounded-2xl px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-semibold text-[#183827]">
            Sign in with Google to save your lessons, video feedback, and PlayZone scores across devices.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#087F55] hover:bg-[#103B2A] active:scale-[0.98] text-white text-xs font-extrabold transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 shadow-xs"
          >
            Continue with Google
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* 2. Quick Entry Paths */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#102419] uppercase leading-tight">
              ONE CONNECTED CRICKET JOURNEY
            </h2>
            <p className="text-sm text-[#395543] mt-1 font-medium">
              Learn fundamentals, practise drills, analyse your technique, and test your timing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SMART_ENTRY_PATHS.map((entry, idx) => {
            const Icon = entry.icon;
            const pal = entryCardPalettes[idx % entryCardPalettes.length];
            return (
              <button
                key={entry.title}
                type="button"
                onClick={() => onNavigate(entry.target)}
                className={`group bg-gradient-to-br ${pal.card} border athletic-card-hover rounded-2xl p-4 text-left flex flex-col justify-between gap-2.5 active:scale-[0.99] shadow-sm`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${pal.iconBox}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#17251A]/55 group-hover:text-[#087F55] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#102419] leading-tight">
                    {entry.title}
                  </h3>
                  <p className="text-xs text-[#2B4234] leading-relaxed font-medium">{entry.desc}</p>
                </div>
                <div className={`pt-1 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${pal.cta}`}>
                  <span>{entry.cta}</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Cricket Academy — Light White-Green Disciplines */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#102419] uppercase">
              CHOOSE YOUR LEARNING PATH
            </h2>
            <p className="text-sm text-[#395543] mt-0.5 font-medium">
              Step-by-step cricket lessons crafted for every role and skill level.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('academy-beginner')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#103B2A] hover:bg-[#087F55] active:scale-[0.98] text-xs font-extrabold text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all shadow-xs"
          >
            Browse Academy <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {academyPaths.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => onNavigate(item.target)}
              className="group ivory-academy-surface athletic-card-hover rounded-2xl sm:rounded-3xl overflow-hidden text-left flex flex-col justify-between active:scale-[0.99]"
            >
              <div>
                <div className="relative aspect-[16/10] bg-[#103B2A] overflow-hidden">
                  <img
                    src={item.img}
                    alt={`${item.title} cricket coaching module`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#0A1610]/90 via-[#0A1610]/25 to-transparent"
                  />
                  <span className="absolute bottom-2 left-2.5 sm:bottom-3 sm:left-4 text-[10px] sm:text-xs font-mono font-bold text-[#B7F34A]">
                    {item.meta}
                  </span>
                </div>
                <div className="p-3 sm:p-5 space-y-1">
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-[#102419] group-hover:text-[#087F55] transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-[#2C4537] leading-snug sm:leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>
              <div className="px-3 pb-3 sm:px-5 sm:pb-5 flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#087F55]">
                <span>START LEARNING</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 4 & 5. AI Coach (Speaking Robot + Chat) & Video Analysis (Cricket Net Capture) */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* AI Coach — AI Robot Speaking & Chatting Messages Background */}
        <div className="lg:col-span-6 coach-dark-panel relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 flex flex-col justify-between gap-6 min-h-[270px]">
          <img
            src={CRICKIFY_IMAGES.aiCoachRobot}
            alt="AI cricket coach robot speaking and chatting guidance messages"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-70"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(102deg, rgba(6, 26, 18, 0.94) 0%, rgba(9, 36, 25, 0.78) 54%, rgba(6, 26, 18, 0.28) 100%)',
            }}
          />
          {/* Animated Soundwave Voice Bars Accent */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-5 right-5 flex items-end gap-1 opacity-70 z-10"
          >
            <span className="w-1 h-3 rounded-full bg-[#B7F34A] animate-pulse" />
            <span className="w-1 h-5 rounded-full bg-[#B7F34A] animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-4 rounded-full bg-[#38BDF8] animate-pulse" style={{ animationDelay: '0.4s' }} />
            <span className="w-1 h-6 rounded-full bg-[#B7F34A] animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>

          <div className="relative z-10 space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-[0.98] drop-shadow-xs">
              YOUR PERSONAL AI CRICKET COACH
            </h2>
            <p className="text-sm sm:text-[15px] text-[#E6F4E7] leading-relaxed max-w-md drop-shadow-xs">
              Got a cricket question? Get instant AI-powered guidance on batting, bowling, fielding and match tactics. Learn, improve and play with confidence.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('coach-chat')}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] hover:-translate-y-0.5 active:scale-[0.98] text-[#0A1610] text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_10px_24px_-8px_rgba(183,243,74,0.55)]"
            >
              <Bot className="w-4 h-4" /> TALK TO AI COACH
            </button>
            <button
              type="button"
              onClick={() => onNavigate('coach-voice')}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-[#0C2F21]/80 hover:bg-[#134430] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wide border border-[#B7F34A]/40 inline-flex items-center gap-2 transition-all backdrop-blur-xs"
            >
              <Mic className="w-4 h-4 text-[#B7F34A]" /> TRY VOICE COACH
            </button>
          </div>
        </div>

        {/* Video Analysis — Practicing Cricket Video Capture Scene Background */}
        <div className="lg:col-span-6 studio-dark-panel relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 flex flex-col justify-between gap-6 min-h-[270px]">
          <img
            src={CRICKIFY_IMAGES.videoPracticeCapture}
            alt="Cricketer practicing shots in nets being recorded on video"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-72"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(102deg, rgba(10, 17, 15, 0.94) 0%, rgba(16, 27, 23, 0.78) 54%, rgba(10, 17, 15, 0.25) 100%)',
            }}
          />
          {/* Subtle Camera Viewfinder Corner Brackets */}
          <svg
            aria-hidden="true"
            viewBox="0 0 400 260"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-3 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] opacity-55 z-10"
          >
            <path d="M 18 4 L 4 4 L 4 18" fill="none" stroke="#FF941F" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 382 4 L 396 4 L 396 18" fill="none" stroke="#FF941F" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 18 256 L 4 256 L 4 242" fill="none" stroke="#FF941F" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 382 256 L 396 256 L 396 242" fill="none" stroke="#FF941F" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <div className="relative z-10 space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-[0.98] drop-shadow-xs">
              PERFECT YOUR GAME WITH AI
            </h2>
            <p className="text-sm sm:text-[15px] text-[#E6F4E7] leading-relaxed max-w-md drop-shadow-xs">
              Upload your batting or bowling video and get AI-powered feedback on your technique, helping you spot mistakes and improve every shot or delivery.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('practice-upload')}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#FF941F] hover:bg-[#ffa442] hover:-translate-y-0.5 active:scale-[0.98] text-[#101714] text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_10px_24px_-8px_rgba(255,148,31,0.55)]"
            >
              <Camera className="w-4 h-4" /> ANALYSE MY VIDEO
            </button>
          </div>
        </div>
      </motion.section>

      {/* 6. Training Planner & Progress Passport */}
      <section className="grid lg:grid-cols-12 gap-5 items-stretch">
        {/* Training Planner — Attractive Split Visual + Colorful Routine Blocks */}
        <div className="lg:col-span-6 training-clean-surface rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="grid sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#087F55]">
                <CalendarDays className="w-4 h-4" /> Weekly Routine Builder
              </div>
              <h2 className="font-display text-3xl font-extrabold text-[#102419] uppercase leading-[0.98]">
                BUILD YOUR WEEKLY ROUTINE
              </h2>
              <p className="text-sm text-[#2A4435] leading-relaxed">
                Generate realistic daily cricket drills and fitness sessions matched to your role, kit, and schedule.
              </p>
            </div>
            <div className="sm:col-span-5 relative aspect-[16/10] rounded-2xl overflow-hidden bg-[#103B2A] border border-[#087F55]/25 shadow-xs">
              <img
                src={CRICKIFY_IMAGES.fitnessConditioning}
                alt="Cricket conditioning and weekly training routine"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0A1610]/80 via-[#0A1610]/15 to-transparent"
              />
              <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-mono font-bold text-[#B7F34A]">
                {state.profile.dailyMinutes}m/day · {state.profile.trainingDaysPerWeek}d/wk
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { step: '01', label: 'Warm-Up', detail: 'Dynamic mobility', bg: 'bg-[#FFFFFF]/85 border-[#087F55]/20', num: 'text-[#075E3F]' },
              { step: '02', label: 'Skill Nets', detail: state.profile.role, bg: 'bg-[#F1FAE9] border-[#4D7C0F]/20', num: 'text-[#3F6212]' },
              { step: '03', label: 'Conditioning', detail: 'Sprint & core', bg: 'bg-[#FEF6E8] border-[#D96B00]/20', num: 'text-[#9A4200]' },
              { step: '04', label: 'Recovery', detail: 'Rest days built in', bg: 'bg-[#EEF9F5] border-[#087F55]/20', num: 'text-[#087F55]' },
            ].map((blk) => (
              <div
                key={blk.step}
                className={`rounded-2xl border p-3 space-y-0.5 shadow-2xs ${blk.bg}`}
              >
                <div className={`font-mono text-[11px] font-bold ${blk.num}`}>{blk.step}</div>
                <div className="text-xs font-extrabold text-[#102419] leading-tight">{blk.label}</div>
                <div className="text-[11px] text-[#2B4234] truncate">{blk.detail}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate('training-planner')}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#087F55] hover:bg-[#103B2A] hover:-translate-y-0.5 active:scale-[0.98] text-white text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <CalendarDays className="w-4 h-4" />
              <span>{state.activeTrainingPlan ? 'VIEW MY WEEKLY PLAN' : 'OPEN TRAINING PLANNER'}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('fitness-hub')}
              className="min-h-[42px] px-3 py-2 text-xs font-bold text-[#075E3F] hover:text-[#102419] inline-flex items-center gap-1 transition-colors"
            >
              <span>Browse Skill Drills</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Tracker — Light White-Green Surface with Clean Stat Tiles */}
        <div className="lg:col-span-6 athletic-card rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h2 className="font-display text-3xl font-extrabold text-[#102419] uppercase">
                TRACK EVERY MILESTONE
              </h2>
              <p className="text-sm text-[#395543]">
                Every lesson, drill, video report, and PlayZone match updates your live progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#E4F5E5] hover:bg-[#D2EED4] border border-[#087F55]/25 text-xs font-extrabold text-[#075E3F] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              View Progress <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-[#FFFFFF]/90 border border-[#087F55]/20 rounded-2xl p-3.5 text-[#102419] shadow-2xs space-y-2">
              <div className="font-mono text-2xl font-bold text-[#075E3F] tabular-nums">
                {state.completedLessonIds.length}
              </div>
              <div className="text-[11px] text-[#243E2E] font-bold">Lessons</div>
              <div className="h-1.5 rounded-full bg-[#DCEFE0] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#087F55] transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(8, lessonPct)}%` }}
                />
              </div>
            </div>
            <div className="bg-[#F4FBEA] border border-[#65A30D]/25 rounded-2xl p-3.5 text-[#102419] shadow-2xs space-y-2">
              <div className="font-mono text-2xl font-bold text-[#365314] tabular-nums">
                {state.completedExerciseIds.length}
              </div>
              <div className="text-[11px] text-[#2B4218] font-bold">Drills</div>
              <div className="h-1.5 rounded-full bg-[#DFECCB] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#397B32] transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(8, drillPct)}%` }}
                />
              </div>
            </div>
            <div className="bg-[#FEF7EA] border border-[#F59E0B]/25 rounded-2xl p-3.5 text-[#102419] shadow-2xs space-y-2">
              <div className="font-mono text-2xl font-bold text-[#9A4200] tabular-nums">
                {state.reports.length}
              </div>
              <div className="text-[11px] text-[#5C310C] font-bold">Reports</div>
              <div className="h-1.5 rounded-full bg-[#F5DFBA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#EA580C] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, state.reports.length * 20))}%` }}
                />
              </div>
            </div>
            <div className="bg-[#EEF9F5] border border-[#0D9488]/25 rounded-2xl p-3.5 text-[#102419] shadow-2xs space-y-2">
              <div className="font-mono text-2xl font-bold text-[#0F766E] tabular-nums">
                {(state.playzoneSessions || []).length}
              </div>
              <div className="text-[11px] text-[#17415A] font-bold">PlayZone</div>
              <div className="h-1.5 rounded-full bg-[#CDEAE2] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#0D9488] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, (state.playzoneSessions || []).length * 15))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Turf IQ, Match IQ & Squad Quiz */}
      <section className="space-y-4">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#102419] uppercase">
          TACTICAL &amp; MATCH TOOLS
        </h2>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {/* Turf IQ — Deep Emerald Pitch Green & Electric Lime */}
          <button
            type="button"
            onClick={() => onNavigate('turf-academy')}
            className="group bg-gradient-to-br from-[#0A2E1E] via-[#104A31] to-[#082418] border border-[#B7F34A]/40 shadow-xl text-white rounded-3xl overflow-hidden text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#B7F34A]/75 active:scale-[0.99]"
          >
            <div>
              <div className="relative aspect-[16/9] bg-[#0B261B] overflow-hidden">
                <img
                  src={CRICKIFY_IMAGES.turfBox}
                  alt="Indoor box and turf cricket pitch"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0A2E1E] via-[#0A2E1E]/25 to-transparent"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#B7F34A]">
                  <Target className="w-4 h-4" /> Turf IQ
                </div>
                <h3 className="font-display text-2xl font-bold text-white uppercase">
                  BOX CRICKET &amp; TURF TACTICS
                </h3>
                <p className="text-xs text-[#DCF0DF] leading-relaxed">
                  Customise box-net rules and get smart tennis-ball batting and bowling tactics.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 text-xs font-extrabold text-[#B7F34A] flex items-center gap-1">
              Open Turf IQ <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Match IQ — Deep Broadcast Cobalt Navy & Cyan/Amber */}
          <button
            type="button"
            onClick={() => onNavigate('match-scorecard')}
            className="group bg-gradient-to-br from-[#091A33] via-[#102B52] to-[#081529] border border-[#38BDF8]/40 shadow-xl text-white rounded-3xl overflow-hidden text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#38BDF8]/75 active:scale-[0.99]"
          >
            <div>
              <div className="relative aspect-[16/9] bg-[#081529] overflow-hidden">
                <img
                  src={CRICKIFY_IMAGES.matchPlayerScoreboard}
                  alt="Cricket player stats card and live broadcast match scoreboard"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-95 transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#091A33] via-[#091A33]/20 to-transparent"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#38BDF8]">
                  <BarChart3 className="w-4 h-4 text-[#FF941F]" /> Match IQ
                </div>
                <h3 className="font-display text-2xl font-bold text-white uppercase">
                  SCORECARD &amp; FIELD LAB
                </h3>
                <p className="text-xs text-[#DBEAFE] leading-relaxed">
                  Analyse scorecards, powerplay run rates, and interactive field placements.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 text-xs font-extrabold text-[#38BDF8] flex items-center gap-1">
              Launch Match IQ <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Quiz & Squad — Deep Royal Indigo-Plum & Championship Gold */}
          <div className="group bg-gradient-to-br from-[#23103A] via-[#351859] to-[#1A0B2B] border border-[#FBBF24]/45 shadow-xl text-white rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-[#FBBF24]/80">
            <button
              type="button"
              onClick={() => onNavigate('dev-quiz')}
              className="text-left w-full focus:outline-none"
            >
              <div className="relative aspect-[16/9] bg-[#1A0B2B] overflow-hidden">
                <img
                  src={CRICKIFY_IMAGES.cricketQuizRules}
                  alt="Cricket rules handbook, umpire signal card, and cricket quiz trophy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-95 transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#23103A] via-[#23103A]/20 to-transparent"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FDE047]">
                  <Users className="w-4 h-4" /> Quiz &amp; Squad
                </div>
                <h3 className="font-display text-2xl font-bold text-white group-hover:text-[#FDE047] transition-colors uppercase">
                  CRICKET QUIZ &amp; SQUAD MODE
                </h3>
                <p className="text-xs text-[#EDE9FE] leading-relaxed">
                  Test your cricket rules IQ, unlock milestones, and assign squad drills.
                </p>
              </div>
            </button>
            <div className="px-5 pb-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onNavigate('dev-quiz')}
                className="text-xs font-extrabold text-[#FDE047] hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <span>Take Cricket Quiz</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('coach-academy-mode')}
                className="text-xs font-extrabold text-[#FDBA74] hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                <span>Open Squad Mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PlayZone — Immersive Dark Gaming Arena */}
      <section className="relative rounded-3xl overflow-hidden stadium-dark-panel text-white p-6 sm:p-9 lg:p-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#B7F34A]/18 blur-3xl animate-floodlight-pulse"
        />

        <div className="relative z-10 grid lg:grid-cols-12 gap-7 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[0.95] uppercase">
              TIME TO TAKE THE CREASE.
            </h2>
            <p className="text-sm sm:text-base text-[#DCEADC] max-w-xl leading-relaxed">
              Watch the delivery travel down the pitch, nail your shot timing, and smash Fours and Sixes under the stadium lights.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => onNavigate('playzone-batting')}
                className="min-h-[50px] px-8 py-3.5 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] hover:-translate-y-0.5 active:scale-[0.98] text-[#0A1610] text-sm font-extrabold uppercase tracking-wider shadow-[0_12px_30px_-8px_rgba(183,243,74,0.65)] transition-all inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY NOW</span>
              </button>
            </div>
          </div>

          {/* Animated Cricket Ball & Stadium Pitch Graphic */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] aspect-[4/3] rounded-3xl bg-[#07140C] border border-[#B7F34A]/30 p-4 flex items-center justify-center overflow-hidden shadow-inner">
              <svg viewBox="0 0 280 200" className="w-full h-full" aria-hidden="true">
                <ellipse cx="140" cy="110" rx="126" ry="78" fill="#0F301D" stroke="#087F55" strokeOpacity="0.45" strokeWidth="1.5" />
                <polygon points="118,32 162,32 190,178 90,178" fill="#C4AD7E" fillOpacity="0.88" />
                <line x1="84" y1="154" x2="196" y2="154" stroke="#FFFFFF" strokeWidth="2" />
                <ellipse
                  cx="140"
                  cy="154"
                  rx="24"
                  ry="8"
                  fill="#B7F34A"
                  fillOpacity="0.24"
                  stroke="#B7F34A"
                  strokeWidth="2"
                  className="animate-neon-ring"
                />
                <line x1="133" y1="162" x2="133" y2="184" stroke="#F6C873" strokeWidth="2.5" />
                <line x1="140" y1="162" x2="140" y2="184" stroke="#F6C873" strokeWidth="2.5" />
                <line x1="147" y1="162" x2="147" y2="184" stroke="#F6C873" strokeWidth="2.5" />
                <path
                  d="M 140 38 Q 134 106 140 152"
                  fill="none"
                  stroke="#B7F34A"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  className="animate-ball-trail"
                />
              </svg>

              <div className="absolute right-6 top-6 w-16 h-16 animate-ball-float">
                <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]">
                  <defs>
                    <radialGradient id="pz-promo-ball" cx="32%" cy="28%" r="72%">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="55%" stopColor="#B91C1C" />
                      <stop offset="100%" stopColor="#450A0A" />
                    </radialGradient>
                  </defs>
                  <circle cx="32" cy="32" r="24" fill="url(#pz-promo-ball)" />
                  <path
                    d="M 14 20 Q 32 32 50 44"
                    fill="none"
                    stroke="#FAF6EB"
                    strokeWidth="2.5"
                    strokeDasharray="3.5 3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Light White-Green Final Call-to-Action */}
      <section className="training-clean-surface rounded-3xl p-7 sm:p-9 text-center space-y-4">
        <Trophy className="w-9 h-9 text-[#FF941F] mx-auto" />
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#102419] uppercase">
          READY TO STEP ONTO THE PITCH?
        </h2>
        <p className="text-sm sm:text-base text-[#395543] max-w-lg mx-auto font-medium">
          Open your player dashboard to track lessons, drills, and upcoming practice goals.
        </p>
        <div>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="min-h-[46px] px-7 py-3 rounded-2xl bg-[#087F55] hover:bg-[#103B2A] hover:-translate-y-0.5 active:scale-[0.98] text-white text-sm font-extrabold uppercase tracking-wide transition-all whitespace-nowrap inline-flex items-center gap-2 shadow-sm"
          >
            OPEN MY DASHBOARD <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 10. High-Contrast CRICKIFY AI Footer */}
      <footer className="border-t border-[#087F55]/18 pt-6 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-[#3E5847]">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 text-center sm:text-left">
          <div className="flex flex-wrap items-baseline justify-center sm:justify-start gap-x-2">
            <span className="font-display text-base font-bold text-[#102419]">
              CRICKIFY <span className="text-[#087F55]">AI</span>
            </span>
            <span className="font-medium tracking-wide">OWN THE CREASE. MASTER THE GAME.</span>
          </div>
          <span className="hidden sm:inline text-[#087F55]/45" aria-hidden="true">·</span>
          <span className="text-[11px] sm:text-xs text-[#3E5847]">
            An initiative by{' '}
            <a
              href="https://www.linkedin.com/in/sahiljain0006/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#103B2A] underline decoration-[#087F55]/50 underline-offset-2 hover:text-[#087F55] hover:decoration-[#087F55] transition-colors"
            >
              Sahil Jain
            </a>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={() => onNavigate('academy-rules')} className="hover:text-[#087F55] font-semibold transition-colors">
            Cricket Rules
          </button>
          <button type="button" onClick={() => onNavigate('playzone-batting')} className="hover:text-[#087F55] font-semibold transition-colors">
            PlayZone
          </button>
          <button type="button" onClick={() => onNavigate('fitness-recovery')} className="hover:text-[#087F55] font-semibold transition-colors">
            Safety &amp; Recovery
          </button>
          <button type="button" onClick={() => onNavigate('coach-academy-mode')} className="hover:text-[#087F55] font-semibold transition-colors">
            Coach Mode
          </button>
          <button type="button" onClick={() => onNavigate('dev-profile')} className="hover:text-[#087F55] font-semibold transition-colors">
            Profile Settings
          </button>
        </div>
      </footer>
    </div>
  );
};
