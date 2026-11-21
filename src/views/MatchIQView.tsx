import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bookmark, Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { NavSectionId, PitchIQState, ScorecardBattingRow, ScorecardBowlingRow } from '../types';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { authFetch } from '../lib/firebase';
import {
  deleteMatchAnalysisFromFirestore,
  listMatchAnalysesFromFirestore,
  SavedMatchAnalysis,
  saveMatchAnalysisToFirestore,
} from '../lib/firestoreRepo';

interface MatchIQViewProps {
  section: NavSectionId;
  authUserId?: string | null;
  authUserEmail?: string;
  state?: PitchIQState;
  onRequireAuth?: (reason: string) => void;
}

const SAMPLE_BATTING: ScorecardBattingRow[] = [
  { id: 'b1', playerName: 'Batter 1 (Sample)', runs: 42, balls: 31, fours: 5, sixes: 1, dismissal: 'c Cover b Off-Spinner' },
  { id: 'b2', playerName: 'Batter 2 (Sample)', runs: 19, balls: 22, fours: 2, sixes: 0, dismissal: 'b Fast Bowler (Yorker)' },
  { id: 'b3', playerName: 'Batter 3 (Sample)', runs: 54, balls: 36, fours: 6, sixes: 2, dismissal: 'Not Out' },
];

const SAMPLE_BOWLING: ScorecardBowlingRow[] = [
  { id: 'bw1', bowlerName: 'Bowler A (Sample)', overs: 4, maidens: 0, runsConceded: 28, wickets: 2, wides: 1, noBalls: 0 },
  { id: 'bw2', bowlerName: 'Bowler B (Sample)', overs: 4, maidens: 0, runsConceded: 39, wickets: 1, wides: 3, noBalls: 1 },
];

export const MatchIQView: React.FC<MatchIQViewProps> = ({
  authUserId,
  authUserEmail = '',
  state: appState,
  onRequireAuth,
}) => {
  const [matchFormat, setMatchFormat] = useState('T20 (20 Overs)');
  const [teamName, setTeamName] = useState('My XI');
  const [opponentName, setOpponentName] = useState('Opposition XI');
  const [battingRows, setBattingRows] = useState<ScorecardBattingRow[]>(SAMPLE_BATTING);
  const [bowlingRows, setBowlingRows] = useState<ScorecardBowlingRow[]>(SAMPLE_BOWLING);
  const [notes, setNotes] = useState('Sample scorecard loaded — replace with your actual match scorecard or upload CSV.');
  const [fieldPhase, setFieldPhase] = useState<'powerplay' | 'middle' | 'death'>('powerplay');

  const [analyzing, setAnalyzing] = useState(false);
  const [savingMatch, setSavingMatch] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [savedMatches, setSavedMatches] = useState<SavedMatchAnalysis[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    battingPatterns: string[];
    bowlingPatterns: string[];
    powerplayPlan: string;
    middleOversPlan: string;
    deathOversPlan: string;
    opponentInsights: string[];
  } | null>(null);

  useEffect(() => {
    if (!authUserId) {
      setSavedMatches([]);
      return;
    }
    listMatchAnalysesFromFirestore(authUserId)
      .then((rows) => setSavedMatches(rows))
      .catch(() => {});
  }, [authUserId]);

  const totals = useMemo(() => {
    const runs = battingRows.reduce((s, r) => s + r.runs, 0);
    const balls = battingRows.reduce((s, r) => s + r.balls, 0);
    const fours = battingRows.reduce((s, r) => s + r.fours, 0);
    const sixes = battingRows.reduce((s, r) => s + r.sixes, 0);
    const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';

    const bwOvers = bowlingRows.reduce((s, r) => s + r.overs, 0);
    const bwRuns = bowlingRows.reduce((s, r) => s + r.runsConceded, 0);
    const bwWkts = bowlingRows.reduce((s, r) => s + r.wickets, 0);
    const econ = bwOvers > 0 ? (bwRuns / bwOvers).toFixed(2) : '0.00';

    return { runs, balls, fours, sixes, sr, bwOvers, bwRuns, bwWkts, econ };
  }, [battingRows, bowlingRows]);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return;
      const parsed: ScorecardBattingRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (cols.length >= 3) {
          parsed.push({
            id: `csv-${i}`,
            playerName: cols[0] || `Player ${i}`,
            runs: Number(cols[1]) || 0,
            balls: Number(cols[2]) || 0,
            fours: Number(cols[3]) || 0,
            sixes: Number(cols[4]) || 0,
            dismissal: cols[5] || 'Not specified',
          });
        }
      }
      if (parsed.length > 0) setBattingRows(parsed);
    };
    reader.readAsText(file);
  };

  const runMatchAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await authFetch('/api/match/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchFormat,
          teamName,
          opponentName,
          battingRows,
          bowlingRows,
          notes,
        }),
      });
      const rawText = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(!res.ok ? `Scorecard analysis error (HTTP ${res.status}).` : 'Server returned an unexpected response.');
      }
      if (!res.ok) throw new Error(String(data.error || 'Scorecard analysis failed.'));
      setAnalysis(data as typeof analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to analyze scorecard.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveMatchRecord = async () => {
    if (!authUserId || !appState) {
      onRequireAuth?.('save your Match IQ scorecard and tactical review');
      return;
    }
    setSavingMatch(true);
    setSaveNotice(null);
    setError(null);
    try {
      const record: SavedMatchAnalysis = {
        id: `match-${Date.now()}`,
        createdAt: new Date().toISOString(),
        matchFormat,
        teamName,
        opponentName,
        battingRows,
        bowlingRows,
        notes,
        analysis,
      };
      await saveMatchAnalysisToFirestore(authUserId, authUserEmail, appState, record);
      setSavedMatches((prev) => [record, ...prev]);
      setSaveNotice('Saved to your Firebase account!');
      setTimeout(() => setSaveNotice(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scorecard.');
    } finally {
      setSavingMatch(false);
    }
  };

  const handleDeleteSavedMatch = async (id: string) => {
    if (!authUserId) return;
    await deleteMatchAnalysisFromFirestore(authUserId, id);
    setSavedMatches((prev) => prev.filter((m) => m.id !== id));
  };

  const chartData = battingRows.map((r) => ({
    name: r.playerName.split(' ')[0],
    Runs: r.runs,
    SR: r.balls > 0 ? Math.round((r.runs / r.balls) * 100) : 0,
  }));

  const FIELD_COORDS = {
    powerplay: [
      { label: 'Slip', x: 218, y: 78 },
      { label: 'Point', x: 270, y: 120 },
      { label: 'Cover', x: 266, y: 158 },
      { label: 'Mid-Off', x: 235, y: 185 },
      { label: 'Mid-On', x: 185, y: 185 },
      { label: 'Mid-Wicket', x: 152, y: 158 },
      { label: 'Square Leg', x: 148, y: 120 },
      { label: 'Fine Leg (Deep)', x: 145, y: 46 },
      { label: 'Third Man (Deep)', x: 275, y: 46 },
    ],
    middle: [
      { label: 'Long-Off', x: 248, y: 232 },
      { label: 'Long-On', x: 172, y: 232 },
      { label: 'Deep Mid-Wicket', x: 105, y: 176 },
      { label: 'Deep Cover', x: 312, y: 170 },
      { label: 'Point', x: 268, y: 120 },
      { label: 'Short Third', x: 245, y: 80 },
      { label: 'Mid-Wicket (Ring)', x: 160, y: 154 },
      { label: 'Mid-On (Ring)', x: 186, y: 182 },
      { label: 'Fine Leg', x: 165, y: 76 },
    ],
    death: [
      { label: 'Long-Off', x: 248, y: 232 },
      { label: 'Long-On', x: 172, y: 232 },
      { label: 'Deep Extra Cover', x: 306, y: 192 },
      { label: 'Deep Point', x: 325, y: 124 },
      { label: 'Deep Square', x: 96, y: 124 },
      { label: 'Short Fine', x: 175, y: 82 },
      { label: 'Extra Cover (Ring)', x: 256, y: 165 },
      { label: 'Mid-Wicket (Ring)', x: 160, y: 155 },
      { label: 'Short Third', x: 245, y: 80 },
    ],
  }[fieldPhase];

  return (
    <div className="space-y-8">
      {/* Broadcast Match-Centre Scoreboard Header */}
      <div className="relative rounded-3xl overflow-hidden scoreboard-dark-panel text-white p-7 md:p-10 shadow-xl">
        <img
          src={CRICKIFY_IMAGES.cricketPitch}
          alt="Cricket pitch match analytics"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(108deg, rgba(16, 23, 26, 0.94) 0%, rgba(23, 35, 38, 0.86) 55%, rgba(18, 33, 28, 0.6) 100%)',
          }}
        />
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="text-xs font-bold text-[#FF941F] uppercase tracking-wider">Match IQ · Broadcast Scoreboard Centre</div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
            Scorecard Analytics, Field Placements &amp; Match Tactics
          </h1>
          <p className="text-sm text-[#D7E4D8]">
            Enter your scorecard or upload a CSV (Player, Runs, Balls, 4s, 6s, Dismissal). All rates are computed strictly from your entered data without inventing missing events.
          </p>
        </div>
      </div>

      {/* Match Header + CSV */}
      <div className="athletic-card rounded-2xl p-6 space-y-5">
        <div className="grid sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-1">Format</label>
            <select
              value={matchFormat}
              onChange={(e) => setMatchFormat(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
            >
              <option>T20 (20 Overs)</option>
              <option>ODI (50 Overs)</option>
              <option>Turf / Short Format</option>
              <option>Red-Ball / Two-Day</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-1">Your Team</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-1">Opponent</label>
            <input
              type="text"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
            />
          </div>
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#EDF1E7] text-xs font-bold text-[#153D25] cursor-pointer hover:bg-[#dfe6d6] transition-colors">
            <Upload className="w-4 h-4 text-[#397B32]" /> Import Batting CSV
            <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
          </label>
        </div>

        {/* Broadcast Scoreboard KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-[#10171A] text-white">
            <div className="text-xs text-[#9DB3A2] font-medium">Entered Runs / Balls</div>
            <div className="font-mono text-2xl font-bold text-white tabular-nums mt-0.5">
              {totals.runs} <span className="text-sm font-normal text-[#9DB3A2]">({totals.balls}b)</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#10171A] text-white">
            <div className="text-xs text-[#9DB3A2] font-medium">Team Strike Rate</div>
            <div className="font-mono text-2xl font-bold text-[#A8D94E] tabular-nums mt-0.5">{totals.sr}</div>
          </div>
          <div className="p-4 rounded-xl bg-[#10171A] text-white">
            <div className="text-xs text-[#9DB3A2] font-medium">Boundaries (4s / 6s)</div>
            <div className="font-mono text-2xl font-bold text-[#FF941F] tabular-nums mt-0.5">
              {totals.fours} / {totals.sixes}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#10171A] text-white">
            <div className="text-xs text-[#9DB3A2] font-medium">Bowling Economy</div>
            <div className="font-mono text-2xl font-bold text-white tabular-nums mt-0.5">
              {totals.econ} <span className="text-xs font-normal text-[#9DB3A2]">({totals.bwWkts}w)</span>
            </div>
          </div>
        </div>

        {/* Editable Batting Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#153D25]">Batting Scorecard Entries</h2>
            <button
              onClick={() =>
                setBattingRows((prev) => [
                  ...prev,
                  { id: `b-${Date.now()}`, playerName: `Batter ${prev.length + 1}`, runs: 0, balls: 0, fours: 0, sixes: 0, dismissal: 'Not Out' },
                ])
              }
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Batter
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EDF1E7] text-[#153D25] font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Player</th>
                  <th className="p-2.5 text-right">Runs</th>
                  <th className="p-2.5 text-right">Balls</th>
                  <th className="p-2.5 text-right">4s</th>
                  <th className="p-2.5 text-right">6s</th>
                  <th className="p-2.5 text-right">SR</th>
                  <th className="p-2.5">Dismissal</th>
                  <th className="p-2.5 rounded-r-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17251A]/10">
                {battingRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="p-2">
                      <input
                        value={row.playerName}
                        onChange={(e) =>
                          setBattingRows((p) => p.map((r, i) => (i === idx ? { ...r, playerName: e.target.value } : r)))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.runs}
                        onChange={(e) =>
                          setBattingRows((p) => p.map((r, i) => (i === idx ? { ...r, runs: Number(e.target.value) } : r)))
                        }
                        className="w-16 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.balls}
                        onChange={(e) =>
                          setBattingRows((p) => p.map((r, i) => (i === idx ? { ...r, balls: Number(e.target.value) } : r)))
                        }
                        className="w-16 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.fours}
                        onChange={(e) =>
                          setBattingRows((p) => p.map((r, i) => (i === idx ? { ...r, fours: Number(e.target.value) } : r)))
                        }
                        className="w-14 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.sixes}
                        onChange={(e) =>
                          setBattingRows((p) => p.map((r, i) => (i === idx ? { ...r, sixes: Number(e.target.value) } : r)))
                        }
                        className="w-14 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2 text-right font-mono tabular-nums font-bold text-[#397B32]">
                      {row.balls > 0 ? ((row.runs / row.balls) * 100).toFixed(1) : '0.0'}
                    </td>
                    <td className="p-2">
                      <input
                        value={row.dismissal}
                        onChange={(e) =>
                          setBattingRows((p) => p.map((r, i) => (i === idx ? { ...r, dismissal: e.target.value } : r)))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => setBattingRows((p) => p.filter((_, i) => i !== idx))}
                        aria-label="Remove row"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Editable Bowling Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-[#153D25]">Bowling Scorecard Entries</h2>
            <button
              onClick={() =>
                setBowlingRows((prev) => [
                  ...prev,
                  { id: `bw-${Date.now()}`, bowlerName: `Bowler ${prev.length + 1}`, overs: 4, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0 },
                ])
              }
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bowler
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#EDF1E7] text-[#153D25] font-bold">
                <tr>
                  <th className="p-2.5 rounded-l-lg">Bowler</th>
                  <th className="p-2.5 text-right">Overs</th>
                  <th className="p-2.5 text-right">Runs</th>
                  <th className="p-2.5 text-right">Wkts</th>
                  <th className="p-2.5 text-right">Wides</th>
                  <th className="p-2.5 text-right">Econ</th>
                  <th className="p-2.5 rounded-r-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#17251A]/10">
                {bowlingRows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="p-2">
                      <input
                        value={row.bowlerName}
                        onChange={(e) =>
                          setBowlingRows((p) => p.map((r, i) => (i === idx ? { ...r, bowlerName: e.target.value } : r)))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={row.overs}
                        onChange={(e) =>
                          setBowlingRows((p) => p.map((r, i) => (i === idx ? { ...r, overs: Number(e.target.value) } : r)))
                        }
                        className="w-16 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.runsConceded}
                        onChange={(e) =>
                          setBowlingRows((p) => p.map((r, i) => (i === idx ? { ...r, runsConceded: Number(e.target.value) } : r)))
                        }
                        className="w-16 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.wickets}
                        onChange={(e) =>
                          setBowlingRows((p) => p.map((r, i) => (i === idx ? { ...r, wickets: Number(e.target.value) } : r)))
                        }
                        className="w-16 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min={0}
                        value={row.wides}
                        onChange={(e) =>
                          setBowlingRows((p) => p.map((r, i) => (i === idx ? { ...r, wides: Number(e.target.value) } : r)))
                        }
                        className="w-16 text-right font-mono px-2 py-1.5 rounded-lg border border-[#17251A]/12 bg-[#F8FAF2]"
                      />
                    </td>
                    <td className="p-2 text-right font-mono tabular-nums font-bold text-[#397B32]">
                      {row.overs > 0 ? (row.runsConceded / row.overs).toFixed(2) : '0.00'}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => setBowlingRows((p) => p.filter((_, i) => i !== idx))}
                        aria-label="Remove bowler"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#17251A]/8">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Match notes (pitch pace, chasing target, key turning point)"
            className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveMatchRecord}
              disabled={savingMatch}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EDF3E8] text-[#24552E] text-xs font-bold hover:bg-[#dfe9d6] transition-colors disabled:opacity-50"
            >
              {savingMatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
              {authUserId ? 'Save Match Scorecard' : 'Sign In to Save'}
            </button>
            <button
              onClick={runMatchAnalysis}
              disabled={analyzing}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] transition-colors disabled:opacity-50"
            >
              {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
              Generate AI Match Intelligence
            </button>
          </div>
        </div>
        {saveNotice && <p className="text-xs text-[#397B32] font-semibold">{saveNotice}</p>}
        {error && <p className="text-xs text-[#B91C1C] font-medium">{error}</p>}

        {savedMatches.length > 0 && (
          <div className="pt-3 border-t border-[#17251A]/8 space-y-2">
            <div className="text-xs font-bold text-[#397B32] uppercase tracking-wider">
              Saved Match IQ Scorecards ({savedMatches.length})
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {savedMatches.slice(0, 6).map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-[#F7FAF3] border border-[#17251A]/10 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMatchFormat(m.matchFormat);
                      setTeamName(m.teamName);
                      setOpponentName(m.opponentName);
                      setBattingRows(m.battingRows);
                      setBowlingRows(m.bowlingRows);
                      setNotes(m.notes);
                      setAnalysis(m.analysis);
                    }}
                    className="text-left min-w-0 flex-1"
                  >
                    <div className="text-xs font-bold text-[#17251A] truncate">
                      {m.teamName} vs {m.opponentName}
                    </div>
                    <div className="text-[11px] text-[#68766A] truncate">{m.matchFormat}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSavedMatch(m.id)}
                    aria-label="Delete saved match"
                    className="p-1.5 text-red-600 hover:text-red-800 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Charts + Interactive Field Placement Board */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 athletic-card rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#153D25]">Runs &amp; Strike Rate Chart</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5EAE0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#17251A' }} />
                <YAxis tick={{ fontSize: 12, fill: '#68766A' }} />
                <Tooltip />
                <Bar dataKey="Runs" fill="#397B32" radius={[6, 6, 0, 0]} />
                <Bar dataKey="SR" fill="#A8D94E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-6 scoreboard-dark-panel text-white rounded-3xl p-6 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">Field Placement Education</h2>
            <div className="flex gap-1 bg-white/15 p-1 rounded-xl">
              {(['powerplay', 'middle', 'death'] as const).map((ph) => (
                <button
                  key={ph}
                  onClick={() => setFieldPhase(ph)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                    fieldPhase === ph ? 'bg-white text-[#24552E]' : 'text-white/90 hover:text-white'
                  }`}
                >
                  {ph}
                </button>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 420 260" className="w-full h-56" role="img" aria-label="Cricket field placement map">
            <ellipse cx="210" cy="130" rx="185" ry="118" fill="#397B32" fillOpacity="0.4" stroke="#A8D94E" strokeWidth="2" />
            <ellipse cx="210" cy="130" rx="108" ry="72" fill="none" stroke="#F8FAF2" strokeWidth="1.5" strokeDasharray="4 4" />
            <rect x="198" y="92" width="24" height="76" fill="#FF941F" fillOpacity="0.35" stroke="#F8FAF2" />
            <circle cx="210" cy="72" r="5" fill="#FFFFFF" />
            <text x="210" y="62" fill="#FFFFFF" fontSize="9" textAnchor="middle">WK</text>
            {FIELD_COORDS.map((f, i) => (
              <g key={i}>
                <circle cx={f.x} cy={f.y} r="5.5" fill="#A8D94E" stroke="#153D25" strokeWidth="1.5" />
                <text x={f.x} y={f.y - 8} fill="#F8FAF2" fontSize="9" textAnchor="middle">
                  {f.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* AI Match Analysis Results */}
      {analysis && (
        <div className="athletic-card rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-2xl font-bold text-[#153D25]">AI Scorecard &amp; Tactical Review</h2>
          <p className="text-sm text-[#17251A] leading-relaxed">{analysis.summary}</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-[#EDF1E7]">
              <div className="text-xs font-bold text-[#397B32] mb-1.5">Batting &amp; Dismissal Patterns</div>
              <ul className="space-y-1 text-xs text-[#17251A]">{analysis.battingPatterns.map((p, i) => <li key={i}>• {p}</li>)}</ul>
            </div>
            <div className="p-4 rounded-xl bg-[#EDF1E7]">
              <div className="text-xs font-bold text-[#397B32] mb-1.5">Bowling &amp; Opponent Insights</div>
              <ul className="space-y-1 text-xs text-[#17251A]">{analysis.bowlingPatterns.map((p, i) => <li key={i}>• {p}</li>)}</ul>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#17251A]/10 bg-[#F8FAF2]">
              <div className="font-bold text-[#153D25] mb-1">Powerplay Plan</div>
              <p className="text-[#68766A]">{analysis.powerplayPlan}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#17251A]/10 bg-[#F8FAF2]">
              <div className="font-bold text-[#153D25] mb-1">Middle-Over Plan</div>
              <p className="text-[#68766A]">{analysis.middleOversPlan}</p>
            </div>
            <div className="p-4 rounded-xl border border-[#17251A]/10 bg-[#F8FAF2]">
              <div className="font-bold text-[#153D25] mb-1">Death-Over Plan</div>
              <p className="text-[#68766A]">{analysis.deathOversPlan}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
