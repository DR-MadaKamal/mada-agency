import { useState, useEffect } from 'react';
import { Sparkles, Brain, ShieldCheck, ChevronDown, ExternalLink, CheckCircle, XCircle, Loader2, Wifi, Settings2, Cpu, Zap, Wind, Bot } from 'lucide-react';
import type { AIConfig, ExternalServiceConfig, ExternalAIService, AIProvider } from '../types';
import { KNOWN_AI_ENDPOINTS } from '../types';
import { EXTERNAL_SERVICES } from '../services/aiLibrary';
import { db, collection, query, orderBy, onSnapshot } from '../lib/firebase';

interface MiniAISelectorProps {
  config?: AIConfig;
  onChange: (config: AIConfig) => void;
}

interface ProviderOption {
  provider: AIProvider;
  modelId: string;
  label: string;
  group: string;
  icon: any;
  color?: string;
}

const BUILTIN_GROUPS: { group: string; color: string; icon: any }[] = [
  { group: 'Google', color: '#4285F4', icon: Sparkles },
  { group: 'OpenAI', color: '#10A37F', icon: Brain },
  { group: 'Anthropic', color: '#D97757', icon: ShieldCheck },
  { group: 'Groq', color: '#F97316', icon: Zap },
  { group: 'OpenRouter', color: '#8B5CF6', icon: Bot },
  { group: 'Mistral', color: '#3B82F6', icon: Wind },
];

const BUILTIN_OPTIONS: ProviderOption[] = [
  { provider: 'google', modelId: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', group: 'Google', icon: Sparkles, color: '#4285F4' },
  { provider: 'google', modelId: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', group: 'Google', icon: Sparkles, color: '#4285F4' },
  { provider: 'openai', modelId: 'gpt-4o', label: 'GPT-4o', group: 'OpenAI', icon: Brain, color: '#10A37F' },
  { provider: 'openai', modelId: 'gpt-4o-mini', label: 'GPT-4o Mini', group: 'OpenAI', icon: Brain, color: '#10A37F' },
  { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet', group: 'Anthropic', icon: ShieldCheck, color: '#D97757' },
  { provider: 'anthropic', modelId: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', group: 'Anthropic', icon: ShieldCheck, color: '#D97757' },
  { provider: 'groq', modelId: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B', group: 'Groq', icon: Zap, color: '#F97316' },
  { provider: 'groq', modelId: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', group: 'Groq', icon: Zap, color: '#F97316' },
  { provider: 'openrouter', modelId: 'openai/gpt-4o', label: 'GPT-4o (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'openrouter', modelId: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'openrouter', modelId: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'openrouter', modelId: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'openrouter', modelId: 'meta-llama/llama-3.1-70b', label: 'Llama 3.1 70B (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'openrouter', modelId: 'qwen/qwen-plus', label: 'Qwen Plus (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'openrouter', modelId: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (via OR)', group: 'OpenRouter', icon: Bot, color: '#8B5CF6' },
  { provider: 'mistral', modelId: 'mistral-large-latest', label: 'Mistral Large', group: 'Mistral', icon: Wind, color: '#3B82F6' },
  { provider: 'mistral', modelId: 'mistral-small-latest', label: 'Mistral Small', group: 'Mistral', icon: Wind, color: '#3B82F6' },
];

export function MiniAISelector({ config, onChange }: MiniAISelectorProps) {
  const [open, setOpen] = useState(false);
  const [firestoreServices, setFirestoreServices] = useState<ExternalServiceConfig[]>([]);
  const [configOpen, setConfigOpen] = useState(config?.provider === 'external' || config?.provider === 'custom');
  const [localApiKeys, setLocalApiKeys] = useState(config?.externalServiceConfig?.apiKeys?.join(', ') || '');
  const [localAuthType, setLocalAuthType] = useState(config?.externalServiceConfig?.authType || 'bearer');
  const [localAuthHeaderName, setLocalAuthHeaderName] = useState(config?.externalServiceConfig?.authHeaderName || 'Authorization');
  const [localUrl, setLocalUrl] = useState(config?.externalServiceConfig?.url || '');
  const [localModelId, setLocalModelId] = useState(config?.modelId || '');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');

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

  useEffect(() => {
    if (config?.externalServiceConfig?.url) setLocalUrl(config.externalServiceConfig.url);
    if (config?.externalServiceConfig?.authType) setLocalAuthType(config.externalServiceConfig.authType);
    if (config?.externalServiceConfig?.authHeaderName) setLocalAuthHeaderName(config.externalServiceConfig.authHeaderName);
    if (config?.externalServiceConfig?.apiKeys) setLocalApiKeys(config.externalServiceConfig.apiKeys.join(', '));
    if (config?.modelId) setLocalModelId(config.modelId);
  }, [config?.externalServiceConfig?.url, config?.externalServiceConfig?.authType, config?.externalServiceConfig?.authHeaderName, config?.externalServiceConfig?.apiKeys, config?.modelId]);

  const externalServices: ExternalAIService[] = firestoreServices.length > 0
    ? firestoreServices.map(s => ({ id: s.id, name: s.name, url: s.url, description: s.description, capabilities: s.capabilities as any, icon: s.icon, color: s.color, models: s.models, isFree: s.isFree, isActive: s.isActive }))
    : EXTERNAL_SERVICES;

  const allExternal: ExternalServiceConfig[] = firestoreServices.length > 0 ? firestoreServices
    : EXTERNAL_SERVICES.map(s => ({ id: s.id, name: s.name, url: s.url, description: s.description, capabilities: s.capabilities as string[], icon: s.icon, color: s.color, models: s.models, isFree: s.isFree, isActive: true, authType: 'bearer' as const, authHeaderName: 'Authorization' }));

  const isBuiltin = config?.provider && ['google', 'openai', 'anthropic', 'groq', 'openrouter', 'mistral'].includes(config.provider);
  const isExternal = config?.provider === 'external' || config?.provider === 'custom';

  const current = isBuiltin
    ? BUILTIN_OPTIONS.find(o => o.provider === config?.provider && o.modelId === config?.modelId) || BUILTIN_OPTIONS[0]
    : isExternal
    ? { label: config?.externalServiceConfig?.name || config?.modelId || 'External', icon: ExternalLink, color: config?.externalServiceConfig?.color || '#888' }
    : BUILTIN_OPTIONS[0];

  const handleSelectBuiltin = (opt: ProviderOption) => {
    onChange({ provider: opt.provider, modelId: opt.modelId });
    setOpen(false);
    setConfigOpen(false);
    setTestStatus('idle');
  };

  const handleSelectExternal = (svc: ExternalServiceConfig) => {
    onChange({
      provider: 'external',
      modelId: svc.models?.[0] || svc.id,
      externalServiceConfig: {
        id: svc.id, name: svc.name, url: svc.url, description: svc.description,
        capabilities: svc.capabilities, icon: svc.icon, color: svc.color,
        models: svc.models, isFree: svc.isFree, isActive: true,
        apiKeys: [], authType: svc.authType || 'bearer', authHeaderName: svc.authHeaderName || 'Authorization',
        requestTemplate: (svc as any).requestTemplate, responsePath: (svc as any).responsePath,
      },
    });
    setLocalUrl(svc.url);
    setLocalAuthType(svc.authType || 'bearer');
    setLocalAuthHeaderName(svc.authHeaderName || 'Authorization');
    setLocalApiKeys('');
    setLocalModelId(svc.models?.[0] || svc.id);
    setConfigOpen(true);
    setOpen(false);
    setTestStatus('idle');
  };

  const handleAddCustom = () => {
    onChange({
      provider: 'external',
      modelId: localModelId || 'custom-model',
      externalServiceConfig: {
        id: 'custom', name: 'Custom API', url: localUrl, description: '',
        capabilities: ['text', 'image'], icon: 'Wifi', color: '#888',
        models: [localModelId || 'custom-model'], isFree: false, isActive: true,
        apiKeys: localApiKeys.split(',').map(x => x.trim()).filter(Boolean),
        authType: localAuthType as any, authHeaderName: localAuthHeaderName,
      },
    });
    setOpen(false);
  };

  const handleApplyConfig = () => {
    if (config?.provider !== 'external') return;
    onChange({
      ...config,
      modelId: localModelId || config.modelId,
      externalServiceConfig: {
        ...config.externalServiceConfig!,
        url: localUrl,
        authType: localAuthType as any,
        authHeaderName: localAuthHeaderName,
        apiKeys: localApiKeys.split(',').map(x => x.trim()).filter(Boolean),
      },
    });
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const resp = await fetch('/api/ai/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'external',
          model: localModelId || 'test',
          apiKey: localApiKeys.split(',')[0]?.trim() || '',
          authType: localAuthType,
          authHeaderName: localAuthHeaderName,
          endpoint: localUrl,
          prompt: 'Hello',
        }),
      });
      setTestStatus(resp.ok ? 'success' : 'fail');
    } catch {
      setTestStatus('fail');
    }
  };

  const groupedBuiltins = BUILTIN_GROUPS.map(g => ({
    ...g,
    options: BUILTIN_OPTIONS.filter(o => o.group === g.group),
  }));

  const knownProviders = Object.entries(KNOWN_AI_ENDPOINTS).filter(([key]) => !['google', 'openai', 'anthropic'].includes(key));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 hover:text-white/70 hover:bg-white/10 transition-all uppercase tracking-widest"
      >
        {isExternal ? <Wifi className="w-3 h-3" style={{ color: (current as any).color }} /> : <Sparkles className="w-3 h-3" />}
        <span>{(current as any).label}</span>
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl py-2 min-w-[220px] shadow-2xl max-h-[70vh] overflow-y-auto suggestions-scrollbar">
            {/* Built-in Providers */}
            {groupedBuiltins.map(group => (
              <div key={group.group}>
                <div className="px-3 py-1.5 text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5">
                  <group.icon className="w-2.5 h-2.5" style={{ color: group.color }} />
                  {group.group}
                </div>
                {group.options.map(opt => (
                  <button key={`${opt.provider}-${opt.modelId}`}
                    onClick={() => handleSelectBuiltin(opt)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-[10px] font-bold transition-all text-left ${
                      config?.provider === opt.provider && config?.modelId === opt.modelId
                        ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: opt.color }} />
                    {opt.label}
                    {config?.provider === opt.provider && config?.modelId === opt.modelId && <CheckCircle className="w-2.5 h-2.5 ml-auto text-[var(--color-accent)]" />}
                  </button>
                ))}
              </div>
            ))}

            {/* External Services */}
            {allExternal.length > 0 && (
              <>
                <div className="px-3 py-1.5 mt-1 text-[7px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5 border-t border-white/5 pt-2">
                  <ExternalLink className="w-2.5 h-2.5" /> External
                </div>
                {allExternal.map(svc => (
                  <button key={svc.id}
                    onClick={() => handleSelectExternal(svc)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-[10px] font-bold transition-all text-left ${
                      config?.externalServiceConfig?.id === svc.id ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: svc.color || '#888' }} />
                    <span className="flex-1 truncate">{svc.name}</span>
                    <div className="flex gap-1">
                      {svc.capabilities?.includes('image') && <span className="text-[7px] text-white/20 font-mono">img</span>}
                      {svc.capabilities?.includes('video') && <span className="text-[7px] text-white/20 font-mono">vid</span>}
                    </div>
                    {config?.externalServiceConfig?.id === svc.id && <CheckCircle className="w-2.5 h-2.5 text-[var(--color-accent)]" />}
                  </button>
                ))}
              </>
            )}

            {/* Add Custom API */}
            <div className="px-3 py-1.5 mt-1 text-[7px] font-black text-white/20 uppercase tracking-widest border-t border-white/5 pt-2">
              <Settings2 className="w-2.5 h-2.5 inline mr-1" /> Custom Connection
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <select onChange={e => { if (e.target.value) { const k = KNOWN_AI_ENDPOINTS[e.target.value]; if (k) { setLocalUrl(k.url); setLocalAuthType(k.authType); setLocalAuthHeaderName(k.authHeaderName); setLocalModelId(k.models[0] || ''); } }}}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white/60 outline-none"
                >
                  <option value="">Quick-fill endpoint...</option>
                  {knownProviders.map(([key, val]) => (
                    <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                  ))}
                </select>
                <input value={localModelId}
                  onChange={e => setLocalModelId(e.target.value)}
                  placeholder="model-id"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white/60 outline-none font-mono w-20"
                />
              </div>
              <input value={localUrl}
                onChange={e => setLocalUrl(e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white/60 outline-none font-mono"
              />
              <div className="flex items-center gap-1.5">
                <select value={localAuthType}
                  onChange={e => setLocalAuthType(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-lg px-1.5 py-1 text-[8px] text-white/60 outline-none"
                >
                  <option value="bearer">Bearer</option>
                  <option value="header">Header</option>
                  <option value="api-key">API Key</option>
                </select>
                <input value={localAuthHeaderName}
                  onChange={e => setLocalAuthHeaderName(e.target.value)}
                  placeholder="Authorization"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white/60 outline-none font-mono"
                />
                <input value={localApiKeys}
                  onChange={e => setLocalApiKeys(e.target.value)}
                  placeholder="api-key"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[8px] text-white/60 outline-none font-mono"
                />
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => { handleAddCustom(); setOpen(false); }}
                  className="flex-1 py-1.5 rounded-lg bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-black text-[8px] uppercase tracking-widest transition-all"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Config Panel (shown when external provider is selected) */}
      {configOpen && isExternal && (
        <div className="mt-2 bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
              {config?.externalServiceConfig?.name || 'API Configuration'}
            </span>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${testStatus === 'success' ? 'bg-green-400' : testStatus === 'fail' ? 'bg-red-400' : testStatus === 'testing' ? 'animate-pulse bg-yellow-400' : 'bg-white/20'}`} />
              <button onClick={handleTestConnection} disabled={testStatus === 'testing'}
                className="text-[7px] font-black text-white/20 hover:text-white/40 uppercase tracking-widest transition-all flex items-center gap-1">
                {testStatus === 'testing' ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : testStatus === 'success' ? <CheckCircle className="w-2.5 h-2.5 text-green-400" /> : testStatus === 'fail' ? <XCircle className="w-2.5 h-2.5 text-red-400" /> : null}
                {testStatus === 'idle' ? 'Test' : testStatus === 'testing' ? '...' : testStatus === 'success' ? 'OK' : 'Fail'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Model</label>
            <div className="flex gap-1">
              <input value={localModelId}
                onChange={e => setLocalModelId(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white/80 outline-none font-mono"
              />
              {config?.externalServiceConfig?.models && config.externalServiceConfig.models.length > 1 && (
                <div className="flex gap-1">
                  {config.externalServiceConfig.models.map(m => (
                    <button key={m} onClick={() => setLocalModelId(m)}
                      className={`px-1.5 py-1 rounded text-[7px] font-mono ${localModelId === m ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-white/5 text-white/30 hover:text-white/50'}`}>
                      {m.length > 12 ? m.slice(0, 10) + '..' : m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Endpoint URL</label>
            <input value={localUrl}
              onChange={e => setLocalUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white/80 outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Auth</label>
              <select value={localAuthType}
                onChange={e => setLocalAuthType(e.target.value as any)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-1.5 py-1 text-[8px] text-white/60 outline-none"
              >
                <option value="bearer">Bearer</option>
                <option value="header">Header</option>
                <option value="api-key">API Key</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">Header Name</label>
              <input value={localAuthHeaderName}
                onChange={e => setLocalAuthHeaderName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white/80 outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[7px] font-black text-white/20 uppercase tracking-widest">API Key</label>
            <input value={localApiKeys}
              onChange={e => setLocalApiKeys(e.target.value)}
              type="password"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white/80 outline-none font-mono"
            />
          </div>

          <button onClick={() => { handleApplyConfig(); setTestStatus('idle'); }}
            className="w-full py-1.5 rounded-lg bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-black text-[8px] uppercase tracking-widest transition-all"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
