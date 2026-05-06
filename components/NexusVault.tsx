
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutGrid, List, Search, Filter, Download as DownloadIcon, 
    Trash2, ExternalLink, RefreshCw, Layers, 
    FileImage, FileVideo, Music, FileText, 
    MoreVertical, Share2, Copy, Check, X,
    Tag, Palette, Box, Activity, Shield,
    Sparkles, Zap, Brain, Database, Cloud,
    ArrowUpRight, Info, Eye, Star, Clock, Maximize2
} from 'lucide-react';
import { SmartAsset, AppView } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { AssetIntelligence } from '../services/assetIntelligence';

const NexusVault: React.FC = () => {
    const [assets, setAssets] = useState<SmartAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [selectedAsset, setSelectedAsset] = useState<SmartAsset | null>(null);
    const [isScanning, setIsScanning] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'vault_assets'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
            })) as SmartAsset[];
            setAssets(fetched);
            setIsLoading(false);
        });

        return () => unsub();
    }, []);

    const handleScanAsset = async (asset: SmartAsset) => {
        if (isScanning || !asset.file) return;
        setIsScanning(asset.id);
        try {
            const neuralData = await AssetIntelligence.scanAsset(asset.file);
            await AssetIntelligence.updateAssetNeuralData(asset.id, neuralData);
        } catch (err) {
            console.error("Neural analysis failed:", err);
        } finally {
            setIsScanning(null);
        }
    };

    const toggleFavorite = async (asset: SmartAsset) => {
        const docRef = doc(db, 'vault_assets', asset.id);
        await updateDoc(docRef, { isFavorite: !asset.isFavorite });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to de-materialize this asset from the Nexus?")) return;
        await deleteDoc(doc(db, 'vault_assets', id));
        if (selectedAsset?.id === id) setSelectedAsset(null);
    };

    const filteredAssets = assets.filter(asset => {
        const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter || asset.type === categoryFilter;
        const matchesSearch = 
            asset.name?.toLowerCase().includes(search.toLowerCase()) || 
            asset.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
            asset.aiDescription?.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const getAssetIcon = (type: string) => {
        switch(type) {
            case 'image': return <FileImage className="w-4 h-4" />;
            case 'audio': return <Music className="w-4 h-4" />;
            case 'video': return <FileVideo className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const categories = ['all', 'Photography', 'UI Design', 'Illustration', 'Branding', 'Marketing', 'Assets'];

    return (
        <div className="w-full h-full flex flex-col bg-black text-white overflow-hidden p-6 gap-6">
            {/* Mission Control Header */}
            <header className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 flex items-center justify-center">
                        <Database className="w-6 h-6 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Nexus Vault</h1>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded border border-emerald-500/20 uppercase">Neural Ready</span>
                        </div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Smart Repository & Asset Intelligence</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Active Assets</span>
                        <div className="flex items-center gap-2">
                             <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-[var(--color-accent)]/40 rounded-full" />)}
                             </div>
                             <span className="text-xl font-black italic">{assets.length}</span>
                        </div>
                    </div>
                    <button className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                         <Cloud className="w-5 h-5 text-white/40 group-hover:text-[var(--color-accent)] transition-colors" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Left Sidebar: Logic Nodes */}
                <div className="w-64 flex flex-col gap-6 overflow-y-auto pr-2 suggestions-scrollbar">
                    <div className="space-y-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[var(--color-accent)] transition-all" />
                            <input 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="SEMANTIC SEARCH..."
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-[var(--color-accent)]/50 transition-all placeholder:text-white/10"
                            />
                        </div>

                        <div className="glass-card rounded-3xl p-6 border border-white/5 space-y-6">
                            <div>
                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4 flex items-center justify-between">
                                    Logic Nodes
                                    <Activity className="w-3 h-3 text-emerald-500" />
                                </h3>
                                <div className="space-y-1.5">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategoryFilter(cat)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                                                categoryFilter === cat 
                                                ? 'bg-[var(--color-accent)] text-white shadow-lg' 
                                                : 'text-white/40 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest">{cat}</span>
                                            <span className={`text-[10px] font-mono ${categoryFilter === cat ? 'text-white/60' : 'text-white/10'}`}>
                                                {cat === 'all' ? assets.length : assets.filter(a => a.category === cat || a.type === cat).length}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Neural Health</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase">
                                        <span className="text-white/40 tracking-widest">Tagged</span>
                                        <span className="text-[var(--color-accent)]">{Math.round((assets.filter(a => a.tags?.length > 0).length / (assets.length || 1)) * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(assets.filter(a => a.tags?.length > 0).length / (assets.length || 1)) * 100}%` }}
                                            className="h-full bg-[var(--color-accent)]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Node Grid */}
                <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto pr-2 suggestions-scrollbar">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                         </div>
                         <div className="flex items-center gap-2">
                             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Filter:</span>
                             <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-white/60 focus:outline-none focus:border-[var(--color-accent)] transition-all">
                                <option>Most Recent</option>
                                <option>Oldest First</option>
                                <option>By Neural Score</option>
                             </select>
                         </div>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-4">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="w-10 h-10 border-2 border-white/5 border-t-[var(--color-accent)] rounded-full"
                            />
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Syncing Neural Data...</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-4 pb-20" : "flex flex-col gap-2 pb-20"}>
                            <AnimatePresence>
                                {filteredAssets.map((asset, i) => (
                                    <motion.div
                                        key={asset.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                        className={viewMode === 'grid' 
                                            ? `groups group relative aspect-square glass-card rounded-[2.5rem] border border-white/5 overflow-hidden cursor-pointer hover:border-[var(--color-accent)]/50 transition-all ${selectedAsset?.id === asset.id ? 'ring-2 ring-[var(--color-accent)] border-transparent' : ''}`
                                            : `flex items-center gap-4 p-4 glass-card rounded-2xl border border-white/5 hover:bg-white/5 transition-all cursor-pointer ${selectedAsset?.id === asset.id ? 'ring-1 ring-[var(--color-accent)] border-transparent bg-white/5' : ''}`
                                        }
                                        onClick={() => setSelectedAsset(asset)}
                                    >
                                        <div className={viewMode === 'grid' ? "w-full h-full" : "w-12 h-12 rounded-xl bg-black/40 overflow-hidden flex-shrink-0"}>
                                            {asset.type === 'image' && (
                                                <img src={asset.file.base64} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100" alt="" />
                                            )}
                                            {asset.type !== 'image' && (
                                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                                    {getAssetIcon(asset.type)}
                                                </div>
                                            )}
                                        </div>

                                        {viewMode === 'grid' && (
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-end">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{asset.category || 'Unscanned'}</span>
                                                </div>
                                                <h4 className="text-xs font-black text-white truncate italic uppercase tracking-tight">{asset.name || 'Binary Artifact'}</h4>
                                                <div className="flex gap-1 mt-3 overflow-hidden">
                                                    {asset.tags?.slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 bg-white/10 rounded text-[7px] text-white/60 font-black uppercase">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {viewMode === 'list' && (
                                            <div className="flex-1 min-w-0 flex items-center justify-between">
                                                <div className="min-w-0">
                                                     <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="text-xs font-black text-white italic uppercase tracking-tight truncate">{asset.name || 'Binary Artifact'}</h4>
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{asset.category || 'General'}</span>
                                                     </div>
                                                     <div className="flex items-center gap-3">
                                                        <span className="text-[10px] text-white/30 font-mono truncate">{asset.aiDescription || 'Neural metadata not available'}</span>
                                                     </div>
                                                </div>
                                                <div className="flex items-center gap-6 pr-4">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[8px] font-black text-white/20 uppercase mb-0.5">Synthesis Date</span>
                                                        <span className="text-[10px] font-bold text-white/40">{(asset.createdAt as Date).toLocaleDateString()}</span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); toggleFavorite(asset); }}
                                                        className={`p-2 rounded-xl transition-all ${asset.isFavorite ? 'text-amber-400 bg-amber-400/10' : 'text-white/10 hover:text-white'}`}
                                                    >
                                                        <Star className={`w-4 h-4 ${asset.isFavorite ? 'fill-current' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Status Indicators */}
                                        {!asset.tags?.length && !isScanning && asset.type === 'image' && (
                                            <div className="absolute top-4 right-4">
                                                <motion.div 
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                                />
                                            </div>
                                        )}
                                        {isScanning === asset.id && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                <div className="flex flex-col items-center gap-3">
                                                    <RefreshCw className="w-6 h-6 text-[var(--color-accent)] animate-spin" />
                                                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Analyzing DNA</span>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Right Sidebar: Neural Intel */}
                <AnimatePresence>
                    {selectedAsset && (
                        <motion.div 
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 100, opacity: 0 }}
                            className="w-96 glass-card rounded-[3rem] border border-white/5 bg-white/[0.02] overflow-hidden flex flex-col"
                        >
                            <div className="p-8 space-y-8 flex-1 overflow-y-auto suggestions-scrollbar">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[var(--color-accent)]">
                                            <Brain className="w-4 h-4" />
                                         </div>
                                         <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Neural Intel</span>
                                    </div>
                                    <button onClick={() => setSelectedAsset(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/20 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-white/10 bg-black bg-grid-pattern group relative">
                                    {selectedAsset.type === 'image' && (
                                        <img src={selectedAsset.file.base64} className="w-full h-full object-contain" alt="" />
                                    )}
                                    <button className="absolute bottom-4 right-4 p-3 bg-[var(--color-accent)] text-white rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                        <Maximize2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Database className="w-3 h-3" /> Core Identity
                                        </h3>
                                        <p className="text-lg font-black text-white tracking-tight italic uppercase mb-1">{selectedAsset.name || 'Anonymous Node'}</p>
                                        <p className="text-[11px] text-white/50 leading-relaxed italic">{selectedAsset.aiDescription || 'Pending neural scanning for semantic identification.'}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {selectedAsset.tags?.map(tag => (
                                            <div key={tag} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 group hover:border-[var(--color-accent)]/30 transition-all active:scale-95 cursor-pointer">
                                                <Tag className="w-2.5 h-2.5 text-white/20 group-hover:text-[var(--color-accent)]" />
                                                <span className="text-[9px] font-bold text-white/60 tracking-wider uppercase group-hover:text-white">{tag}</span>
                                            </div>
                                        ))}
                                        {!selectedAsset.tags?.length && (
                                            <button 
                                                onClick={() => handleScanAsset(selectedAsset)}
                                                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-3 transition-all group"
                                            >
                                                <Sparkles className="w-4 h-4 text-amber-500 group-hover:scale-125 transition-transform" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">Run Neural Scan</span>
                                            </button>
                                        )}
                                    </div>

                                    {selectedAsset.colors?.length > 0 && (
                                        <div>
                                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Palette className="w-3 h-3" /> Digital Palette
                                            </h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                {selectedAsset.colors.map(color => (
                                                    <div key={color} className="group relative">
                                                        <div className="h-12 w-full rounded-xl border border-white/10" style={{ backgroundColor: color }} />
                                                        <div className="mt-1 text-[8px] font-mono text-white/30 text-center uppercase">{color}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                         <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Nexus Source</span>
                                                <span className="text-[10px] font-black text-[var(--color-accent)] uppercase italic">{selectedAsset.studioSource.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Format</span>
                                                <span className="text-[10px] font-black text-white uppercase">{selectedAsset.dimensions ? `${selectedAsset.dimensions.width}x${selectedAsset.dimensions.height}` : 'Binary'}</span>
                                            </div>
                                         </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-white/[0.05] border-t border-white/5 flex gap-3">
                                <button className="flex-1 h-14 bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                                    <DownloadIcon className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Download Node</span>
                                </button>
                                <button 
                                    onClick={() => handleDelete(selectedAsset.id)}
                                    className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default NexusVault;
