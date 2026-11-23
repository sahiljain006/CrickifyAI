import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Camera, Gamepad2 } from 'lucide-react';
import { NavSectionId } from '../types';
import { HeroCricketStadium3D } from './HeroCricketStadium3D';

interface HomepageHeroProps {
  onNavigate: (section: NavSectionId) => void;
  onOpenOnboarding?: () => void;
}

export const HomepageHero: React.FC<HomepageHeroProps> = ({ onNavigate }) => {
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const update = () => setIsCompactViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section
      aria-label="CRICKIFY AI 3D Stadium Hero"
      className="relative rounded-3xl overflow-hidden bg-[#07120C] text-white border border-[#087F55]/30 shadow-2xl lg:min-h-[520px] flex flex-col"
    >
      {/* Full-Bleed Real-Time Three.js 3D Cricket Stadium Scene (Unobstructed Top Viewport on Mobile/Tablet, Full Bleed on Desktop) */}
      <div className="relative h-[225px] sm:h-[265px] w-full shrink-0 lg:absolute lg:inset-0 lg:h-full">
        <HeroCricketStadium3D isCompactViewport={isCompactViewport} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#07120C] lg:hidden"
        />
      </div>

      {/* Desktop Top-Left Readability Scrim (Tightly scoped to corner so center crease, stumps & batter stay vivid) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            'radial-gradient(ellipse 52% 62% at 15% 22%, rgba(7, 18, 12, 0.88) 0%, rgba(7, 18, 12, 0.58) 48%, rgba(7, 18, 12, 0.08) 80%, transparent 100%)',
        }}
      />

      {/* Subtle Bottom Pitch Crease Accent Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B7F34A]/65 to-transparent"
      />

      {/* Semantic Foreground Typography (Top-Left Corner on Desktop) & Compact 2x2 Action Grid (Bottom-Right Corner) */}
      <div className="relative z-10 lg:flex-1 flex flex-col justify-between lg:flex-row lg:justify-between gap-4 px-4 pb-5 pt-2 sm:px-7 sm:pb-6 lg:px-7 xl:px-9 lg:py-6 xl:py-7">
        <div className="max-w-[375px] xl:max-w-[465px] lg:self-start space-y-2 drop-shadow-[0_2px_8px_rgba(7,18,12,0.85)]">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold tracking-tight text-white leading-[0.93] uppercase"
            style={{ fontSize: 'clamp(2.05rem, 3.8vw, 3.65rem)' }}
          >
            THE FUTURE OF
            <br />
            <span className="text-[#B7F34A]">CRICKET STARTS HERE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs sm:text-[13.5px] font-extrabold tracking-[0.15em] uppercase"
          >
            <span className="text-[#38BDF8]">LEARN.</span>
            <span className="text-[#FF941F]">TRAIN.</span>
            <span className="text-[#B7F34A]">ANALYSE.</span>
            <span className="text-[#FDE047]">EVOLVE.</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="text-[13.5px] sm:text-sm xl:text-[14.5px] text-[#E3EDE4] leading-[1.45] max-w-[355px] xl:max-w-[425px]"
          >
            Step into a smarter era of cricket, where AI-powered coaching helps you refine your technique, read the game with confidence, and turn every practice session into progress you can take onto the pitch.
          </motion.p>
        </div>

        {/* Compact 2x2 Action Buttons anchored to Lower-Right Corner (Clear of Batter, Bat, Stumps & Crease) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="ml-auto lg:ml-0 lg:self-end w-full max-w-[316px] xl:max-w-[340px] shrink-0 grid grid-cols-[1.18fr_0.82fr] gap-2 xl:gap-2.5"
        >
          <button
            type="button"
            onClick={() => onNavigate('academy-batting')}
            className="min-h-[42px] px-2.5 xl:px-3.5 py-2 rounded-xl bg-[#B7F34A] hover:bg-[#c6f86b] hover:-translate-y-0.5 active:scale-[0.98] text-[#07120C] text-[11px] xl:text-xs font-extrabold tracking-wide uppercase transition-all shadow-[0_10px_24px_-8px_rgba(183,243,74,0.5)] whitespace-nowrap inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>START LEARNING</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('coach-chat')}
            className="min-h-[42px] px-2.5 xl:px-3.5 py-2 rounded-xl bg-[#103B2A]/95 hover:bg-[#087F55] hover:-translate-y-0.5 active:scale-[0.98] text-white border border-[#B7F34A]/50 text-[11px] xl:text-xs font-extrabold tracking-wide uppercase transition-all shadow-lg whitespace-nowrap inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
          >
            <Bot className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
            <span>AI COACH</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('practice-upload')}
            className="min-h-[42px] px-2.5 xl:px-3.5 py-2 rounded-xl bg-[#0B1E14]/90 hover:bg-[#133322] hover:-translate-y-0.5 active:scale-[0.98] text-white border border-white/30 text-[11px] xl:text-xs font-extrabold tracking-wide uppercase transition-all shadow-lg whitespace-nowrap inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
          >
            <Camera className="w-3.5 h-3.5 text-[#FF941F] shrink-0" />
            <span>ANALYSE MY VIDEO</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('playzone-batting')}
            className="min-h-[42px] px-2.5 xl:px-3.5 py-2 rounded-xl bg-[#0D262B]/95 hover:bg-[#133940] hover:-translate-y-0.5 active:scale-[0.98] text-white border border-[#38BDF8]/55 text-[11px] xl:text-xs font-extrabold tracking-wide uppercase transition-all shadow-lg whitespace-nowrap inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <span>PLAYNETS</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};
