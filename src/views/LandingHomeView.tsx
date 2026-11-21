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
  target: NavSectionId;
  accent: 'green' | 'amber';
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    title: 'Start with Foundations',
    desc: 'Learn batting grip, pitch basics, and rules step by step.',
    target: 'academy-beginner',
    accent: 'green',
    icon: Compass,
  },
  {
    title: 'Explore Academy',
    desc: 'Sharpen drives, bowling release, and sharp fielding.',
    target: 'academy-batting',
    accent: 'amber',
    icon: BookOpen,
  },
  {
    title: 'Ask the AI Coach',
    desc: 'Get instant cricket guidance on shots, bowling, and tactics.',
    target: 'coach-chat',
    accent: 'green',
    icon: Bot,
  },
  {
    title: 'Analyse Practice Video',
    desc: 'Upload a net clip for clear AI movement feedback.',
    target: 'practice-upload',
    accent: 'amber',
    icon: Camera,
  },
  {
    title: 'Enter PlayZone',
    desc: 'Step up to the crease and smash boundaries in timing mode.',
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

  return (
    <div className="space-y-8 md:space-y-10 pb-10 text-[#17251A]">
      {/* 1. Cinematic Floodlit Stadium Hero */}
      <HomepageHero onNavigate={onNavigate} onOpenOnboarding={onOpenOnboarding} />

      {/* Compact Guest Sign-In Bar */}
      {isGuest && onOpenAuth && (
        <section className="ivory-academy-surface rounded-2xl px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-semibold text-[#17251A]">
            Sign in with Google to save your lessons, video feedback, and PlayZone scores across devices.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#103B2A] hover:bg-[#087F55] active:scale-[0.98] text-white text-xs font-bold transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2"
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
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#17251A] uppercase leading-tight">
              ONE CONNECTED CRICKET JOURNEY
            </h2>
            <p className="text-sm text-[#55635B] mt-1">
              Learn fundamentals, practise drills, analyse your technique, and test your timing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SMART_ENTRY_PATHS.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                key={entry.title}
                type="button"
                onClick={() => onNavigate(entry.target)}
                className="group athletic-card athletic-card-hover rounded-2xl p-4 text-left flex flex-col justify-between gap-2.5 active:scale-[0.99]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        entry.accent === 'amber'
                          ? 'bg-[#FFF3E3] text-[#D96B00]'
                          : 'bg-[#EDF5EE] text-[#087F55]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#5C6B5F] group-hover:text-[#087F55] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#17251A] leading-tight">
                    {entry.title}
                  </h3>
                  <p className="text-xs text-[#55635B] leading-relaxed">{entry.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Cricket Academy — Emerald & Warm Ivory Identity */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#17251A] uppercase">
              CHOOSE YOUR LEARNING PATH
            </h2>
            <p className="text-sm text-[#55635B] mt-0.5">
              Step-by-step cricket lessons crafted for every role and skill level.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('academy-beginner')}
            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#103B2A] hover:bg-[#087F55] active:scale-[0.98] text-xs font-bold text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all"
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
                  <h3 className="font-display text-lg sm:text-2xl font-bold text-[#101714] group-hover:text-[#087F55] transition-colors leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-[#55635B] leading-snug sm:leading-relaxed line-clamp-2">
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

      {/* 4 & 5. Simplified AI Coach & Video Analysis Showcase */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* AI Coach — Deep Forest Green + Electric Lime */}
        <div className="lg:col-span-6 coach-dark-panel relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#B7F34A]/14 blur-3xl animate-floodlight-pulse"
          />
          <div className="relative z-10 space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-[0.98]">
              YOUR PERSONAL AI CRICKET COACH
            </h2>
            <p className="text-sm sm:text-[15px] text-[#E3EFE4] leading-relaxed max-w-lg">
              Got a cricket question? Get instant AI-powered guidance on batting, bowling, fielding and match tactics. Learn, improve and play with confidence.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('coach-chat')}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] hover:-translate-y-0.5 active:scale-[0.98] text-[#0A1610] text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_10px_24px_-8px_rgba(183,243,74,0.5)]"
            >
              <Bot className="w-4 h-4" /> TALK TO AI COACH
            </button>
            <button
              type="button"
              onClick={() => onNavigate('coach-voice')}
              className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-white/12 hover:bg-white/22 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wide border border-white/22 inline-flex items-center gap-2 transition-all"
            >
              <Mic className="w-4 h-4 text-[#B7F34A]" /> TRY VOICE COACH
            </button>
          </div>
        </div>

        {/* Video Analysis — Midnight Charcoal + Energetic Orange */}
        <div className="lg:col-span-6 studio-dark-panel relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FF941F]/16 blur-3xl animate-floodlight-pulse"
          />
          <div className="relative z-10 space-y-3">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase leading-[0.98]">
              PERFECT YOUR GAME WITH AI
            </h2>
            <p className="text-sm sm:text-[15px] text-[#E3EFE4] leading-relaxed max-w-lg">
              Upload your batting or bowling video and get AI-powered feedback on your technique, helping you spot mistakes and improve every shot or delivery.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('practice-upload')}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#FF941F] hover:bg-[#ffa442] hover:-translate-y-0.5 active:scale-[0.98] text-[#101714] text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-2 transition-all shadow-[0_10px_24px_-8px_rgba(255,148,31,0.5)]"
            >
              <Camera className="w-4 h-4" /> ANALYSE MY VIDEO
            </button>
          </div>
        </div>
      </motion.section>

      {/* 6. Training Planner & Progress Passport */}
      <section className="grid lg:grid-cols-12 gap-5 items-stretch">
        {/* Training Planner — Fresh Green & Clean Ivory */}
        <div className="lg:col-span-6 training-clean-surface rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="space-y-2.5">
            <h2 className="font-display text-3xl font-extrabold text-[#17251A] uppercase">
              BUILD YOUR WEEKLY ROUTINE
            </h2>
            <p className="text-sm text-[#55635B] leading-relaxed">
              Generate realistic daily cricket drills and fitness routines matched to your role, equipment, and schedule.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('training-planner')}
              className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[#087F55] hover:bg-[#103B2A] hover:-translate-y-0.5 active:scale-[0.98] text-white text-xs font-extrabold uppercase tracking-wide inline-flex items-center gap-2 transition-all"
            >
              <CalendarDays className="w-4 h-4" /> OPEN TRAINING PLANNER
            </button>
          </div>
        </div>

        {/* Progress Tracker — Pitch Green */}
        <div className="lg:col-span-6 turf-arena-panel text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <h2 className="font-display text-3xl font-extrabold text-white uppercase">
                TRACK EVERY MILESTONE
              </h2>
              <p className="text-sm text-[#DCEADC]">
                Every lesson, drill, video report, and PlayZone match updates your live progress.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/12 hover:bg-white/22 text-xs font-bold text-[#B7F34A] inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
            >
              View Progress <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-white rounded-2xl p-3.5 text-[#17251A] shadow-sm space-y-2">
              <div className="font-mono text-2xl font-bold text-[#087F55] tabular-nums">
                {state.completedLessonIds.length}
              </div>
              <div className="text-[11px] text-[#55635B] font-semibold">Lessons</div>
              <div className="h-1.5 rounded-full bg-[#E6ECE1] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#087F55] transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(8, lessonPct)}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3.5 text-[#17251A] shadow-sm space-y-2">
              <div className="font-mono text-2xl font-bold text-[#087F55] tabular-nums">
                {state.completedExerciseIds.length}
              </div>
              <div className="text-[11px] text-[#55635B] font-semibold">Drills</div>
              <div className="h-1.5 rounded-full bg-[#E6ECE1] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#397B32] transition-all duration-700 ease-out"
                  style={{ width: `${Math.max(8, drillPct)}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3.5 text-[#17251A] shadow-sm space-y-2">
              <div className="font-mono text-2xl font-bold text-[#D96B00] tabular-nums">
                {state.reports.length}
              </div>
              <div className="text-[11px] text-[#55635B] font-semibold">Reports</div>
              <div className="h-1.5 rounded-full bg-[#F7ECDD] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF941F] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, state.reports.length * 20))}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3.5 text-[#17251A] shadow-sm space-y-2">
              <div className="font-mono text-2xl font-bold text-[#103B2A] tabular-nums">
                {(state.playzoneSessions || []).length}
              </div>
              <div className="text-[11px] text-[#55635B] font-semibold">PlayZone</div>
              <div className="h-1.5 rounded-full bg-[#E6ECE1] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#103B2A] transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, (state.playzoneSessions || []).length * 15))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Turf IQ, Match IQ & Squad Quiz */}
      <section className="space-y-4">
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#17251A] uppercase">
          TACTICAL &amp; MATCH TOOLS
        </h2>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
          {/* Turf IQ — Cricket Pitch Green */}
          <button
            type="button"
            onClick={() => onNavigate('turf-academy')}
            className="group turf-arena-panel text-white rounded-3xl overflow-hidden text-left flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 active:scale-[0.99]"
          >
            <div>
              <div className="relative aspect-[16/9] bg-[#0B261B] overflow-hidden">
                <img
                  src={CRICKIFY_IMAGES.turfBox}
                  alt="Indoor box and turf cricket pitch"
                  className="w-full h-full object-cover opacity-85 transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0A281C] via-transparent to-transparent"
                />
              </div>
              <div className="p-5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#B7F34A]">
                  <Target className="w-4 h-4" /> Turf IQ
                </div>
                <h3 className="font-display text-2xl font-bold text-white uppercase">
                  BOX CRICKET &amp; TURF TACTICS
                </h3>
                <p className="text-xs text-[#DCEADC] leading-relaxed">
                  Customise box-net rules and get smart tennis-ball batting and bowling tactics.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 text-xs font-bold text-[#B7F34A] flex items-center gap-1">
              Open Turf IQ <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Match IQ — Scoreboard Dark */}
          <button
            type="button"
            onClick={() => onNavigate('match-scorecard')}
            className="group scoreboard-dark-panel text-white rounded-3xl p-6 text-left flex flex-col justify-between gap-5 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.99]"
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#FF941F]">
                <BarChart3 className="w-4 h-4" /> Match IQ
              </div>
              <h3 className="font-display text-2xl font-bold text-white uppercase">
                SCORECARD &amp; FIELD LAB
              </h3>
              <p className="text-xs text-[#D3E0D6] leading-relaxed">
                Analyse scorecards, powerplay run rates, and interactive field placements.
              </p>
            </div>
            <div className="text-xs font-bold text-[#B7F34A] flex items-center gap-1">
              Launch Match IQ <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Quiz & Squad — Emerald & Warm Ivory */}
          <button
            type="button"
            onClick={() => onNavigate('dev-quiz')}
            className="group ivory-academy-surface athletic-card-hover rounded-3xl p-6 text-left flex flex-col justify-between gap-5 active:scale-[0.99]"
          >
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#087F55]">
                <Users className="w-4 h-4" /> Quiz &amp; Squad
              </div>
              <h3 className="font-display text-2xl font-bold text-[#17251A] uppercase">
                CRICKET QUIZ &amp; CHALLENGES
              </h3>
              <p className="text-xs text-[#55635B] leading-relaxed">
                Test your rules knowledge, complete skill milestones, and manage squad drills.
              </p>
            </div>
            <div className="text-xs font-bold text-[#087F55] flex items-center gap-1">
              Explore Quiz <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
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

      {/* 9. Clean Final Call-to-Action */}
      <section className="ivory-academy-surface rounded-3xl p-7 sm:p-9 text-center space-y-4">
        <Trophy className="w-9 h-9 text-[#FF941F] mx-auto" />
        <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#17251A] uppercase">
          READY TO STEP ONTO THE PITCH?
        </h2>
        <p className="text-sm sm:text-base text-[#55635B] max-w-lg mx-auto">
          Open your player dashboard to track lessons, drills, and upcoming practice goals.
        </p>
        <div>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="min-h-[46px] px-7 py-3 rounded-2xl bg-[#103B2A] hover:bg-[#087F55] hover:-translate-y-0.5 active:scale-[0.98] text-white text-sm font-extrabold uppercase tracking-wide transition-all whitespace-nowrap inline-flex items-center gap-2"
          >
            OPEN MY DASHBOARD <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 10. Quiet CRICKIFY Footer */}
      <footer className="border-t border-[#087F55]/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#55635B]">
        <div>
          <span className="font-display text-base font-bold text-[#17251A] mr-2">CRICKIFY</span>
          <span>OWN THE CREASE. MASTER THE GAME.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={() => onNavigate('academy-rules')} className="hover:text-[#087F55] font-semibold">
            Cricket Rules
          </button>
          <button type="button" onClick={() => onNavigate('playzone-batting')} className="hover:text-[#087F55] font-semibold">
            PlayZone
          </button>
          <button type="button" onClick={() => onNavigate('fitness-recovery')} className="hover:text-[#087F55] font-semibold">
            Safety &amp; Recovery
          </button>
          <button type="button" onClick={() => onNavigate('coach-academy-mode')} className="hover:text-[#087F55] font-semibold">
            Coach Mode
          </button>
          <button type="button" onClick={() => onNavigate('dev-profile')} className="hover:text-[#087F55] font-semibold">
            Profile Settings
          </button>
        </div>
      </footer>
    </div>
  );
};
