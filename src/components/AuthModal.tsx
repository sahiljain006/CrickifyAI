import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, Copy, Info, Loader2, X } from 'lucide-react';
import { isFirebaseConfigured, signInWithGoogle } from '../lib/firebase';
import { CRICKIFY_IMAGES } from '../utils/assets';

interface AuthModalProps {
  promptMessage?: string | null;
  onContinueAsGuest: () => void;
  onAuthSuccess: () => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  promptMessage,
  onContinueAsGuest,
  onAuthSuccess,
  onClose,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unauthorizedHostname, setUnauthorizedHostname] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setUnauthorizedHostname(null);
    setCopiedDomain(false);
    setLoadingGoogle(true);
    try {
      const { user, error, errorCode, unauthorizedHostname: detectedHostname } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error);
        if (errorCode === 'auth/unauthorized-domain' && detectedHostname) {
          setUnauthorizedHostname(detectedHostname);
        }
      } else if (user) {
        onAuthSuccess();
      }
    } catch {
      setErrorMsg('Unable to complete Google sign-in. Please try again or continue as Guest.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleCopyHostname = async () => {
    if (!unauthorizedHostname) return;
    try {
      await navigator.clipboard.writeText(unauthorizedHostname);
      setCopiedDomain(true);
      window.setTimeout(() => setCopiedDomain(false), 2000);
    } catch {
      setCopiedDomain(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-3 sm:p-6">
      {/* Cricket-ground backdrop */}
      <div className="fixed inset-0">
        <img
          src={CRICKIFY_IMAGES.sunlitOutfieldBg}
          alt="Sunlit green cricket outfield"
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, rgba(36, 85, 46, 0.55) 0%, rgba(57, 123, 50, 0.45) 45%, rgba(247, 250, 243, 0.72) 100%)',
          }}
        />
      </div>

      {/* Clean White Rounded Sports-App Panel */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-[#397B32]/15 shadow-2xl overflow-hidden my-auto">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close login panel"
            className="absolute top-4 right-4 z-20 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-[#EDF3E8] text-[#17251A] hover:bg-[#dfe8d6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Sunlit Header Strip */}
        <div className="bg-gradient-to-br from-[#69A83F] via-[#397B32] to-[#24552E] text-white px-6 pt-7 pb-6">
          <div className="flex items-center gap-2.5 mb-4">
            <svg viewBox="0 0 36 36" className="w-9 h-9 shrink-0" aria-hidden="true">
              <rect width="36" height="36" rx="10" fill="#FFFFFF" />
              <line x1="13" y1="9" x2="13" y2="27" stroke="#24552E" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="18" y1="9" x2="18" y2="27" stroke="#24552E" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="23" y1="9" x2="23" y2="27" stroke="#24552E" strokeWidth="2.4" strokeLinecap="round" />
              <line x1="12" y1="9" x2="24" y2="9" stroke="#FF941F" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M7 22 Q18 11 29 18" fill="none" stroke="#69A83F" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span className="font-display text-2xl font-bold tracking-wider text-white">CRICKIFY</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white">
            WELCOME TO CRICKIFY
          </h2>
          <p className="text-sm text-white/90 mt-1 leading-relaxed">
            Your game. Your home. Your AI coach. Learn, analyse, play Batting Challenge, and track your cricket journey.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {promptMessage && (
            <div className="p-3.5 rounded-2xl bg-[#EDF3E8] border border-[#397B32]/20 text-xs text-[#17251A] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#397B32] shrink-0 mt-0.5" />
              <span>{promptMessage}</span>
            </div>
          )}

          {!isFirebaseConfigured && (
            <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FF941F]/35 text-[11px] text-[#7C2D12] leading-relaxed">
              <strong>Firebase Setup Pending:</strong> Complete Firebase project provisioning to enable live Google Sign-In. You can explore as a Guest right now.
            </div>
          )}

          {/* Primary Google Sign-In & Guest Access */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-white border-2 border-[#397B32]/25 hover:border-[#397B32] hover:bg-[#F7FAF3] text-[#17251A] text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-colors disabled:opacity-60"
            >
              {loadingGoogle ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#397B32]" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#EDF3E8] hover:bg-[#dfe9d6] text-[#24552E] text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {unauthorizedHostname ? (
            <div className="p-3.5 rounded-2xl bg-[#FFF7ED] border border-[#FF941F]/40 text-xs text-[#7C2D12] space-y-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#9A3412]">Preview Domain Not Authorized in Firebase</p>
                  <p className="leading-relaxed">
                    Add this current preview hostname to <strong>Firebase Authentication → Settings → Authorized domains</strong>, or choose <strong>Continue as Guest</strong> above.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-[#FF941F]/30 px-2.5 py-2">
                <code className="text-[11px] font-mono text-[#17251A] truncate select-all">
                  {unauthorizedHostname}
                </code>
                <button
                  type="button"
                  onClick={handleCopyHostname}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EDF3E8] hover:bg-[#dfe9d6] text-[#24552E] text-[11px] font-bold transition-colors"
                >
                  {copiedDomain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#397B32]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 leading-relaxed">
              {errorMsg}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
