
import React, { useEffect, useState, useMemo } from 'react';
import { UnifiedProject } from '../types';
import { fetchUnifiedProjects, batchUpdateProjects, deleteUnifiedProject } from '../lib/admin';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Folder, PieChart, Download, ExternalLink, 
    MoreVertical, Trash2, CheckCircle2, Clock, 
    AlertCircle, FileDown, Share2, Filter, 
    Search, Plus, Layout, List, ChevronDown,
    ArrowUpAz, ArrowDownAz, Calendar, 
    Zap, Tag as TagIcon, X, Check,
    Eye, MoreHorizontal, Archive,
    AlertTriangle
} from 'lucide-react';

interface ProjectHubPanelProps {
    onEngage?: (project: UnifiedProject) => void;
}

const ProjectHubPanel: React.FC<ProjectHubPanelProps> = ({ onEngage }) => {
    const [projects, setProjects] = useState<UnifiedProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'updatedAt' | 'progress'>('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    
    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    
    // Preview state
    const [previewProject, setPreviewProject] = useState<UnifiedProject | null>(null);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setIsLoading(true);
        const data = await fetchUnifiedProjects();
        setProjects(data);
        setIsLoading(false);
    };

    const sortedAndFilteredProjects = useMemo(() => {
        return projects
            .filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                                     p.studioType.toLowerCase().includes(search.toLowerCase());
                const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
                else if (sortBy === 'updatedAt') comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                else if (sortBy === 'progress') comparison = a.progress - b.progress;
                
                return sortOrder === 'asc' ? comparison : -comparison;
            });
    }, [projects, search, filterStatus, sortBy, sortOrder]);

    const handleToggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        if (!isSelectionMode) setIsSelectionMode(true);
    };

    const handleBatchArchive = async () => {
        if (selectedIds.length === 0) return;
        await batchUpdateProjects(selectedIds, { status: 'archived' });
        loadProjects();
        setSelectedIds([]);
        setIsSelectionMode(false);
    };

    const handleBatchDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} projects? This cannot be undone.`)) return;
        for (const id of selectedIds) {
            await deleteUnifiedProject(id);
        }
        loadProjects();
        setSelectedIds([]);
        setIsSelectionMode(false);
    };

    const handleExport = (project: UnifiedProject, format: 'json' | 'csv') => {
        const data = format === 'json' 
            ? JSON.stringify(project, null, 2)
            : `id,name,studio,status,progress,createdAt,updatedAt\n${project.id},${project.name},${project.studioType},${project.status},${project.progress},${project.createdAt},${project.updatedAt}`;
        
        const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}_export.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'completed': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'active': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
            case 'on_hold': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'archived': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-12 px-4 space-y-10 animate-in fade-in duration-700 relative">
            <header className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 border-b border-white/5 pb-10">
                <div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-3 italic">Nexus</h1>
                    <p className="text-white/40 font-medium tracking-[0.4em] uppercase text-[10px]">Neural Project Integrity & Lifecycle Management</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <Layout className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-3 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white/10 text-white shadow-xl' : 'text-white/30 hover:text-white/60'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    {isSelectionMode && (
                        <button 
                            onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }}
                            className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase hover:text-white transition-all"
                        >
                            Cancel selection
                        </button>
                    )}
                </div>
            </header>

            {/* Batch Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="sticky top-4 z-50 w-full glass-card p-4 rounded-[2rem] border border-[var(--color-accent)]/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6"
                    >
                        <div className="flex items-center gap-4 pl-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white font-black italic">
                                {selectedIds.length}
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural items selected for batch processing</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleBatchArchive}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[9px] font-black text-white uppercase tracking-widest transition-all"
                            >
                                <Archive className="w-3.5 h-3.5" />
                                Archive
                            </button>
                            <button 
                                onClick={handleBatchDelete}
                                className="flex items-center gap-2 px-6 py-3 bg-rose-500/20 hover:bg-rose-500 border border-rose-500/30 text-[9px] font-black text-rose-400 hover:text-white uppercase tracking-widest transition-all rounded-xl shadow-xl"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Purge
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col xl:flex-row items-center gap-4 mb-8">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[var(--color-accent)] transition-colors" />
                    <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="SCAN NEURAL RECORDS (BY NAME OR STUDIO)..."
                        className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] pl-12 pr-6 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-[var(--color-accent)]/40 transition-all placeholder:text-white/10"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    <div className="flex gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                        {['all', 'active', 'completed', 'on_hold', 'archived'].map(status => (
                            <button 
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${filterStatus === status ? 'bg-white/10 border-white/20 text-white shadow-lg' : 'bg-transparent border-transparent text-white/30 hover:text-white/60'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    
                    <div className="h-10 w-px bg-white/10 mx-2 hidden md:block" />

                    <div className="flex gap-2">
                        <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-widest text-white/60 outline-none hover:border-white/20 transition-all appearance-none cursor-pointer pr-8 relative"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'rgba(255,255,255,0.3)\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundPosition: 'right 8px center', backgroundRepeat: 'no-repeat', backgroundSize: '12px' }}
                        >
                            <option value="updatedAt">By Recency</option>
                            <option value="name">By Identity</option>
                            <option value="progress">By Integrity</option>
                        </select>
                        <button 
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all"
                        >
                            {sortOrder === 'asc' ? <ArrowUpAz className="w-4 h-4" /> : <ArrowDownAz className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <div className="w-12 h-12 border-2 border-white/5 border-t-[var(--color-accent)] rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Synchronizing Nexus Records...</p>
                </div>
            ) : sortedAndFilteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 rounded-[3.5rem] border border-dashed border-white/5 bg-white/[0.01]">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                        <Folder className="w-8 h-8 text-white/10" />
                    </div>
                    <h3 className="text-xl font-bold text-white/40 mb-2 italic">Null Sector Detected</h3>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] text-center max-w-sm px-8">No neural clusters matching your scan parameters were found in this sector of the nexus.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sortedAndFilteredProjects.map((project, i) => (
                        <motion.div 
                            key={project.id || i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className={`group glass-card rounded-[3rem] border p-8 hover:border-[var(--color-accent)]/40 transition-all relative overflow-hidden cursor-pointer ${selectedIds.includes(project.id!) ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20 shadow-[0_0_40px_rgba(var(--color-accent-rgb),0.1)]' : 'border-white/5'}`}
                            onClick={() => isSelectionMode ? handleToggleSelection(project.id!) : setPreviewProject(project)}
                        >
                            {/* Selection Overlay */}
                            <div className={`absolute top-6 left-6 z-10 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.includes(project.id!) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-white/5 border-white/10 opacity-0 group-hover:opacity-100'}`}>
                                {selectedIds.includes(project.id!) && <Check className="w-4 h-4 text-white" />}
                            </div>

                            <div className="flex justify-between items-start mb-10 pl-8">
                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${getStatusColor(project.status)}`}>
                                    {project.status}
                                </div>
                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    <button 
                                        className="p-2.5 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                        onClick={() => handleToggleSelection(project.id!)}
                                    >
                                        <CheckCircle2 className={`w-3.5 h-3.5 ${selectedIds.includes(project.id!) ? 'text-[var(--color-accent)]' : ''}`} />
                                    </button>
                                    <div className="relative group/export">
                                        <button className="p-2.5 text-white/20 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <div className="absolute right-0 top-full mt-2 w-32 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-20 shadow-[-20px_20px_60px_rgba(0,0,0,0.8)] border-b-0">
                                            <button 
                                                onClick={() => handleExport(project, 'json')}
                                                className="w-full px-5 py-4 text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5 text-left border-b border-white/10 italic"
                                            >
                                                Neural JSON
                                            </button>
                                            <button 
                                                onClick={() => handleExport(project, 'csv')}
                                                className="w-full px-5 py-4 text-[9px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5 text-left border-b border-white/10 italic"
                                            >
                                                Matrix CSV
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-10 pl-2">
                                <h3 className="text-3xl font-black text-white mb-2 tracking-tighter italic leading-none">{project.name}</h3>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-[var(--color-accent)]" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{project.studioType.replace('_', ' ')} ENGINE</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10 bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Synthesis Integrity</span>
                                    <span className="text-xl font-black text-white tracking-tighter italic">{project.progress}%</span>
                                </div>
                                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${project.progress}%` }}
                                        transition={{ duration: 1.5, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-[var(--color-accent)] via-cyan-400 to-white rounded-full shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.5)]"
                                    />
                                </div>
                                {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black text-white/20 uppercase tracking-widest">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/5 shadow-inner">
                                        <Calendar className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">Last Access</span>
                                        <span className="text-[10px] font-black text-white/40 tracking-tighter">
                                            {new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onEngage?.(project); }}
                                    className="flex items-center gap-3 group/btn hover:scale-105 transition-transform"
                                >
                                    <span className="text-[10px] font-black text-[var(--color-accent)] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">Engage</span>
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover/btn:bg-[var(--color-accent)] group-hover/btn:text-white transition-all shadow-xl">
                                        <ExternalLink className="w-4 h-4" />
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-card rounded-[3.5rem] border border-white/5 overflow-hidden bg-black/20">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/[0.03] border-b border-white/5">
                                <th className="px-8 py-8 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] w-20">
                                    <button 
                                        onClick={() => {
                                            const allIds = sortedAndFilteredProjects.map(p => p.id!);
                                            setSelectedIds(selectedIds.length === allIds.length ? [] : allIds);
                                        }}
                                        className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedIds.length === sortedAndFilteredProjects.length ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-white/20 bg-white/5'}`}
                                    >
                                        {selectedIds.length === sortedAndFilteredProjects.length && <Check className="w-3 h-3 text-white" />}
                                    </button>
                                </th>
                                <th className="px-8 py-8 text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Neural Component</th>
                                <th className="px-8 py-8 text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Engine Platform</th>
                                <th className="px-8 py-8 text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Status</th>
                                <th className="px-8 py-8 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] text-center">Integrity</th>
                                <th className="px-8 py-8 text-[10px] font-black text-white/30 uppercase tracking-[0.4em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredProjects.map((project, i) => (
                                <motion.tr 
                                    key={project.id || i} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors group relative ${selectedIds.includes(project.id!) ? 'bg-[var(--color-accent)]/5' : ''}`}
                                >
                                    <td className="px-8 py-8">
                                        <button 
                                            onClick={() => handleToggleSelection(project.id!)}
                                            className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedIds.includes(project.id!) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-white/20 bg-white/5 group-hover:border-white/40'}`}
                                        >
                                            {selectedIds.includes(project.id!) && <Check className="w-3 h-3 text-white" />}
                                        </button>
                                    </td>
                                    <td className="px-8 py-8 cursor-pointer" onClick={() => setPreviewProject(project)}>
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/10 group-hover:text-[var(--color-accent)] transition-all group-hover:border-[var(--color-accent)]/30 group-hover:scale-105 shadow-inner">
                                                <Folder className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-white mb-0.5 tracking-tight italic">{project.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-white/10" />
                                                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">Access cycle: {new Date(project.updatedAt).toLocaleTimeString()}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                            <Zap className="w-3 h-3 text-[var(--color-accent)]" />
                                            <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{project.studioType.replace('_', ' ')}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(project.status)}`}>
                                            {project.status.replace('_', ' ')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-8">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="text-[11px] font-black text-white tracking-widest italic">{project.progress}%</div>
                                            <div className="w-32 h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                <div className="h-full bg-gradient-to-r from-[var(--color-accent)] to-cyan-400 rounded-full shadow-[0_0_10px_rgba(var(--color-accent-rgb),0.3)]" style={{ width: `${project.progress}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="relative group/actions">
                                                <button className="p-3.5 text-white/20 hover:text-white transition-colors hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all z-20 shadow-[-20px_20px_60px_rgba(0,0,0,0.8)]">
                                                    <button onClick={() => setPreviewProject(project)} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5 text-left border-b border-white/5 tracking-widest">
                                                        <Eye className="w-4 h-4" /> Inspect
                                                    </button>
                                                    <button onClick={() => handleExport(project, 'json')} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5 text-left border-b border-white/5 tracking-widest">
                                                        <FileDown className="w-4 h-4" /> Export JSON
                                                    </button>
                                                    <button onClick={() => deleteUnifiedProject(project.id!).then(loadProjects)} className="w-full flex items-center gap-3 px-5 py-4 text-[10px] font-black uppercase text-rose-500/60 hover:text-rose-400 hover:bg-rose-500/10 text-left tracking-widest">
                                                        <Trash2 className="w-4 h-4" /> Purge Sector
                                                    </button>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => onEngage?.(project)}
                                                className="p-3.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all rounded-2xl shadow-lg border border-[var(--color-accent)]/20"
                                            >
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
                <StatCard 
                    label="Total Neural Domains" 
                    value={projects.length} 
                    icon={Layout} 
                    color="text-sky-400" 
                    subtext="Synchronized Active Nodes"
                />
                <StatCard 
                    label="Syntheses Optimized" 
                    value={projects.filter(p => p.status === 'completed').length} 
                    icon={CheckCircle2} 
                    color="text-emerald-400" 
                    subtext="Archived Productive Cycles"
                />
                <StatCard 
                    label="Core Overload" 
                    value={projects.filter(p => p.status === 'active').length} 
                    icon={Zap} 
                    color="text-amber-400" 
                    subtext="High Frequency Processes"
                />
                <StatCard 
                    label="System Integrity" 
                    value={projects.length ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length) + '%' : '0%'} 
                    icon={PieChart} 
                    color="text-fuchsia-400" 
                    subtext="Global Average Entropy"
                />
            </div>

            {/* Project Preview Sidebar/Modal */}
            <AnimatePresence>
                {previewProject && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPreviewProject(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-black border-l border-white/10 z-[70] shadow-[-20px_0_100px_rgba(0,0,0,0.8)] overflow-y-auto suggestions-scrollbar"
                        >
                            <div className="p-12 space-y-12">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Inspection Panel</h2>
                                    <button 
                                        onClick={() => setPreviewProject(null)}
                                        className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(previewProject.status)}`}>
                                            {previewProject.status}
                                        </div>
                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">Node Protocol 7024</span>
                                    </div>
                                    <h1 className="text-6xl font-black text-white tracking-tighter leading-[0.9] italic">{previewProject.name}</h1>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="glass-card p-6 border border-white/5 rounded-[2rem]">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Compute Platform</div>
                                        <div className="text-lg font-black text-white italic flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-[var(--color-accent)]" />
                                            {previewProject.studioType.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="glass-card p-6 border border-white/5 rounded-[2rem]">
                                        <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Global Integrity</div>
                                        <div className="text-lg font-black text-white italic">{previewProject.progress}% Optimized</div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Temporal Records</h3>
                                        <Plus className="w-4 h-4 text-white/20" />
                                    </div>
                                    <div className="space-y-4">
                                        <TimelineItem 
                                            label="Initial Nexus Creation" 
                                            date={new Date(previewProject.createdAt).toLocaleString()} 
                                            icon={Folder}
                                            active
                                        />
                                        <TimelineItem 
                                            label="Synaptic Integrity Update" 
                                            date={new Date(previewProject.updatedAt).toLocaleString()} 
                                            icon={Zap}
                                            active
                                        />
                                        <TimelineItem 
                                            label="Pending Synthesis" 
                                            date="Projection: Awaiting Input" 
                                            icon={Clock}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Neural Command</h3>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => onEngage?.(previewProject)}
                                            className="flex-1 py-5 bg-[var(--color-accent)] text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-[0_15px_30px_rgba(var(--color-accent-rgb),0.3)] hover:scale-105 transition-all"
                                        >
                                            Restore Synthesis
                                        </button>
                                        <button 
                                            onClick={() => handleExport(previewProject, 'json')}
                                            className="w-20 py-5 bg-white/5 border border-white/10 flex items-center justify-center rounded-[2.5rem] group hover:bg-white/10 transition-all"
                                        >
                                            <Download className="w-6 h-6 text-white/40 group-hover:text-white" />
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(confirm('Purge this neural domain?')) {
                                                deleteUnifiedProject(previewProject.id!).then(() => {
                                                    loadProjects();
                                                    setPreviewProject(null);
                                                });
                                            }
                                        }}
                                        className="w-full py-4 text-rose-500/40 hover:text-rose-500 text-[9px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Initiate Sector Deletion
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const TimelineItem: React.FC<{ label: string, date: string, icon: any, active?: boolean }> = ({ label, date, icon: Icon, active }) => (
    <div className={`flex gap-6 relative ${active ? 'opacity-100' : 'opacity-20'}`}>
        <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${active ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)] shadow-lg' : 'bg-white/5 border-white/10 text-white/20'}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 w-0.5 bg-white/5 mt-2 border-r border-dashed border-white/10" />
        </div>
        <div className="pt-2">
            <div className="text-[11px] font-black text-white italic tracking-tighter">{label}</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-widest">{date}</div>
        </div>
    </div>
);

const StatCard: React.FC<{ label: string, value: string | number, icon: any, color: string, subtext: string }> = ({ label, value, icon: Icon, color, subtext }) => (
    <div className="glass-card rounded-[3rem] border border-white/5 p-8 flex flex-col gap-6 group hover:border-[var(--color-accent)]/30 transition-all relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
            <div className={`p-5 rounded-3xl bg-white/5 ${color} shadow-inner border border-white/5 group-hover:scale-110 transition-transform`}>
                <Icon className="w-8 h-8" />
            </div>
            <div className={`text-4xl font-black text-white italic tracking-tighter`}>{value}</div>
        </div>
        <div className="relative z-10">
            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</div>
            <div className="text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">{subtext}</div>
        </div>
        {/* Background Visual */}
        <div className={`absolute -bottom-8 -right-8 w-32 h-32 opacity-[0.03] ${color} blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
    </div>
);

export default ProjectHubPanel;
