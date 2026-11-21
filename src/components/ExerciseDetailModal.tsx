import React, { useState } from 'react';
import { Bookmark, CheckCircle2, Play, ShieldAlert, X } from 'lucide-react';
import { ExerciseItem } from '../types';
import { VERIFIED_TUTORIALS } from '../data/tutorials';
import { CRICKIFY_IMAGES } from '../utils/assets';

interface ExerciseDetailModalProps {
  exercise: ExerciseItem;
  isCompleted: boolean;
  isSaved: boolean;
  note: string;
  onToggleComplete: (id: string) => void;
  onToggleSave: (id: string) => void;
  onSaveNote: (id: string, note: string) => void;
  onClose: () => void;
}

function getExerciseBanner(category: ExerciseItem['category']): string {
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

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isCompleted,
  isSaved,
  note,
  onToggleComplete,
  onToggleSave,
  onSaveNote,
  onClose,
}) => {
  const [draftNote, setDraftNote] = useState(note);
  const [noteSavedToast, setNoteSavedToast] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const tutorial = VERIFIED_TUTORIALS.find((t) => t.id === exercise.relatedTutorialId);
  const bannerImg = getExerciseBanner(exercise.category);

  const handleSaveNote = () => {
    onSaveNote(exercise.id, draftNote);
    setNoteSavedToast(true);
    setTimeout(() => setNoteSavedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17251A]/50 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-[#F7FAF3] rounded-3xl border border-[#17251A]/12 overflow-hidden shadow-2xl">
        {/* Photographic Header */}
        <div className="relative bg-[#397B32] text-white px-6 py-6 flex items-start justify-between gap-4 overflow-hidden">
          <img
            src={bannerImg}
            alt={exercise.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#24552E]/85 via-[#397B32]/75 to-[#69A83F]/65" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8D94E] font-semibold mb-1">
              <span>{exercise.category}</span>
              <span aria-hidden="true">·</span>
              <span>{exercise.subCategory}</span>
              <span aria-hidden="true">·</span>
              <span>{exercise.difficulty}</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close exercise details"
            className="relative z-10 p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 md:p-8 space-y-6">
          {/* Overview & Metrics */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="athletic-card rounded-2xl p-5 space-y-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#153D25]">What Is This Exercise?</h3>
                <p className="text-sm text-[#68766A] leading-relaxed">{exercise.whatIsIt}</p>
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#153D25]">Why Should a Cricketer Do It?</h3>
                <p className="text-sm text-[#68766A] leading-relaxed">{exercise.whyDoIt}</p>
              </div>
              <div>
                <div className="text-xs font-semibold text-[#397B32]">Skill Improved</div>
                <p className="text-sm font-medium text-[#17251A]">{exercise.skillImproved}</p>
              </div>
            </div>

            <div className="athletic-card rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-lg font-bold text-[#153D25]">Session Prescription</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-[#EDF1E7]">
                  <div className="text-xs text-[#68766A]">Sets</div>
                  <div className="font-mono font-bold text-[#17251A] tabular-nums">{exercise.sets}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#EDF1E7]">
                  <div className="text-xs text-[#68766A]">Reps / Duration</div>
                  <div className="font-mono font-bold text-[#17251A] tabular-nums">{exercise.repsOrDuration}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#EDF1E7]">
                  <div className="text-xs text-[#68766A]">Rest Time</div>
                  <div className="font-mono font-bold text-[#17251A] tabular-nums">{exercise.restTime}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#EDF1E7]">
                  <div className="text-xs text-[#68766A]">Weekly Frequency</div>
                  <div className="font-mono font-bold text-[#17251A] tabular-nums">{exercise.weeklyFrequency}</div>
                </div>
              </div>
              <div className="pt-2 text-xs text-[#68766A]">
                <span className="font-semibold text-[#17251A]">Equipment:</span> {exercise.equipment.join(' · ')}
              </div>
              <div className="text-xs text-[#68766A]">
                <span className="font-semibold text-[#17251A]">Target Qualities:</span>{' '}
                {exercise.musclesOrQualities.join(' · ')}
              </div>
            </div>
          </div>

          {exercise.safetyNote && (
            <div className="bg-[#FFF7ED] border border-[#FF941F]/40 rounded-2xl p-4 flex items-start gap-3 text-sm text-[#7C2D12]">
              <ShieldAlert className="w-5 h-5 text-[#FF941F] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Training Safety Note:</span> {exercise.safetyNote}
              </div>
            </div>
          )}

          {/* Starting Position, Posture & Steps */}
          <div className="athletic-card rounded-2xl p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-[#17251A]/10">
              <div>
                <h4 className="font-display text-lg font-bold text-[#153D25] mb-1">Starting Position</h4>
                <p className="text-sm text-[#68766A]">{exercise.startingPosition}</p>
              </div>
              <div>
                <h4 className="font-display text-lg font-bold text-[#153D25] mb-1">Correct Posture</h4>
                <p className="text-sm text-[#68766A]">{exercise.correctPosture}</p>
              </div>
            </div>

            <div>
              <h4 className="font-display text-xl font-bold text-[#153D25] mb-3">Step-by-Step Execution</h4>
              <ol className="space-y-2.5">
                {exercise.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#17251A]">
                    <span className="w-6 h-6 rounded-lg bg-[#397B32] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Skill Versions */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="athletic-card rounded-2xl p-4">
              <div className="text-xs font-bold text-[#397B32] mb-1">Beginner Version</div>
              <p className="text-sm text-[#68766A]">{exercise.versions.beginner}</p>
            </div>
            <div className="athletic-card rounded-2xl p-4">
              <div className="text-xs font-bold text-[#397B32] mb-1">Intermediate Version</div>
              <p className="text-sm text-[#68766A]">{exercise.versions.intermediate}</p>
            </div>
            <div className="athletic-card rounded-2xl p-4">
              <div className="text-xs font-bold text-[#FF941F] mb-1">Advanced Version</div>
              <p className="text-sm text-[#68766A]">{exercise.versions.advanced}</p>
            </div>
          </div>

          {/* Mistakes, Corrections & Variations */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="athletic-card rounded-2xl p-5 space-y-3">
              <h4 className="font-display text-lg font-bold text-[#B91C1C]">Common Mistakes &amp; Corrections</h4>
              <ul className="space-y-2 text-sm text-[#68766A]">
                {exercise.commonMistakes.map((m, i) => (
                  <li key={i}>• Mistake: {m}</li>
                ))}
                {exercise.corrections.map((c, i) => (
                  <li key={i} className="text-[#397B32] font-semibold">• Fix: {c}</li>
                ))}
              </ul>
            </div>

            <div className="athletic-card rounded-2xl p-5 space-y-3">
              <h4 className="font-display text-lg font-bold text-[#153D25]">Safe Progressions</h4>
              <p className="text-sm text-[#68766A]">
                <span className="font-semibold text-[#17251A]">Easier variation:</span> {exercise.easierVariation}
              </p>
              <p className="text-sm text-[#68766A]">
                <span className="font-semibold text-[#17251A]">Harder variation:</span> {exercise.harderVariation}
              </p>
              {tutorial && (
                <div className="pt-2">
                  {showVideo ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${tutorial.videoId}?autoplay=1`}
                        title={tutorial.title}
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25] transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Watch Related Demonstration
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Personal Notes */}
          <div className="athletic-card rounded-2xl p-5 space-y-3">
            <h4 className="font-display text-lg font-bold text-[#153D25]">Personal Training Notes</h4>
            <textarea
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              rows={3}
              placeholder="Record how the drill felt, target count achieved, or what to check next session..."
              className="w-full rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] p-3 text-sm text-[#17251A] focus:outline-none focus:ring-2 focus:ring-[#397B32]"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#397B32] font-semibold">
                {noteSavedToast ? 'Notes saved to your profile.' : 'Saved to your CRICKIFY Training Passport.'}
              </span>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-xl border border-[#17251A]/15 bg-white text-xs font-semibold text-[#17251A] hover:bg-[#EDF1E7] transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#17251A]/12">
            <button
              onClick={() => onToggleSave(exercise.id)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                isSaved
                  ? 'bg-[#A8D94E]/25 border-[#397B32] text-[#24552E]'
                  : 'bg-white border-[#17251A]/15 text-[#17251A] hover:bg-[#EDF3E8]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Saved Exercise' : 'Save Exercise'}
            </button>

            <button
              onClick={() => onToggleComplete(exercise.id)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isCompleted ? 'bg-[#397B32] text-white' : 'bg-[#A8D94E] text-[#17251A] hover:bg-[#95c93a]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Completed' : 'Mark Exercise Completed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
