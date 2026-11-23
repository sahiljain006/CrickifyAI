import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Play, X } from 'lucide-react';
import { CricketLesson } from '../types';
import { VERIFIED_TUTORIALS } from '../data/tutorials';
import { CricketTechniqueDiagram } from './CricketDiagrams';

interface LessonDetailModalProps {
  lesson: CricketLesson;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  onSelectLesson: (id: string) => void;
  onClose: () => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  isCompleted,
  onToggleComplete,
  onSelectLesson,
  onClose,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [checkedPractical, setCheckedPractical] = useState<Record<number, boolean>>({});
  const [showVideo, setShowVideo] = useState(false);
  const [openSections, setOpenSections] = useState<{
    mistakes: boolean;
    drills: boolean;
    assessment: boolean;
  }>({
    mistakes: true,
    drills: true,
    assessment: true,
  });

  const tutorial = VERIFIED_TUTORIALS.find((t) => t.id === lesson.tutorialId);

  const toggleSec = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#17251A]/50 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto bg-[#F7FAF3] rounded-3xl border border-[#17251A]/12 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#69A83F] via-[#397B32] to-[#24552E] text-white px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#A8D94E] font-semibold mb-1">
              <span>{lesson.tier}</span>
              <span aria-hidden="true">·</span>
              <span>{lesson.category}</span>
              <span aria-hidden="true">·</span>
              <span>{lesson.level}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{lesson.durationMinutes} min study</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">
              {lesson.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close lesson"
            className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-7 md:p-8 space-y-6">
          {/* Objectives & Why it matters */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="athletic-card rounded-2xl p-5">
              <h3 className="font-display text-xl font-bold text-[#17251A] mb-3">Learning Objectives</h3>
              <ul className="space-y-2 text-sm text-[#17251A]/85">
                {lesson.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs text-[#397B32] font-bold mt-0.5">0{idx + 1}.</span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="athletic-card rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[#17251A] mb-1.5">Why This Technique Matters</h3>
                <p className="text-sm text-[#68766A] leading-relaxed">{lesson.whyItMatters}</p>
              </div>
              <div className="pt-3 border-t border-[#17251A]/10">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#397B32] mb-1.5">Equipment Required</h4>
                <p className="text-sm text-[#17251A]/80">{lesson.equipment.join(' · ')}</p>
              </div>
            </div>
          </div>

          {/* Detailed Explanation + Visual Diagram & Tutorial */}
          <div className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 athletic-card rounded-2xl p-6 space-y-4">
              <h3 className="font-display text-2xl font-bold text-[#17251A]">Detailed Technique Breakdown</h3>
              <p className="text-[15px] text-[#17251A]/85 leading-relaxed">{lesson.detailedExplanation}</p>

              <div className="pt-3 border-t border-[#17251A]/10">
                <h4 className="font-display text-lg font-bold text-[#17251A] mb-2">Correct Body Positioning</h4>
                <ul className="space-y-2 text-sm text-[#68766A]">
                  {lesson.bodyPositioning.map((bp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#397B32] font-bold">•</span>
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <CricketTechniqueDiagram type={lesson.diagramType} />
              {tutorial && (
                <div className="athletic-card rounded-2xl p-4">
                  <div className="text-xs font-semibold text-[#397B32] mb-1">Verified Coaching Demonstration</div>
                  <h4 className="font-display text-lg font-bold text-[#17251A] mb-2">{tutorial.title}</h4>
                  {showVideo ? (
                    <div className="aspect-video rounded-xl overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube.com/embed/${tutorial.videoId}?autoplay=1`}
                        title={tutorial.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowVideo(true)}
                      className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-semibold hover:bg-[#24552E] transition-colors"
                    >
                      <Play className="w-4 h-4 fill-current" /> Watch Tutorial ({tutorial.channel})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step-by-Step Execution */}
          <div className="athletic-card rounded-2xl p-6">
            <h3 className="font-display text-2xl font-bold text-[#17251A] mb-4">Step-by-Step Execution</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {lesson.steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#EDF1E7] border border-[#17251A]/10 flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#397B32] text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-[#17251A]/85 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable: Mistakes, Corrections & Pro Tips */}
          <div className="athletic-card rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSec('mistakes')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#EDF1E7]/50 transition-colors"
            >
              <h3 className="font-display text-2xl font-bold text-[#17251A]">
                Common Mistakes, Fixes &amp; Pro Coaching Tips
              </h3>
              {openSections.mistakes ? <ChevronUp className="w-5 h-5 text-[#397B32]" /> : <ChevronDown className="w-5 h-5 text-[#397B32]" />}
            </button>
            {openSections.mistakes && (
              <div className="px-6 pb-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F7FAF3] border border-[#17251A]/10">
                  <h4 className="font-display text-lg font-bold text-[#b91c1c] mb-2">Common Mistakes</h4>
                  <ul className="space-y-2 text-sm text-[#68766A]">
                    {lesson.commonMistakes.map((m, i) => (
                      <li key={i} className="leading-relaxed">• {m}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-[#F7FAF3] border border-[#17251A]/10">
                  <h4 className="font-display text-lg font-bold text-[#397B32] mb-2">How to Correct Them</h4>
                  <ul className="space-y-2 text-sm text-[#17251A]/85">
                    {lesson.corrections.map((c, i) => (
                      <li key={i} className="leading-relaxed">• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-[#EDF3E8] border border-[#397B32]/25 text-[#17251A]">
                  <h4 className="font-display text-lg font-bold text-[#397B32] mb-2">Pro Coaching Tips</h4>
                  <ul className="space-y-2 text-sm text-[#17251A]/85">
                    {lesson.proTips.map((tip, i) => (
                      <li key={i} className="leading-relaxed">• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Expandable: Progressive Drills */}
          <div className="athletic-card rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSec('drills')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#EDF1E7]/50 transition-colors"
            >
              <h3 className="font-display text-2xl font-bold text-[#17251A]">Progressive Practice Drills</h3>
              {openSections.drills ? <ChevronUp className="w-5 h-5 text-[#397B32]" /> : <ChevronDown className="w-5 h-5 text-[#397B32]" />}
            </button>
            {openSections.drills && (
              <div className="px-6 pb-6 grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#EDF1E7] border border-[#17251A]/10">
                  <div className="text-xs font-semibold text-[#397B32] mb-1">Beginner Drill</div>
                  <p className="text-sm text-[#17251A]/85 leading-relaxed">{lesson.drills.beginner}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#EDF1E7] border border-[#17251A]/10">
                  <div className="text-xs font-semibold text-[#397B32] mb-1">Intermediate Drill</div>
                  <p className="text-sm text-[#17251A]/85 leading-relaxed">{lesson.drills.intermediate}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#EDF1E7] border border-[#17251A]/10">
                  <div className="text-xs font-semibold text-[#397B32] mb-1">Advanced Drill</div>
                  <p className="text-sm text-[#17251A]/85 leading-relaxed">{lesson.drills.advanced}</p>
                </div>
              </div>
            )}
          </div>

          {/* Expandable: Knowledge Check & Practical Assessment */}
          <div className="athletic-card rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSec('assessment')}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#EDF1E7]/50 transition-colors"
            >
              <h3 className="font-display text-2xl font-bold text-[#17251A]">
                Knowledge Quiz &amp; Practical Self-Assessment
              </h3>
              {openSections.assessment ? <ChevronUp className="w-5 h-5 text-[#397B32]" /> : <ChevronDown className="w-5 h-5 text-[#397B32]" />}
            </button>
            {openSections.assessment && (
              <div className="px-6 pb-6 grid md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[#F8FAF2] border border-[#17251A]/10 space-y-4">
                  <h4 className="font-display text-xl font-bold text-[#17251A]">Lesson Knowledge Check</h4>
                  {lesson.quiz.map((q, qIdx) => {
                    const chosen = selectedAnswers[qIdx];
                    return (
                      <div key={qIdx} className="space-y-2 pb-3 border-b border-[#17251A]/10 last:border-0">
                        <p className="text-sm font-semibold text-[#17251A]">{q.question}</p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = chosen === oIdx;
                            const isCorrect = oIdx === q.correctIndex;
                            let style = 'bg-[#ECFAEE] border-[#087F55]/20 text-[#102419] hover:bg-[#D5F1DC]';
                            if (chosen !== undefined) {
                              if (isCorrect) style = 'bg-[#A8D94E]/25 border-[#397B32] text-[#153D25] font-semibold';
                              else if (isSelected) style = 'bg-red-50 border-red-400 text-red-900';
                            }
                            return (
                              <button
                                key={oIdx}
                                onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors ${style}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {chosen !== undefined && (
                          <p className="text-xs text-[#397B32] bg-[#EDF1E7] p-2.5 rounded-lg">{q.explanation}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-5 rounded-xl bg-[#F8FAF2] border border-[#17251A]/10 space-y-4">
                  <h4 className="font-display text-xl font-bold text-[#17251A]">Practical Self-Assessment</h4>
                  <p className="text-xs text-[#68766A]">
                    Verify each practical checkpoint during shadow or net practice before marking this lesson complete.
                  </p>
                  <div className="space-y-2.5">
                    {lesson.practicalChecklist.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#ECFAEE] border border-[#087F55]/20 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedPractical[idx]}
                          onChange={() => setCheckedPractical((p) => ({ ...p, [idx]: !p[idx] }))}
                          className="mt-0.5 accent-[#397B32]"
                        />
                        <span className="text-sm text-[#17251A]/85">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#17251A]/15">
            <button
              onClick={() => onToggleComplete(lesson.id)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isCompleted ? 'bg-[#397B32] text-white' : 'bg-[#A8D94E] text-[#17251A] hover:bg-[#95c93a]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {isCompleted ? 'Lesson Completed' : 'Mark Lesson as Completed'}
            </button>

            <button
              onClick={() => onSelectLesson(lesson.nextLessonId)}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#087F55]/25 bg-[#DDF4E2] text-[#102419] text-sm font-semibold hover:bg-[#C6EBD0] transition-colors"
            >
              Recommended Next Lesson <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
