import React, { useEffect, useState } from 'react';
import { Loader2, Sliders, Sparkles } from 'lucide-react';
import { NavSectionId, PitchIQState, TurfRulesConfig } from '../types';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { authFetch } from '../lib/firebase';
import { parseApiJsonResponse } from '../lib/apiResponse';

interface TurfIQViewProps {
  section: NavSectionId;
  state: PitchIQState;
  onSaveTurfRules: (rules: TurfRulesConfig) => void;
  onOpenExercise: (id: string) => void;
}

const TURF_MODULES = {
  batting: [
    {
      title: 'Tennis-Ball & Short-Pitch Batting',
      points: [
        'Use a lighter bat speed and strong top-hand control—tennis balls grip and kick steeply off synthetic mats.',
        'Play late beside your eyes rather than reaching out early; let the bounce settle before committing.',
      ],
    },
    {
      title: 'Side-Net Angles & Controlled Power',
      points: [
        'Punch along the carpet past mid-off and mid-on to trigger side-wall and back-net scoring zones safely.',
        'Keep horizontal bat swings slightly downward to avoid skying catches straight into the roof net.',
      ],
    },
  ],
  bowling: [
    {
      title: 'Turf Yorkers & Wide-Line Discipline',
      points: [
        'Attack the base of the batter’s toes or wide guideline on 18-yard pitches—short deliveries sit up for flat-batted pulls.',
        'Hide slower cutters by keeping run-up and arm speed identical to your stock fast delivery.',
      ],
    },
    {
      title: 'Pace Variation & Zero-Wide Control',
      points: [
        'In 6–8 over games, wides and free-hits swing results rapidly. Aim at the 4th-stump corridor with 85% controlled effort.',
      ],
    },
  ],
  fielding: [
    {
      title: 'Wall Rebounds & Side-Net Awareness',
      points: [
        'Anticipate sharp angles off side nets and corner posts rather than over-running straight lines.',
        'Station quick-reflex fielders at tight mid-off/mid-on and one mobile sweeper behind square for wall rebounds.',
      ],
    },
    {
      title: 'Close Catching & Quick Underarm Returns',
      points: [
        'Keep hands soft in tight indoor boxes and relay quickly with low underarm throws to prevent risky 2nd runs.',
      ],
    },
  ],
};

export const TurfIQView: React.FC<TurfIQViewProps> = ({ section, state, onSaveTurfRules, onOpenExercise }) => {
  const [rules, setRules] = useState<TurfRulesConfig>(state.turfRules);
  const [rulesSaved, setRulesSaved] = useState(false);

  useEffect(() => {
    setRules(state.turfRules);
  }, [state.turfRules]);

  const [scenario, setScenario] = useState('Chasing 16 runs in the final over with 2 wickets in hand on an 18-yard turf pitch.');
  const [focusArea, setFocusArea] = useState('Last-Over Strategy');
  const [loading, setLoading] = useState(false);
  const [tacticError, setTacticError] = useState<string | null>(null);
  const [tactics, setTactics] = useState<{
    tacticalSummary: string;
    battingPlan: string[];
    bowlingPlan: string[];
    fieldingSetup: string[];
    lastOverChecklist: string[];
  } | null>(null);

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTurfRules(rules);
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2500);
  };

  const askTurfTactics = async () => {
    setLoading(true);
    setTacticError(null);
    try {
      const res = await authFetch('/api/turf/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, scenario, focusArea }),
      });
      const data = await parseApiJsonResponse<Record<string, unknown>>(
        res,
        '/api/turf/tactics',
        'Turf tactics error',
        false
      );
      if (!res.ok) throw new Error(String(data.error || 'Could not generate turf tactics.'));
      setTactics(data as typeof tactics);
    } catch (err) {
      setTacticError(err instanceof Error ? err.message : 'Unable to fetch turf tactical plan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Turf Arena Floodlit Pitch Header */}
      <section className="relative rounded-3xl overflow-hidden turf-arena-panel text-white shadow-xl">
        <div className="absolute inset-0">
          <img
            src={CRICKIFY_IMAGES.turfBox}
            alt="Turf box cricket arena"
            className="w-full h-full object-cover opacity-40"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, rgba(10, 31, 18, 0.94) 0%, rgba(16, 52, 30, 0.82) 55%, rgba(16, 48, 28, 0.48) 100%)',
            }}
          />
        </div>
        <div className="relative z-10 p-7 md:p-10 max-w-3xl space-y-3">
          <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider">
            Turf IQ · Box &amp; Tennis-Ball Cricket Arena
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            MASTER TURF &amp; BOX CRICKET
          </h1>
          <p className="text-sm md:text-base text-[#D7E4D8]">
            Configure your arena&apos;s exact side-wall, back-net, roof, and over rules—then get specialized tennis-ball batting, bowling, fielding, and match tactics.
          </p>
        </div>
      </section>

      {/* Discipline Guides */}
      <div className="grid md:grid-cols-3 gap-5">
        <div className={`athletic-card rounded-2xl p-5 space-y-3 ${section === 'turf-batting' ? 'ring-2 ring-[#397B32]' : ''}`}>
          <div className="text-xs font-bold text-[#397B32] uppercase tracking-wider">Turf Batting</div>
          {TURF_MODULES.batting.map((b, i) => (
            <div key={i} className="space-y-1">
              <h3 className="font-display text-xl font-bold text-[#153D25]">{b.title}</h3>
              {b.points.map((p, pIdx) => <p key={pIdx} className="text-xs text-[#68766A] leading-relaxed">• {p}</p>)}
            </div>
          ))}
          <button
            onClick={() => onOpenExercise('ex-tennis-wall-timing')}
            className="text-xs font-bold text-[#397B32] hover:text-[#153D25] transition-colors"
          >
            Practise Tennis-Ball Wall Timing →
          </button>
        </div>

        <div className={`athletic-card rounded-2xl p-5 space-y-3 ${section === 'turf-bowling' ? 'ring-2 ring-[#397B32]' : ''}`}>
          <div className="text-xs font-bold text-[#397B32] uppercase tracking-wider">Turf Bowling</div>
          {TURF_MODULES.bowling.map((b, i) => (
            <div key={i} className="space-y-1">
              <h3 className="font-display text-xl font-bold text-[#153D25]">{b.title}</h3>
              {b.points.map((p, pIdx) => <p key={pIdx} className="text-xs text-[#68766A] leading-relaxed">• {p}</p>)}
            </div>
          ))}
          <button
            onClick={() => onOpenExercise('ex-yorker-target')}
            className="text-xs font-bold text-[#397B32] hover:text-[#153D25] transition-colors"
          >
            Practise Crease-Line Yorkers →
          </button>
        </div>

        <div className={`athletic-card rounded-2xl p-5 space-y-3 ${section === 'turf-fielding' ? 'ring-2 ring-[#397B32]' : ''}`}>
          <div className="text-xs font-bold text-[#397B32] uppercase tracking-wider">Turf Fielding</div>
          {TURF_MODULES.fielding.map((b, i) => (
            <div key={i} className="space-y-1">
              <h3 className="font-display text-xl font-bold text-[#153D25]">{b.title}</h3>
              {b.points.map((p, pIdx) => <p key={pIdx} className="text-xs text-[#68766A] leading-relaxed">• {p}</p>)}
            </div>
          ))}
          <button
            onClick={() => onOpenExercise('ex-wall-catching')}
            className="text-xs font-bold text-[#397B32] hover:text-[#153D25] transition-colors"
          >
            Practise Rapid Wall Catching →
          </button>
        </div>
      </div>

      {/* Custom Turf Rules Configurator + Live Box Zone Schematic */}
      <div className="grid lg:grid-cols-12 gap-6">
        <form onSubmit={handleSaveRules} className="lg:col-span-8 athletic-card rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#397B32]" />
              <h2 className="font-display text-2xl font-bold text-[#153D25]">Custom Turf Arena Rules</h2>
            </div>
            {rulesSaved && <span className="text-xs font-bold text-[#397B32]">Rules saved for AI Tactics!</span>}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Players Per Side</label>
              <input
                type="number"
                min={4}
                max={11}
                value={rules.playersPerSide}
                onChange={(e) => setRules({ ...rules, playersPerSide: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Pitch Length (yards)</label>
              <input
                type="number"
                min={12}
                max={22}
                value={rules.pitchLengthYards}
                onChange={(e) => setRules({ ...rules, pitchLengthYards: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Overs Per Innings</label>
              <input
                type="number"
                min={3}
                max={20}
                value={rules.oversPerInnings}
                onChange={(e) => setRules({ ...rules, oversPerInnings: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Ball Type</label>
              <select
                value={rules.ballType}
                onChange={(e) => setRules({ ...rules, ballType: e.target.value as TurfRulesConfig['ballType'] })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              >
                <option value="Hard Tennis">Hard Tennis</option>
                <option value="Soft Tennis">Soft Tennis</option>
                <option value="Synthetic Turf Ball">Synthetic Turf Ball</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Side-Wall / Side-Net</label>
              <select
                value={rules.sideWallRule}
                onChange={(e) => setRules({ ...rules, sideWallRule: e.target.value as TurfRulesConfig['sideWallRule'] })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              >
                <option value="1 Run">1 Run</option>
                <option value="2 Runs">2 Runs</option>
                <option value="Dead Ball">Dead Ball</option>
                <option value="Out on Direct Catch">Out on Direct Catch</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Back-Net Rule</label>
              <select
                value={rules.backNetRule}
                onChange={(e) => setRules({ ...rules, backNetRule: e.target.value as TurfRulesConfig['backNetRule'] })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              >
                <option value="4 Runs">4 Runs</option>
                <option value="6 Runs">6 Runs</option>
                <option value="2 Runs">2 Runs</option>
                <option value="Out">Out</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Roof-Net Rule</label>
              <select
                value={rules.roofNetRule}
                onChange={(e) => setRules({ ...rules, roofNetRule: e.target.value as TurfRulesConfig['roofNetRule'] })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              >
                <option value="Dead Ball">Dead Ball</option>
                <option value="Out">Out</option>
                <option value="1 Run">1 Run</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Boundary Shape</label>
              <input
                type="text"
                value={rules.boundaryShape}
                onChange={(e) => setRules({ ...rules, boundaryShape: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#17251A]/8">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#17251A]">
              <input
                type="checkbox"
                checked={rules.noBallFreeHit}
                onChange={(e) => setRules({ ...rules, noBallFreeHit: e.target.checked })}
                className="accent-[#397B32]"
              />
              No-Ball triggers Free Hit
            </label>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25] transition-colors"
            >
              Save Turf Rules
            </button>
          </div>
        </form>

        {/* Interactive Arena Zone Visual */}
        <div className="lg:col-span-4 stadium-dark-panel text-white rounded-3xl p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-[#A8D94E]">
            <span>ARENA SCORING ZONES</span>
            <span>{rules.pitchLengthYards}Y PITCH</span>
          </div>
          <svg viewBox="0 0 320 220" className="w-full h-44" role="img" aria-label="Configured box turf scoring zone schematic">
            <rect x="16" y="16" width="288" height="188" rx="12" fill="#24552E" stroke="#A8D94E" strokeWidth="2" />
            <rect x="44" y="88" width="232" height="44" fill="#69A83F" fillOpacity="0.45" stroke="#FFFFFF" strokeWidth="1" />
            <line x1="78" y1="88" x2="78" y2="132" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="242" y1="88" x2="242" y2="132" stroke="#FFFFFF" strokeWidth="2" />
            <text x="160" y="34" fill="#A8D94E" fontSize="10" fontWeight="700" textAnchor="middle">
              SIDE NET: {rules.sideWallRule}
            </text>
            <text x="160" y="196" fill="#A8D94E" fontSize="10" fontWeight="700" textAnchor="middle">
              SIDE NET: {rules.sideWallRule}
            </text>
            <text x="292" y="114" fill="#FF941F" fontSize="10" fontWeight="700" textAnchor="end">
              BACK: {rules.backNetRule}
            </text>
            <text x="160" y="114" fill="#FFFFFF" fontSize="10" textAnchor="middle">
              Roof Net: {rules.roofNetRule}
            </text>
          </svg>
          <div className="text-xs text-white/85">
            {rules.playersPerSide}v{rules.playersPerSide} · {rules.oversPerInnings} Overs · {rules.ballType}
          </div>
        </div>
      </div>

      {/* AI Turf Match Strategy Generator */}
      <div className="athletic-card rounded-3xl p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-2 text-[#397B32] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#FF941F]" /> Rule-Aware AI Turf Strategy Engine
        </div>
        <h2 className="font-display text-3xl font-bold text-[#17251A]">Generate Turf Tactics for Your Local Rules</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#17251A] mb-1">Match Situation / Tactical Question</label>
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F7FAF3] border border-[#17251A]/15 text-sm text-[#17251A]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-1">Focus Area</label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F7FAF3] border border-[#17251A]/15 text-sm text-[#17251A]"
            >
              <option value="Last-Over Strategy">Last-Over Strategy</option>
              <option value="Batting Order & Chasing">Batting Order &amp; Chasing</option>
              <option value="Defending Total & Bowling Rotation">Defending Total &amp; Bowling Rotation</option>
              <option value="Opponent Weakness Exploitation">Opponent Weakness Exploitation</option>
            </select>
          </div>
        </div>

        <button
          onClick={askTurfTactics}
          disabled={loading}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Generate Strategy Using Configured Rules
        </button>

        {tacticError && <p className="text-xs text-red-700 font-medium">{tacticError}</p>}

        {tactics && (
          <div className="bg-[#EDF3E8] rounded-2xl p-5 border border-[#397B32]/20 space-y-4">
            <p className="text-sm text-[#17251A] font-medium">{tactics.tacticalSummary}</p>
            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#D5F3DC] border border-[#087F55]/20 rounded-xl p-4">
                <div className="font-bold text-[#075E3F] mb-1.5">Batting Plan</div>
                <ul className="space-y-1 text-[#102419]">{tactics.battingPlan.map((p, i) => <li key={i}>• {p}</li>)}</ul>
              </div>
              <div className="bg-[#E4F6C8] border border-[#4D7C0F]/20 rounded-xl p-4">
                <div className="font-bold text-[#365314] mb-1.5">Bowling Rotation &amp; Lines</div>
                <ul className="space-y-1 text-[#102419]">{tactics.bowlingPlan.map((p, i) => <li key={i}>• {p}</li>)}</ul>
              </div>
              <div className="bg-[#FDE9C2] border border-[#D96B00]/20 rounded-xl p-4">
                <div className="font-bold text-[#9A4200] mb-1.5">Box Field Setup</div>
                <ul className="space-y-1 text-[#102419]">{tactics.fieldingSetup.map((p, i) => <li key={i}>• {p}</li>)}</ul>
              </div>
              <div className="bg-[#D7EEF8] border border-[#0284C7]/20 rounded-xl p-4">
                <div className="font-bold text-[#075985] mb-1.5">Last-Over Checklist</div>
                <ul className="space-y-1 text-[#102419]">{tactics.lastOverChecklist.map((p, i) => <li key={i}>• {p}</li>)}</ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
