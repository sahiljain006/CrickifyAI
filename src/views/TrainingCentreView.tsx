import React, { useMemo, useState } from 'react';
import { CheckCircle2, Dumbbell, Loader2, Play, ShieldAlert, Timer } from 'lucide-react';
import { ExerciseItem, NavSectionId, PitchIQState, TrainingPlan, TrainingSessionBlock } from '../types';
import { CRICKET_EXERCISES } from '../data/exercises';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { authFetch } from '../lib/firebase';
import { parseApiJsonResponse } from '../lib/apiResponse';

interface TrainingCentreViewProps {
  section: NavSectionId;
  state: PitchIQState;
  onOpenExercise: (id: string) => void;
  onSaveTrainingPlan: (plan: TrainingPlan) => void;
  onLogSession: (title: string, durationMinutes: number, exerciseIds: string[], notes: string) => void;
}

function getExerciseCardImage(category: ExerciseItem['category']): string {
  switch (category) {
    case 'Batting':
      return CRICKIFY_IMAGES.battingDrive;
    case 'Bowling':
      return CRICKIFY_IMAGES.fastBowling;
    case 'Fielding':
      return CRICKIFY_IMAGES.fieldingDive;
    case 'Speed & Agility':
      return CRICKIFY_IMAGES.fitnessSpeedAgility;
    case 'Strength':
    case 'Mobility & Flexibility':
    case 'Core Stability':
      return CRICKIFY_IMAGES.fitnessStrengthMobility;
    case 'Stamina':
    case 'Recovery':
    default:
      return CRICKIFY_IMAGES.fitnessConditioning;
  }
}

const DISCIPLINE_SHOWCASE = [
  { label: 'Batting', title: 'Batting Timing', image: CRICKIFY_IMAGES.battingDrive },
  { label: 'Bowling', title: 'Bowling Accuracy', image: CRICKIFY_IMAGES.fastBowling },
  { label: 'Fielding', title: 'Fielding Agility', image: CRICKIFY_IMAGES.fieldingDive },
  { label: 'Strength', title: 'Cricket Power', image: CRICKIFY_IMAGES.fitnessStrengthMobility },
  { label: 'Speed & Agility', title: 'Sprint & Reaction', image: CRICKIFY_IMAGES.fitnessSpeedAgility },
  { label: 'Stamina', title: 'Match Endurance', image: CRICKIFY_IMAGES.fitnessConditioning },
] as const;

export const TrainingCentreView: React.FC<TrainingCentreViewProps> = ({
  section,
  state,
  onOpenExercise,
  onSaveTrainingPlan,
  onLogSession,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    switch (section) {
      case 'exercises-batting': return 'Batting';
      case 'exercises-bowling': return 'Bowling';
      case 'exercises-fielding': return 'Fielding';
      case 'fitness-strength': return 'Strength';
      case 'fitness-stamina': return 'Stamina';
      case 'fitness-speed': return 'Speed & Agility';
      case 'fitness-mobility': return 'Mobility & Flexibility';
      case 'fitness-recovery': return 'Recovery';
      default: return 'All';
    }
  });

  // Planner State
  const [weakness, setWeakness] = useState('Timing on front-foot drives & stamina');
  const [goal, setGoal] = useState(state.profile.goals[0] || 'Improve Timing and Match Stamina');
  const [dailyMinutes, setDailyMinutes] = useState(state.profile.dailyMinutes || 45);
  const [daysPerWeek, setDaysPerWeek] = useState(state.profile.trainingDaysPerWeek || 4);
  const [location, setLocation] = useState('Home / Nets / Local Park');
  const [currentWorkload, setCurrentWorkload] = useState('Moderate (2 weekend matches/month)');
  const [recoveryAvailability] = useState('Full rest days available');
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [plannerError, setPlannerError] = useState<string | null>(null);

  // Live Guided Session Runner
  const [runningBlocks, setRunningBlocks] = useState<TrainingSessionBlock[] | null>(null);
  const [completedBlocks, setCompletedBlocks] = useState<Record<number, boolean>>({});
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionLoggedMsg, setSessionLoggedMsg] = useState<string | null>(null);

  const categories = [
    'All',
    'Batting',
    'Bowling',
    'Fielding',
    'Strength',
    'Stamina',
    'Speed & Agility',
    'Mobility & Flexibility',
    'Core Stability',
    'Recovery',
  ];

  const filteredExercises = useMemo(() => {
    if (section === 'fitness-hub' && selectedCategory === 'All') {
      return CRICKET_EXERCISES.filter((e) =>
        ['Strength', 'Stamina', 'Speed & Agility', 'Mobility & Flexibility', 'Core Stability', 'Recovery'].includes(e.category)
      );
    }
    if (selectedCategory === 'All') return CRICKET_EXERCISES;
    return CRICKET_EXERCISES.filter((e) => e.category === selectedCategory);
  }, [section, selectedCategory]);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingPlan(true);
    setPlannerError(null);
    try {
      const res = await authFetch('/api/planner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ageGroup: state.profile.ageGroup,
          role: state.profile.role,
          skillLevel: state.profile.skillLevel,
          weakness,
          goal,
          dailyMinutes,
          daysPerWeek,
          equipment: state.profile.equipment,
          location,
          currentWorkload,
          recoveryAvailability,
          availableExercises: CRICKET_EXERCISES.map((ex) => ({ id: ex.id, name: ex.name, category: ex.category })),
        }),
      });
      const data = await parseApiJsonResponse<{
        error?: string;
        workloadNote?: string;
        dailyRoutine?: TrainingPlan['dailyRoutine'];
        weeklySchedule?: TrainingPlan['weeklySchedule'];
      }>(res, '/api/planner/generate', 'Planner service error', false);
      if (!res.ok) throw new Error(data.error || 'Could not generate training plan.');

      const plan: TrainingPlan = {
        id: `plan-${Date.now()}`,
        createdAt: new Date().toISOString(),
        goal,
        dailyMinutes,
        daysPerWeek,
        workloadNote: data.workloadNote || '',
        dailyRoutine: data.dailyRoutine || [],
        weeklySchedule: data.weeklySchedule || [],
      };
      onSaveTrainingPlan(plan);
    } catch (err) {
      setPlannerError(err instanceof Error ? err.message : 'Unable to generate training plan.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  if (section === 'training-planner') {
    const plan = state.activeTrainingPlan;
    return (
      <div className="space-y-8">
        <div className="training-clean-surface rounded-3xl p-7 md:p-10 grid lg:grid-cols-12 gap-6 items-center shadow-xs">
          <div className="lg:col-span-7 space-y-2.5">
            <div className="text-xs font-bold text-[#087F55] uppercase tracking-wider">
              Athletic Calendar · Daily &amp; Weekly Routine
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-[#17251A]">
              Personal AI Training Planner
            </h1>
            <p className="text-sm text-[#5C6B5F]">
              Generates realistic routines matching your age group ({state.profile.ageGroup}), role ({state.profile.role}), equipment, workload, and recovery days.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-[#17251A]">
              <span>1. Set Schedule &amp; Focus</span>
              <span aria-hidden="true" className="text-[#087F55]">·</span>
              <span>2. Generate Weekly Plan</span>
              <span aria-hidden="true" className="text-[#087F55]">·</span>
              <span>3. Track Daily Blocks</span>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-3">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[#087F55]/18 bg-[#103B2A]">
              <img
                src={CRICKIFY_IMAGES.fitnessSpeedAgility}
                alt="Cricket weekly training and agility routine"
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0A1610]/75 via-transparent to-transparent"
              />
            </div>
            <div className="bg-[#ECFAEE] border border-[#087F55]/25 rounded-2xl p-3.5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase text-[#68766A]">Target / Day</div>
                <div className="font-mono text-2xl font-bold text-[#397B32] tabular-nums">{dailyMinutes}m</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase text-[#68766A]">Weekly Cadence</div>
                <div className="font-mono text-2xl font-bold text-[#17251A] tabular-nums">{daysPerWeek}d</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleGeneratePlan} className="athletic-card rounded-2xl p-6 space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Primary Focus / Weakness</label>
              <input
                type="text"
                value={weakness}
                onChange={(e) => setWeakness(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm text-[#17251A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Training Goal</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm text-[#17251A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Training Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm text-[#17251A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">
                Available Time / Day: <span className="font-mono text-[#397B32] tabular-nums">{dailyMinutes} min</span>
              </label>
              <input
                type="range"
                min={20}
                max={120}
                step={5}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="w-full accent-[#397B32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">
                Days Per Week: <span className="font-mono text-[#397B32] tabular-nums">{daysPerWeek} days</span>
              </label>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className="w-full accent-[#397B32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Current Workload</label>
              <input
                type="text"
                value={currentWorkload}
                onChange={(e) => setCurrentWorkload(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm text-[#17251A]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#17251A]/8">
            <div className="text-xs text-[#68766A]">
              Recovery: <strong className="text-[#17251A]">{recoveryAvailability}</strong> · Equipment:{' '}
              {state.profile.equipment.join(', ')}
            </div>
            <button
              type="submit"
              disabled={generatingPlan}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25] transition-colors disabled:opacity-50"
            >
              {generatingPlan && <Loader2 className="w-4 h-4 animate-spin" />}
              {plan ? 'Regenerate Personalised Plan' : 'Generate Personalised Plan'}
            </button>
          </div>
          {plannerError && <div className="text-xs text-[#B91C1C] font-medium">{plannerError}</div>}
        </form>

        {plan && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FF941F]/40 flex items-start gap-3 text-xs text-[#7C2D12]">
              <ShieldAlert className="w-4 h-4 text-[#FF941F] shrink-0 mt-0.5" />
              <div>
                <strong>Workload &amp; Safety Guidance:</strong> {plan.workloadNote}
              </div>
            </div>

            {/* Daily Routine */}
            <div className="athletic-card rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#153D25]">
                    Today&apos;s {plan.dailyMinutes}-Minute Training Routine
                  </h2>
                  <p className="text-xs text-[#68766A]">Goal: {plan.goal}</p>
                </div>
                <button
                  onClick={() => {
                    setRunningBlocks(plan.dailyRoutine);
                    setCompletedBlocks({});
                    setSessionLoggedMsg(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#A8D94E] text-[#153D25] text-xs font-bold hover:bg-[#95c93a] transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Start Training Session
                </button>
              </div>

              <div className="space-y-2.5">
                {plan.dailyRoutine.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#F8FAF2] border border-[#17251A]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono text-[#397B32] font-semibold">
                        <span>0{block.order}.</span>
                        <span>{block.durationMinutes} min</span>
                        <span>· {block.focus}</span>
                      </div>
                      <div className="font-display text-xl font-bold text-[#17251A]">{block.title}</div>
                      <p className="text-xs text-[#68766A]">{block.instructions}</p>
                    </div>
                    {block.exerciseId && CRICKET_EXERCISES.some((e) => e.id === block.exerciseId) && (
                      <button
                        onClick={() => onOpenExercise(block.exerciseId!)}
                        className="px-3.5 py-2 rounded-xl bg-[#ECFAEE] border border-[#087F55]/25 text-xs font-semibold text-[#102419] hover:bg-[#D5F1DC] whitespace-nowrap shrink-0"
                      >
                        View Exercise Guide
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Active Session Tracker */}
            {runningBlocks && (
              <div className="athletic-card rounded-3xl p-6 space-y-4 border-2 border-[#397B32]/30">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#397B32] text-xs font-bold uppercase tracking-wider">
                    <Timer className="w-4 h-4" /> Active Training Session Checklist
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#397B32] tabular-nums">
                      {Object.values(completedBlocks).filter(Boolean).length}/{runningBlocks.length} Done
                    </span>
                    <button
                      onClick={() => setRunningBlocks(null)}
                      className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold text-[#68766A] hover:text-[#17251A] hover:bg-[#EDF3E8]"
                    >
                      Close Runner
                    </button>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[#EDF3E8] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#397B32] to-[#B7F34A] rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.round(
                        (Object.values(completedBlocks).filter(Boolean).length / Math.max(1, runningBlocks.length)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  {runningBlocks.map((b, i) => (
                    <label
                      key={i}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        completedBlocks[i]
                          ? 'bg-[#EDF5EE] border-[#087F55]/35'
                          : 'bg-[#F7FAF3] border-[#17251A]/8 hover:bg-[#EDF3E8]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!completedBlocks[i]}
                        onChange={() => setCompletedBlocks((p) => ({ ...p, [i]: !p[i] }))}
                        className="mt-1 accent-[#397B32]"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-[#17251A]">
                          {b.title} ({b.durationMinutes} min)
                        </div>
                        <div className="text-[#68766A] mt-0.5">{b.instructions}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Session reflection notes (how did timing, balance, or stamina feel?)"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl bg-[#F7FAF3] border border-[#17251A]/12 text-xs text-[#17251A] placeholder:text-[#68766A] focus:outline-none focus:ring-2 focus:ring-[#397B32]"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-[#397B32] font-semibold">{sessionLoggedMsg}</span>
                  <button
                    onClick={() => {
                      const exIds = runningBlocks.map((b) => b.exerciseId).filter((v): v is string => Boolean(v));
                      onLogSession(`Custom Plan: ${plan.goal}`, plan.dailyMinutes, exIds, sessionNotes);
                      setSessionLoggedMsg('Session saved to Training History!');
                    }}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Complete &amp; Save Session
                  </button>
                </div>
              </div>
            )}

            {/* 7-Day Weekly Schedule */}
            <div className="athletic-card rounded-2xl p-6 space-y-4">
              <h2 className="font-display text-2xl font-bold text-[#153D25]">Weekly 7-Day Schedule</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plan.weeklySchedule.map((day, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border space-y-2 ${
                      day.isRecovery
                        ? 'bg-[#EDF1E7] border-[#17251A]/10'
                        : 'bg-[#F8FAF2] border-[#397B32]/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-[#17251A]">{day.day}</span>
                      <span className="text-[#397B32] font-semibold tabular-nums">
                        {day.isRecovery ? 'Recovery' : `${day.durationMinutes} min`}
                      </span>
                    </div>
                    <div className="font-display text-lg font-bold text-[#153D25]">{day.theme}</div>
                    <ul className="space-y-1 text-xs text-[#68766A]">
                      {day.blocks.map((blk, bIdx) => (
                        <li key={bIdx}>• {blk.title} ({blk.durationMinutes}m)</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bright Clean Athletic Training Centre Header */}
      <div className="training-clean-surface rounded-3xl p-7 md:p-10 grid lg:grid-cols-12 gap-6 items-center shadow-xs">
        <div className="lg:col-span-8 space-y-2.5">
          <div className="text-xs font-bold text-[#087F55] uppercase tracking-wider">
            CRICKIFY AI Cricket Training Centre
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-[#17251A]">
            Skill Drills &amp; Cricket Physical Conditioning
          </h1>
          <p className="text-sm text-[#5C6B5F] max-w-2xl">
            Every exercise teaches exact starting posture, execution steps, sets, reps, rest times, easier/harder variations, and injury-prevention guidance.
          </p>
        </div>
        <div className="lg:col-span-4 aspect-[16/9] rounded-2xl overflow-hidden border border-[#087F55]/15">
          <img
            src={CRICKIFY_IMAGES.fitnessStrengthMobility}
            alt="Cricket fitness and skill drills"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Photographic Discipline Quick-Select Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DISCIPLINE_SHOWCASE.map((item) => {
          const active = selectedCategory === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setSelectedCategory(active ? 'All' : item.label)}
              className={`group relative aspect-[4/3] rounded-2xl overflow-hidden text-left transition-all ${
                active ? 'ring-3 ring-[#397B32] shadow-lg' : 'border border-[#397B32]/15'
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#24552E]/88 via-[#24552E]/20 to-transparent p-3 flex flex-col justify-end">
                <div className="text-[11px] font-semibold text-[#A8D94E]">{item.label}</div>
                <div className="font-display text-lg font-bold text-white leading-tight">{item.title}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Safety Banner */}
      <div className="bg-[#FFF7ED] border border-[#FF941F]/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#7C2D12]">
        <ShieldAlert className="w-4 h-4 text-[#FF941F] shrink-0 mt-0.5" />
        <div>
          <strong>Cricket Fitness Safety:</strong> Always complete a dynamic warm-up before sprinting or bowling, progress volumes gradually, and stop immediately if you experience sharp pain, dizziness, or unusual discomfort.
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-1.5 bg-[#D4F0DC] p-2 rounded-2xl border border-[#087F55]/25">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat ? 'bg-[#397B32] text-white' : 'text-[#68766A] hover:bg-[#EDF1E7] hover:text-[#17251A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExercises.map((ex) => {
          const completed = state.completedExerciseIds.includes(ex.id);
          const cardImg = getExerciseCardImage(ex.category);
          return (
            <div key={ex.id} className="athletic-card athletic-card-hover rounded-2xl overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative h-36 bg-[#397B32] overflow-hidden">
                  <img
                    src={cardImg}
                    alt={ex.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#24552E]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-xs text-white font-semibold">
                    <span className="text-[#A8D94E]">{ex.category} · {ex.difficulty}</span>
                    {completed && <CheckCircle2 className="w-4 h-4 text-[#A8D94E]" />}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-display text-2xl font-bold text-[#17251A] leading-snug">{ex.name}</h3>
                  <p className="text-sm text-[#68766A] leading-relaxed">{ex.whatIsIt}</p>
                  <div className="text-xs font-mono text-[#397B32] font-semibold pt-1">
                    {ex.sets} · {ex.repsOrDuration}
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={() => onOpenExercise(ex.id)}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] transition-colors"
                >
                  <Dumbbell className="w-3.5 h-3.5" /> {completed ? 'Completed · Open Guide' : 'Open Full Exercise Guide'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
