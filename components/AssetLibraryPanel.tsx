
import React, { useEffect, useState } from 'react';
import { GlobalHistoryItem, AppView } from '../types';
import { fetchGlobalHistory } from '../lib/admin';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, List, Search, Filter, Download,
    Trash2, ExternalLink, RefreshCw, Layers,
    FileImage, FileVideo, Music, FileText,
    MoreVertical, Share2, Copy, Check, X
} from 'lucide-react';

const AssetLibraryPanel: React.FC = () => {
    const [assets, setAssets] = useState<GlobalHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'image' | 'audio' | 'video' | 'text' | 'uploads'>('all');
    const [studioFilter, setStudioFilter] = useState<AppView | 'all'>('all');
    const [search, setSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<GlobalHistoryItem | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setIsLoading(true);
        const data = await fetchGlobalHistory(200);
        setAssets(data);
        setIsLoading(false);
    };

    const filteredAssets = assets.filter(asset => {
        const isUpload = asset.metadata?.asset === true;
        const matchesCategory = categoryFilter === 'all' || 
                               (categoryFilter === 'uploads' ? isUpload : asset.type === categoryFilter);
        const matchesStudio = studioFilter === 'all' || asset.studio === studioFilter;
        const matchesSearch = asset.prompt?.toLowerCase().includes(search.toLowerCase()) || 
                             asset.studio.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesStudio && matchesSearch;
    });

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getAssetIcon = (type: string) => {
        switch(type) {
            case 'image': return <FileImage className="w-4 h-4" />;
            case 'audio': return <Music className="w-4 h-4" />;
            case 'video': return <FileVideo className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-12 px-4 space-y-10 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 border-b border-white/5 pb-10">
                <div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-3 italic">Vault</h1>
                    <p className="text-white/40 font-medium tracking-[0.4em] uppercase text-[10px]">Universal Asset Intelligence & Resource Manager</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button 
                        onClick={loadAssets}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                    >
                        <RefreshCw className={`w-4 h-4 text-white/40 group-hover:text-white transition-colors ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Search & Filter Bar */}
                <div className="lg:w-72 flex flex-col gap-6">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[var(--color-accent)] transition-colors" />
                            <input 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="IDENTIFY ASSET..."
                                className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[var(--color-accent)]/40 transition-all"
                            />
                        </div>

                        <div className="glass-card rounded-[2rem] p-6 border border-white/5 space-y-6">
                            <div>
                                <h3 className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-4">Resource Node</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['all', 'uploads', 'image', 'audio', 'video', 'text'] as const).map(cat => (
                                        <button 
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${categoryFilter === cat ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20' : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'}`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <div className="w-12 h-12 border-2 border-white/5 border-t-[var(--color-accent)] rounded-full animate-spin"></div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Synchronizing Records...</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                            <AnimatePresence>
                                {filteredAssets.map((asset, i) => (
                                    <motion.div
                                        key={asset.id || i}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        onClick={() => setSelectedAsset(asset)}
                                        className={viewMode === 'grid' ? 
                                            "group aspect-square glass-card rounded-[2rem] border border-white/5 overflow-hidden cursor-pointer hover:border-[var(--color-accent)]/50 transition-all relative" :
                                            "group flex items-center gap-4 p-3 glass-card rounded-2xl border border-white/5 hover:border-white/20 cursor-pointer transition-all"
                                        }
                                    >
                                        <div className={viewMode === 'grid' ? "w-full h-full" : "w-12 h-12 rounded-xl bg-white/5 flex-shrink-0"}>
                                            {asset.type === 'image' && (
                                                <img src={asset.content} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                            )}
                                            {asset.type !== 'image' && (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    {getAssetIcon(asset.type)}
                                                </div>
                                            )}
                                        </div>

                                        {viewMode === 'list' && (
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-tight truncate">{asset.studio.replace('_', ' ')}</span>
                                                    <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                                                    <span className="text-[9px] text-white/20 font-bold uppercase">{new Date(asset.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-white/40 truncate font-mono italic">{asset.prompt || 'Binary Object'}</p>
                                            </div>
                                        )}

                                        {viewMode === 'grid' && (
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <p className="text-[8px] font-black text-white uppercase tracking-widest truncate mb-1">{asset.studio.replace('_', ' ')}</p>
                                                <p className="text-[9px] text-white/40 truncate font-mono">{new Date(asset.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Expand Modal */}
            <AnimatePresence>
                {selectedAsset && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAsset(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl glass-card rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[85vh]"
                        >
                            <div className="flex-1 bg-black/40 flex items-center justify-center p-8 overflow-hidden min-h-[300px]">
                                {selectedAsset.type === 'image' && (
                                    <img src={selectedAsset.content} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black/50" alt="" />
                                )}
                                {selectedAsset.type === 'audio' && (
                                    <div className="flex flex-col items-center gap-8">
                                        <div className="w-32 h-32 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center border-4 border-[var(--color-accent)]/20 animate-pulse">
                                            <Music className="w-12 h-12 text-[var(--color-accent)]" />
                                        </div>
                                        <audio controls src={selectedAsset.content} className="w-full max-w-sm custom-audio-player" />
                                    </div>
                                )}
                                {selectedAsset.type === 'text' && (
                                    <div className="w-full max-w-lg p-10 bg-white/5 rounded-[2rem] border border-white/5 font-mono text-[11px] leading-loose text-white/70 italic suggestions-scrollbar overflow-y-auto max-h-[400px]">
                                        {selectedAsset.content}
                                    </div>
                                )}
                            </div>

                            <div className="w-full md:w-80 p-8 flex flex-col border-l border-white/5 bg-white/2 backdrop-blur-xl">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-[var(--color-accent)] uppercase tracking-widest">{selectedAsset.studio.replace('_', ' ')}</div>
                                    <button 
                                        onClick={() => setSelectedAsset(null)}
                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/30 hover:text-white"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-8 flex-grow">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Synthesis DNA</h3>
                                        <p className="text-xs text-white/80 font-bold leading-relaxed">{selectedAsset.prompt || 'No recorded instruction metadata'}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest">Metadata</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[9px] text-white/30 uppercase mb-1">Created</p>
                                                <p className="text-[10px] font-bold text-white/60">{new Date(selectedAsset.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-white/30 uppercase mb-1">Time</p>
                                                <p className="text-[10px] font-bold text-white/60">{new Date(selectedAsset.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 space-y-3">
                                    <button 
                                        onClick={() => handleCopy(selectedAsset.content)}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2 transition-all shadow-xl"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied to Clipboard' : 'Copy Resource Link'}
                                    </button>
                                    <button 
                                        className="w-full py-4 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-2xl shadow-[var(--color-accent)]/20"
                                    >
                                        <Download className="w-3 h-3" /> Download Artifact
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssetLibraryPanel;
