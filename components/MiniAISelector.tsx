import { useState } from 'react';
import { Sparkles, Brain, ShieldCheck, ChevronDown } from 'lucide-react';

interface MiniAISelectorProps {
  provider: string;
  modelId: string;
  onChange: (provider: string, modelId: string) => void;
}

const OPTIONS: { provider: string; modelId: string; label: string; icon: any }[] = [
  { provider: 'google', modelId: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', icon: Sparkles },
  { provider: 'google', modelId: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', icon: Sparkles },
  { provider: 'openai', modelId: 'gpt-4o', label: 'GPT-4o', icon: Brain },
  { provider: 'openai', modelId: 'gpt-4o-mini', label: 'GPT-4o Mini', icon: Brain },
  { provider: 'anthropic', modelId: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet', icon: ShieldCheck },
  { provider: 'anthropic', modelId: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', icon: ShieldCheck },
];

export function MiniAISelector({ provider, modelId, onChange }: MiniAISelectorProps) {
  const [open, setOpen] = useState(false);

  const current = OPTIONS.find(o => o.provider === provider && o.modelId === modelId) || OPTIONS[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-bold text-white/40 hover:text-white/70 hover:bg-white/10 transition-all uppercase tracking-widest"
      >
        <Icon className="w-3 h-3" />
        {current.label}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl py-1 min-w-[160px] shadow-2xl">
            {OPTIONS.map(opt => {
              const OptIcon = opt.icon;
              const isActive = opt.provider === provider && opt.modelId === modelId;
              return (
                <button
                  key={`${opt.provider}-${opt.modelId}`}
                  onClick={() => { onChange(opt.provider, opt.modelId); setOpen(false); }}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-[10px] font-bold transition-all text-left ${isActive ? 'text-[var(--color-accent)] bg-white/5' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  <OptIcon className="w-3 h-3 shrink-0" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
