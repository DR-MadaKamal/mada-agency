import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Bug, RefreshCcw, CheckCircle, Trash2, Filter, BarChart3, Wifi, HardDrive, Cpu, User, HelpCircle, Download, CheckSquare } from 'lucide-react';
import { ErrorService } from '../lib/errorService';
import type { LoggedError, ErrorSeverity, ErrorSource } from '../lib/errorService';

const SEVERITY_CONFIG: Record<ErrorSeverity, { color: string; bg: string; label: string }> = {
  low: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Low' },
  medium: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', label: 'Medium' },
  high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'High' },
  critical: { color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Critical' },
};

const SOURCE_ICONS: Record<ErrorSource, any> = {
  ai: Bug,
  storage: HardDrive,
  network: Wifi,
  render: Cpu,
  user_input: User,
  unknown: HelpCircle,
};

interface ErrorDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErrorDashboard({ isOpen, onClose }: ErrorDashboardProps) {
  const [errors, setErrors] = useState<LoggedError[]>(ErrorService.getAll());

  const loadPersistedFilter = useCallback(<T,>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  }, []);

  const [filterSource, setFilterSource] = useState<ErrorSource | 'all'>(() => loadPersistedFilter('mada_ef_src', 'all'));
  const [filterSeverity, setFilterSeverity] = useState<ErrorSeverity | 'all'>(() => loadPersistedFilter('mada_ef_sev', 'all'));
  const [filterResolved, setFilterResolved] = useState<'all' | 'unresolved' | 'resolved'>(() => loadPersistedFilter('mada_ef_res', 'unresolved'));
  const [showMetrics, setShowMetrics] = useState(() => loadPersistedFilter('mada_ef_met', false));

  useEffect(() => {
    const unsub = ErrorService.subscribe(setErrors);
    ErrorService.init();
    setErrors(ErrorService.getAll());
    return unsub;
  }, []);

  useEffect(() => {
    localStorage.setItem('mada_ef_src', JSON.stringify(filterSource));
  }, [filterSource]);
  useEffect(() => {
    localStorage.setItem('mada_ef_sev', JSON.stringify(filterSeverity));
  }, [filterSeverity]);
  useEffect(() => {
    localStorage.setItem('mada_ef_res', JSON.stringify(filterResolved));
  }, [filterResolved]);
  useEffect(() => {
    localStorage.setItem('mada_ef_met', JSON.stringify(showMetrics));
  }, [showMetrics]);

  const filtered = useMemo(() => {
    let list = errors;
    if (filterSource !== 'all') list = list.filter(e => e.source === filterSource);
    if (filterSeverity !== 'all') list = list.filter(e => e.severity === filterSeverity);
    if (filterResolved === 'unresolved') list = list.filter(e => !e.resolved);
    else if (filterResolved === 'resolved') list = list.filter(e => e.resolved);
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [errors, filterSource, filterSeverity, filterResolved]);

  const metrics = useMemo(() => ErrorService.getMetrics(), [errors]);

  const sources: ErrorSource[] = ['ai', 'network', 'storage', 'render', 'user_input', 'unknown'];
  const severities: ErrorSeverity[] = ['low', 'medium', 'high', 'critical'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 pb-8 px-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[80vh] bg-[var(--color-surface)] border border-white/10 rounded-[32px] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bug className="w-5 h-5 text-[var(--color-accent)]" />
                <span className="text-sm font-bold text-white">Error Dashboard</span>
                {metrics.totalErrors > 0 && (
                  <span className="text-[10px] text-white/40 font-mono">
                    {metrics.totalErrors} total · {metrics.unresolvedCount} unresolved
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="flex items-center gap-2 p-4 border-b border-white/5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-white/30" />
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/70 font-mono outline-none"
              >
                <option value="all">All sources</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterSeverity}
                onChange={e => setFilterSeverity(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/70 font-mono outline-none"
              >
                <option value="all">All severities</option>
                {severities.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterResolved}
                onChange={e => setFilterResolved(e.target.value as any)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-white/70 font-mono outline-none"
              >
                <option value="unresolved">Unresolved</option>
                <option value="all">All</option>
                <option value="resolved">Resolved</option>
              </select>
              <div className="flex-1" />
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-white/50 hover:text-white/80 transition-colors"
              >
                <BarChart3 className="w-3 h-3" />
                Metrics
              </button>
              <button
                onClick={() => ErrorService.resolveAll()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-white/50 hover:text-white/80 transition-colors"
              >
                <CheckSquare className="w-3 h-3" />
                Resolve all
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(ErrorService.getAll(), null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `error-log-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-white/50 hover:text-white/80 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export
              </button>
              <button
                onClick={() => ErrorService.clearResolved()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-white/50 hover:text-white/80 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear resolved
              </button>
              <button
                onClick={() => ErrorService.clear()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg text-[10px] text-rose-400/60 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>

            {showMetrics && (
              <div className="grid grid-cols-4 gap-3 p-4 border-b border-white/5 bg-white/[0.02]">
                <MetricCard label="Total" value={metrics.totalErrors} />
                <MetricCard label="Resolved" value={metrics.resolvedCount} />
                <MetricCard label="Auto-repaired" value={metrics.autoRepairedCount} />
                <MetricCard label="Errors/min" value={metrics.recentRate} />
                {Object.entries(metrics.bySource).map(([k, v]) => (
                  <MetricCard key={k} label={k} value={v} />
                ))}
                {Object.entries(metrics.bySeverity).map(([k, v]) => (
                  <MetricCard key={k} label={k} value={v} />
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <CheckCircle className="w-12 h-12 mb-4" />
                  <span className="text-xs font-mono">No errors match the current filters</span>
                </div>
              ) : (
                filtered.map(err => {
                  const Icon = SOURCE_ICONS[err.source];
                  const cfg = SEVERITY_CONFIG[err.severity];
                  const age = formatAge(err.timestamp);
                  const suggestions = ErrorService.getRecoverySuggestions(err.source);
                  return (
                    <div
                      key={err.id}
                      className={`rounded-xl p-4 border ${err.resolved ? 'border-green-500/10 bg-green-500/[0.02]' : 'border-white/5 bg-white/[0.02]'} ${err.autoRepaired ? 'border-blue-500/10' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-4 h-4 mt-0.5 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-[10px] text-white/20 font-mono">{err.source}</span>
                            <span className="text-[10px] text-white/20 font-mono">{age}</span>
                            {err.autoRepaired && (
                              <span className="text-[10px] text-blue-400 font-mono">auto-repaired</span>
                            )}
                          </div>
                          <p className="text-xs text-white/70 mt-1 font-mono break-words">{err.message}</p>
                          {err.retryCount > 0 && (
                            <p className="text-[10px] text-white/20 mt-0.5">Retried {err.retryCount} times</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {!err.resolved && (
                              <button
                                onClick={() => ErrorService.resolve(err.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[9px] text-green-400 font-bold uppercase tracking-wider hover:bg-green-500/20 transition-colors"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Resolve
                              </button>
                            )}
                            {suggestions.map(s => (
                              <button
                                key={s.action}
                                onClick={() => {
                                  s.handler();
                                  ErrorService.markAutoRepaired(err.id);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[9px] text-blue-400 font-bold uppercase tracking-wider hover:bg-blue-500/20 transition-colors"
                              >
                                <RefreshCcw className="w-3 h-3" />
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
      <div className="text-[9px] text-white/30 font-bold uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-white mt-0.5 font-mono">{value}</div>
    </div>
  );
}

function formatAge(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
