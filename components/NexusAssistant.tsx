import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    MessageSquare, 
    X, 
    Send, 
    Sparkles, 
    Globe, 
    Zap, 
    Brain, 
    Cpu,
    ArrowUpRight,
    Search,
    Minimize2,
    Maximize2,
    Terminal,
    Bot
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { AssistantMessage, AppView } from '../types';
import { auth, db, sanitizeData } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface NexusAssistantProps {
    currentView: AppView;
    activeProject?: any;
}

const MODELS = [
    { id: 'gemini-2.1-flash', name: 'Flash (Speed)', icon: Zap, color: 'text-amber-400', provider: 'google' },
    { id: 'gemini-2.1-flash-image', name: 'Vision (Artistic)', icon: Bot, color: 'text-blue-400', provider: 'google' },
    { id: 'gemini-1.5-pro', name: 'Pro (Reasoning)', icon: Brain, color: 'text-[var(--color-accent)]', provider: 'google' },
];

const NexusAssistant: React.FC<NexusAssistantProps> = ({ currentView, activeProject }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeModel, setActiveModel] = useState(MODELS[0]);
    const [availableModels, setAvailableModels] = useState(MODELS);
    const [isNeuralSync, setIsNeuralSync] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch custom models from Nexus Infrastructure
        const q = query(collection(db, 'models'), where('status', '==', 'active'));
        const unsub = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(doc => {
                const data = doc.data();
                return {
                    id: data.modelId,
                    name: data.name,
                    icon: Brain, // Default icon
                    color: data.provider === 'google' ? 'text-blue-400' : 'text-purple-400',
                    provider: data.provider
                };
            });
            if (fetched.length > 0) {
                // Merge with defaults
                const combined = [...MODELS];
                fetched.forEach(fm => {
                    if (!combined.find(m => m.id === fm.id)) {
                        combined.push(fm as any);
                    }
                });
                setAvailableModels(combined);
            }
        });
        return () => unsub();
    }, []);

    const getContextualPrompts = () => {
        switch(currentView) {
            case 'branding_studio': return ["Suggest color palette", "Analyze logo balance", "Generate brand voice"];
            case 'creator_studio': return ["Enhance image description", "Find matching style", "Optimize light vectors"];
            case 'marketing_studio': return ["Identify target audience", "Create hook headlines", "Competitor analysis"];
            default: return ["Research trends", "Debug flow", "Improve prompt"];
        }
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // Fetch message history from Nexus
    useEffect(() => {
        if (!auth.currentUser || !isOpen) return;

        const q = query(
            collection(db, 'assistant_sessions'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('timestamp', 'asc'),
            limit(50)
        );

        const unsub = onSnapshot(q, (snap) => {
            const fetched = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            })) as AssistantMessage[];
            
            if (fetched.length > 0) {
                setMessages(fetched);
            } else {
                // Initial greeting
                setMessages([{
                    id: 'greeting',
                    role: 'assistant',
                    content: `NEXUS_CORE initialized. I am your Neural Assistant. Welcome to the **${currentView.replace('_', ' ').toUpperCase()}**. How can I facilitate your vision today?`,
                    timestamp: new Date()
                }]);
            }
        });

        return () => unsub();
    }, [isOpen, auth.currentUser]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading || !auth.currentUser) return;

        const userMsg: AssistantMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const { IntegrationService } = await import('../services/integrationService');
            
            const systemPrompt = `You are "Nexus Core", an elite AI design architect and creative strategist. 
            Current Workspace: ${currentView.replace('_', ' ').toUpperCase()}
            Active Project Data: ${activeProject ? JSON.stringify(activeProject) : 'None'}
            Neural Sync Mode: ${isNeuralSync ? 'ON (Self-optimize and use available tools to provide a perfect solution)' : 'OFF'}
            
            Core Directives:
            - Provide professional, sophisticated creative advice.
            - When asked for colors, provide hex codes and psychological reasoning.
            - When asked for trends, use your Google Search tool for real-time accurate data.
            - Use technical terminology: Synthesis, Neural Flow, Aesthetic Vectors, Chromatic Balance.
            - Format output beautifully with markdown.
            - If Neural Sync is ON, also propose actions the user should take in this studio.`;

            let assistantContent = '';

            const provider = (activeModel.provider === 'google' ? 'gemini' : activeModel.provider) as any;
            
            const response = await IntegrationService.smartCall(provider, {
                prompt: userMsg.content,
                systemInstruction: systemPrompt,
                history: messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            });

            assistantContent = response.message || "Synthesis pulse lost via neural relay.";
            
            const assistantMsg: AssistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: assistantContent || "Synthesis pulse lost. Re-establishing link.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMsg]);

            // Save assistant response to Nexus
            await addDoc(collection(db, 'assistant_sessions'), sanitizeData({
                ...assistantMsg,
                userId: auth.currentUser.uid,
                timestamp: serverTimestamp(),
                context: currentView
            }));

        } catch (err) {
            console.error("Neural Failure:", err);
            setMessages(prev => [...prev, {
                id: 'error',
                role: 'assistant',
                content: "CRITICAL_ERROR: Synthesis failed. Check the neural bridge (API connection).",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Pulse Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-8 right-8 z-[200] w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#4F46E5] flex items-center justify-center shadow-[0_0_30px_rgba(var(--color-accent-rgb),0.5)] border border-white/20 group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <motion.div
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-white/10 rounded-full"
                    />
                    <Sparkles className="w-7 h-7 text-white" />
                </motion.button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
                        animate={{ 
                            opacity: 1, 
                            y: 0, 
                            scale: 1, 
                            filter: 'blur(0px)',
                            height: isMinimized ? '72px' : '600px',
                            width: isMinimized ? '320px' : '420px'
                        }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, filter: 'blur(10px)' }}
                        className="fixed bottom-8 right-8 z-[200] glass-card border border-white/10 rounded-[2.5rem] bg-black/80 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-white/5 bg-white/[0.02] flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[#4F46E5] flex items-center justify-center shadow-lg">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Nexus Core</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[8px] font-black text-emerald-500/80 uppercase tracking-widest">Neural Link Active</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setIsMinimized(!isMinimized)}
                                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                                    >
                                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                    </button>
                                    <button 
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 hover:bg-red-500/20 rounded-xl transition-colors text-white/40 hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {!isMinimized && (
                                <div className="space-y-3">
                                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto suggestions-scrollbar">
                                        {availableModels.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setActiveModel(m)}
                                                className={`flex-none px-4 flex items-center justify-center gap-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    activeModel.id === m.id 
                                                    ? 'bg-white/10 text-white shadow-lg' 
                                                    : 'text-white/30 hover:text-white/60'
                                                }`}
                                            >
                                                <m.icon className={`w-3 h-3 ${m.color}`} />
                                                {m.name}
                                            </button>
                                        ))}
                                    </div>

                                    <button 
                                        onClick={() => setIsNeuralSync(!isNeuralSync)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            isNeuralSync 
                                            ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 text-[var(--color-accent)]' 
                                            : 'bg-white/5 border-white/5 text-white/30 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${isNeuralSync ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5'}`}>
                                                <Zap className="w-3 h-3" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Neural Sync Engine</span>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full relative transition-all ${isNeuralSync ? 'bg-[var(--color-accent)]' : 'bg-white/10'}`}>
                                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isNeuralSync ? 'right-1' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>

                        {!isMinimized && (
                            <>
                                {/* Messages */}
                                <div 
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-6 space-y-6 suggestions-scrollbar"
                                >
                                    {messages.length === 1 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {getContextualPrompts().map((p, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setInput(p)}
                                                    className="px-3 py-1.5 bg-white/5 hover:bg-[var(--color-accent)]/20 border border-white/5 rounded-full text-[10px] text-white/60 hover:text-white transition-all"
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {messages.map((msg, i) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] group`}>
                                                <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                                                    msg.role === 'user' 
                                                    ? 'bg-[var(--color-accent)] text-white shadow-xl rounded-tr-none' 
                                                    : 'bg-white/5 text-white/80 border border-white/5 rounded-tl-none'
                                                }`}>
                                                    {msg.role === 'assistant' && (
                                                        <div className="flex items-center gap-2 mb-2 opacity-50">
                                                            <div className="w-1 h-3 bg-[var(--color-accent)] rounded-full" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Neural Synthesis</span>
                                                        </div>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    <div className={`mt-2 text-[8px] font-medium opacity-30 flex items-center gap-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {msg.role === 'assistant' && <Zap className="w-2 h-2" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 border border-white/5 p-4 rounded-3xl rounded-tl-none flex items-center gap-3">
                                                <div className="flex gap-1">
                                                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-[var(--color-accent)] rounded-full" />
                                                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-[var(--color-accent)] rounded-full" />
                                                    <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-[var(--color-accent)] rounded-full" />
                                                </div>
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Synchronizing Neural Channels...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input Area */}
                                <div className="p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
                                    <div className="flex gap-2">
                                        <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-white/40 hover:text-[var(--color-accent)] flex items-center justify-center">
                                            <Search className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 relative group">
                                            <input 
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                placeholder="Ask Nexus anything..."
                                                className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[var(--color-accent)]/50 focus:bg-white/10 transition-all pr-12"
                                            />
                                            <button 
                                                onClick={handleSendMessage}
                                                disabled={!input.trim() || isLoading}
                                                className="absolute right-2 top-2 h-8 w-8 bg-[var(--color-accent)] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all disabled:opacity-30 disabled:scale-100"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                                                <Globe className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Web Grounding</span>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                                                <Brain className="w-3 h-3 text-amber-500" />
                                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Creative Synth</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-20">
                                            <Terminal className="w-3 h-3" />
                                            <span className="text-[7px] font-black text-white uppercase tracking-widest">v3.1.Neural</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default NexusAssistant;
