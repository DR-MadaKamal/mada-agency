import React from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, X, Check } from 'lucide-react';

interface AILoadingOverlayProps {
  message?: string;
  onCancel?: () => void;
  steps?: { label: string; done: boolean; }[];
}

export const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({
  message = 'AI is processing your request...',
  onCancel,
  steps,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl z-50 flex items-center justify-center"
  >
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="relative">
        <RefreshCcw className="w-8 h-8 text-[var(--color-accent)] animate-spin" />
        <div className="absolute inset-0 bg-[var(--color-accent)] blur-xl opacity-20 animate-pulse" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{message}</span>
      {steps && (
        <div className="flex flex-col gap-1.5 w-full">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] font-medium tracking-wider">
              {s.done ? (
                <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              ) : (
                <RefreshCcw className="w-3 h-3 text-white/30 animate-spin shrink-0" />
              )}
              <span className={s.done ? 'text-emerald-400/80' : 'text-white/40'}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white/80 hover:bg-white/10 transition-all active:scale-95"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      )}
    </div>
  </motion.div>
);
