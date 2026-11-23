import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Handedness,
  NavSectionId,
  PitchIQState,
  SavedVideoRecord,
  SkillLevel,
  VideoAnalysisReport,
} from '../types';
import { analyzeVideoWithMediaPipe } from '../utils/poseAnalyzer';
import { CRICKET_EXERCISES } from '../data/exercises';
import { VERIFIED_TUTORIALS } from '../data/tutorials';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { authFetch } from '../lib/firebase';

interface VideoAnalysisStudioViewProps {
  mode: 'camera' | 'upload' | 'batting' | 'bowling' | 'fielding' | 'studio' | 'dismissal';
  state: PitchIQState;
  onSaveReport: (report: VideoAnalysisReport, videoRecord?: SavedVideoRecord) => void;
  onDeleteReport: (id: string) => void;
  onOpenExercise: (id: string) => void;
  onNavigate: (section: NavSectionId) => void;
}

const TECHNIQUES_BY_SKILL: Record<'Batting' | 'Bowling' | 'Fielding', string[]> = {
  Batting: ['Stance & Backlift', 'Cover Drive', 'Straight Drive', 'Pull Shot', 'Cut Shot', 'Sweep Shot', 'Forward Defense'],
  Bowling: ['Full Bowling Action', 'Run-Up & Gather', 'Yorker Execution', 'Outswing / Inswing Release', 'Off-Spin / Leg-Spin Action'],
  Fielding: ['Ready Position & Split-Step', 'High Catching', 'Ground Ball Pickup', 'Direct-Hit Throwing', 'Wicketkeeping Take'],
};

const CAMERA_GUIDES: Record<'Batting' | 'Bowling' | 'Fielding', string[]> = {
  Batting: ['Side view (square-on) for stance, head position, and back-to-front weight transfer.', 'Front or diagonal view for bat alignment and footwork line.'],
  Bowling: ['Side view for run-up rhythm, gather, front-leg brace, and follow-through.', 'Front view for arm path and alignment where safe behind netting.'],
  Fielding: ['Wide-angle view keeping your full body, pickup zone, and throwing release inside frame.'],
};

export const VideoAnalysisStudioView: React.FC<VideoAnalysisStudioViewProps> = ({
  mode,
  state,
  onSaveReport,
  onDeleteReport,
  onOpenExercise,
}) => {
  const defaultSkill: 'Batting' | 'Bowling' | 'Fielding' =
    mode === 'bowling' ? 'Bowling' : mode === 'fielding' ? 'Fielding' : 'Batting';

  const [skillCategory, setSkillCategory] = useState<'Batting' | 'Bowling' | 'Fielding'>(defaultSkill);
  const [technique, setTechnique] = useState<string>(TECHNIQUES_BY_SKILL[defaultSkill][1] || TECHNIQUES_BY_SKILL[defaultSkill][0]);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>(state.profile.skillLevel);
  const [handedness, setHandedness] = useState<Handedness>(state.profile.battingHand);
  const [cameraAngle, setCameraAngle] = useState<string>('Side View');
  const [playerNotes, setPlayerNotes] = useState<string>('');

  // Video upload & camera recording states
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Processing & report states
  const [analyzing, setAnalyzing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<VideoAnalysisReport | null>(state.reports[0] || null);
  const [showOverlay, setShowOverlay] = useState(true);

  // Dismissal ("Why Did I Get Out?") states
  const [dismissalType, setDismissalType] = useState('Bowled');
  const [dismissalTech, setDismissalTech] = useState('Front-Foot Drive');
  const [dismissalContext, setDismissalContext] = useState('');
  const [dismissalNotes, setDismissalNotes] = useState('');
  const [dismissalLoading, setDismissalLoading] = useState(false);
  const [dismissalResult, setDismissalResult] = useState<{
    observedEvidence: string;
    supportingTimestamp: string;
    confidence: string;
    possibleReasons: string[];
    technicalExplanation: string;
    correctionSteps: string[];
    recommendedExerciseIds: string[];
    recommendedTutorialIds: string[];
  } | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    videoUrlRef.current = videoUrl;
  }, [videoUrl]);

  useEffect(() => {
    setActiveReport((prev) => {
      if (prev && state.reports.some((r) => r.id === prev.id)) return prev;
      return state.reports[0] || null;
    });
  }, [state.reports]);

  useEffect(() => {
    return () => {
      stopCameraStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (analysisAbortRef.current) analysisAbortRef.current.abort();
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setRecordingState('idle');
  };

  const startCamera = async (modeFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCameraStream();
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: modeFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play().catch(() => {});
        }
      }, 60);
    } catch (err) {
      setCameraError(
        err instanceof Error
          ? `Camera access unavailable (${err.message}). Please allow camera permission in your browser or upload a recorded MP4/MOV/WebM clip.`
          : 'Unable to access camera.'
      );
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordSeconds(0);
    const preferredTypes = ['video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    const supportedType =
      typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
        ? preferredTypes.find((t) => MediaRecorder.isTypeSupported(t))
        : undefined;
    const recorder = supportedType
      ? new MediaRecorder(streamRef.current, { mimeType: supportedType })
      : new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blobType = recorder.mimeType || supportedType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: blobType });
      const url = URL.createObjectURL(blob);
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
      setVideoUrl(url);
      const ext = blobType.includes('mp4') ? 'mp4' : 'webm';
      setVideoFileName(`camera-capture-${new Date().toLocaleTimeString()}.${ext}`);
      stopCameraStream();
    };
    recorderRef.current = recorder;
    recorder.start(250);
    setRecordingState('recording');
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
  };

  const togglePauseRecording = () => {
    if (!recorderRef.current) return;
    if (recordingState === 'recording' && typeof recorderRef.current.pause === 'function') {
      recorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) window.clearInterval(timerRef.current);
    } else if (recordingState === 'paused' && typeof recorderRef.current.resume === 'function') {
      recorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = window.setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnalysisError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
    if (!allowed.includes(file.type) && !/\.(mp4|mov|webm|m4v)$/i.test(file.name)) {
      setAnalysisError('Unsupported file format. Please upload an MP4, MOV, or WebM cricket practice video.');
      e.target.value = '';
      return;
    }
    if (file.size === 0) {
      setAnalysisError('The selected video file is empty. Please choose a valid cricket practice clip.');
      e.target.value = '';
      return;
    }
    if (file.size > 80 * 1024 * 1024) {
      setAnalysisError('Video file exceeds 80 MB. Please trim to a 5–20 second practice clip for clean pose extraction.');
      e.target.value = '';
      return;
    }
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setVideoFileName(file.name);
  };

  const cancelVideoAnalysis = () => {
    if (analysisAbortRef.current) {
      analysisAbortRef.current.abort();
    }
  };

  const runRealVideoAnalysis = async () => {
    if (!videoUrl || analyzing) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setProgressPct(5);
    setProgressStage('Validating video clip & session settings...');

    const controller = new AbortController();
    analysisAbortRef.current = controller;
    let aiStageInterval: number | null = null;
    let requestTimeoutId: number | null = null;

    try {
      setProgressPct(10);

      const { frames, poseSummary, durationSec } = await analyzeVideoWithMediaPipe(
        videoUrl,
        (pct, stage) => {
          setProgressPct(pct);
          setProgressStage(stage);
        },
        controller.signal
      );

      if (controller.signal.aborted) {
        throw new DOMException('Analysis cancelled.', 'AbortError');
      }

      setProgressPct(72);
      setProgressStage('Reviewing movement & generating coaching feedback...');

      aiStageInterval = window.setInterval(() => {
        setProgressPct((prev) => (prev < 88 ? prev + 2 : prev));
      }, 1200);

      requestTimeoutId = window.setTimeout(() => {
        controller.abort();
      }, 65000);

      const res = await authFetch('/api/analysis/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          skillCategory,
          technique,
          skillLevel,
          handedness,
          cameraAngle,
          playerNotes,
          frames: frames.map((f) => ({
            frameIndex: f.frameIndex,
            timestampSec: f.timestampSec,
            imageDataUrl: f.imageDataUrl,
            poseDetected: f.poseDetected,
            avgVisibility: f.avgVisibility,
            metrics: f.metrics,
          })),
          poseSummary,
          availableExercises: CRICKET_EXERCISES.map((ex) => ({ id: ex.id, name: ex.name, category: ex.category })),
          availableTutorials: VERIFIED_TUTORIALS.map((t) => ({ id: t.id, title: t.title, category: t.category })),
        }),
      });

      if (aiStageInterval) {
        window.clearInterval(aiStageInterval);
        aiStageInterval = null;
      }
      if (requestTimeoutId) {
        window.clearTimeout(requestTimeoutId);
        requestTimeoutId = null;
      }

      setProgressPct(92);
      setProgressStage('Processing & validating AI coaching report...');

      const rawText = await res.text();
      let data: {
        error?: string;
        insufficientEvidence?: boolean;
        summary?: string;
        observedStrengths?: string[];
        areasToImprove?: string[];
        observations?: VideoAnalysisReport['observations'];
        recommendedExerciseIds?: string[];
        recommendedTutorialIds?: string[];
        personalImprovementPlan?: string[];
        limitationsNotice?: string;
      } = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          !res.ok
            ? `Analysis server error (HTTP ${res.status}). Please tap Retry.`
            : 'Analysis server returned an unexpected response. Please tap Retry.'
        );
      }

      if (!res.ok || !data.summary) {
        throw new Error(data.error || 'Video analysis failed.');
      }

      setProgressPct(96);
      setProgressStage('Saving report & rendering results...');

      const reportId = `rep-${Date.now()}`;
      const newReport: VideoAnalysisReport = {
        id: reportId,
        createdAt: new Date().toISOString(),
        title: `${skillCategory}: ${technique}`,
        skillCategory,
        technique,
        skillLevel,
        handedness,
        cameraAngle,
        playerNotes,
        insufficientEvidence: Boolean(data.insufficientEvidence),
        summary: data.summary,
        observedStrengths: Array.isArray(data.observedStrengths) ? data.observedStrengths : [],
        areasToImprove: Array.isArray(data.areasToImprove) ? data.areasToImprove : [],
        observations: Array.isArray(data.observations) ? data.observations : [],
        recommendedExerciseIds: Array.isArray(data.recommendedExerciseIds) ? data.recommendedExerciseIds : [],
        recommendedTutorialIds: Array.isArray(data.recommendedTutorialIds) ? data.recommendedTutorialIds : [],
        personalImprovementPlan: Array.isArray(data.personalImprovementPlan) ? data.personalImprovementPlan : [],
        limitationsNotice:
          data.limitationsNotice ||
          'Report generated from key video moments and visible movement checkpoints.',
        frames,
        poseSummary,
      };

      const savedVid: SavedVideoRecord = {
        id: `vid-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: videoFileName || `${skillCategory} — ${technique}`,
        skillCategory,
        technique,
        durationSec: Math.round(durationSec),
        thumbnailDataUrl: frames[0]?.annotatedDataUrl || frames[0]?.imageDataUrl || '',
        reportId,
      };

      onSaveReport(newReport, savedVid);
      setActiveReport(newReport);
      setProgressPct(100);
      setProgressStage('Analysis complete');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setAnalysisError('Video analysis was cancelled or timed out before completing. Your clip is still loaded—tap Retry to run again.');
      } else {
        setAnalysisError(err instanceof Error ? err.message : 'Analysis failed. Please retry with a clearer clip.');
      }
      setProgressPct(0);
      setProgressStage('');
    } finally {
      if (aiStageInterval) window.clearInterval(aiStageInterval);
      if (requestTimeoutId) window.clearTimeout(requestTimeoutId);
      analysisAbortRef.current = null;
      setAnalyzing(false);
    }
  };

  const runDismissalAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dismissalLoading) return;
    setDismissalLoading(true);
    setAnalysisError(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 50000);

    try {
      let extractedFrames: Array<{ frameIndex: number; timestampSec: number; imageDataUrl: string }> = [];
      if (videoUrl) {
        const resPose = await analyzeVideoWithMediaPipe(videoUrl, undefined, controller.signal);
        extractedFrames = resPose.frames.map((f) => ({
          frameIndex: f.frameIndex,
          timestampSec: f.timestampSec,
          imageDataUrl: f.imageDataUrl,
        }));
      }

      const res = await authFetch('/api/analysis/dismissal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          dismissalType,
          technique: dismissalTech,
          scorecardContext: dismissalContext,
          notes: dismissalNotes,
          frames: extractedFrames,
          availableExercises: CRICKET_EXERCISES.map((ex) => ({ id: ex.id, name: ex.name })),
          availableTutorials: VERIFIED_TUTORIALS.map((t) => ({ id: t.id, title: t.title })),
        }),
      });
      const rawText = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          !res.ok
            ? `Dismissal analysis error (HTTP ${res.status}). Please try again.`
            : 'Dismissal analysis server returned an unexpected response. Please try again.'
        );
      }
      if (!res.ok) throw new Error(String(data.error || 'Dismissal analysis failed.'));
      setDismissalResult(data as typeof dismissalResult);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setAnalysisError('Dismissal analysis timed out. Please try again.');
      } else {
        setAnalysisError(err instanceof Error ? err.message : 'Unable to complete dismissal analysis.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      setDismissalLoading(false);
    }
  };

  if (mode === 'dismissal') {
    return (
      <div className="space-y-8">
        <div className="studio-dark-panel text-white rounded-3xl p-7 md:p-9 shadow-xl">
          <div className="text-xs font-bold text-[#FF941F] uppercase tracking-wider mb-1">Dismissal Diagnostics Lab</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Why Did I Get Out?</h1>
          <p className="text-sm text-[#C7D7C9] mt-1 max-w-2xl">
            Combine your dismissal type, scorecard context, and optional practice/match video. CRICKIFY AI strictly separates observed evidence from possible technical reasons.
          </p>
        </div>

        <form onSubmit={runDismissalAnalysis} className="athletic-card rounded-2xl p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Dismissal Type</label>
              <select
                value={dismissalType}
                onChange={(e) => setDismissalType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              >
                {['Bowled', 'LBW', 'Caught Behind / Slip', 'Caught in the Ring', 'Caught on Boundary', 'Stumped', 'Run Out', 'Hit Wicket'].map(
                  (d) => <option key={d} value={d}>{d}</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Shot / Technique Attempted</label>
              <input
                type="text"
                value={dismissalTech}
                onChange={(e) => setDismissalTech(e.target.value)}
                placeholder="e.g. Front-foot cover drive / flick off pads"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Match / Scorecard Context</label>
              <input
                type="text"
                value={dismissalContext}
                onChange={(e) => setDismissalContext(e.target.value)}
                placeholder="e.g. 14 off 18 balls, powerplay over 4 vs right-arm inswinger"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Optional Video Clip</label>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileUpload}
                className="w-full text-xs text-[#17251A] file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:bg-[#397B32] file:text-white file:font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-1.5">What Happened? (Notes)</label>
            <textarea
              rows={3}
              value={dismissalNotes}
              onChange={(e) => setDismissalNotes(e.target.value)}
              placeholder="Describe the ball length, swing/spin, where your feet went, and where the ball hit..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-sm"
            />
          </div>

          {analysisError && <p className="text-xs text-[#B91C1C] font-medium">{analysisError}</p>}

          <button
            type="submit"
            disabled={dismissalLoading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25] transition-colors disabled:opacity-50"
          >
            {dismissalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Analyse Dismissal Evidence
          </button>
        </form>

        {dismissalResult && (
          <div className="athletic-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#17251A]/10">
              <h2 className="font-display text-2xl font-bold text-[#153D25]">Dismissal Analysis Report</h2>
              <span className="text-xs font-mono font-semibold text-[#397B32]">
                Confidence: {dismissalResult.confidence} · {dismissalResult.supportingTimestamp}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#EDF1E7]">
                <div className="text-xs font-bold text-[#397B32] mb-1">Observed Visual Evidence</div>
                <p className="text-sm text-[#17251A]">{dismissalResult.observedEvidence}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#EDF1E7]">
                <div className="text-xs font-bold text-[#153D25] mb-1">Possible Technical Explanations</div>
                <ul className="space-y-1 text-sm text-[#17251A]">
                  {dismissalResult.possibleReasons.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-[#153D25] mb-1">Technical Explanation</h3>
              <p className="text-sm text-[#68766A] leading-relaxed">{dismissalResult.technicalExplanation}</p>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-[#153D25] mb-2">Correction Steps</h3>
              <ul className="space-y-1.5 text-sm text-[#17251A]">
                {dismissalResult.correctionSteps.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>

            {dismissalResult.recommendedExerciseIds.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {dismissalResult.recommendedExerciseIds.map((id) => {
                  const ex = CRICKET_EXERCISES.find((e) => e.id === id);
                  return ex ? (
                    <button
                      key={id}
                      onClick={() => onOpenExercise(ex.id)}
                      className="px-4 py-2 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25]"
                    >
                      Start Drill: {ex.name}
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dark Technical Biomechanics Studio Header */}
      <div className="relative rounded-3xl overflow-hidden studio-dark-panel text-white p-7 md:p-10 shadow-xl">
        <img
          src={CRICKIFY_IMAGES.videoPracticeCapture}
          alt="Cricketer practicing technique being captured on video"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(108deg, rgba(10, 17, 14, 0.94) 0%, rgba(16, 28, 22, 0.80) 55%, rgba(20, 42, 30, 0.32) 100%)',
          }}
        />
        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="text-xs font-bold text-[#B7F34A] uppercase tracking-wider">
            {mode === 'camera' ? 'Quick Camera Capture' : mode === 'studio' ? 'Technique Correction Studio' : 'AI Video Review Studio'}
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold text-white tracking-tight uppercase">
            AI Cricket Technique Analysis
          </h1>
          <p className="text-sm text-[#D7E4D8] leading-relaxed">
            Understand your batting and bowling technique with AI-powered movement analysis. Get clear feedback on your body position, balance, posture and movement to identify areas for improvement.
          </p>
        </div>
      </div>

      {/* Capture / Upload Controls */}
      {mode !== 'studio' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 athletic-card rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#153D25]">1. Session Setup</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#17251A] mb-1">Skill</label>
                <select
                  value={skillCategory}
                  onChange={(e) => {
                    const sk = e.target.value as 'Batting' | 'Bowling' | 'Fielding';
                    setSkillCategory(sk);
                    setTechnique(TECHNIQUES_BY_SKILL[sk][0]);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
                >
                  <option value="Batting">Batting</option>
                  <option value="Bowling">Bowling</option>
                  <option value="Fielding">Fielding</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17251A] mb-1">Technique</label>
                <select
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
                >
                  {TECHNIQUES_BY_SKILL[skillCategory].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17251A] mb-1">Skill Level</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value as SkillLevel)}
                  className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
                >
                  {['Beginner', 'Intermediate', 'Advanced', 'Competitive'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17251A] mb-1">Handedness</label>
                <select
                  value={handedness}
                  onChange={(e) => setHandedness(e.target.value as Handedness)}
                  className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
                >
                  <option value="Right-handed">Right-handed</option>
                  <option value="Left-handed">Left-handed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Camera Angle</label>
              <select
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-semibold"
              >
                <option value="Side View">Side View</option>
                <option value="Front / Bowler-End View">Front / Bowler-End View</option>
                <option value="Diagonal View">Diagonal View</option>
                <option value="Wide-Angle Fielding View">Wide-Angle Fielding View</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-[#EDF1E7] text-xs text-[#68766A] space-y-1">
              <div className="font-bold text-[#153D25]">Suggested Camera Angles ({skillCategory}):</div>
              {CAMERA_GUIDES[skillCategory].map((g, i) => <div key={i}>• {g}</div>)}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1">Optional Notes</label>
              <textarea
                rows={2}
                value={playerNotes}
                onChange={(e) => setPlayerNotes(e.target.value)}
                placeholder="e.g. Working on keeping head still and front knee bent..."
                className="w-full px-3 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs"
              />
            </div>
          </div>

          <div className="lg:col-span-7 athletic-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold text-[#153D25]">2. Capture or Upload Practice Clip</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#153D25] transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> Open Live Camera
                </button>
                <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-[#17251A] text-xs font-bold cursor-pointer hover:bg-[#EDF1E7] transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#397B32]" /> Upload Video
                  <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {cameraError && (
              <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#FF941F]/40 text-xs text-[#7C2D12]">{cameraError}</div>
            )}

            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <video ref={liveVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {recordingState !== 'idle' && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-red-600 text-white font-mono text-xs font-bold tabular-nums">
                      REC {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {recordingState === 'idle' ? (
                    <button
                      onClick={startRecording}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Recording
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={togglePauseRecording}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#153D25] text-white text-xs font-semibold"
                      >
                        <Pause className="w-3.5 h-3.5" /> {recordingState === 'paused' ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={stopRecording}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" /> Stop &amp; Preview
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      const next = facingMode === 'environment' ? 'user' : 'environment';
                      setFacingMode(next);
                      startCamera(next);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#17251A]/15 text-xs font-semibold text-[#17251A]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Switch Camera
                  </button>
                  <button
                    onClick={stopCameraStream}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#68766A] hover:text-[#17251A]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : videoUrl ? (
              <div className="space-y-4">
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <video src={videoUrl} controls playsInline className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#68766A] font-mono truncate max-w-xs">{videoFileName}</div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => {
                        if (videoUrl) URL.revokeObjectURL(videoUrl);
                        setVideoUrl(null);
                        setVideoFileName('');
                        setAnalysisError(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-[#17251A]/15 text-xs font-semibold text-[#17251A] hover:bg-[#EDF1E7]"
                    >
                      Retake / Choose Another
                    </button>
                    <button
                      onClick={runRealVideoAnalysis}
                      disabled={analyzing}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A8D94E] text-[#153D25] text-xs font-bold hover:bg-[#95c93a] transition-colors disabled:opacity-50"
                    >
                      {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
                      {analyzing ? 'Analysing Technique & Movement...' : 'Run AI Technique Analysis'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#397B32]/30 rounded-2xl bg-[#F8FAF2] p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#EDF1E7] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6 text-[#397B32]" />
                </div>
                <div className="text-sm font-bold text-[#153D25]">
                  Record directly or upload an MP4, MOV, or WebM cricket video (5–20s recommended)
                </div>
                <p className="text-xs text-[#68766A] max-w-md mx-auto">
                  Ensure good lighting and full-body framing. Your privacy matters—videos are processed in your session and can be deleted at any time.
                </p>
              </div>
            )}

            {analyzing && (
              <div className="p-4 rounded-xl bg-[#EDF1E7] border border-[#397B32]/20 space-y-2.5">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-[#153D25]">
                  <span>{progressStage}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono tabular-nums text-[#397B32]">{progressPct}%</span>
                    <button
                      type="button"
                      onClick={cancelVideoAnalysis}
                      className="px-2.5 py-1 rounded-lg border border-[#087F55]/25 bg-[#E6F5E8] text-[11px] font-semibold text-[#102419] hover:bg-red-50 hover:text-red-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-[#C2E6CA] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#397B32] to-[#A8D94E] transition-all duration-200"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {analysisError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between gap-3">
                <span>{analysisError}</span>
                {videoUrl && (
                  <button
                    type="button"
                    onClick={runRealVideoAnalysis}
                    disabled={analyzing}
                    className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-semibold hover:bg-red-800 disabled:opacity-50 shrink-0"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Saved Reports Selector */}
      {state.reports.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold text-[#153D25]">Saved Analysis Reports</h2>
            <div className="flex flex-wrap gap-2">
              {state.reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    activeReport?.id === rep.id
                      ? 'bg-[#397B32] text-white border-[#397B32]'
                      : 'bg-[#D7F0DC] text-[#102419] border-[#087F55]/20 hover:bg-[#C2E7C9]'
                  }`}
                >
                  {rep.technique} · {new Date(rep.createdAt).toLocaleDateString()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReport ? (
        <div className="athletic-card rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#69A83F] via-[#397B32] to-[#24552E] text-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#A8D94E]">
                {activeReport.skillCategory} · {activeReport.technique} · {activeReport.cameraAngle} ·{' '}
                {activeReport.handedness}
              </div>
              <h2 className="font-display text-3xl font-bold">Evidence-Based Technique Report</h2>
            </div>
            <button
              onClick={() => {
                onDeleteReport(activeReport.id);
                setActiveReport(state.reports.find((r) => r.id !== activeReport.id) || null);
              }}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 text-xs font-bold text-white hover:bg-red-600/90"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Report
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            {activeReport.insufficientEvidence && (
              <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#FF941F]/40 flex items-start gap-3 text-sm text-[#7C2D12]">
                <AlertTriangle className="w-5 h-5 text-[#FF941F] shrink-0 mt-0.5" />
                <div>
                  <strong>Clearer Video Framing Recommended:</strong> Some body positions were partially hidden or out of frame. Try recording in clear lighting with your full stance visible.
                </div>
              </div>
            )}

            {/* Summary & Movement & Posture Checkpoints */}
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-display text-2xl font-bold text-[#153D25]">Analysis Summary</h3>
                <p className="text-sm text-[#17251A] leading-relaxed">{activeReport.summary}</p>
                <div className="grid sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#EDF1E7]">
                    <div className="text-xs font-bold text-[#397B32] mb-2">Observed Strengths</div>
                    <ul className="space-y-1.5 text-xs text-[#17251A]">
                      {activeReport.observedStrengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-[#FFF7ED]">
                    <div className="text-xs font-bold text-[#C2410C] mb-2">Areas to Improve</div>
                    <ul className="space-y-1.5 text-xs text-[#17251A]">
                      {activeReport.areasToImprove.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 studio-dark-panel text-white rounded-2xl p-5 space-y-3">
                <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider">Movement &amp; Posture Summary</div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/8 border border-white/10 p-3.5 rounded-xl">
                    <div className="text-[#9DB3A2]">Frames Tracked</div>
                    <div className="font-mono font-bold text-base text-white tabular-nums mt-0.5">
                      {activeReport.poseSummary.framesWithPose} / {activeReport.poseSummary.framesAnalyzed}
                    </div>
                  </div>
                  <div className="bg-white/8 border border-white/10 p-3.5 rounded-xl">
                    <div className="text-[#9DB3A2]">Body Point Clarity</div>
                    <div className="font-mono font-bold text-base text-[#A8D94E] tabular-nums mt-0.5">
                      {Math.round(activeReport.poseSummary.avgVisibility * 100)}%
                    </div>
                  </div>
                  <div className="bg-white/8 border border-white/10 p-3.5 rounded-xl">
                    <div className="text-[#9DB3A2]">Front Knee Bend Angle</div>
                    <div className="font-mono font-bold text-base text-white tabular-nums mt-0.5">
                      {activeReport.poseSummary.avgFrontKneeAngleDeg !== null
                        ? `${activeReport.poseSummary.avgFrontKneeAngleDeg}°`
                        : 'Not available'}
                    </div>
                  </div>
                  <div className="bg-white/8 border border-white/10 p-3.5 rounded-xl">
                    <div className="text-[#9DB3A2]">Head Steadiness Shift</div>
                    <div className="font-mono font-bold text-base text-[#FF941F] tabular-nums mt-0.5">
                      {activeReport.poseSummary.headStabilityDeltaDeg !== null
                        ? `${activeReport.poseSummary.headStabilityDeltaDeg}°`
                        : 'Not available'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#C7D7C9]">{activeReport.poseSummary.balanceSymmetryNote}</p>
              </div>
            </div>

            {/* Extracted Keyframes Gallery */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-2xl font-bold text-[#153D25]">Key Practice Moments</h3>
                <button
                  onClick={() => setShowOverlay((s) => !s)}
                  className="px-3.5 py-2 rounded-xl border border-[#17251A]/15 bg-[#F8FAF2] text-xs font-bold text-[#153D25] hover:bg-[#EDF1E7]"
                >
                  {showOverlay ? 'Showing Posture Guides (Click for Original)' : 'Showing Original Frames (Click for Guides)'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {activeReport.frames.map((frame) => (
                  <div key={frame.frameIndex} className="rounded-xl overflow-hidden border border-[#17251A]/10 bg-[#153D25] text-white">
                    <img
                      src={showOverlay ? frame.annotatedDataUrl : frame.imageDataUrl}
                      alt={`Frame ${frame.frameIndex} at ${frame.timestampSec}s`}
                      className="w-full aspect-video object-cover"
                    />
                    <div className="p-2 text-[11px] font-mono flex items-center justify-between tabular-nums">
                      <span>#{frame.frameIndex} · {frame.timestampSec}s</span>
                      <span className="text-[#A8D94E]">
                        {frame.poseDetected ? `${Math.round(frame.avgVisibility * 100)}%` : 'Clearer angle needed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timestamped Observations */}
            <div className="space-y-4">
              <h3 className="font-display text-2xl font-bold text-[#153D25]">Timestamped Technical Observations</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {activeReport.observations.map((obs, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#F8FAF2] border border-[#17251A]/10 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#397B32]">
                      <span>Frame #{obs.frameIndex} · {obs.timestampSec}s</span>
                      <span>Confidence: {obs.confidence}</span>
                    </div>
                    <h4 className="font-display text-xl font-bold text-[#153D25]">{obs.title}</h4>
                    <p className="text-xs text-[#68766A]"><strong className="text-[#17251A]">Evidence:</strong> {obs.evidence}</p>
                    <p className="text-xs text-[#68766A]"><strong className="text-[#17251A]">Why it matters:</strong> {obs.whyItMatters}</p>
                    <div className="pt-1">
                      <div className="text-xs font-bold text-[#153D25] mb-1">Step-by-Step Correction:</div>
                      <ul className="space-y-1 text-xs text-[#17251A]">
                        {obs.correctionSteps.map((st, sIdx) => <li key={sIdx}>• {st}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mistake-to-Exercise Connection */}
            <div className="bg-gradient-to-br from-[#69A83F] via-[#397B32] to-[#24552E] text-white rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-[#A8D94E] uppercase tracking-wider">AI Mistake-to-Exercise Pipeline</div>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
                    Recommended Drills From Your Analysis
                  </h3>
                </div>
                {activeReport.recommendedExerciseIds[0] && (
                  <button
                    onClick={() => onOpenExercise(activeReport.recommendedExerciseIds[0])}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#A8D94E] text-[#17251A] text-xs font-bold hover:bg-[#b8e465]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> START MY IMPROVEMENT SESSION
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeReport.recommendedExerciseIds.map((exId) => {
                  const ex = CRICKET_EXERCISES.find((e) => e.id === exId);
                  return ex ? (
                    <button
                      key={ex.id}
                      onClick={() => onOpenExercise(ex.id)}
                      className="text-left p-4 rounded-2xl bg-[#E1F4E5] text-[#102419] hover:bg-[#CBEBD2] border border-[#087F55]/20 transition-colors space-y-1 shadow-xs"
                    >
                      <div className="text-[11px] font-bold text-[#397B32]">{ex.category}</div>
                      <div className="font-display text-lg font-bold text-[#17251A]">{ex.name}</div>
                      <div className="text-[11px] text-[#68766A] font-mono">{ex.sets}</div>
                    </button>
                  ) : null;
                })}
              </div>
            </div>

            {activeReport.personalImprovementPlan && activeReport.personalImprovementPlan.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#EDF1E7] space-y-2.5">
                <h3 className="font-display text-xl font-bold text-[#153D25]">Personal Improvement Plan</h3>
                <ul className="space-y-1.5 text-xs text-[#17251A]">
                  {activeReport.personalImprovementPlan.map((step, idx) => (
                    <li key={idx}>• {step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Limitations Transparency */}
            <div className="p-4 rounded-xl bg-[#F8FAF2] border border-[#17251A]/10 flex items-start gap-3 text-xs text-[#68766A]">
              <ShieldAlert className="w-4 h-4 text-[#397B32] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#17251A]">Measurement Transparency &amp; Limitations:</strong> {activeReport.limitationsNotice}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="athletic-card rounded-2xl p-8 text-center text-sm text-[#68766A]">
          Upload or record a practice video above to generate your first AI Cricket Technique Analysis Report.
        </div>
      )}
    </div>
  );
};
