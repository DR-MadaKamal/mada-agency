import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Undo2, Redo2, History, RotateCcw, Clock } from 'lucide-react';

interface Version {
  id: string;
  timestamp: number;
  label: string;
  snapshot: any;
}

interface VersionTimelineProps {
  versions: Version[];
  currentVersionId: string | null;
  onRestore: (version: Version) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const VersionTimeline: React.FC<VersionTimelineProps> = ({
  versions,
  currentVersionId,
  onRestore,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
          title="Version History"
        >
          <History className="w-4 h-4" />
        </button>
        {versions.length > 0 && (
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">
            {versions.length}
          </span>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/5">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3 h-3 text-[var(--color-accent)]" />
                Version History
              </h3>
            </div>
            <div className="max-h-80 overflow-y-auto suggestions-scrollbar">
              {versions.length === 0 ? (
                <div className="p-6 text-center">
                  <RotateCcw className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">No versions yet</p>
                </div>
              ) : (
                versions.map((v, i) => {
                  const isCurrent = v.id === currentVersionId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => onRestore(v)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-white/5 border-l-2 ${
                        isCurrent ? 'border-[var(--color-accent)] bg-white/5' : 'border-transparent'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[var(--color-accent)]' : 'bg-white/20'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{v.label}</p>
                        <p className="text-[8px] font-medium text-white/30 uppercase tracking-wider">
                          {formatTime(v.timestamp)}
                          {i === 0 && ' (current)'}
                        </p>
                      </div>
                      <span className="text-[9px] font-black text-white/20 uppercase">v{versions.length - i}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
