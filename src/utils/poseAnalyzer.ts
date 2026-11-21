import { FilesetResolver, PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { PoseAggregateSummary, PoseFrameTelemetry } from '../types';

let cachedLandmarker: PoseLandmarker | null = null;
let landmarkerUnavailable = false;

const METADATA_TIMEOUT_MS = 12000;
const SEEK_TIMEOUT_MS = 2500;
const MEDIAPIPE_INIT_TIMEOUT_MS = 12000;

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Analysis cancelled.', 'AbortError');
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string, signal?: AbortSignal): Promise<T> {
  throwIfAborted(signal);
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Analysis cancelled.', 'AbortError'));
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });

    promise.then(
      (val) => {
        cleanup();
        resolve(val);
      },
      (err) => {
        cleanup();
        reject(err);
      }
    );
  });
}

async function getPoseLandmarker(signal?: AbortSignal): Promise<PoseLandmarker | null> {
  throwIfAborted(signal);
  if (cachedLandmarker) return cachedLandmarker;
  if (landmarkerUnavailable) return null;

  try {
    const initPromise = (async () => {
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
      } catch {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm'
        );
      }
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'CPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
      });
    })();

    cachedLandmarker = await withTimeout(
      initPromise,
      MEDIAPIPE_INIT_TIMEOUT_MS,
      'MediaPipe Pose Landmarker initialization timed out.',
      signal
    );
    return cachedLandmarker;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    console.warn('MediaPipe PoseLandmarker unavailable, continuing with visual frame capture:', err);
    landmarkerUnavailable = true;
    return null;
  }
}

function angleBetweenThreePoints(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

function slopeDeg(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.round((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
}

const SKELETON_CONNECTIONS: Array<[number, number]> = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
) {
  ctx.save();
  ctx.lineWidth = Math.max(2, Math.round(width / 220));
  ctx.strokeStyle = '#B5E66D';

  for (const [startIdx, endIdx] of SKELETON_CONNECTIONS) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    if (p1 && p2 && (p1.visibility ?? 0) > 0.35 && (p2.visibility ?? 0) > 0.35) {
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }
  }

  const keyIndices = [0, 2, 5, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  for (const idx of keyIndices) {
    const pt = landmarks[idx];
    if (pt && (pt.visibility ?? 0) > 0.35) {
      ctx.beginPath();
      ctx.arc(pt.x * width, pt.y * height, Math.max(3, Math.round(width / 150)), 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#D5AD57' : '#FFFFFF';
      ctx.fill();
      ctx.strokeStyle = '#092F22';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function computeFrameMetrics(landmarks: NormalizedLandmark[]) {
  const leftEye = landmarks[2];
  const rightEye = landmarks[5];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const leftWrist = landmarks[15];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  const keyPts = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
  const visSum = keyPts.reduce((acc, idx) => acc + (landmarks[idx]?.visibility ?? 0), 0);
  const avgVisibility = Number((visSum / keyPts.length).toFixed(2));

  const headTiltDeg =
    leftEye && rightEye && (leftEye.visibility ?? 0) > 0.4 && (rightEye.visibility ?? 0) > 0.4
      ? Math.abs(slopeDeg(rightEye, leftEye))
      : null;

  const shoulderTiltDeg =
    leftShoulder && rightShoulder && (leftShoulder.visibility ?? 0) > 0.4 && (rightShoulder.visibility ?? 0) > 0.4
      ? Math.abs(slopeDeg(rightShoulder, leftShoulder))
      : null;

  const frontKneeAngleDeg =
    leftHip && leftKnee && leftAnkle && (leftKnee.visibility ?? 0) > 0.4
      ? angleBetweenThreePoints(leftHip, leftKnee, leftAnkle)
      : null;

  const leadElbowAngleDeg =
    leftShoulder && leftElbow && leftWrist && (leftElbow.visibility ?? 0) > 0.4
      ? angleBetweenThreePoints(leftShoulder, leftElbow, leftWrist)
      : null;

  const shoulderW =
    leftShoulder && rightShoulder ? Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y) : 0;
  const ankleW = leftAnkle && rightAnkle ? Math.hypot(leftAnkle.x - rightAnkle.x, leftAnkle.y - rightAnkle.y) : 0;
  const stanceWidthRatio = shoulderW > 0.02 ? Number((ankleW / shoulderW).toFixed(2)) : null;

  const midHipX = leftHip && rightHip ? (leftHip.x + rightHip.x) / 2 : null;
  const midAnkleX = leftAnkle && rightAnkle ? (leftAnkle.x + rightAnkle.x) / 2 : null;
  const centerOfMassOffset =
    midHipX !== null && midAnkleX !== null ? Number(Math.abs(midHipX - midAnkleX).toFixed(3)) : null;

  return {
    avgVisibility,
    metrics: {
      headTiltDeg,
      shoulderTiltDeg,
      frontKneeAngleDeg,
      leadElbowAngleDeg,
      stanceWidthRatio,
      centerOfMassOffset,
    },
  };
}

async function seekVideoTo(video: HTMLVideoElement, targetTime: number, signal?: AbortSignal): Promise<void> {
  throwIfAborted(signal);

  if (Math.abs(video.currentTime - targetTime) < 0.02 && video.readyState >= 2) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      signal?.removeEventListener('abort', onAbort);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const onSeeked = () => finish();
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Video decoding error while seeking frames.'));
    };
    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new DOMException('Analysis cancelled.', 'AbortError'));
    };

    // Bounded seek fallback: if a frame seek stalls without firing seeked, proceed rather than hanging forever
    const timer = window.setTimeout(() => {
      finish();
    }, SEEK_TIMEOUT_MS);

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      video.currentTime = targetTime;
    } catch {
      finish();
    }
  });
}

async function resolveVideoDuration(video: HTMLVideoElement, signal?: AbortSignal): Promise<number> {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    return video.duration;
  }

  // Recorded MediaRecorder WebM blobs often report duration === Infinity until sought near the end
  await seekVideoTo(video, 1e6, signal);
  if (Number.isFinite(video.duration) && video.duration > 0) {
    const resolved = video.duration;
    await seekVideoTo(video, 0, signal);
    return resolved;
  }

  await seekVideoTo(video, 0, signal);
  return 4;
}

export async function analyzeVideoWithMediaPipe(
  videoUrl: string,
  onProgress?: (pct: number, stage: string) => void,
  signal?: AbortSignal
): Promise<{ frames: PoseFrameTelemetry[]; poseSummary: PoseAggregateSummary; durationSec: number }> {
  throwIfAborted(signal);
  onProgress?.(12, 'Preparing video & decoding metadata...');

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  if (!videoUrl.startsWith('blob:') && !videoUrl.startsWith('data:')) {
    video.crossOrigin = 'anonymous';
  }

  try {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        window.clearTimeout(timer);
        video.removeEventListener('loadeddata', onReady);
        video.removeEventListener('canplay', onReady);
        video.removeEventListener('loadedmetadata', onMeta);
        video.removeEventListener('error', onError);
        signal?.removeEventListener('abort', onAbort);
      };

      const onMeta = () => {
        if (video.readyState >= 2) {
          onReady();
        }
      };

      const onReady = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const onError = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Could not decode this video format in your browser. Please try an MP4, MOV, or WebM clip.'));
      };

      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new DOMException('Analysis cancelled.', 'AbortError'));
      };

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Timed out while decoding video metadata. Please try a shorter MP4 or WebM video.'));
      }, METADATA_TIMEOUT_MS);

      video.addEventListener('loadedmetadata', onMeta);
      video.addEventListener('loadeddata', onReady);
      video.addEventListener('canplay', onReady);
      video.addEventListener('error', onError);
      signal?.addEventListener('abort', onAbort, { once: true });

      video.src = videoUrl;
      video.load();
    });

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('This file does not contain a readable video track. Please upload a valid cricket video clip.');
    }

    onProgress?.(20, 'Inspecting video duration & dimensions...');
    const durationSec = await resolveVideoDuration(video, signal);

    // Resize efficiently (max 480px wide) to avoid oversized payloads while preserving body posture clarity
    const targetWidth = Math.min(480, video.videoWidth || 480);
    const scale = targetWidth / (video.videoWidth || 480);
    const targetHeight = Math.max(180, Math.round((video.videoHeight || 360) * scale));

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = targetWidth;
    rawCanvas.height = targetHeight;
    const rawCtx = rawCanvas.getContext('2d');
    if (!rawCtx) {
      throw new Error('Browser canvas context is unavailable for frame extraction.');
    }

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.width = targetWidth;
    overlayCanvas.height = targetHeight;
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!overlayCtx) {
      throw new Error('Browser overlay canvas context is unavailable.');
    }

    const frameCount = 6;
    const safeSpan = Math.max(0.2, durationSec);
    const timestamps = Array.from({ length: frameCount }, (_, i) => {
      const rawTs = ((i + 0.5) / frameCount) * safeSpan;
      const clamped = Math.min(Math.max(0.02, safeSpan - 0.04), Math.max(0.02, rawTs));
      return Number(clamped.toFixed(2));
    });

    // Stage 3: Extract representative frames (25% -> 50%)
    const extractedRaw: Array<{
      frameIndex: number;
      timestampSec: number;
      imageDataUrl: string;
      imgBitmapCanvas: HTMLCanvasElement;
    }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      throwIfAborted(signal);
      const ts = timestamps[i];
      onProgress?.(
        25 + Math.round(((i + 1) / timestamps.length) * 25),
        `Extracting representative frame ${i + 1} of ${frameCount}...`
      );

      await seekVideoTo(video, ts, signal);
      rawCtx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const imageDataUrl = rawCanvas.toDataURL('image/jpeg', 0.74);

      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = targetWidth;
      snapCanvas.height = targetHeight;
      const snapCtx = snapCanvas.getContext('2d');
      if (snapCtx) {
        snapCtx.drawImage(rawCanvas, 0, 0);
      }

      extractedRaw.push({
        frameIndex: i + 1,
        timestampSec: ts,
        imageDataUrl,
        imgBitmapCanvas: snapCanvas,
      });
    }

    // Stage 4: Pose Estimation (50% -> 70%)
    onProgress?.(52, 'Loading MediaPipe Pose Landmarker...');
    const landmarker = await getPoseLandmarker(signal);

    const frames: PoseFrameTelemetry[] = [];

    for (let i = 0; i < extractedRaw.length; i++) {
      throwIfAborted(signal);
      const item = extractedRaw[i];
      onProgress?.(
        54 + Math.round(((i + 1) / extractedRaw.length) * 16),
        landmarker
          ? `Estimating pose landmarks (${i + 1} of ${extractedRaw.length})...`
          : `Finalizing frame evidence (${i + 1} of ${extractedRaw.length})...`
      );

      overlayCtx.clearRect(0, 0, targetWidth, targetHeight);
      overlayCtx.drawImage(item.imgBitmapCanvas, 0, 0, targetWidth, targetHeight);

      let poseDetected = false;
      let avgVisibility = 0;
      let metrics: PoseFrameTelemetry['metrics'] = {
        headTiltDeg: null,
        shoulderTiltDeg: null,
        frontKneeAngleDeg: null,
        leadElbowAngleDeg: null,
        stanceWidthRatio: null,
        centerOfMassOffset: null,
      };

      if (landmarker) {
        try {
          const result = landmarker.detect(item.imgBitmapCanvas);
          if (result.landmarks && result.landmarks.length > 0) {
            const lm = result.landmarks[0];
            poseDetected = true;
            const computed = computeFrameMetrics(lm);
            avgVisibility = computed.avgVisibility;
            metrics = computed.metrics;
            drawPoseOverlay(overlayCtx, lm, targetWidth, targetHeight);
          }
        } catch (err) {
          console.warn('Pose detection skipped on frame', item.frameIndex, err);
        }
      }

      const annotatedDataUrl = poseDetected ? overlayCanvas.toDataURL('image/jpeg', 0.74) : item.imageDataUrl;
      frames.push({
        frameIndex: item.frameIndex,
        timestampSec: item.timestampSec,
        imageDataUrl: item.imageDataUrl,
        annotatedDataUrl,
        poseDetected,
        avgVisibility,
        metrics,
      });
    }

    const detectedFrames = frames.filter((f) => f.poseDetected);
    const avgVis =
      detectedFrames.length > 0
        ? Number((detectedFrames.reduce((a, b) => a + b.avgVisibility, 0) / detectedFrames.length).toFixed(2))
        : 0;

    const headTilts = detectedFrames.map((f) => f.metrics.headTiltDeg).filter((v): v is number => v !== null);
    const kneeAngles = detectedFrames.map((f) => f.metrics.frontKneeAngleDeg).filter((v): v is number => v !== null);
    const shoulderTilts = detectedFrames.map((f) => f.metrics.shoulderTiltDeg).filter((v): v is number => v !== null);
    const elbowAngles = detectedFrames.map((f) => f.metrics.leadElbowAngleDeg).filter((v): v is number => v !== null);
    const comOffsets = detectedFrames.map((f) => f.metrics.centerOfMassOffset).filter((v): v is number => v !== null);

    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

    const headDelta =
      headTilts.length >= 2 ? Math.max(...headTilts) - Math.min(...headTilts) : headTilts.length === 1 ? headTilts[0] : null;

    const avgCom = comOffsets.length ? comOffsets.reduce((a, b) => a + b, 0) / comOffsets.length : null;
    const balanceSymmetryNote = !landmarker
      ? 'MediaPipe pose model unavailable during this session; visual keyframes were sent directly for AI review without synthetic pose landmarks.'
      : avgCom === null
        ? 'Pose landmarks insufficient to measure center-of-mass base offset.'
        : avgCom < 0.08
          ? 'Center of mass remained consistently centered over your foot base.'
          : 'Moderate lateral hip-to-ankle weight shift observed across movement frames.';

    return {
      durationSec,
      frames,
      poseSummary: {
        framesAnalyzed: frames.length,
        framesWithPose: detectedFrames.length,
        avgVisibility: avgVis,
        headStabilityDeltaDeg: headDelta,
        avgFrontKneeAngleDeg: avg(kneeAngles),
        avgShoulderTiltDeg: avg(shoulderTilts),
        avgLeadElbowAngleDeg: avg(elbowAngles),
        balanceSymmetryNote,
      },
    };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}
