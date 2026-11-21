import React from 'react';
import { CricketLesson } from '../types';

interface DiagramProps {
  type: CricketLesson['diagramType'];
}

export const CricketTechniqueDiagram: React.FC<DiagramProps> = ({ type }) => {
  return (
    <div className="rounded-2xl bg-white border border-[#17251A]/10 p-5 text-[#17251A] shadow-sm">
      <div className="flex items-center justify-between mb-3 text-xs text-[#397B32] font-mono font-semibold">
        <span>TECHNIQUE GUIDE</span>
        <span>CRICKIFY VISUAL GUIDE</span>
      </div>

      {type === 'grip' && (
        <svg viewBox="0 0 420 210" className="w-full h-48" role="img" aria-label="Batting grip V-alignment diagram">
          <rect x="0" y="0" width="420" height="210" rx="10" fill="#1C4D30" />
          <rect x="190" y="22" width="40" height="82" rx="8" fill="#17251A" stroke="#FF941F" strokeWidth="2" />
          <path d="M185 104 L235 104 L245 190 L175 190 Z" fill="#F8FAF2" stroke="#FF941F" strokeWidth="2" />
          <line x1="210" y1="22" x2="210" y2="190" stroke="#69A83F" strokeWidth="2" strokeDasharray="4 4" />
          <path d="M196 42 L210 58 L224 42" fill="none" stroke="#A8D94E" strokeWidth="3" strokeLinecap="round" />
          <path d="M196 72 L210 88 L224 72" fill="none" stroke="#FF941F" strokeWidth="3" strokeLinecap="round" />
          <text x="260" y="50" fill="#A8D94E" fontSize="12" fontWeight="600">Top Hand V (Control)</text>
          <text x="260" y="82" fill="#FF941F" fontSize="12" fontWeight="600">Bottom Hand V (Support)</text>
          <text x="35" y="145" fill="#F8FAF2" fontSize="11">Spine / Splice Line</text>
          <line x1="138" y1="141" x2="205" y2="141" stroke="#A8D94E" strokeWidth="1.5" />
        </svg>
      )}

      {(type === 'drive' || type === 'stance' || type === 'pull') && (
        <svg viewBox="0 0 420 210" className="w-full h-48" role="img" aria-label="Batting balance and shot trajectory diagram">
          <rect x="0" y="0" width="420" height="210" rx="10" fill="#1C4D30" />
          <line x1="20" y1="175" x2="400" y2="175" stroke="#A8D94E" strokeOpacity="0.6" strokeWidth="2" />
          <circle cx="190" cy="52" r="14" fill="#F8FAF2" />
          <line x1="190" y1="66" x2="182" y2="118" stroke="#F8FAF2" strokeWidth="5" strokeLinecap="round" />
          <line x1="182" y1="118" x2="215" y2="173" stroke="#A8D94E" strokeWidth="5" strokeLinecap="round" />
          <line x1="182" y1="118" x2="132" y2="173" stroke="#F8FAF2" strokeWidth="5" strokeLinecap="round" />
          <line x1="186" y1="78" x2="232" y2="104" stroke="#A8D94E" strokeWidth="4" strokeLinecap="round" />
          <line x1="232" y1="104" x2="246" y2="164" stroke="#FF941F" strokeWidth="6" strokeLinecap="round" />
          <line x1="190" y1="52" x2="215" y2="175" stroke="#FF941F" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="255" cy="166" r="7" fill="#FF941F" />
          <path d="M262 164 Q330 155 390 132" fill="none" stroke="#A8D94E" strokeWidth="2.5" strokeDasharray="6 4" />
          <text x="20" y="34" fill="#A8D94E" fontSize="12" fontWeight="600">
            {type === 'pull' ? 'Back-Foot Weight & Horizontal Bat Path' : 'Head Over Front Knee & High Elbow'}
          </text>
          <text x="235" y="48" fill="#F8FAF2" fontSize="11">Vertical Alignment Line</text>
          <text x="268" y="188" fill="#FF941F" fontSize="11">Contact Under Eyes</text>
        </svg>
      )}

      {(type === 'bowling-action' || type === 'yorker' || type === 'spin') && (
        <svg viewBox="0 0 420 210" className="w-full h-48" role="img" aria-label="Bowling pitch target and release diagram">
          <rect x="0" y="0" width="420" height="210" rx="10" fill="#1C4D30" />
          <rect x="30" y="138" width="360" height="44" fill="#2A623F" stroke="#A8D94E" strokeOpacity="0.6" strokeWidth="1.5" />
          <line x1="78" y1="138" x2="78" y2="182" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="342" y1="138" x2="342" y2="182" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="358" y1="104" x2="358" y2="138" stroke="#FF941F" strokeWidth="3" />
          <line x1="364" y1="104" x2="364" y2="138" stroke="#FF941F" strokeWidth="3" />
          {type === 'yorker' ? (
            <>
              <rect x="330" y="150" width="24" height="20" rx="3" fill="#A8D94E" fillOpacity="0.3" stroke="#A8D94E" strokeWidth="2" />
              <path d="M82 54 Q215 62 340 160" fill="none" stroke="#A8D94E" strokeWidth="3" />
              <text x="255" y="128" fill="#A8D94E" fontSize="11" fontWeight="600">Yorker Target (Popping Crease)</text>
            </>
          ) : type === 'spin' ? (
            <>
              <ellipse cx="285" cy="160" rx="22" ry="10" fill="#A8D94E" fillOpacity="0.3" stroke="#A8D94E" strokeWidth="2" />
              <path d="M84 56 Q190 22 285 158 Q322 140 356 122" fill="none" stroke="#A8D94E" strokeWidth="3" />
              <text x="155" y="32" fill="#A8D94E" fontSize="11" fontWeight="600">Loop &amp; Dip (High Revolutions)</text>
            </>
          ) : (
            <>
              <ellipse cx="268" cy="160" rx="24" ry="10" fill="#FF941F" fillOpacity="0.3" stroke="#FF941F" strokeWidth="2" />
              <path d="M82 48 Q185 88 268 158 L356 126" fill="none" stroke="#A8D94E" strokeWidth="3" />
              <text x="215" y="125" fill="#FF941F" fontSize="11" fontWeight="600">4th Stump Good Length</text>
            </>
          )}
          <circle cx="82" cy="52" r="7" fill="#FF941F" />
          <text x="28" y="34" fill="#F8FAF2" fontSize="12" fontWeight="600">Release Arc &amp; Target Zone</text>
        </svg>
      )}

      {(type === 'catching' || type === 'fielding' || type === 'wicketkeeping' || type === 'pitch') && (
        <svg viewBox="0 0 420 210" className="w-full h-48" role="img" aria-label="Cricket field and pitch layout diagram">
          <rect x="0" y="0" width="420" height="210" rx="10" fill="#1C4D30" />
          <ellipse cx="210" cy="105" rx="178" ry="88" fill="#397B32" fillOpacity="0.45" stroke="#A8D94E" strokeWidth="2" />
          <ellipse cx="210" cy="105" rx="108" ry="56" fill="none" stroke="#F8FAF2" strokeWidth="1.5" strokeDasharray="5 4" />
          <rect x="194" y="64" width="32" height="82" fill="#FF941F" fillOpacity="0.35" stroke="#F8FAF2" strokeWidth="1.5" />
          <line x1="190" y1="74" x2="230" y2="74" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="190" y1="136" x2="230" y2="136" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="155" cy="95" r="5" fill="#A8D94E" />
          <circle cx="265" cy="95" r="5" fill="#A8D94E" />
          <circle cx="210" cy="48" r="5" fill="#FF941F" />
          <circle cx="128" cy="140" r="5" fill="#A8D94E" />
          <circle cx="292" cy="140" r="5" fill="#A8D94E" />
          <text x="18" y="24" fill="#A8D94E" fontSize="11" fontWeight="600">
            {type === 'pitch' ? '22-Yard Pitch & 30-Yard Ring' : 'Fielding Positions & Ready Angles'}
          </text>
          <text x="292" y="196" fill="#F8FAF2" fontSize="10">30-Yard Inner Ring (Dotted)</text>
        </svg>
      )}
    </div>
  );
};
