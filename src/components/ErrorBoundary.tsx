import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '', isQuotaError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'An unexpected error occurred.';
    let friendly = raw;
    let isQuotaError = raw.toLowerCase().includes('quota exceeded');

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.error === 'string') {
        friendly = parsed.error;
        isQuotaError = parsed.error.toLowerCase().includes('quota exceeded');
      }
    } catch {
      // plain error string
    }

    return {
      hasError: true,
      message: friendly,
      isQuotaError,
    };
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#081F16] flex items-center justify-center p-6 text-[#102419]">
        <div className="max-w-lg w-full bg-gradient-to-b from-[#E1F4E5] to-[#D1ECD7] rounded-3xl border border-[#B7F34A]/40 p-7 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FDE7BE] text-[#D96B00] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#102419]">
            {this.state.isQuotaError ? 'Firestore Daily Quota Reached' : 'Something Needs Attention'}
          </h2>
          <p className="text-sm text-[#2B4234] leading-relaxed">
            {this.state.isQuotaError
              ? 'Your Firebase Firestore free-tier daily quota has been reached. Quota resets tomorrow, or you can review your Spark/Blaze usage in the Firebase Console.'
              : this.state.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#087F55] text-white text-sm font-bold hover:bg-[#103B2A] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reload CRICKIFY AI
          </button>
        </div>
      </div>
    );
  }
}
