import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, X, Sparkles, Image, Layout, Camera, Edit3, PenTool, Volume2,
  BarChart3, ShoppingCart, Film, MessageSquare, Music, Briefcase, Cpu,
  Archive, ShieldCheck, Clock, Star, Command, CornerDownLeft,
  History, ArrowRight, Rocket,
} from 'lucide-react';
import { AppView } from '../types';

interface OmniSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppView) => void;
}

interface SearchEntry {
  id: string;
  type: 'studio' | 'command' | 'project' | 'action';
  title: string;
  subtitle: string;
  icon: React.FC<any>;
  view: AppView;
  action?: string;
}

const ALL_STUDIOS: SearchEntry[] = [
  { id: 'creator_studio', type: 'studio', title: 'Creative Studio', subtitle: 'AI Image Generation & Splicing', icon: Sparkles, view: 'creator_studio' },
  { id: 'storyboard_studio', type: 'studio', title: 'Storyboard Studio', subtitle: 'Scene Planning & Visualization', icon: Layout, view: 'storyboard_studio' },
  { id: 'branding_studio', type: 'studio', title: 'Branding Studio', subtitle: 'Brand Identity & Guidelines', icon: PenTool, view: 'branding_studio' },
  { id: 'photoshoot_director', type: 'studio', title: 'Photoshoot Director', subtitle: 'Product Photography & Styling', icon: Camera, view: 'photoshoot_director' },
  { id: 'marketing_studio', type: 'studio', title: 'Marketing Studio', subtitle: 'Market Analysis & Campaigns', icon: BarChart3, view: 'marketing_studio' },
  { id: 'campaign_studio', type: 'studio', title: 'Campaign Studio', subtitle: 'Multi-Channel Campaigns', icon: ShoppingCart, view: 'campaign_studio' },
  { id: 'edit_studio', type: 'studio', title: 'Edit Studio', subtitle: 'Photo & Video Editing', icon: Edit3, view: 'edit_studio' },
  { id: 'plan_studio', type: 'studio', title: 'Plan Studio', subtitle: 'Strategic Planning & Roadmaps', icon: Layout, view: 'plan_studio' },
  { id: 'controller_studio', type: 'studio', title: 'Controller Studio', subtitle: 'System Orchestration', icon: Cpu, view: 'controller_studio' },
  { id: 'voice_over_studio', type: 'studio', title: 'Voice Over Studio', subtitle: 'Voice Recordings & Synthesis', icon: Volume2, view: 'voice_over_studio' },
  { id: 'prepilot_agency_suite', type: 'studio', title: 'PrePilot Agency Suite', subtitle: 'Agency Strategic Oversight', icon: Briefcase, view: 'prepilot_agency_suite' },
  { id: 'command_center', type: 'studio', title: 'Command Center', subtitle: 'System Metrics & Control', icon: ShieldCheck, view: 'command_center' },
  { id: 'asset_library', type: 'studio', title: 'Neural Vault', subtitle: 'Smart Asset Management', icon: Archive, view: 'asset_library' },
  { id: 'archives', type: 'studio', title: 'History Archives', subtitle: 'Previous Creations & Versions', icon: Clock, view: 'archives' },
];

const COMMANDS: SearchEntry[] = [
  { id: 'cmd_new_project', type: 'command', title: 'New Project', subtitle: 'Create a new blank project', icon: Rocket, view: 'creator_studio', action: 'new_project' },
  { id: 'cmd_search', type: 'command', title: 'Toggle Command Palette', subtitle: 'Ctrl+K to toggle', icon: Command, view: 'creator_studio' },
  { id: 'cmd_undo', type: 'command', title: 'Undo', subtitle: 'Ctrl+Z to undo last action', icon: History, view: 'creator_studio' },
];

const OmniSearch: React.FC<OmniSearchProps> = React.memo((({ isOpen, onClose, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toLowerCase();
    const all = [...ALL_STUDIOS, ...COMMANDS];

    const scored = all
      .map(entry => {
        let score = 0;
        const title = entry.title.toLowerCase();
        const sub = entry.subtitle.toLowerCase();
        if (title === q) score = 100;
        else if (title.startsWith(q)) score = 80;
        else if (title.includes(q)) score = 60;
        else if (sub.includes(q)) score = 40;
        else if (entry.id.includes(q)) score = 30;
        return { entry, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.entry);

    return scored.slice(0, 8);
  }, [searchTerm]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm, results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) return;
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => Math.min(prev + 1, results.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => Math.max(prev - 1, 0)); return; }
      if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); handleSelect(results[selectedIndex]); return; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleSelect = (item: SearchEntry) => {
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
            <div className="relative flex items-center p-6 border-b border-white/5">
              <Search className="w-6 h-6 text-white/20 absolute left-8" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search studios, commands, or projects..."
                className="w-full bg-transparent pl-12 pr-12 text-lg text-white font-medium focus:outline-none placeholder:text-white/10"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-8 text-white/20 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto suggestions-scrollbar">
              {results.length > 0 && (
                <div className="p-4 space-y-1">
                  {results.map((item, idx) => {
                    const Icon = item.icon;
                    const isSelected = idx === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        onClick={() => handleSelect(item)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/60'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : 'bg-white/5'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-white/80'}`}>{item.title}</div>
                            <div className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isSelected ? 'text-white/60' : 'text-white/20'}`}>{item.subtitle}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${isSelected ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5'}`}>{item.type}</span>
                          {isSelected && <CornerDownLeft className="w-4 h-4 opacity-40" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {searchTerm && results.length === 0 && (
                <div className="p-12 text-center text-white/20">
                  <span className="text-sm font-bold uppercase tracking-widest">No results found</span>
                  <p className="text-[10px] mt-2 text-white/10">Try a different search term</p>
                </div>
              )}

              {!searchTerm && (
                <div className="p-8">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-6 px-4">Quick Navigation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_STUDIOS.filter(s => ['creator_studio', 'branding_studio', 'marketing_studio', 'prepilot_agency_suite', 'command_center', 'asset_library'].includes(s.id)).map(studio => {
                      const Icon = studio.icon;
                      return (
                        <button
                          key={studio.id}
                          onClick={() => handleSelect(studio)}
                          className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white/5 transition-all text-left group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
                            <Icon className="w-4 h-4 text-white/60" />
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-white/80">{studio.title}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-white/20">{studio.subtitle}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 rounded bg-white/10 text-[9px] font-black text-white/40">↑↓</kbd>
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Navigate</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/20">
                <Command className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">Palette</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}));
export default OmniSearch;