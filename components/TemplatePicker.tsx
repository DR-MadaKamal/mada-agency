import React from 'react';
import { motion } from 'motion/react';
import { Rocket, Palette, Share2, Camera, Clapperboard, Sparkles } from 'lucide-react';
import { ProjectTemplate, getTemplatesForStudio } from '../lib/templates';

const ICON_MAP: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  Share2: <Share2 className="w-5 h-5" />,
  Camera: <Camera className="w-5 h-5" />,
  Clapperboard: <Clapperboard className="w-5 h-5" />,
};

interface TemplatePickerProps {
  studioType: string;
  onSelect: (template: ProjectTemplate) => void;
  onDismiss: () => void;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ studioType, onSelect, onDismiss }) => {
  const templates = getTemplatesForStudio(studioType);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-[var(--color-accent)]" />
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Start from Template</h2>
        </div>

        {templates.length === 0 ? (
          <p className="text-[10px] font-medium text-white/40 text-center py-8 uppercase tracking-widest">
            No templates available for this studio
          </p>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="w-full flex items-start gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[var(--color-accent)]/30 rounded-2xl transition-all text-left group"
              >
                <div className="p-3 rounded-xl bg-white/5 text-white/40 group-hover:text-[var(--color-accent)] group-hover:bg-[var(--color-accent)]/10 transition-all">
                  {ICON_MAP[t.icon] || <Sparkles className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">{t.name}</h3>
                  <p className="text-[10px] font-medium text-white/40 mt-1 leading-relaxed">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onDismiss}
          className="w-full mt-6 py-3 text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white/60 transition-all"
        >
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};
