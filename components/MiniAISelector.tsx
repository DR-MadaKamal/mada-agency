import { useState, useEffect } from 'react';
import { Sparkles, Brain, ShieldCheck, ChevronDown, ExternalLink } from 'lucide-react';
import { ExternalServiceConfig, ExternalAIService } from '../types';
import { EXTERNAL_SERVICES } from '../services/aiLibrary';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';

interface MiniAISelectorProps {
  provider: string;
  modelId: string;
  externalServiceConfig?: ExternalServiceConfig;
  onChange: (provider: string, modelId: string, externalServiceConfig?: ExternalServiceConfig) => void;
}

interface SelectOption {
  provider: string;
  modelId: string;
  label: string;
  icon: any;
  isExternal?: boolean;
  serviceId?: string;
}

const BUILTIN_OPTIONS: SelectOption[] = [
  { provider: 'google', modelId: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', icon: Sparkles },
  { provider: 'google', modelId: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', icon: Sparkles },
  { provider: 'openai', modelId: 'gpt-4o', label: 'GPT-4o', icon: Brain },
  { provider: 'openai', modelId: 'gpt-4o-mini', label: 'GPT-4o Mini', icon: Brain },
  { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet', icon: ShieldCheck },
  { provider: 'anthropic', modelId: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', icon: ShieldCheck },
];

export function MiniAISelector({ provider, modelId, externalServiceConfig, onChange }: MiniAISelectorProps) {
  const [open, setOpen] = useState(false);
  const [firestoreServices, setFirestoreServices] = useState<ExternalServiceConfig[]>([]);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [localApiKeys, setLocalApiKeys] = useState(externalServiceConfig?.apiKeys?.join(', ') || '');
  const [localAuthType, setLocalAuthType] = useState(externalServiceConfig?.authType || 'header');
  const [localAuthHeaderName, setLocalAuthHeaderName] = useState(externalServiceConfig?.authHeaderName || 'Authorization');
  const [localUrl, setLocalUrl] = useState(externalServiceConfig?.url || '');

  useEffect(() => {
    const unsubExt = onSnapshot(
      query(collection(db, 'external_services'), orderBy('name', 'asc')),
      (snap) => {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExternalServiceConfig));
        setFirestoreServices(data);
      },
      () => {}
    );
    return () => unsubExt();
  }, []);

  const externalServices: ExternalAIService[] = firestoreServices.length > 0
    ? firestoreServices.map(s => ({
        id: s.id,
        name: s.name,
        url: s.url,
        description: s.description,
        capabilities: s.capabilities as any,
        icon: s.icon,
        color: s.color,
        models: s.models,
        isFree: s.isFree,
        isActive: s.isActive,
      }))
    : EXTERNAL_SERVICES;

  const externalOptions: SelectOption[] = externalServices
    .filter(s => s.url?.startsWith('http'))
    .map(s => ({
      provider: 'custom',
      modelId: s.id,
      label: s.name,
      icon: ExternalLink,
      isExternal: true,
      serviceId: s.id,
    }));

  const webOnlyServices = externalServices.filter(s => !s.url?.startsWith('http'));

  const allOptions = [...BUILTIN_OPTIONS, ...(externalOptions.length > 0 ? [{ provider: '', modelId: '', label: '─── External ───', icon: () => null, isExternal: true } as SelectOption] : []), ...externalOptions];

  const isCustomSelected = provider === 'custom';
  const current = isCustomSelected
    ? { label: externalServiceConfig?.name || 'Custom', icon: ExternalLink }
    : BUILTIN_OPTIONS.find(o => o.provider === provider && o.modelId === modelId) || BUILTIN_OPTIONS[0];
  const Icon = current.icon || Sparkles;

  const handleSelect = (opt: SelectOption) => {
    if (opt.isExternal || !opt.provider) return;
    if (opt.provider === 'custom') {
      const service = externalServices.find(s => s.id === opt.modelId);
      if (service) {
        onChange('custom', opt.modelId, {
          id: service.id,
          name: service.name,
          url: service.url,
          description: service.description,
          capabilities: service.capabilities as string[],
          icon: service.icon,
          color: service.color,
          models: service.models,
          isFree: service.isFree,
          isActive: true,
          apiKeys: localApiKeys.split(',').map(x => x.trim()).filter(Boolean),
          authType: localAuthType as any,
          authHeaderName: localAuthHeaderName,
        });
        setShowApiConfig(true);
      }
    } else {
      onChange(opt.provider, opt.modelId);
      setShowApiConfig(false);
    }
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 hover:text-white/70 hover:bg-white/10 transition-all uppercase tracking-widest"
      >
        <Icon className="w-3 h-3" style={isCustomSelected ? { color: externalServiceConfig?.color } : undefined} />
        {isCustomSelected ? externalServiceConfig?.name || 'Custom' : (current as any).label}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl py-1 min-w-[180px] shadow-2xl max-h-80 overflow-y-auto">
            {allOptions.map((opt, i) => {
              if (!opt.provider) {
                return <div key={`sep-${i}`} className="px-3 py-1 text-[7px] text-white/20 uppercase tracking-widest font-bold">{opt.label}</div>;
              }
              const OptIcon = opt.icon;
              const isActive = isCustomSelected
                ? opt.provider === 'custom' && opt.modelId === modelId
                : opt.provider === provider && opt.modelId === modelId;
              return (
                <button
                  key={`${opt.provider}-${opt.modelId}`}
                  onClick={() => handleSelect(opt)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold transition-all text-left ${
                    isActive ? 'text-[var(--color-accent)] bg-white/5' : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <OptIcon className="w-3 h-3 shrink-0" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {isCustomSelected && showApiConfig && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl p-4 min-w-[280px] shadow-2xl space-y-3">
          <div>
            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 block">API Keys (comma-separated)</label>
            <input
              type="text"
              value={localApiKeys}
              onChange={e => setLocalApiKeys(e.target.value)}
              className="w-full glass-input px-2 py-1.5 rounded-lg text-[9px] font-mono tracking-wider"
              placeholder="key1, key2, key3"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 block">Auth Type</label>
              <select
                value={localAuthType}
                onChange={e => setLocalAuthType(e.target.value)}
                className="w-full glass-input px-2 py-1.5 rounded-lg text-[9px] font-black tracking-widest"
              >
                <option value="header">Header</option>
                <option value="bearer">Bearer</option>
                <option value="api-key">API Key</option>
              </select>
            </div>
            <div>
              <label className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 block">Header Name</label>
              <input
                type="text"
                value={localAuthHeaderName}
                onChange={e => setLocalAuthHeaderName(e.target.value)}
                className="w-full glass-input px-2 py-1.5 rounded-lg text-[9px] font-mono tracking-wider"
              />
            </div>
          </div>
          <div>
            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1 block">Endpoint URL</label>
            <input
              type="text"
              value={localUrl}
              onChange={e => setLocalUrl(e.target.value)}
              className="w-full glass-input px-2 py-1.5 rounded-lg text-[9px] font-mono tracking-wider"
            />
          </div>
          <button
            onClick={() => {
              const service = externalServices.find(s => s.id === modelId);
              if (service) {
                onChange('custom', modelId, {
                  id: service.id,
                  name: service.name,
                  url: localUrl,
                  description: service.description,
                  capabilities: service.capabilities as string[],
                  icon: service.icon,
                  color: service.color,
                  models: service.models,
                  isFree: service.isFree,
                  isActive: true,
                  apiKeys: localApiKeys.split(',').map(x => x.trim()).filter(Boolean),
                  authType: localAuthType as any,
                  authHeaderName: localAuthHeaderName,
                });
              }
              setOpen(false);
            }}
            className="w-full py-2 rounded-lg bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-black text-[9px] uppercase tracking-widest transition-all"
          >
            Apply
          </button>
        </div>
      )}

      {isCustomSelected && webOnlyServices.length > 0 && (
        <div className="mt-1 text-[7px] text-white/20">
          {webOnlyServices.map(s => (
            <button
              key={s.id}
              onClick={() => {
                navigator.clipboard.writeText(`Use ${s.name} for generation`);
                window.open(s.url, '_blank', 'noopener,noreferrer');
              }}
              className="block w-full text-left px-2 py-1 hover:text-white/40 transition-colors"
            >
              {s.name} ↗
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
