import React from 'react';

export const CricketBackdropAtmosphere: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-0 select-none"
    >
      {/* Sunlit Stadium & Lime Outfield Washes */}
      <div
        className="absolute -top-32 -left-28 w-[420px] sm:w-[540px] h-[420px] sm:h-[540px] rounded-full blur-3xl animate-floodlight-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(163, 230, 53, 0.2) 0%, rgba(16, 185, 129, 0.08) 54%, transparent 76%)',
        }}
      />
      <div
        className="absolute top-[22%] -right-36 w-[440px] sm:w-[560px] h-[440px] sm:h-[560px] rounded-full blur-3xl animate-floodlight-pulse"
        style={{
          animationDelay: '1.8s',
          background: 'radial-gradient(circle, rgba(255, 148, 31, 0.14) 0%, rgba(16, 185, 129, 0.06) 55%, transparent 78%)',
        }}
      />
      <div
        className="absolute bottom-[-120px] left-[18%] w-[460px] sm:w-[620px] h-[340px] sm:h-[440px] rounded-full blur-3xl animate-floodlight-pulse"
        style={{
          animationDelay: '3.2s',
          background: 'radial-gradient(circle, rgba(8, 127, 85, 0.14) 0%, rgba(183, 243, 74, 0.08) 55%, transparent 78%)',
        }}
      />

      {/* Subtle Cricket Field Chalk Geometry & Pitch Texture */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full opacity-[0.2]"
      >
        <defs>
          <pattern id="turf-micro-dots" width="36" height="36" patternUnits="userSpaceOnUse">
            <circle cx="18" cy="18" r="1.2" fill="#087F55" fillOpacity="0.22" />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#turf-micro-dots)" />
        <ellipse
          cx="720"
          cy="450"
          rx="640"
          ry="385"
          fill="none"
          stroke="#087F55"
          strokeOpacity="0.48"
          strokeWidth="1.6"
          strokeDasharray="10 10"
        />
        <ellipse
          cx="720"
          cy="450"
          rx="410"
          ry="240"
          fill="none"
          stroke="#103B2A"
          strokeOpacity="0.32"
          strokeWidth="1.2"
          strokeDasharray="6 8"
        />
        <rect
          x="678"
          y="255"
          width="84"
          height="390"
          rx="4"
          fill="rgba(217, 179, 108, 0.14)"
          stroke="#087F55"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <line x1="650" y1="295" x2="790" y2="295" stroke="#087F55" strokeOpacity="0.42" strokeWidth="1.5" />
        <line x1="650" y1="605" x2="790" y2="605" stroke="#087F55" strokeOpacity="0.42" strokeWidth="1.5" />
      </svg>

      {/* Animated Cricket Leather Ball (Visible on Mobile & Desktop Top-Left) */}
      <div className="absolute top-20 left-2 sm:top-24 sm:left-[3%] w-11 h-11 sm:w-16 sm:h-16 opacity-[0.24] sm:opacity-[0.28] animate-cricket-float">
        <svg viewBox="0 0 64 64" className="w-full h-full animate-cricket-spin">
          <defs>
            <radialGradient id="bg-ball-red" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="58%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#7F1D1D" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="24" fill="url(#bg-ball-red)" stroke="#7F1D1D" strokeOpacity="0.4" strokeWidth="1.2" />
          <path
            d="M 14 21 Q 32 32 50 43"
            fill="none"
            stroke="#FFFBEB"
            strokeWidth="2.4"
            strokeDasharray="3.5 3"
            strokeLinecap="round"
          />
          <path
            d="M 16 17 Q 34 28 52 39"
            fill="none"
            stroke="#FFFBEB"
            strokeOpacity="0.7"
            strokeWidth="1.2"
            strokeDasharray="2 3"
          />
        </svg>
      </div>

      {/* Animated Crossed Cricket Bats & Ball (Visible on Mobile & Desktop Top-Right) */}
      <div
        className="absolute top-24 right-2 sm:top-32 sm:right-[3.5%] w-14 h-14 sm:w-24 sm:h-24 opacity-[0.22] sm:opacity-[0.26] animate-cricket-float"
        style={{ animationDelay: '1.2s' }}
      >
        <svg viewBox="0 0 96 96" className="w-full h-full">
          <g transform="rotate(-28 48 48)">
            <rect x="43" y="10" width="10" height="22" rx="3" fill="#087F55" />
            <rect x="40" y="32" width="16" height="48" rx="4" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          </g>
          <g transform="rotate(28 48 48)">
            <rect x="43" y="10" width="10" height="22" rx="3" fill="#FF941F" />
            <rect x="40" y="32" width="16" height="48" rx="4" fill="#FDE68A" stroke="#D97706" strokeWidth="1.8" />
          </g>
          <circle cx="48" cy="24" r="7" fill="#DC2626" stroke="#FFFBEB" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Animated Stumps & Flying Bails (Mid-Left Margin) */}
      <div
        className="hidden sm:block absolute top-[48%] left-[2%] w-16 lg:w-20 h-16 lg:h-20 opacity-[0.25] animate-cricket-float"
        style={{ animationDelay: '2.4s' }}
      >
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <line x1="26" y1="22" x2="26" y2="70" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
          <line x1="40" y1="22" x2="40" y2="70" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
          <line x1="54" y1="22" x2="54" y2="70" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
          <path d="M 21 17 L 34 15" stroke="#EA580C" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 44 13 L 58 17" stroke="#087F55" strokeWidth="3.2" strokeLinecap="round" />
          <circle cx="62" cy="36" r="5.5" fill="#DC2626" />
        </svg>
      </div>

      {/* Animated Turf Tennis Ball (Visible on Mobile & Desktop Mid-Right) */}
      <div
        className="absolute top-[56%] right-1.5 sm:top-[62%] sm:right-[2.5%] w-10 h-10 sm:w-16 sm:h-16 opacity-[0.23] sm:opacity-[0.26] animate-cricket-float"
        style={{ animationDelay: '0.8s' }}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full animate-cricket-spin" style={{ animationDirection: 'reverse' }}>
          <defs>
            <radialGradient id="bg-ball-lime" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#BEF264" />
              <stop offset="60%" stopColor="#65A30D" />
              <stop offset="100%" stopColor="#3F6212" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="22" fill="url(#bg-ball-lime)" stroke="#3F6212" strokeOpacity="0.35" strokeWidth="1" />
          <path d="M 15 19 Q 30 32 15 45" fill="none" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2.4" />
          <path d="M 49 19 Q 34 32 49 45" fill="none" stroke="#FFFFFF" strokeOpacity="0.85" strokeWidth="2.4" />
        </svg>
      </div>

      {/* Animated Trophy & Boundary Arc (Bottom-Left) */}
      <div
        className="absolute bottom-20 left-2 sm:bottom-16 sm:left-[4%] w-11 h-11 sm:w-16 sm:h-16 opacity-[0.2] sm:opacity-[0.22] animate-cricket-float"
        style={{ animationDelay: '3.1s' }}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M 18 14 H 46 V 26 C 46 35 40 42 32 42 C 24 42 18 35 18 26 Z"
            fill="#F59E0B"
            fillOpacity="0.85"
            stroke="#92400E"
            strokeWidth="1.5"
          />
          <rect x="29" y="42" width="6" height="9" fill="#D97706" />
          <rect x="22" y="51" width="20" height="5" rx="2" fill="#B45309" />
          <circle cx="50" cy="16" r="4" fill="#087F55" />
        </svg>
      </div>

      {/* Animated Sixer Ball Trail (Bottom-Right) */}
      <div
        className="absolute bottom-24 right-2 sm:bottom-20 sm:right-[5%] w-12 h-12 sm:w-20 sm:h-20 opacity-[0.22] sm:opacity-[0.26] animate-cricket-float"
        style={{ animationDelay: '1.9s' }}
      >
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <path
            d="M 10 62 Q 36 22 66 18"
            fill="none"
            stroke="#EA580C"
            strokeWidth="2.8"
            strokeDasharray="6 4"
            strokeLinecap="round"
          />
          <circle cx="66" cy="18" r="8" fill="#FF941F" stroke="#9A3412" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
};
