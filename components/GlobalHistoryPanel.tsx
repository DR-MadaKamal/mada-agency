
import React, { useEffect, useState } from 'react';
import { GlobalHistoryItem, AppView } from '../types';
import { fetchGlobalHistory } from '../lib/admin';
import { motion, AnimatePresence } from 'motion/react';
import {
    History, ImageIcon, Mic, Video, FileText, Search, Filter,
    Download, ExternalLink, Calendar, Trash2, Clock,
    Layers, Zap, Terminal, Play, Volume2, Maximize2, Trash, Rocket
} from 'lucide-react';

const STUDIO_INFO: Record<AppView, { label: string; icon: any; color: string }> = {
    home: { label: 'Home', icon: History, color: 'text-white' },
    creator_studio: { label: 'Creator', icon: Zap, color: 'text-orange-400' },
    photoshoot_director: { label: 'Photoshoot', icon: ImageIcon, color: 'text-pink-400' },
    prompt_studio: { label: 'Engineer', icon: Terminal, color: 'text-cyan-400' },
    voice_over_studio: { label: 'Voice', icon: Mic, color: 'text-purple-400' },
    campaign_studio: { label: 'Campaign', icon: Layers, color: 'text-blue-400' },
    video_studio: { label: 'Video', icon: Video, color: 'text-red-400' },
    plan_studio: { label: 'Planner', icon: FileText, color: 'text-emerald-400' },
    edit_studio: { label: 'Editor', icon: Layers, color: 'text-amber-400' },
    storyboard_studio: { label: 'Storyboard', icon: History, color: 'text-indigo-400' },
    marketing_studio: { label: 'Marketing', icon: Search, color: 'text-lime-400' },
    controller_studio: { label: 'Controller', icon: History, color: 'text-slate-400' },
    branding_studio: { label: 'Branding', icon: Layers, color: 'text-fuchsia-400' },
    prepilot_agency_suite: { label: 'PrePilot', icon: Rocket, color: 'text-blue-500' },
    admin_studio: { label: 'Control', icon: Filter, color: 'text-white' },
    archives: { label: 'Archives', icon: History, color: 'text-slate-400' },
    asset_library: { label: 'Vault', icon: Layers, color: 'text-cyan-400' },
    command_center: { label: 'Command', icon: Zap, color: 'text-amber-400' },
    calendar: { label: 'Calendar', icon: Calendar, color: 'text-sky-400' },
    pre_pilot_studio: { label: 'PrePilot', icon: Rocket, color: 'text-blue-500' },
    batch_image_studio: { label: 'Batch', icon: Layers, color: 'text-green-400' },
    bg_remover_studio: { label: 'BG Remover', icon: ImageIcon, color: 'text-violet-400' },
};

const GlobalHistoryPanel: React.FC = () => {
    const [history, setHistory] = useState<GlobalHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<AppView | 'all'>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        const data = await fetchGlobalHistory(100);
        setHistory(data);
        setIsLoading(false);
    };

    const filteredHistory = history.filter(item => {
        const matchesFilter = filter === 'all' || item.studio === filter;
        const matchesSearch = item.prompt?.toLowerCase().includes(search.toLowerCase()) || 
                             item.studio.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
                <div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-3 italic">Digital Archives</h1>
                    <p className="text-white/40 font-medium tracking-[0.4em] uppercase text-[10px]">Unified Neural Generation History & Management</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[var(--color-accent)] transition-colors" />
                        <input 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="SEARCH ENGINE RECORDS..."
                            className="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-white w-full md:w-64 focus:border-[var(--color-accent)]/50 transition-all outline-none"
                        />
                    </div>
                    <button 
                        onClick={loadHistory}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-2"
                        title="Sync History"
                    >
                        <Clock className={`w-4 h-4 text-white/40 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Sidebar Filter */}
                <aside className="lg:col-span-3 space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-4">Studio Filters</h3>
                        <div className="flex flex-col gap-1">
                            <button 
                                onClick={() => setFilter('all')}
                                className={`flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-white/5 text-white/30'}`}
                            >
                                <span className="flex items-center gap-3">
                                    <Filter className="w-4 h-4" /> All Nexus
                                </span>
                                <span className="opacity-40">{history.length}</span>
                            </button>
                            {Object.entries(STUDIO_INFO).map(([key, info]) => {
                                const count = history.filter(h => h.studio === key).length;
                                if (count === 0 && filter !== key) return null;
                                const Icon = info.icon;
                                return (
                                    <button 
                                        key={key}
                                        onClick={() => setFilter(key as AppView)}
                                        className={`flex items-center justify-between p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === key ? 'bg-white/10 text-white' : 'hover:bg-white/20 text-white/30'}`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Icon className={`w-4 h-4 ${info.color}`} /> {info.label}
                                        </span>
                                        <span className="opacity-40 text-[9px]">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Archives Feed */}
                <main className="lg:col-span-9">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <div className="w-16 h-16 border-4 border-white/5 border-t-[var(--color-accent)] rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">Synchronizing Archive Data...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6 glass-card rounded-[4rem] border border-white/5 border-dashed">
                            <Clock className="w-16 h-16 text-white/5" />
                            <div className="text-center">
                                <p className="text-white font-black uppercase tracking-widest mb-2">No records found</p>
                                <p className="text-white/30 text-[10px] font-medium tracking-widest uppercase">Start generating in the studios to build your archive</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {filteredHistory.map((item, idx) => {
                                    const info = STUDIO_INFO[item.studio] || STUDIO_INFO.creator_studio;
                                    const Icon = info.icon;
                                    
                                    return (
                                        <motion.div 
                                            key={item.id || idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group glass-card rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all overflow-hidden flex flex-col"
                                        >
                                            <div className="aspect-[4/3] relative overflow-hidden bg-white/5">
                                                {item.type === 'image' && item.content && (
                                                    <img 
                                                        src={item.content} 
                                                        alt="Archive content" 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                    />
                                                )}
                                                {item.type === 'audio' && (
                                                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-purple-500/10 to-transparent">
                                                        <Volume2 className="w-16 h-16 text-purple-400 animate-pulse" />
                                                        <div className="flex gap-1">
                                                            {Array(8).fill(0).map((_, i) => (
                                                                <div key={i} className="w-1 bg-purple-400/30 rounded-full animate-bounce" style={{ height: `${Math.random() * 20 + 5}px`, animationDelay: `${i * 0.1}s` }}></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {item.type === 'text' && (
                                                    <div className="w-full h-full p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                                                        <FileText className="w-12 h-12 text-white/20 mb-4" />
                                                        <p className="text-[10px] text-white/60 font-mono leading-relaxed line-clamp-4 italic">{item.content}</p>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                                                        <Icon className={`w-3 h-3 ${info.color}`} />
                                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">{info.label}</span>
                                                    </div>
                                                </div>
                                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-3 bg-[var(--color-accent)] rounded-2xl shadow-xl text-white hover:scale-110 transition-transform">
                                                        <Maximize2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-6 flex-grow flex flex-col">
                                                <div className="flex justify-between items-start gap-4 mb-4">
                                                   <div className="space-y-1">
                                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{formatDate(item.timestamp)} • {formatTime(item.timestamp)}</p>
                                                        <h4 className="text-xs font-bold text-white leading-tight line-clamp-2 uppercase tracking-tight">{item.prompt || 'Neuro-Synthesis Record'}</h4>
                                                   </div>
                                                </div>
                                                
                                                <div className="mt-auto flex gap-2">
                                                    <button 
                                                        onClick={() => item.prompt && navigator.clipboard.writeText(item.prompt)}
                                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-white/5 transition-all"
                                                    >
                                                        < Zap className="w-3 h-3" /> Restore Source
                                                    </button>
                                                    <button className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl text-white/20 hover:text-red-400 transition-all border border-white/5">
                                                        <Trash className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default GlobalHistoryPanel;
