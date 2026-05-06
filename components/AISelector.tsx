import React, { useState, useEffect } from 'react';
import { AIConfig, AIProvider, AIModel, AppView } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Sparkles, Zap, Brain, ShieldCheck, Cpu, CreditCard, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AISelectorProps {
    config: AIConfig;
    onChange: (config: AIConfig) => void;
    studioId: AppView;
    className?: string;
}

const AISelector: React.FC<AISelectorProps> = ({ config, onChange, studioId, className = '' }) => {
    const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'models'),
            where('status', '==', 'active')
        );

        const unsub = onSnapshot(q, (snap) => {
            const allModels = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIModel));
            const filtered = allModels.filter(m => m.studios.includes(studioId));
            setAvailableModels(filtered);
            setIsLoading(false);
        });

        return unsub;
    }, [studioId]);

    const activeModel = availableModels.find(m => m.modelId === config.modelId);
    const providers = Array.from(new Set(availableModels.map(m => m.provider))) as AIProvider[];

    const getProviderIcon = (p: AIProvider) => {
        switch(p) {
            case 'google': return Sparkles;
            case 'openai': return Brain;
            case 'anthropic': return ShieldCheck;
            default: return Cpu;
        }
    };

    if (isLoading) {
        return (
            <div className={`p-6 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center min-h-[200px] ${className}`}>
                <RefreshIcon className="w-5 h-5 text-[var(--color-accent)] animate-spin opacity-20" />
            </div>
        );
    }

    return (
        <div className={`p-5 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group ${className}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_single_pixel,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:16px_16px]" />
            </div>

            <div className="flex items-center justify-between mb-5 relative">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.1)]">
                        <Cpu className="w-4 h-4 text-[var(--color-accent)]" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Integration Hub</h3>
                        <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Neural Core v4.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10">
                    <div className="w-1 h-1 rounded-full bg-[var(--color-accent)] animate-pulse shadow-[0_0_8px_var(--color-accent)]" />
                    <span className="text-[8px] font-black text-[var(--color-accent)] uppercase tracking-tighter">Live Link</span>
                </div>
            </div>

            <div className="space-y-5 relative">
                {/* Providers */}
                {providers.length > 0 && (
                    <div>
                        <label className="text-[9px] uppercase tracking-[0.25em] text-white/20 mb-3 block font-black">Architecture</label>
                        <div className="grid grid-cols-3 gap-2">
                            {providers.map((p) => {
                                const isActive = config.provider === p;
                                const Icon = getProviderIcon(p);
                                return (
                                    <motion.button
                                        key={p}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            const firstModelOfProvider = availableModels.find(m => m.provider === p);
                                            if (firstModelOfProvider) {
                                                onChange({ provider: p, modelId: firstModelOfProvider.modelId });
                                            }
                                        }}
                                        className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300 ${
                                            isActive 
                                                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/40 text-white shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.05)]' 
                                                : 'bg-white/[0.02] border-white/[0.03] text-white/40 hover:bg-white/[0.05] hover:border-white/10'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'text-[var(--color-accent)] scale-110' : ''}`} />
                                        <span className={`text-[10px] font-bold tracking-tight uppercase ${isActive ? 'text-white' : ''}`}>{p === 'google' ? 'Google' : p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Custom'}</span>
                                        
                                        {isActive && (
                                            <motion.div 
                                                layoutId="activeProvider" 
                                                className="absolute -inset-0.5 border border-[var(--color-accent)]/50 rounded-2xl z-[-1] opacity-50"
                                                initial={false}
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Model Tiers */}
                <div>
                    <label className="text-[9px] uppercase tracking-[0.25em] text-white/20 mb-3 block font-black">Neural Processor</label>
                    <div className="grid grid-cols-1 gap-2">
                        {availableModels
                            .filter(m => m.provider === config.provider)
                            .map((m) => {
                                const isActive = config.modelId === m.modelId;
                                return (
                                    <motion.button
                                        key={m.id}
                                        whileHover={{ x: isActive ? 0 : 4 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => onChange({ ...config, modelId: m.modelId })}
                                        className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden ${
                                            isActive 
                                                ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)]/50 text-white shadow-[inset_0_0_20px_rgba(var(--color-accent-rgb),0.1)]' 
                                                : 'bg-white/[0.02] border-white/[0.03] text-white/40 hover:bg-white/[0.05] hover:border-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 flex-1 z-10">
                                            <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-[var(--color-accent)] text-white shadow-[0_0_15px_rgba(var(--color-accent-rgb),0.4)]' : 'bg-white/5 text-white/20'}`}>
                                                {m.isFree ? <Zap className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black block tracking-tight uppercase ${isActive ? 'text-white' : 'text-white/60'}`}>{m.name}</span>
                                                    {!m.isFree && <span className="text-[8px] font-black bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full">PAID</span>}
                                                </div>
                                                <span className="text-[9px] leading-tight font-medium opacity-50 block mt-0.5">{m.description}</span>
                                            </div>
                                        </div>
                                        
                                        {isActive && (
                                            <motion.div 
                                                initial={{ x: '100%' }}
                                                animate={{ x: '-100%' }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                className="absolute top-0 right-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg]"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        {availableModels.filter(m => m.provider === config.provider).length === 0 && (
                            <div className="p-4 text-center rounded-2xl bg-white/5 border border-white/5">
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">No models available for this pipeline</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.03]">
                <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-black text-white/20">Operational Status</span>
                    <span className="text-[10px] font-mono text-[var(--color-accent)] font-bold tracking-tighter italic">
                        {activeModel ? 'READY_TO_EXECUTE' : 'MODEL_NOT_FOUND'}
                    </span>
                </div>
            </div>
        </div>
    );
};

const RefreshIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
        <path d="M16 16h5v5" />
    </svg>
);

export default AISelector;
