
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Image as ImageIcon, FileText, Database, Cpu, Command, ArrowRight, CornerDownLeft } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { AppView } from '../types';

interface OmniSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

const OmniSearch: React.FC<OmniSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Toggle logic would be in parent, but this helps catch it
      }
      if (!isOpen) return;

      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      if (e.key === 'ArrowUp') setSelectedIndex(prev => Math.max(prev - 1, 0));
      if (e.key === 'Enter' && results[selectedIndex]) {
        handleAction(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // Mock results and real firestore search
        const assetQuery = query(collection(db, 'vault_assets'), where('name', '>=', searchTerm), limit(3));
        const assetSnap = await getDocs(assetQuery);
        
        const foundAssets = assetSnap.docs.map(doc => ({
          id: doc.id,
          type: 'asset',
          title: doc.data().name,
          subtitle: doc.data().category,
          icon: ImageIcon,
          view: 'asset_library'
        }));

        const internalCommands = [
          { type: 'command', title: 'Open Creator Studio', subtitle: 'AI Image Splicing', icon: Command, view: 'creator_studio' },
          { type: 'command', title: 'PrePilot Agency Suite', subtitle: 'Strategic Oversight', icon: Command, view: 'prepilot_agency_suite' },
          { type: 'command', title: 'Neural Vault', subtitle: 'Smart Asset Management', icon: Database, view: 'asset_library' },
          { type: 'command', title: 'Command Center', subtitle: 'System Metrics', icon: Cpu, view: 'command_center' },
          { type: 'command', title: 'History Archives', subtitle: 'Previous Creations', icon: FileText, view: 'archives' }
        ].filter(cmd => cmd.title.toLowerCase().includes(searchTerm.toLowerCase()));

        setResults([...internalCommands, ...foundAssets]);
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAction = (item: any) => {
    onNavigate(item.view);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden relative z-10"
          >
            {/* Search Input Area */}
            <div className="relative flex items-center p-6 border-b border-white/5">
              <Search className="w-6 h-6 text-white/20 absolute left-8" />
              <input 
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search assets, studios, or commands... (Ctrl+K)"
                className="w-full bg-transparent pl-12 pr-12 text-lg text-white font-medium focus:outline-none placeholder:text-white/10"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-8 text-white/20 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto suggestions-scrollbar">
              {results.length > 0 ? (
                <div className="p-4 space-y-1">
                  {results.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleAction(item)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${idx === selectedIndex ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-white/5 text-white/60'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${idx === selectedIndex ? 'bg-white/20' : 'bg-white/5'}`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <div className={`text-sm font-bold ${idx === selectedIndex ? 'text-white' : 'text-white/80'}`}>{item.title}</div>
                          <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${idx === selectedIndex ? 'text-white/60' : 'text-white/20'}`}>{item.subtitle}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${idx === selectedIndex ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'}`}>
                           {item.type}
                         </span>
                         {idx === selectedIndex && <CornerDownLeft className="w-4 h-4 opacity-40" />}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="p-12 text-center text-white/20">
                  <span className="text-sm font-bold uppercase tracking-widest">No matching neural records found</span>
                </div>
              ) : (
                <div className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 px-4">Suggested Commands</p>
                   <div className="space-y-1">
                      <SuggestedItem icon={Command} label="Creator Studio" subtitle="Jump to Image Splicing" onClick={() => onNavigate('creator_studio')} />
                      <SuggestedItem icon={Database} label="Neural Vault" subtitle="Explore Smart Assets" onClick={() => onNavigate('asset_library')} />
                      <SuggestedItem icon={Cpu} label="Command Center" subtitle="Check System Integrity" onClick={() => onNavigate('command_center')} />
                   </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white/[0.02] p-4 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-white/10 text-[9px] font-black text-white/40">ESC</kbd>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Close</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 rounded bg-white/10 text-[9px] font-black text-white/40">↵</kbd>
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Select</span>
                  </div>
               </div>
               <div className="flex items-center gap-2 text-[var(--color-accent)] opacity-40">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest italic">Neural Omni-Search v1.0</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SuggestedItem = ({ icon: Icon, label, subtitle, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-left group transition-all"
  >
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-[var(--color-accent)]/30 transition-all">
      <Icon className="w-5 h-5 text-white/40 group-hover:text-[var(--color-accent)]" />
    </div>
    <div>
       <div className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">{label}</div>
       <div className="text-[9px] font-black text-white/10 uppercase tracking-widest mt-0.5 group-hover:text-white/30 transition-colors">{subtitle}</div>
    </div>
  </button>
);

const Sparkles = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
    </svg>
);

export default OmniSearch;
