import React from 'react';
import { BookOpen, Camera, Gamepad2, MessageSquare, X } from 'lucide-react';
import { NavSectionId } from '../types';

interface HelpModalProps {
  onClose: () => void;
  onNavigate: (sec: NavSectionId) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose, onNavigate }) => {
  const sections = [
    {
      title: '1. Getting Started on CRICKIFY AI',
      icon: BookOpen,
      body: 'Start in Cricket Academy to learn structured batting, bowling, fielding, wicketkeeping, and rules lessons. Sign in with Google to save your progress, training routines, and video reports across sessions.',
      actionLabel: 'Open Cricket Academy',
      target: 'academy-batting' as NavSectionId,
    },
    {
      title: '2. AI Cricket Coach (English · Tamil · Hindi)',
      icon: MessageSquare,
      body: 'Ask technical or match questions directly, or attach a saved video report for evidence-linked coaching. Use Voice Input for hands-free practice in nets.',
      actionLabel: 'Meet AI Coach',
      target: 'coach-chat' as NavSectionId,
    },
    {
      title: '3. Video Technique Analysis Tips',
      icon: Camera,
      body: 'Film in bright daylight or clear indoor lighting, keep your full body inside the frame (side-on view works best for drives and bowling release), and upload 5–20 second MP4, MOV, or WebM clips.',
      actionLabel: 'Open Video Studio',
      target: 'practice-upload' as NavSectionId,
    },
    {
      title: '4. PlayZone Batting Challenge Controls',
      icon: Gamepad2,
      body: 'Choose 6-Ball or 12-Ball mode and difficulty (Beginner, Intermediate, Pro). Watch the ball approach the glowing crease ring, pick a shot direction (or swipe/tap PLAY SHOT / Spacebar) at peak timing to smash Fours and Sixes.',
      actionLabel: 'Launch PlayZone',
      target: 'playzone-batting' as NavSectionId,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#05140D]/75 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gradient-to-b from-[#E1F4E5] to-[#D1ECD7] rounded-3xl border border-[#B7F34A]/45 overflow-hidden shadow-2xl my-auto">
        <div className="bg-gradient-to-r from-[#0A2D1E] via-[#124630] to-[#1D5B39] text-white px-6 py-5 flex items-center justify-between gap-4 border-b border-[#B7F34A]/25">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#B7F34A]">CRICKIFY AI Guide</div>
            <h2 className="font-display text-3xl font-bold">How to Use CRICKIFY AI</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help modal"
            className="min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {sections.map((sec) => {
              const Icon = sec.icon;
              return (
                <div key={sec.title} className="p-4 rounded-2xl bg-[#ECF9EE] border border-[#087F55]/25 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#075E3F]">
                      <Icon className="w-4 h-4" />
                      <span>{sec.title}</span>
                    </div>
                    <p className="text-xs text-[#2B4234] leading-relaxed">{sec.body}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate(sec.target);
                    }}
                    className="text-left text-xs font-bold text-[#397B32] hover:underline"
                  >
                    {sec.actionLabel} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
