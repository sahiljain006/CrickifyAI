import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Gamepad2,
  HelpCircle,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { NavSectionId, PlayZoneSession } from '../types';

interface PlayZoneViewProps {
  onNavigate: (section: NavSectionId) => void;
  onBack?: () => void;
  onSaveSession?: (session: PlayZoneSession) => void;
  onActiveGameplayChange?: (active: boolean) => void;
}

type ChallengeMode = '6-ball' | '12-ball';
type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Pro';
type ShotType = 'drive' | 'pull' | 'cut' | 'loft';
type DeliveryType = 'Good Length' | 'Yorker' | 'Short Ball' | 'Outswinger' | 'Flighted Spin';
type ScreenPhase = 'instructions' | 'playing' | 'results';
type PlayState = 'bowler-runup' | 'ball-in-flight' | 'shot-outcome';

interface DeliverySpec {
  type: DeliveryType;
  idealShot: ShotType;
  goodShot: ShotType;
  baseSpeedSec: number;
  lineX: number; // -1 (leg) to +1 (wide off)
  bounceT: number; // 0..1 down pitch
  hint: string;
}

interface BallResultRecord {
  ballNumber: number;
  delivery: DeliveryType;
  shotChosen: ShotType | 'None';
  runs: number;
  isWicket: boolean;
  label: string;
  timingQuality: 'Perfect Timing' | 'Good Shot' | 'Early Shot' | 'Late Shot' | 'Missed';
}

interface ShotTrajectory {
  runs: number;
  isWicket: boolean;
  isSix: boolean;
  isFour: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const DELIVERIES: DeliverySpec[] = [
  {
    type: 'Good Length',
    idealShot: 'drive',
    goodShot: 'loft',
    baseSpeedSec: 1.48,
    lineX: 0.16,
    bounceT: 0.62,
    hint: 'Top of off stump — Drive or Loft!',
  },
  {
    type: 'Yorker',
    idealShot: 'drive',
    goodShot: 'cut',
    baseSpeedSec: 1.32,
    lineX: 0.0,
    bounceT: 0.84,
    hint: 'Full at the toes — Crisp straight timing!',
  },
  {
    type: 'Short Ball',
    idealShot: 'pull',
    goodShot: 'loft',
    baseSpeedSec: 1.4,
    lineX: -0.24,
    bounceT: 0.44,
    hint: 'Rising chest-high — Swivel with a Pull!',
  },
  {
    type: 'Outswinger',
    idealShot: 'cut',
    goodShot: 'drive',
    baseSpeedSec: 1.44,
    lineX: 0.56,
    bounceT: 0.64,
    hint: 'Width outside off — Slash a Square Cut!',
  },
  {
    type: 'Flighted Spin',
    idealShot: 'loft',
    goodShot: 'drive',
    baseSpeedSec: 1.64,
    lineX: 0.08,
    bounceT: 0.7,
    hint: 'Flighted loop — Dance out & Loft over long-on!',
  },
];

const SHOTS: Array<{ id: ShotType; label: string; shortLabel: string; keyHint: string; angleX: number; angleY: number }> = [
  { id: 'drive', label: 'Cover Drive', shortLabel: 'Drive', keyHint: '1 / ↓', angleX: 0.52, angleY: -0.95 },
  { id: 'pull', label: 'Pull Shot', shortLabel: 'Pull', keyHint: '2 / ←', angleX: -0.92, angleY: -0.45 },
  { id: 'cut', label: 'Square Cut', shortLabel: 'Cut', keyHint: '3 / →', angleX: 0.94, angleY: -0.35 },
  { id: 'loft', label: 'Lofted Six', shortLabel: 'Loft', keyHint: '4 / ↑', angleX: 0.06, angleY: -1.0 },
];

const DIFFICULTY_CONFIG: Record<
  DifficultyLevel,
  { label: string; speedMultiplier: number; sweetHalfWindow: number; desc: string }
> = {
  Beginner: {
    label: 'Beginner',
    speedMultiplier: 1.24,
    sweetHalfWindow: 0.145,
    desc: 'Slower deliveries & generous timing window',
  },
  Intermediate: {
    label: 'Intermediate',
    speedMultiplier: 1.0,
    sweetHalfWindow: 0.105,
    desc: 'Balanced club pace & realistic timing',
  },
  Pro: {
    label: 'Pro',
    speedMultiplier: 0.78,
    sweetHalfWindow: 0.075,
    desc: 'Express pace & razor-sharp crease timing',
  },
};

const TARGET_SCORES: Record<ChallengeMode, Record<DifficultyLevel, number>> = {
  '6-ball': { Beginner: 16, Intermediate: 20, Pro: 24 },
  '12-ball': { Beginner: 32, Intermediate: 40, Pro: 48 },
};

function computeBoundaryEndpoint(
  startX: number,
  startY: number,
  dirX: number,
  dirY: number,
  rx: number,
  ry: number
): { x: number; y: number } {
  const cx = 180;
  const cy = 198;
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const dx = startX - cx;
  const dy = startY - cy;

  const a = (ux * ux) / (rx * rx) + (uy * uy) / (ry * ry);
  const b = 2 * ((dx * ux) / (rx * rx) + (dy * uy) / (ry * ry));
  const c = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) - 1;
  const disc = Math.max(0, b * b - 4 * a * c);
  const t = (-b + Math.sqrt(disc)) / (2 * a);

  return {
    x: Math.max(14, Math.min(346, startX + ux * t)),
    y: Math.max(12, Math.min(386, startY + uy * t)),
  };
}

const HIGH_SCORE_KEY = 'crickify_playzone_best_v1';
const LEGACY_HIGH_SCORE_KEY = 'pitchiq_playzone_best_v1';

function playSynthSound(kind: 'bat' | 'boundary' | 'wicket' | 'bowler', muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === 'bat') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.09);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (kind === 'boundary') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.18);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    } else if (kind === 'wicket') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.26);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.29);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    }

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch {
    // ignore browser audio restriction errors
  }
}

export const PlayZoneView: React.FC<PlayZoneViewProps> = ({
  onNavigate,
  onBack,
  onSaveSession,
  onActiveGameplayChange,
}) => {
  const [screenPhase, setScreenPhase] = useState<ScreenPhase>('instructions');
  const [mode, setMode] = useState<ChallengeMode>('6-ball');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [selectedShot, setSelectedShot] = useState<ShotType>('drive');

  const [playState, setPlayState] = useState<PlayState>('bowler-runup');
  const [ballProgress, setBallProgress] = useState(0); // 0 -> 1 delivery flight
  const [shotAnimProgress, setShotAnimProgress] = useState(0); // 0 -> 1 post-bat ball travel
  const [shotTrajectory, setShotTrajectory] = useState<ShotTrajectory | null>(null);
  const [swingActive, setSwingActive] = useState(false);
  const [stumpsBroken, setStumpsBroken] = useState(false);

  const [currentBallIdx, setCurrentBallIdx] = useState(0);
  const [currentDelivery, setCurrentDelivery] = useState<DeliverySpec>(DELIVERIES[0]);
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballLog, setBallLog] = useState<BallResultRecord[]>([]);
  const [lastOutcomeBanner, setLastOutcomeBanner] = useState<{
    badge: string;
    title: string;
    detail: string;
    tone: 'lime' | 'orange' | 'red' | 'slate';
  } | null>(null);

  const [bestScores, setBestScores] = useState<{ '6-ball': number; '12-ball': number }>(() => {
    try {
      const raw = localStorage.getItem(HIGH_SCORE_KEY) || localStorage.getItem(LEGACY_HIGH_SCORE_KEY);
      if (raw) return { '6-ball': 0, '12-ball': 0, ...JSON.parse(raw) };
    } catch {
      // ignore
    }
    return { '6-ball': 0, '12-ball': 0 };
  });

  const totalBalls = mode === '6-ball' ? 6 : 12;
  const maxWickets = 3;
  const targetScore = TARGET_SCORES[mode][difficulty];
  const sweetSpotT = 0.82;
  const diffSpec = DIFFICULTY_CONFIG[difficulty];

  useEffect(() => {
    onActiveGameplayChange?.(screenPhase === 'playing');
    return () => {
      onActiveGameplayChange?.(false);
    };
  }, [onActiveGameplayChange, screenPhase]);

  const deliveryAnimRef = useRef<number | null>(null);
  const shotAnimRef = useRef<number | null>(null);
  const flightStartRef = useRef<number>(0);
  const flightPausedProgressRef = useRef<number>(0);
  const hasSwungRef = useRef<boolean>(false);
  const nextTimerRef = useRef<number | null>(null);
  const ballProgressRef = useRef<number>(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const sessionSavedRef = useRef<boolean>(false);

  const screenPhaseRef = useRef(screenPhase);
  const playStateRef = useRef(playState);
  const pausedRef = useRef(paused);
  const helpOpenRef = useRef(helpOpen);
  const selectedShotRef = useRef(selectedShot);

  screenPhaseRef.current = screenPhase;
  playStateRef.current = playState;
  pausedRef.current = paused;
  helpOpenRef.current = helpOpen;
  selectedShotRef.current = selectedShot;

  const clearTimers = useCallback(() => {
    if (deliveryAnimRef.current !== null) {
      window.cancelAnimationFrame(deliveryAnimRef.current);
      deliveryAnimRef.current = null;
    }
    if (shotAnimRef.current !== null) {
      window.cancelAnimationFrame(shotAnimRef.current);
      shotAnimRef.current = null;
    }
    if (nextTimerRef.current !== null) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finishMatch = useCallback(
    (finalRuns: number, finalLog: BallResultRecord[], finalWickets: number) => {
      clearTimers();
      setScreenPhase('results');
      setBestScores((prev) => {
        const nextBest = Math.max(prev[mode], finalRuns);
        if (nextBest > prev[mode]) {
          const updated = { ...prev, [mode]: nextBest };
          try {
            localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        }
        return prev;
      });

      if (!sessionSavedRef.current && onSaveSession) {
        sessionSavedRef.current = true;
        const goodCount = finalLog.filter(
          (b) => b.timingQuality === 'Perfect Timing' || b.timingQuality === 'Good Shot'
        ).length;
        const missedCount = finalLog.filter((b) => b.timingQuality === 'Missed').length;
        const timingPct = finalLog.length ? Math.round((goodCount / finalLog.length) * 100) : 0;
        const suggestedDrillId =
          timingPct < 55
            ? 'ex-tennis-wall-timing'
            : missedCount >= 2
              ? 'ex-shadow-batting'
              : 'ex-front-foot-stride';

        onSaveSession({
          id: `pz-${Date.now()}`,
          createdAt: new Date().toISOString(),
          gameType: 'batting_challenge',
          challengeBalls: totalBalls,
          difficulty,
          totalRuns: finalRuns,
          ballsFaced: finalLog.length,
          successfulShots: finalLog.filter((b) => b.runs > 0).length,
          missedDeliveries: missedCount,
          wickets: finalWickets,
          timingScore: timingPct,
          suggestedDrillId,
        });
      }
    },
    [clearTimers, difficulty, mode, onSaveSession, totalBalls]
  );

  const scheduleNextDelivery = useCallback(
    (nextBallNumber: number, updatedRuns: number, updatedWickets: number, updatedLog: BallResultRecord[], outcomeDelayMs: number) => {
      if (nextBallNumber >= totalBalls || updatedWickets >= maxWickets) {
        nextTimerRef.current = window.setTimeout(() => {
          finishMatch(updatedRuns, updatedLog, updatedWickets);
        }, outcomeDelayMs);
        return;
      }

      nextTimerRef.current = window.setTimeout(() => {
        const delivery = DELIVERIES[(nextBallNumber * 3 + updatedRuns) % DELIVERIES.length];
        setCurrentBallIdx(nextBallNumber);
        setCurrentDelivery(delivery);
        ballProgressRef.current = 0;
        flightPausedProgressRef.current = 0;
        setBallProgress(0);
        setShotAnimProgress(0);
        setShotTrajectory(null);
        setSwingActive(false);
        setStumpsBroken(false);
        hasSwungRef.current = false;
        setPlayState('bowler-runup');
        playSynthSound('bowler', muted);

        nextTimerRef.current = window.setTimeout(() => {
          const speedSec = delivery.baseSpeedSec * diffSpec.speedMultiplier;
          flightStartRef.current = performance.now();
          setPlayState('ball-in-flight');
          void speedSec;
        }, 460);
      }, outcomeDelayMs);
    },
    [diffSpec.speedMultiplier, finishMatch, muted, totalBalls]
  );

  const startMatch = useCallback(
    (chosenMode?: ChallengeMode, chosenDifficulty?: DifficultyLevel) => {
      const targetMode = chosenMode || mode;
      const targetDiff = chosenDifficulty || difficulty;
      if (chosenMode) setMode(chosenMode);
      if (chosenDifficulty) setDifficulty(chosenDifficulty);

      clearTimers();
      sessionSavedRef.current = false;
      const firstDelivery = DELIVERIES[0];
      setScreenPhase('playing');
      setPaused(false);
      setHelpOpen(false);
      setCurrentBallIdx(0);
      setCurrentDelivery(firstDelivery);
      setRuns(0);
      setWickets(0);
      setBallLog([]);
      ballProgressRef.current = 0;
      flightPausedProgressRef.current = 0;
      setBallProgress(0);
      setShotAnimProgress(0);
      setShotTrajectory(null);
      setSwingActive(false);
      setStumpsBroken(false);
      setLastOutcomeBanner(null);
      hasSwungRef.current = false;
      setPlayState('bowler-runup');
      playSynthSound('bowler', muted);

      nextTimerRef.current = window.setTimeout(() => {
        flightStartRef.current = performance.now();
        setPlayState('ball-in-flight');
      }, 500);
      void targetMode;
      void targetDiff;
    },
    [clearTimers, difficulty, mode, muted]
  );

  const runPostShotAnimation = useCallback((traj: ShotTrajectory) => {
    if (shotAnimRef.current !== null) {
      window.cancelAnimationFrame(shotAnimRef.current);
      shotAnimRef.current = null;
    }
    const durationMs = traj.isSix ? 1050 : traj.isFour ? 920 : 620;
    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      setShotAnimProgress(t);
      if (t < 1) {
        shotAnimRef.current = window.requestAnimationFrame(step);
      }
    };
    setShotAnimProgress(0);
    shotAnimRef.current = window.requestAnimationFrame(step);
  }, []);

  const resolveShot = useCallback(
    (shot: ShotType | 'None', progressAtSwing: number) => {
      if (hasSwungRef.current || pausedRef.current || helpOpenRef.current) return;
      hasSwungRef.current = true;
      if (deliveryAnimRef.current !== null) {
        window.cancelAnimationFrame(deliveryAnimRef.current);
        deliveryAnimRef.current = null;
      }

      setSwingActive(shot !== 'None');
      setPlayState('shot-outcome');

      const rawDiff = progressAtSwing - sweetSpotT;
      const absDelta = Math.abs(rawDiff);
      const isIdeal = shot === currentDelivery.idealShot;
      const isGoodMatch = shot === currentDelivery.goodShot;

      let outcomeRuns = 0;
      let isWicket = false;
      let label = '0';
      let badge = 'MISSED';
      let title = 'DOT BALL';
      let detail = 'Tight bowling beats the bat.';
      let tone: 'lime' | 'orange' | 'red' | 'slate' = 'slate';
      let timingQuality: BallResultRecord['timingQuality'] = 'Missed';

      if (shot === 'None') {
        isWicket = currentDelivery.type === 'Yorker' || Math.abs(currentDelivery.lineX) < 0.25;
        label = isWicket ? 'W' : '0';
        badge = 'MISSED';
        title = isWicket ? 'BOWLED! · W' : 'LEFT ALONE · 0';
        detail = isWicket ? 'Ball beats the bat and crashes into the stumps.' : 'Passes safely wide of off stump.';
        tone = isWicket ? 'red' : 'slate';
        setStumpsBroken(isWicket);
        playSynthSound(isWicket ? 'wicket' : 'bowler', muted);
      } else if (absDelta <= diffSpec.sweetHalfWindow * 0.55 && (isIdeal || isGoodMatch)) {
        timingQuality = 'Perfect Timing';
        const isSix = shot === 'loft' || (isIdeal && currentDelivery.type === 'Short Ball' && shot === 'pull');
        outcomeRuns = isSix ? 6 : 4;
        label = String(outcomeRuns);
        badge = 'PERFECT TIMING';
        title = isSix ? 'SIX! +6' : 'FOUR! +4';
        detail = isSix
          ? `Clean lofted strike sails right over the boundary rope!`
          : `Raced across the turf past the boundary rope for Four!`;
        tone = 'lime';
        playSynthSound('boundary', muted);
      } else if (absDelta <= diffSpec.sweetHalfWindow && (isIdeal || isGoodMatch)) {
        timingQuality = 'Good Shot';
        outcomeRuns = shot === 'loft' ? 4 : 2;
        label = String(outcomeRuns);
        badge = 'GOOD SHOT';
        title = outcomeRuns === 4 ? 'FOUR! +4' : 'SOLID TWO! +2';
        detail = outcomeRuns === 4 ? 'Pierced the infield gap cleanly to the rope!' : 'Placed firmly into the deep for two runs.';
        tone = 'lime';
        playSynthSound(outcomeRuns === 4 ? 'boundary' : 'bat', muted);
      } else if (absDelta <= diffSpec.sweetHalfWindow * 1.48) {
        timingQuality = rawDiff < 0 ? 'Early Shot' : 'Late Shot';
        badge = rawDiff < 0 ? 'EARLY SHOT' : 'LATE SHOT';
        if (currentDelivery.type === 'Yorker' && shot === 'pull') {
          isWicket = true;
          label = 'W';
          title = 'OUT · LBW!';
          detail = 'Pulling a yorker traps you plumb in front of the stumps.';
          tone = 'red';
          setStumpsBroken(true);
          playSynthSound('wicket', muted);
        } else {
          outcomeRuns = 1;
          label = '1';
          title = 'QUICK SINGLE +1';
          detail =
            rawDiff < 0
              ? 'Slightly early on the swing — pushed into the ring for 1.'
              : 'Played late under the eyes — guided safely for 1.';
          tone = 'orange';
          playSynthSound('bat', muted);
        }
      } else {
        timingQuality = 'Missed';
        badge = rawDiff < 0 ? 'EARLY SHOT' : 'LATE SHOT';
        isWicket = shot === 'loft' || Math.abs(currentDelivery.lineX) < 0.3;
        label = isWicket ? 'W' : '0';
        title = isWicket ? (shot === 'loft' ? 'OUT · CAUGHT!' : 'BOWLED! · W') : 'SWING & MISS · 0';
        detail =
          rawDiff < 0
            ? `Swung too early on the ${currentDelivery.type}.`
            : `Swung too late — wait until the ball enters the glowing crease ring.`;
        tone = isWicket ? 'red' : 'slate';
        setStumpsBroken(isWicket && shot !== 'loft');
        playSynthSound(isWicket ? 'wicket' : 'bat', muted);
      }

      let outcomeDelayMs = 950;
      if (!isWicket && outcomeRuns > 0 && shot !== 'None') {
        const shotSpec = SHOTS.find((s) => s.id === shot)!;
        const startX = 180;
        const startY = 316;
        const isSix = outcomeRuns === 6;
        const isFour = outcomeRuns === 4;
        const len = Math.hypot(shotSpec.angleX, shotSpec.angleY) || 1;
        const ux = shotSpec.angleX / len;
        const uy = shotSpec.angleY / len;

        // True boundary rope is rx=156, ry=166 around (180,198).
        // FOUR travels past the rope along the ground (rx=165, ry=175);
        // SIX sails high over the rope into the deep stands (rx=176, ry=186).
        let endX = startX + ux * (outcomeRuns === 2 ? 122 : 76);
        let endY = Math.max(16, startY + uy * (outcomeRuns === 2 ? 122 : 76));
        if (isSix) {
          const hit = computeBoundaryEndpoint(startX, startY, ux, uy, 176, 186);
          endX = hit.x;
          endY = hit.y;
        } else if (isFour) {
          const hit = computeBoundaryEndpoint(startX, startY, ux, uy, 165, 175);
          endX = hit.x;
          endY = hit.y;
        }

        const traj: ShotTrajectory = {
          runs: outcomeRuns,
          isWicket,
          isSix,
          isFour,
          startX,
          startY,
          endX,
          endY,
        };
        setShotTrajectory(traj);
        runPostShotAnimation(traj);
        outcomeDelayMs = isSix ? 1320 : isFour ? 1180 : 940;
      }

      const nextRuns = runs + outcomeRuns;
      const nextWickets = wickets + (isWicket ? 1 : 0);
      const nextRecord: BallResultRecord = {
        ballNumber: currentBallIdx + 1,
        delivery: currentDelivery.type,
        shotChosen: shot,
        runs: outcomeRuns,
        isWicket,
        label,
        timingQuality,
      };
      const updatedLog = [...ballLog, nextRecord];

      setRuns(nextRuns);
      setWickets(nextWickets);
      setLastOutcomeBanner({ badge, title, detail, tone });
      setBallLog(updatedLog);

      scheduleNextDelivery(currentBallIdx + 1, nextRuns, nextWickets, updatedLog, outcomeDelayMs);
    },
    [ballLog, currentBallIdx, currentDelivery, diffSpec.sweetHalfWindow, muted, runPostShotAnimation, runs, scheduleNextDelivery, sweetSpotT, wickets]
  );

  const resolveShotRef = useRef(resolveShot);
  const startMatchRef = useRef(startMatch);
  resolveShotRef.current = resolveShot;
  startMatchRef.current = startMatch;

  // Delivery motion loop with Pause support
  useEffect(() => {
    if (screenPhase !== 'playing' || playState !== 'ball-in-flight' || paused || helpOpen) return;

    const totalDurationSec = currentDelivery.baseSpeedSec * diffSpec.speedMultiplier;
    flightStartRef.current = performance.now() - flightPausedProgressRef.current * totalDurationSec * 1000;

    const tick = (now: number) => {
      const elapsedSec = (now - flightStartRef.current) / 1000;
      const progress = elapsedSec / totalDurationSec;

      if (progress >= 1.0) {
        ballProgressRef.current = 1.0;
        flightPausedProgressRef.current = 1.0;
        setBallProgress(1.0);
        if (!hasSwungRef.current) {
          resolveShotRef.current('None', 1.0);
        }
        return;
      }

      ballProgressRef.current = progress;
      flightPausedProgressRef.current = progress;
      setBallProgress(progress);
      deliveryAnimRef.current = window.requestAnimationFrame(tick);
    };

    deliveryAnimRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (deliveryAnimRef.current !== null) {
        window.cancelAnimationFrame(deliveryAnimRef.current);
        deliveryAnimRef.current = null;
      }
    };
  }, [currentDelivery.baseSpeedSec, diffSpec.speedMultiplier, helpOpen, paused, playState, screenPhase]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (helpOpenRef.current) {
        if (e.key === 'Escape') setHelpOpen(false);
        return;
      }

      const phase = screenPhaseRef.current;
      const pState = playStateRef.current;
      const progress = ballProgressRef.current;

      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'playing' && pState === 'ball-in-flight' && !pausedRef.current) {
          resolveShotRef.current(selectedShotRef.current, progress);
        } else if (phase === 'instructions' || phase === 'results') {
          startMatchRef.current();
        }
      } else if (e.key === '1' || e.key === 'ArrowDown') {
        setSelectedShot('drive');
        if (phase === 'playing' && pState === 'ball-in-flight' && !pausedRef.current) resolveShotRef.current('drive', progress);
      } else if (e.key === '2' || e.key === 'ArrowLeft') {
        setSelectedShot('pull');
        if (phase === 'playing' && pState === 'ball-in-flight' && !pausedRef.current) resolveShotRef.current('pull', progress);
      } else if (e.key === '3' || e.key === 'ArrowRight') {
        setSelectedShot('cut');
        if (phase === 'playing' && pState === 'ball-in-flight' && !pausedRef.current) resolveShotRef.current('cut', progress);
      } else if (e.key === '4' || e.key === 'ArrowUp') {
        setSelectedShot('loft');
        if (phase === 'playing' && pState === 'ball-in-flight' && !pausedRef.current) resolveShotRef.current('loft', progress);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Touch swipe & tap gesture support on pitch canvas
  const handleFieldPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipeStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleFieldPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeStartRef.current) return;
    const dx = e.clientX - swipeStartRef.current.x;
    const dy = e.clientY - swipeStartRef.current.y;
    swipeStartRef.current = null;
    if (screenPhase !== 'playing' || playState !== 'ball-in-flight' || paused || helpOpen) return;

    let chosenShot: ShotType = selectedShot;
    if (Math.hypot(dx, dy) >= 24) {
      if (Math.abs(dx) > Math.abs(dy)) {
        chosenShot = dx < 0 ? 'pull' : 'cut';
      } else {
        chosenShot = dy < 0 ? 'loft' : 'drive';
      }
      setSelectedShot(chosenShot);
    }
    resolveShot(chosenShot, ballProgressRef.current);
  };

  // Compute incoming ball SVG coordinates in portrait stadium pitch (viewBox 360 x 400)
  const incomingBallVisual = useMemo(() => {
    const t = Math.max(0, Math.min(1, ballProgress));
    const startY = 82;
    const endY = 344;
    const y = startY + (endY - startY) * t;
    const pitchSpread = 16 + t * 54;
    const x = 180 + currentDelivery.lineX * pitchSpread * 0.55;

    let lift = 0;
    if (t < currentDelivery.bounceT) {
      const u = t / currentDelivery.bounceT;
      lift = Math.sin((1 - u * 0.85) * Math.PI * 0.5) * 14;
    } else {
      const u = (t - currentDelivery.bounceT) / (1 - currentDelivery.bounceT);
      lift = Math.sin(u * Math.PI * 0.72) * (currentDelivery.type === 'Short Ball' ? 18 : 9);
    }

    const radius = 4.4 + t * 7.6;
    return { x, y: y - lift, groundY: y, radius };
  }, [ballProgress, currentDelivery]);

  // Compute post-shot boundary trajectory coordinates
  const shotBallVisual = useMemo(() => {
    if (!shotTrajectory) return null;
    const u = Math.max(0, Math.min(1, shotAnimProgress));
    const ease = shotTrajectory.isSix
      ? 1 - Math.pow(1 - u, 1.85)
      : 1 - Math.pow(1 - u, 2.3);
    const groundX = shotTrajectory.startX + (shotTrajectory.endX - shotTrajectory.startX) * ease;
    const groundY = shotTrajectory.startY + (shotTrajectory.endY - shotTrajectory.startY) * ease;
    // SIX climbs high above the ground path and lands past the boundary rope;
    // FOUR races crisply across the grass past the dashed rope.
    const arcLift = shotTrajectory.isSix
      ? Math.sin(u * Math.PI) * 68
      : shotTrajectory.isFour
        ? Math.sin(u * Math.PI) * 6
        : Math.sin(u * Math.PI) * 14;
    const scaleBoost = shotTrajectory.isSix ? Math.sin(u * Math.PI) * 7.2 : shotTrajectory.isFour ? 1.2 : 0;
    return {
      groundX,
      groundY,
      ballY: Math.max(10, groundY - arcLift),
      radius: Math.max(4.8, 9.5 - u * 3.0 + scaleBoost),
      arcLift,
    };
  }, [shotAnimProgress, shotTrajectory]);

  const ballsPlayed = ballLog.length;
  const ballsRemaining = Math.max(0, totalBalls - ballsPlayed);
  const foursCount = ballLog.filter((b) => b.runs === 4).length;
  const sixesCount = ballLog.filter((b) => b.runs === 6).length;
  const missedCount = ballLog.filter((b) => b.timingQuality === 'Missed').length;
  const timingAccuracy = useMemo(() => {
    if (!ballLog.length) return 0;
    const goodCount = ballLog.filter(
      (b) => b.timingQuality === 'Perfect Timing' || b.timingQuality === 'Good Shot'
    ).length;
    return Math.round((goodCount / ballLog.length) * 100);
  }, [ballLog]);

  const inSweetZone =
    screenPhase === 'playing' &&
    playState === 'ball-in-flight' &&
    Math.abs(ballProgress - sweetSpotT) <= diffSpec.sweetHalfWindow;

  // =========================================================================
  // PRE-GAME HOW-TO-PLAY SCREEN
  // =========================================================================
  if (screenPhase === 'instructions') {
    return (
      <div className="space-y-6 pb-8 max-w-5xl mx-auto">
        <div className="stadium-dark-panel rounded-3xl p-6 sm:p-9 text-white shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#B7F34A]">
              <Gamepad2 className="w-4 h-4" />
              <span>CRICKIFY AI PlayNets · Batting Challenge</span>
            </div>
            <button
              type="button"
              onClick={() => (onBack ? onBack() : onNavigate('home-landing'))}
              className="min-h-[42px] px-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-7 items-center">
            {/* Left Rules & Match Setup */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2">
                <h1 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight">
                  READY TO TAKE THE CREASE?
                </h1>
                <p className="text-sm text-[#D7E4D8]">
                  Read each delivery, pick your shot, and connect cleanly inside the glowing lime crease zone to launch Fours and Sixes over the boundary rope.
                </p>
              </div>

              <ol className="space-y-2 text-xs sm:text-sm text-[#E5EFE6]">
                {[
                  'Choose 6-Ball or 12-Ball mode and Beginner, Intermediate, or Pro speed.',
                  'Watch the bowler release the red leather ball down the 22-yard pitch.',
                  'Pick Drive, Pull, Cut, or Loft (or swipe directly in that direction).',
                  'Tap PLAY SHOT or press Spacebar right inside the glowing lime crease ring.',
                  'Guard your 3 wickets — clean sweet-spot hits clear the boundary rope!',
                ].map((step, idx) => (
                  <li key={step} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-[#B7F34A] text-[#0A1610] font-mono text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>

              {/* Controls Guide */}
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-black/35 border border-white/12 p-3.5 space-y-1">
                  <div className="font-bold text-[#B7F34A] uppercase tracking-wider text-[11px]">Mobile Controls</div>
                  <p className="text-[#D7E4D8]">Tap a shot button + tap PLAY SHOT, or swipe left/right/up/down on the field.</p>
                </div>
                <div className="rounded-2xl bg-black/35 border border-white/12 p-3.5 space-y-1">
                  <div className="font-bold text-[#FF941F] uppercase tracking-wider text-[11px]">Desktop Controls</div>
                  <p className="text-[#D7E4D8]">Spacebar / click PLAY SHOT to swing, or press keys 1–4 / Arrow keys directly.</p>
                </div>
              </div>

              {/* Mode & Difficulty Selectors */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap gap-2">
                  {(['6-ball', '12-ball'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-extrabold uppercase transition-colors ${
                        mode === m
                          ? 'bg-[#B7F34A] text-[#0A1610]'
                          : 'bg-white/10 text-white hover:bg-white/18 border border-white/15'
                      }`}
                    >
                      {m === '6-ball' ? '6-Ball Challenge' : '12-Ball Challenge'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['Beginner', 'Intermediate', 'Pro'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-colors border ${
                        difficulty === lvl
                          ? 'bg-[#087F55] border-[#B7F34A] text-white'
                          : 'bg-black/25 border-white/12 text-[#C7D7C9] hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#B7F34A]">{DIFFICULTY_CONFIG[difficulty].desc}</p>
              </div>

              <button
                type="button"
                onClick={() => startMatch(mode, difficulty)}
                className="w-full sm:w-auto min-h-[54px] px-9 py-3.5 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] text-[#0A1610] text-sm font-extrabold uppercase tracking-wider shadow-[0_14px_30px_-8px_rgba(183,243,74,0.65)] inline-flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START MATCH</span>
              </button>
            </div>

            {/* Right Animated Miniature Pitch Visual Demo */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-3xl bg-[#07140C] border border-[#B7F34A]/35 p-4 flex flex-col justify-between overflow-hidden shadow-inner">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#B7F34A]">
                  <span>LIVE SHOT PREVIEW</span>
                  <span>BOUNDARY ROPE</span>
                </div>

                <svg viewBox="0 0 240 280" className="w-full flex-1" aria-label="Animated cricket pitch demo showing ball delivery and boundary hit">
                  <ellipse cx="120" cy="142" rx="108" ry="122" fill="#0F351F" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="6 4" />
                  <polygon points="100,48 140,48 158,236 82,236" fill="#C9B382" />
                  <line x1="78" y1="204" x2="162" y2="204" stroke="#FFFFFF" strokeWidth="2" />
                  <ellipse cx="120" cy="204" rx="22" ry="8" fill="#B7F34A" fillOpacity="0.25" stroke="#B7F34A" strokeWidth="2" className="animate-neon-ring" />
                  {/* Stumps */}
                  <line x1="114" y1="216" x2="114" y2="236" stroke="#F6C873" strokeWidth="2.5" />
                  <line x1="120" y1="216" x2="120" y2="236" stroke="#F6C873" strokeWidth="2.5" />
                  <line x1="126" y1="216" x2="126" y2="236" stroke="#F6C873" strokeWidth="2.5" />
                  {/* Incoming + Boundary Arc */}
                  <path d="M 120 52 L 120 202" stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 4" />
                  <path d="M 120 202 Q 158 118 206 40" fill="none" stroke="#B7F34A" strokeWidth="3" strokeDasharray="6 4" className="animate-ball-trail" />
                  <circle cx="198" cy="52" r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.2" className="animate-ball-float" />
                  <text x="184" y="34" fill="#B7F34A" fontSize="14" fontWeight="bold" fontFamily="monospace">SIX!</text>
                </svg>

                <div className="text-[11px] text-center text-[#C7D7C9]">
                  Best ({mode}): <strong className="font-mono text-[#B7F34A] tabular-nums">{bestScores[mode]} runs</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // END-OF-MATCH RESULTS SUMMARY
  // =========================================================================
  if (screenPhase === 'results') {
    const suggestedAction =
      timingAccuracy < 55
        ? { label: 'Practise Timing Lesson', target: 'academy-batting' as NavSectionId }
        : { label: 'Analyse Net Video', target: 'practice-upload' as NavSectionId };

    return (
      <div className="space-y-6 pb-10 max-w-4xl mx-auto">
        <div className="stadium-dark-panel rounded-3xl p-6 sm:p-10 text-white shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#B7F34A]">
              <Trophy className="w-4 h-4 text-[#FF941F]" />
              <span>Innings Complete · {mode === '6-ball' ? '6-Ball Blitz' : '12-Ball Challenge'} ({difficulty})</span>
            </div>
            <button
              type="button"
              onClick={() => setScreenPhase('instructions')}
              className="min-h-[40px] px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
            >
              Change Mode / Difficulty
            </button>
          </div>

          <div className="text-center space-y-2 py-2">
            <div className="text-xs font-bold uppercase tracking-widest text-[#C7D7C9]">Final Innings Score</div>
            <div className="font-display text-6xl sm:text-7xl font-extrabold text-white tabular-nums">
              {runs}/{wickets}
            </div>
            <p className="text-xs sm:text-sm text-[#B7F34A] font-semibold">
              {runs >= targetScore
                ? `Target ${targetScore} Chased! Victory with ${ballsRemaining} ball${ballsRemaining === 1 ? '' : 's'} left`
                : `Target ${targetScore} (${Math.max(0, targetScore - runs)} short)`}
              {' · '}
              {runs >= bestScores[mode] && runs > 0 ? 'New Personal Best!' : `Best (${mode}): ${bestScores[mode]} runs`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Runs', val: String(runs), accent: 'text-[#B7F34A]' },
              { label: 'Wickets', val: `${wickets}/${maxWickets}`, accent: 'text-white' },
              { label: 'Balls Played', val: `${ballsPlayed}/${totalBalls}`, accent: 'text-white' },
              { label: 'Fours / Sixes', val: `${foursCount} / ${sixesCount}`, accent: 'text-[#FF941F]' },
              { label: 'Missed Shots', val: String(missedCount), accent: 'text-white' },
              { label: 'Timing Accuracy', val: `${timingAccuracy}%`, accent: 'text-[#B7F34A]' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-black/35 border border-white/10 p-3.5 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9DB3A2]">{stat.label}</div>
                <div className={`font-mono text-2xl font-extrabold tabular-nums mt-1 ${stat.accent}`}>{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Ball-by-Ball Log */}
          <div className="rounded-2xl bg-black/30 border border-white/10 p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9DB3A2]">Over Summary</div>
            <div className="flex flex-wrap gap-2">
              {ballLog.map((b) => (
                <div
                  key={b.ballNumber}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 ${
                    b.isWicket
                      ? 'bg-red-600 text-white'
                      : b.runs >= 4
                        ? 'bg-[#B7F34A] text-[#0A1610]'
                        : b.runs > 0
                          ? 'bg-[#087F55] text-white'
                          : 'bg-white/15 text-white'
                  }`}
                >
                  <span>B{b.ballNumber}:</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => startMatch(mode, difficulty)}
              className="min-h-[50px] px-8 py-3 rounded-2xl bg-[#B7F34A] hover:bg-[#c6f86b] text-[#0A1610] text-sm font-extrabold uppercase tracking-wider inline-flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> REPLAY
            </button>
            <button
              type="button"
              onClick={() => onNavigate(suggestedAction.target)}
              className="min-h-[50px] px-6 py-3 rounded-2xl bg-white/12 hover:bg-white/22 border border-white/15 text-white text-xs font-bold"
            >
              {suggestedAction.label} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // IN-GAME ZERO-SCROLL MOBILE ARENA + BALANCED DESKTOP LAYOUT
  // =========================================================================
  const wicketsLeft = Math.max(0, maxWickets - wickets);
  const runsNeeded = Math.max(0, targetScore - runs);
  const targetChased = runs >= targetScore;

  return (
    <div className="h-[calc(100dvh-4.5rem)] sm:h-[calc(100dvh-5.25rem)] lg:h-auto max-w-5xl mx-auto flex flex-col gap-1.5 sm:gap-2.5 lg:gap-4 overflow-hidden lg:overflow-visible">
      {/* Compact Top Control Bar */}
      <div className="stadium-dark-panel rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2.5 text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              clearTimers();
              setScreenPhase('instructions');
            }}
            aria-label="Back to PlayNets setup"
            className="min-h-[38px] min-w-[38px] sm:min-h-[42px] px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center justify-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="min-w-0">
            <div className="font-display text-base sm:text-lg font-bold leading-none text-white truncate">
              CRICKIFY AI PLAYNETS
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#B7F34A] truncate">
              {mode} · {difficulty}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
          >
            {muted ? <VolumeX className="w-4 h-4 text-[#FF941F]" /> : <Volume2 className="w-4 h-4 text-[#B7F34A]" />}
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Resume match' : 'Pause match'}
            className="min-h-[38px] sm:min-h-[42px] px-2.5 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1"
          >
            {paused ? <Play className="w-3.5 h-3.5 text-[#B7F34A]" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{paused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label="How to play help"
            className="min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4 text-[#B7F34A]" />
          </button>
          <button
            type="button"
            onClick={() => startMatch(mode, difficulty)}
            aria-label="Restart match"
            className="min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] rounded-xl bg-white/10 hover:bg-white/20 inline-flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Responsive Split: Stacked Zero-Scroll on Mobile, 2-Column Arena on Desktop */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-1.5 sm:gap-3 lg:gap-5">
        {/* Mobile Compact 4-Metric Scoreboard (Shown above field on < lg) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 lg:hidden shrink-0">
          <div
            key={`mob-runs-${runs}-${wickets}`}
            className="rounded-xl bg-[#0D2115] border border-[#B7F34A]/35 px-2.5 py-1.5 text-white animate-score-pop"
          >
            <div className="text-[9px] font-bold uppercase text-[#B7F34A]">Runs</div>
            <div className="font-mono text-lg sm:text-xl font-extrabold tabular-nums leading-tight">
              {runs}/{wickets}
            </div>
          </div>
          <div className="rounded-xl bg-[#0D2115] border border-white/12 px-2.5 py-1.5 text-white">
            <div className="text-[9px] font-bold uppercase text-[#9DB3A2]">Wkts Left</div>
            <div className="font-mono text-lg sm:text-xl font-extrabold tabular-nums leading-tight">
              {wicketsLeft}
            </div>
          </div>
          <div className="rounded-xl bg-[#0D2115] border border-white/12 px-2.5 py-1.5 text-white">
            <div className="text-[9px] font-bold uppercase text-[#9DB3A2]">Balls Left</div>
            <div className="font-mono text-lg sm:text-xl font-extrabold tabular-nums leading-tight">
              {ballsRemaining}
            </div>
          </div>
          <div className="rounded-xl bg-[#0D2115] border border-[#FF941F]/35 px-2.5 py-1.5 text-white">
            <div className="text-[9px] font-bold uppercase text-[#FF941F]">Target</div>
            <div className="font-mono text-lg sm:text-xl font-extrabold text-[#FF941F] tabular-nums leading-tight">
              {targetScore}
            </div>
          </div>
        </div>

        {/* Left / Center: Interactive Playing Field + Timing Indicator Immediately Below */}
        <div className="flex-1 min-h-0 lg:col-span-7 flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden bg-[#07160D] border border-[#B7F34A]/25 shadow-2xl">
          {/* Delivery Cue Banner */}
          <div className="px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 border-b border-white/10 flex items-center justify-between gap-2 text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-white shrink-0">
              <Zap className="w-3.5 h-3.5 text-[#B7F34A]" />
              <span>
                Ball {Math.min(currentBallIdx + 1, totalBalls)}/{totalBalls}:{' '}
                <span className="text-[#B7F34A]">{currentDelivery.type}</span>
              </span>
            </div>
            <span className="text-[#FF941F] font-semibold truncate text-right">{currentDelivery.hint}</span>
          </div>

          {/* Flexible SVG Cricket Arena */}
          <div
            onPointerDown={handleFieldPointerDown}
            onPointerUp={handleFieldPointerUp}
            className="relative flex-1 min-h-0 flex items-center justify-center px-2 py-1 sm:py-2 touch-manipulation select-none cursor-crosshair overflow-hidden"
          >
            <svg
              viewBox="0 0 360 400"
              preserveAspectRatio="xMidYMid meet"
              className="h-full w-auto max-w-full lg:w-full lg:max-w-[440px] lg:max-h-[430px]"
              role="img"
              aria-label="PlayNets cricket stadium playing field"
            >
              <defs>
                <radialGradient id="pz-arena-turf" cx="50%" cy="48%" r="58%">
                  <stop offset="0%" stopColor="#1B663A" />
                  <stop offset="72%" stopColor="#0E3820" />
                  <stop offset="100%" stopColor="#07180E" />
                </radialGradient>
                <linearGradient id="pz-clay-strip" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9D885E" />
                  <stop offset="100%" stopColor="#DEC89A" />
                </linearGradient>
                <radialGradient id="pz-leather-ball" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="55%" stopColor="#B91C1C" />
                  <stop offset="100%" stopColor="#450A0A" />
                </radialGradient>
              </defs>

              {/* Full Outfield & Crisp Boundary Rope */}
              <ellipse cx="180" cy="198" rx="168" ry="178" fill="url(#pz-arena-turf)" />
              <ellipse
                cx="180"
                cy="198"
                rx="156"
                ry="166"
                fill="none"
                stroke={
                  playState === 'shot-outcome' && shotTrajectory && (shotTrajectory.isFour || shotTrajectory.isSix) && shotAnimProgress > 0.72
                    ? shotTrajectory.isSix
                      ? '#FF941F'
                      : '#B7F34A'
                    : '#FFFFFF'
                }
                strokeOpacity={
                  playState === 'shot-outcome' && shotTrajectory && (shotTrajectory.isFour || shotTrajectory.isSix) && shotAnimProgress > 0.72
                    ? 0.95
                    : 0.62
                }
                strokeWidth={
                  playState === 'shot-outcome' && shotTrajectory && (shotTrajectory.isFour || shotTrajectory.isSix) && shotAnimProgress > 0.72
                    ? 3.5
                    : 2.5
                }
                strokeDasharray="7 5"
              />
              {/* 30-Yard Inner Ring */}
              <ellipse
                cx="180"
                cy="202"
                rx="98"
                ry="104"
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity="0.16"
                strokeWidth="1.2"
                strokeDasharray="4 4"
              />

              {/* 22-Yard Pitch Strip */}
              <polygon
                points="154,76 206,76 232,354 128,354"
                fill="url(#pz-clay-strip)"
                stroke="#F8FAF2"
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />

              {/* Bowler Crease & Far Stumps */}
              <line x1="146" y1="84" x2="214" y2="84" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.85" />
              <line x1="175" y1="64" x2="175" y2="80" stroke="#F6C873" strokeWidth="2" />
              <line x1="180" y1="64" x2="180" y2="80" stroke="#F6C873" strokeWidth="2" />
              <line x1="185" y1="64" x2="185" y2="80" stroke="#F6C873" strokeWidth="2" />

              {/* Bowler Marker */}
              <circle
                cx="180"
                cy={playState === 'bowler-runup' ? 48 : 68}
                r="7"
                fill="#FF941F"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Batting Popping Crease & Sweet Spot Timing Ring */}
              <line x1="118" y1="316" x2="242" y2="316" stroke="#FFFFFF" strokeWidth="2.2" />
              <ellipse
                cx="180"
                cy="314"
                rx="30"
                ry="11"
                fill={inSweetZone ? '#B7F34A' : 'none'}
                fillOpacity={inSweetZone ? 0.34 : 0}
                stroke={inSweetZone ? '#B7F34A' : '#FFFFFF'}
                strokeOpacity={inSweetZone ? 1 : 0.48}
                strokeWidth={inSweetZone ? 2.6 : 1.5}
              />

              {/* Batter Stumps & Flying Bails on Wicket */}
              <g transform={stumpsBroken ? 'rotate(-14 172 346)' : undefined}>
                <line x1="172" y1="328" x2="172" y2="354" stroke="#F6C873" strokeWidth="2.6" />
              </g>
              <line x1="180" y1="328" x2="180" y2="354" stroke="#F6C873" strokeWidth="2.6" />
              <g transform={stumpsBroken ? 'rotate(18 188 346)' : undefined}>
                <line x1="188" y1="328" x2="188" y2="354" stroke="#F6C873" strokeWidth="2.6" />
              </g>
              {!stumpsBroken ? (
                <line x1="171" y1="327" x2="189" y2="327" stroke="#FFF4D2" strokeWidth="2.2" />
              ) : (
                <>
                  <line x1="154" y1="314" x2="164" y2="306" stroke="#FFF4D2" strokeWidth="2.2" />
                  <line x1="196" y1="308" x2="207" y2="317" stroke="#FFF4D2" strokeWidth="2.2" />
                </>
              )}

              {/* Batter & Bat Swing */}
              <g
                transform={swingActive ? 'translate(154,306) rotate(-32)' : 'translate(154,306) rotate(8)'}
                style={{ transition: 'transform 110ms ease-out' }}
              >
                <circle cx="0" cy="-16" r="7.5" fill="#103B2A" stroke="#B7F34A" strokeWidth="1.6" />
                <rect x="-5.5" y="-8" width="11" height="22" rx="4" fill="#F8FAF2" />
                <rect x="6" y="-2" width="5.5" height="28" rx="2" fill="#E6BE78" transform="rotate(-24 8 8)" />
              </g>

              {/* Incoming Ball Delivery */}
              {playState === 'ball-in-flight' && (
                <>
                  <ellipse
                    cx={incomingBallVisual.x}
                    cy={incomingBallVisual.groundY + 3}
                    rx={incomingBallVisual.radius * 0.85}
                    ry={incomingBallVisual.radius * 0.35}
                    fill="#000000"
                    fillOpacity="0.42"
                  />
                  <circle
                    cx={incomingBallVisual.x}
                    cy={incomingBallVisual.y}
                    r={incomingBallVisual.radius}
                    fill="url(#pz-leather-ball)"
                    stroke="#FFFFFF"
                    strokeOpacity="0.6"
                    strokeWidth="0.8"
                  />
                </>
              )}

              {/* Post-Bat Shot Trajectory Across Outfield / Past Boundary Rope */}
              {playState === 'shot-outcome' && shotTrajectory && shotBallVisual && (
                <>
                  {/* Ground shadow path */}
                  <line
                    x1={shotTrajectory.startX}
                    y1={shotTrajectory.startY}
                    x2={shotBallVisual.groundX}
                    y2={shotBallVisual.groundY}
                    stroke={shotTrajectory.isSix ? '#FF941F' : '#B7F34A'}
                    strokeOpacity={shotTrajectory.isSix ? 0.52 : 0.92}
                    strokeWidth={shotTrajectory.isSix ? 2.4 : shotTrajectory.isFour ? 3.8 : 2.5}
                    strokeDasharray={shotTrajectory.isFour ? undefined : '6 4'}
                    strokeLinecap="round"
                  />
                  {/* Aerial arc path for SIX */}
                  {shotTrajectory.isSix && (
                    <path
                      d={`M ${shotTrajectory.startX} ${shotTrajectory.startY} Q ${(shotTrajectory.startX + shotBallVisual.groundX) / 2} ${Math.max(8, (shotTrajectory.startY + shotBallVisual.groundY) / 2 - 74)} ${shotBallVisual.groundX} ${shotBallVisual.ballY}`}
                      fill="none"
                      stroke="#FF941F"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                  )}
                  <ellipse
                    cx={shotBallVisual.groundX}
                    cy={shotBallVisual.groundY + 3}
                    rx={shotBallVisual.radius * (shotTrajectory.isSix ? 0.55 : 0.78)}
                    ry={shotBallVisual.radius * (shotTrajectory.isSix ? 0.24 : 0.32)}
                    fill="#000000"
                    fillOpacity={shotTrajectory.isSix ? 0.32 : 0.45}
                  />
                  <circle
                    cx={shotBallVisual.groundX}
                    cy={shotBallVisual.ballY}
                    r={shotBallVisual.radius}
                    fill="url(#pz-leather-ball)"
                    stroke="#FFFFFF"
                    strokeWidth="1.1"
                  />
                </>
              )}
            </svg>

            {/* Animated Boundary Flash Overlay (FOUR / SIX) */}
            {playState === 'shot-outcome' && shotTrajectory && (shotTrajectory.isFour || shotTrajectory.isSix) && (
              <div className="pointer-events-none absolute top-2.5 inset-x-0 flex justify-center">
                <div
                  className={`px-4 py-1 sm:px-5 sm:py-1.5 rounded-2xl font-display text-xl sm:text-2xl font-extrabold uppercase tracking-wider shadow-xl animate-boundary-flash ${
                    shotTrajectory.isSix
                      ? 'bg-[#FF941F] text-[#0A1610]'
                      : 'bg-[#B7F34A] text-[#0A1610]'
                  }`}
                >
                  {shotTrajectory.isSix ? 'SIX! OVER THE ROPE' : 'FOUR! PAST THE ROPE'}
                </div>
              </div>
            )}

            {/* Pause Overlay */}
            {paused && (
              <div className="absolute inset-0 bg-[#07160D]/84 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="font-display text-3xl font-extrabold text-white">MATCH PAUSED</div>
                <button
                  type="button"
                  onClick={() => setPaused(false)}
                  className="min-h-[48px] px-7 py-2.5 rounded-2xl bg-[#B7F34A] text-[#0A1610] text-sm font-extrabold uppercase inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Resume Match
                </button>
              </div>
            )}
          </div>

          {/* Synchronized Timing Bar Immediately Below Field */}
          <div className="px-3 py-1.5 sm:px-4 sm:py-2.5 bg-black/55 border-t border-white/10 space-y-1 shrink-0">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#C7D7C9]">
              <span>TIMING BAR</span>
              <span className={inSweetZone ? 'text-[#B7F34A] font-extrabold' : ''}>
                {inSweetZone ? 'NOW! PLAY SHOT' : playState === 'bowler-runup' ? 'BOWLER RUNNING IN' : 'WATCH THE CREASE RING'}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-[#B7F34A]/45 border-x border-[#B7F34A]"
                style={{
                  left: `${Math.round((sweetSpotT - diffSpec.sweetHalfWindow) * 100)}%`,
                  width: `${Math.round(diffSpec.sweetHalfWindow * 2 * 100)}%`,
                }}
              />
              <div
                className="h-full bg-gradient-to-r from-[#087F55] via-[#B7F34A] to-[#FF941F]"
                style={{ width: `${Math.min(100, Math.round(ballProgress * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column on Desktop / Directly Below Timing Bar on Mobile */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Scoreboard (2x2 Grid with Target Chase) */}
          <div className="hidden lg:grid grid-cols-2 gap-2.5">
            <div
              key={`desk-runs-${runs}-${wickets}`}
              className="rounded-2xl bg-[#0D2115] border border-[#B7F34A]/35 px-4 py-3 text-white animate-score-pop"
            >
              <div className="text-[11px] font-bold uppercase text-[#B7F34A]">Runs / Wickets</div>
              <div className="font-mono text-3xl font-extrabold tabular-nums mt-0.5">
                {runs}/{wickets}
              </div>
            </div>
            <div className="rounded-2xl bg-[#0D2115] border border-[#FF941F]/35 px-4 py-3 text-white">
              <div className="text-[11px] font-bold uppercase text-[#FF941F]">Target Score</div>
              <div className="font-mono text-3xl font-extrabold text-[#FF941F] tabular-nums mt-0.5">
                {targetScore}
              </div>
            </div>
            <div className="rounded-2xl bg-[#0D2115] border border-white/12 px-4 py-3 text-white">
              <div className="text-[11px] font-bold uppercase text-[#9DB3A2]">Wickets Remaining</div>
              <div className="font-mono text-2xl font-extrabold tabular-nums mt-0.5">
                {wicketsLeft} <span className="text-xs font-normal text-[#9DB3A2]">/ {maxWickets}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-[#0D2115] border border-white/12 px-4 py-3 text-white">
              <div className="text-[11px] font-bold uppercase text-[#9DB3A2]">Balls Remaining</div>
              <div className="font-mono text-2xl font-extrabold tabular-nums mt-0.5">
                {ballsRemaining} <span className="text-xs font-normal text-[#9DB3A2]">/ {totalBalls}</span>
              </div>
            </div>
          </div>

          {/* Compact Fixed-Height Feedback Line (Prevents Layout Shift on Mobile) */}
          <div
            className={`rounded-xl px-3 py-1.5 sm:px-4 sm:py-2.5 border flex items-center justify-between gap-2 text-xs shrink-0 ${
              lastOutcomeBanner
                ? lastOutcomeBanner.tone === 'lime'
                  ? 'bg-[#EDF5EE] border-[#087F55] text-[#103B2A]'
                  : lastOutcomeBanner.tone === 'orange'
                    ? 'bg-[#FFF7ED] border-[#FF941F] text-[#7C2D12]'
                    : lastOutcomeBanner.tone === 'red'
                      ? 'bg-red-50 border-red-500 text-red-900'
                      : 'bg-[#DFF4E3] border-[#087F55]/25 text-[#102419]'
                : 'bg-[#DFF4E3] border-[#087F55]/25 text-[#103B2A]'
            }`}
          >
            <div className="font-display text-base sm:text-xl font-extrabold leading-none truncate">
              {lastOutcomeBanner ? lastOutcomeBanner.title : targetChased ? 'TARGET CHASED!' : `CHASE ${targetScore} RUNS`}
            </div>
            <div className="text-[11px] font-semibold truncate text-right opacity-90">
              {lastOutcomeBanner
                ? lastOutcomeBanner.badge
                : targetChased
                  ? 'Keep scoring!'
                  : `Need ${runsNeeded} off ${ballsRemaining}`}
            </div>
          </div>

          {/* Shot Buttons + Primary PLAY SHOT Trigger */}
          <div className="athletic-card rounded-2xl p-2 sm:p-3.5 space-y-1.5 sm:space-y-2.5 shrink-0">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {SHOTS.map((s) => {
                const isSelected = selectedShot === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedShot(s.id);
                      if (playState === 'ball-in-flight' && !paused && !helpOpen) {
                        resolveShot(s.id, ballProgressRef.current);
                      }
                    }}
                    className={`min-h-[42px] sm:min-h-[48px] px-1.5 py-1.5 sm:px-2 sm:py-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#103B2A] text-white border-[#B7F34A] shadow-sm'
                        : 'bg-[#F8FAF2] text-[#17251A] border-[#17251A]/12 hover:bg-[#EDF5EE]'
                    }`}
                  >
                    <span className="font-display text-sm sm:text-base font-bold leading-none">{s.shortLabel}</span>
                    <span className={`hidden sm:block text-[9px] font-mono mt-1 ${isSelected ? 'text-[#B7F34A]' : 'text-[#5C6B5F]'}`}>
                      {s.keyHint}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={playState !== 'ball-in-flight' || paused}
              onClick={() => resolveShot(selectedShot, ballProgressRef.current)}
              className={`w-full min-h-[46px] sm:min-h-[54px] rounded-xl sm:rounded-2xl font-display text-lg sm:text-2xl font-extrabold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md ${
                playState === 'ball-in-flight' && !paused
                  ? inSweetZone
                    ? 'bg-[#B7F34A] text-[#0A1610] shadow-[0_0_22px_rgba(183,243,74,0.65)]'
                    : 'bg-[#FF941F] hover:bg-[#ffa442] text-[#17251A]'
                  : 'bg-[#EDF5EE] text-[#5C6B5F] cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>
                {playState === 'ball-in-flight'
                  ? `PLAY SHOT (${SHOTS.find((s) => s.id === selectedShot)?.shortLabel.toUpperCase()})`
                  : playState === 'bowler-runup'
                    ? 'BOWLER RUNNING IN...'
                    : 'NEXT DELIVERY...'}
              </span>
            </button>

            <div className="hidden sm:flex items-center justify-between text-[11px] text-[#5C6B5F] px-1">
              <span>Swipe on field, press 1–4, or tap Spacebar</span>
              <span className="font-mono font-bold text-[#17251A] tabular-nums">
                Best ({mode}): {Math.max(bestScores[mode], runs)} · {timingAccuracy}%
              </span>
            </div>
          </div>

          {/* Desktop Live Over Summary Strip */}
          {ballLog.length > 0 && (
            <div className="hidden lg:flex flex-wrap items-center gap-1.5 rounded-2xl bg-[#D7F0DC] border border-[#087F55]/25 p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#55635B] mr-1">Over:</span>
              {ballLog.map((b) => (
                <span
                  key={b.ballNumber}
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-extrabold inline-flex items-center justify-center ${
                    b.isWicket
                      ? 'bg-red-600 text-white'
                      : b.runs >= 4
                        ? 'bg-[#B7F34A] text-[#0A1610]'
                        : b.runs > 0
                          ? 'bg-[#087F55] text-white'
                          : 'bg-[#EDF3EA] text-[#101714]'
                  }`}
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Inline Quick Help Modal During Match */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A1610]/70 backdrop-blur-xs p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-gradient-to-b from-[#E1F4E5] to-[#D1ECD7] rounded-3xl border border-[#B7F34A]/45 p-6 space-y-4 shadow-2xl text-[#102419]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">How to Play PlayNets</h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Close help"
                className="min-h-[40px] min-w-[40px] rounded-xl bg-[#EDF5EE] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-xs text-[#5C6B5F] leading-relaxed">
              <li>• Watch the red ball bounce down the pitch toward your white popping crease.</li>
              <li>• Tap a shot (Drive, Pull, Cut, Loft) or swipe directly on the green arena just as the ball enters the glowing lime ring.</li>
              <li>• Keyboard: Press Spacebar to swing the selected shot, or 1–4 / Arrow keys to play a specific shot instantly.</li>
              <li>• Match ends after all balls are bowled or 3 wickets fall.</li>
            </ul>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#103B2A] text-white text-xs font-bold"
            >
              Back to Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
