
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Shield, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface Suggestion {
    id: string;
    type: 'optimization' | 'security' | 'performance';
    title: string;
    desc: string;
    impact: 'high' | 'medium' | 'low';
    actionLabel: string;
}

const SmartSuggestions: React.FC = () => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([
        {
            id: '1',
            type: 'optimization',
            title: 'Neural Pipeline Latency',
            desc: 'Detecting 15% higher latency in Gemini nodes. Recommend switching to Edge-routing.',
            impact: 'high',
            actionLabel: 'Optimize Routing'
        },
        {
            id: '2',
            type: 'security',
            title: 'Orphaned User Nodes',
            desc: '5 accounts have been inactive for 60+ days. Recommend archival for nexus security.',
            impact: 'medium',
            actionLabel: 'Review Users'
        },
        {
            id: '3',
            type: 'performance',
            title: 'Asset Fragmentation',
            desc: 'Vault fragmentation detected at 12%. Rebuilding index will improve search speed by 40%.',
            impact: 'low',
            actionLabel: 'Rebuild Index'
        }
    ]);

    const [dismissed, setDismissed] = useState<string[]>([]);

    const activeSuggestions = suggestions.filter(s => !dismissed.includes(s.id));

    if (activeSuggestions.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[var(--color-accent)] animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Neural Intelligence Insights</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {activeSuggestions.map((s, idx) => (
                        <motion.div 
                            key={s.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="glass-card p-8 border border-white/5 bg-white/[0.02] rounded-[32px] group relative overflow-hidden"
                        >
                            <button 
                                onClick={() => setDismissed([...dismissed, s.id])}
                                className="absolute top-4 right-4 p-2 text-white/10 hover:text-white transition-all outline-none"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-2xl ${
                                    s.type === 'optimization' ? 'bg-sky-500/10 text-sky-500' :
                                    s.type === 'security' ? 'bg-rose-500/10 text-rose-500' :
                                    'bg-amber-500/10 text-amber-500'
                                }`}>
                                    {s.type === 'optimization' ? <Zap className="w-6 h-6" /> :
                                     s.type === 'security' ? <Shield className="w-6 h-6" /> :
                                     <AlertTriangle className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">{s.title}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                                            s.impact === 'high' ? 'text-rose-500' :
                                            s.impact === 'medium' ? 'text-amber-500' :
                                            'text-emerald-500'
                                        }`}>{s.impact} Impact</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-[11px] text-white/60 font-medium leading-relaxed mb-8 italic">
                                "{s.desc}"
                            </p>

                            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest flex items-center justify-center gap-3 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all shadow-xl">
                                {s.actionLabel}
                                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SmartSuggestions;
