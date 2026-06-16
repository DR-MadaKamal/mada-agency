import React, { useState, useEffect } from 'react';
import { resizeImage } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Image as ImageIcon,
    Shield,
    Settings,
    Activity,
    Globe,
    AlertTriangle,
    Cpu,
    Database,
    Zap,
    Users,
    LineChart as ChartIcon,
    Terminal,
} from 'lucide-react';
import { Integration, ApiLog } from '../types';
import { db, auth, handleFirestoreError, OperationType, collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, limit } from '../lib/firebase';

interface GlobalSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    systemConfig?: {
        activeStudios: string[];
        maintenanceMode: boolean;
        allowNewRegistrations: boolean;
    };
    onUpdateSystemConfig?: (updates: any) => Promise<void>;
}

const GlobalSettings: React.FC<GlobalSettingsProps> = ({ 
    isOpen, 
    onClose, 
    isAdmin,
    systemConfig,
    onUpdateSystemConfig
}) => {
    const [activeTab, setActiveTab] = useState<'assets' | 'governance' | 'integrations' | 'logs'>('governance');
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [logs, setLogs] = useState<ApiLog[]>([]);
    const [branding, setBranding] = useState({
        logo: '',
        primaryColor: '',
        tagline: ''
    });
    
    useEffect(() => {
        if (!isOpen || !isAdmin) return;

        const iQuery = query(collection(db, 'integrations'), orderBy('updatedAt', 'desc'), limit(10));
        const lQuery = query(collection(db, 'apiLogs'), orderBy('timestamp', 'desc'), limit(15));

        const unsubI = onSnapshot(iQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Integration));
            setIntegrations(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'integrations'));

        const unsubL = onSnapshot(lQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApiLog));
            setLogs(data);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'apiLogs'));

        const unsubB = onSnapshot(doc(db, 'system_config', 'branding'), (snap) => {
            if (snap.exists()) {
                setBranding(snap.data() as any);
            }
        });

        return () => {
            unsubI();
            unsubL();
            unsubB();
        };
    }, [isOpen, isAdmin]);

    const updateBranding = async (updates: Partial<typeof branding>) => {
        try {
            await updateDoc(doc(db, 'system_config', 'branding'), {
                ...updates,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to update branding", err);
        }
    };

    if (!isOpen) return null;

    const studios = [
        { id: 'creator_studio', label: 'Creative', icon: Zap },
        { id: 'storyboard_studio', label: 'Storyboard', icon: ChartIcon },
        { id: 'branding_studio', label: 'Branding', icon: Globe },
        { id: 'marketing_studio', label: 'Marketing', icon: Users },
        { id: 'photoshoot_director', label: 'Photoshoot', icon: ImageIcon },
        { id: 'edit_studio', label: 'Edit', icon: ScissorsIcon },
        { id: 'campaign_studio', label: 'Campaign', icon: Activity },
        { id: 'video_studio', label: 'Video', icon: PlayIcon },
        { id: 'prompt_studio', label: 'Prompt', icon: Terminal },
        { id: 'voice_over_studio', label: 'Voice Over', icon: MicIcon },
        { id: 'plan_studio', label: 'Plan', icon: Database },
        { id: 'controller_studio', label: 'Face Control', icon: Cpu },
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={onClose}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="glass-card w-full max-w-5xl rounded-[40px] overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col md:flex-row h-[85vh] max-h-[900px]"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Neural Sidebar */}
                    <div className="w-full md:w-64 bg-black/40 border-r border-white/5 p-6 flex flex-col shrink-0">
                        <div className="flex items-center gap-3 mb-10 px-2">
                            <div className="w-10 h-10 bg-[var(--color-accent)] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.4)]">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white tracking-widest uppercase">Command</h3>
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] leading-tight">Neural Core v4.0</p>
                            </div>
                        </div>

                        <nav className="space-y-1.5 flex-grow overflow-y-auto no-scrollbar">
                            <NavButton 
                                active={activeTab === 'assets'} 
                                onClick={() => setActiveTab('assets')}
                                icon={ImageIcon}
                                label="Graphic Assets"
                                sublabel="Media & Branding"
                            />
                            {isAdmin && (
                                <>
                                    <div className="pt-4 pb-2 px-4">
                                        <div className="h-[1px] bg-white/5 w-full" />
                                    </div>
                                    <NavButton 
                                        active={activeTab === 'governance'} 
                                        onClick={() => setActiveTab('governance')}
                                        icon={Settings}
                                        label="Governance"
                                        sublabel="System Logic"
                                    />
                                    <NavButton 
                                        active={activeTab === 'integrations'} 
                                        onClick={() => setActiveTab('integrations')}
                                        icon={Globe}
                                        label="Integrations"
                                        sublabel="AI Pipelines"
                                    />
                                    <NavButton 
                                        active={activeTab === 'logs'} 
                                        onClick={() => setActiveTab('logs')}
                                        icon={Terminal}
                                        label="Audit Logs"
                                        sublabel="Data Streams"
                                    />
                                </>
                            )}
                        </nav>

                        <div className="mt-10 pt-6 border-t border-white/5">
                            <div className="px-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Safety Link</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                    <p className="text-[9px] text-white/40 leading-tight font-medium uppercase tracking-tighter">
                                        Admin authentication verified.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Content Hub */}
                    <div className="flex-1 flex flex-col bg-black/20 overflow-hidden">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-white/5">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                    {activeTab === 'assets' && 'Branding Hub'}
                                    {activeTab === 'governance' && 'System Governance'}
                                    {activeTab === 'integrations' && 'AI Pipeline Hub'}
                                    {activeTab === 'logs' && 'Spectral Monitor'}
                                </h2>
                                <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.3em]">
                                    {activeTab === 'assets' && 'Managing identity nodes'}
                                    {activeTab === 'governance' && 'Infrastructure control'}
                                    {activeTab === 'integrations' && 'Active neural network connections'}
                                    {activeTab === 'logs' && 'Live event monitoring'}
                                </p>
                            </div>
                            <button onClick={onClose} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all transform hover:rotate-90">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto suggestions-scrollbar p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    {activeTab === 'assets' && (
                                        <div className="space-y-12">
                                            {/* Branding System */}
                                            {isAdmin && (
                                                <div className="p-8 rounded-[40px] bg-white/[0.02] border border-white/5">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <Globe className="w-5 h-5 text-[var(--color-accent)]" />
                                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Branding Visuals</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="space-y-2">
                                                                 <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-2">Logo Neural Link (URL)</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={branding.logo} 
                                                                    onChange={(e) => updateBranding({ logo: e.target.value })}
                                                                    className="w-full glass-input p-4 rounded-2xl text-[11px] font-bold text-white/60" 
                                                                    placeholder="https://..." 
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-2">App Tagline</label>
                                                                <input 
                                                                    type="text" 
                                                                    value={branding.tagline} 
                                                                    onChange={(e) => updateBranding({ tagline: e.target.value })}
                                                                    className="w-full glass-input p-4 rounded-2xl text-[11px] font-bold text-white/60" 
                                                                    placeholder="Neural Design Engine" 
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-3xl border border-white/5">
                                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-4">Neural Logo Preview</p>
                                                            {branding.logo ? (
                                                                <img src={branding.logo} alt="Logo Preview" className="h-16 w-auto object-contain" />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                                    <ImageIcon className="w-6 h-6 text-white/20" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'governance' && (
                                        <div className="space-y-10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <ControlCard 
                                                    title="Neural Shell Access"
                                                    desc="Global User Restriction Protocols"
                                                    icon={AlertTriangle}
                                                    active={systemConfig?.maintenanceMode || false}
                                                    onToggle={() => onUpdateSystemConfig?.({ maintenanceMode: !systemConfig?.maintenanceMode })}
                                                    theme="red"
                                                />
                                                <ControlCard 
                                                    title="Synaptic Onboarding"
                                                    desc="New Mind Profile Creation"
                                                    icon={Users}
                                                    active={systemConfig?.allowNewRegistrations || false}
                                                    onToggle={() => onUpdateSystemConfig?.({ allowNewRegistrations: !systemConfig?.allowNewRegistrations })}
                                                    theme="emerald"
                                                />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="h-[1px] flex-grow bg-white/5" />
                                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Module Deployment Status</span>
                                                    <div className="h-[1px] flex-grow bg-white/5" />
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {studios.map(studio => (
                                                        <ModuleToggle 
                                                            key={studio.id}
                                                            label={studio.label}
                                                            icon={studio.icon}
                                                            active={systemConfig?.activeStudios.includes(studio.id) || false}
                                                            onToggle={() => {
                                                                const active = systemConfig?.activeStudios || [];
                                                                const next = active.includes(studio.id) 
                                                                    ? active.filter(a => a !== studio.id)
                                                                    : [...active, studio.id];
                                                                onUpdateSystemConfig?.({ activeStudios: next });
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'integrations' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {integrations.length === 0 ? (
                                                <p className="text-white/20 text-xs font-black uppercase tracking-widest">No active AI pipelines detected.</p>
                                            ) : (
                                                integrations.map(int => (
                                                    <div key={int.id} className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-[var(--color-accent)]/30 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-4 rounded-2xl ${int.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-black text-white tracking-tight uppercase">{int.name}</h4>
                                                                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{int.provider}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2.5 h-2.5 rounded-full ${int.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]' : 'bg-red-500 shadow-[0_0_15px_#ef4444]'}`} />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'logs' && (
                                        <div className="space-y-2 font-mono">
                                            <div className="flex items-center justify-between px-6 py-3 bg-white/5 rounded-t-3xl border-x border-t border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                                <span>Timestamp</span>
                                                <span className="flex-1 px-10">Signal Event</span>
                                                <span>Status</span>
                                            </div>
                                            <div className="bg-black/40 rounded-b-3xl border border-white/5 overflow-hidden divide-y divide-white/5">
                                                {logs.map((log, i) => (
                                                    <div key={log.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors relative group">
                                                         <span className="text-[10px] text-white/20 font-bold w-24 tabular-nums">
                                                            {(log.timestamp && (log.timestamp as any).seconds) ? new Date((log.timestamp as any).seconds * 1000).toLocaleTimeString() : 'INIT'}
                                                        </span>
                                                        <div className="flex-1 flex flex-col gap-0.5">
                                                            <span className="text-[11px] text-white font-black uppercase tracking-tight">{log.service}</span>
                                                            <span className="text-[9px] text-white/20 uppercase tracking-tighter truncate max-w-sm">{log.userId || 'SYSTEM_DAEMON'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[10px] font-mono text-white/40 tabular-nums">{log.responseTime}ms</span>
                                                            <div className={`w-2 h-2 rounded-full ${log.status < 400 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                                                        </div>
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                ))}
                                                {logs.length === 0 && (
                                                    <div className="p-20 text-center text-white/10 text-xs font-black uppercase tracking-[0.3em]">
                                                        Awaiting Neural Transmissions...
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const NavButton = ({ active, onClick, icon: Icon, label, sublabel }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-[32px] transition-all duration-500 group relative ${active ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_10px_30px_rgba(0,0,0,0.2)]' : 'bg-transparent border border-transparent hover:bg-white/[0.03]'}`}
    >
        <div className={`p-3 rounded-2xl transition-all duration-500 ${active ? 'bg-[var(--color-accent)] text-white shadow-[0_10px_20px_rgba(var(--color-accent-rgb),0.3)] scale-110' : 'bg-white/5 text-white/20 group-hover:text-white/40 group-hover:scale-105'}`}>
            <Icon className="w-5 h-5 whitespace-nowrap" />
        </div>
        <div className="text-left overflow-hidden">
            <span className={`block text-[11px] font-black uppercase tracking-widest truncate ${active ? 'text-white' : 'text-white/30 group-hover:text-white/50'}`}>{label}</span>
            <span className={`block text-[8px] font-black uppercase tracking-[0.2em] mt-0.5 truncate ${active ? 'text-[var(--color-accent)]/70' : 'text-white/10 group-hover:text-white/20'}`}>{sublabel}</span>
        </div>
        {active && (
            <motion.div 
                layoutId="nav_active_indicator"
                className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[0_0_10px_var(--color-accent)]"
            />
        )}
    </button>
);

const ControlCard = ({ title, desc, icon: Icon, active, onToggle, theme }: any) => (
    <div className={`p-8 rounded-[40px] border transition-all duration-700 relative overflow-hidden group ${active 
        ? (theme === 'red' ? 'bg-red-500/10 border-red-500/30 shadow-[0_20px_50px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.1)]') 
        : 'bg-white/[0.02] border-white/5'}`}>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
                <div className={`p-5 rounded-[28px] transition-all duration-500 ${active 
                    ? (theme === 'red' ? 'bg-red-500 text-white shadow-[0_15px_40px_rgba(239,68,68,0.4)]' : 'bg-emerald-500 text-white shadow-[0_15px_40px_rgba(16,185,129,0.4)]') 
                    : 'bg-white/5 text-white/20'}`}>
                    <Icon className="w-7 h-7" />
                </div>
                <button 
                    onClick={onToggle}
                    className={`w-14 h-7 rounded-full transition-all relative ${active 
                        ? (theme === 'red' ? 'bg-red-500' : 'bg-emerald-500') 
                        : 'bg-white/10'}`}
                >
                    <motion.div 
                        animate={{ x: active ? 28 : 4 }}
                        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-xl"
                    />
                </button>
            </div>
            
            <h4 className="text-lg font-black text-white tracking-tight uppercase mb-2">{title}</h4>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black">{desc}</p>
        </div>
    </div>
);

const ModuleToggle = ({ label, icon: Icon, active, onToggle }: any) => (
    <button 
        onClick={onToggle}
        className={`p-6 rounded-[35px] border transition-all duration-500 relative group flex flex-col items-center justify-center gap-4 ${active 
            ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 shadow-[0_15px_40px_rgba(var(--color-accent-rgb),0.1)] scale-105' 
            : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
    >
        <div className={`p-4 rounded-2xl transition-all duration-500 ${active ? 'bg-[var(--color-accent)] text-white shadow-[0_10px_20px_rgba(var(--color-accent-rgb),0.3)]' : 'bg-white/5 text-white/10 group-hover:bg-white/10 group-hover:text-white/40'}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="text-center overflow-hidden w-full">
            <span className={`block text-[10px] font-black uppercase tracking-widest mb-1 truncate ${active ? 'text-white' : 'text-white/20 group-hover:text-white/40'}`}>{label}</span>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-1 h-1 rounded-full ${active ? 'bg-[var(--color-accent)] animate-pulse' : 'bg-white/10'}`} />
                <span className={`text-[8px] font-black uppercase tracking-tighter ${active ? 'text-[var(--color-accent)]' : 'text-white/10'}`}>
                    {active ? 'SYNAPSED' : 'OFFLINE'}
                </span>
            </div>
        </div>
    </button>
);

// Fallback Icons
const ScissorsIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
);
const PlayIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const MicIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
);

export default GlobalSettings;
