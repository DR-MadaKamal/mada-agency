import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-12 min-h-[400px] text-[var(--color-text-secondary)]">
          <AlertTriangle className="w-10 h-10 text-rose-400 mb-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400/80 mb-2">Studio Core Error</span>
          <p className="text-xs text-white/30 mb-4 text-center max-w-md">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
          >
            <RefreshCcw className="w-3 h-3 inline mr-2" />
            Reload Studio
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
