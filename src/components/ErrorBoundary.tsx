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
      <div className="min-h-screen bg-[#F7FAF3] flex items-center justify-center p-6 text-[#17251A]">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-[#397B32]/20 p-7 shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#FF941F] flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#17251A]">
            {this.state.isQuotaError ? 'Firestore Daily Quota Reached' : 'Something Needs Attention'}
          </h2>
          <p className="text-sm text-[#68766A] leading-relaxed">
            {this.state.isQuotaError
              ? 'Your Firebase Firestore free-tier daily quota has been reached. Quota resets tomorrow, or you can review your Spark/Blaze usage in the Firebase Console.'
              : this.state.message}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#397B32] text-white text-sm font-bold hover:bg-[#24552E] transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reload CRICKIFY
          </button>
        </div>
      </div>
    );
  }
}
