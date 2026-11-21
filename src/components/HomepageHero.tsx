import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Bot, Camera } from 'lucide-react';
import { NavSectionId } from '../types';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { HeroCricketBall3D } from './HeroCricketBall3D';

interface HomepageHeroProps {
  onNavigate: (section: NavSectionId) => void;
  onOpenOnboarding?: () => void;
}

export const HomepageHero: React.FC<HomepageHeroProps> = ({ onNavigate }) => {
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setPointerOffset({
      x: Math.max(-1, Math.min(1, normX)),
      y: Math.max(-1, Math.min(1, normY)),
    });
  };

  const handlePointerLeave = () => {
    setPointerOffset({ x: 0, y: 0 });
  };

  return (
    <section
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative rounded-3xl overflow-hidden bg-[#0A1610] text-white border border-[#B7F34A]/20 shadow-2xl"
    >
      {/* Layer 1: Floodlit Cricket Stadium Backdrop with Subtle Parallax */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-[-3%] transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${pointerOffset.x * -10}px, ${pointerOffset.y * -6}px, 0)`,
          }}
        >
          <img
            src={CRICKIFY_IMAGES.heroStadium}
            alt="Floodlit cricket stadium under dramatic night lights"
            className="w-full h-full object-cover object-center opacity-45 animate-stadium-drift"
          />
        </div>
      </div>

      {/* Layer 2: Floodlight Beams, Animated Stadium Pulse & Subtle Motes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 78% 18%, rgba(183, 243, 74, 0.24) 0%, rgba(16, 59, 42, 0.48) 38%, rgba(10, 22, 16, 0.95) 78%), linear-gradient(100deg, rgba(8, 18, 13, 0.96) 0%, rgba(16, 59, 42, 0.78) 52%, rgba(10, 22, 16, 0.54) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-8 w-80 h-80 rounded-full bg-[#B7F34A]/16 blur-3xl animate-floodlight-pulse"
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="hero-mote" style={{ top: '20%', left: '14%', animationDelay: '0s' }} />
        <span className="hero-mote" style={{ top: '34%', left: '56%', animationDelay: '1.1s' }} />
        <span className="hero-mote" style={{ top: '68%', left: '38%', animationDelay: '2.2s' }} />
        <span className="hero-mote" style={{ top: '24%', left: '84%', animationDelay: '0.7s' }} />
      </div>

      {/* Subtle Pitch Crease Horizon Line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B7F34A]/55 to-transparent"
      />

      {/* Foreground Content */}
      <div className="relative z-10 px-4 py-6 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-6 items-center">
          {/* Left Hero Typography & 3 Core CTAs */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] sm:text-sm font-extrabold tracking-[0.24em] uppercase text-[#B7F34A]"
            >
              CRICKIFY
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.44, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-extrabold tracking-tight text-white leading-[0.92] uppercase"
              style={{ fontSize: 'clamp(2.35rem, 5.2vw, 4.75rem)' }}
            >
              OWN THE CREASE.
              <br />
              <span className="text-[#B7F34A]">MASTER THE GAME.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-base font-bold tracking-[0.16em] uppercase text-[#B7F34A]"
            >
              LEARN. TRAIN. ANALYSE. LEVEL UP.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.44, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-[15px] text-[#E3EDE4] leading-relaxed max-w-xl"
            >
              Your cricket journey, powered by AI. Learn the techniques, sharpen your skills and turn every practice session into progress.
            </motion.p>

            {/* Exactly Three Prominent Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.44, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-1"
            >
              <button
                type="button"
                onClick={() => onNavigate('academy-batting')}
                className="col-span-2 sm:col-span-1 min-h-[46px] sm:min-h-[48px] px-5 sm:px-7 py-2.5 sm:py-3 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] hover:-translate-y-0.5 active:scale-[0.98] text-[#0A1610] text-xs sm:text-sm font-extrabold tracking-wide uppercase transition-all shadow-[0_12px_28px_-8px_rgba(183,243,74,0.55)] whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
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

          {/* Right Atmospheric Cover-Drive Frame + 3D Rotating Leather Cricket Ball */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.54, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative flex items-center justify-center pt-1 pb-2 sm:py-2"
          >
            <div
              className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-[16/10] sm:aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#B7F34A]/30 shadow-2xl bg-[#102B1B]"
              style={{
                transform: `translate3d(${pointerOffset.x * 8}px, ${pointerOffset.y * 5}px, 0)`,
                transition: 'transform 220ms ease-out',
              }}
            >
              <img
                src={CRICKIFY_IMAGES.heroCoverDrive}
                alt="Cricket batter playing a classical front-foot cover drive under floodlights"
                className="w-full h-full object-cover object-top sm:object-center"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(10, 22, 16, 0.04) 0%, rgba(10, 22, 16, 0.38) 100%)',
                }}
              />
            </div>

            {/* 3D Floating & Rotating Red-Leather Cricket Ball */}
            <div
              className="w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 absolute -bottom-2 right-1 sm:-bottom-4 sm:right-2 lg:-right-3 z-20 pointer-events-none"
              style={{
                transform: `translate3d(${pointerOffset.x * 14}px, ${pointerOffset.y * 10}px, 0)`,
                transition: 'transform 180ms ease-out',
              }}
            >
              <HeroCricketBall3D />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
