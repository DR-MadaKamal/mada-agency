import React, { useState, useEffect } from 'react';
import { Gauge, Zap, ShieldCheck, Bot, Wind, Cpu, Globe, Brain, AlertCircle, RefreshCcw, DollarSign, TrendingUp, Info, CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '../lib/firebase';

interface ProviderUsage {
  provider: string;
  label: string;
  keyConfigured: boolean;
  available: boolean;
  status: string;
  usage?: number | null;
  usageMonthly?: number | null;
  limitRemaining?: number | null;
  isFreeTier?: boolean | null;
  balance?: string | null;
  hasPaymentMethod?: boolean | null;
  planType?: string | null;
  softLimit?: number | null;
  hardLimit?: number | null;
  error?: string;
}

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  gemini: Brain,
  openai: Bot,
  deepseek: Cpu,
  groq: Zap,
  openrouter: Globe,
  mistral: Wind,
  anthropic: ShieldCheck,
};

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#4285F4',
  openai: '#10A37F',
  deepseek: '#4F46E5',
  groq: '#F97316',
  openrouter: '#8B5CF6',
  mistral: '#3B82F6',
  anthropic: '#D97757',
};

export default function QuotaPanel() {
  const [data, setData] = useState<ProviderUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = auth?.currentUser ? await (auth.currentUser as any).getIdToken() : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/ai/usage', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.providers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const formatUsage = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '—';
    if (val < 0.01) return `$${val.toFixed(7)}`;
    return `$${val.toFixed(4)}`;
  };

  const formatBalance = (val: string | null | undefined): string => {
    if (!val) return '—';
    return `$${parseFloat(val).toFixed(2)}`;
  };

  const getStatusBadge = (entry: ProviderUsage) => {
    if (!entry.keyConfigured) return { label: 'No Key', color: 'text-white/20', bg: 'bg-white/5' };
    if (entry.status === 'ok') return { label: 'Connected', color: 'text-emerald-500', bg: 'bg-emerald-500/20' };
    if (entry.status === 'no-api') return { label: 'No API', color: 'text-amber-500', bg: 'bg-amber-500/20' };
    if (entry.status === 'no-access') return { label: 'Limited', color: 'text-amber-500', bg: 'bg-amber-500/20' };
    if (entry.status === 'error') return { label: 'Error', color: 'text-red-500', bg: 'bg-red-500/20' };
    return { label: entry.status, color: 'text-white/20', bg: 'bg-white/5' };
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/20">
          <RefreshCcw className="w-10 h-10 animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Scanning Provider Quotas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-red-500/50">
          <AlertCircle className="w-10 h-10" />
          <span className="text-xs font-black uppercase tracking-widest">Failed to load quotas: {error}</span>
          <button onClick={fetchUsage} className="px-6 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-[var(--color-accent)]" />
          <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Provider Quota Dashboard</h3>
        </div>
        <button
          onClick={fetchUsage}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto suggestions-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.map(entry => {
            const Icon = PROVIDER_ICONS[entry.provider] || Brain;
            const color = PROVIDER_COLORS[entry.provider] || '#6366f1';
            const badge = getStatusBadge(entry);

            return (
              <div
                key={entry.provider}
                className="glass-card p-6 border border-white/5 bg-black/40 rounded-[32px] transition-all hover:border-white/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                    style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest truncate">{entry.label}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${badge.color} ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-white/20 font-bold tracking-wider truncate">/{entry.provider}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* OpenRouter */}
                  {entry.provider === 'openrouter' && entry.status === 'ok' && (
                    <>
                      <MetricRow label="Total Usage" value={formatUsage(entry.usage)} icon={TrendingUp} />
                      <MetricRow label="Monthly Usage" value={formatUsage(entry.usageMonthly)} icon={TrendingUp} />
                      <MetricRow label="Credits Remaining" value={entry.limitRemaining !== null ? `$${entry.limitRemaining}` : 'Unlimited (Free)'} icon={DollarSign} />
                      <MetricRow label="Tier" value={entry.isFreeTier ? 'Free' : 'Paid'} icon={Info} />
                    </>
                  )}

                  {/* DeepSeek */}
                  {entry.provider === 'deepseek' && entry.status === 'ok' && (
                    <>
                      <MetricRow label="Balance" value={formatBalance(entry.balance)} icon={DollarSign} />
                      {entry.balance && parseFloat(entry.balance) <= 0 && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Insufficient Balance</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* OpenAI */}
                  {entry.provider === 'openai' && entry.status === 'ok' && (
                    <>
                      <MetricRow label="Plan" value={entry.planType || '—'} icon={Info} />
                      <MetricRow label="Soft Limit" value={entry.softLimit ? `$${entry.softLimit}` : '—'} icon={DollarSign} />
                      <MetricRow label="Hard Limit" value={entry.hardLimit ? `$${entry.hardLimit}` : '—'} icon={DollarSign} />
                      <MetricRow label="Payment Method" value={entry.hasPaymentMethod ? 'Configured' : 'None'} icon={CheckCircle2} />
                    </>
                  )}

                  {/* OpenAI no-access */}
                  {entry.provider === 'openai' && entry.status === 'no-access' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Need org-level key for billing API</span>
                    </div>
                  )}

                  {/* No API providers (Gemini, Groq, Mistral) */}
                  {entry.status === 'no-api' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/30">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest">No public usage API available</span>
                    </div>
                  )}

                  {/* No key */}
                  {entry.status === 'no-key' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/20">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest">API key not configured</span>
                    </div>
                  )}

                  {/* Error */}
                  {entry.status === 'error' && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{entry.error || 'Check failed'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
      <div className="flex items-center gap-2">
        <Icon className="w-3 h-3 text-white/20" />
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[11px] font-black text-white tabular-nums tracking-wider">{value}</span>
    </div>
  );
}
