import React, { useState } from 'react';
import { Camera, Check, Trash2, X } from 'lucide-react';
import {
  BallType,
  BowlingStyle,
  CricketRole,
  EnvironmentType,
  Handedness,
  LanguageChoice,
  PlayerProfile,
  SkillLevel,
} from '../types';
import { CRICKIFY_IMAGES } from '../utils/assets';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';

interface OnboardingModalProps {
  profile: PlayerProfile;
  authUserId?: string | null;
  authEmail?: string;
  googlePhotoUrl?: string;
  localAvatarUrl?: string | null;
  onUpdateLocalAvatar?: (dataUrl: string | null) => void;
  onSave: (updated: PlayerProfile) => void;
  onClose?: () => void;
}

const GOAL_OPTIONS = [
  'Improve Batting Timing',
  'Master Cover & Straight Drives',
  'Play Fast Bowling Confidently',
  'Bowl Accurate Yorkers',
  'Develop Swing or Spin',
  'Sharpen Catching & Throwing',
  'Build Match Stamina & Agility',
  'Dominate Turf / Box Cricket',
];

const EQUIPMENT_OPTIONS = [
  'Cricket Bat',
  'Leather Balls',
  'Tennis Balls',
  'Cones / Markers',
  'Stumps',
  'Wall Space',
  'Resistance Band',
  'Agility Ladder',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  profile,
  authUserId = null,
  authEmail,
  googlePhotoUrl,
  localAvatarUrl,
  onUpdateLocalAvatar,
  onSave,
  onClose,
}) => {
  const [form, setForm] = useState<PlayerProfile>({ ...profile });
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
    }));
  };

  const toggleEquipment = (item: string) => {
    setForm((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(item)
        ? prev.equipment.filter((e) => e !== item)
        : [...prev.equipment, item],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, onboardingCompleted: true });
  };

  const effectiveAvatar =
    localAvatarUrl || form.avatarUrl || googlePhotoUrl || CRICKIFY_IMAGES.playerAvatar;
  const hasCustomPhoto = Boolean(
    localAvatarUrl || (form.avatarUrl && form.avatarUrl !== googlePhotoUrl && form.avatarUrl !== CRICKIFY_IMAGES.playerAvatar)
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#05140D]/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-gradient-to-b from-[#E1F4E5] to-[#D1ECD7] rounded-3xl border border-[#B7F34A]/45 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B3020] via-[#134B33] to-[#1D5B39] text-white px-6 py-5 flex items-center justify-between gap-4 border-b border-[#B7F34A]/25">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={effectiveAvatar}
              alt="Player portrait"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#B7F34A] shrink-0 bg-[#0B3020]"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#B7F34A] mb-0.5">
                Player Profile &amp; Academy Personalisation
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white truncate">
                Your CRICKIFY AI Player Profile
              </h2>
              {authEmail && (
                <div className="text-[11px] text-white/85 truncate">Signed in as {authEmail}</div>
              )}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile setup"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 md:p-8 space-y-6">
          {/* Player Profile Photo Upload & Crop */}
          <div className="bg-[#ECFAEE] rounded-2xl border border-[#087F55]/25 p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <img
                  src={effectiveAvatar}
                  alt="Current profile portrait"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#69A83F] bg-[#EDF3E8]"
                />
                <div>
                  <div className="text-sm font-bold text-[#17251A]">Player Profile Photo</div>
                  <div className="text-xs text-[#68766A]">
                    {hasCustomPhoto
                      ? localAvatarUrl
                        ? 'Custom cropped photo (device preview)'
                        : 'Custom uploaded photo'
                      : googlePhotoUrl
                        ? 'Using your Google account photo automatically'
                        : 'Default CRICKIFY athlete portrait'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPhoto((v) => !v)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#EDF3E8] hover:bg-[#dfe9d6] text-[#24552E] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-4 h-4 text-[#397B32]" />
                  <span>{editingPhoto ? 'Hide Photo Editor' : 'Edit Photo'}</span>
                </button>
                {hasCustomPhoto && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateLocalAvatar?.(null);
                      setForm((prev) => ({ ...prev, avatarUrl: googlePhotoUrl || '' }));
                      setPhotoNotice(
                        googlePhotoUrl
                          ? 'Custom photo removed. Restored your Google account photo.'
                          : 'Custom photo removed.'
                      );
                    }}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#ECFAEE] border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Custom Photo</span>
                  </button>
                )}
              </div>
            </div>

            {photoNotice && (
              <div className="p-3 rounded-xl bg-[#EDF3E8] border border-[#397B32]/20 text-xs text-[#24552E]">
                {photoNotice}
              </div>
            )}

            {editingPhoto && (
              <ProfilePhotoEditor
                authUserId={authUserId}
                currentPhotoUrl={effectiveAvatar}
                googlePhotoUrl={googlePhotoUrl}
                hasCustomPhoto={hasCustomPhoto}
                onSavePhoto={(nextUrl, isLocalOnly) => {
                  if (isLocalOnly) {
                    onUpdateLocalAvatar?.(nextUrl);
                    setPhotoNotice(
                      authUserId
                        ? 'Cropped photo saved on this device. Cloud Storage is not yet enabled on this Starter Firebase project, so your Google photo stays synced in Firestore.'
                        : 'Cropped photo saved locally. Sign in with Google anytime to sync your profile.'
                    );
                  } else {
                    onUpdateLocalAvatar?.(null);
                    setForm((prev) => ({ ...prev, avatarUrl: nextUrl }));
                    setPhotoNotice('Profile photo uploaded and synced to your CRICKIFY account.');
                  }
                  setEditingPhoto(false);
                }}
                onRemoveCustomPhoto={() => {
                  onUpdateLocalAvatar?.(null);
                  setForm((prev) => ({ ...prev, avatarUrl: googlePhotoUrl || '' }));
                  setEditingPhoto(false);
                  setPhotoNotice(
                    googlePhotoUrl ? 'Restored your Google account photo.' : 'Custom photo removed.'
                  );
                }}
                onCancel={() => setEditingPhoto(false)}
              />
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Display Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Arjun Kumar"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A] focus:outline-none focus:ring-2 focus:ring-[#397B32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Age Group</label>
              <select
                value={form.ageGroup}
                onChange={(e) => setForm({ ...form, ageGroup: e.target.value as PlayerProfile['ageGroup'] })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                {['Under-14', '14-18', '19-25', '26-35', '35+'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Cricket Experience</label>
              <input
                type="text"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                placeholder="e.g. Complete beginner / 2 years club"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Skill Level</label>
              <select
                value={form.skillLevel}
                onChange={(e) => setForm({ ...form, skillLevel: e.target.value as SkillLevel })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                {['Beginner', 'Intermediate', 'Advanced', 'Competitive'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Playing Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as CricketRole })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                {['Batter', 'Fast Bowler', 'Spin Bowler', 'All-Rounder', 'Wicketkeeper'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Batting Hand</label>
              <select
                value={form.battingHand}
                onChange={(e) => setForm({ ...form, battingHand: e.target.value as Handedness })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                <option value="Right-handed">Right-handed</option>
                <option value="Left-handed">Left-handed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Bowling Style</label>
              <select
                value={form.bowlingStyle}
                onChange={(e) => setForm({ ...form, bowlingStyle: e.target.value as BowlingStyle })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                {['Fast', 'Medium Pace', 'Off-Spin', 'Leg-Spin', 'None'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Ball Type</label>
              <select
                value={form.ballType}
                onChange={(e) => setForm({ ...form, ballType: e.target.value as BallType })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                <option value="Leather Ball">Leather Ball</option>
                <option value="Tennis Ball">Tennis Ball</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Primary Environment</label>
              <select
                value={form.environment}
                onChange={(e) => setForm({ ...form, environment: e.target.value as EnvironmentType })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                <option value="Regular Cricket">Regular Cricket</option>
                <option value="Turf / Box Cricket">Turf / Box Cricket</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">Preferred Coaching Language</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as LanguageChoice })}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm text-[#17251A]"
              >
                <option value="English">English</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">
                Daily Practice Time: <span className="font-mono text-[#397B32] tabular-nums">{form.dailyMinutes} min</span>
              </label>
              <input
                type="range"
                min={15}
                max={120}
                step={5}
                value={form.dailyMinutes}
                onChange={(e) => setForm({ ...form, dailyMinutes: Number(e.target.value) })}
                className="w-full accent-[#397B32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#17251A] mb-1.5">
                Training Days Per Week: <span className="font-mono text-[#397B32] tabular-nums">{form.trainingDaysPerWeek} days</span>
              </label>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={form.trainingDaysPerWeek}
                onChange={(e) => setForm({ ...form, trainingDaysPerWeek: Number(e.target.value) })}
                className="w-full accent-[#397B32]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-2">Main Improvement Goals</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((g) => {
                const active = form.goals.includes(g);
                return (
                  <button
                    type="button"
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`flex items-center justify-between min-h-[42px] px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors text-left ${
                      active
                        ? 'bg-[#397B32] text-white border-[#397B32]'
                        : 'bg-[#ECFAEE] text-[#17251A] border-[#17251A]/12 hover:bg-[#EDF3E8]'
                    }`}
                  >
                    <span>{g}</span>
                    {active && <Check className="w-3.5 h-3.5 shrink-0 text-[#A8D94E]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#17251A] mb-2">Available Equipment</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = form.equipment.includes(eq);
                return (
                  <button
                    type="button"
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors text-left ${
                      active
                        ? 'bg-[#24552E] text-[#A8D94E] border-[#24552E]'
                        : 'bg-[#ECFAEE] text-[#17251A] border-[#17251A]/12 hover:bg-[#EDF3E8]'
                    }`}
                  >
                    {eq}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#17251A]/12">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#17251A]/15 bg-[#ECFAEE] text-sm font-semibold text-[#17251A] hover:bg-[#EDF3E8]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2.5 rounded-xl bg-[#397B32] text-white text-sm font-bold hover:bg-[#24552E] transition-colors"
            >
              Save Profile &amp; Personalise Academy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
