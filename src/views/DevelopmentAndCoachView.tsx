import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, CheckCircle2, ShieldCheck, Trash2, Users } from 'lucide-react';
import { CoachSquadPlayer, NavSectionId, PitchIQState } from '../types';
import { CRICKET_LESSONS } from '../data/lessons';
import { CRICKET_EXERCISES } from '../data/exercises';
import { VERIFIED_TUTORIALS } from '../data/tutorials';
import { CRICKET_QUIZ_BANK, CRICKIFY_CHALLENGES } from '../data/tipsAndQuiz';
import { TutorialCard } from '../components/TutorialCard';
import { CRICKIFY_IMAGES } from '../utils/assets';

interface DevelopmentAndCoachViewProps {
  section: NavSectionId;
  state: PitchIQState;
  onOpenLesson: (id: string) => void;
  onOpenExercise: (id: string) => void;
  onOpenOnboarding: () => void;
  onToggleSaveTutorial: (id: string) => void;
  onDeleteReport: (id: string) => void;
  onSaveQuizScore: (topic: string, pct: number) => void;
  onToggleChallenge: (id: string) => void;
  onUpdateSquadPlayer: (player: CoachSquadPlayer) => void;
  onAddSquadPlayer: (player: CoachSquadPlayer) => void;
  onNavigate: (section: NavSectionId) => void;
}

export const DevelopmentAndCoachView: React.FC<DevelopmentAndCoachViewProps> = ({
  section,
  state,
  onOpenLesson,
  onOpenExercise,
  onOpenOnboarding,
  onToggleSaveTutorial,
  onDeleteReport,
  onSaveQuizScore,
  onToggleChallenge,
  onUpdateSquadPlayer,
  onAddSquadPlayer,
  onNavigate,
}) => {
  const [quizTopic, setQuizTopic] = useState<string>('All');
  const [quizDifficulty, setQuizDifficulty] = useState<string>('All');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerGroup, setNewPlayerGroup] = useState('U-19 Development Squad');
  const [selectedSquadId, setSelectedSquadId] = useState<string>(state.squadPlayers[0]?.id || '');

  const filteredQuiz = useMemo(() => {
    return CRICKET_QUIZ_BANK.filter(
      (q) =>
        (quizTopic === 'All' || q.topic === quizTopic) &&
        (quizDifficulty === 'All' || q.difficulty === quizDifficulty)
    );
  }, [quizTopic, quizDifficulty]);

  const quizScore = useMemo(() => {
    if (!filteredQuiz.length) return 0;
    const correct = filteredQuiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
    return Math.round((correct / filteredQuiz.length) * 100);
  }, [filteredQuiz, quizAnswers]);

  const masteryData = useMemo(() => {
    const scores = Object.entries(state.quizHighScores);
    if (scores.length > 0) {
      return scores.map(([topic, pct]) => ({ name: topic, Score: pct }));
    }
    return [];
  }, [state.quizHighScores]);

  // Quiz View
  if (section === 'dev-quiz') {
    return (
      <div className="space-y-6">
        <div className="stadium-dark-panel text-white rounded-3xl p-7 md:p-9 shadow-xl">
          <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider mb-1">Interactive Knowledge Challenge</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Cricket Quiz &amp; Tactical Checks</h1>
          <p className="text-sm text-[#D7E4D8] mt-1">
            Test rules, batting technique, bowling tactics, fielding instincts, and turf cricket strategy.
          </p>
        </div>

        <div className="athletic-card rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={quizTopic}
              onChange={(e) => {
                setQuizTopic(e.target.value);
                setQuizAnswers({});
                setQuizSubmitted(false);
              }}
              className="px-3.5 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
            >
              <option value="All">All Topics</option>
              {['Cricket Rules', 'Batting', 'Bowling', 'Fielding', 'Match Situations', 'Tactical Decisions', 'Turf Cricket'].map(
                (t) => <option key={t} value={t}>{t}</option>
              )}
            </select>
            <select
              value={quizDifficulty}
              onChange={(e) => {
                setQuizDifficulty(e.target.value);
                setQuizAnswers({});
                setQuizSubmitted(false);
              }}
              className="px-3.5 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
            >
              <option value="All">All Difficulties</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          {quizSubmitted && (
            <div className="font-mono text-sm font-bold text-[#397B32] tabular-nums">
              Score: {quizScore}% ({filteredQuiz.filter((q) => quizAnswers[q.id] === q.correctIndex).length}/{filteredQuiz.length})
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredQuiz.map((q, idx) => {
            const chosen = quizAnswers[q.id];
            return (
              <div key={q.id} className="athletic-card rounded-2xl p-5 space-y-3">
                <div className="text-xs text-[#397B32] font-semibold">
                  Question {idx + 1} · {q.topic} · {q.difficulty}
                </div>
                <h3 className="font-display text-xl font-bold text-[#153D25]">{q.question}</h3>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = chosen === oIdx;
                    let cls = 'bg-[#F8FAF2] border-[#17251A]/12 text-[#17251A] hover:bg-[#EDF1E7]';
                    if (quizSubmitted) {
                      if (oIdx === q.correctIndex) cls = 'bg-[#A8D94E]/25 border-[#397B32] text-[#153D25] font-bold';
                      else if (isSelected) cls = 'bg-red-50 border-red-400 text-red-900';
                    } else if (isSelected) {
                      cls = 'bg-[#397B32] text-white border-[#397B32] font-semibold';
                    }
                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers((p) => ({ ...p, [q.id]: oIdx }))}
                        className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors ${cls}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && (
                  <p className="text-xs text-[#153D25] bg-[#EDF1E7] p-3.5 rounded-xl">{q.explanation}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setQuizSubmitted(true);
              onSaveQuizScore(quizTopic, quizScore);
            }}
            className="px-6 py-3 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25] transition-colors"
          >
            Submit Quiz &amp; Save Progress
          </button>
          <button
            onClick={() => {
              setQuizAnswers({});
              setQuizSubmitted(false);
            }}
            className="px-5 py-3 rounded-xl border border-[#17251A]/15 bg-white text-xs font-semibold text-[#17251A]"
          >
            Reset
          </button>
        </div>
      </div>
    );
  }

  // Coach & Academy Mode
  if (section === 'coach-academy-mode') {
    const selectedPlayer = state.squadPlayers.find((p) => p.id === selectedSquadId) || state.squadPlayers[0];

    return (
      <div className="space-y-8">
        <div className="scoreboard-dark-panel text-white rounded-3xl p-7 md:p-9 shadow-xl">
          <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider mb-1">Academy &amp; Group Coaching</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Coach &amp; Academy Management Mode</h1>
          <p className="text-sm text-[#D7E4D8] mt-1 max-w-2xl">
            Manage player groups, assign lessons and drills, review consent-granted video analysis reports, and record technical feedback. Sample squad entries are clearly labelled.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 athletic-card rounded-2xl p-5 space-y-4">
            <h2 className="font-display text-xl font-bold text-[#153D25]">Squad Roster</h2>
            <div className="space-y-2">
              {state.squadPlayers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedSquadId(p.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    selectedPlayer?.id === p.id
                      ? 'bg-[#397B32] text-white border-[#397B32]'
                      : 'bg-[#F8FAF2] text-[#17251A] border-[#17251A]/10 hover:bg-[#EDF1E7]'
                  }`}
                >
                  <div className={`text-xs ${selectedPlayer?.id === p.id ? 'text-[#A8D94E]' : 'text-[#68766A]'}`}>
                    {p.group} · {p.level}
                  </div>
                  <div className="font-bold text-sm">{p.name}</div>
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newPlayerName.trim()) return;
                const created: CoachSquadPlayer = {
                  id: `sq-${Date.now()}`,
                  name: newPlayerName.trim(),
                  role: 'All-Rounder',
                  level: 'Intermediate',
                  group: newPlayerGroup,
                  consentGranted: true,
                  assignedLessonIds: [],
                  assignedExerciseIds: [],
                  notes: '',
                };
                onAddSquadPlayer(created);
                setNewPlayerName('');
                setSelectedSquadId(created.id);
              }}
              className="pt-3 border-t border-[#17251A]/10 space-y-2"
            >
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Add player name..."
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs"
              />
              <input
                type="text"
                value={newPlayerGroup}
                onChange={(e) => setNewPlayerGroup(e.target.value)}
                placeholder="Group name..."
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs"
              />
              <button type="submit" className="w-full py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25]">
                Add Player to Squad
              </button>
            </form>
          </div>

          {selectedPlayer && (
            <div className="lg:col-span-8 athletic-card rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#17251A]/10">
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#153D25]">{selectedPlayer.name}</h2>
                  <div className="text-xs font-semibold text-[#397B32]">
                    {selectedPlayer.role} · {selectedPlayer.level} · {selectedPlayer.group}
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#17251A]">
                  <ShieldCheck className="w-4 h-4 text-[#397B32]" />
                  <input
                    type="checkbox"
                    checked={selectedPlayer.consentGranted}
                    onChange={(e) =>
                      onUpdateSquadPlayer({ ...selectedPlayer, consentGranted: e.target.checked })
                    }
                    className="accent-[#397B32]"
                  />
                  Video &amp; Report Consent Granted
                </label>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-[#153D25] mb-2">Assign Academy Lessons</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {CRICKET_LESSONS.map((l) => {
                      const assigned = selectedPlayer.assignedLessonIds.includes(l.id);
                      return (
                        <label key={l.id} className="flex items-center gap-2 text-xs p-2.5 rounded-xl bg-[#F8FAF2]">
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => {
                              const next = assigned
                                ? selectedPlayer.assignedLessonIds.filter((id) => id !== l.id)
                                : [...selectedPlayer.assignedLessonIds, l.id];
                              onUpdateSquadPlayer({ ...selectedPlayer, assignedLessonIds: next });
                            }}
                            className="accent-[#397B32]"
                          />
                          <span>{l.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#153D25] mb-2">Assign Practice Exercises</div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {CRICKET_EXERCISES.map((ex) => {
                      const assigned = selectedPlayer.assignedExerciseIds.includes(ex.id);
                      return (
                        <label key={ex.id} className="flex items-center gap-2 text-xs p-2.5 rounded-xl bg-[#F8FAF2]">
                          <input
                            type="checkbox"
                            checked={assigned}
                            onChange={() => {
                              const next = assigned
                                ? selectedPlayer.assignedExerciseIds.filter((id) => id !== ex.id)
                                : [...selectedPlayer.assignedExerciseIds, ex.id];
                              onUpdateSquadPlayer({ ...selectedPlayer, assignedExerciseIds: next });
                            }}
                            className="accent-[#397B32]"
                          />
                          <span>{ex.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-[#153D25] mb-1.5">Coach Feedback &amp; Notes</div>
                <textarea
                  rows={3}
                  value={selectedPlayer.notes}
                  onChange={(e) => onUpdateSquadPlayer({ ...selectedPlayer, notes: e.target.value })}
                  className="w-full p-3.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs"
                />
              </div>

              {!selectedPlayer.consentGranted && (
                <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FF941F]/40 text-xs text-[#7C2D12]">
                  Access Restricted: Player video reports cannot be viewed until player consent is enabled.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Challenges & Achievements
  if (section === 'dev-challenges' || section === 'dev-achievements') {
    const unlockedAchievements = [
      { title: 'First Lesson Completed', unlocked: state.completedLessonIds.length >= 1 },
      { title: 'Dedicated Practiser (3+ Drills)', unlocked: state.completedExerciseIds.length >= 3 },
      { title: 'Video Technique Explorer', unlocked: state.reports.length >= 1 },
      { title: 'Quiz Scholar (80%+ Score)', unlocked: Object.values(state.quizHighScores).some((s) => s >= 80) },
    ];

    return (
      <div className="space-y-8">
        <div className="stadium-dark-panel text-white rounded-3xl p-7 shadow-xl">
          <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider mb-1">Real Milestones Only</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Challenges &amp; Achievements</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {CRICKIFY_CHALLENGES.map((ch) => {
            const done = state.completedChallenges.includes(ch.id);
            return (
              <div key={ch.id} className="athletic-card athletic-card-hover rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-xs font-bold text-[#397B32] uppercase tracking-wider">{ch.category}</div>
                  <h3 className="font-display text-2xl font-bold text-[#153D25] mt-1">{ch.title}</h3>
                  <p className="text-sm text-[#68766A] mt-1">{ch.description}</p>
                </div>
                <button
                  onClick={() => onToggleChallenge(ch.id)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold w-fit transition-colors ${
                    done ? 'bg-[#397B32] text-white' : 'bg-[#A8D94E] text-[#153D25] hover:bg-[#95c93a]'
                  }`}
                >
                  {done ? 'Challenge Completed' : 'Mark Challenge Completed'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="athletic-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#153D25]">Unlocked Passport Milestones</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {unlockedAchievements.map((a) => (
              <div
                key={a.title}
                className={`p-4 rounded-2xl border ${
                  a.unlocked
                    ? 'bg-[#A8D94E]/20 border-[#397B32] text-[#153D25]'
                    : 'bg-[#EDF1E7] border-[#17251A]/10 text-[#68766A]'
                }`}
              >
                <Award className={`w-5 h-5 mb-2 ${a.unlocked ? 'text-[#FF941F]' : 'text-[#68766A]'}`} />
                <div className="font-bold text-sm">{a.title}</div>
                <div className="text-xs mt-1">{a.unlocked ? 'Earned from your saved activity' : 'Not yet earned'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Saved Videos / Saved Reports / History / Profile / Progress Passport
  const savedTutorials = VERIFIED_TUTORIALS.filter((t) => state.savedTutorialIds.includes(t.id));

  return (
    <div className="space-y-8">
      <div className="stadium-dark-panel text-white rounded-3xl p-7 md:p-9 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <img
            src={state.profile.avatarUrl || CRICKIFY_IMAGES.playerAvatar}
            alt={state.profile.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#A8D94E] shrink-0 bg-white"
          />
          <div>
            <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider mb-0.5">Player Progress Summary</div>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">{state.profile.name}&apos;s Cricket Development</h1>
            <p className="text-sm text-[#D7E4D8] mt-1">
              {state.profile.skillLevel} · {state.profile.role} · {state.profile.battingHand} · {state.profile.ballType}
            </p>
          </div>
        </div>
        <button
          onClick={onOpenOnboarding}
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#A8D94E] text-[#09180F] text-xs font-extrabold hover:bg-[#b8e465] transition-colors"
        >
          Edit Player Profile
        </button>
      </div>

      {/* High-Contrast Performance Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#0D2115] text-white border border-[#A8D94E]/20 p-5">
          <div className="text-xs text-[#9DB3A2] font-medium">Lessons Completed</div>
          <div className="font-mono text-2xl font-bold text-[#A8D94E] tabular-nums mt-1">
            {state.completedLessonIds.length} <span className="text-sm font-normal text-[#9DB3A2]">/ {CRICKET_LESSONS.length}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#0D2115] text-white border border-white/10 p-5">
          <div className="text-xs text-[#9DB3A2] font-medium">Exercises Completed</div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums mt-1">
            {state.completedExerciseIds.length} <span className="text-sm font-normal text-[#9DB3A2]">/ {CRICKET_EXERCISES.length}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-[#0D2115] text-white border border-white/10 p-5">
          <div className="text-xs text-[#9DB3A2] font-medium">Logged Practice Minutes</div>
          <div className="font-mono text-2xl font-bold text-[#A8D94E] tabular-nums mt-1">
            {state.trainingHistory.reduce((s, h) => s + h.durationMinutes, 0)} min
          </div>
        </div>
        <div className="rounded-2xl bg-[#0D2115] text-white border border-white/10 p-5">
          <div className="text-xs text-[#9DB3A2] font-medium">Saved Analysis Reports</div>
          <div className="font-mono text-2xl font-bold text-[#FF941F] tabular-nums mt-1">{state.reports.length}</div>
        </div>
      </div>

      {/* Real Quiz Mastery Chart */}
      {section === 'dev-progress' && (
        <div className="athletic-card rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold text-[#153D25]">Quiz Topic High Scores</h2>
            <button
              onClick={() => onNavigate('dev-quiz')}
              className="text-xs font-bold text-[#397B32] hover:underline"
            >
              Take a Cricket Quiz →
            </button>
          </div>
          {masteryData.length === 0 ? (
            <p className="text-sm text-[#68766A]">
              No quiz attempts recorded yet. Complete a Cricket Quiz to chart your tactical mastery.
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={masteryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#17251A' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#68766A' }} />
                  <Tooltip />
                  <Bar dataKey="Score" fill="#397B32" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Saved Reports */}
      {(section === 'dev-reports' || section === 'dev-progress' || section === 'dev-videos') && (
        <div className="athletic-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-[#153D25]">Saved Video Analysis Reports &amp; Clips</h2>
            <button
              onClick={() => onNavigate('practice-upload')}
              className="text-xs font-bold text-[#397B32] hover:underline"
            >
              + Analyse New Clip
            </button>
          </div>
          {state.reports.length === 0 ? (
            <p className="text-sm text-[#68766A]">No video reports saved yet. Upload or record a clip in Practice &amp; Analysis.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {state.reports.map((rep) => (
                <div key={rep.id} className="p-4 rounded-2xl bg-[#F8FAF2] border border-[#17251A]/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-semibold text-[#397B32]">
                      {rep.skillCategory} · {new Date(rep.createdAt).toLocaleDateString()}
                    </div>
                    <div className="font-display text-xl font-bold text-[#153D25]">{rep.technique}</div>
                    <p className="text-xs text-[#68766A] line-clamp-2">{rep.summary}</p>
                    <button
                      onClick={() => onNavigate('correction-studio')}
                      className="text-xs font-bold text-[#153D25] underline pt-1"
                    >
                      Open Report in Studio
                    </button>
                  </div>
                  <button
                    onClick={() => onDeleteReport(rep.id)}
                    aria-label="Delete report"
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Training History */}
      {(section === 'dev-history' || section === 'dev-progress') && (
        <div className="athletic-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#153D25]">Training Session History</h2>
          {state.trainingHistory.length === 0 ? (
            <p className="text-sm text-[#68766A]">
              No completed workout sessions logged yet. Start a session inside the Training Planner to track consistency.
            </p>
          ) : (
            <div className="space-y-2.5">
              {state.trainingHistory.map((h) => (
                <div key={h.id} className="p-4 rounded-xl bg-[#EDF1E7] flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="font-bold text-[#153D25]">{h.title}</div>
                    <div className="text-[#68766A]">{h.notes || 'Completed planned blocks'}</div>
                  </div>
                  <div className="font-mono text-[#397B32] font-bold tabular-nums">
                    {h.durationMinutes} min · {new Date(h.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved Tutorials */}
      {savedTutorials.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#153D25]">Saved Coaching Tutorials</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {savedTutorials.map((tut) => (
              <TutorialCard
                key={tut.id}
                tutorial={tut}
                isSaved={true}
                onToggleSave={onToggleSaveTutorial}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Lessons & Exercises Quick Links */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="athletic-card rounded-2xl p-5 space-y-3">
          <h3 className="font-display text-xl font-bold text-[#153D25]">Completed Academy Lessons</h3>
          {state.completedLessonIds.length === 0 ? (
            <p className="text-xs text-[#68766A]">Complete lessons in Cricket Academy to track mastery here.</p>
          ) : (
            <div className="space-y-2">
              {state.completedLessonIds.map((id) => {
                const l = CRICKET_LESSONS.find((item) => item.id === id);
                return l ? (
                  <button
                    key={id}
                    onClick={() => onOpenLesson(id)}
                    className="w-full text-left p-3 rounded-xl bg-[#F8FAF2] border border-[#17251A]/8 flex items-center justify-between text-xs font-semibold text-[#17251A] hover:bg-[#EDF1E7]"
                  >
                    <span>{l.title}</span>
                    <CheckCircle2 className="w-4 h-4 text-[#397B32]" />
                  </button>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="athletic-card rounded-2xl p-5 space-y-3">
          <h3 className="font-display text-xl font-bold text-[#153D25]">Saved &amp; Completed Exercises</h3>
          {state.completedExerciseIds.length === 0 && state.savedExerciseIds.length === 0 ? (
            <p className="text-xs text-[#68766A]">Save or complete drills in the Training Centre.</p>
          ) : (
            <div className="space-y-2">
              {Array.from(new Set([...state.completedExerciseIds, ...state.savedExerciseIds])).map((id) => {
                const ex = CRICKET_EXERCISES.find((item) => item.id === id);
                return ex ? (
                  <button
                    key={id}
                    onClick={() => onOpenExercise(id)}
                    className="w-full text-left p-3 rounded-xl bg-[#F8FAF2] border border-[#17251A]/8 flex items-center justify-between text-xs font-semibold text-[#17251A] hover:bg-[#EDF1E7]"
                  >
                    <span>{ex.name}</span>
                    <Users className="w-4 h-4 text-[#397B32]" />
                  </button>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
