import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Play, Search, Upload } from 'lucide-react';
import { NavSectionId, PitchIQState } from '../types';
import { CRICKET_LESSONS } from '../data/lessons';
import { VERIFIED_TUTORIALS } from '../data/tutorials';
import { CRICKET_TIPS } from '../data/tipsAndQuiz';
import { CRICKET_EXERCISES } from '../data/exercises';
import { TutorialCard } from '../components/TutorialCard';
import { CRICKIFY_IMAGES } from '../utils/assets';

interface CricketAcademyViewProps {
  section: NavSectionId;
  state: PitchIQState;
  onNavigate: (section: NavSectionId) => void;
  onOpenLesson: (id: string) => void;
  onOpenExercise: (id: string) => void;
  onToggleSaveTutorial: (id: string) => void;
}

const LESSON_IMAGE_MAP: Record<string, string> = {
  'lesson-cricket-foundations': CRICKIFY_IMAGES.cricketPitch,
  'lesson-batting-grip-stance': CRICKIFY_IMAGES.lessonBattingGrip,
  'lesson-cover-drive': CRICKIFY_IMAGES.battingDrive,
  'lesson-pull-shot': CRICKIFY_IMAGES.lessonPullShot,
  'lesson-playing-spin': CRICKIFY_IMAGES.lessonPlayingSpin,
  'lesson-defense-cut-running': CRICKIFY_IMAGES.lessonForwardDefense,
  'lesson-fast-bowling-action': CRICKIFY_IMAGES.fastBowling,
  'lesson-yorker-variations': CRICKIFY_IMAGES.lessonYorker,
  'lesson-spin-bowling': CRICKIFY_IMAGES.spinBowling,
  'lesson-fielding-catching': CRICKIFY_IMAGES.fieldingDive,
  'lesson-wicketkeeping': CRICKIFY_IMAGES.wicketkeeping,
  'lesson-masterclass-t20-odi': CRICKIFY_IMAGES.heroStadium,
  'lesson-umpire-signals-formats': CRICKIFY_IMAGES.lessonUmpire,
};

function getLessonImage(lesson: (typeof CRICKET_LESSONS)[number]): string {
  if (LESSON_IMAGE_MAP[lesson.id]) return LESSON_IMAGE_MAP[lesson.id];
  if (lesson.diagramType === 'spin') return CRICKIFY_IMAGES.spinBowling;
  if (lesson.category === 'Bowling') return CRICKIFY_IMAGES.fastBowling;
  if (lesson.category === 'Fielding') return CRICKIFY_IMAGES.fieldingDive;
  if (lesson.category === 'Wicketkeeping') return CRICKIFY_IMAGES.wicketkeeping;
  if (lesson.category === 'Rules') return CRICKIFY_IMAGES.lessonUmpire;
  if (lesson.category === 'Masterclass') return CRICKIFY_IMAGES.heroStadium;
  return CRICKIFY_IMAGES.battingDrive;
}

export const CricketAcademyView: React.FC<CricketAcademyViewProps> = ({
  section,
  state,
  onNavigate,
  onOpenLesson,
  onOpenExercise,
  onToggleSaveTutorial,
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'tutorials' | 'tips' | 'drills'>('lessons');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('All');
  const [tutorialCatFilter, setTutorialCatFilter] = useState<string>('All');

  const sectionMeta = useMemo(() => {
    switch (section) {
      case 'academy-batting':
        return {
          title: 'MASTER YOUR BATTING.',
          subtitle: 'Build sound technique, timing, footwork, straight & cover drives, pull/cut shots, and confident defense.',
          heroImg: CRICKIFY_IMAGES.battingDrive,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.category === 'Batting',
          tutDefaultCat: 'Batting',
          exCategory: 'Batting',
        };
      case 'academy-bowling':
        return {
          title: 'MASTER YOUR BOWLING.',
          subtitle: 'Develop run-up rhythm, seam & swing presentation, spin flight, yorkers, and workload-safe bowling mechanics.',
          heroImg: CRICKIFY_IMAGES.fastBowling,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.category === 'Bowling',
          tutDefaultCat: 'Bowling',
          exCategory: 'Bowling',
        };
      case 'academy-fielding':
        return {
          title: 'BECOME A COMPLETE FIELDER.',
          subtitle: 'Improve split-step reflexes, soft-hands catching, ground pickups, direct-hit throwing, and safe movement.',
          heroImg: CRICKIFY_IMAGES.fieldingDive,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.category === 'Fielding' || l.category === 'Wicketkeeping',
          tutDefaultCat: 'Fielding',
          exCategory: 'Fielding',
        };
      case 'academy-wicketkeeping':
        return {
          title: 'WICKETKEEPING ACADEMY.',
          subtitle: 'Master crouched stance, rising smoothly with bounce, stumpings, and lateral glovework.',
          heroImg: CRICKIFY_IMAGES.wicketkeeping,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.category === 'Wicketkeeping' || l.category === 'Fielding',
          tutDefaultCat: 'Fielding',
          exCategory: 'Fielding',
        };
      case 'academy-rules':
        return {
          title: 'CRICKET RULES & PITCH FUNDAMENTALS.',
          subtitle: 'Learn pitch dimensions, creases, umpire signals, fielding restrictions, extras, and match formats.',
          heroImg: CRICKIFY_IMAGES.cricketPitch,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.category === 'Rules',
          tutDefaultCat: 'All',
          exCategory: 'Batting',
        };
      case 'academy-beginner':
        return {
          title: 'BEGINNER CRICKET ACADEMY.',
          subtitle: 'Start cricket from zero: pitch rules, batting grip & stance, forward defense, bowling basics, and catching.',
          heroImg: CRICKIFY_IMAGES.cricketPitch,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.tier === 'Beginner' || l.level === 'Beginner',
          tutDefaultCat: 'All',
          exCategory: 'All',
        };
      case 'academy-intermediate':
        return {
          title: 'INTERMEDIATE CRICKET ACADEMY.',
          subtitle: 'Front-foot & back-foot batting, pull shots, playing spin, swing/seam, and match awareness.',
          heroImg: CRICKIFY_IMAGES.battingDrive,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) => l.tier === 'Intermediate' || l.level === 'Intermediate',
          tutDefaultCat: 'All',
          exCategory: 'All',
        };
      case 'academy-advanced':
      case 'academy-masterclass':
        return {
          title: section === 'academy-masterclass' ? 'PROFESSIONAL MASTERCLASS.' : 'ADVANCED CRICKET ACADEMY.',
          subtitle: 'Yorkers, death bowling, spin deception, T20/ODI/Test innings pacing, and tactical field planning.',
          heroImg: CRICKIFY_IMAGES.spinBowling,
          lessonFilter: (l: (typeof CRICKET_LESSONS)[number]) =>
            l.tier === 'Advanced' || l.tier === 'Professional Masterclass' || l.level === 'Advanced',
          tutDefaultCat: 'All',
          exCategory: 'All',
        };
      default:
        return {
          title: 'CRICKIFY AI CRICKET ACADEMY.',
          subtitle: 'Structured technical lessons, verified YouTube masterclasses, and targeted drills.',
          heroImg: CRICKIFY_IMAGES.heroStadium,
          lessonFilter: () => true,
          tutDefaultCat: 'All',
          exCategory: 'All',
        };
    }
  }, [section]);

  const categoryQuickCards = useMemo(
    () => [
      {
        id: 'academy-batting' as NavSectionId,
        title: 'Batting',
        desc: 'Grip, drives & footwork',
        img: CRICKIFY_IMAGES.battingDrive,
        meta: `${CRICKET_LESSONS.filter((l) => l.category === 'Batting').length} lessons`,
      },
      {
        id: 'academy-bowling' as NavSectionId,
        title: 'Bowling',
        desc: 'Pace, swing & spin control',
        img: CRICKIFY_IMAGES.fastBowling,
        meta: `${CRICKET_LESSONS.filter((l) => l.category === 'Bowling').length} lessons`,
      },
      {
        id: 'academy-fielding' as NavSectionId,
        title: 'Fielding',
        desc: 'Reflexes, catching & throws',
        img: CRICKIFY_IMAGES.fieldingDive,
        meta: `${CRICKET_LESSONS.filter((l) => l.category === 'Fielding').length} lesson`,
      },
      {
        id: 'academy-wicketkeeping' as NavSectionId,
        title: 'Wicketkeeping',
        desc: 'Crouch, bounce & glovework',
        img: CRICKIFY_IMAGES.wicketkeeping,
        meta: `${CRICKET_LESSONS.filter((l) => l.category === 'Wicketkeeping').length} lesson`,
      },
      {
        id: 'academy-rules' as NavSectionId,
        title: 'Cricket Rules',
        desc: 'Creases, signals & laws',
        img: CRICKIFY_IMAGES.cricketPitch,
        meta: `${CRICKET_LESSONS.filter((l) => l.category === 'Rules' || l.category === 'Masterclass').length} modules`,
      },
      {
        id: 'fitness-hub' as NavSectionId,
        title: 'Fitness & Training',
        desc: 'Strength, speed & recovery',
        img: CRICKIFY_IMAGES.fitnessStrengthMobility,
        meta: `${CRICKET_EXERCISES.filter((e) => !['Batting', 'Bowling', 'Fielding'].includes(e.category)).length} drills`,
      },
    ],
    []
  );

  const suggestedNextLesson = useMemo(() => {
    const preferredCategory =
      state.profile.role === 'Fast Bowler' || state.profile.role === 'Spin Bowler'
        ? 'Bowling'
        : state.profile.role === 'Wicketkeeper'
          ? 'Wicketkeeping'
          : 'Batting';

    return (
      CRICKET_LESSONS.find(
        (l) => l.category === preferredCategory && !state.completedLessonIds.includes(l.id)
      ) ||
      CRICKET_LESSONS.find((l) => !state.completedLessonIds.includes(l.id)) ||
      CRICKET_LESSONS[0]
    );
  }, [state.completedLessonIds, state.profile.role]);

  const filteredLessons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return CRICKET_LESSONS.filter((l) => {
      const matchSection = sectionMeta.lessonFilter(l);
      const matchLevel = levelFilter === 'All' || l.level === levelFilter;
      const matchQ =
        !q ||
        l.title.toLowerCase().includes(q) ||
        l.detailedExplanation.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q);
      return matchSection && matchLevel && matchQ;
    });
  }, [sectionMeta, searchQuery, levelFilter]);

  const effectiveTutCat = tutorialCatFilter !== 'All' ? tutorialCatFilter : sectionMeta.tutDefaultCat;

  const filteredTutorials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return VERIFIED_TUTORIALS.filter((t) => {
      const matchCat = effectiveTutCat === 'All' || t.category === effectiveTutCat;
      const matchLvl = levelFilter === 'All' || t.level === levelFilter;
      const matchQ = !q || t.title.toLowerCase().includes(q) || t.summary.toLowerCase().includes(q) || t.channel.toLowerCase().includes(q);
      return matchCat && matchLvl && matchQ;
    });
  }, [effectiveTutCat, levelFilter, searchQuery]);

  const filteredDrills = useMemo(() => {
    return CRICKET_EXERCISES.filter((ex) =>
      sectionMeta.exCategory === 'All' ? ['Batting', 'Bowling', 'Fielding'].includes(ex.category) : ex.category === sectionMeta.exCategory
    );
  }, [sectionMeta]);

  return (
    <div className="space-y-7">
      {/* Editorial Ivory & Forest Emerald Academy Header */}
      <section className="relative rounded-3xl overflow-hidden bg-[#103B2A] text-white border border-[#087F55]/30 shadow-lg">
        <div className="absolute inset-0">
          <img src={sectionMeta.heroImg} alt={sectionMeta.title} className="w-full h-full object-cover opacity-50" />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(100deg, rgba(16,59,42,0.94) 0%, rgba(16,59,42,0.82) 55%, rgba(16,59,42,0.45) 100%)',
            }}
          />
        </div>
        <div className="relative z-10 p-7 md:p-11 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#B7F34A]">
              CRICKIFY AI Cricket Academy · Structured Curriculum
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              {sectionMeta.title}
            </h1>
            <p className="text-sm md:text-base text-[#E2ECE3] leading-relaxed">{sectionMeta.subtitle}</p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                onClick={() => setActiveTab('lessons')}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#B7F34A] text-[#0A1610] text-xs font-extrabold hover:bg-[#c6f86b] transition-colors"
              >
                Explore Techniques
              </button>
              <button
                onClick={() => setActiveTab('tutorials')}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#F7F7EF] text-[#103B2A] text-xs font-bold hover:bg-white inline-flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Watch Tutorials
              </button>
              <button
                onClick={() => onNavigate('practice-upload')}
                className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#FF941F] text-[#17251A] text-xs font-bold hover:bg-[#ffa442] inline-flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload My Video
              </button>
            </div>
          </div>

          <div className="bg-[#F7F7EF] text-[#17251A] rounded-2xl p-4 min-w-[220px] shadow-md space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#087F55]">Curriculum Mastery</div>
            <div className="font-mono text-2xl font-bold tabular-nums">
              {state.completedLessonIds.length} <span className="text-sm font-normal text-[#5C6B5F]">/ {CRICKET_LESSONS.length} lessons</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#E3E9DC] overflow-hidden">
              <div
                className="h-full bg-[#087F55] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(4, Math.round((state.completedLessonIds.length / Math.max(1, CRICKET_LESSONS.length)) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Context-Aware Suggested Next Lesson Banner */}
      <div className="ivory-academy-surface rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#087F55]">
            Suggested Next Lesson · {state.profile.skillLevel} {state.profile.role}
          </div>
          <div className="font-display text-2xl font-bold text-[#17251A]">{suggestedNextLesson.title}</div>
          <p className="text-xs text-[#5C6B5F]">
            {suggestedNextLesson.category} · {suggestedNextLesson.durationMinutes} min · {suggestedNextLesson.whyItMatters}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenLesson(suggestedNextLesson.id)}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#103B2A] hover:bg-[#087F55] text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
        >
          Start Lesson →
        </button>
      </div>

      {/* CHOOSE YOUR LEARNING PATH — 6 Distinct Photographic Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-extrabold text-[#102419] uppercase tracking-wide">
            CHOOSE YOUR LEARNING PATH
          </h2>
          <span className="text-xs font-bold text-[#087F55]">6 Academy Disciplines</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryQuickCards.map((cat) => {
            const active = section === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate(cat.id)}
                className={`group relative rounded-2xl overflow-hidden text-left aspect-[4/3] border transition-all ${
                  active ? 'ring-2 ring-[#087F55] border-[#087F55] shadow-md' : 'border-[#087F55]/15 hover:border-[#087F55]/60'
                }`}
              >
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 p-3 flex flex-col justify-end"
                  style={{ background: 'linear-gradient(180deg, rgba(16,23,20,0.12) 0%, rgba(16,59,42,0.92) 100%)' }}
                >
                  <div className="font-display text-lg font-bold text-white leading-none">{cat.title}</div>
                  <div className="text-[10px] text-white/85 mt-1 line-clamp-1">{cat.desc}</div>
                  <div className="text-[10px] font-mono font-bold text-[#B7F34A] mt-0.5 tabular-nums">{cat.meta}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Segmented Navigation & Search */}
      <div className="ivory-academy-surface rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap gap-1.5 bg-[#EDF1E7] p-1 rounded-xl">
          {[
            { id: 'lessons', label: 'Technique Lessons' },
            { id: 'tutorials', label: 'YouTube Masterclass' },
            { id: 'drills', label: 'Practice Drills' },
            { id: 'tips', label: 'Tips & Tricks' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.id ? 'bg-[#143622] text-white' : 'text-[#17251A]/80 hover:text-[#153D25]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#68766A] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lessons or videos..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl border border-[#087F55]/25 bg-[#ECFAEE] text-[#102419] text-xs"
            />
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#087F55]/25 bg-[#ECFAEE] text-[#102419] text-xs font-medium"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Editorial Ivory & Emerald Lessons Grid */}
      {activeTab === 'lessons' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson) => {
            const done = state.completedLessonIds.includes(lesson.id);
            const coverImg = getLessonImage(lesson);
            return (
              <div
                key={lesson.id}
                className="group ivory-academy-surface athletic-card-hover rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-[#103B2A] overflow-hidden">
                    <img
                      src={coverImg}
                      alt={lesson.title}
                      onError={(e) => {
                        const imgEl = e.currentTarget;
                        if (imgEl.src !== CRICKIFY_IMAGES.cricketPitch) {
                          imgEl.src = CRICKIFY_IMAGES.cricketPitch;
                        }
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#101714]/45 via-transparent to-transparent pointer-events-none"
                    />
                    {done && (
                      <div className="absolute top-3 right-3 bg-[#143622]/95 text-[#A8D94E] p-1.5 rounded-lg shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="text-xs font-semibold text-[#397B32]">
                      {lesson.tier} · {lesson.category}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-[#17251A] leading-snug">{lesson.title}</h3>
                    <p className="text-sm text-[#68766A] leading-relaxed line-clamp-3">{lesson.whyItMatters}</p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-[#087F55]/18 flex items-center justify-between bg-[#D7F0DC]">
                  <span className="text-xs font-mono text-[#68766A] tabular-nums">
                    {lesson.durationMinutes} min · {lesson.steps.length} steps
                  </span>
                  <button
                    onClick={() => onOpenLesson(lesson.id)}
                    className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#143622] text-white text-xs font-semibold hover:bg-[#397B32] transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {done ? 'Review Lesson' : 'Open Lesson'}
                  </button>
                </div>
              </div>
            );
          })}
          {filteredLessons.length === 0 && (
            <div className="col-span-full athletic-card rounded-2xl p-8 text-center text-sm text-[#68766A]">
              No lessons match your current search or level filter. Try switching to &ldquo;All Levels&rdquo;.
            </div>
          )}
        </div>
      )}

      {/* Verified YouTube Tutorials Tab */}
      {activeTab === 'tutorials' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#102419]">
                LEARN FROM THE BEST — CRICKET MASTERCLASS
              </h2>
              <p className="text-xs text-[#3C5646] font-medium">
                Genuine, verified cricket coaching tutorials embedded directly inside CRICKIFY AI.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Batting', 'Bowling', 'Fielding', 'Fitness'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTutorialCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    effectiveTutCat === cat
                      ? 'bg-[#103B2A] text-white'
                      : 'bg-[#FAFDFA] border border-[#087F55]/25 text-[#102419] hover:bg-[#E7F5E6]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTutorials.map((tut) => (
              <TutorialCard
                key={tut.id}
                tutorial={tut}
                isSaved={state.savedTutorialIds.includes(tut.id)}
                onToggleSave={onToggleSaveTutorial}
              />
            ))}
          </div>
        </div>
      )}

      {/* Drills Tab */}
      {activeTab === 'drills' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrills.map((ex) => {
            const done = state.completedExerciseIds.includes(ex.id);
            return (
              <div key={ex.id} className="athletic-card athletic-card-hover rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-semibold text-[#397B32] mb-1">
                    {ex.category} · {ex.subCategory} · {ex.difficulty}
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#17251A] mb-1.5">{ex.name}</h3>
                  <p className="text-sm text-[#68766A] leading-relaxed">{ex.whatIsIt}</p>
                </div>
                <div className="pt-3 border-t border-[#17251A]/10 flex items-center justify-between text-xs">
                  <span className="font-mono text-[#68766A]">{ex.sets}</span>
                  <button
                    onClick={() => onOpenExercise(ex.id)}
                    className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#397B32] text-white font-semibold hover:bg-[#153D25]"
                  >
                    {done ? 'Completed · View' : 'Open Drill Guide'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tips Tab */}
      {activeTab === 'tips' && (
        <div className="grid md:grid-cols-2 gap-5">
          {CRICKET_TIPS.map((tip) => (
            <div key={tip.id} className="athletic-card rounded-2xl p-5 space-y-2.5">
              <div className="text-xs font-semibold text-[#397B32]">{tip.category} · {tip.level}</div>
              <h3 className="font-display text-2xl font-bold text-[#17251A]">{tip.title}</h3>
              <p className="text-sm text-[#68766A]"><strong>Problem:</strong> {tip.problem}</p>
              <p className="text-sm text-[#17251A]"><strong>Fix:</strong> {tip.correctTechnique}</p>
              <div className="pt-2 flex gap-4">
                <button
                  onClick={() => onOpenLesson(tip.relatedLessonId)}
                  className="text-xs font-semibold text-[#397B32] hover:underline"
                >
                  Open Related Lesson →
                </button>
                {tip.relatedExerciseId && (
                  <button
                    onClick={() => onOpenExercise(tip.relatedExerciseId!)}
                    className="text-xs font-semibold text-[#153D25] hover:underline"
                  >
                    Open Drill →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
