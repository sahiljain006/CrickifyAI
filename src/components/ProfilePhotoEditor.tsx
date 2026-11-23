import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Move, RotateCcw, Trash2, Upload, X, ZoomIn } from 'lucide-react';
import { uploadProfilePhotoToStorage } from '../lib/firebase';

interface ProfilePhotoEditorProps {
  authUserId: string | null;
  currentPhotoUrl: string;
  googlePhotoUrl?: string;
  hasCustomPhoto: boolean;
  onSavePhoto: (nextAvatarUrl: string, isLocalPreviewOnly: boolean) => void;
  onRemoveCustomPhoto: () => void;
  onCancel: () => void;
}

const PREVIEW_SIZE = 224;
const EXPORT_SIZE = 256;

export const ProfilePhotoEditor: React.FC<ProfilePhotoEditorProps> = ({
  authUserId,
  currentPhotoUrl,
  googlePhotoUrl,
  hasCustomPhoto,
  onSavePhoto,
  onRemoveCustomPhoto,
  onCancel,
}) => {
  const [selectedDataUrl, setSelectedDataUrl] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1.15);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; origX: number; origY: number } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    setStatusMessage(null);
  }, [selectedDataUrl]);

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please choose a JPG, PNG, or WebP image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file is larger than 10 MB. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        setErrorMessage('Could not read the selected image.');
        return;
      }
      const probe = new Image();
      probe.onload = () => {
        setImgDimensions({ w: probe.naturalWidth, h: probe.naturalHeight });
        setSelectedDataUrl(result);
        setZoom(1.15);
        setOffset({ x: 0, y: 0 });
      };
      probe.onerror = () => {
        setErrorMessage('The selected file could not be decoded as an image.');
      };
      probe.src = result;
    };
    reader.readAsDataURL(file);
  };

  const clampOffset = (nx: number, ny: number, nextZoom: number) => {
    const maxShift = Math.max(40, (PREVIEW_SIZE * (nextZoom - 1)) / 2 + 48);
    return {
      x: Math.max(-maxShift, Math.min(maxShift, nx)),
      y: Math.max(-maxShift, Math.min(maxShift, ny)),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedDataUrl) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(clampOffset(dragStartRef.current.origX + dx, dragStartRef.current.origY + dy, zoom));
  };

  const handlePointerUp = () => {
    setDragging(false);
    dragStartRef.current = null;
  };

  const renderCroppedCanvas = (): HTMLCanvasElement | null => {
    const imgEl = imgRef.current;
    if (!imgEl || !imgDimensions) return null;

    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#EDF3E8';
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);

    const aspect = imgDimensions.w / Math.max(1, imgDimensions.h);
    let drawW = EXPORT_SIZE;
    let drawH = EXPORT_SIZE;
    if (aspect >= 1) {
      drawH = EXPORT_SIZE;
      drawW = EXPORT_SIZE * aspect;
    } else {
      drawW = EXPORT_SIZE;
      drawH = EXPORT_SIZE / aspect;
    }

    drawW *= zoom;
    drawH *= zoom;

    const scaleRatio = EXPORT_SIZE / PREVIEW_SIZE;
    const drawX = (EXPORT_SIZE - drawW) / 2 + offset.x * scaleRatio;
    const drawY = (EXPORT_SIZE - drawH) / 2 + offset.y * scaleRatio;

    ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
    return canvas;
  };

  const handleSaveCroppedPhoto = async () => {
    const canvas = renderCroppedCanvas();
    if (!canvas) {
      setErrorMessage('Please pick a photo before saving.');
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);
    setUploading(true);
    setUploadPct(10);

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
      if (!blob) {
        throw new Error('Could not export cropped photo.');
      }
      const localPreviewDataUrl = canvas.toDataURL('image/jpeg', 0.82);

      if (authUserId) {
        const result = await uploadProfilePhotoToStorage(authUserId, blob, (pct) => setUploadPct(pct));
        if (result.downloadUrl) {
          setUploadPct(100);
          onSavePhoto(result.downloadUrl, false);
          return;
        }

        // Honest fallback: keep cropped preview locally in browser storage only, never push base64 into Firestore
        setStatusMessage(
          result.error ||
            'Cloud storage upload is unavailable on this Starter Firebase project. Kept locally on this device only.'
        );
        onSavePhoto(localPreviewDataUrl, true);
      } else {
        setUploadPct(100);
        onSavePhoto(localPreviewDataUrl, true);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save cropped photo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-[#F7FAF3] rounded-2xl border border-[#397B32]/25 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#17251A]">
          <Camera className="w-4 h-4 text-[#397B32]" />
          <span>Edit Player Profile Photo</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close photo editor"
          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#ECFAEE] border border-[#17251A]/10 text-[#68766A] hover:text-[#17251A]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Circular Crop Frame */}
        <div className="space-y-2 shrink-0 flex flex-col items-center">
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            className={`relative rounded-full overflow-hidden border-4 border-[#397B32] bg-[#EDF3E8] shadow-inner select-none ${
              selectedDataUrl ? 'cursor-grab active:cursor-grabbing touch-none' : ''
            }`}
          >
            {selectedDataUrl && imgDimensions ? (
              <img
                ref={imgRef}
                src={selectedDataUrl}
                alt="Profile crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  maxWidth: 'none',
                  width:
                    imgDimensions.w >= imgDimensions.h
                      ? `${PREVIEW_SIZE * (imgDimensions.w / imgDimensions.h) * zoom}px`
                      : `${PREVIEW_SIZE * zoom}px`,
                  height:
                    imgDimensions.w >= imgDimensions.h
                      ? `${PREVIEW_SIZE * zoom}px`
                      : `${PREVIEW_SIZE * (imgDimensions.h / imgDimensions.w) * zoom}px`,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            ) : (
              <img
                src={currentPhotoUrl}
                alt="Current profile portrait"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            )}

            {selectedDataUrl && (
              <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-inset ring-white/60" />
            )}
          </div>

          {selectedDataUrl && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#68766A]">
              <Move className="w-3.5 h-3.5 text-[#397B32]" />
              <span>Drag photo to reposition</span>
            </div>
          )}
        </div>

        {/* Upload & Crop Controls */}
        <div className="flex-1 w-full space-y-3.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFilePicked}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#397B32] text-white text-xs font-bold hover:bg-[#24552E] inline-flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>{selectedDataUrl ? 'Choose Different Photo' : 'Upload Photo (JPG / PNG / WebP)'}</span>
            </button>

            {(hasCustomPhoto || selectedDataUrl) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDataUrl(null);
                  setImgDimensions(null);
                  onRemoveCustomPhoto();
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#ECFAEE] border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{googlePhotoUrl ? 'Restore Google Photo' : 'Remove Custom Photo'}</span>
              </button>
            )}
          </div>

          {selectedDataUrl && (
            <div className="bg-[#ECFAEE] rounded-xl border border-[#397B32]/15 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#17251A]">
                <span className="inline-flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-[#397B32]" />
                  Zoom
                </span>
                <span className="font-mono text-[#397B32] tabular-nums">{zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={1}
                max={2.6}
                step={0.05}
                value={zoom}
                onChange={(e) => {
                  const z = Number(e.target.value);
                  setZoom(z);
                  setOffset((prev) => clampOffset(prev.x, prev.y, z));
                }}
                className="w-full accent-[#397B32]"
              />
              <button
                type="button"
                onClick={() => {
                  setZoom(1.15);
                  setOffset({ x: 0, y: 0 });
                }}
                className="text-[11px] font-semibold text-[#397B32] hover:underline inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Position
              </button>
            </div>
          )}

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#397B32]">
                <span>Saving photo...</span>
                <span className="font-mono tabular-nums">{uploadPct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#ECFAEE] overflow-hidden border border-[#397B32]/15">
                <div
                  className="h-full bg-gradient-to-r from-[#397B32] to-[#A8D94E] transition-all duration-150"
                  style={{ width: `${uploadPct}%` }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{errorMessage}</div>
          )}

          {statusMessage && (
            <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FF941F]/35 text-xs text-[#7C2D12]">
              {statusMessage}
            </div>
          )}

          <p className="text-[11px] text-[#68766A] leading-relaxed">
            {googlePhotoUrl
              ? 'Your Google account photo is used automatically by default. Upload a custom JPG, PNG, or WebP photo anytime to crop and frame it cleanly.'
              : 'Upload a JPG, PNG, or WebP portrait to crop and preview your CRICKIFY player badge.'}
          </p>

          {selectedDataUrl && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                disabled={uploading}
                onClick={handleSaveCroppedPhoto}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#A8D94E] hover:bg-[#b8e465] text-[#17251A] text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Save Cropped Photo</span>
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={onCancel}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-[#ECFAEE] border border-[#17251A]/15 text-xs font-semibold text-[#17251A] hover:bg-[#EDF3E8]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
