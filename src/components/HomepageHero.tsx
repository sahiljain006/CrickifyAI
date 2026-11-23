import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Camera } from 'lucide-react';
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
      className="relative rounded-3xl overflow-hidden bg-[#07120C] text-white border border-[#087F55]/30 shadow-2xl min-h-[480px] sm:min-h-[550px] lg:min-h-[540px] flex flex-col justify-end lg:justify-center"
    >
      {/* Full-Bleed Real-Time Three.js 3D Cricket Stadium Scene */}
      <div className="absolute inset-x-0 top-0 h-[280px] sm:h-[360px] lg:inset-0 lg:h-full">
        <HeroCricketStadium3D isCompactViewport={isCompactViewport} />
      </div>

      {/* Responsive Readability Scrims (no backdrop-filter over WebGL) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 lg:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(7, 18, 12, 0.08) 0%, rgba(7, 18, 12, 0.35) 36%, rgba(7, 18, 12, 0.92) 56%, #07120C 72%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            'linear-gradient(96deg, rgba(7, 18, 12, 0.94) 0%, rgba(7, 18, 12, 0.82) 38%, rgba(7, 18, 12, 0.34) 62%, rgba(7, 18, 12, 0.12) 100%)',
        }}
      />

      {/* Subtle Bottom Pitch Crease Accent Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B7F34A]/65 to-transparent"
      />

      {/* Compact Top Spacer on Mobile/Tablet so 3D Batsman & Pitch Action Stays Unobstructed */}
      <div className="h-[190px] sm:h-[245px] lg:hidden pointer-events-none" aria-hidden="true" />

      {/* Semantic Foreground Typography & Three Working CTAs */}
      <div className="relative z-10 px-4 pb-5 pt-2 sm:px-8 sm:pb-8 lg:px-12 lg:py-12">
        <div className="max-w-[580px] space-y-2.5 sm:space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold tracking-tight text-white leading-[0.92] uppercase"
            style={{ fontSize: 'clamp(2.25rem, 5.2vw, 4.75rem)' }}
          >
            THE FUTURE OF
            <br />
            <span className="text-[#B7F34A]">CRICKET STARTS HERE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs sm:text-base font-extrabold tracking-[0.16em] uppercase"
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
            className="text-sm sm:text-[15px] text-[#E3EDE4] leading-relaxed max-w-lg"
          >
            One game. Smarter learning. AI-powered coaching. Better performance. Discover a new way to learn, practise and master cricket.
          </motion.p>

          {/* Three Prominent Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-1"
          >
            <button
              type="button"
              onClick={() => onNavigate('academy-batting')}
              className="col-span-2 sm:col-span-1 min-h-[46px] sm:min-h-[48px] px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] hover:-translate-y-0.5 active:scale-[0.98] text-[#07120C] text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all shadow-[0_12px_28px_-8px_rgba(183,243,74,0.55)] whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>START LEARNING</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('coach-chat')}
              className="min-h-[46px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#103B2A] hover:bg-[#087F55] hover:-translate-y-0.5 active:scale-[0.98] text-white border border-[#B7F34A]/45 text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
            >
              <Bot className="w-4 h-4 text-[#B7F34A] shrink-0" />
              <span>AI COACH</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('practice-upload')}
              className="min-h-[46px] sm:min-h-[48px] px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/18 hover:-translate-y-0.5 active:scale-[0.98] text-white border border-white/25 text-[11px] sm:text-sm font-extrabold tracking-wide uppercase transition-all whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
            >
              <Camera className="w-4 h-4 text-[#FF941F] shrink-0" />
              <span>ANALYSE MY VIDEO</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
